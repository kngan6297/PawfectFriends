import { asyncHandler } from '../../middleware/async.js';
import { ApiError } from '../../utils/errors.js';
import { User } from '../user/user.model.js';
import { Pet } from '../pet/pet.model.js';
import { AdoptionRequest } from '../adoption/adoption.model.js';
import { Review } from '../review/review.model.js';
import shelterService from './shelter.service.js';
import logger from '../../utils/logger.js';
import {
  logSecurityEvent,
  SecurityEventType,
} from '../../utils/securityLogger.js';
import { UserRoleEnum } from '../user/user.types.js';

export const getAllShelters = asyncHandler(async (req, res) => {
  const shelters = await User.find({ role: UserRoleEnum.SHELTER }).select(
    '-password -emailVerificationToken -resetPasswordToken'
  );

  // Fetch pets and reviews for all shelters
  const sheltersWithData = await Promise.all(
    shelters.map(async (shelter) => {
      const [pets, reviews] = await Promise.all([
        Pet.find({ shelter: shelter._id }).select('name type breed age status'),
        Review.find({ shelter: shelter._id }).select('rating comment'),
      ]);

      return {
        ...shelter.toObject(),
        pets,
        reviews,
      };
    })
  );

  res.json({
    status: 'success',
    data: sheltersWithData,
  });
});

export const getShelterById = asyncHandler(async (req, res) => {
  const shelter = await User.findOne({
    _id: req.params.id,
    role: UserRoleEnum.SHELTER,
  }).select('-password -emailVerificationToken -resetPasswordToken');

  if (!shelter) {
    throw new ApiError.notFound('Shelter not found');
  }

  // Fetch pets and reviews separately since they're not stored in User model
  const [pets, reviews] = await Promise.all([
    Pet.find({ shelter: req.params.id }).select(
      'name type breed age status photos'
    ),
    Review.find({ shelter: req.params.id }).select('rating comment createdAt'),
  ]);

  // Add pets and reviews to the shelter object
  const shelterWithData = {
    ...shelter.toObject(),
    pets,
    reviews,
  };

  res.json({
    status: 'success',
    data: shelterWithData,
  });
});

export const updateShelterProfile = asyncHandler(async (req, res) => {
  // Check if user is trying to update their own profile or is an admin
  const targetShelterId = req.params.id || req.user._id;

  // Only allow shelter owners to update their own profile, or admins to update any shelter
  if (
    req.user.role !== UserRoleEnum.ADMIN &&
    req.user._id.toString() !== targetShelterId.toString()
  ) {
    throw new ApiError.forbidden(
      'You can only update your own shelter profile'
    );
  }

  // Verify the target shelter exists and is actually a shelter
  const targetShelter = await User.findOne({
    _id: targetShelterId,
    role: UserRoleEnum.SHELTER,
  });

  if (!targetShelter) {
    throw new ApiError.notFound('Shelter not found');
  }

  const shelter = await User.findByIdAndUpdate(
    targetShelterId,
    { $set: req.body },
    { new: true, runValidators: true }
  ).select('-password -emailVerificationToken -resetPasswordToken');

  if (!shelter) {
    throw new ApiError.notFound('Shelter not found');
  }

  logSecurityEvent(SecurityEventType.SHELTER.PROFILE_UPDATED, {
    userId: req.user._id,
    shelterId: targetShelterId,
    updatedBy: req.user.role === UserRoleEnum.ADMIN ? 'admin' : 'shelter_owner',
  });

  res.json({
    status: 'success',
    data: shelter,
  });
});

export const getShelterStats = asyncHandler(async (req, res) => {
  const stats = await shelterService.getShelterStats(req.user._id);

  res.json({
    status: 'success',
    data: stats,
  });
});

export const getDetailedReports = asyncHandler(async (req, res) => {
  const { reportType, startDate, endDate } = req.query;

  const report = await shelterService.getDetailedReports(req.user._id, {
    reportType,
    startDate,
    endDate,
  });

  res.json({
    status: 'success',
    data: report,
  });
});

export const searchShelters = asyncHandler(async (req, res) => {
  const { query, location, type } = req.query;
  const searchQuery = { role: UserRoleEnum.SHELTER };

  if (query) {
    searchQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { 'shelter.bio': { $regex: query, $options: 'i' } },
    ];
  }

  if (location) {
    searchQuery.$or = searchQuery.$or || [];
    searchQuery.$or.push({
      'shelter.location.city': { $regex: location, $options: 'i' },
    });
  }

  const shelters = await User.find(searchQuery)
    .select('-password -emailVerificationToken -resetPasswordToken')
    .populate('pets', 'name type breed age status')
    .limit(20);

  res.json({
    status: 'success',
    data: shelters,
  });
});

export const getShelterDashboard = asyncHandler(async (req, res) => {
  const shelterId = req.user._id;

  // Ensure shelterId is an ObjectId
  const mongoose = await import('mongoose');
  const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
    ? new mongoose.Types.ObjectId(shelterId)
    : shelterId;

  const stats = await shelterService.getShelterStats(objectIdShelterId);

  const response = {
    status: 'success',
    data: {
      stats,
      recentPets: stats.recentActivity.recentPets,
      pendingRequests: stats.recentActivity.recentRequests,
      upcomingMeetings: [], // TODO: Implement meetings functionality
      recentReviews: stats.recentActivity.recentReviews,
    },
  };

  res.status(200).json(response);
});

export const getShelterAnalytics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  const shelterId = req.user._id;

  // Calculate date range based on period
  const now = new Date();
  let startDate;

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const analytics = await shelterService.getDetailedTrendAnalytics(shelterId, {
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
    period,
  });

  res.json({
    status: 'success',
    data: analytics,
  });
});

