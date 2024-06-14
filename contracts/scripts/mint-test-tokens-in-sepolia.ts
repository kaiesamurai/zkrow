import { ethers } from "hardhat";

const CCIPBnMToken = "0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05";
const CCIPLnMToken = "0x466D489b6d36E7E3b824ef491C225F5830E81cC1";
const CCIPUSDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

async function main() {
  const [signer] = await ethers.getSigners();

  for (let i = 0; i < 100; i++) {
    const tokenContract = new ethers.Contract(
      CCIPBnMToken,
      ["function drip(address to)"],
      signer
    );

    const tx = await tokenContract.drip(signer.address);
    console.log("dripping...", i, tx.hash);
    await tx.wait();
  }

  for (let i = 100; i < 200; i++) {
    const tokenContract = new ethers.Contract(
      CCIPLnMToken,
      ["function drip(address to)"],
      signer
    );

    const tx = await tokenContract.drip(signer.address);
    console.log("dripping...", i, tx.hash);
    await tx.wait();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
