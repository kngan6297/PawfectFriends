import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from './user.model.js';
import logger from '../../utils/logger.js';
import config from '../../config/index.js';
import { emailService } from '../../services/email.service.js';
import { zimService } from '../../services/zim.service.js';
import { ApiError } from '../../utils/errors.js';
import { generateToken } from '../../utils/jwt.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { UserRoleEnum } from './user.types.js';
import mongoose from 'mongoose';
import { Pet } from '../pet/pet.model.js';
import { PUBLIC_FIELDS, ADMIN_FIELDS, SHELTER_FIELDS } from './user.fields.js';

// Transform function to map _id to id and create breeds object for frontend compatibility
const transformPet = (pet) => {
  if (!pet) return null;
  const petObj = pet.toObject ? pet.toObject() : pet;
  return {
    ...petObj,
    id: petObj._id,
    _id: undefined,
    // Create breeds object for frontend compatibility
    breeds: {
      primary: petObj.breed || 'Unknown Breed',
      secondary: null,
      mixed: false,
      unknown: false,
    },
  };
};

// Utility function to pick only allowed fields for profile updates
const pickAllowedProfileFields = (data) => {
  const allowedFields = [
    'name',
    'phone',
    'avatar',
    'bio',
    'location',
    'preferences',
  ];
  const filteredData = {};

  for (const field of allowedFields) {
    if (data.hasOwnProperty(field)) {
      filteredData[field] = data[field];
    }
  }

  return filteredData;
};

// Base query to exclude soft-deleted users
const ACTIVE_USER_QUERY = { deletedAt: null };

const MAX_PET_LIST = 50;

// Auth service methods
const registerUser = async (userData) => {
  try {
    const { email, password, phone, name, role, location, description } =
      userData;

    // Check if user already exists (only active users)
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
      ...ACTIVE_USER_QUERY,
    });

    if (existingUser) {
      throw ApiError.badRequest(
        'An account with this email or phone number already exists'
      );
    }

    // Generate verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 60 * 60 * 1000; // 1 hour expiry

    // Prepare user data based on role
    const userDataToCreate = {
      email,
      password, // Let pre-save middleware handle hashing
      phone,
      name,
      role,
      emailVerificationToken,
      emailVerificationExpires,
    };

    // Add shelter-specific fields if role is shelter
    if (role === 'shelter') {
      if (location) {
        userDataToCreate.location = location;
      }
      if (description) {
        userDataToCreate.bio = description; // Map description to bio field
      }
    }

    // Create user with verification token
    const user = await User.create(userDataToCreate);

    // Register user in ZIM system if configured
    try {
      if (zimService.isConfigured()) {
        await zimService.registerUser(
          user._id.toString(),
          user.name,
          user.avatar
        );
        // Update user with ZIM user ID
        user.zimUserId = user._id.toString();
        await user.save();
        logger.info(`User registered in ZIM: ${user._id} (${user.name})`);
      } else {
        logger.warn('ZIM service not configured, skipping ZIM registration');
      }
    } catch (zimError) {
      logger.error(
        'ZIM registration failed, continuing with user creation:',
        zimError
      );
      // Don't fail user creation if ZIM registration fails
    }

    // Send verification email using email service
    await emailService.sendVerificationEmail(email, emailVerificationToken);

    return {
      user,
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  } catch (error) {
    logger.error('Registration service error:', error);
    throw error;
  }
};

const loginUser = async (emailOrPhone, password) => {
  try {
    // Find user by email or phone (only active users)
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
      ...ACTIVE_USER_QUERY,
    });

    if (!user) {
      throw ApiError.badRequest('Invalid credentials');
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw ApiError.badRequest('Invalid credentials');
    }

    // Generate JWT token
    const token = generateToken(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      '7d'
    );

    return { user, token };
  } catch (error) {
    logger.error('Login service error:', error);
    throw error;
  }
};

const manualVerifyUser = async (token) => {
  // This function is specifically for manual verification by admins or special cases
  // For normal email verification, use authService.verifyUserEmail instead
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired verification token');
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  return { message: 'Email manually verified successfully' };
};

