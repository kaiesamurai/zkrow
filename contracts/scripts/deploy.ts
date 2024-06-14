import { ethers } from "hardhat";

async function main() {
  const gitHubFundManager = await ethers.deployContract("GitHubFundManager", [
    // subscription ID
    2028,
    // risc0 verifier
    "0xe0398ee733c2ef59f48a50e5cd839ed82ecb4cfe",
  ]);

  await gitHubFundManager.waitForDeployment();

  console.log(`GitHub Fund Manager is deployed to ${gitHubFundManager.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
