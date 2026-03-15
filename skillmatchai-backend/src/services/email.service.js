// email.service.js — optional, skip gracefully if not configured
const logger = require('../utils/logger');

exports.sendEmail = async ({ to, subject, html }) => {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;

  if (!host || !user || user.includes('your_gmail')) {
    logger.info(`Email skipped (not configured): "${subject}" to ${to}`);
    return { skipped: true };
  }

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter({
      host, port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: { user, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({ from: user, to, subject, html });
    logger.info(`Email sent: "${subject}" to ${to}`);
    return { sent: true };
  } catch (err) {
    logger.warn('Email failed:', err.message);
    return { error: err.message };
  }
};
