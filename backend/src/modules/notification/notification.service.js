import { Notification } from './notification.model.js';
import { User } from '../user/user.model.js';
import { AdoptionRequest } from '../adoption/adoption.model.js';
import { Pet } from '../pet/pet.model.js';
import { Review } from '../review/review.model.js';
// Chat model removed - communication is now handled by separate app
import { emailService } from '../../services/email.service.js';
import logger from '../../utils/logger.js';
import { ApiError } from '../../utils/errors.js';

class NotificationService {
  constructor() {
    // Store active SSE connections by user ID
    this.userConnections = new Map();
  }

  /**
   * Add user connection for real-time notifications
   */
  addUserConnection(userId, res) {
    this.userConnections.set(userId, res);
    logger.info(`Real-time connection added for user ${userId}`);
  }

  /**
   * Remove user connection
   */
  removeUserConnection(userId) {
    this.userConnections.delete(userId);
    logger.info(`Real-time connection removed for user ${userId}`);
  }

  /**
   * Send real-time notification to specific user
   */
  sendRealTimeNotificationToUser(userId, notification) {
    const connection = this.userConnections.get(userId);
    if (connection && !connection.writableEnded) {
      try {
        connection.write(
          `data: ${JSON.stringify({
            type: 'notification',
            data: notification,
            timestamp: new Date().toISOString(),
          })}\n\n`
        );
        logger.info(`Real-time notification sent to user ${userId}`);
      } catch (error) {
        logger.error(
          `Error sending real-time notification to user ${userId}:`,
          error
        );
        this.removeUserConnection(userId);
      }
    }
  }

  /**
   * Broadcast notification to multiple users
   */
  broadcastNotification(userIds, notification) {
    userIds.forEach((userId) => {
      this.sendRealTimeNotificationToUser(userId, notification);
    });
  }

  /**
   * Broadcast notification to all connected users
   */
  broadcastToAllConnected(notification) {
    this.userConnections.forEach((connection, userId) => {
      this.sendRealTimeNotificationToUser(userId, notification);
    });
  }

  /**
   * Get count of active connections
   */
  getActiveConnectionsCount() {
    return this.userConnections.size;
  }

  /**
   * Get list of connected user IDs
   */
  getConnectedUserIds() {
    return Array.from(this.userConnections.keys());
  }

  /**
   * Create and send a notification
   */
  async createNotification(notificationData) {
    try {
      const notification = new Notification({
        ...notificationData,
        sentVia: [{ type: 'in_app', status: 'sent' }],
      });

      await notification.save();

      // Send real-time notification to the recipient
      this.sendRealTimeNotificationToUser(
        notificationData.recipient,
        notification
      );

      // Send email notification if configured
      if (notificationData.sendEmail) {
        await this.sendEmailNotification(notification);
      }

      logger.info(
        `Notification created: ${notification.type} for user ${notification.recipient}`
      );
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send real-time notification via communication service
   * Socket functionality has been moved to the communication app
   */
  async sendRealTimeNotification(notification) {
    try {
      // Real-time notifications are now handled by the communication service
      // This method is kept for future integration with the communication app
      logger.info(
        `Real-time notification queued for ${notification.recipient}: ${notification.title}`
      );
    } catch (error) {
      logger.error('Error queuing real-time notification:', error);
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(notification) {
    try {
      const recipient = await User.findById(notification.recipient).select(
        'email name'
      );
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      const emailData = {
        to: recipient.email,
        subject: notification.title,
        template: this.getEmailTemplate(notification.type),
        context: {
          name: recipient.name,
          message: notification.message,
          actionUrl: notification.data?.actionUrl,
          actionText: notification.data?.actionText,
        },
      };

      await emailService.sendEmail(emailData);

      // Update notification sentVia status
      notification.sentVia.push({
        type: 'email',
        status: 'sent',
        sentAt: new Date(),
      });
      await notification.save();

      logger.info(`Email notification sent to ${recipient.email}`);
    } catch (error) {
      logger.error('Error sending email notification:', error);

      // Update notification sentVia status
      notification.sentVia.push({
        type: 'email',
        status: 'failed',
        sentAt: new Date(),
      });
      await notification.save();
    }
  }

  /**
   * Get email template based on notification type
   */
  getEmailTemplate(notificationType) {
    const templates = {
      adoption_request: 'adoption-request-notification',
      adoption_status_change: 'adoption-status-change',
      new_message: 'new-message-notification',
      pet_status_change: 'pet-status-change',
      review_received: 'review-received',
      system_alert: 'system-alert',
      reminder: 'reminder-notification',
      meeting_scheduled: 'meeting-scheduled',
      contract_sent: 'contract-sent-notification',
    };

    return templates[notificationType] || 'general-notification';
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        isRead,
        isArchived = false,
      } = options;

      const query = { recipient: userId, isArchived };

      if (type) query.type = type;
      if (isRead !== undefined) query.isRead = isRead;

      const skip = (page - 1) * limit;

      const notifications = await Notification.find(query)
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments(query);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );

      if (!notification) {
        throw ApiError.notFound('Notification not found');
      }

      return notification;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.markAllAsRead(userId);
      return result;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId) {
    try {
      return await Notification.getUnreadCount(userId);
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: userId,
      });

      if (!notification) {
        throw ApiError.notFound('Notification not found');
      }

      return { message: 'Notification deleted successfully' };
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Archive notification
   */
  async archiveNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isArchived: true },
        { new: true }
      );

