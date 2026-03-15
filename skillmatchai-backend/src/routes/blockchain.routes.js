// src/routes/blockchain.routes.js
const router      = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const bcCtrl      = require('../controllers/blockchain.controller');

// Public — anyone can verify a certificate hash
router.get('/verify/:hash', bcCtrl.verifyCertificate);

// Protected
router.use(protect);
router.get('/my-certs',     bcCtrl.getMyCertificatesOnChain);

module.exports = router;
