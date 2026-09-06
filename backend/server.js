const app = require('./src/app');
const env = require('./src/config/env.config');
const { connectDB, testPgConnection } = require('./src/config/db.config');

const startServer = async () => {
  // Connect to PostgreSQL and MongoDB (with graceful fallback if DB is not active)
  await testPgConnection();
  await connectDB();

  // Start HTTP listener
  const server = app.listen(env.PORT, () => {
    console.log(`[Server] HireSmart Backend running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    console.log(`[Server] Health Check available at http://localhost:${env.PORT}/api/health`);
  });

  // Graceful shutdown handling
  const handleShutdown = (signal) => {
    console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer();
