import { ethers } from "hardhat";

async function main() {
  const risc0Test = await ethers.deployContract("Risc0Test", [
    // verifier address
    "0xe0398ee733c2ef59f48a50e5cd839ed82ecb4cfe",
  ]);

  await risc0Test.waitForDeployment();

  console.log(`Risc0Test is deployed to ${risc0Test.target}`);

  // 0x211ae1270599602542dE1a9338bBC2d1fd598cdB
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
