import { ethers } from "hardhat";

const value = ethers.parseEther("0.01");

async function main() {
  const erc20 = await ethers.getContractAt(
    "ERC20",
    "0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05"
  );
  await (
    await erc20.transfer("0x85676F8ad68F0f5b76FAc585Cc90d3633dCBa381", value)
  ).wait();
  console.log("ERC20 token deposited to sender");

  const ccipSender = await ethers.getContractAt(
    "CCIPSenderTest",
    "0x85676F8ad68F0f5b76FAc585Cc90d3633dCBa381"
  );

  const tx = await ccipSender.sendMessagePayNative(
    "10344971235874465080", // base sepolia
    "0x6f0609f6a920101Faf5A64F6F69BDcf5d4470eC6",
    "hello",
    "0xfd57b4ddbf88a4e07ff4e34c487b99af2fe82a05",
    value,
    {
      value: ethers.parseEther("0.001"),
    }
  );

  console.log("sending message...tx: ", tx.hash);

  await tx.wait();

  console.log("done");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
