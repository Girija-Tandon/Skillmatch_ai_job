// blockchain.service.js — safe lazy load, never crashes if ethers missing
const logger = require('../utils/logger');

let _contract = null;

const getContract = () => {
  if (_contract) return _contract;
  try {
    const { ethers } = require('ethers');
    const rpc     = process.env.POLYGON_RPC_URL;
    const privKey = process.env.DEPLOYER_PRIVATE_KEY;
    const addr    = process.env.CONTRACT_ADDRESS;
    if (!rpc || !privKey || !addr || addr.includes('Your')) return null;
    if (privKey.includes('your_wallet')) return null;
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet   = new ethers.Wallet(privKey, provider);
    const abi      = ['function registerCertificate(string,string,string) external',
                      'function verifyCertificate(string) external view returns(bool,string,string,uint256)'];
    _contract = new ethers.Contract(addr, abi, wallet);
    logger.info('✅ Blockchain contract connected');
    return _contract;
  } catch (e) {
    logger.warn('Blockchain not available (ethers not installed or not configured):', e.message);
    return null;
  }
};

exports.registerCertOnBlockchain = async (fileHash, userId, ipfsHash = '') => {
  const contract = getContract();
  if (!contract) {
    // Return a fake tx hash so the rest of the flow works
    logger.info('Blockchain skipped — returning mock tx hash');
    return `0xMOCK_${fileHash.slice(0, 20)}_${Date.now()}`;
  }
  try {
    const tx = await contract.registerCertificate(fileHash, userId, ipfsHash);
    await tx.wait();
    return tx.hash;
  } catch (err) {
    logger.warn('Blockchain tx failed:', err.message);
    return `0xFAILED_${Date.now()}`;
  }
};

exports.verifyCertificate = async (hash) => {
  const contract = getContract();
  if (!contract) return { isValid: false, message: 'Blockchain not configured' };
  try {
    const [exists, userId, ipfsHash, timestamp] = await contract.verifyCertificate(hash);
    return { isValid: exists, userId, ipfsHash, timestamp: Number(timestamp) };
  } catch (err) {
    logger.warn('Blockchain verify failed:', err.message);
    return { isValid: false, message: err.message };
  }
};
