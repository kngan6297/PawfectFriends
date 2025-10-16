import { User } from '../../user/user.model.js';
import logger from '../../../utils/logger.js';
import { hashPassword } from '../../../utils/password.js';

export const adminUserService = {
  /**
   * Get all users with pagination and filtering
   */
  getAll: async (filters = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        role,
        isActive,
        accountLocked,
      } = filters;

      // Build query
      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      if (role) {
        query.role = role;
      }

      if (typeof isActive === 'boolean') {
        query.isActive = isActive;
      }

      if (typeof accountLocked === 'boolean') {
        query.accountLocked = accountLocked;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get users and total count
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password -emailVerificationToken -resetPasswordToken')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(query),
      ]);

      return {
        users,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Get all users service error:', error);
      throw error;
    }
  },

  /**
   * Get user by ID
   */
  getById: async (userId) => {
    try {
      const user = await User.findById(userId).select(
        '-password -emailVerificationToken -resetPasswordToken'
      );

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Get user by ID service error:', error);
      throw error;
    }
  },

  /**
   * Update user
   */
  update: async (userId, userData) => {
    try {
      const user = await User.findByIdAndUpdate(userId, userData, {
        new: true,
        runValidators: true,
      }).select('-password');
      return user;
    } catch (error) {
      logger.error('Update user service error:', error);
      throw error;
    }
  },

  /**
   * Delete user
   */
  delete: async (userId) => {
    try {
      await User.findByIdAndDelete(userId);
    } catch (error) {
      logger.error('Delete user service error:', error);
      throw error;
    }
  },

  /**
   * Create user
   */
  create: async (userData) => {
    try {
      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      logger.error('Create user service error:', error);
      throw error;
    }
  },

  /**
   * Lock user account
   */
  lock: async (userId, reason) => {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          accountLocked: true,
          lockReason: reason,
          lockedAt: new Date(),
        },
        { new: true }
      ).select('-password');
      return user;
    } catch (error) {
      logger.error('Lock user service error:', error);
      throw error;
    }
  },

  /**
   * Unlock user account
   */
  unlock: async (userId) => {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          accountLocked: false,
          lockReason: null,
          lockedAt: null,
        },
        { new: true }
      ).select('-password');
      return user;
    } catch (error) {
      logger.error('Unlock user service error:', error);
      throw error;
    }
  },

  /**
   * Reset user password
   */
  resetPassword: async (userId, newPassword) => {
    try {
      const hashedPassword = await hashPassword(newPassword);
      await User.findByIdAndUpdate(userId, {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      });
      return { message: 'Password reset successfully' };
    } catch (error) {
      logger.error('Reset user password service error:', error);
      throw error;
    }
  },

  /**
   * Get all admins
   */
  getAllAdmins: async () => {
    try {
      const admins = await User.find({ role: 'admin' })
        .select('-password -emailVerificationToken -resetPasswordToken')
        .sort({ createdAt: -1 });
      return admins;
    } catch (error) {
      logger.error('Get all admins service error:', error);
      throw error;
    }
  },
};
