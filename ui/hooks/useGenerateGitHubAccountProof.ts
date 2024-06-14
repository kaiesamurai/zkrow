import { useCallback } from "react";
import TransgateConnect from "@zkpass/transgate-js-sdk";
import Web3 from "web3";

// all hex except for publicFields
type ConnectorResult = {
    allocatorAddress: string;
    allocatorSignature: string;
    publicFields: string[];
    publicFieldsHash: string;
    taskId: string;
    uHash: string;
    validatorAddress: string;
    validatorSignature: string;
  };

export const useGenerateGitHubAccountProof = () => {
    return useCallback(async () => {
        const connector = new TransgateConnect(
          process.env.NEXT_PUBLIC_ZK_PASS_APP_ID!
        );
    
        const isAvailable = await connector.isTransgateAvailable();
    
        if (isAvailable) {
          const res = (await connector.launch(
            process.env.NEXT_PUBLIC_ZK_PASS_SCHEMA_GITHUB_PROFILE!
          )) as ConnectorResult;
    
          console.log("zkPass launch res", res);
    
          const taskIdHex = Web3.utils.stringToHex(res.taskId);
          const schemaIdHex = Web3.utils.stringToHex(
            process.env.NEXT_PUBLIC_ZK_PASS_SCHEMA_GITHUB_PROFILE!
          );
    
          // allocator signature validation
          const web3 = new Web3();
    
          const encodeParamsForAllocator = web3.eth.abi.encodeParameters(
            ["bytes32", "bytes32", "address"],
            [taskIdHex, schemaIdHex, res.validatorAddress]
          );
          const recoveredAllocatorAddress = web3.eth.accounts.recover(
            Web3.utils.soliditySha3(encodeParamsForAllocator)!,
            res.allocatorSignature
          );
    
          console.log("recoveredAllocatorAddress", recoveredAllocatorAddress);
    
          // validator signature
          const encodeParamsForValidator = web3.eth.abi.encodeParameters(
            ["bytes32", "bytes32", "bytes32", "bytes32"],
            [taskIdHex, schemaIdHex, res.uHash, res.publicFieldsHash]
          );
          const recoveredValidatorAddress = web3.eth.accounts.recover(
            Web3.utils.soliditySha3(encodeParamsForValidator)!,
            res.validatorSignature
          );
    
          console.log("recoveredValidatorAddress", recoveredValidatorAddress);

          return {
            ...res,
            ok: res.allocatorAddress === recoveredAllocatorAddress && res.validatorAddress === recoveredValidatorAddress,
          }
        } else {
          prompt("Please install TransGate");
        }
      }, []);
}