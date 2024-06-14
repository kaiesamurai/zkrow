import { ethers } from "hardhat";

async function main() {
  const ccipSender = await ethers.deployContract("CCIPSenderTest", [
    "0x779877A7B0D9E8603169DdbD7836e478b4624789", // link token
    "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59", // router in sepolia
  ]);
  await ccipSender.waitForDeployment();

  console.log(
    `CCIPSenderTest deployed to ${ccipSender.target} in Sepolia chain`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
