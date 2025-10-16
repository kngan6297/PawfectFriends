import { ApiError } from '../../utils/errors.js';
import { User } from '../user/user.model.js';
import { Pet } from '../pet/pet.model.js';
import { AdoptionRequest } from '../adoption/adoption.model.js';
import { Review } from '../review/review.model.js';
import logger from '../../utils/logger.js';

class ShelterService {
  async incrementProfileViews(shelterId, trackingData = {}) {
    try {
      const mongoose = await import('mongoose');
      const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
        ? new mongoose.Types.ObjectId(shelterId)
        : shelterId;

      // Note: Redis caching removed - duplicate view checking disabled
      // In production, consider implementing alternative caching solution

      // Verify shelter exists
      const shelter = await User.findOne({
        _id: objectIdShelterId,
        role: 'shelter',
      });
      if (!shelter) {
        throw ApiError.notFound('Shelter not found');
      }

      // Increment the view count
      const result = await User.findOneAndUpdate(
        { _id: objectIdShelterId, role: 'shelter' },
        { $inc: { profileViews: 1 } },
        { new: true, select: 'profileViews' }
      );

      // Cache this view for 24 hours to prevent duplicate views
      try {
        await cache.default.setex(
          cacheKey,
          24 * 60 * 60,
          JSON.stringify({
            timestamp: new Date(),
            userAgent: trackingData.userAgent,
            sessionId: trackingData.sessionId,
          })
        );
      } catch (cacheError) {
        logger.warn('Failed to cache view data:', cacheError.message);
      }

      // Log the view for analytics
      logger.info(
        `Profile view incremented for shelter ${shelterId} from IP ${trackingData.clientIP}`,
        {
          shelterId,
          clientIP: trackingData.clientIP,
          userAgent: trackingData.userAgent,
          sessionId: trackingData.sessionId,
          timestamp: trackingData.timestamp,
        }
      );

      return {
        profileViews: result.profileViews,
        message: 'View recorded successfully',
      };
    } catch (error) {
      logger.error('Error incrementing profile views:', error);
      throw error;
    }
  }

  async getShelterStats(shelterId) {
    try {
      const [petStats, adoptionStats, reviewStats, recentActivity] =
        await Promise.all([
          this.getPetStatistics(shelterId),
          this.getAdoptionStatistics(shelterId),
          this.getReviewStatistics(shelterId),
          this.getRecentActivity(shelterId),
        ]);

      return {
        petStats,
        adoptionStats,
        reviewStats,
        recentActivity,
      };
    } catch (error) {
      logger.error('Error getting shelter stats:', error);
      throw error;
    }
  }

