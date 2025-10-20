import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ZamaVote contract...");

  const ZamaVote = await ethers.getContractFactory("ZamaVote");
  const zamaVote = await ZamaVote.deploy();

  await zamaVote.waitForDeployment();

  const address = await zamaVote.getAddress();

  console.log(`ZamaVote deployed to: ${address}`);
  console.log("\nAdd this to your .env file:");
  console.log(`VITE_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
