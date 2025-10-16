import os from 'os';
import mongoose from 'mongoose';
import { ApiError } from '../../utils/errors.js';
import {
  logSecurityEvent,
  SecurityEventType,
} from '../../utils/securityLogger.js';
import { User } from '../user/user.model.js';
import { Pet } from '../pet/pet.model.js';
import { AdoptionRequest } from '../adoption/adoption.model.js';
import ActivityLog from '../activity/activity.model.js';
// Chat model removed - communication is now handled by separate app

export const getSystemMetrics = async () => {
  try {
    const metrics = {
      cpu: {
        usage: process.cpuUsage(),
        loadAvg: os.loadavg(),
        cores: os.cpus().length,
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      uptime: os.uptime(),
      platform: os.platform(),
      hostname: os.hostname(),
      users: {
        total: await User.countDocuments(),
        verified: await User.countDocuments({ emailVerified: true }),
      },
    };

    logSecurityEvent(SecurityEventType.MONITORING.SYSTEM_METRICS, {
      metrics,
    });

    return metrics;
  } catch (error) {
    throw ApiError.internal('Failed to get system metrics');
  }
};

export const getApplicationMetrics = async () => {
  try {
    const metrics = {
      users: {
        total: await User.countDocuments(),
        active: await User.countDocuments({ isActive: true }),
        verified: await User.countDocuments({ isEmailVerified: true }),
      },
      pets: {
        total: await Pet.countDocuments(),
        available: await Pet.countDocuments({ status: 'available' }),
        adopted: await Pet.countDocuments({ status: 'adopted' }),
      },
      adoptions: {
        total: await AdoptionRequest.countDocuments(),
        pending: await AdoptionRequest.countDocuments({ status: 'pending' }),
        approved: await AdoptionRequest.countDocuments({ status: 'approved' }),
        rejected: await AdoptionRequest.countDocuments({ status: 'rejected' }),
      },
      // Chat metrics removed - communication is now handled by separate app
    };

    logSecurityEvent(SecurityEventType.MONITORING.APPLICATION_METRICS, {
      metrics,
    });

    return metrics;
  } catch (error) {
    throw ApiError.internal('Failed to get application metrics');
  }
};

export const getSecurityMetrics = async () => {
  try {
    const metrics = {
      authentication: {
        totalLogins: await User.aggregate([
          { $group: { _id: null, total: { $sum: '$loginCount' } } },
        ]).then((result) => result[0]?.total || 0),
      },
      sessions: {
        active: await mongoose.connection.db
          .collection('sessions')
          .countDocuments({ isValid: true }),
        expired: await mongoose.connection.db
          .collection('sessions')
          .countDocuments({ isValid: false }),
      },
      securityEvents: {
        total: await mongoose.connection.db
          .collection('securityLogs')
          .countDocuments(),
        critical: await mongoose.connection.db
          .collection('securityLogs')
          .countDocuments({ level: 'critical' }),
      },
    };

    logSecurityEvent(SecurityEventType.MONITORING.SECURITY_METRICS, {
      metrics,
    });

    return metrics;
  } catch (error) {
    throw ApiError.internal('Failed to get security metrics');
  }
};

export const getPerformanceMetrics = async () => {
  try {
    const metrics = {
      responseTime: {
        average: await mongoose.connection.db
          .collection('requestLogs')
          .aggregate([
            {
              $group: {
                _id: null,
                avg: { $avg: '$responseTime' },
                min: { $min: '$responseTime' },
                max: { $max: '$responseTime' },
              },
            },
          ])
          .then((result) => result[0] || { avg: 0, min: 0, max: 0 }),
      },
      requests: {
        total: await mongoose.connection.db
          .collection('requestLogs')
          .countDocuments(),
        errors: await mongoose.connection.db
          .collection('requestLogs')
          .countDocuments({ status: { $gte: 400 } }),
      },
      cache: {
        hits: await mongoose.connection.db
          .collection('cacheLogs')
          .countDocuments({ type: 'hit' }),
        misses: await mongoose.connection.db
          .collection('cacheLogs')
          .countDocuments({ type: 'miss' }),
      },
    };

    logSecurityEvent(SecurityEventType.MONITORING.PERFORMANCE_METRICS, {
      metrics,
    });

    return metrics;
  } catch (error) {
    throw ApiError.internal('Failed to get performance metrics');
  }
};

export const getErrorMetrics = async () => {
  try {
    const metrics = {
      errors: {
        total: await mongoose.connection.db
          .collection('errorLogs')
          .countDocuments(),
        byType: await mongoose.connection.db.collection('errorLogs').aggregate([
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
            },
          },
        ]),
      },
      exceptions: {
        total: await mongoose.connection.db
          .collection('exceptionLogs')
          .countDocuments(),
        unhandled: await mongoose.connection.db
          .collection('exceptionLogs')
          .countDocuments({ handled: false }),
      },
    };

    logSecurityEvent(SecurityEventType.MONITORING.ERROR_METRICS, {
      metrics,
    });

    return metrics;
  } catch (error) {
    throw ApiError.internal('Failed to get error metrics');
  }
};

