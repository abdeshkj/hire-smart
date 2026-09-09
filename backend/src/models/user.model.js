const { pgPool } = require('../config/db.config');

/**
 * Insert a new user into PostgreSQL users table
 * @param {Object} userData - { email, passwordHash, role }
 * @returns {Promise<Object>} - Created user object (excluding password_hash)
 */
const createUser = async ({ email, passwordHash, role = 'freelancer' }) => {
  const query = `
    INSERT INTO users (email, password_hash, role)
    VALUES ($1, $2, $3)
    RETURNING id, email, role, created_at, updated_at;
  `;
  const values = [email.toLowerCase().trim(), passwordHash, role];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
};

/**
 * Find a user by email (includes password_hash for authentication/login check)
 * @param {string} email
 * @returns {Promise<Object|null>} - User record or null
 */
const findUserByEmail = async (email) => {
  const query = `
    SELECT * FROM users
    WHERE LOWER(email) = LOWER($1);
  `;
  const { rows } = await pgPool.query(query, [email.trim()]);
  return rows[0] || null;
};

/**
 * Find a user by ID (never selects password_hash)
 * @param {string} id - UUID
 * @returns {Promise<Object|null>} - Safe user record or null
 */
const findUserById = async (id) => {
  const query = `
    SELECT id, email, role, created_at, updated_at
    FROM users
    WHERE id = $1;
  `;
  const { rows } = await pgPool.query(query, [id]);
  return rows[0] || null;
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};
