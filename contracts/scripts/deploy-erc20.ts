import { ethers } from "hardhat";

const tokenName = "USD Tether";
const tokenSymbol = "USDT";
const initialHolder = "0x65d4ec89ce26763b4bea27692e5981d8cd3a58c7";
const initialSupply = ethers.parseEther("100000");

async function main() {
  const erc20Factory = await ethers.getContractAt(
    "ERC20Factory",
    "0x0d26CFf3b5732AbAB9454df1750401Cc910eCcE8"
  );

  const erc20Tx = await erc20Factory.deployToken(
    tokenName,
    tokenSymbol,
    initialHolder,
    initialSupply
  );

  console.log(`Deploying ERC20... tx=${erc20Tx.hash}`);

  const receipt = await erc20Tx.wait();

  const abi = [
    "event TokenDeployed(string name, string symbol, address tokenAddress)",
  ];
  const iface = new ethers.Interface(abi);

  for (const log of receipt?.logs ?? []) {
    try {
      const res = iface.parseLog(log);

      if (res?.args !== undefined) {
        console.log(
          `ERC20 Deployed name: ${res?.args["name"]}, symbol: ${res?.args["symbol"]}, address: ${res?.args["tokenAddress"]}`
        );
      }
    } catch (error) {}
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
