// src/routes/auth.routes.js
const router = require('express').Router();
const { protect }                               = require('../middleware/auth.middleware');
const { authLimiter }                           = require('../middleware/rateLimit.middleware');
const { registerValidation, loginValidation }   = require('../middleware/validate.middleware');
const authCtrl                                  = require('../controllers/auth.controller');

// Public routes
router.post('/register',               authLimiter, registerValidation, authCtrl.register);
router.post('/login',                  authLimiter, loginValidation,    authCtrl.login);
router.post('/forgot-password',        authLimiter,                     authCtrl.forgotPassword);
router.post('/reset-password/:token',  authLimiter,                     authCtrl.resetPassword);

// LinkedIn OAuth
router.get('/linkedin',          authCtrl.linkedinAuth);
router.get('/linkedin/callback', authCtrl.linkedinCallback);

// Protected routes
router.get('/me',              protect, authCtrl.getMe);
router.post('/logout',         protect, authCtrl.logout);
router.patch('/update-profile', protect, authCtrl.updateProfile);

module.exports = router;
