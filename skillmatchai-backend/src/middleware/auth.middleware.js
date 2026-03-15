// src/middleware/auth.middleware.js — JWT Verification
const jwt    = require('jsonwebtoken');
const { db } = require('../models/database');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    // 1. Get token
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ error: 'Not authorized — please log in first.' });
    }

    // 2. Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Session expired — please log in again.' });
      }
      return res.status(401).json({ error: 'Invalid token — please log in again.' });
    }

    // 3. Check user still exists in SQLite
    const user = db.findOne('users', decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Account not found.' });
    }

    // 4. Check active (SQLite stores 0/1)
    const isActive = user.is_active === 1 || user.is_active === true;
    if (!isActive) {
      return res.status(401).json({ error: 'Your account has been deactivated.' });
    }

    // 5. Attach user to request
    req.user = user;
    next();
  } catch (err) {
    logger.error('Auth middleware error:', err.message);
    next(err);
  }
};

module.exports = { protect };
