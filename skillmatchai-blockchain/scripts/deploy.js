// scripts/deploy.js — Smart Contract Deployment Script
const { ethers } = require('hardhat');
const fs         = require('fs');
const path       = require('path');

async function main() {
  console.log('🚀 Deploying CertificateRegistry to', network.name, '...\n');

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const balance    = await deployer.provider.getBalance(deployer.address);

  console.log('📋 Deployment Details:');
  console.log('   Deployer address:', deployer.address);
  console.log('   Account balance: ', ethers.formatEther(balance), 'MATIC');

  if (balance === 0n) {
    console.error('\n❌ Insufficient balance! Get free MATIC from:');
    console.error('   https://faucet.polygon.technology/');
    process.exit(1);
  }

  // Deploy contract
  console.log('\n⏳ Deploying CertificateRegistry...');
  const CertificateRegistry = await ethers.getContractFactory('CertificateRegistry');
  const contract            = await CertificateRegistry.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deployTx        = contract.deploymentTransaction();

  console.log('\n✅ CertificateRegistry deployed successfully!');
  console.log('   Contract address: ', contractAddress);
  console.log('   Transaction hash: ', deployTx?.hash);
  console.log('   Block number:     ', deployTx?.blockNumber || 'pending');

  // Verify on PolygonScan (if on testnet/mainnet)
  if (network.name !== 'hardhat' && network.name !== 'localhost') {
    console.log('\n🔍 Verify on PolygonScan:');
    console.log(`   https://mumbai.polygonscan.com/address/${contractAddress}`);
  }

  // Save deployment info
  const deploymentInfo = {
    network:         network.name,
    contractAddress,
    deployerAddress: deployer.address,
    txHash:          deployTx?.hash,
    timestamp:       new Date().toISOString(),
  };

  const deploymentPath = path.join(__dirname, '../deployments.json');
  let deployments = {};
  if (fs.existsSync(deploymentPath)) {
    deployments = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  }
  deployments[network.name] = deploymentInfo;
  fs.writeFileSync(deploymentPath, JSON.stringify(deployments, null, 2));

  console.log('\n📝 IMPORTANT: Add this to your backend .env file:');
  console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  console.log('\n📝 Add this to your frontend .env file:');
  console.log(`   VITE_CONTRACT_ADDRESS=${contractAddress}`);

  // Run a quick test
  console.log('\n🧪 Running quick smoke test...');
  const [isValid] = await contract.verifyCertificate('a'.repeat(64));
  console.log('   verifyCertificate() works:', !isValid ? '✅' : '❌ (should be false for unregistered)');
  const [reg, rev, act] = await contract.getStats();
  console.log(`   getStats(): registered=${reg}, revoked=${rev}, active=${act} ✅`);

  console.log('\n🎉 Deployment complete!\n');
}

main().catch(err => {
  console.error('\n❌ Deployment failed:', err);
  process.exit(1);
});
