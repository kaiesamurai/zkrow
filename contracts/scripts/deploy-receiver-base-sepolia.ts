import { ethers } from "hardhat";

async function main() {
  const ccipReceiver = await ethers.deployContract("CCIPReceiverTest", [
    "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93", // router in base sepolia
  ]);
  await ccipReceiver.waitForDeployment();

  console.log(
    `CCIPReceiverTest deployed to ${ccipReceiver.target} in Sepolia chain`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
