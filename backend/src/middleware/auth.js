import { User } from '../modules/user/user.model.js';
import { ApiError } from '../utils/errors.js';
import { verifyToken, verifyRefresh } from '../utils/jwt.js';

/**
 * Authentication and Authorization Middleware
 * This file contains all authentication and authorization related middleware functions
 */

/**
 * Middleware to authenticate users using JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    // Verify token
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    // Check if user is active (bypass for admin users)
    if (!user.emailVerified && user.role !== 'admin') {
      throw ApiError.unauthorized('User account is not verified');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(ApiError.unauthorized('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(ApiError.unauthorized('Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to verify refresh token
 */
export const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      throw ApiError.unauthorized('No refresh token provided');
    }

    const decoded = verifyRefresh(refreshToken);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(ApiError.unauthorized('Invalid refresh token'));
    } else if (error.name === 'TokenExpiredError') {
      next(ApiError.unauthorized('Refresh token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to check user roles
 * @param {string[]} roles - Array of allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    next();
  };
};
