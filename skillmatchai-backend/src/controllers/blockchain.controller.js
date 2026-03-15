// src/controllers/blockchain.controller.js
const { verifyCertOnBlockchain } = require('../services/blockchain.service');
const { db }                     = require('../models/database');
const logger                     = require('../utils/logger');

// ── Verify Certificate by Hash (Public) ──────────────────────────────────────
exports.verifyCertificate = async (req, res, next) => {
  try {
    const { hash } = req.params;

    if (!hash || hash.length < 10) {
      return res.status(400).json({ error: 'Invalid certificate hash' });
    }

    // Check blockchain
    const blockchainResult = await verifyCertOnBlockchain(hash);

    // Also get DB metadata for richer response
    const cert = await db.findOneWhere('certificates', { file_hash: { _eq: hash } }, [
      'ai_course_name', 'ai_issuer', 'ai_skills', 'status', 'created_at',
    ]);

    res.json({
      hash,
      isValid:    blockchainResult.isValid,
      timestamp:  blockchainResult.timestamp,
      date:       blockchainResult.date,
      userId:     blockchainResult.userId,
      ipfsHash:   blockchainResult.ipfsHash,
      certDetails: cert ? {
        courseName: cert.ai_course_name,
        issuer:     cert.ai_issuer,
        skills:     cert.ai_skills,
        status:     cert.status,
        registeredAt: cert.created_at,
      } : null,
    });
  } catch (err) {
    logger.error('Blockchain verify error:', err);
    // Don't fail — return unverified status
    res.json({ hash: req.params.hash, isValid: false, error: 'Could not connect to blockchain' });
  }
};

// ── Get All On-Chain Certs for Current User ───────────────────────────────────
exports.getMyCertificatesOnChain = async (req, res, next) => {
  try {
    const certs = await db.findMany('certificates', {
      filter: {
        user_id:            { _eq: req.user.id },
        blockchain_tx_hash: { _nnull: true },
      },
      fields: ['id', 'ai_course_name', 'ai_issuer', 'file_hash', 'blockchain_tx_hash', 'created_at'],
    });
    res.json({ certificates: certs, total: certs.length });
  } catch (err) {
    next(err);
  }
};