  async getPetStatistics(shelterId) {
    // Ensure shelterId is an ObjectId
    const mongoose = await import('mongoose');
    const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
      ? new mongoose.Types.ObjectId(shelterId)
      : shelterId;

    const stats = await Pet.aggregate([
      { $match: { shelter: objectIdShelterId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgViews: { $avg: '$views' },
        },
      },
    ]);

    const totalPets = await Pet.countDocuments({ shelter: objectIdShelterId });
    const topPets = await Pet.find({ shelter: objectIdShelterId })
      .sort({ views: -1 })
      .limit(5)
      .select('name type breed age views status');

    const monthlyStats = await Pet.aggregate([
      { $match: { shelter: objectIdShelterId } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    return {
      total: totalPets,
      byStatus: stats.reduce((acc, curr) => {
        acc[curr._id] = { count: curr.count, avgViews: curr.avgViews };
        return acc;
      }, {}),
      topPets,
      monthlyStats,
    };
  }

  async getAdoptionStatistics(shelterId) {
    try {
      // Ensure shelterId is an ObjectId
      const mongoose = await import('mongoose');
      const isValidObjectId = mongoose.Types.ObjectId.isValid(shelterId);

      const objectIdShelterId = isValidObjectId
        ? new mongoose.Types.ObjectId(shelterId)
        : shelterId;

      // Get total adoption requests for this shelter
      const totalRequests = await AdoptionRequest.countDocuments({
        shelter: objectIdShelterId,
      });

      // Get sample adoption requests for debugging
      const sampleRequests = await AdoptionRequest.find({
        shelter: objectIdShelterId,
      })
        .select('_id status shelter')
        .limit(5);

      // Aggregate adoption requests by status
      const stats = await AdoptionRequest.aggregate([
        { $match: { shelter: objectIdShelterId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgProcessingTime: {
              $avg: {
                $cond: [
                  { $in: ['$status', ['approved', 'rejected', 'completed']] },
                  {
                    $divide: [
                      { $subtract: ['$updatedAt', '$createdAt'] },
                      1000 * 60 * 60 * 24, // Convert to days
                    ],
                  },
                  null,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Calculate success rate (approved + completed) / total
      const successRate = await AdoptionRequest.aggregate([
        { $match: { shelter: objectIdShelterId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [{ $in: ['$status', ['approved', 'completed']] }, 1, 0],
              },
            },
          },
        },
      ]);

      // Get monthly adoption trends
      const monthlyAdoptions = await AdoptionRequest.aggregate([
        { $match: { shelter: objectIdShelterId } },
        {
          $match: {
            status: { $in: ['approved', 'completed'] },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]);

      // Calculate average processing time
      const processingTimeStats = await AdoptionRequest.aggregate([
        { $match: { shelter: objectIdShelterId } },
        {
          $match: {
            status: { $in: ['approved', 'rejected', 'completed'] },
          },
        },
        {
          $group: {
            _id: null,
            avgProcessingTime: {
              $avg: {
                $divide: [
                  { $subtract: ['$updatedAt', '$createdAt'] },
                  1000 * 60 * 60 * 24, // Convert to days
                ],
              },
            },
          },
        },
      ]);

      const result = {
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            avgProcessingTime: stat.avgProcessingTime,
          };
          return acc;
        }, {}),
        successRate:
          successRate.length > 0 && successRate[0].total > 0
            ? ((successRate[0].completed / successRate[0].total) * 100).toFixed(
                1
              )
            : '0.0',
        monthlyAdoptions,
        avgProcessingTime:
          processingTimeStats.length > 0
            ? Math.round(processingTimeStats[0].avgProcessingTime || 0)
            : 0,
      };

      return result;
    } catch (error) {
      console.error('Error getting adoption statistics:', error);
      throw error;
    }
  }

  async getReviewStatistics(shelterId) {
    // Ensure shelterId is an ObjectId
    const mongoose = await import('mongoose');
    const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
      ? new mongoose.Types.ObjectId(shelterId)
      : shelterId;

    const stats = await Review.aggregate([
      { $match: { shelter: objectIdShelterId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating',
          },
        },
      },
    ]);

    const ratingBreakdown = await Review.aggregate([
      { $match: { shelter: objectIdShelterId } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const recentReviews = await Review.find({ shelter: objectIdShelterId })
      .populate('user', 'name avatar')
      .populate({
        path: 'adoption',
        populate: {
          path: 'pet',
          select: 'name photos type breed age',
        },
      })
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      total: stats[0]?.total || 0,
      avgRating: stats[0]?.avgRating || 0,
      ratingBreakdown,
      recentReviews,
    };
  }

  async getRecentActivity(shelterId) {
    // Ensure shelterId is an ObjectId
    const mongoose = await import('mongoose');
    const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
      ? new mongoose.Types.ObjectId(shelterId)
      : shelterId;

    const [recentPets, recentRequests, recentReviews] = await Promise.all([
      Pet.find({ shelter: objectIdShelterId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name type breed status createdAt'),
      AdoptionRequest.find({ shelter: objectIdShelterId })
        .populate('user', 'name')
        .populate('pet', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('status applicationDate'),
      Review.find({ shelter: objectIdShelterId })
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('rating comment createdAt'),
    ]);

    return {
      recentPets,
      recentRequests,
      recentReviews,
    };
  }

  async getDetailedReports(shelterId, filters = {}) {
    const { startDate, endDate, reportType } = filters;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    switch (reportType) {
      case 'adoption_success':
        return await this.getAdoptionSuccessReport(shelterId, dateFilter);
      case 'pet_performance':
        return await this.getPetPerformanceReport(shelterId, dateFilter);
      case 'user_engagement':
        return await this.getUserEngagementReport(shelterId, dateFilter);
      case 'financial':
        return await this.getFinancialReport(shelterId, dateFilter);
      default:
        throw new ApiError.badRequest('Invalid report type');
    }
  }

  async getAdoptionSuccessReport(shelterId, dateFilter) {
    // Ensure shelterId is an ObjectId
    const mongoose = await import('mongoose');
    const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
      ? new mongoose.Types.ObjectId(shelterId)
      : shelterId;

    const pipeline = [
      { $match: { shelter: objectIdShelterId, ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$applicationDate' },
            month: { $month: '$applicationDate' },
          },
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $in: ['$status', ['approved', 'completed']] }, 1, 0],
            },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
    ];

    const monthlyStats = await AdoptionRequest.aggregate(pipeline);

    return {
      type: 'adoption_success',
      monthlyStats,
      summary: {
        total: monthlyStats.reduce((sum, stat) => sum + stat.total, 0),
        completed: monthlyStats.reduce((sum, stat) => sum + stat.completed, 0),
        rejected: monthlyStats.reduce((sum, stat) => sum + stat.rejected, 0),
      },
    };
  }

  async getPetPerformanceReport(shelterId, dateFilter) {
    // Ensure shelterId is an ObjectId
    const mongoose = await import('mongoose');
    const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
      ? new mongoose.Types.ObjectId(shelterId)
      : shelterId;

    const pipeline = [
      { $match: { shelter: objectIdShelterId, ...dateFilter } },
      {
        $lookup: {
          from: 'adoptionrequests',
          localField: '_id',
          foreignField: 'pet',
          as: 'requests',
        },
      },
      {
        $addFields: {
          requestCount: { $size: '$requests' },
          completedAdoptions: {
            $size: {
              $filter: {
                input: '$requests',
                cond: { $in: ['$$this.status', ['approved', 'completed']] },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: '$type',
          totalPets: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalRequests: { $sum: '$requestCount' },
          totalAdoptions: { $sum: '$completedAdoptions' },
          avgViews: { $avg: '$views' },
        },
      },
    ];

    const typeStats = await Pet.aggregate(pipeline);

    return {
      type: 'pet_performance',
      byType: typeStats,
      summary: {
        totalPets: typeStats.reduce((sum, stat) => sum + stat.totalPets, 0),
        totalViews: typeStats.reduce((sum, stat) => sum + stat.totalViews, 0),
        totalRequests: typeStats.reduce(
          (sum, stat) => sum + stat.totalRequests,
          0
        ),
        totalAdoptions: typeStats.reduce(
          (sum, stat) => sum + stat.totalAdoptions,
          0
        ),
      },
    };
  }

  async getUserEngagementReport(shelterId, dateFilter) {
    // Ensure shelterId is an ObjectId
    const mongoose = await import('mongoose');
    const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
      ? new mongoose.Types.ObjectId(shelterId)
      : shelterId;

    const pipeline = [
      { $match: { shelter: objectIdShelterId, ...dateFilter } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $group: {
          _id: '$user',
          requestCount: { $sum: 1 },
          completedAdoptions: {
            $sum: {
              $cond: [{ $in: ['$status', ['approved', 'completed']] }, 1, 0],
            },
          },
          userInfo: { $first: '$userInfo' },
        },
      },
      { $sort: { requestCount: -1 } },
      { $limit: 10 },
    ];

    const topUsers = await AdoptionRequest.aggregate(pipeline);

    return {
      type: 'user_engagement',
      topUsers,
      summary: {
        totalUniqueUsers: topUsers.length,
        avgRequestsPerUser:
          topUsers.reduce((sum, user) => sum + user.requestCount, 0) /
          topUsers.length,
      },
    };
  }

  async getFinancialReport(shelterId, dateFilter) {
    // Ensure shelterId is an ObjectId
    const mongoose = await import('mongoose');
    const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
      ? new mongoose.Types.ObjectId(shelterId)
      : shelterId;

    const pipeline = [
      {
        $match: {
          shelter: objectIdShelterId,
          status: { $in: ['approved', 'completed'] },
          ...dateFilter,
        },
      },
      {
        $lookup: {
          from: 'pets',
          localField: 'pet',
          foreignField: '_id',
          as: 'petData',
        },
      },
      {
        $unwind: '$petData',
      },
      {
        $group: {
          _id: {
            year: { $year: '$decisionDate' },
            month: { $month: '$decisionDate' },
          },
          totalRevenue: { $sum: '$petData.adoptionFee' },
          adoptionCount: { $sum: 1 },
          avgFee: { $avg: '$petData.adoptionFee' },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
    ];

    const monthlyRevenue = await AdoptionRequest.aggregate(pipeline);

    const totalRevenue = monthlyRevenue.reduce(
      (sum, month) => sum + month.totalRevenue,
      0
    );

    return {
      type: 'financial',
      monthlyRevenue,
      totalRevenue,
      summary: {
        totalAdoptions: monthlyRevenue.reduce(
          (sum, month) => sum + month.adoptionCount,
          0
        ),
        avgMonthlyRevenue:
          monthlyRevenue.length > 0 ? totalRevenue / monthlyRevenue.length : 0,
      },
    };
  }

  // New methods for trend analysis
  async getAdoptionTrends(shelterId, filters = {}) {
    const mongoose = await import('mongoose');
    const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
      ? new mongoose.Types.ObjectId(shelterId)
      : shelterId;

    const {
      period = 'monthly',
      startDate,
      endDate,
      groupBy = 'month',
    } = filters;

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.decisionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Determine grouping based on period
    let groupStage;
    switch (groupBy) {
      case 'week':
        groupStage = {
          _id: {
            year: { $year: '$decisionDate' },
            week: { $week: '$decisionDate' },
          },
        };
        break;
      case 'day':
        groupStage = {
          _id: {
            year: { $year: '$decisionDate' },
            month: { $month: '$decisionDate' },
            day: { $dayOfMonth: '$decisionDate' },
          },
        };
        break;
      default: // monthly
        groupStage = {
          _id: {
            year: { $year: '$decisionDate' },
            month: { $month: '$decisionDate' },
          },
        };
    }

    const adoptionTrends = await AdoptionRequest.aggregate([
      {
        $match: {
          shelter: objectIdShelterId,
          status: { $in: ['approved', 'completed'] },
          decisionDate: { $exists: true },
          ...dateFilter,
        },
      },
      {
        $lookup: {
          from: 'pets',
          localField: 'pet',
          foreignField: '_id',
          as: 'petData',
        },
      },
      {
        $unwind: '$petData',
      },
      {
        $group: {
          ...groupStage,
          count: { $sum: 1 },
          avgProcessingTime: {
            $avg: {
              $divide: [
                { $subtract: ['$decisionDate', '$applicationDate'] },
                1000 * 60 * 60 * 24, // Convert to days
              ],
            },
          },
          byType: {
            $push: {
              type: '$petData.type',
              breed: '$petData.breed',
              age: '$petData.age',
            },
          },
        },
      },
      {
        $addFields: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: { $ifNull: ['$_id.day', 1] },
            },
          },
        },
      },
      { $sort: { date: 1 } },
    ]);

    return {
      trends: adoptionTrends,
      summary: {
        totalAdoptions: adoptionTrends.reduce(
          (sum, item) => sum + item.count,
          0
        ),
        avgProcessingTime:
          adoptionTrends.length > 0
            ? adoptionTrends.reduce(
                (sum, item) => sum + item.avgProcessingTime,
                0
              ) / adoptionTrends.length
            : 0,
      },
    };
  }

  async getAdoptionRatesByAttributes(shelterId, filters = {}) {
    const mongoose = await import('mongoose');
    const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
      ? new mongoose.Types.ObjectId(shelterId)
      : shelterId;

    const { startDate, endDate } = filters;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.decisionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Adoption rates by pet type
    const byType = await AdoptionRequest.aggregate([
      {
        $match: {
          shelter: objectIdShelterId,
          status: { $in: ['approved', 'completed'] },
          decisionDate: { $exists: true },
          ...dateFilter,
        },
      },
      {
        $lookup: {
          from: 'pets',
          localField: 'pet',
          foreignField: '_id',
          as: 'petData',
        },
      },
      {
        $unwind: '$petData',
      },
      {
        $group: {
          _id: '$petData.type',
          adoptions: { $sum: 1 },
          avgProcessingTime: {
            $avg: {
              $divide: [
                { $subtract: ['$decisionDate', '$applicationDate'] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
      },
    ]);

    // Adoption rates by breed
    const byBreed = await AdoptionRequest.aggregate([
      {
        $match: {
          shelter: objectIdShelterId,
          status: { $in: ['approved', 'completed'] },
          decisionDate: { $exists: true },
          ...dateFilter,
        },
      },
      {
        $lookup: {
          from: 'pets',
          localField: 'pet',
          foreignField: '_id',
          as: 'petData',
        },
      },
      {
        $unwind: '$petData',
      },
      {
        $group: {
          _id: '$petData.breed',
          adoptions: { $sum: 1 },
          avgProcessingTime: {
            $avg: {
              $divide: [
                { $subtract: ['$decisionDate', '$applicationDate'] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
      },
      { $sort: { adoptions: -1 } },
      { $limit: 10 },
    ]);

    // Adoption rates by age
    const byAge = await AdoptionRequest.aggregate([
      {
        $match: {
          shelter: objectIdShelterId,
          status: { $in: ['approved', 'completed'] },
          decisionDate: { $exists: true },
          ...dateFilter,
        },
      },
      {
        $lookup: {
          from: 'pets',
          localField: 'pet',
          foreignField: '_id',
          as: 'petData',
        },
      },
      {
        $unwind: '$petData',
      },
      {
        $group: {
          _id: '$petData.age',
          adoptions: { $sum: 1 },
          avgProcessingTime: {
            $avg: {
              $divide: [
                { $subtract: ['$decisionDate', '$applicationDate'] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
      },
    ]);

    return {
      byType,
      byBreed,
      byAge,
    };
  }

  async getTimeToAdoptionStats(shelterId, filters = {}) {
    const mongoose = await import('mongoose');
    const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
      ? new mongoose.Types.ObjectId(shelterId)
      : shelterId;

    const { startDate, endDate } = filters;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.decisionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const timeStats = await AdoptionRequest.aggregate([
      {
        $match: {
          shelter: objectIdShelterId,
          status: { $in: ['approved', 'completed'] },
          decisionDate: { $exists: true },
          applicationDate: { $exists: true },
          ...dateFilter,
        },
      },
      {
        $addFields: {
          processingDays: {
            $divide: [
              { $subtract: ['$decisionDate', '$applicationDate'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgTimeToAdoption: { $avg: '$processingDays' },
          medianTimeToAdoption: { $avg: '$processingDays' }, // MongoDB doesn't have median, using avg as approximation
          minTimeToAdoption: { $min: '$processingDays' },
          maxTimeToAdoption: { $max: '$processingDays' },
          totalAdoptions: { $sum: 1 },
        },
      },
    ]);

    // Time distribution buckets
    const timeDistribution = await AdoptionRequest.aggregate([
      {
        $match: {
          shelter: objectIdShelterId,
          status: { $in: ['approved', 'completed'] },
          decisionDate: { $exists: true },
          applicationDate: { $exists: true },
          ...dateFilter,
        },
      },
      {
        $addFields: {
          processingDays: {
            $divide: [
              { $subtract: ['$decisionDate', '$applicationDate'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
      {
        $bucket: {
          groupBy: '$processingDays',
          boundaries: [0, 7, 14, 30, 60, 90, 120],
          default: '120+',
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    return {
      summary: timeStats[0] || {
        avgTimeToAdoption: 0,
        medianTimeToAdoption: 0,
        minTimeToAdoption: 0,
        maxTimeToAdoption: 0,
        totalAdoptions: 0,
      },
      timeDistribution,
    };
  }

  async getDetailedTrendAnalytics(shelterId, filters = {}) {
    const [trends, ratesByAttributes, timeStats] = await Promise.all([
      this.getAdoptionTrends(shelterId, filters),
      this.getAdoptionRatesByAttributes(shelterId, filters),
      this.getTimeToAdoptionStats(shelterId, filters),
    ]);

    return {
      trends,
      ratesByAttributes,
      timeStats,
    };
  }

  async getRejectionReasonsAnalytics(shelterId, filters = {}) {
    try {
      // console.log('🔍 getRejectionReasonsAnalytics called with:', {
      //   shelterId,
      //   filters,
      // });

      // Ensure shelterId is an ObjectId
      const mongoose = await import('mongoose');
      const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
        ? new mongoose.Types.ObjectId(shelterId)
        : shelterId;
      // console.log('🔍 ObjectId shelterId:', objectIdShelterId);

      // Build date filter
      let dateFilter = {};
      if (filters && filters.startDate && filters.endDate) {
        dateFilter = {
          createdAt: {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate),
          },
        };
      }
      // console.log('🔍 Date filter:', dateFilter);

      // Aggregate rejection reasons
      const rejectionReasons = await AdoptionRequest.aggregate([
        {
          $match: {
            shelter: objectIdShelterId,
            status: 'rejected',
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: '$rejectionReason',
            count: { $sum: 1 },
            requests: {
              $push: {
                _id: '$_id',
                createdAt: '$createdAt',
                user: '$user',
                pet: '$pet',
              },
            },
          },
        },
        { $sort: { count: -1 } },
      ]);
      // console.log('🔍 Rejection reasons aggregation result:', rejectionReasons);

      // Get total rejections
      const totalRejections = rejectionReasons.reduce(
        (sum, reason) => sum + reason.count,
        0
      );
      // console.log('🔍 Total rejections:', totalRejections);

      // Calculate percentages
      const rejectionReasonsWithPercentages = rejectionReasons.map(
        (reason) => ({
          ...reason,
          percentage:
            totalRejections > 0
              ? ((reason.count / totalRejections) * 100).toFixed(1)
              : '0.0',
        })
      );

      // console.log(
      //   '🔍 Rejection reasons with percentages:',
      //   rejectionReasonsWithPercentages
      // );

      // Get rejection trends over time
      const rejectionTrends = await AdoptionRequest.aggregate([
        {
          $match: {
            shelter: objectIdShelterId,
            status: 'rejected',
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
            reasons: { $push: '$rejectionReason' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);
      // console.log('🔍 Rejection trends:', rejectionTrends);

      const result = {
        totalRejections,
        rejectionReasons: rejectionReasonsWithPercentages,
        trends: rejectionTrends,
        dateRange: dateFilter,
      };

      // console.log('🔍 Final result:', result);
      return result;
    } catch (error) {
      console.error('Error getting rejection reasons analytics:', error);
      throw error;
    }
  }
}

export default new ShelterService();
