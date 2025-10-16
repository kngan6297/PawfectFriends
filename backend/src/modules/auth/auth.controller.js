import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  verifyUserEmail,
  resendVerificationEmail,
  sendForgotPasswordEmail,
  resetUserPassword,
  changePassword as changeUserPassword,
  unlockUserAccount,
} from './auth.service.js';
import userService from '../user/user.service.js';
import {
  logSecurityEvent,
  logSecurityError,
  SecurityEventType,
} from '../../utils/securityLogger.js';
import { ApiError } from '../../utils/errors.js';
import { asyncHandler } from '../../middleware/async.js';
import { registerSchema } from './auth.validation.js';

// =============================================
// Authentication Actions
// =============================================

// Helper function to get client info
const getClientInfo = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const referer = req.headers.referer;
  return { ip, userAgent, referer };
};

export const register = async (req, res, next) => {
  try {
    const { error, value: data } = registerSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: { objects: true, arrays: true },
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          issues: error.details,
          message: 'Validation failed',
        },
      });
    }

    const clientInfo = getClientInfo(req);
    const user = await userService.registerUser(data);

    res.status(201).json({
      success: true,
      message:
        'Registration successful. Please check your email to verify your account.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    // Input is already validated by validateRequest middleware
    const { emailOrPhone, password } = req.body;
    const clientInfo = getClientInfo(req);

    const result = await loginUser(
      emailOrPhone,
      password,
      clientInfo.userAgent,
      clientInfo.ip
    );

    // Set refresh token cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: result.user._id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          phone: result.user.phone,
          emailVerified: result.user.emailVerified,
        },
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    // Handle specific error types and return appropriate status codes
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        userMessage:
          error.userMessage || 'Email/phone number or password is incorrect.',
      });
    }

    if (error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        errorCode: 'ACCOUNT_RESTRICTED',
        userMessage:
          error.userMessage ||
          'Your account is restricted. Please contact support.',
      });
    }

    // For any other errors, pass to error middleware
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const clientInfo = getClientInfo(req);
    await logoutUser(refreshToken);

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const clientInfo = getClientInfo(req);

    if (!refreshToken) {
      throw ApiError.unauthorized('No refresh token provided');
    }

    const result = await refreshAccessToken(
      refreshToken,
      clientInfo.userAgent,
      clientInfo.ip
    );

    // Set new refresh token cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    const clientInfo = getClientInfo(req);
    await verifyUserEmail(token, clientInfo);

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const clientInfo = getClientInfo(req);
    await resendVerificationEmail(email, clientInfo);
    res.json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const clientInfo = getClientInfo(req);
    await sendForgotPasswordEmail(email);
    res.json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;
    const clientInfo = getClientInfo(req);
    await resetUserPassword(token, password, confirmPassword);
    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const clientInfo = getClientInfo(req);
    await changeUserPassword(
      req.user.id,
      currentPassword,
      newPassword,
      clientInfo
    );
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==================
// ADD thiếu hàm unlockAccount:
export const unlockAccount = async (req, res, next) => {
  try {
    const { email, unlockToken } = req.body;
    const clientInfo = getClientInfo(req);

    await unlockUserAccount(email, unlockToken, clientInfo);

    res.json({
      success: true,
      message: 'Account unlocked successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

export const validateToken = async (req, res, next) => {
  try {
    // The authenticate middleware has already validated the token
    // If we reach here, the token is valid
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
