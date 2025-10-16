import Joi from 'joi';
import { objectIdSchema } from '../../utils/validation.js';

// Notification settings schema
export const notificationSettingsSchema = Joi.object({
  email: Joi.object({
    enabled: Joi.boolean().default(true),
    adoptionUpdates: Joi.boolean().default(true),
    newPets: Joi.boolean().default(true),
    messages: Joi.boolean().default(true),
    reminders: Joi.boolean().default(true),
    systemUpdates: Joi.boolean().default(true),
  }).optional(),
  push: Joi.object({
    enabled: Joi.boolean().default(true),
    adoptionUpdates: Joi.boolean().default(true),
    newPets: Joi.boolean().default(true),
    messages: Joi.boolean().default(true),
    reminders: Joi.boolean().default(true),
    systemUpdates: Joi.boolean().default(true),
  }).optional(),
  sms: Joi.object({
    enabled: Joi.boolean().default(false),
    adoptionUpdates: Joi.boolean().default(false),
    reminders: Joi.boolean().default(false),
    urgentAlerts: Joi.boolean().default(true),
  }).optional(),
  frequency: Joi.string()
    .valid('immediate', 'hourly', 'daily', 'weekly')
    .default('immediate'),
  quietHours: Joi.object({
    enabled: Joi.boolean().default(false),
    start: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    end: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
  }).optional(),
});

// Query parameters for getting notifications
export const getNotificationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  type: Joi.string()
    .valid(
      'adoption_update',
      'new_pet',
      'message',
      'reminder',
      'system_update',
      'urgent_alert'
    )
    .optional(),
  status: Joi.string()
    .valid('unread', 'read', 'archived', 'all')
    .default('all')
    .optional(),
  sortBy: Joi.string()
    .valid('createdAt', 'priority', 'type')
    .default('createdAt')
    .optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
});

// Mark notification as read schema
export const markAsReadSchema = Joi.object({
  params: Joi.object({
    notificationId: objectIdSchema.required(),
  }),
});

// Archive notification schema
export const archiveNotificationSchema = Joi.object({
  params: Joi.object({
    notificationId: objectIdSchema.required(),
  }),
});

// Delete notification schema
export const deleteNotificationSchema = Joi.object({
  params: Joi.object({
    notificationId: objectIdSchema.required(),
  }),
});

// Test notification schema
export const testNotificationSchema = Joi.object({
  body: Joi.object({
    type: Joi.string()
      .valid(
        'adoption_update',
        'new_pet',
        'message',
        'reminder',
        'system_update',
        'urgent_alert'
      )
      .required(),
    title: Joi.string().max(100).required(),
    message: Joi.string().max(500).required(),
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'urgent')
      .default('medium'),
    data: Joi.object().optional(),
  }),
});

// Update notification settings schema
export const updateNotificationSettingsSchema = Joi.object({
  body: notificationSettingsSchema,
});

// Notification validation object for routes
export const notificationValidation = {
  getNotifications: {
    query: getNotificationsQuerySchema,
  },
  markAsRead: markAsReadSchema,
  archiveNotification: archiveNotificationSchema,
  deleteNotification: deleteNotificationSchema,
  testNotification: testNotificationSchema,
  updateSettings: updateNotificationSettingsSchema,
};
