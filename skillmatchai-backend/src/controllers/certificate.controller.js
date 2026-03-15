// src/controllers/certificate.controller.js
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');
const { db } = require('../models/database');
const { extractTextFromFile }     = require('../services/ocr.service');
const { validateCertificateWithAI, generateVerificationTest } = require('../services/ai.service');
const { uploadToIPFS }            = require('../services/ipfs.service');
const { registerCertOnBlockchain} = require('../services/blockchain.service');
const logger = require('../utils/logger');

// Safe parse helper
const safe = (val, fallback = []) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
  return fallback;
};

// ── Upload + Validate Certificate ─────────────────────────────────────────────
exports.uploadCertificate = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath     = req.file.path;
    const originalName = req.file.originalname;

    // 1. Compute file hash
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash   = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 2. Check duplicate
    const existing = db.findOneWhere('certificates', { file_hash: { _eq: fileHash } });
    if (existing && existing.user_id === req.user.id) {
      fs.unlinkSync(filePath);
      return res.status(409).json({ error: 'You have already uploaded this certificate.' });
    }

    // 3. Extract text via OCR
    let extractedText = '';
    try {
      extractedText = await extractTextFromFile(filePath, req.file.mimetype);
    } catch (ocrErr) {
      logger.warn('OCR failed, continuing:', ocrErr.message);
      extractedText = originalName;
    }

    // 4. AI Validation
    let aiResult = { isValid: false, confidence: 0, skills: [], issuer: '', courseName: '', reason: 'AI unavailable' };
    try {
      aiResult = await validateCertificateWithAI(extractedText, originalName);
    } catch (aiErr) {
      logger.warn('AI validation failed:', aiErr.message);
    }

    // 5. Upload to IPFS (optional)
    let ipfsHash = null;
    try { ipfsHash = await uploadToIPFS(filePath); } catch {}

    // 6. Determine status
    const status = aiResult.isValid
      ? (aiResult.confidence >= 80 ? 'valid' : 'needs_test')
      : 'invalid';

    // 7. Blockchain registration if valid
    let blockchainTxHash = null;
    if (status === 'valid') {
      try {
        blockchainTxHash = await registerCertOnBlockchain(fileHash, req.user.id.toString(), ipfsHash || '');
      } catch (bcErr) { logger.warn('Blockchain registration failed:', bcErr.message); }
    }

    // 8. Save to DB — pass arrays directly (no JSON.stringify)
    const cert = db.create('certificates', {
      user_id:           req.user.id,
      original_name:     originalName,
      ipfs_hash:         ipfsHash,
      file_hash:         fileHash,
      extracted_text:    extractedText.slice(0, 2000),
      ai_confidence:     aiResult.confidence || 0,
      ai_is_valid:       aiResult.isValid ? 1 : 0,
      ai_skills:         aiResult.skills || [],
      ai_issuer:         aiResult.issuer || '',
      ai_course_name:    aiResult.courseName || '',
      ai_reason:         aiResult.reason || '',
      status,
      blockchain_tx_hash: blockchainTxHash,
      created_at:        new Date().toISOString(),
    });

    // Cleanup uploaded file
    try { fs.unlinkSync(filePath); } catch {}

    const messages = {
      valid:      'Certificate validated successfully! ✅',
      needs_test: 'Certificate accepted — please take the skill test to fully verify.',
      invalid:    'Certificate could not be validated by AI.',
    };

    res.status(201).json({ message: messages[status], certificate: cert, aiResult });
  } catch (err) {
    logger.error('Upload certificate error:', err.message);
    next(err);
  }
};

// ── Get All Certificates ──────────────────────────────────────────────────────
exports.getCertificates = (req, res, next) => {
  try {
    const certs = db.findMany('certificates', {
      filter: { user_id: { _eq: req.user.id } },
      sort:   ['-created_at'],
    });
    res.json({ certificates: certs, total: certs.length });
  } catch (err) { next(err); }
};

// ── Get One Certificate ───────────────────────────────────────────────────────
exports.getCertificate = (req, res, next) => {
  try {
    const cert = db.findOne('certificates', req.params.id);
    if (!cert || cert.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    res.json({ certificate: cert });
  } catch (err) { next(err); }
};

// ── Generate Verification Test ────────────────────────────────────────────────
exports.generateTest = async (req, res, next) => {
  try {
    const cert = db.findOne('certificates', req.params.id);
    if (!cert || cert.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    if (cert.status !== 'needs_test') {
      return res.status(400).json({ error: `Test not required — certificate status is "${cert.status}"` });
    }

    let questions;
    const existing = safe(cert.test_questions);
    if (existing.length > 0) {
      questions = existing;
    } else {
      const skills = safe(cert.ai_skills);
      const testData = await generateVerificationTest(skills, cert.ai_course_name || '');
      questions = testData.questions;
      db.update('certificates', cert.id, { test_questions: questions });
    }

    // Return without correct answers
    const safe_q = questions.map(q => ({ id: q.id, question: q.question, options: q.options }));
    res.json({ questions: safe_q, totalQuestions: questions.length, passingScore: 70 });
  } catch (err) {
    logger.error('Generate test error:', err.message);
    next(err);
  }
};

// ── Submit Verification Test ──────────────────────────────────────────────────
exports.submitVerificationTest = async (req, res, next) => {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'answers array is required' });
    }

    const cert = db.findOne('certificates', req.params.id);
    if (!cert || cert.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    if (cert.status !== 'needs_test') {
      return res.status(400).json({ error: 'This certificate does not require a test' });
    }

    const questions = safe(cert.test_questions);
    if (!questions.length) {
      return res.status(400).json({ error: 'No test questions found — generate test first' });
    }

    let correct = 0;
    const results = answers.map(ans => {
      const q = questions.find(q => q.id === ans.questionId);
      if (!q) return { questionId: ans.questionId, correct: false, correctAnswer: '?' };
      const isCorrect = q.correct_answer === ans.selectedAnswer;
      if (isCorrect) correct++;
      return { questionId: ans.questionId, correct: isCorrect, correctAnswer: q.correct_answer };
    });

    const score  = Math.round((correct / questions.length) * 100);
    const passed = score >= 70;

    let blockchainTxHash = cert.blockchain_tx_hash;
    if (passed && !blockchainTxHash) {
      try {
        blockchainTxHash = await registerCertOnBlockchain(cert.file_hash, req.user.id.toString(), cert.ipfs_hash || '');
      } catch (e) { logger.warn('Blockchain failed after test pass:', e.message); }
    }

    db.update('certificates', cert.id, {
      status:             passed ? 'valid' : 'invalid',
      test_score:         score,
      blockchain_tx_hash: blockchainTxHash,
    });

    res.json({ passed, score, correct, total: questions.length, results });
  } catch (err) {
    logger.error('Submit test error:', err.message);
    next(err);
  }
};

// ── Revoke Certificate ────────────────────────────────────────────────────────
exports.revokeCertificate = (req, res, next) => {
  try {
    const cert = db.findOne('certificates', req.params.id);
    if (!cert || cert.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    db.update('certificates', cert.id, { status: 'revoked' });
    res.json({ message: 'Certificate revoked' });
  } catch (err) { next(err); }
};
