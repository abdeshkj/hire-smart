const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env.config');

/**
 * Hash a plain text password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plain text password with hashed password
 * @param {string} candidatePassword - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} - True if match
 */
const comparePassword = async (candidatePassword, hashedPassword) => {
  return bcrypt.compare(candidatePassword, hashedPassword);
};

/**
 * Generate a signed JWT token
 * @param {object} payload - Data to embed in token (e.g., { id, email, role })
 * @param {string} [expiresIn] - Optional custom expiration
 * @returns {string} - Signed JWT string
 */
const generateToken = (payload, expiresIn = env.JWT_EXPIRATION) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token string
 * @returns {object} - Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
};
