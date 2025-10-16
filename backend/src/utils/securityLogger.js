import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define security log format
const securityLogFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create security logger instance
const securityLogger = winston.createLogger({
  level: 'info',
  format: securityLogFormat,
  transports: [
    // Write all security logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Write all security logs to security.log
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/security.log'),
    }),
  ],
});

// Security event types
export const SecurityEventType = {
  AUTH: {
    LOGIN_SUCCESS: 'auth.login.success',
    LOGIN_FAILURE: 'auth.login.failure',
    LOGOUT: 'auth.logout',
    REGISTER: 'auth.register',
    PASSWORD_RESET: 'auth.password.reset',
    PASSWORD_CHANGE: 'auth.password.change',
    EMAIL_VERIFY: 'auth.email.verify',
    TOKEN_REFRESH: 'auth.token.refresh',
    TOKEN_INVALID: 'auth.token.invalid',
    SESSION_CREATE: 'auth.session.create',
    SESSION_DELETE: 'auth.session.delete',
  },
  RATE_LIMIT: {
    EXCEEDED: 'rate_limit.exceeded',
  },
  VALIDATION: {
    FAILED: 'validation.failed',
  },
  ACTIVITY: {
    ACCESS: 'activity.access',
    VIEWED: 'activity.viewed',
    PET_VIEWED: 'activity.pet.viewed',
    SHELTER_VIEWED: 'activity.shelter.viewed',
    USER_VIEWED: 'activity.user.viewed',
    STATISTICS_VIEWED: 'activity.statistics.viewed',
    EXPORTED: 'activity.exported',
    CLEANUP: 'activity.cleanup',
  },
  PET: {
    CREATED: 'pet.created',
    UPDATED: 'pet.updated',
    DELETED: 'pet.deleted',
    STATUS_UPDATED: 'pet.status.updated',
    HEALTH_RECORD_ADDED: 'pet.health.record.added',
    BEHAVIOR_RECORD_ADDED: 'pet.behavior.record.added',
  },
  ADOPTION: {
    REQUEST_CREATED: 'adoption.request.created',
    REQUEST_UPDATED: 'adoption.request.updated',
    REQUEST_APPROVED: 'adoption.request.approved',
    REQUEST_REJECTED: 'adoption.request.rejected',
    COMPLETED: 'adoption.completed',
  },
  USER: {
    CREATED: 'user.created',
    UPDATED: 'user.updated',
    DELETED: 'user.deleted',
    ROLE_CHANGED: 'user.role.changed',
    REPORTED: 'user.reported',
  },
  REPORT: {
    CREATED: 'report.created',
    STATUS_UPDATED: 'report.status.updated',
    ACTION_APPLIED: 'report.action.applied',
    ACCESSED: 'report.accessed',
  },
  CHAT: {
    ACCESS: 'chat.access',
    CREATED: 'chat.created',
    MESSAGE_SENT: 'chat.message.sent',
    MESSAGE_DELETED: 'chat.message.deleted',
  },
  REVIEW: {
    CREATED: 'review.created',
    UPDATED: 'review.updated',
    DELETED: 'review.deleted',
  },
  FILE: {
    UPLOADED: 'file.uploaded',
    DELETED: 'file.deleted',
  },
  RECOMMENDATION: {
    ACCESS: 'recommendation.access',
    REQUESTED: 'recommendation.requested',
    SCORED: 'recommendation.scored',
    INTERACTION: 'recommendation.interaction',
    GENERATED: 'recommendation.generated',
    CACHE_CLEARED: 'recommendation.cache.cleared',
  },
  MONITORING: {
    ACCESS: 'monitoring.access',
    SYSTEM_METRICS: 'monitoring.system.metrics',
    SECURITY_METRICS: 'monitoring.security.metrics',
    DATABASE_METRICS: 'monitoring.database.metrics',
  },
  // Admin Action Security Events
  ADMIN_ACTION: {
    // User Management
    USER_CREATED: 'admin.user.created',
    USER_UPDATED: 'admin.user.updated',
    USER_DELETED: 'admin.user.deleted',
    USER_LOCKED: 'admin.user.locked',
    USER_UNLOCKED: 'admin.user.unlocked',
    USER_PASSWORD_RESET: 'admin.user.password.reset',
    USER_ROLE_CHANGED: 'admin.user.role.changed',
    USER_PERMISSIONS_UPDATED: 'admin.user.permissions.updated',

    // Shelter Management
    SHELTER_UPDATED: 'admin.shelter.updated',
    SHELTER_DELETED: 'admin.shelter.deleted',
    SHELTER_BANNED: 'admin.shelter.banned',
    SHELTER_UNBANNED: 'admin.shelter.unbanned',

    // Pet Management
    PET_UPDATED: 'admin.pet.updated',
    PET_DELETED: 'admin.pet.deleted',
    PET_REJECTED: 'admin.pet.rejected',
    PET_APPROVED: 'admin.pet.approved',
    PET_STATUS_CHANGED: 'admin.pet.status.changed',

    // Review Management
    REVIEW_UPDATED: 'admin.review.updated',
    REVIEW_DELETED: 'admin.review.deleted',
    REVIEW_APPROVED: 'admin.review.approved',
    REVIEW_REJECTED: 'admin.review.rejected',

    // Adoption Management
    ADOPTION_UPDATED: 'admin.adoption.updated',
    ADOPTION_APPROVED: 'admin.adoption.approved',
    ADOPTION_REJECTED: 'admin.adoption.rejected',
    ADOPTION_CANCELLED: 'admin.adoption.cancelled',

    // Report Management
    REPORT_STATUS_UPDATED: 'admin.report.status.updated',
    REPORT_ACTION_APPLIED: 'admin.report.action.applied',
    REPORT_DELETED: 'admin.report.deleted',

    // System Management
    SYSTEM_STATS_ACCESSED: 'admin.system.stats.accessed',
    SYSTEM_LOGS_ACCESSED: 'admin.system.logs.accessed',
    SECURITY_LOGS_ACCESSED: 'admin.security.logs.accessed',
    AUDIT_LOGS_ACCESSED: 'admin.audit.logs.accessed',
    SYSTEM_BACKUP_CREATED: 'admin.system.backup.created',
    SYSTEM_RESTORE_PERFORMED: 'admin.system.restore.performed',

    // Data Management
    DATA_EXPORTED: 'admin.data.exported',
    DATA_IMPORTED: 'admin.data.imported',
    DATA_CLEANUP_PERFORMED: 'admin.data.cleanup.performed',
    BULK_OPERATION_PERFORMED: 'admin.bulk.operation.performed',

    // Settings Management
    SYSTEM_SETTINGS_UPDATED: 'admin.system.settings.updated',
    SYSTEM_SETTINGS_RESET: 'admin.system.settings.reset',
    SYSTEM_SETTINGS_EXPORTED: 'admin.system.settings.exported',
    SYSTEM_SETTINGS_IMPORTED: 'admin.system.settings.imported',
    SYSTEM_TEST_PERFORMED: 'admin.system.test.performed',
  },
};

