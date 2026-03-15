const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const os     = require('os');

// Use OS temp dir to avoid Windows path issues with relative paths
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `cert-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf','image/jpeg','image/jpg','image/png','image/webp'];
  // Some browsers send different mimetypes — also check extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = ['.pdf','.jpg','.jpeg','.png','.webp'];
  if (allowed.includes(file.mimetype) || allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, PNG, WEBP files allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = { upload };
