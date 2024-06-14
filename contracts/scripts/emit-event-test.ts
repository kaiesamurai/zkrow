import { ethers } from "hardhat";

async function main() {
  const gitHubFundManager = await ethers.getContractAt(
    "GitHubFundManager",
    "0x54E197cF51B23FA731dC24dc67EEE1C8789E9680"
  );

  const tx = await gitHubFundManager.testEmit(
    0,
    "0x00DE65653Bb0C76eaE4E51F6Fee6821dDBa13d1e"
  );

  await tx.wait();
}

// address:                         00DE65653Bb0C76eaE4E51F6Fee6821dDBa13d1e
// bytes32: 00000000000000000000000000de65653bb0c76eae4e51f6fee6821ddba13d1e

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
