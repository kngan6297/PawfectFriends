/**
 * Regular expression patterns used throughout the application
 */

/**
 * Password regex pattern that enforces:
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one digit
 * - At least one special character
 * - Minimum length of 8 characters
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/; 