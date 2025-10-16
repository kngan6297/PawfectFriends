import ActivityLog from './activity.model.js';
import { ApiError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';

class ActivityService {
  /**
   * Create a new activity log entry
   * @param {Object} logData - Activity log data
   * @returns {Promise<Object>} Created activity log
   */
  async createActivityLog(logData) {
    try {
      const activityLog = new ActivityLog(logData);
      await activityLog.save();

      logger.info('Activity log created:', {
        action: logData.action,
        category: logData.category,
        performedBy: logData.performedBy._id,
      });

      return activityLog;
    } catch (error) {
      logger.error('Error creating activity log:', error);
      throw new ApiError('Failed to create activity log', 500);
    }
  }

  /**
   * Get activity logs with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Activity logs and pagination info
   */
  async getActivityLogs(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'timestamp',
        sortOrder = 'desc',
        category,
        action,
        severity,
        userId,
        shelterId,
        petId,
        dateFrom,
        dateTo,
        search,
      } = options;

      // Build query
      const query = {};

      if (category) query.category = category;
      if (action) query.action = action;
      if (severity) query.severity = severity;
      if (userId) query['performedBy._id'] = userId;
      if (shelterId) query.shelter = shelterId;
      if (petId) query['metadata.petId'] = petId;

      // Date range filter
      if (dateFrom || dateTo) {
        query.timestamp = {};
        if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
        if (dateTo) query.timestamp.$lte = new Date(dateTo);
      }

      // Text search
      if (search) {
        query.$text = { $search: search };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Execute query
      const [activityLogs, total] = await Promise.all([
        ActivityLog.find(query).sort(sort).skip(skip).limit(limit).lean(),
        ActivityLog.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: activityLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Error fetching activity logs:', error);
      throw new ApiError('Failed to fetch activity logs', 500);
    }
  }

  /**
   * Get activity logs for a specific pet
   * @param {string} petId - Pet ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Pet activity logs
   */
  async getPetActivityLogs(petId, options = {}) {
    try {
      const query = { 'metadata.petId': petId };
      return await this.getActivityLogs(query, options);
    } catch (error) {
      logger.error('Error fetching pet activity logs:', error);
      throw new ApiError('Failed to fetch pet activity logs', 500);
    }
  }

  /**
   * Get activity logs for a specific shelter
   * @param {string} shelterId - Shelter ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Shelter activity logs
   *
   * IMPORTANT: Shelters should only see activities directly related to their operations.
   * This includes:
   * - Pet management activities
   * - Adoption-related activities
   * - Shelter profile changes
   * - Reviews for their shelter
   * - User activities that directly impact shelter operations (adoption requests, reviews, meetings)
   *
   * Shelters should NOT see:
   * - User profile changes (avatar updates, password changes, etc.)
   * - General user activities unrelated to shelter operations
   * - System activities not specific to the shelter
   */
  async getShelterActivityLogs(shelterId, options = {}) {
    try {
      // Shelter should only see activities directly related to shelter operations
      // Filter out user profile activities and other non-shelter operations
      // This includes both positive filtering (what they CAN see) and negative filtering (what they CANNOT see)
      const query = {
        $and: [
          { shelter: shelterId },
          {
            $or: [
              // Shelter-specific activities
              { category: { $in: ['pet', 'adoption', 'shelter', 'review'] } },
              // User activities that are directly related to shelter operations
              {
                $and: [
                  { category: 'user' },
                  {
                    $or: [
                      {
                        action: {
                          $in: [
                            'adoption_request_created',
                            'adoption_request_approved',
                            'adoption_request_rejected',
                            'adoption_request_cancelled',
                            'adoption_completed',
                          ],
                        },
                      },
                      {
                        action: {
                          $in: [
                            'review_created',
                            'review_updated',
                            'review_deleted',
                          ],
                        },
                      },
                      {
                        action: {
                          $in: ['meeting_scheduled', 'meeting_completed'],
                        },
                      },
                      {
                        action: {
                          $in: [
                            'information_requested',
                            'information_provided',
                          ],
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
          // Explicitly exclude user profile activities that should never be visible to shelters
          // This is a safety measure to ensure privacy even if some activities still have shelter field set
          {
            $nor: [
              {
                $and: [
                  { category: 'user' },
                  {
                    action: {
                      $in: [
                        'avatar_updated',
                        'avatar_deleted',
                        'user_updated',
                        'password_changed',
                        'email_verified',
                        'login',
                        'logout',
                        'session_created',
                        'session_revoked',
                        'user_registered',
                        'user_status_changed',
                        'profile_updated',
                        'settings_updated'
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      };

      return await this.getActivityLogs(query, options);
    } catch (error) {
      logger.error('Error fetching shelter activity logs:', error);
      throw new ApiError('Failed to fetch shelter activity logs', 500);
    }
  }

  /**
   * Get activity logs for a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User activity logs
   */
  async getUserActivityLogs(userId, options = {}) {
    try {
      const query = { 'performedBy._id': userId };
      return await this.getActivityLogs(query, options);
    } catch (error) {
      logger.error('Error fetching user activity logs:', error);
      throw new ApiError('Failed to fetch user activity logs', 500);
    }
  }

  /**
   * Get activity statistics
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} Activity statistics
   */
  async getActivityStatistics(filters = {}) {
    try {
      const query = {};
      if (filters.shelterId) query.shelter = filters.shelterId;
      if (filters.dateFrom || filters.dateTo) {
        query.timestamp = {};
        if (filters.dateFrom) query.timestamp.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.timestamp.$lte = new Date(filters.dateTo);
      }

      const [
        totalActivities,
        categoryStats,
        actionStats,
        severityStats,
        dailyStats,
      ] = await Promise.all([
        ActivityLog.countDocuments(query),
        ActivityLog.aggregate([
          { $match: query },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        ActivityLog.aggregate([
          { $match: query },
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        ActivityLog.aggregate([
          { $match: query },
          { $group: { _id: '$severity', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        ActivityLog.aggregate([
          { $match: query },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: -1 } },
          { $limit: 30 },
        ]),
      ]);

      return {
        totalActivities,
        categoryStats,
        actionStats,
        severityStats,
        dailyStats,
      };
    } catch (error) {
      logger.error('Error fetching activity statistics:', error);
      throw new ApiError('Failed to fetch activity statistics', 500);
    }
  }

  /**
   * Export activity logs to CSV
   * @param {Object} filters - Filter criteria
   * @returns {Promise<string>} CSV data
   */
  async exportActivityLogs(filters = {}) {
    try {
      const query = {};
      if (filters.shelterId) query.shelter = filters.shelterId;
      if (filters.category) query.category = filters.category;
      if (filters.dateFrom || filters.dateTo) {
        query.timestamp = {};
        if (filters.dateFrom) query.timestamp.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.timestamp.$lte = new Date(filters.dateTo);
      }

      const activityLogs = await ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .lean();

      // Convert to CSV format
      const csvHeaders = [
        'Timestamp',
        'Action',
        'Category',
        'Severity',
        'Description',
        'Performed By',
        'User Email',
        'User Role',
        'Shelter',
        'Pet ID',
        'Pet Name',
        'IP Address',
        'Additional Data',
      ];

      const csvRows = activityLogs.map((log) => [
        new Date(log.timestamp).toISOString(),
        log.action,
        log.category,
        log.severity,
        log.description,
        log.performedBy.name,
        log.performedBy.email,
        log.performedBy.role,
        log.shelter || '',
        log.metadata?.petId || '',
        log.metadata?.petName || '',
        log.metadata?.ipAddress || '',
        JSON.stringify(log.metadata?.additionalData || {}),
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row) => row.map((field) => `"${field}"`).join(',')),
      ].join('\n');

      return csvContent;
    } catch (error) {
      logger.error('Error exporting activity logs:', error);
      throw new ApiError('Failed to export activity logs', 500);
    }
  }

  /**
   * Clean up old activity logs
   * @param {number} daysToKeep - Number of days to keep logs
   * @returns {Promise<number>} Number of deleted logs
   */
  async cleanupOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await ActivityLog.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      logger.info(`Cleaned up ${result.deletedCount} old activity logs`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old activity logs:', error);
      throw new ApiError('Failed to cleanup old activity logs', 500);
    }
  }
}

export default new ActivityService();