export const getDatabaseMetrics = async () => {
  try {
    const dbStats = await mongoose.connection.db.stats();
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    const metrics = {
      database: {
        name: dbStats.db,
        collections: dbStats.collections,
        views: dbStats.views,
        objects: dbStats.objects,
        avgObjSize: dbStats.avgObjSize,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        indexSize: dbStats.indexSize,
      },
      collections: collections.map((col) => ({
        name: col.name,
        type: col.type,
      })),
    };

    logSecurityEvent(SecurityEventType.MONITORING.DATABASE_METRICS, {
      metrics,
    });

    return metrics;
  } catch (error) {
    throw ApiError.internal('Failed to get database metrics');
  }
};

// Get audit logs
export const getAuditLogs = async (filters = {}) => {
  try {
    const query = {};

    if (filters.action) query.action = filters.action;
    if (filters.userId) query['performedBy._id'] = filters.userId;
    if (filters.resource) query.category = filters.resource;
    if (filters.severity) query.severity = filters.severity;
    if (filters.startDate && filters.endDate) {
      query.timestamp = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }
    if (filters.search) {
      query.$or = [
        { action: { $regex: filters.search, $options: 'i' } },
        { category: { $regex: filters.search, $options: 'i' } },
        { 'performedBy.name': { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Pagination parameters
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    // Sort parameters
    const sortBy = filters.sortBy || 'timestamp';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Get total count and logs in parallel
    const [logs, total] = await Promise.all([
      ActivityLog.find(query).sort(sort).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
    };
  } catch (error) {
    throw ApiError.internal('Failed to get audit logs');
  }
};

// Get activity logs
export const getActivityLogs = async (filters = {}) => {
  try {
    const query = {};

    if (filters.action) query.action = filters.action;
    if (filters.userId) query['performedBy._id'] = filters.userId;
    if (filters.resource) query.category = filters.resource;
    if (filters.severity) query.severity = filters.severity;
    if (filters.startDate && filters.endDate) {
      query.timestamp = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }
    if (filters.search) {
      query.$or = [
        { action: { $regex: filters.search, $options: 'i' } },
        { category: { $regex: filters.search, $options: 'i' } },
        { 'performedBy.name': { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Pagination parameters
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    // Sort parameters
    const sortBy = filters.sortBy || 'timestamp';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Get total count and logs in parallel
    const [logs, total] = await Promise.all([
      ActivityLog.find(query).sort(sort).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
    };
  } catch (error) {
    throw ApiError.internal('Failed to get activity logs');
  }
};

// Get security logs
export const getSecurityLogs = async (filters = {}) => {
  try {
    const query = {};

    // Filter for security-related actions
    query.category = { $in: ['system', 'admin'] };
    query.severity = { $in: ['high', 'critical'] };

    if (filters.action) query.action = filters.action;
    if (filters.userId) query['performedBy._id'] = filters.userId;
    if (filters.resource) query.category = filters.resource;
    if (filters.severity) query.severity = filters.severity;
    if (filters.startDate && filters.endDate) {
      query.timestamp = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }
    if (filters.search) {
      query.$or = [
        { action: { $regex: filters.search, $options: 'i' } },
        { category: { $regex: filters.search, $options: 'i' } },
        { 'performedBy.name': { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Pagination parameters
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    // Sort parameters
    const sortBy = filters.sortBy || 'timestamp';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Get total count and logs in parallel
    const [logs, total] = await Promise.all([
      ActivityLog.find(query).sort(sort).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
    };
  } catch (error) {
    throw ApiError.internal('Failed to get security logs');
  }
};

// Export logs
export const exportLogs = async (filters = {}) => {
  try {
    const query = {};

    if (filters.action) query.action = filters.action;
    if (filters.userId) query['performedBy._id'] = filters.userId;
    if (filters.resource) query.category = filters.resource;
    if (filters.severity) query.severity = filters.severity;
    if (filters.startDate && filters.endDate) {
      query.timestamp = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    // Use the ActivityLog model instead of direct collection access
    const logs = await ActivityLog.find(query).sort({ timestamp: -1 }).lean();

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
      'IP Address',
      'Additional Data',
    ];
    const csvRows = logs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.action,
      log.category,
      log.severity,
      log.description,
      log.performedBy?.name || 'Unknown',
      log.performedBy?.email || 'Unknown',
      log.performedBy?.role || 'Unknown',
      log.shelter || '',
      log.metadata?.ipAddress || '',
      JSON.stringify(log.metadata || {}),
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  } catch (error) {
    throw ApiError.internal('Failed to export logs');
  }
};
