// server.js — Entry Point
require('dotenv').config();
const logger = require('./src/utils/logger');
const { initDB } = require('./src/models/database');

// Start everything async so we can await the database
const start = async () => {
  try {
    // 1. Initialize SQLite database first
    await initDB();
    logger.info('✅ Database ready');

    // 2. Now load and start Express app
    const app  = require('./src/app');
    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
      logger.info(`📋 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`👥 Debug users: http://localhost:${PORT}/api/debug/users`);
    });

    // Handle shutdown gracefully
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down...');
      server.close(() => process.exit(0));
    });

  } catch (err) {
    logger.error('Failed to start server:', err.message);
    logger.error(err.stack);
    process.exit(1);
  }
};

start();
