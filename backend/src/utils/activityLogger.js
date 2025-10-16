import activityService from '../modules/activity/activity.service.js';
import logger from './logger.js';

/**
 * Activity Logger Utility
 * Provides easy-to-use functions for logging activities throughout the application
 */

/**
 * Log a pet-related activity
 * @param {Object} user - User performing the action
 * @param {string} action - Action type
 * @param {Object} pet - Pet object
 * @param {Object} req - Express request object (for IP/device info)
 * @param {Object} metadata - Additional metadata
 */
export const logPetActivity = async (user, action, pet, req, metadata = {}) => {
  try {
    const logData = {
      action,
      category: 'pet',
      severity: getSeverityForAction(action),
      description: generatePetDescription(action, pet, metadata),
      performedBy: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      shelter: user.shelter,
      metadata: {
        petId: pet._id,
        petName: pet.name,
        ipAddress:
          req.ip ||
          req.connection?.remoteAddress ||
          req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        method: req.method,
        path: req.path,
        ...metadata,
      },
    };

    await activityService.createActivityLog(logData);
  } catch (error) {
    logger.error('Error logging pet activity:', error);
  }
};

/**
 * Log an adoption-related activity
 * @param {Object} user - User performing the action
 * @param {string} action - Action type
 * @param {Object} adoption - Adoption object
 * @param {Object} req - Express request object (for IP/device info)
 * @param {Object} metadata - Additional metadata
 */
export const logAdoptionActivity = async (
  user,
  action,
  adoption,
  req,
  metadata = {}
) => {
  try {
    const logData = {
      action,
      category: 'adoption',
      severity: getSeverityForAction(action),
      description: generateAdoptionDescription(action, adoption, metadata),
      performedBy: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      shelter: user.shelter,
      metadata: {
        adoptionId: adoption._id,
        petId: adoption.pet,
        ipAddress:
          req.ip ||
          req.connection?.remoteAddress ||
          req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        method: req.method,
        path: req.path,
        ...metadata,
      },
    };

    await activityService.createActivityLog(logData);
  } catch (error) {
    logger.error('Error logging adoption activity:', error);
  }
};

/**
 * Log a user-related activity
 * @param {Object} user - User performing the action
 * @param {string} action - Action type
 * @param {Object} req - Express request object (for IP/device info)
 * @param {Object} targetUser - Target user object (if applicable)
 * @param {Object} metadata - Additional metadata
 *
 * IMPORTANT: User activities are only associated with shelters when they directly
 * impact shelter operations. Profile changes like avatar updates, password changes,
 * etc. are NOT associated with shelters to maintain user privacy.
 */
export const logUserActivity = async (
  user,
  action,
  req,
  targetUser = null,
  metadata = {}
) => {
  try {
    // Only associate user activities with shelter when they're directly related to shelter operations
    const shelterRelatedActions = [
      'adoption_request_created',
      'adoption_request_updated',
      'adoption_request_approved',
      'adoption_request_rejected',
      'adoption_request_cancelled',
      'adoption_completed',
      'review_created',
      'review_updated',
      'review_deleted',
      'meeting_scheduled',
      'meeting_completed',
      'information_requested',
      'information_provided',
    ];

    const isShelterRelated = shelterRelatedActions.includes(action);

    const logData = {
      action,
      category: 'user',
      severity: getSeverityForAction(action),
      description: generateUserDescription(action, user, targetUser, metadata),
      performedBy: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      // Only set shelter field for shelter-related activities
      shelter: isShelterRelated ? user.shelter : undefined,
      metadata: {
        targetUserId: targetUser?._id,
        targetUserName: targetUser?.name,
        ipAddress:
          req.ip ||
          req.connection?.remoteAddress ||
          req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        method: req.method,
        path: req.path,
        ...metadata,
      },
    };

    await activityService.createActivityLog(logData);
  } catch (error) {
    logger.error('Error logging user activity:', error);
  }
};

/**
 * Log a system-related activity
 * @param {Object} user - User performing the action
 * @param {string} action - Action type
 * @param {Object} req - Express request object (for IP/device info)
 * @param {Object} metadata - Additional metadata
 */
export const logSystemActivity = async (user, action, req, metadata = {}) => {
  try {
    const logData = {
      action,
      category: 'system',
      severity: getSeverityForAction(action),
      description: generateSystemDescription(action, user, metadata),
      performedBy: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      shelter: user.shelter,
      metadata: {
        ipAddress:
          req.ip ||
          req.connection?.remoteAddress ||
          req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        method: req.method,
        path: req.path,
        ...metadata,
      },
    };

    await activityService.createActivityLog(logData);
  } catch (error) {
    logger.error('Error logging system activity:', error);
  }
};

