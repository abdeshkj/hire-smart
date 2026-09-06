const { verifyToken } = require('../services/auth.service');
const ApiError = require('../utils/ApiError');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication token required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ApiError(401, 'Invalid authentication header format');
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token has expired');
      }
      throw new ApiError(401, 'Invalid authentication token');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate
};