const resendUserVerification = async (email) => {
  try {
    const user = await User.findOne({ email });

    // Don't reveal if user exists or not for security
    if (!user) {
      // Return success message even if user doesn't exist to prevent email enumeration
      return {
        message:
          'If an account with this email exists and is not verified, a verification email has been sent',
      };
    }

    if (user.emailVerified) {
      // Don't reveal that email is already verified to prevent user enumeration
      return {
        message:
          'If an account with this email exists and is not verified, a verification email has been sent',
      };
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 60 * 60 * 1000; // 1 hour expiry

    // Update user with new verification token
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // Send verification email using email service
    await emailService.sendVerificationEmail(email, emailVerificationToken);

    return {
      message:
        'If an account with this email exists and is not verified, a verification email has been sent',
    };
  } catch (error) {
    logger.error('Resend verification service error:', error);
    throw error;
  }
};

const forgotUserPassword = async (email) => {
  const user = await User.findOne({ email });

  // Don't reveal if user exists or not for security
  if (!user) {
    // Return success message even if user doesn't exist to prevent email enumeration
    return {
      message:
        'If an account with this email exists, a password reset link has been sent',
    };
  }

  const resetToken = generateToken({ id: user._id }, '1h');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  await emailService.sendPasswordResetEmail(user.email, resetToken);

  return {
    message:
      'If an account with this email exists, a password reset link has been sent',
  };
};

const resetUserPassword = async (token, newPassword) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  user.password = newPassword; // Let pre-save middleware handle hashing
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { message: 'Password has been reset' };
};

// User profile service methods
const createUserProfile = async (userId, profileData) => {
  try {
    const user = await User.findOne({
      _id: userId,
      ...ACTIVE_USER_QUERY,
    }).select(PUBLIC_FIELDS);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Filter only allowed fields to prevent unauthorized updates
    const filteredData = pickAllowedProfileFields(profileData);
    Object.assign(user, filteredData);
    await user.save();

    return await User.findById(userId).select(PUBLIC_FIELDS);
  } catch (error) {
    logger.error('Create profile service error:', error);
    throw error;
  }
};

const getUserProfile = async (userId) => {
  try {
    const user = await User.findOne({ _id: userId, ...ACTIVE_USER_QUERY })
      .select(PUBLIC_FIELDS)
      .populate('favoritePets', 'name type breed age gender images')
      .populate('viewedPets', 'name type breed age gender images')
      .lean();

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Transform pets to include breeds object
    if (user.favoritePets) {
      user.favoritePets = user.favoritePets.map(transformPet);
    }
    if (user.viewedPets) {
      user.viewedPets = user.viewedPets.map(transformPet);
    }

    return user;
  } catch (error) {
    logger.error('Get profile service error:', error);
    throw error;
  }
};

const updateUserProfile = async (userId, profileData) => {
  try {
    const user = await User.findOne({
      _id: userId,
      ...ACTIVE_USER_QUERY,
    }).select(PUBLIC_FIELDS);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Filter only allowed fields to prevent unauthorized updates
    const filteredData = pickAllowedProfileFields(profileData);
    Object.assign(user, filteredData);
    await user.save();

    return await User.findById(userId).select(PUBLIC_FIELDS);
  } catch (error) {
    logger.error('Update profile service error:', error);
    throw error;
  }
};

const updateUserPreferences = async (userId, preferences) => {
  try {
    const user = await User.findOne({
      _id: userId,
      ...ACTIVE_USER_QUERY,
    }).select(PUBLIC_FIELDS);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.preferences = preferences;
    await user.save();

    return user;
  } catch (error) {
    logger.error('Update preferences service error:', error);
    throw error;
  }
};

const updateUserLocation = async (userId, location) => {
  try {
    const user = await User.findOne({
      _id: userId,
      ...ACTIVE_USER_QUERY,
    }).select(PUBLIC_FIELDS);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.location = location;
    await user.save();

    return user;
  } catch (error) {
    logger.error('Update location service error:', error);
    throw error;
  }
};

