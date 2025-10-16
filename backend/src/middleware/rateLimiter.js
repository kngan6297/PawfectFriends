import { rateLimit as expressRateLimit } from 'express-rate-limit';

// Rate limiting configuration from environment variables
const RATE_LIMIT_WINDOW_MS =
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes default
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 1000; // 1000 requests default

// General API rate limiter - configurable via environment variables
export const apiLimiter = expressRateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: {
    success: false,
    error: `Too many requests from this IP, please try again after ${Math.round(RATE_LIMIT_WINDOW_MS / 60000)} minutes`,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Recommendation-specific rate limiter - increased for development
export const recommendationLimiter = expressRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // Increased limit for development
  message: {
    success: false,
    error: 'Too many recommendation requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints limiter - increased for development
export const authLimiter = expressRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Increased limit for development
  message: {
    success: false,
    error: 'Too many login attempts, please try again after an hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Adoption requests limiter - increased for development
export const adoptionLimiter = expressRateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 50, // Increased limit for development
  message: {
    success: false,
    error: 'Too many adoption requests, please try again tomorrow',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Pet modification limiter - increased for development
export const petModificationLimiter = expressRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Increased limit for development
  message: {
    success: false,
    error: 'Too many pet modifications, please try again after an hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// View increment limiter - strict limits to prevent spam
export const viewIncrementLimiter = expressRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Maximum 10 view increments per hour per IP
  message: {
    success: false,
    error: 'Too many view increment requests, please try again after an hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator to include shelter ID
  keyGenerator: (req) => {
    return `${req.ip}-${req.params.shelterId || 'unknown'}`;
  },
});
