import activityService from './activity.service.js';
import { ApiError } from '../../utils/errors.js';
import { asyncHandler } from '../../middleware/async.js';
import {
  logSecurityEvent,
  SecurityEventType,
} from '../../utils/securityLogger.js';

/**
 * Get activity logs with filtering and pagination
 */
export const getActivityLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'timestamp',
    sortOrder = 'desc',
    category,
    action,
    severity,
    userId,
    petId,
    dateFrom,
    dateTo,
    search,
  } = req.query;

  const filters = {};
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder,
    category,
    action,
    severity,
    userId,
    shelterId: req.user.shelter,
    petId,
    dateFrom,
    dateTo,
    search,
  };

  const result = await activityService.getActivityLogs(filters, options);

  logSecurityEvent(SecurityEventType.ACTIVITY.VIEWED, {
    userId: req.user._id,
    filters: options,
    resultCount: result.data.length,
  });

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

/**
 * Get activity logs for a specific pet
 */
export const getPetActivityLogs = asyncHandler(async (req, res) => {
  const { petId } = req.params;
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    sortBy: req.query.sortBy || 'timestamp',
    sortOrder: req.query.sortOrder || 'desc',
  };

  const result = await activityService.getPetActivityLogs(petId, options);

  logSecurityEvent(SecurityEventType.ACTIVITY.PET_VIEWED, {
    userId: req.user._id,
    petId,
    resultCount: result.data.length,
  });

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

/**
 * Get activity logs for the current shelter
 */
export const getShelterActivityLogs = asyncHandler(async (req, res) => {
  const shelterId = req.user.shelter;
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    sortBy: req.query.sortBy || 'timestamp',
    sortOrder: req.query.sortOrder || 'desc',
    category: req.query.category,
    action: req.query.action,
    severity: req.query.severity,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
    search: req.query.search,
  };

  const result = await activityService.getShelterActivityLogs(
    shelterId,
    options
  );

  logSecurityEvent(SecurityEventType.ACTIVITY.SHELTER_VIEWED, {
    userId: req.user._id,
    shelterId,
    resultCount: result.data.length,
  });

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

/**
 * Get activity logs for a specific user
 */
export const getUserActivityLogs = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    sortBy: req.query.sortBy || 'timestamp',
    sortOrder: req.query.sortOrder || 'desc',
  };

  const result = await activityService.getUserActivityLogs(userId, options);

  logSecurityEvent(SecurityEventType.ACTIVITY.USER_VIEWED, {
    userId: req.user._id,
    targetUserId: userId,
    resultCount: result.data.length,
  });

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

/**
 * Get activity statistics
 */
export const getActivityStatistics = asyncHandler(async (req, res) => {
  const filters = {
    shelterId: req.user.shelter,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  };

  const statistics = await activityService.getActivityStatistics(filters);

  logSecurityEvent(SecurityEventType.ACTIVITY.STATISTICS_VIEWED, {
    userId: req.user._id,
    shelterId: req.user.shelter,
  });

  res.json({
    success: true,
    data: statistics,
  });
});

/**
 * Export activity logs to CSV
 */
export const exportActivityLogs = asyncHandler(async (req, res) => {
  const filters = {
    shelterId: req.user.shelter,
    category: req.query.category,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  };

  const csvData = await activityService.exportActivityLogs(filters);

  logSecurityEvent(SecurityEventType.ACTIVITY.EXPORTED, {
    userId: req.user._id,
    shelterId: req.user.shelter,
    filters,
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.csv"`
  );
  res.send(csvData);
});

/**
 * Clean up old activity logs (Admin only)
 */
export const cleanupOldLogs = asyncHandler(async (req, res) => {
  const { daysToKeep = 90 } = req.body;

  if (req.user.role !== 'admin') {
    throw new ApiError('Unauthorized: Admin access required', 403);
  }

  const deletedCount = await activityService.cleanupOldLogs(daysToKeep);

  logSecurityEvent(SecurityEventType.ACTIVITY.CLEANUP, {
    userId: req.user._id,
    daysToKeep,
    deletedCount,
  });

  res.json({
    success: true,
    message: `Successfully cleaned up ${deletedCount} old activity logs`,
    deletedCount,
  });
});

/**
 * Create a new activity log entry (Internal use)
 */
export const createActivityLog = asyncHandler(async (req, res) => {
  const logData = {
    ...req.body,
    performedBy: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
    shelter: req.user.shelter,
    metadata: {
      ...req.body.metadata,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  };

  const activityLog = await activityService.createActivityLog(logData);

  res.status(201).json({
    success: true,
    data: activityLog,
  });
});