// Password management
const changeUserPassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    // Update password
    user.password = newPassword; // Set plain password, let pre-save middleware hash it
    await user.save();

    return {
      success: true,
      message: 'Password changed successfully',
    };
  } catch (error) {
    logger.error('Change password service error:', error);
    throw error;
  }
};

// Enhanced profile management
const updateUserAddress = async (userId, addressData) => {
  try {
    const user = await User.findOne({
      _id: userId,
      ...ACTIVE_USER_QUERY,
    }).select(PUBLIC_FIELDS);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Update address fields using the AddressSchema structure
    user.location = addressData;

    await user.save();
    return user;
  } catch (error) {
    logger.error('Update address service error:', error);
    throw error;
  }
};

const updateSecuritySettings = async (userId, securityData) => {
  try {
    const user = await User.findOne({
      _id: userId,
      ...ACTIVE_USER_QUERY,
    }).select(PUBLIC_FIELDS);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Update security-related fields
    if (securityData.twoFactorEnabled !== undefined) {
      user.twoFactorEnabled = securityData.twoFactorEnabled;
    }

    if (securityData.loginNotifications !== undefined) {
      user.loginNotifications = securityData.loginNotifications;
    }

    await user.save();
    return user;
  } catch (error) {
    logger.error('Update security settings service error:', error);
    throw error;
  }
};

const getFavoritePets = async (userId) => {
  try {
    const user = await User.findOne({ _id: userId, ...ACTIVE_USER_QUERY })
      .select('favoritePets')
      .populate({
        path: 'favoritePets',
        select:
          'name type breed age gender photos status description createdAt',
        populate: {
          path: 'shelter',
          select: '_id name location contact',
        },
      })
      .lean();

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Handle case where favoritePets might be undefined/null
    if (!user.favoritePets || !Array.isArray(user.favoritePets)) {
      return [];
    }

    return user.favoritePets.map(transformPet);
  } catch (error) {
    logger.error('Get favorite pets service error:', error);
    throw error;
  }
};

const toggleFavoritePet = async (userId, petId) => {
  try {
    // Validate petId format
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw ApiError.badRequest('Invalid pet ID format');
    }

    // Check if pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      throw ApiError.notFound('Pet not found');
    }

    const user = await User.findOne({ _id: userId, ...ACTIVE_USER_QUERY });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Initialize favoritePets array if it doesn't exist
    if (!user.favoritePets) {
      user.favoritePets = [];
    }

    // Convert to string for comparison
    const petIdStr = String(petId);
    const favList = user.favoritePets.map((id) => String(id));

    const index = favList.indexOf(petIdStr);
    if (index === -1) {
      // Only add if not already in the list and under the limit
      if (user.favoritePets.length >= MAX_PET_LIST) {
        // Remove the oldest to make space
        user.favoritePets = user.favoritePets.slice(1 - MAX_PET_LIST);
      }
      user.favoritePets.push(petId);
      await user.save();
      return {
        message: 'Pet added to favorites',
        data: { isSaved: true },
      };
    } else {
      user.favoritePets.splice(index, 1);
      await user.save();
      return {
        message: 'Pet removed from favorites',
        data: { isSaved: false },
      };
    }
  } catch (error) {
    logger.error('Toggle favorite pet service error:', error);
    throw error;
  }
};

const getAllShelters = async (query) => {
  try {
    const shelters = await User.find({
      role: UserRoleEnum.SHELTER,
      ...ACTIVE_USER_QUERY,
    })
      .select(SHELTER_FIELDS)
      .lean();

    return shelters;
  } catch (error) {
    logger.error('Get shelters service error:', error);
    throw error;
  }
};

const getShelterProfileById = async (shelterId) => {
  try {
    const shelter = await User.findOne({
      _id: shelterId,
      role: UserRoleEnum.SHELTER,
      ...ACTIVE_USER_QUERY,
    })
      .select(SHELTER_FIELDS)
      .populate('pets', 'name type breed age gender photos')
      .populate('reviews', 'rating comment')
      .lean();

    if (!shelter) {
      throw ApiError.notFound('Shelter not found');
    }

    return shelter;
  } catch (error) {
    logger.error('Get shelter profile service error:', error);
    throw error;
  }
};

