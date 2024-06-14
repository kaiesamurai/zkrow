import { ethers } from "hardhat";

async function main() {
  const gitHubFundManager = await ethers.getContractAt(
    "GitHubFundManager",
    "0x6b476e1479631d5D9802fEeF8c94BA9554d9b918"
  );

  const tx = await gitHubFundManager.sendRequest([
    "smartcontractkit/chainlink",
  ]);

  console.log("tx", tx.hash);

  await tx.wait();

  console.log("Requested to ChainLink function");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
