// ocr.service.js — safe lazy load, never crashes if tesseract/pdf-parse missing
const fs     = require('fs');
const path   = require('path');
const logger = require('../utils/logger');

exports.extractTextFromFile = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    logger.warn('OCR: file not found:', filePath);
    return path.basename(filePath);
  }

  const ext = path.extname(filePath).toLowerCase();

  // Try PDF extraction
  if (ext === '.pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const buffer   = fs.readFileSync(filePath);
      const data     = await pdfParse(buffer);
      logger.info(`PDF OCR: extracted ${data.text.length} chars`);
      return data.text || '';
    } catch (err) {
      logger.warn('pdf-parse failed:', err.message);
    }
  }

  // Try image OCR with tesseract
  if (['.jpg','.jpeg','.png','.webp'].includes(ext)) {
    try {
      const Tesseract = require('tesseract.js');
      const { data }  = await Tesseract.recognize(filePath, 'eng');
      logger.info(`Image OCR: extracted ${data.text.length} chars`);
      return data.text || '';
    } catch (err) {
      logger.warn('tesseract failed:', err.message);
    }
  }

  // Fallback — use filename as text for AI to analyse
  const name = path.basename(filePath, ext).replace(/[-_]/g, ' ');
  logger.info('OCR fallback: using filename as text:', name);
  return `Certificate: ${name}`;
};
