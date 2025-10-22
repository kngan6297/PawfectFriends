import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import logger from './logger.js';

const { JWT_SECRET, JWT_EXPIRES_IN } = config.jwt;

if (!JWT_SECRET) {
  logger.error('JWT_SECRET is not set in environment variables');
  throw new Error('JWT_SECRET is required');
}

/**
 * Generate a JWT token for a user
 * @param {string} userId - The user's ID
 * @returns {string} The generated JWT token
 */
export const generateToken = (userId) => {
  try {
    const token = jwt.sign({ id: userId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
    logger.info(`Token generated for user ${userId}`);
    logger.info('Token payload:', jwt.decode(token));
    return token;
  } catch (error) {
    logger.error('Error generating token:', error);
    throw new Error('Failed to generate token');
  }
};

/**
 * Verify a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {Object} The decoded token payload
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.info('JWT decoded:', decoded);
    return decoded;
  } catch (error) {
    logger.error('Token verification failed:', error);
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};
