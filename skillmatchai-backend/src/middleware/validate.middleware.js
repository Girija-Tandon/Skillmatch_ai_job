const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error:   errors.array()[0].msg,
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name too short'),
  body('email').trim().isEmail().withMessage('Valid email required'),
  // NO normalizeEmail() — it causes issues with some addresses
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['jobseeker','recruiter','pwd_candidate']).withMessage('Invalid role'),
  handleValidation,
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

const jobValidation = [
  body('title').trim().notEmpty().withMessage('Job title is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description too short'),
  body('required_skills').isArray({ min: 1 }).withMessage('At least one skill required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  handleValidation,
];

const interviewValidation = [
  body('targetRole').trim().notEmpty().withMessage('Target role is required'),
  handleValidation,
];

module.exports = { registerValidation, loginValidation, jobValidation, interviewValidation, handleValidation };
