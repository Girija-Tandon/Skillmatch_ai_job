// hardhat.config.js
require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config({ path: '../skillmatchai-backend/.env' });

const PRIVATE_KEY  = process.env.DEPLOYER_PRIVATE_KEY || '0'.repeat(64);
const POLYGON_RPC  = process.env.POLYGON_RPC_URL      || 'https://rpc-mumbai.maticvigil.com';

module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // Local test network (no keys needed)
    hardhat: {},

    // Polygon Mumbai Testnet
    mumbai: {
      url:      POLYGON_RPC,
      accounts: [PRIVATE_KEY],
      chainId:  80001,
      gasPrice: 20000000000, // 20 Gwei
    },

    // Polygon Mainnet (when ready for production)
    polygon: {
      url:      'https://polygon-rpc.com',
      accounts: [PRIVATE_KEY],
      chainId:  137,
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || '',
      polygon:       process.env.POLYGONSCAN_API_KEY || '',
    },
  },
  paths: {
    sources:   './contracts',
    tests:     './test',
    cache:     './cache',
    artifacts: './artifacts',
  },
};
