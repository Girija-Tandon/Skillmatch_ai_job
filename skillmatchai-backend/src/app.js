const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');
const fs      = require('fs');

const authRoutes       = require('./routes/auth.routes');
const certRoutes       = require('./routes/certificate.routes');
const jobRoutes        = require('./routes/job.routes');
const skillRoutes      = require('./routes/skill.routes');
const interviewRoutes  = require('./routes/interview.routes');
const blockchainRoutes = require('./routes/blockchain.routes');
const { globalErrorHandler } = require('./utils/errorHandler');
const { apiLimiter }         = require('./middleware/rateLimit.middleware');
const logger                 = require('./utils/logger');

const app = express();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── CORS — allow all localhost ports ─────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => cb(null, true),   // allow all in dev
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/', apiLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), database: 'JSON' });
});

// ── Debug: list all users ─────────────────────────────────────────────────────
app.get('/api/debug/users', (req, res) => {
  try {
    const { db } = require('./models/database');
    const users  = db.findMany('users', { limit: 100 });
    res.json({
      total: users.length,
      users: users.map(u => ({
        id: u.id, name: u.name, email: u.email, role: u.role,
        is_active: u.is_active,
        hash_ok: u.password_hash?.startsWith('$2'),
        hash_len: u.password_hash?.length,
      })),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Debug: test login directly ────────────────────────────────────────────────
app.post('/api/debug/test-login', async (req, res) => {
  try {
    const { db }    = require('./models/database');
    const bcrypt    = require('bcryptjs');
    const { email, password } = req.body;
    const allUsers  = db.findMany('users', { limit: 999 });
    const user      = allUsers.find(u => u.email?.toLowerCase() === email?.toLowerCase());
    if (!user) return res.json({ found: false, allEmails: allUsers.map(u => u.email) });
    const match = await bcrypt.compare(password, user.password_hash || '');
    res.json({ found: true, email: user.email, hash_starts: user.password_hash?.slice(0,7), match });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/certificates', certRoutes);
app.use('/api/jobs',         jobRoutes);
app.use('/api/skills',       skillRoutes);
app.use('/api/interviews',   interviewRoutes);
app.use('/api/blockchain',   blockchainRoutes);

app.use((req, res) => res.status(404).json({ error: `Route ${req.originalUrl} not found` }));
app.use(globalErrorHandler);

module.exports = app;

// ── Multer error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large — max 10MB allowed.' });
  }
  if (err.message?.includes('Only PDF')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});