      if (!notification) {
        throw ApiError.notFound('Notification not found');
      }

      return notification;
    } catch (error) {
      logger.error('Error archiving notification:', error);
      throw error;
    }
  }

  // Specific notification creators for different events

  /**
   * Create adoption request notification
   */
  async createAdoptionRequestNotification(adoptionRequestId, shelterId) {
    try {
      const adoptionRequest = await AdoptionRequest.findById(adoptionRequestId)
        .populate('user', 'name email')
        .populate('pet', 'name');

      if (!adoptionRequest) {
        throw new Error('Adoption request not found');
      }

      // Debug logging
      logger.info('Adoption request populated data:', {
        user: adoptionRequest.user,
        pet: adoptionRequest.pet,
        userId: adoptionRequest.user?._id,
        userName: adoptionRequest.user?.name,
        userEmail: adoptionRequest.user?.email,
      });

      // Handle case where user might not be populated or name might be missing
      let userName = 'Unknown User';
      if (adoptionRequest.user) {
        if (adoptionRequest.user.name && adoptionRequest.user.name.trim()) {
          userName = adoptionRequest.user.name.trim();
        } else if (adoptionRequest.user.email) {
          // Fallback to email if name is not available
          userName = adoptionRequest.user.email.split('@')[0];
        }
      }

      const petName = adoptionRequest.pet?.name || 'Unknown Pet';

      const notificationData = {
        recipient: shelterId,
        sender: adoptionRequest.user?._id || null,
        type: 'adoption_request',
        title: 'New Adoption Request',
        message: `${userName} has submitted an adoption request for ${petName}`,
        data: {
          adoptionRequestId: adoptionRequest._id,
          petId: adoptionRequest.pet?._id,
          actionUrl: `/shelter/adoption-requests/${adoptionRequest._id}`,
          actionText: 'View Request',
          priority: 'high',
        },
        sendEmail: false, // In-app only for adoption request notifications
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      logger.error('Error creating adoption request notification:', error);
      throw error;
    }
  }

  /**
   * Create adoption status change notification
   */
  async createAdoptionStatusChangeNotification(
    adoptionRequestId,
    newStatus,
    userId
  ) {
    try {
      const adoptionRequest = await AdoptionRequest.findById(adoptionRequestId)
        .populate('user', 'name')
        .populate('pet', 'name')
        .populate('shelter', 'name');

      if (!adoptionRequest) {
        throw new Error('Adoption request not found');
      }

      const statusMessages = {
        approved: 'Your adoption request has been approved!',
        rejected: 'Your adoption request has been rejected.',
        scheduled: 'A meeting has been scheduled for your adoption request.',
        completed: 'Your adoption has been completed successfully!',
      };

      const notificationData = {
        recipient: userId,
        sender: adoptionRequest.shelter._id,
        type: 'adoption_status_change',
        title: 'Adoption Request Update',
        message:
          statusMessages[newStatus] ||
          `Your adoption request status has been updated to ${newStatus}`,
        data: {
          adoptionRequestId: adoptionRequest._id,
          petId: adoptionRequest.pet._id,
          status: newStatus,
          actionUrl: `/adoptions/${adoptionRequest._id}`,
          actionText: 'View Details',
          priority:
            newStatus === 'approved' || newStatus === 'completed'
              ? 'high'
              : 'medium',
        },
        sendEmail: false, // In-app only for status change notifications
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      logger.error(
        'Error creating adoption status change notification:',
        error
      );
      throw error;
    }
  }

  /**
   * Create new message notification
   * Note: Chat functionality moved to separate communication app
   */
  async createNewMessageNotification(chatId, senderId, recipientId, message) {
    try {
      const sender = await User.findById(senderId).select('name');

      if (!sender) {
        throw new Error('Sender not found');
      }

      const notificationData = {
        recipient: recipientId,
        sender: senderId,
        type: 'new_message',
        title: 'New Message',
        message: `${sender.name} sent you a message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
        data: {
          chatId: chatId,
          actionUrl: `http://localhost:3000?chatId=${chatId}`, // Points to communication app
          actionText: 'Open Chat',
          priority: 'medium',
        },
        sendEmail: false, // Don't send email for every message
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      logger.error('Error creating new message notification:', error);
      throw error;
    }
  }

  /**
   * Create pet status change notification
   */
  async createPetStatusChangeNotification(petId, newStatus, shelterId) {
    try {
      const pet = await Pet.findById(petId);

      if (!pet) {
        throw new Error('Pet not found');
      }

      // Notify users who have favorited this pet
      const favoriteUsers = await User.find({
        favoritePets: petId,
      }).select('_id');

      const statusMessages = {
        adopted: `${pet.name} has been adopted!`,
        available: `${pet.name} is now available for adoption!`,
        pending: `${pet.name} is pending adoption.`,
      };

      const notifications = [];

      for (const user of favoriteUsers) {
        const notificationData = {
          recipient: user._id,
          type: 'pet_status_change',
          title: 'Pet Status Update',
          message:
            statusMessages[newStatus] ||
            `${pet.name}'s status has been updated to ${newStatus}`,
          data: {
            petId: pet._id,
            status: newStatus,
            actionUrl: `/pets/${pet._id}`,
            actionText: 'View Pet',
            priority: 'medium',
          },
          sendEmail: false,
        };

        notifications.push(this.createNotification(notificationData));
      }

      return await Promise.all(notifications);
    } catch (error) {
      logger.error('Error creating pet status change notification:', error);
      throw error;
    }
  }

  /**
   * Create review received notification
   */
  async createReviewReceivedNotification(reviewId, shelterId) {
    try {
      const review = await Review.findById(reviewId)
        .populate('user', 'name')
        .populate('shelter', 'name');

      if (!review) {
        throw new Error('Review not found');
      }

      // Handle user name safely
      const userName =
        review.user?.name?.trim() ||
        (review.user?.email ? review.user.email.split('@')[0] : 'Unknown User');

      const notificationData = {
        recipient: shelterId,
        sender: review.user._id,
        type: 'review_received',
        title: 'New Review Received',
        message: `${userName} left a ${review.rating}-star review for your shelter`,
        data: {
          reviewId: review._id,
          actionUrl: `/shelter/reviews`,
          actionText: 'View Review',
          priority: 'medium',
        },
        sendEmail: true,
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      logger.error('Error creating review received notification:', error);
      throw error;
    }
  }

  /**
   * Create system alert notification
   */
  async createSystemAlertNotification(
    userId,
    title,
    message,
    priority = 'medium'
  ) {
    try {
      const notificationData = {
        recipient: userId,
        type: 'system_alert',
        title,
        message,
        data: {
          priority,
          actionUrl: '/dashboard',
          actionText: 'View Dashboard',
        },
        sendEmail: priority === 'urgent' || priority === 'high',
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      logger.error('Error creating system alert notification:', error);
      throw error;
    }
  }

  /**
   * Create reminder notification
   */
  async createReminderNotification(userId, title, message, actionUrl = null) {
    try {
      return await this.createNotification({
        recipient: userId,
        type: 'reminder',
        title,
        message,
        data: {
          actionUrl,
          actionText: 'View Details',
        },
        sendEmail: false, // In-app only for reminder notifications
      });
    } catch (error) {
      logger.error('Error creating reminder notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for information request
   */
  async createInformationRequestNotification(
    adoptionRequestId,
    userId,
    requestData
  ) {
    try {
      const adoptionRequest = await AdoptionRequest.findById(adoptionRequestId)
        .populate('pet', 'name')
        .populate('shelter', 'name');

      if (!adoptionRequest) {
        throw new Error('Adoption request not found');
      }

      const title = 'Additional Information Requested';
      const message = `The shelter has requested additional information for your adoption application for ${adoptionRequest.pet.name}. Please review and respond by ${new Date(requestData.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}.`;

      return await this.createNotification({
        recipient: userId,
        type: 'information_request',
        title,
        message,
        data: {
          adoptionRequestId,
          requestTitle: requestData.title,
          dueDate: requestData.dueDate,
          isUrgent: requestData.isUrgent,
          actionUrl: `/adoptions/${adoptionRequestId}`,
          actionText: 'View Request',
        },
        sendEmail: false, // In-app only for information request notifications
      });
    } catch (error) {
      logger.error('Error creating information request notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for information response submitted
   */
  async createInformationSubmittedNotification(
    adoptionRequestId,
    shelterId,
    informationRequestId
  ) {
    try {
      const adoptionRequest = await AdoptionRequest.findById(adoptionRequestId)
        .populate('user', 'name')
        .populate('pet', 'name');

      if (!adoptionRequest) {
        throw new Error('Adoption request not found');
      }

      // Handle user name safely
      const userName =
        adoptionRequest.user?.name?.trim() ||
        (adoptionRequest.user?.email
          ? adoptionRequest.user.email.split('@')[0]
          : 'Unknown User');
      const petName = adoptionRequest.pet?.name || 'Unknown Pet';

      const title = 'Information Response Submitted';
      const message = `${userName} has submitted additional information for their adoption application for ${petName}. Please review their response.`;

      return await this.createNotification({
        recipient: shelterId,
        type: 'information_submitted',
        title,
        message,
        data: {
          adoptionRequestId,
          informationRequestId,
          actionUrl: `/shelter/adoption-requests`,
          actionText: 'View Requests',
        },
        sendEmail: false, // Disabled email for information submitted notifications to shelters
      });
    } catch (error) {
      logger.error('Error creating information submitted notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for information request review
   */
  async createInformationReviewNotification(
    adoptionRequestId,
    userId,
    informationRequestId,
    status
  ) {
    try {
      const adoptionRequest = await AdoptionRequest.findById(adoptionRequestId)
        .populate('pet', 'name')
        .populate('shelter', 'name');

      if (!adoptionRequest) {
        throw new Error('Adoption request not found');
      }

      const title = `Information Request ${status.charAt(0).toUpperCase() + status.slice(1)}`;
      const message = `Your additional information for the adoption application for ${adoptionRequest.pet.name} has been ${status}.`;

      return await this.createNotification({
        recipient: userId,
        type: 'information_reviewed',
        title,
        message,
        data: {
          adoptionRequestId,
          informationRequestId,
          status,
          actionUrl: `/adoptions/${adoptionRequestId}`,
          actionText: 'View Details',
        },
        sendEmail: false, // In-app only for information review notifications
      });
    } catch (error) {
      logger.error('Error creating information review notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for information request reminder
   */
  async createInformationRequestReminder(
    adoptionRequestId,
    userId,
    informationRequestId,
    reminderMethod = 'email'
  ) {
    try {
      const adoptionRequest = await AdoptionRequest.findById(adoptionRequestId)
        .populate('pet', 'name')
        .populate('shelter', 'name');

      if (!adoptionRequest) {
        throw new Error('Adoption request not found');
      }

      const title = 'Reminder: Additional Information Requested';
      const message = `This is a friendly reminder that additional information is still needed for your adoption application for ${adoptionRequest.pet.name}. Please submit your response as soon as possible.`;

      return await this.createNotification({
        recipient: userId,
        type: 'information_reminder',
        title,
        message,
        data: {
          adoptionRequestId,
          informationRequestId,
          actionUrl: `/adoptions/${adoptionRequestId}`,
          actionText: 'Submit Response',
        },
        sendEmail: false, // In-app only for information request reminders
      });
    } catch (error) {
      logger.error('Error creating information request reminder:', error);
      throw error;
    }
  }

  /**
   * Create meeting reminder notification
   */
  async createMeetingReminderNotification(
    adoptionRequestId,
    userId,
    meetingData,
    reminderType = 'upcoming'
  ) {
    try {
      const adoptionRequest = await AdoptionRequest.findById(adoptionRequestId)
        .populate('pet', 'name')
        .populate('shelter', 'name')
        .populate('user', 'name');

      if (!adoptionRequest) {
        throw new Error('Adoption request not found');
      }

      const meetingDate = new Date(meetingData.scheduledDate);
      const meetingType = meetingData.type || 'meeting';

      let title, message;
      if (reminderType === 'upcoming') {
        title = 'Upcoming Meeting Reminder';
        message = `You have a ${meetingType} scheduled for ${meetingDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} at ${meetingDate.toLocaleTimeString()} for your adoption application for ${adoptionRequest.pet.name}.`;
      } else {
        title = 'Meeting Reminder';
        message = `This is a reminder about your ${meetingType} for ${adoptionRequest.pet.name} scheduled for ${meetingDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}.`;
      }

      return await this.createNotification({
        recipient: userId,
        type: 'meeting_reminder',
        title,
        message,
        data: {
          adoptionRequestId,
          meetingId: meetingData._id,
          meetingType,
          scheduledDate: meetingData.scheduledDate,
          actionUrl: `/adoptions/${adoptionRequestId}`,
          actionText: 'View Details',
        },
        sendEmail: false, // In-app only for meeting reminder notifications
      });
    } catch (error) {
      logger.error('Error creating meeting reminder notification:', error);
      throw error;
    }
  }

  /**
   * Create follow-up reminder notification
   */
  async createFollowUpReminderNotification(
    adoptionRequestId,
    userId,
    followUpData,
    reminderType = 'upcoming'
  ) {
    try {
      const adoptionRequest = await AdoptionRequest.findById(adoptionRequestId)
        .populate('pet', 'name')
        .populate('shelter', 'name')
        .populate('user', 'name');

      if (!adoptionRequest) {
        throw new Error('Adoption request not found');
      }

      const followUpDate = new Date(followUpData.scheduledDate);
      const followUpType = followUpData.type || 'follow-up';

      let title, message;
      if (reminderType === 'upcoming') {
        title = 'Upcoming Follow-up Reminder';
        message = `You have a ${followUpType} scheduled for ${followUpDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} at ${followUpDate.toLocaleTimeString()} for your adoption of ${adoptionRequest.pet.name}.`;
      } else {
        title = 'Follow-up Reminder';
        message = `This is a reminder about your ${followUpType} for ${adoptionRequest.pet.name} scheduled for ${followUpDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}.`;
      }

      return await this.createNotification({
        recipient: userId,
        type: 'follow_up_reminder',
        title,
        message,
        data: {
          adoptionRequestId,
          followUpId: followUpData._id,
          followUpType,
          scheduledDate: followUpData.scheduledDate,
          actionUrl: `/adoptions/${adoptionRequestId}`,
          actionText: 'View Details',
        },
        sendEmail: false, // In-app only for follow-up reminder notifications
      });
    } catch (error) {
      logger.error('Error creating follow-up reminder notification:', error);
      throw error;
    }
  }

  /**
   * Create contract sent notification
   */
  async createContractSentNotification(
    adoptionRequestId,
    userId,
    contractData
  ) {
    try {
      const adoptionRequest = await AdoptionRequest.findById(adoptionRequestId)
        .populate('pet', 'name')
        .populate('shelter', 'name')
        .populate('user', 'name');

      if (!adoptionRequest) {
        throw new Error('Adoption request not found');
      }

      const title = 'Contract Ready for Signing';
      const message = `${contractData.shelterName} has sent you a contract for adopting ${contractData.petName}. Please review and sign the contract to proceed with your adoption.`;

      return await this.createNotification({
        recipient: userId,
        type: 'contract_sent',
        title,
        message,
        data: {
          adoptionRequestId,
          contractTitle: contractData.contractTitle,
          petName: contractData.petName,
          shelterName: contractData.shelterName,
          actionUrl: `/adoption-tracker?requestId=${adoptionRequestId}&tab=contract`,
          actionText: 'View Contract',
        },
        sendEmail: true, // Send email for important contract notifications
      });
    } catch (error) {
      logger.error('Error creating contract sent notification:', error);
      throw error;
    }
  }
}

export default new NotificationService();
