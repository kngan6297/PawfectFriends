import Joi from 'joi';
import { objectIdSchema } from '../../utils/validation.js';

// Create activity log schema
export const createActivityLogSchema = Joi.object({
  body: Joi.object({
    user: objectIdSchema.optional(),
    shelter: objectIdSchema.optional(),
    action: Joi.string()
      .valid(
        'user_registration',
        'user_login',
        'user_logout',
        'pet_view',
        'pet_favorite',
        'pet_unfavorite',
        'adoption_request',
        'adoption_approved',
        'adoption_rejected',
        'review_created',
        'review_updated',
        'review_deleted',
        'message_sent',
        'profile_updated',
        'settings_updated',
        'document_uploaded',
        'meeting_scheduled',
        'meeting_completed',
        'information_requested',
        'information_provided',
        'system_login',
        'system_logout',
        'admin_action',
        'error_occurred'
      )
      .required(),
    resource: Joi.object({
      type: Joi.string()
        .valid(
          'user',
          'pet',
          'adoption',
          'review',
          'message',
          'document',
          'meeting'
        )
        .required(),
      id: objectIdSchema.required(),
      name: Joi.string().optional(),
    }).optional(),
    details: Joi.object().optional(),
    ipAddress: Joi.string().ip().optional(),
    userAgent: Joi.string().optional(),
    location: Joi.object({
      country: Joi.string().optional(),
      region: Joi.string().optional(),
      city: Joi.string().optional(),
    }).optional(),
    severity: Joi.string()
      .valid('low', 'medium', 'high', 'critical')
      .default('low'),
    metadata: Joi.object().optional(),
  }),
});

// Get activity logs query schema
export const getActivityLogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  user: objectIdSchema.optional(),
  shelter: objectIdSchema.optional(),
  action: Joi.string().optional(),
  resourceType: Joi.string()
    .valid(
      'user',
      'pet',
      'adoption',
      'review',
      'message',
      'document',
      'meeting'
    )
    .optional(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  sortBy: Joi.string()
    .valid('createdAt', 'action', 'severity')
    .default('createdAt')
    .optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional(),
});

// Cleanup old logs schema
export const cleanupOldLogsSchema = Joi.object({
  body: Joi.object({
    daysToKeep: Joi.number().integer().min(1).max(365).default(90),
    severity: Joi.string()
      .valid('low', 'medium', 'high', 'critical')
      .optional(),
    dryRun: Joi.boolean().default(false),
  }),
});

// Activity validation object for routes
export const activityValidation = {
  createActivityLog: createActivityLogSchema,
  getActivityLogs: {
    query: getActivityLogsQuerySchema,
  },
  cleanupOldLogs: cleanupOldLogsSchema,
};
