import logger from '../utils/logger.js';
import {
  logSecurityEvent,
  logSecurityError,
  SecurityEventType,
} from '../utils/securityLogger.js';

/**
 * Middleware to capture IP and device information for security logging
 * @returns {Function} Express middleware function
 */
export const captureDeviceInfo = (req, res, next) => {
  // Capture IP address without trying to set req.ip directly
  const clientIp =
    req.ip ||
    req.connection?.remoteAddress ||
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    'unknown';

  // Ensure user agent is captured
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Add device fingerprinting info to request object
  req.clientIp = clientIp;
  req.userAgent = userAgent;
  req.deviceInfo = {
    ip: clientIp,
    userAgent: userAgent,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
  };

  next();
};

/**
 * Middleware to log security-sensitive requests
 * @param {string} action - The security action being performed
 * @returns {Function} Express middleware function
 */
export const securityLogger = (action) => {
  return (req, res, next) => {
    // Log the security event using the utility function
    logSecurityEvent(
      SecurityEventType.AUTH.LOGIN_SUCCESS,
      {
        action,
        ip: req.clientIp || req.ip,
        method: req.method,
        path: req.path,
        userAgent: req.headers['user-agent'],
        // Only log non-sensitive parts of the request
        body: {
          ...req.body,
          password: req.body.password ? '[REDACTED]' : undefined,
          confirmPassword: req.body.confirmPassword ? '[REDACTED]' : undefined,
          currentPassword: req.body.currentPassword ? '[REDACTED]' : undefined,
          newPassword: req.body.newPassword ? '[REDACTED]' : undefined,
        },
      },
      {
        source: 'middleware',
        timestamp: new Date().toISOString(),
      }
    );

    // Add response logging
    const originalSend = res.send;
    res.send = function (body) {
      // Log the response
      logSecurityEvent(
        SecurityEventType.AUTH.LOGIN_SUCCESS,
        {
          action,
          statusCode: res.statusCode,
          success: res.statusCode < 400,
        },
        {
          source: 'middleware',
          timestamp: new Date().toISOString(),
        }
      );

      return originalSend.call(this, body);
    };

    next();
  };
};

// Re-export utility functions for convenience
export { logSecurityEvent, logSecurityError, SecurityEventType };
