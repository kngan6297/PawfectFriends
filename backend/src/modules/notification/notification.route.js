import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { apiLimiter } from '../../middleware/rateLimiter.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { notificationValidation } from './notification.validation.js';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  archiveNotification,
  getNotificationSettings,
  updateNotificationSettings,
  testNotification,
  testRealTimeNotification,
  getRealTimeNotifications,
} from './notification.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user notifications
router.get(
  '/',
  apiLimiter,
  validateRequest(notificationValidation.getNotifications),
  getUserNotifications
);

// Get unread count
router.get('/unread-count', apiLimiter, getUnreadCount);

// Mark notification as read
router.patch(
  '/:notificationId/read',
  apiLimiter,
  validateRequest(notificationValidation.markAsRead),
  markAsRead
);

// Mark all notifications as read
router.patch('/mark-all-read', apiLimiter, markAllAsRead);

// Delete notification
router.delete(
  '/:notificationId',
  apiLimiter,
  validateRequest(notificationValidation.deleteNotification),
  deleteNotification
);

// Archive notification
router.patch(
  '/:notificationId/archive',
  apiLimiter,
  validateRequest(notificationValidation.archiveNotification),
  archiveNotification
);

// Notification settings
router.get('/settings', apiLimiter, getNotificationSettings);
router.put(
  '/settings',
  apiLimiter,
  validateRequest(notificationValidation.updateSettings),
  updateNotificationSettings
);

// Test notification (for development/testing)
router.post(
  '/test',
  apiLimiter,
  validateRequest(notificationValidation.testNotification),
  testNotification
);

// Test real-time notification (for development/testing)
router.post('/test-realtime', apiLimiter, testRealTimeNotification);

// Real-time notifications via Server-Sent Events
router.get('/stream', getRealTimeNotifications);

export const notificationRouter = router;
export default router;
