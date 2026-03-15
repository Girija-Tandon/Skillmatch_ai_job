// src/middleware/rateLimit.middleware.js
const rateLimit = require('express-rate-limit');

// In development: essentially unlimited. In production: strict.
const DEV = process.env.NODE_ENV !== 'production';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: DEV ? 99999 : 200,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: DEV ? 99999 : 20,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

// AI limiter — completely disabled in development
const aiLimiter = DEV
  ? (req, res, next) => next()   // no-op middleware in dev
  : rateLimit({
      windowMs: 60 * 1000,
      max: 10,
      standardHeaders: true, legacyHeaders: false,
      message: { error: 'Too many AI requests. Please wait a moment.' },
    });

module.exports = { apiLimiter, authLimiter, aiLimiter };
