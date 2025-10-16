import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../user/user.model.js';
import logger from '../../utils/logger.js';
import { ApiError } from '../../utils/errors.js';
import {
  generateToken,
  generateRefreshToken,
  verifyRefresh,
} from '../../utils/jwt.js';
import {
  logSecurityEvent,
  logSecurityError,
  SecurityEventType,
} from '../../utils/securityLogger.js';
import { emailService } from '../../services/email.service.js';
import { UserRoleEnum } from '../user/user.types.js';

const register = async (data) => {
  const {
    name,
    email,
    password,
    phone,
    role,
    address,
    city,
    state,
    zipCode,
    description,
  } = data;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      logSecurityError(
        SecurityEventType.AUTH.REGISTER,
        new Error('User with this email or phone already exists'),
        { email, phone }
      );
      throw ApiError.badRequest('User with this email or phone already exists');
    }

    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password, // Set plain password, let pre-save middleware hash it
      phone: phone.trim(),
      role,
      ...(role === UserRoleEnum.SHELTER && {
        address: address?.trim(),
        city: city?.trim(),
        state: state?.trim(),
        zipCode: zipCode?.trim(),
        description: description?.trim(),
      }),
    };

    // For admin users, skip email verification
    if (role === 'admin' || role === UserRoleEnum.ADMIN) {
      userData.emailVerified = true;
    } else {
      // Generate verification token for non-admin users
      const verificationToken = crypto.randomBytes(32).toString('hex');
      userData.emailVerificationToken = verificationToken;
      userData.emailVerificationExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // 24 hours
    }

    const user = await User.create(userData);

    // Send verification email only for non-admin users
    if (role !== 'admin' && role !== UserRoleEnum.ADMIN) {
      await emailService.sendVerificationEmail(
        user.email,
        userData.emailVerificationToken
      );
    } else {
    }

    const isAdmin = role === 'admin' || role === UserRoleEnum.ADMIN;
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      message: isAdmin
        ? 'Admin account created successfully. You can now log in.'
        : 'Registration successful. Please check your email to verify your account.',
    };
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (
  emailOrPhone,
  password,
  userAgent,
  ipAddress
) => {
  try {
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    }).select('+password');

    if (!user) {
      logSecurityError(
        SecurityEventType.AUTH.LOGIN,
        new Error('User not found'),
        { emailOrPhone }
      );
      throw ApiError.unauthorized(
        'No account found with this email/phone number. Please check your credentials or create a new account.'
      );
    }

    // Bypass email verification for admin users
    if (!user.emailVerified && user.role !== 'admin') {
      logSecurityError(
        SecurityEventType.AUTH.LOGIN,
        new Error('Email not verified'),
        { email: user.email }
      );
      throw ApiError.unauthorized(
        'Please verify your email before logging in. Check your inbox for a verification link or request a new one.'
      );
    }

    // Bypass account locking checks for admin users
    if (user.role !== 'admin') {
      if (user.accountLocked && user.lockUntil && user.lockUntil < new Date()) {
        user.accountLocked = false;
        user.lockUntil = undefined;
        await user.save();
        logger.info(`Account unlocked for user: ${user.email}`);
      }

      if (user.accountLocked) {
        const lockTimeRemaining = Math.ceil(
          (user.lockUntil - new Date()) / (1000 * 60)
        ); // minutes remaining
        logSecurityError(
          SecurityEventType.AUTH.LOGIN,
          new Error('Account locked'),
          { email: user.email }
        );
        throw ApiError.forbidden(
          `Your account has been locked due to multiple failed login attempts. Please try again in ${lockTimeRemaining} minutes or reset your password.`
        );
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logSecurityError(
        SecurityEventType.AUTH.LOGIN,
        new Error('Invalid password'),
        { email: user.email }
      );

      throw ApiError.unauthorized('Incorrect password. Please try again.');
    }

    user.accountLocked = false;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const accessToken = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    logSecurityEvent(SecurityEventType.AUTH.LOGIN, {
      userId: user._id,
      email: user.email,
      ip: ipAddress,
      userAgent,
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw error;
  }
};

export const verifyUserEmail = async (token, clientInfo) => {
  try {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      const expiredUser = await User.findOne({ emailVerificationToken: token });
      if (expiredUser) {
        throw ApiError.badRequest(
          'Verification token has expired. Please request a new verification email.'
        );
      }
      throw ApiError.badRequest('Invalid verification token');
    }

    if (user.emailVerified) {
      throw ApiError.badRequest('Email is already verified');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    logSecurityEvent(SecurityEventType.AUTH.EMAIL_VERIFIED, {
      userId: user._id,
      email: user.email,
      ...clientInfo,
    });

    return {
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logSecurityError(SecurityEventType.AUTH.EMAIL_VERIFICATION_FAILED, error, {
      token,
      ...clientInfo,
    });
    throw ApiError.internal('Email verification failed');
  }
};

export const resendVerificationEmail = async (email, clientInfo) => {
  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.emailVerified) {
      throw ApiError.badRequest('Email is already verified');
    }

    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpires = Date.now() + 60 * 60 * 1000; // 1 hour expiry

    user.emailVerificationToken = newToken;
    user.emailVerificationExpires = newExpires;
    await user.save();

    await emailService.sendVerificationEmail(email, newToken);

    logSecurityEvent(SecurityEventType.AUTH.RESEND_VERIFICATION, {
      userId: user._id,
      email: user.email,
      ...clientInfo,
    });

    return {
      message: 'Verification email sent successfully',
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logSecurityError(SecurityEventType.AUTH.RESEND_VERIFICATION_FAILED, error, {
      email,
      ...clientInfo,
    });
    throw ApiError.internal('Failed to resend verification email');
  }
};

export const sendForgotPasswordEmail = async (email) => {
  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    await emailService.sendPasswordResetEmail(email, resetToken);

    logSecurityEvent(SecurityEventType.AUTH.FORGOT_PASSWORD, {
      userId: user._id,
      email: user.email,
    });

    return {
      message: 'Password reset email sent successfully',
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logSecurityError(SecurityEventType.AUTH.FORGOT_PASSWORD_FAILED, error, {
      email,
    });
    throw ApiError.internal('Failed to process password reset request');
  }
};

export const resetUserPassword = async (token, newPassword, confirmPassword) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      const expiredUser = await User.findOne({ resetPasswordToken: token });
      if (expiredUser) {
        throw ApiError.badRequest(
          'Password reset token has expired. Please request a new password reset.'
        );
      }
      throw ApiError.badRequest('Invalid password reset token');
    }

    user.password = newPassword; // Set plain password, let pre-save middleware hash it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.accountLocked = false;
    user.lockUntil = undefined;
    await user.save();

    logSecurityEvent(SecurityEventType.AUTH.PASSWORD_RESET, {
      userId: user._id,
      email: user.email,
    });

    return {
      success: true,
      message: 'Password reset successfully',
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logSecurityError(SecurityEventType.AUTH.PASSWORD_RESET_FAILED, error, {
      token,
    });
    throw ApiError.internal('Password reset failed');
  }
};

