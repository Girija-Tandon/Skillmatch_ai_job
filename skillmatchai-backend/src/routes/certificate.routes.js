// src/routes/certificate.routes.js
const router    = require('express').Router();
const { protect }    = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { upload }     = require('../middleware/upload.middleware');
const { aiLimiter }  = require('../middleware/rateLimit.middleware');
const certCtrl       = require('../controllers/certificate.controller');

router.use(protect); // All certificate routes require auth

router.post('/',
  upload.single('certificate'),
  aiLimiter,
  certCtrl.uploadCertificate
);

router.get('/',         certCtrl.getCertificates);
router.get('/:id',      certCtrl.getCertificate);

router.post('/:id/verify-test',
  aiLimiter,
  certCtrl.submitVerificationTest
);

router.get('/:id/generate-test',
  aiLimiter,
  certCtrl.generateTest
);

router.patch('/:id/revoke',
  restrictTo('admin'),
  certCtrl.revokeCertificate
);

module.exports = router;
