import { asyncHandler } from '../../middleware/async.js';
import { ApiError } from '../../utils/errors.js';
import notificationService from './notification.service.js';
import logger from '../../utils/logger.js';

/**
 * Get user notifications
 */
export const getUserNotifications = asyncHandler(async (req, res) => {
  const { page, limit, type, isRead } = req.query;
  const userId = req.user._id;

  const result = await notificationService.getUserNotifications(userId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    type,
    isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
  });

  res.json({
    status: 'success',
    data: result,
  });
});

/**
 * Get unread notification count
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const count = await notificationService.getUnreadCount(userId);

  res.json({
    status: 'success',
    data: { unreadCount: count },
  });
});

/**
 * Mark notification as read
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  const notification = await notificationService.markAsRead(
    notificationId,
    userId
  );

  res.json({
    status: 'success',
    data: notification,
  });
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await notificationService.markAllAsRead(userId);

  res.json({
    status: 'success',
    data: { message: 'All notifications marked as read', ...result },
  });
});

/**
 * Delete notification
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  const result = await notificationService.deleteNotification(
    notificationId,
    userId
  );

  res.json({
    status: 'success',
    data: result,
  });
});

/**
 * Archive notification
 */
export const archiveNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  const notification = await notificationService.archiveNotification(
    notificationId,
    userId
  );

  res.json({
    status: 'success',
    data: notification,
  });
});

/**
 * Get notification settings (for future implementation)
 */
export const getNotificationSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // TODO: Implement notification settings
  const settings = {
    email: {
      adoption_request: true,
      adoption_status_change: true,
      new_message: false,
      pet_status_change: true,
      review_received: true,
      system_alert: true,
      reminder: true,
    },
    push: {
      adoption_request: true,
      adoption_status_change: true,
      new_message: true,
      pet_status_change: true,
      review_received: true,
      system_alert: true,
      reminder: false,
    },
    in_app: {
      adoption_request: true,
      adoption_status_change: true,
      new_message: true,
      pet_status_change: true,
      review_received: true,
      system_alert: true,
      reminder: true,
    },
  };

  res.json({
    status: 'success',
    data: settings,
  });
});

/**
 * Update notification settings (for future implementation)
 */
export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const settings = req.body;

  // TODO: Implement notification settings update
  logger.info(`Notification settings updated for user ${userId}`, settings);

  res.json({
    status: 'success',
    data: { message: 'Notification settings updated successfully' },
  });
});

/**
 * Test notification (for development/testing)
 */
export const testNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { type = 'system_alert', title, message } = req.body;

  const notification = await notificationService.createSystemAlertNotification(
    userId,
    title || 'Test Notification',
    message || 'This is a test notification',
    'medium'
  );

  res.json({
    status: 'success',
    data: notification,
  });
});

/**
 * Test real-time notification (for development/testing)
 */
export const testRealTimeNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { title, message, broadcast = false } = req.body;

  const notificationData = {
    recipient: userId,
    type: 'system_alert',
    title: title || 'Real-time Test Notification',
    message: message || 'This is a real-time test notification',
    data: {
      priority: 'medium',
      actionUrl: '/dashboard',
      actionText: 'View Dashboard',
    },
    sendEmail: false,
  };

  const notification =
    await notificationService.createNotification(notificationData);

  // If broadcast is true, send to all connected users
  if (broadcast) {
    notificationService.broadcastToAllConnected(notification);
  }

  res.json({
    status: 'success',
    data: {
      notification,
      activeConnections: notificationService.getActiveConnectionsCount(),
      connectedUsers: notificationService.getConnectedUserIds(),
    },
  });
});

/**
 * Real-time notifications via Server-Sent Events
 */
export const getRealTimeNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Send initial connection message
  res.write(
    `data: ${JSON.stringify({
      type: 'connection',
      message: 'Connected to real-time notifications',
      timestamp: new Date().toISOString(),
    })}\n\n`
  );

  // Store the response object for this user
  notificationService.addUserConnection(userId, res);

  // Handle client disconnect
  req.on('close', () => {
    notificationService.removeUserConnection(userId);
    logger.info(`Real-time connection closed for user ${userId}`);
  });

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(heartbeat);
      return;
    }

    try {
      res.write(
        `data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
    } catch (error) {
      clearInterval(heartbeat);
      notificationService.removeUserConnection(userId);
    }
  }, 30000);
});

export const notificationController = {
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
};