/**
 * Log a file-related activity
 * @param {Object} user - User performing the action
 * @param {string} action - Action type
 * @param {Object} fileInfo - File information
 * @param {Object} req - Express request object (for IP/device info)
 * @param {Object} metadata - Additional metadata
 */
export const logFileActivity = async (
  user,
  action,
  fileInfo,
  req,
  metadata = {}
) => {
  try {
    const logData = {
      action,
      category: 'file',
      severity: getSeverityForAction(action),
      description: generateFileDescription(action, fileInfo, metadata),
      performedBy: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      shelter: user.shelter,
      metadata: {
        fileName: fileInfo.name,
        fileSize: fileInfo.size,
        fileType: fileInfo.type,
        fileUrl: fileInfo.url,
        ipAddress:
          req.ip ||
          req.connection?.remoteAddress ||
          req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        method: req.method,
        path: req.path,
        ...metadata,
      },
    };

    await activityService.createActivityLog(logData);
  } catch (error) {
    logger.error('Error logging file activity:', error);
  }
};

/**
 * Log a chat-related activity
 * @param {Object} user - User performing the action
 * @param {string} action - Action type
 * @param {Object} chatInfo - Chat information
 * @param {Object} req - Express request object (for IP/device info)
 * @param {Object} metadata - Additional metadata
 */
export const logChatActivity = async (
  user,
  action,
  chatInfo,
  req,
  metadata = {}
) => {
  try {
    const logData = {
      action,
      category: 'chat',
      severity: getSeverityForAction(action),
      description: generateChatDescription(action, chatInfo, metadata),
      performedBy: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      shelter: user.shelter,
      metadata: {
        chatId: chatInfo.chatId,
        messageId: chatInfo.messageId,
        ipAddress: req
          ? req.ip ||
            req.connection?.remoteAddress ||
            req.headers['x-forwarded-for']
          : 'unknown',
        userAgent: req?.headers?.['user-agent'] || 'unknown',
        method: req?.method || 'unknown',
        path: req?.path || 'unknown',
        ...metadata,
      },
    };

    await activityService.createActivityLog(logData);
  } catch (error) {
    logger.error('Error logging chat activity:', error);
  }
};

/**
 * Log a review-related activity
 * @param {Object} user - User performing the action
 * @param {string} action - Action type
 * @param {Object} review - Review object
 * @param {Object} req - Express request object (for IP/device info)
 * @param {Object} metadata - Additional metadata
 */
export const logReviewActivity = async (
  user,
  action,
  review,
  req,
  metadata = {}
) => {
  try {
    const logData = {
      action,
      category: 'review',
      severity: getSeverityForAction(action),
      description: generateReviewDescription(action, review, metadata),
      performedBy: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      shelter: user.shelter,
      metadata: {
        reviewId: review._id,
        ipAddress:
          req.ip ||
          req.connection?.remoteAddress ||
          req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        method: req.method,
        path: req.path,
        ...metadata,
      },
    };

    await activityService.createActivityLog(logData);
  } catch (error) {
    logger.error('Error logging review activity:', error);
  }
};

// Helper functions

/**
 * Get severity level for an action
 * @param {string} action - Action type
 * @returns {string} Severity level
 */
const getSeverityForAction = (action) => {
  const criticalActions = [
    'pet_deleted',
    'user_deleted',
    'shelter_deleted',
    'adoption_request_rejected',
    'password_changed',
    'session_revoked',
  ];

  const highActions = [
    'pet_created',
    'adoption_request_approved',
    'adoption_completed',
    'user_role_changed',
    'file_uploaded',
    'file_deleted',
  ];

  if (criticalActions.includes(action)) return 'critical';
  if (highActions.includes(action)) return 'high';
  if (action.includes('updated') || action.includes('changed')) return 'medium';
  return 'low';
};

/**
 * Generate description for pet activities
 * @param {string} action - Action type
 * @param {Object} pet - Pet object
 * @param {Object} metadata - Additional metadata
 * @returns {string} Description
 */
const generatePetDescription = (action, pet, metadata) => {
  const petName = pet.name || 'Unknown Pet';

  switch (action) {
    case 'pet_created':
      return `${petName} was added to the system`;
    case 'pet_updated':
      return `${petName}'s information was updated`;
    case 'pet_deleted':
      return `${petName} was removed from the system`;
    case 'pet_status_changed':
      return `${petName}'s status was changed from ${metadata.oldStatus} to ${metadata.newStatus}`;
    case 'pet_photo_uploaded':
      return `New photo was uploaded for ${petName}`;
    case 'pet_photo_deleted':
      return `Photo was deleted for ${petName}`;
    case 'health_record_added':
      return `Health record was added for ${petName}`;
    case 'health_record_updated':
      return `Health record was updated for ${petName}`;
    case 'behavior_record_added':
      return `Behavior record was added for ${petName}`;
    case 'behavior_record_updated':
      return `Behavior record was updated for ${petName}`;
    default:
      return `Action performed on ${petName}`;
  }
};