const addViewedPet = async (userId, petId) => {
  try {
    console.log('🔍 addViewedPet service called with:', { userId, petId });

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('❌ Invalid userId format:', userId);
      throw ApiError.badRequest('Invalid user ID format');
    }

    // Validate petId format
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      console.error('❌ Invalid petId format:', petId);
      throw ApiError.badRequest('Invalid pet ID format');
    }

    console.log('✅ ID validation passed');

    // Check if the pet exists in the database
    const pet = await Pet.findById(petId);
    if (!pet) {
      console.error('❌ Pet not found:', petId);
      throw ApiError.notFound('Pet not found');
    }

    console.log('✅ Pet found:', pet._id);

    // Use $addToSet for idempotent behavior - no duplicates will be added
    // Also use $push with $position: 0 to add to the beginning (most recent first)
    // and $slice to maintain the limit
    const result = await User.updateOne(
      { _id: userId, ...ACTIVE_USER_QUERY },
      {
        $addToSet: { viewedPets: petId },
        $push: {
          viewedPets: {
            $each: [petId],
            $position: 0,
            $slice: MAX_PET_LIST,
          },
        },
      }
    );

    if (result.matchedCount === 0) {
      console.error('❌ User not found:', userId);
      throw ApiError.notFound('User not found');
    }

    console.log('✅ User updated successfully with idempotent operation');

    // Return the updated viewedPets array
    const updatedUser = await User.findOne({
      _id: userId,
      ...ACTIVE_USER_QUERY,
    })
      .select('viewedPets')
      .lean();

    return updatedUser.viewedPets || [];
  } catch (error) {
    console.error('❌ Add viewed pet service error:', {
      error: error.message,
      stack: error.stack,
      userId,
      petId,
    });
    throw error;
  }
};

const getViewedPets = async (userId) => {
  try {
    const user = await User.findOne({ _id: userId, ...ACTIVE_USER_QUERY })
      .select('viewedPets')
      .populate('viewedPets', 'name type breed age gender photos')
      .lean();

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Handle case where viewedPets might be undefined/null
    if (!user.viewedPets || !Array.isArray(user.viewedPets)) {
      return [];
    }

    return user.viewedPets.map(transformPet);
  } catch (error) {
    logger.error('Get viewed pets service error:', error);
    throw error;
  }
};

const getAllUsers = async () => {
  try {
    const users = await User.find({ ...ACTIVE_USER_QUERY })
      .select(ADMIN_FIELDS)
      .lean();
    return users;
  } catch (error) {
    logger.error('Get all users service error:', error);
    throw error;
  }
};

const updateUser = async (userId, userData) => {
  try {
    const user = await User.findOne({ _id: userId, ...ACTIVE_USER_QUERY });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    Object.assign(user, userData);
    await user.save();

    return await User.findOne({ _id: userId, ...ACTIVE_USER_QUERY }).select(
      ADMIN_FIELDS
    );
  } catch (error) {
    logger.error('Update user service error:', error);
    throw error;
  }
};

const deleteUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Import required models for cascade deletion
    const { AdoptionRequest } = await import('../adoption/adoption.model.js');
    const { Review } = await import('../review/review.model.js');
    // Chat model removed - communication is now handled by separate app
    const { Notification } = await import(
      '../notification/notification.model.js'
    );
    const { ActivityLog } = await import('../activity/activity.model.js');
    const { Pet } = await import('../pet/pet.model.js');

    // Start a database transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Handle adoption requests
      // If user is an adopter, cancel their pending requests
      // If user is a shelter, transfer pets to another shelter or mark as unavailable
      const adoptionRequests = await AdoptionRequest.find({
        $or: [{ user: userId }, { shelter: userId }],
      }).session(session);

      for (const adoption of adoptionRequests) {
        if (adoption.user.toString() === userId) {
          // User is the adopter - cancel the request
          adoption.status = 'cancelled';
          adoption.timeline.push({
            status: 'cancelled',
            date: new Date(),
            note: 'Adoption request cancelled due to user account deletion',
            updatedBy: userId,
          });
          await adoption.save({ session });
        } else if (adoption.shelter.toString() === userId) {
          // User is the shelter - this is more complex
          // For now, we'll mark as cancelled, but in a real system you might want to transfer to another shelter
          adoption.status = 'cancelled';
          adoption.timeline.push({
            status: 'cancelled',
            date: new Date(),
            note: 'Adoption request cancelled due to shelter account deletion',
            updatedBy: userId,
          });
          await adoption.save({ session });
        }
      }

      // 2. Handle reviews
      // Soft delete reviews by the user or about the user's shelter
      await Review.updateMany(
        {
          $or: [{ user: userId }, { shelter: userId }],
        },
        {
          $set: {
            status: 'rejected',
            'response.comment': 'Review removed due to account deletion',
            'response.timestamp': new Date(),
          },
        },
        { session }
      );

      // 3. Chat functionality moved to separate communication app
      // No chat cleanup needed here

      // 4. Handle notifications
      // Delete all notifications for the user
      await Notification.deleteMany(
        {
          $or: [{ recipient: userId }, { sender: userId }],
        },
        { session }
      );

      // 5. Handle activity logs
      // Keep activity logs but anonymize the user references
      await ActivityLog.updateMany(
        { 'performedBy._id': userId },
        {
          $set: {
            'performedBy.name': '[Deleted User]',
            'performedBy.email': '[deleted@example.com]',
            description: (description) =>
              description.replace(/by .*/, 'by [Deleted User]'),
          },
        },
        { session }
      );

      // 6. Handle pets if user is a shelter
      if (user.role === 'shelter') {
        // Transfer pets to a default shelter or mark as unavailable
        const pets = await Pet.find({ shelter: userId }).session(session);

        for (const pet of pets) {
          pet.status = 'hidden';
          pet.description +=
            '\n\n[Note: This pet is temporarily unavailable due to shelter account changes.]';
          await pet.save({ session });
        }
      }

      // 7. Soft delete the user
      user.isActive = false;
      user.email = `deleted_${Date.now()}@deleted.com`;
      user.phone = null;
      user.name = '[Deleted User]';
      user.avatar = null;
      user.bio = null;
      user.location = null;
      user.preferences = null;
      user.favoritePets = [];
      user.viewedPets = [];
      user.deletedAt = new Date();
      user.deletedBy = userId; // Self-deletion
      user.deletionReason = 'user_requested';

      await user.save({ session });

      // Commit the transaction
      await session.commitTransaction();

      logger.info(`User ${userId} deleted successfully with cascade cleanup`);
      return {
        message:
          'User account and all related data have been deleted successfully',
        deletedAt: user.deletedAt,
      };
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      logger.error('User deletion transaction failed:', error);
      throw error;
    } finally {
      // End the session
      session.endSession();
    }
  } catch (error) {
    logger.error('Delete user service error:', error);
    throw error;
  }
};

const getMultipleUserProfiles = async (userIds) => {
  try {
    // Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw ApiError.badRequest(
        'userIds array is required and must not be empty'
      );
    }

    // Limit the number of user IDs to prevent abuse
    if (userIds.length > 100) {
      throw ApiError.badRequest('Maximum 100 user IDs allowed per request');
    }

    // Find users by IDs (only active users)
    const users = await User.find({
      _id: { $in: userIds },
      ...ACTIVE_USER_QUERY,
    })
      .select(PUBLIC_FIELDS)
      .lean();

    // Transform users to include id field for frontend compatibility
    const transformedUsers = users.map((user) => ({
      ...user,
      id: user._id,
      _id: undefined,
    }));

    return transformedUsers;
  } catch (error) {
    logger.error('Get multiple user profiles service error:', error);
    throw error;
  }
};

export default {
  registerUser,
  loginUser,
  manualVerifyUser,
  resendUserVerification,
  forgotUserPassword,
  resetUserPassword,
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  updateUserPreferences,
  updateUserLocation,
  changeUserPassword,
  updateUserAddress,
  updateSecuritySettings,
  getFavoritePets,
  toggleFavoritePet,
  getAllShelters,
  getShelterProfileById,
  addViewedPet,
  getViewedPets,
  getAllUsers,
  updateUser,
  deleteUser,
  getMultipleUserProfiles,
};
