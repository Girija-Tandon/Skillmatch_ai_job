// src/utils/hash.js — Hashing Utilities
const crypto = require('crypto');
const fs     = require('fs');

// SHA-256 hash of a file (for blockchain registration)
const hashFile = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

// SHA-256 hash of a string
const hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

// Generate random token (for password reset etc.)
const randomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

module.exports = { hashFile, hashString, randomToken };
