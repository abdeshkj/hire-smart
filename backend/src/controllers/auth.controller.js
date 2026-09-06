const register = async (req, res, next) => {
  try {
    res.status(501).json({
      success: false,
      message: 'Register endpoint is not implemented yet'
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    res.status(501).json({
      success: false,
      message: 'Login endpoint is not implemented yet'
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.status(501).json({
      success: false,
      message: 'GetMe endpoint is not implemented yet',
      user: req.user || null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
