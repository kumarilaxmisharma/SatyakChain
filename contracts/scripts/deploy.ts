import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying CertiChain contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy CertiChain
  const CertiChain = await ethers.getContractFactory("CertiChain");
  const certichain = await CertiChain.deploy();
  
  await certichain.waitForDeployment();
  const address = await certichain.getAddress();

  console.log("✅ CertiChain deployed to:", address);
  console.log("\n📝 Next steps:");
  console.log(`   1. Verify contract: npx hardhat verify --network sepolia ${address}`);
  console.log("   2. Update CONTRACT_ADDRESS in backend/.env");
  console.log("   3. Update NEXT_PUBLIC_CONTRACT_ADDRESS in frontend/.env.local\n");

  // Log deployment info
  console.log("📋 Deployment Summary:");
  console.log("   - Network:", (await ethers.provider.getNetwork()).name);
  console.log("   - Contract:", address);
  console.log("   - Deployer:", deployer.address);
  console.log("   - Admin Role: Granted to deployer");
  console.log("   - Issuer Role: Granted to deployer");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