/**
 * Log a security event
 * @param {string} eventType - Type of security event
 * @param {string} userId - ID of the user performing the action
 * @param {string} action - Description of the action performed
 * @param {Object} [details] - Additional details about the action
 * @param {Object} [metadata] - Additional metadata
 */
export const logSecurityEvent = (
  eventType,
  userId,
  action,
  details = {},
  metadata = {}
) => {
  const logData = {
    eventType,
    userId,
    action,
    timestamp: new Date().toISOString(),
    details,
    ...metadata,
  };

  securityLogger.info('Security Event', logData);
};

/**
 * Log an admin action with comprehensive tracking
 * @param {string} eventType - Type of admin action
 * @param {string} adminId - ID of the admin performing the action
 * @param {string} action - Description of the action
 * @param {Object} targetData - Data about the target being modified
 * @param {Object} [changes] - Changes made (for updates)
 * @param {Object} [metadata] - Additional metadata
 */
export const logAdminAction = (
  eventType,
  adminId,
  action,
  targetData = {},
  changes = {},
  metadata = {}
) => {
  const logData = {
    eventType,
    adminId,
    action,
    timestamp: new Date().toISOString(),
    targetData,
    changes,
    ...metadata,
  };

  securityLogger.info('Admin Action', logData);
};

/**
 * Log a dangerous admin action with enhanced tracking
 * @param {string} eventType - Type of dangerous action
 * @param {string} adminId - ID of the admin performing the action
 * @param {string} action - Description of the dangerous action
 * @param {Object} targetData - Data about the target being affected
 * @param {string} [reason] - Reason for the action
 * @param {Object} [metadata] - Additional metadata
 */
export const logDangerousAdminAction = (
  eventType,
  adminId,
  action,
  targetData = {},
  reason = '',
  metadata = {}
) => {
  const logData = {
    eventType,
    adminId,
    action,
    timestamp: new Date().toISOString(),
    targetData,
    reason,
    riskLevel: 'HIGH',
    ...metadata,
  };

  securityLogger.warn('Dangerous Admin Action', logData);
};

/**
 * Log a security error
 * @param {string} eventType - Type of security event
 * @param {Error} error - Error object
 * @param {Object} [metadata] - Additional metadata
 */
export const logSecurityError = (eventType, error, metadata = {}) => {
  const logData = {
    eventType,
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...metadata,
  };

  securityLogger.error('Security Error', logData);
};

export default securityLogger;
