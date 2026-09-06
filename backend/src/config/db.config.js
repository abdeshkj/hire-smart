const mongoose = require('mongoose');
const { Pool } = require('pg');
const env = require('./env.config');

/**
 * PostgreSQL Connection Pool
 */
const pgPool = new Pool({
  connectionString: env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/hiresmart_dev',
  connectionTimeoutMillis: 3000
});

pgPool.on('error', (err) => {
  console.warn(`\n⚠️  PostgreSQL pool error: ${err.message}\n`);
});

/**
 * Test PostgreSQL Connection
 */
const testPgConnection = async () => {
  try {
    const client = await pgPool.connect();
    const res = await client.query('SELECT current_database(), version()');
    console.log(`[Database] PostgreSQL Connected to database: ${res.rows[0].current_database}`);
    client.release();
    return true;
  } catch (error) {
    console.warn(`\n⚠️  PostgreSQL not connected — running in standalone mode.`);
    console.warn(`   Reason: ${error.message}\n`);
    return false;
  }
};

/**
 * MongoDB Mongoose Connection
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000 // Quick timeout if no database is running locally
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`\n⚠️  MongoDB not connected — running in no-DB / standalone mode.`);
    console.warn(`   Reason: ${error.message}\n`);
    return null;
  }
};

module.exports = {
  pgPool,
  testPgConnection,
  connectDB
};
