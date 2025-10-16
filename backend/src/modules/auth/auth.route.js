import express from 'express';
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  changePassword,
  unlockAccount,
  validateToken,
} from './auth.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  unlockAccountSchema,
} from './auth.validation.js';
import { authenticate } from '../../middleware/auth.js';
import { securityLogger } from '../../middleware/securityLogger.js';
import { apiLimiter } from '../../middleware/rateLimiter.js';

export const authRouter = express.Router();

// Registration
authRouter.post(
  '/register',
  apiLimiter,
  securityLogger('user_registration'),
  validateRequest({ body: registerSchema }),
  register
);

// Login
authRouter.post(
  '/login',
  apiLimiter,
  securityLogger('user_login'),
  validateRequest({ body: loginSchema }),
  login
);

// Email verification
authRouter.get(
  '/verify-email',
  validateRequest({ query: verifyEmailSchema }),
  verifyEmail
);

// Resend verification email
authRouter.post(
  '/resend-verification',
  apiLimiter,
  securityLogger('resend_verification'),
  validateRequest({ body: resendVerificationSchema }),
  resendVerification
);

// Forgot password
authRouter.post(
  '/forgot-password',
  apiLimiter,
  securityLogger('forgot_password'),
  validateRequest({ body: forgotPasswordSchema }),
  forgotPassword
);

// Reset password
authRouter.post(
  '/reset-password',
  apiLimiter,
  securityLogger('reset_password'),
  validateRequest({ body: resetPasswordSchema }),
  resetPassword
);

// Refresh token
authRouter.post(
  '/refresh-token',
  apiLimiter,
  securityLogger('refresh_token'),
  refreshToken
);

// Logout
authRouter.post('/logout', authenticate, securityLogger('user_logout'), logout);

// Validate token
authRouter.get(
  '/validate-token',
  authenticate,
  securityLogger('validate_token'),
  validateToken
);

// Change password (authenticated)
authRouter.put(
  '/change-password',
  authenticate,
  securityLogger('change_password'),
  validateRequest({ body: changePasswordSchema }),
  changePassword
);

// Unlock account
authRouter.post(
  '/unlock-account',
  apiLimiter,
  securityLogger('unlock_account'),
  validateRequest({ body: unlockAccountSchema }),
  unlockAccount
);