export const getRejectionReasonsAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, period = '30d' } = req.query;
  const shelterId = req.user._id;

  const analytics = await shelterService.getRejectionReasonsAnalytics(
    shelterId,
    {
      startDate,
      endDate,
      period,
    }
  );

  res.json({
    status: 'success',
    data: analytics,
  });
});

// New trend analysis endpoints
export const getAdoptionTrends = asyncHandler(async (req, res) => {
  const shelterId = req.user._id;
  const { startDate, endDate, groupBy = 'month', period = '30d' } = req.query;

  // If no specific dates provided, use period
  let dateRange = {};
  if (startDate && endDate) {
    dateRange = { startDate, endDate };
  } else {
    const now = new Date();
    let calculatedStartDate;

    switch (period) {
      case '7d':
        calculatedStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        calculatedStartDate = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        break;
      case '90d':
        calculatedStartDate = new Date(
          now.getTime() - 90 * 24 * 60 * 60 * 1000
        );
        break;
      case '1y':
        calculatedStartDate = new Date(
          now.getTime() - 365 * 24 * 60 * 60 * 1000
        );
        break;
      default:
        calculatedStartDate = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
    }
    dateRange = {
      startDate: calculatedStartDate.toISOString(),
      endDate: now.toISOString(),
    };
  }

  const trends = await shelterService.getAdoptionTrends(shelterId, {
    ...dateRange,
    groupBy,
  });

  res.json({
    status: 'success',
    data: trends,
  });
});

export const getAdoptionRatesByAttributes = asyncHandler(async (req, res) => {
  const shelterId = req.user._id;
  const { startDate, endDate, period = '30d' } = req.query;

  // If no specific dates provided, use period
  let dateRange = {};
  if (startDate && endDate) {
    dateRange = { startDate, endDate };
  } else {
    const now = new Date();
    let calculatedStartDate;

    switch (period) {
      case '7d':
        calculatedStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        calculatedStartDate = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        break;
      case '90d':
        calculatedStartDate = new Date(
          now.getTime() - 90 * 24 * 60 * 60 * 1000
        );
        break;
      case '1y':
        calculatedStartDate = new Date(
          now.getTime() - 365 * 24 * 60 * 60 * 1000
        );
        break;
      default:
        calculatedStartDate = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
    }
    dateRange = {
      startDate: calculatedStartDate.toISOString(),
      endDate: now.toISOString(),
    };
  }

  const rates = await shelterService.getAdoptionRatesByAttributes(
    shelterId,
    dateRange
  );

  res.json({
    status: 'success',
    data: rates,
  });
});

export const getTimeToAdoptionStats = asyncHandler(async (req, res) => {
  const shelterId = req.user._id;
  const { startDate, endDate, period = '30d' } = req.query;

  // If no specific dates provided, use period
  let dateRange = {};
  if (startDate && endDate) {
    dateRange = { startDate, endDate };
  } else {
    const now = new Date();
    let calculatedStartDate;

    switch (period) {
      case '7d':
        calculatedStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        calculatedStartDate = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        break;
      case '90d':
        calculatedStartDate = new Date(
          now.getTime() - 90 * 24 * 60 * 60 * 1000
        );
        break;
      case '1y':
        calculatedStartDate = new Date(
          now.getTime() - 365 * 24 * 60 * 60 * 1000
        );
        break;
      default:
        calculatedStartDate = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
    }
    dateRange = {
      startDate: calculatedStartDate.toISOString(),
      endDate: now.toISOString(),
    };
  }

  const timeStats = await shelterService.getTimeToAdoptionStats(
    shelterId,
    dateRange
  );

  res.json({
    status: 'success',
    data: timeStats,
  });
});

export const getDetailedTrendAnalytics = asyncHandler(async (req, res) => {
  const shelterId = req.user._id;
  const { startDate, endDate, period = '30d', groupBy = 'month' } = req.query;

  // If no specific dates provided, use period
  let dateRange = {};
  if (startDate && endDate) {
    dateRange = { startDate, endDate };
  } else {
    const now = new Date();
    let calculatedStartDate;

    switch (period) {
      case '7d':
        calculatedStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        calculatedStartDate = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        break;
      case '90d':
        calculatedStartDate = new Date(
          now.getTime() - 90 * 24 * 60 * 60 * 1000
        );
        break;
      case '1y':
        calculatedStartDate = new Date(
          now.getTime() - 365 * 24 * 60 * 60 * 1000
        );
        break;
      default:
        calculatedStartDate = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
    }
    dateRange = {
      startDate: calculatedStartDate.toISOString(),
      endDate: now.toISOString(),
    };
  }

  const analytics = await shelterService.getDetailedTrendAnalytics(shelterId, {
    ...dateRange,
    groupBy,
  });

  res.json({
    status: 'success',
    data: analytics,
  });
});

export const incrementProfileViews = asyncHandler(async (req, res) => {
  const { shelterId } = req.params;
  const clientIP = req.ip;
  const userAgent = req.get('User-Agent');
  const sessionId = req.sessionID || req.ip; // Use session ID if available, fallback to IP

  // Additional spam prevention checks
  const result = await shelterService.incrementProfileViews(shelterId, {
    clientIP,
    userAgent,
    sessionId,
    timestamp: new Date(),
  });

  res.json({
    status: 'success',
    data: result,
  });
});

export const shelterController = {
  getAllShelters,
  getShelterById,
  updateShelterProfile,
  getShelterStats,
  getDetailedReports,
  searchShelters,
  getShelterDashboard,
  getShelterAnalytics,
  getAdoptionTrends,
  getAdoptionRatesByAttributes,
  getTimeToAdoptionStats,
  getDetailedTrendAnalytics,
  getRejectionReasonsAnalytics,
  incrementProfileViews,
};
