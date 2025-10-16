import userService from './user.service.js';
import logger from '../../utils/logger.js';
import { uploadToCloudinary } from '../../utils/fileStorage.js';
import { ApiError } from '../../utils/errors.js';
import { logUserActivity } from '../../utils/activityLogger.js';

// =============================================
// User Profile Actions
// =============================================

export const handleCreateProfile = async (req, res) => {
  try {
    const result = await userService.createUserProfile(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Create profile error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const handleGetProfile = async (req, res) => {
  try {
    const result = await userService.getUserProfile(req.user._id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const handleUpdateProfile = async (req, res) => {
  try {
    const result = await userService.updateUserProfile(req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const handleUpdatePreferences = async (req, res) => {
  try {
    const result = await userService.updateUserPreferences(
      req.user._id,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const handleUpdateLocation = async (req, res) => {
  try {
    const result = await userService.updateUserLocation(req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Update location error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const handleGetFavoritePets = async (req, res) => {
  try {
    const result = await userService.getFavoritePets(req.user._id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get favorite pets error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const handleToggleFavoritePet = async (req, res) => {
  try {
    const result = await userService.toggleFavoritePet(
      req.user._id,
      req.params.petId
    );
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error('Toggle favorite pet error:', error);

    // Handle different error types
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === 'BadRequestError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const handleGetShelters = async (req, res) => {
  try {
    const result = await userService.getAllShelters(req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get shelters error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const handleGetShelterProfile = async (req, res) => {
  try {
    const result = await userService.getShelterProfileById(
      req.params.shelterId
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get shelter profile error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const handleAddViewedPet = async (req, res) => {
  try {
    // Debug logging
    console.log('🔍 handleAddViewedPet called with:', {
      userId: req.user?._id,
      petId: req.params.petId,
      userExists: !!req.user,
      headers: req.headers,
      method: req.method,
      url: req.url,
    });

    // Validate user exists
    if (!req.user || !req.user._id) {
      console.error('❌ User not found in request:', req.user);
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Validate petId format
    if (!req.params.petId || req.params.petId.length !== 24) {
      console.error('❌ Invalid petId format:', req.params.petId);
      return res.status(400).json({
        success: false,
        message: 'Invalid pet ID format',
      });
    }

    const result = await userService.addViewedPet(
      req.user._id,
      req.params.petId
    );

    console.log('✅ handleAddViewedPet success:', result);
    res.status(200).json({
      success: true,
      message: 'Pet added to viewed history (or already present)',
      data: result,
    });
  } catch (error) {
    console.error('❌ Add viewed pet error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      petId: req.params.petId,
    });
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const handleGetViewedPets = async (req, res) => {
  try {
    const result = await userService.getViewedPets(req.user._id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get viewed pets error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================================
// Avatar Upload Actions
// =============================================

export const handleUploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      throw new ApiError('No file uploaded', 400);
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file, {
      folder: 'avatars',
      transformation: [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto' },
      ],
    });

    // Update user profile with new avatar URL
    const updatedUser = await userService.updateUserProfile(req.user._id, {
      avatar: uploadResult.secure_url,
    });

    // Log activity
    await logUserActivity(req.user, 'avatar_updated', req, updatedUser, {
      avatarUrl: uploadResult.secure_url,
    });

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl: uploadResult.secure_url,
        user: updatedUser,
      },
    });
  } catch (error) {
    logger.error('Upload avatar error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to upload avatar',
    });
  }
};

export const handleDeleteAvatar = async (req, res) => {
  try {
    // Update user profile to remove avatar
    const updatedUser = await userService.updateUserProfile(req.user._id, {
      avatar: '',
    });

    // Log activity
    await logUserActivity(req.user, 'avatar_deleted', req, updatedUser);

    res.status(200).json({
      success: true,
      message: 'Avatar removed successfully',
      data: updatedUser,
    });
  } catch (error) {
    logger.error('Delete avatar error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove avatar',
    });
  }
};

// =============================================
// Password Management Actions
// =============================================

export const handleChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await userService.changeUserPassword(
      req.user._id,
      currentPassword,
      newPassword
    );
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================================
// Enhanced Profile Management Actions
// =============================================

export const handleUpdateAddress = async (req, res) => {
  try {
    const result = await userService.updateUserAddress(req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Update address error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const handleUpdateSecuritySettings = async (req, res) => {
  try {
    const result = await userService.updateSecuritySettings(
      req.user._id,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Security settings updated successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Update security settings error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const handleGetMultipleUserProfiles = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds array is required and must not be empty',
      });
    }

    // Limit the number of user IDs to prevent abuse
    if (userIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 user IDs allowed per request',
      });
    }

    const result = await userService.getMultipleUserProfiles(userIds);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get multiple user profiles error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
