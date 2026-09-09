const { hashPassword, comparePassword, generateToken } = require('../services/auth.service');
const { createUser, findUserByEmail, findUserById } = require('../models/user.model');
const ApiError = require('../utils/ApiError');

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register a new user (freelancer or client)
 */
const register = async (req, res, next) => {
  try {
    const { email, password, role = 'freelancer' } = req.body;

    // Validate required fields
    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new ApiError(400, 'Email is required');
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      throw new ApiError(400, 'Please provide a valid email address');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long');
    }

    // Role validation: public registration only allows freelancer or client
    if (!role || (role !== 'freelancer' && role !== 'client')) {
      throw new ApiError(400, "Role must be either 'freelancer' or 'client'");
    }

    // Check if email is already registered
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new ApiError(409, 'Email already registered');
    }

    // Hash password and create user in PostgreSQL
    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email: email.trim(),
      passwordHash,
      role
    });

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user with email and password
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input presence
    if (!email || typeof email !== 'string' || !email.trim() || !password || typeof password !== 'string') {
      throw new ApiError(400, 'Email and password are required');
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      throw new ApiError(400, 'Please provide a valid email address');
    }

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      // Use uniform message to avoid leaking user existence
      throw new ApiError(401, 'Invalid credentials');
    }

    // Compare passwords
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log out user
 * Note: Since this is stateless JWT (no server-side session store yet),
 * logout is handled client-side by discarding the token.
 * If refresh-token/session invalidation is added later, this endpoint
 * will need real server-side logic then.
 */
const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
