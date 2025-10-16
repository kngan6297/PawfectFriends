import Joi from 'joi';
import {
  baseUserFieldsSchema,
  authFieldsSchema,
} from '../user/user.validation.js';
import {
  commonSchemas,
  commonValidationSchemas,
} from '../../utils/validation.js';

// Password validation schema - using centralized schema
export const passwordSchema = commonSchemas.password;

// Login schema - using centralized schema
export const loginSchema = commonValidationSchemas.userLogin;

// Registration validation schema - using centralized schema
export const registerSchema = commonValidationSchemas.userRegistration;

// Email verification schema - using centralized schema
export const emailVerificationSchema =
  commonValidationSchemas.emailVerification;

// Resend verification validation schema
export const resendVerificationSchema = Joi.object({
  email: commonSchemas.email,
});

// Forgot password validation schema - using centralized schema
export const forgotPasswordSchema =
  commonValidationSchemas.passwordResetRequest;

// Reset password validation schema - using centralized schema
export const resetPasswordSchema = commonValidationSchemas.passwordReset;

// Refresh token schema
export const refreshTokenSchema = Joi.object({
  refreshToken: commonSchemas.token,
});

// Change password schema
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
    'any.required': 'Current password is required',
  }),
  newPassword: commonSchemas.password,
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your new password',
    }),
});

// Unlock account schema
export const unlockAccountSchema = Joi.object({
  emailOrPhone: Joi.string().required().messages({
    'string.empty': 'Email or phone number is required',
    'any.required': 'Email or phone number is required',
  }),
});

// Verify email schema (alias for emailVerificationSchema)
export const verifyEmailSchema = emailVerificationSchema;
