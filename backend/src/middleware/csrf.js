import crypto from 'crypto';
import { ApiError } from '../utils/errors.js';
import {
  logSecurityEvent,
  SecurityEventType,
} from '../utils/securityLogger.js';

/**
 * CSRF Protection Middleware using Double Submit Cookie Pattern
 *
 * This middleware implements CSRF protection by:
 * 1. Generating a CSRF token and storing it in both a cookie and response header
 * 2. Validating that subsequent requests include the same token in both places
 * 3. Using the double submit pattern to prevent CSRF attacks
 */

// Store CSRF tokens in memory (in production, consider using Redis)
const csrfTokens = new Map();

// Clean up expired tokens every hour
setInterval(
  () => {
    const now = Date.now();
    for (const [token, data] of csrfTokens.entries()) {
      if (data.expires < now) {
        csrfTokens.delete(token);
      }
    }
  },
  60 * 60 * 1000
); // 1 hour

/**
 * Generate a secure CSRF token
 * @returns {string} CSRF token
 */
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF middleware for generating tokens
 * This should be applied to routes that need CSRF protection
 */
export const csrfProtection = (req, res, next) => {
  try {
    // Generate CSRF token
    const csrfToken = generateCSRFToken();
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour

    // Store token with expiration
    csrfTokens.set(csrfToken, {
      expires,
      userId: req.user?._id || null,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    // Set CSRF token in cookie (httpOnly: false so client can read it)
    res.cookie('csrfToken', csrfToken, {
      httpOnly: false, // Client needs to read this for double submit
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Allow cross-site requests for SPA
      maxAge: 60 * 60 * 1000, // 1 hour
      path: '/', // Available for all routes
    });

    // Also set in response header for client convenience
    res.setHeader('X-CSRF-Token', csrfToken);

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * CSRF validation middleware
 * This should be applied to routes that modify state (POST, PUT, DELETE, PATCH)
 */
export const validateCSRF = (req, res, next) => {
  try {
    // Skip CSRF validation for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Get CSRF token from cookie and header/body
    const cookieToken = req.cookies.csrfToken;
    const headerToken = req.headers['x-csrf-token'];
    const bodyToken = req.body?.csrfToken;

    // Use header token first, then body token
    const providedToken = headerToken || bodyToken;

    // Validate token exists
    if (!cookieToken || !providedToken) {
      logSecurityEvent(
        SecurityEventType.VALIDATION.FAILED,
        req.user?._id || null,
        'CSRF validation failed - missing token',
        {
          hasCookieToken: !!cookieToken,
          hasProvidedToken: !!providedToken,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
        }
      );

      throw ApiError.forbidden('CSRF token missing');
    }

    // Validate tokens match (double submit pattern)
    if (cookieToken !== providedToken) {
      logSecurityEvent(
        SecurityEventType.VALIDATION.FAILED,
        req.user?._id || null,
        'CSRF validation failed - token mismatch',
        {
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
        }
      );

      throw ApiError.forbidden('CSRF token mismatch');
    }

    // Validate token exists in our store and is not expired
    const tokenData = csrfTokens.get(cookieToken);
    if (!tokenData || tokenData.expires < Date.now()) {
      logSecurityEvent(
        SecurityEventType.VALIDATION.FAILED,
        req.user?._id || null,
        'CSRF validation failed - token expired or invalid',
        {
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
        }
      );

      throw ApiError.forbidden('CSRF token expired or invalid');
    }

    // Optional: Validate IP and User-Agent for additional security
    const currentIp = req.ip || req.connection.remoteAddress;
    const currentUserAgent = req.headers['user-agent'];

    if (
      tokenData.ip !== currentIp ||
      tokenData.userAgent !== currentUserAgent
    ) {
      logSecurityEvent(
        SecurityEventType.VALIDATION.FAILED,
        req.user?._id || null,
        'CSRF validation failed - IP or User-Agent mismatch',
        {
          expectedIp: tokenData.ip,
          currentIp,
          expectedUserAgent: tokenData.userAgent,
          currentUserAgent,
        }
      );

      // For now, just log the mismatch but don't block the request
      // In high-security environments, you might want to block this
      console.warn('CSRF token IP/User-Agent mismatch detected');
    }

    // Remove used token to prevent replay attacks
    csrfTokens.delete(cookieToken);

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to clear CSRF token on logout
 */
export const clearCSRFToken = (req, res, next) => {
  const csrfToken = req.cookies.csrfToken;
  if (csrfToken) {
    csrfTokens.delete(csrfToken);
  }

  res.clearCookie('csrfToken', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  next();
};

export default {
  csrfProtection,
  validateCSRF,
  clearCSRFToken,
};
