/**
 * Cookie Configuration Utility
 *
 * Provides consistent cookie settings based on environment and security requirements
 */

/**
 * Get cookie configuration for refresh tokens
 * @param {boolean} isProduction - Whether running in production
 * @param {string} sameSite - SameSite policy ('strict', 'lax', 'none')
 * @returns {Object} Cookie configuration object
 */
export const getRefreshTokenCookieConfig = (
  isProduction = false,
  sameSite = 'lax'
) => {
  return {
    httpOnly: true, // Prevent XSS attacks
    secure: isProduction, // Only send over HTTPS in production
    sameSite: sameSite, // CSRF protection
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/', // Available for all routes
  };
};

/**
 * Get cookie configuration for CSRF tokens
 * @param {boolean} isProduction - Whether running in production
 * @param {string} sameSite - SameSite policy ('strict', 'lax', 'none')
 * @returns {Object} Cookie configuration object
 */
export const getCSRFTokenCookieConfig = (
  isProduction = false,
  sameSite = 'lax'
) => {
  return {
    httpOnly: false, // Client needs to read this for double submit pattern
    secure: isProduction, // Only send over HTTPS in production
    sameSite: sameSite, // CSRF protection
    maxAge: 60 * 60 * 1000, // 1 hour
    path: '/', // Available for all routes
  };
};

/**
 * Get cookie configuration for clearing cookies
 * @param {boolean} isProduction - Whether running in production
 * @param {string} sameSite - SameSite policy ('strict', 'lax', 'none')
 * @returns {Object} Cookie configuration object
 */
export const getClearCookieConfig = (
  isProduction = false,
  sameSite = 'lax'
) => {
  return {
    httpOnly: true, // Match the original cookie settings
    secure: isProduction, // Match the original cookie settings
    sameSite: sameSite, // Match the original cookie settings
    path: '/', // Match the original cookie settings
  };
};

/**
 * Determine the appropriate SameSite policy based on deployment configuration
 * @param {Object} options - Configuration options
 * @param {boolean} options.isCrossSite - Whether the app needs to work across different domains
 * @param {boolean} options.isSSO - Whether SSO is used
 * @param {boolean} options.isMobileWebView - Whether mobile app webview is used
 * @returns {string} SameSite policy ('strict', 'lax', 'none')
 */
export const getSameSitePolicy = ({
  isCrossSite = false,
  isSSO = false,
  isMobileWebView = false,
} = {}) => {
  // If any cross-site functionality is needed, use 'lax'
  if (isCrossSite || isSSO || isMobileWebView) {
    return 'lax';
  }

  // For same-origin SPA applications, 'strict' is most secure
  return 'strict';
};

/**
 * Get environment-based cookie configuration
 * @param {Object} options - Configuration options
 * @returns {Object} Cookie configurations for different token types
 */
export const getEnvironmentCookieConfig = (options = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = getSameSitePolicy(options);

  return {
    refreshToken: getRefreshTokenCookieConfig(isProduction, sameSite),
    csrfToken: getCSRFTokenCookieConfig(isProduction, sameSite),
    clear: getClearCookieConfig(isProduction, sameSite),
  };
};

export default {
  getRefreshTokenCookieConfig,
  getCSRFTokenCookieConfig,
  getClearCookieConfig,
  getSameSitePolicy,
  getEnvironmentCookieConfig,
};