export const refreshAccessToken = async (
  refreshToken,
  userAgent,
  ipAddress
) => {
  try {
    const decoded = verifyRefresh(refreshToken);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (!user.emailVerified) {
      throw ApiError.unauthorized('User account is not verified');
    }

    const accessToken = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });
    const newRefreshToken = generateRefreshToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    logSecurityEvent(SecurityEventType.AUTH.TOKEN_REFRESHED, {
      userId: user._id,
      email: user.email,
      ip: ipAddress,
      userAgent,
    });

    return {
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    };
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Refresh token expired');
    }
    throw error;
  }
};

export const logoutUser = async (refreshToken) => {
  try {
    const decoded = verifyRefresh(refreshToken);

    logSecurityEvent(SecurityEventType.AUTH.LOGOUT, {
      userId: decoded.id,
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  } catch (error) {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
};

const changePassword = async (
  userId,
  currentPassword,
  newPassword,
  clientInfo
) => {
  try {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    user.password = newPassword; // Set plain password, let pre-save middleware hash it
    await user.save();

    logSecurityEvent(SecurityEventType.AUTH.PASSWORD_CHANGED, {
      userId: user._id,
      email: user.email,
      ...clientInfo,
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logSecurityError(SecurityEventType.AUTH.PASSWORD_CHANGE_FAILED, error, {
      userId,
      ...clientInfo,
    });
    throw ApiError.internal('Failed to change password');
  }
};

export const unlockUserAccount = async (emailOrPhone) => {
  try {
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (!user.accountLocked) {
      throw ApiError.badRequest('Account is not locked');
    }

    user.accountLocked = false;
    user.lockUntil = undefined;
    await user.save();

    logSecurityEvent(SecurityEventType.AUTH.ACCOUNT_UNLOCKED, {
      userId: user._id,
      email: user.email,
    });

    return {
      success: true,
      message: 'Account unlocked successfully',
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logSecurityError(SecurityEventType.AUTH.ACCOUNT_UNLOCK_FAILED, error, {
      emailOrPhone,
    });
    throw ApiError.internal('Failed to unlock account');
  }
};

export { register, changePassword };
