const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { db } = require('../models/database');
const { hashString, randomToken } = require('../utils/hash');
const { sendEmail } = require('../services/email.service');
const logger = require('../utils/logger');

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user.id, user.role);
  res.status(statusCode).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

// ── Register ──────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, role } = req.body;
    const email    = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    logger.info(`Register: email=${email}, role=${role}`);

    // Check duplicate (case-insensitive)
    const allUsers = db.findMany('users', { limit: 9999 });
    const existing = allUsers.find(u => u.email?.toLowerCase() === email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    logger.info(`Hash created, length=${password_hash.length}, starts=${password_hash.slice(0,7)}`);

    const newUser = db.create('users', {
      name, email, password_hash, role,
      skills: [], is_active: 1,
      created_at: new Date().toISOString(),
    });

    if (!newUser || !newUser.id) throw new Error('User creation failed — DB returned null');
    logger.info(`✅ User created: id=${newUser.id}, email=${newUser.email}`);

    sendEmail({ to: email, subject: 'Welcome to SkillMatchAI!',
      html: `<h2>Welcome, ${name}!</h2><p>Your ${role} account is ready.</p>` }).catch(() => {});

    sendTokenResponse(newUser, 201, res);
  } catch (err) {
    logger.error('Register error:', err.message);
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const email    = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    logger.info(`Login attempt: email=${email}`);

    // Case-insensitive lookup
    const allUsers = db.findMany('users', { limit: 9999 });
    const user = allUsers.find(u => u.email?.toLowerCase() === email);

    if (!user) {
      logger.warn(`Login: no user for email=${email}. Total users=${allUsers.length}`);
      return res.status(401).json({
        error: `No account found for "${email}". Please register first.`,
      });
    }

    logger.info(`User found: id=${user.id}, hash_len=${user.password_hash?.length}, hash_start=${user.password_hash?.slice(0,7)}, is_active=${user.is_active}`);

    // Validate hash format
    if (!user.password_hash || !user.password_hash.startsWith('$2')) {
      logger.error(`Bad password hash for user ${user.id}: "${user.password_hash?.slice(0,20)}"`);
      return res.status(500).json({
        error: 'Account data corrupted. Please delete skillmatchai.db and register again.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    logger.info(`Password match: ${isMatch}`);

    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account deactivated.' });
    }

    logger.info(`✅ Login success: id=${user.id}`);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    logger.error('Login error:', err.message);
    next(err);
  }
};

// ── Get Me ────────────────────────────────────────────────────────────────────
exports.getMe = (req, res) => res.json({ user: req.user });

// ── Logout ────────────────────────────────────────────────────────────────────
exports.logout = (req, res) => res.json({ message: 'Logged out' });

// ── Update Profile ────────────────────────────────────────────────────────────
exports.updateProfile = (req, res, next) => {
  try {
    const { name, bio, skills } = req.body;
    const updated = db.update('users', req.user.id, {
      ...(name   != null && { name }),
      ...(bio    != null && { bio }),
      ...(skills != null && { skills }),
      updated_at: new Date().toISOString(),
    });
    res.json({ user: updated });
  } catch (err) { next(err); }
};

// ── Forgot Password ───────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const allUsers = db.findMany('users', { limit: 9999 });
    const user = allUsers.find(u => u.email?.toLowerCase() === email);
    if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' });

    const resetToken  = randomToken(32);
    const hashedToken = hashString(resetToken);
    db.update('users', user.id, {
      reset_token:   hashedToken,
      reset_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({ to: email, subject: 'SkillMatchAI — Reset Password',
      html: `<h2>Reset Password</h2><p><a href="${resetURL}">Click to reset</a> (10 min)</p>` });
    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) { next(err); }
};

// ── Reset Password ────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = hashString(req.params.token);
    const allUsers = db.findMany('users', { limit: 9999 });
    const user = allUsers.find(u => u.reset_token === hashedToken);
    if (!user || new Date(user.reset_expires) < new Date()) {
      return res.status(400).json({ error: 'Token invalid or expired.' });
    }
    const password_hash = await bcrypt.hash(req.body.password, 10);
    db.update('users', user.id, { password_hash, reset_token: null, reset_expires: null });
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

// ── LinkedIn (stub) ───────────────────────────────────────────────────────────
exports.linkedinAuth     = (req, res) => res.redirect(`${process.env.FRONTEND_URL}/login?error=linkedin_not_configured`);
exports.linkedinCallback = (req, res) => res.redirect(`${process.env.FRONTEND_URL}/login?error=linkedin_not_configured`);