/**
 * Generate description for adoption activities
 * @param {string} action - Action type
 * @param {Object} adoption - Adoption object
 * @param {Object} metadata - Additional metadata
 * @returns {string} Description
 */
const generateAdoptionDescription = (action, adoption, metadata) => {
  const petName = adoption.pet?.name || 'Unknown Pet';
  const userName = adoption.user?.name || 'Unknown User';

  switch (action) {
    case 'adoption_request_created':
      return `Adoption request created for ${petName} by ${userName}`;
    case 'adoption_request_updated':
      return `Adoption request updated for ${petName}`;
    case 'adoption_request_approved':
      return `Adoption request approved for ${petName} by ${userName}`;
    case 'adoption_request_rejected':
      return `Adoption request rejected for ${petName}${metadata.reason ? `: ${metadata.reason}` : ''}`;
    case 'adoption_request_cancelled':
      return `Adoption request cancelled for ${petName}`;
    case 'adoption_completed':
      return `Adoption completed for ${petName} by ${userName}`;
    default:
      return `Adoption action performed for ${petName}`;
  }
};

/**
 * Generate description for user activities
 * @param {string} action - Action type
 * @param {Object} user - User object
 * @param {Object} targetUser - Target user object
 * @param {Object} metadata - Additional metadata
 * @returns {string} Description
 */
const generateUserDescription = (action, user, targetUser, metadata) => {
  const targetName = targetUser?.name || 'Unknown User';

  switch (action) {
    case 'user_registered':
      return `New user ${user.name} registered`;
    case 'user_updated':
      return `User ${user.name} updated their profile`;
    case 'user_deleted':
      return `User ${targetName} was deleted`;
    case 'user_role_changed':
      return `User ${targetName}'s role changed from ${metadata.oldRole} to ${metadata.newRole}`;
    case 'user_status_changed':
      return `User ${targetName}'s status was changed`;
    default:
      return `User action performed by ${user.name}`;
  }
};

/**
 * Generate description for system activities
 * @param {string} action - Action type
 * @param {Object} user - User object
 * @param {Object} metadata - Additional metadata
 * @returns {string} Description
 */
const generateSystemDescription = (action, user, metadata) => {
  switch (action) {
    case 'login':
      return `User ${user.name} logged in`;
    case 'logout':
      return `User ${user.name} logged out`;
    case 'password_changed':
      return `User ${user.name} changed their password`;
    case 'email_verified':
      return `User ${user.name} verified their email`;
    case 'session_created':
      return `New session created for ${user.name}`;
    case 'session_revoked':
      return `Session revoked for ${user.name}`;
    default:
      return `System action performed by ${user.name}`;
  }
};

/**
 * Generate description for file activities
 * @param {string} action - Action type
 * @param {Object} fileInfo - File information
 * @param {Object} metadata - Additional metadata
 * @returns {string} Description
 */
const generateFileDescription = (action, fileInfo, metadata) => {
  const fileName = fileInfo.name || 'Unknown file';

  switch (action) {
    case 'file_uploaded':
      return `File "${fileName}" was uploaded`;
    case 'file_deleted':
      return `File "${fileName}" was deleted`;
    case 'document_uploaded':
      return `Document "${fileName}" was uploaded`;
    case 'document_deleted':
      return `Document "${fileName}" was deleted`;
    default:
      return `File action performed on "${fileName}"`;
  }
};

/**
 * Generate description for chat activities
 * @param {string} action - Action type
 * @param {Object} chatInfo - Chat information
 * @param {Object} metadata - Additional metadata
 * @returns {string} Description
 */
const generateChatDescription = (action, chatInfo, metadata) => {
  switch (action) {
    case 'chat_created':
      return 'New chat conversation created';
    case 'message_sent':
      return 'Message sent in chat';
    case 'message_deleted':
      return 'Message deleted from chat';
    case 'chat_archived':
      return 'Chat conversation archived';
    default:
      return 'Chat action performed';
  }
};

/**
 * Generate description for review activities
 * @param {string} action - Action type
 * @param {Object} review - Review object
 * @param {Object} metadata - Additional metadata
 * @returns {string} Description
 */
const generateReviewDescription = (action, review, metadata) => {
  const petName = review.pet?.name || 'Unknown Pet';

  switch (action) {
    case 'review_created':
      return `New review created for ${petName}`;
    case 'review_updated':
      return `Review updated for ${petName}`;
    case 'review_deleted':
      return `Review deleted for ${petName}`;
    default:
      return `Review action performed for ${petName}`;
  }
};

export default {
  logPetActivity,
  logAdoptionActivity,
  logUserActivity,
  logSystemActivity,
  logFileActivity,
  logChatActivity,
  logReviewActivity,
};
