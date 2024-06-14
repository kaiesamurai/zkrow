// Copyright 2023 RISC Zero, Inc.
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

use std::io::Read;
use risc0_zkvm::guest::{env};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Input {
    pub value: u128,
    pub contributions: Vec<InputContribution>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InputContribution {
    pub id: u64,
    pub login: String,
    pub contributions: u128
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserShare {
    pub login: String,
    pub share: u128,
}


fn main() {
    // input
    let mut input: String = String::new();
    env::stdin().read_to_string(&mut input).unwrap();

    let data: Input = serde_json::from_str(&input).unwrap();

    // process
    let total_contributions: u128 = data.contributions.iter().map(|x| x.contributions).sum();
    let shares: Vec<_> = data.contributions.iter().map(|x| {
        let share = (x.contributions * data.value) / total_contributions;

        UserShare{
            login: x.login.clone(),
            share: share
        }
    }).collect();

    // output
    let result = serde_json::to_string(&shares).unwrap();

    env::commit_slice(&result.as_bytes());
}
