// Copyright 2024 RISC Zero, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This application demonstrates how to send an off-chain proof request
// to the Bonsai proving service and publish the received proofs directly
// to your deployed app contract.

use alloy_primitives::{U256};
use alloy_sol_types::{sol, SolInterface};
use apps::{BonsaiProver, TxSender};
use methods::IS_EVEN_ELF;
use serde::{Serialize, Deserialize};
use serde_json;
use axum::{
    routing::{get, post},
    extract::State,
    Json, Router,
};
use std::{future::IntoFuture, sync::mpsc::{channel, Sender}, thread};
use tower_http::cors::Any;

// `IFundManager` interface automatically generated via the alloy `sol!` macro.
sol! {
    interface IFundManager {
        function distributeFund(uint256 fund_id, string[] logins, uint256[] shares, bytes journal, bytes32 postStateDigest, bytes seal);
    }
}

#[derive(Deserialize, Debug)]
struct Config {
    chain_id: u64,
    wallet_private_key: String,
    rpc_url: String,
    contract: String,
    port: u64,
}

#[derive(Debug, Clone)]
struct ServerConfig {
    request_sender: Sender<CalculateRequest>,
}

// static JSON_EXAMPLE: &str = r#"{
//     "fund_id": 0,
//     "value": 1000000000000000000,
//     "contributions": [{"id":573827,"login":"se3000","contributions":2675},{"id":344071,"login":"j16r","contributions":2165},{"id":635121,"login":"dimroc","contributions":1581},{"id":680789,"login":"rupurt","contributions":1497},{"id":4147639,"login":"samsondav","contributions":1275},{"id":14809513,"login":"RyanRHall","contributions":1115},{"id":6404866,"login":"HenryNguyen5","contributions":771},{"id":1194128,"login":"jmank88","contributions":749},{"id":70152,"login":"coventry","contributions":613},{"id":6523673,"login":"alexroan","contributions":558},{"id":96362174,"login":"chainchad","contributions":504},{"id":10747945,"login":"thodges-gh","contributions":488},{"id":24452339,"login":"spooktheducks","contributions":462},{"id":27856297,"login":"dependabot-preview[bot]","contributions":447},{"id":71980293,"login":"infiloop2","contributions":427},{"id":5782319,"login":"connorwstein","contributions":373},{"id":61834,"login":"jkongie","contributions":358},{"id":1372918,"login":"archseer","contributions":351},{"id":53467295,"login":"felder-cl","contributions":237},{"id":49699333,"login":"dependabot[bot]","contributions":233},{"id":6235999,"login":"PiotrTrzpil","contributions":227},{"id":53539231,"login":"typescribe","contributions":220},{"id":32734780,"login":"hellobart","contributions":220},{"id":40662484,"login":"NavyAdmiral","contributions":192},{"id":1416262,"login":"bolekk","contributions":189},{"id":4341712,"login":"tyrion70","contributions":159},{"id":18550384,"login":"cedric-cordenier","contributions":155},{"id":10038988,"login":"kalverra","contributions":151},{"id":6530589,"login":"makramkd","contributions":147},{"id":10238396,"login":"tateexon","contributions":143}]
// }"#;

// Request
#[derive(Debug, Serialize, Deserialize)]
struct CalculateRequest {
    fund_id: u64,
    value: u128,
    contributions: Vec<Contribution>
}

#[derive(Debug, Serialize, Deserialize)]
struct Contribution {
    id: u64,
    login: String,
    contributions: u128
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserShare {
    pub login: String,
    pub share: u128,
}

#[tokio::main(flavor = "multi_thread")]
async fn main() {
    env_logger::init();

    let config = envy::from_env::<Config>().unwrap();

    println!("env: {:?}", config);

    let (request_sender, request_receiver) = channel::<CalculateRequest>();

    let server_config: ServerConfig = ServerConfig {
        request_sender: request_sender,
    };
    println!("server_config: {:?}", server_config);

    let app = Router::new()
    .route("/", get(root))
    .route("/calculate", post(calculate_shares))
    .layer(
        tower_http::cors::CorsLayer::new()
          .allow_origin("http://localhost:3000".parse::<axum::http::HeaderValue>().unwrap())
          .allow_headers(Any)
          .allow_methods(Any),
      )
    .with_state(server_config);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.port.to_string())).await.unwrap();

    let api_handle = tokio::spawn(
        async move {
            axum::serve(listener, app).await.unwrap();
        }
    );

    let chain_id = config.chain_id;
    let rpc_url = config.rpc_url.clone();
    let wallet_private_key = config.wallet_private_key.clone();
    let contract = config.contract.clone();

    thread::spawn(move || {
        while let Ok(request) = request_receiver.recv() {
            println!("start proving: {:?}", request);

            // Prove
            // Send an off-chain proof request to the Bonsai proving service.
            let (journal, post_state_digest, seal) = BonsaiProver::prove(IS_EVEN_ELF, serde_json::to_string(&request).unwrap().as_bytes()).unwrap();

            println!("journal: {:?}", journal);

            // Decode the journal. Must match what was written in the guest with
            let decoded = std::str::from_utf8(&journal).unwrap();

            println!("decoded: {:?}", decoded);

            let shares: Vec<UserShare> = serde_json::from_str(decoded).unwrap();

            println!("shares: {:?}", shares);

            // Send transaction
            // Encode the function call for `IEvenNumber.set(x)`.
            let calldata = IFundManager::IFundManagerCalls::distributeFund(IFundManager::distributeFundCall {
                fund_id: U256::from(0x0),
                logins: shares.iter().map(|x| x.login.clone()).collect(),
                shares: shares.iter().map(|x| U256::from(x.share)).collect(),
                journal: journal,
                postStateDigest: post_state_digest,
                seal: seal,
            })
            .abi_encode();

            println!("calldata: {:?}", calldata);

            // Create a new `TxSender`.
            let tx_sender = TxSender::new(
                chain_id,
                &rpc_url,
                &wallet_private_key,
                &contract,
            ).unwrap();

            // Send the calldata to Ethereum.
            let runtime = tokio::runtime::Runtime::new().unwrap();
            let tx_output = runtime.block_on(tx_sender.send(calldata)).unwrap();

            println!("tx output: {:?}", tx_output);
        }
    });

    api_handle.into_future().await.unwrap();
}

async fn root() -> &'static str {
    "Hello, World!"
}

async fn calculate_shares(
    State(server_config): State<ServerConfig>,
    Json(payload): Json<CalculateRequest>,
) -> &'static str  {
    println!("handle request: config={:?}, payload={:?}", server_config, payload);

    server_config.request_sender.send(payload).unwrap();

    "ok"
}
