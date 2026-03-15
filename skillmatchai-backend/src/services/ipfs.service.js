// ipfs.service.js — optional, skip gracefully if not configured
const logger = require('../utils/logger');

exports.uploadToIPFS = async (filePath) => {
  const apiKey    = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_KEY;

  if (!apiKey || apiKey.includes('your_pinata') || !secretKey) {
    logger.info('IPFS skipped — Pinata not configured');
    return null;
  }

  try {
    const fs       = require('fs');
    const FormData = require('form-data');
    const axios    = require('axios');

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
      headers: { ...form.getHeaders(), pinata_api_key: apiKey, pinata_secret_api_key: secretKey },
      maxContentLength: Infinity, maxBodyLength: Infinity,
    });
    logger.info('IPFS upload success:', res.data.IpfsHash);
    return res.data.IpfsHash;
  } catch (err) {
    logger.warn('IPFS upload failed:', err.message);
    return null;
  }
};
