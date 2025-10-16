import Message from './message.model.js';
import Conversation from '../conversation/conversation.model.js';
import logger from '../../utils/logger.js';
import { ApiError } from '../../utils/errors.js';
import { zimService } from '../../services/zim.service.js';

class MessageService {
  /**
   * Create and send a new message
   * @param {Object} messageData - Message data
   * @returns {Object} Created message
   */
  async createMessage(messageData) {
    try {
      const {
        conversationId,
        senderId,
        role,
        type = 'text',
        content,
        attachments = [],
        extendedData = {},
        metadata = {},
        sendViaZIM = true,
      } = messageData;

      // Check for duplicate by clientMsgId for idempotency
      if (metadata.clientMsgId) {
        const existingMessage = await Message.findOne({
          'metadata.clientMsgId': metadata.clientMsgId,
          conversationId: conversationId,
        });

        if (existingMessage) {
          logger.info(
            `Duplicate message detected by clientMsgId: ${metadata.clientMsgId}, returning existing message`
          );
          return existingMessage;
        }
      }

      // Validate required fields
      if (!conversationId || !senderId || !role) {
        throw new ApiError(
          400,
          'conversationId, senderId, and role are required'
        );
      }

      // Validate role
      if (!['user', 'shelter'].includes(role)) {
        throw new ApiError(400, 'Role must be either "user" or "shelter"');
      }

      // Validate type
      if (!['text', 'image', 'file', 'system'].includes(type)) {
        throw new ApiError(
          400,
          'Type must be one of: text, image, file, system'
        );
      }

      // Validate content for non-system messages
      if (type !== 'system' && !content) {
        throw new ApiError(400, 'Content is required for non-system messages');
      }

      // Check if conversation exists and user has access
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new ApiError(404, 'Conversation not found');
      }

      // Verify sender is a participant
      const isParticipant =
        conversation.userId.toString() === senderId.toString() ||
        conversation.shelterId.toString() === senderId.toString();

      if (!isParticipant) {
        throw new ApiError(
          403,
          'You are not a participant in this conversation'
        );
      }

      // Sanitize extendedData to keep only allowed fields
      const sanitizedExtendedData = this.sanitizeExtendedData(extendedData, {
        conversationId,
        petId: conversation.petId,
        shelterId: conversation.shelterId,
      });

      // Create message
      const message = new Message({
        conversationId,
        senderId,
        role,
        type,
        content,
        attachments,
        extendedData: sanitizedExtendedData,
        metadata: {
          ...metadata,
          messageSeq: await this.getNextMessageSeq(conversationId),
        },
        status: 'sent',
      });

      await message.save();

      // Send via ZIM if requested
      if (sendViaZIM && type !== 'system') {
        try {
          await this.sendMessageViaZIM(message, conversation);
        } catch (zimError) {
          logger.error('Failed to send message via ZIM:', zimError);
          // Don't fail the entire operation, just log the error
          // The message is still saved in the database
        }
      }

      logger.info(
        `Message created: ${message._id} in conversation ${conversationId}`
      );

      return message;
    } catch (error) {
      logger.error('Error creating message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} options - Query options
   * @returns {Array} Messages
   */
  async getMessages(conversationId, options = {}) {
    try {
      const {
        limit = 50,
        before,
        after,
        type,
        role,
        status,
        sort = { createdAt: -1 },
      } = options;

      // Check if conversation exists
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new ApiError(404, 'Conversation not found');
      }

      const messages = await Message.findByConversation(conversationId, {
        limit,
        before,
        after,
        type,
        role,
        status,
        sort,
      });

      return messages;
    } catch (error) {
      logger.error('Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Get a specific message by ID
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID for access control
   * @returns {Object} Message
   */
  async getMessage(messageId, userId) {
    try {
      const message = await Message.findById(messageId)
        .populate('senderId', 'firstName lastName name avatar')
        .populate('readBy.userId', 'firstName lastName name avatar')
        .populate('deliveredTo.userId', 'firstName lastName name avatar')
        .populate('reactions.userId', 'firstName lastName name avatar');

      if (!message) {
        throw new ApiError(404, 'Message not found');
      }

      // Check if user has access to this message
      const conversation = await Conversation.findById(message.conversationId);
      if (!conversation) {
        throw new ApiError(404, 'Conversation not found');
      }

      const isParticipant =
        conversation.userId.toString() === userId.toString() ||
        conversation.shelterId.toString() === userId.toString();

      if (!isParticipant) {
        throw new ApiError(403, 'Access denied');
      }

      return message;
    } catch (error) {
      logger.error('Error getting message:', error);
      throw error;
    }
  }

  /**
   * Mark message as read
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Object} Updated message
   */
  async markAsRead(messageId, userId, userRole) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new ApiError(404, 'Message not found');
      }

      // Check if user has access to this message
      const conversation = await Conversation.findById(message.conversationId);
      if (!conversation) {
        throw new ApiError(404, 'Conversation not found');
      }

      const isParticipant =
        conversation.userId.toString() === userId.toString() ||
        conversation.shelterId.toString() === userId.toString();

      if (!isParticipant) {
        throw new ApiError(403, 'Access denied');
      }

      await message.markAsRead(userId, userRole);

      // Update unread counters
      await this.updateUnreadCounters(
        message.conversationId,
        userId,
        'decrement'
      );

      logger.info(`Message ${messageId} marked as read by user ${userId}`);

      return message;
    } catch (error) {
      logger.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Mark message as delivered
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Object} Updated message
   */
  async markAsDelivered(messageId, userId, userRole) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new ApiError(404, 'Message not found');
      }

      // Check if user has access to this message
      const conversation = await Conversation.findById(message.conversationId);
      if (!conversation) {
        throw new ApiError(404, 'Conversation not found');
      }

      const isParticipant =
        conversation.userId.toString() === userId.toString() ||
        conversation.shelterId.toString() === userId.toString();

      if (!isParticipant) {
        throw new ApiError(403, 'Access denied');
      }

      await message.markAsDelivered(userId, userRole);

      logger.info(`Message ${messageId} marked as delivered to user ${userId}`);

      return message;
    } catch (error) {
      logger.error('Error marking message as delivered:', error);
      throw error;
    }
  }

  /**
   * Add reaction to message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @param {string} emoji - Emoji reaction
   * @returns {Object} Updated message
   */
  async addReaction(messageId, userId, emoji) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new ApiError(404, 'Message not found');
      }

      // Check if user has access to this message
      const conversation = await Conversation.findById(message.conversationId);
      if (!conversation) {
        throw new ApiError(404, 'Conversation not found');
      }

      const isParticipant =
        conversation.userId.toString() === userId.toString() ||
        conversation.shelterId.toString() === userId.toString();

      if (!isParticipant) {
        throw new ApiError(403, 'Access denied');
      }

      await message.addReaction(userId, emoji);

      logger.info(`Reaction added to message ${messageId} by user ${userId}`);

      return message;
    } catch (error) {
      logger.error('Error adding reaction:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @returns {Object} Updated message
   */
  async removeReaction(messageId, userId) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new ApiError(404, 'Message not found');
      }

      // Check if user has access to this message
      const conversation = await Conversation.findById(message.conversationId);
      if (!conversation) {
        throw new ApiError(404, 'Conversation not found');
      }

      const isParticipant =
        conversation.userId.toString() === userId.toString() ||
        conversation.shelterId.toString() === userId.toString();

      if (!isParticipant) {
        throw new ApiError(403, 'Access denied');
      }

      await message.removeReaction(userId);

      logger.info(
        `Reaction removed from message ${messageId} by user ${userId}`
      );

      return message;
    } catch (error) {
      logger.error('Error removing reaction:', error);
      throw error;
    }
  }

  /**
   * Edit message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @param {string} newContent - New content
   * @param {Array} newAttachments - New attachments
   * @returns {Object} Updated message
   */
  async editMessage(messageId, userId, newContent, newAttachments = []) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new ApiError(404, 'Message not found');
      }

      // Check if user is the sender
      if (message.senderId.toString() !== userId.toString()) {
        throw new ApiError(403, 'You can only edit your own messages');
      }

      // Check if message is not too old (e.g., 24 hours)
      const messageAge = Date.now() - message.createdAt.getTime();
      const maxEditAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      if (messageAge > maxEditAge) {
        throw new ApiError(400, 'Message is too old to edit');
      }

      await message.editMessage(newContent, newAttachments);

      logger.info(`Message ${messageId} edited by user ${userId}`);

      return message;
    } catch (error) {
      logger.error('Error editing message:', error);
      throw error;
    }
  }

  /**
   * Delete message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @returns {Object} Updated message
   */
  async deleteMessage(messageId, userId) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new ApiError(404, 'Message not found');
      }

      // Check if user is the sender
      if (message.senderId.toString() !== userId.toString()) {
        throw new ApiError(403, 'You can only delete your own messages');
      }

      await message.softDelete(userId);

      logger.info(`Message ${messageId} deleted by user ${userId}`);

      return message;
    } catch (error) {
      logger.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Get unread message count for user in conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @param {Date} lastReadAt - Last read timestamp
   * @returns {number} Unread count
   */
  async getUnreadCount(conversationId, userId, lastReadAt = null) {
    try {
      return await Message.getUnreadCount(conversationId, userId, lastReadAt);
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Get messages by pet
   * @param {string} petId - Pet ID
   * @param {Object} options - Query options
   * @returns {Array} Messages
   */
  async getMessagesByPet(petId, options = {}) {
    try {
      return await Message.findByPet(petId, options);
    } catch (error) {
      logger.error('Error getting messages by pet:', error);
      throw error;
    }
  }

  /**
   * Get system messages
   * @param {string} conversationId - Conversation ID
   * @param {string} systemType - System message type
   * @returns {Array} System messages
   */
  async getSystemMessages(conversationId, systemType = null) {
    try {
      return await Message.findSystemMessages(conversationId, systemType);
    } catch (error) {
      logger.error('Error getting system messages:', error);
      throw error;
    }
  }

  /**
   * Get message statistics
   * @param {string} conversationId - Conversation ID
   * @returns {Object} Message statistics
   */
  async getMessageStats(conversationId) {
    try {
      const stats = await Message.getMessageStats(conversationId);
      return (
        stats[0] || {
          totalMessages: 0,
          textMessages: 0,
          imageMessages: 0,
          fileMessages: 0,
          systemMessages: 0,
          userMessages: 0,
          shelterMessages: 0,
          sentMessages: 0,
          deliveredMessages: 0,
          readMessages: 0,
        }
      );
    } catch (error) {
      logger.error('Error getting message stats:', error);
      throw error;
    }
  }

  /**
   * Get next message sequence number for conversation
   * @param {string} conversationId - Conversation ID
   * @returns {number} Next sequence number
   */
  async getNextMessageSeq(conversationId) {
    try {
      const lastMessage = await Message.findOne(
        { conversationId },
        { 'metadata.messageSeq': 1 }
      )
        .sort({ 'metadata.messageSeq': -1 })
        .limit(1);

      return lastMessage ? (lastMessage.metadata.messageSeq || 0) + 1 : 1;
    } catch (error) {
      logger.error('Error getting next message seq:', error);
      return 1;
    }
  }

  /**
   * Sync message status with ZIM
   * @param {string} messageId - Message ID
   * @param {string} status - New status
   * @param {Object} zimData - ZIM synchronization data
   * @returns {Object} Updated message
   */
  async syncMessageStatus(messageId, status, zimData = {}) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new ApiError(404, 'Message not found');
      }

      // Update status
      message.status = status;

      // Update ZIM data
      if (zimData.zimMessageId) {
        message.metadata.zimMessageId = zimData.zimMessageId;
      }

      if (zimData.zimTimestamp) {
        message.metadata.zimTimestamp = zimData.zimTimestamp;
      }

      await message.save();

      logger.info(`Message ${messageId} status synced to ${status}`);

      return message;
    } catch (error) {
      logger.error('Error syncing message status:', error);
      throw error;
    }
  }

  /**
   * Send message via ZIM
   * @param {Object} message - Message object
   * @param {Object} conversation - Conversation object
   * @returns {Object} ZIM send result
   */
  async sendMessageViaZIM(message, conversation) {
    try {
      // Prepare ZIM message data
      const zimMessageData = {
        type: this.mapMessageTypeToZIM(message.type),
        message: message.content,
        extendedData: JSON.stringify({
          messageId: message._id.toString(),
          conversationId: message.conversationId.toString(),
          petId: conversation.petId?.toString(),
          shelterId: conversation.shelterId.toString(),
          senderRole: message.role,
          attachments: message.attachments,
          metadata: message.metadata,
        }),
      };

      // Determine ZIM conversation type and ID
      const zimConversationType = 0; // Group conversation
      const zimConversationId = conversation.zim.groupId;

      // Send via ZIM
      const zimResult = await zimService.sendMessage(
        zimMessageData,
        zimConversationId,
        zimConversationType
      );

      // Update message with ZIM data
      if (zimResult && zimResult.messageID) {
        message.metadata.zimMessageId = zimResult.messageID;
        message.metadata.zimTimestamp = zimResult.timestamp;
        await message.save();
      }

      logger.info(
        `Message ${message._id} sent via ZIM to group ${zimConversationId}`
      );

      return zimResult;
    } catch (error) {
      logger.error('Error sending message via ZIM:', error);
      throw error;
    }
  }

  /**
   * Handle ZIM message delivery event
   * @param {string} zimMessageId - ZIM message ID
   * @param {string} userId - User ID who received the message
   * @param {string} userRole - User role
   * @returns {Object} Updated message
   */
  async handleZIMDeliveryEvent(zimMessageId, userId, userRole) {
    try {
      const message = await Message.findOne({
        'metadata.zimMessageId': zimMessageId,
      });

      if (!message) {
        logger.warn(`Message not found for ZIM message ID: ${zimMessageId}`);
        return null;
      }

      await message.markAsDelivered(userId, userRole);

      logger.info(
        `Message ${message._id} delivered to user ${userId} via ZIM event`
      );

      return message;
    } catch (error) {
      logger.error('Error handling ZIM delivery event:', error);
      throw error;
    }
  }

  /**
   * Handle ZIM message read event
   * @param {string} zimMessageId - ZIM message ID
   * @param {string} userId - User ID who read the message
   * @param {string} userRole - User role
   * @returns {Object} Updated message
   */
  async handleZIMReadEvent(zimMessageId, userId, userRole) {
    try {
      const message = await Message.findOne({
        'metadata.zimMessageId': zimMessageId,
      });

      if (!message) {
        logger.warn(`Message not found for ZIM message ID: ${zimMessageId}`);
        return null;
      }

      await message.markAsRead(userId, userRole);

      // Update unread counters
      await this.updateUnreadCounters(
        message.conversationId,
        userId,
        'decrement'
      );

      logger.info(
        `Message ${message._id} read by user ${userId} via ZIM event`
      );

      return message;
    } catch (error) {
      logger.error('Error handling ZIM read event:', error);
      throw error;
    }
  }

  /**
   * Update unread counters for conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @param {string} operation - 'increment' or 'decrement'
   * @returns {Object} Updated conversation
   */
  async updateUnreadCounters(conversationId, userId, operation) {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new ApiError(404, 'Conversation not found');
      }

      // Determine which counter to update
      const isUser = conversation.userId.toString() === userId.toString();
      const counterField = isUser ? 'unread.user' : 'unread.shelter';

      if (operation === 'increment') {
        conversation.unread[isUser ? 'user' : 'shelter'] += 1;
      } else if (operation === 'decrement') {
        conversation.unread[isUser ? 'user' : 'shelter'] = Math.max(
          0,
          conversation.unread[isUser ? 'user' : 'shelter'] - 1
        );
      }

      await conversation.save();

      logger.info(
        `Unread counter ${operation}ed for conversation ${conversationId}`
      );

      return conversation;
    } catch (error) {
      logger.error('Error updating unread counters:', error);
      throw error;
    }
  }

  /**
   * Sanitize extendedData to keep only allowed fields
   * @param {Object} extendedData - Original extended data
   * @param {Object} allowedFields - Allowed field values
   * @returns {Object} Sanitized extended data
   */
  sanitizeExtendedData(extendedData, allowedFields) {
    const allowedKeys = ['petId', 'shelterId', 'conversationId', 'adoptionId'];
    const sanitized = {};

    // Keep only allowed keys
    allowedKeys.forEach((key) => {
      if (extendedData[key]) {
        sanitized[key] = extendedData[key];
      }
    });

    // Add conversation context if not present
    if (allowedFields.conversationId && !sanitized.conversationId) {
      sanitized.conversationId = allowedFields.conversationId;
    }

    if (allowedFields.petId && !sanitized.petId) {
      sanitized.petId = allowedFields.petId;
    }

    if (allowedFields.shelterId && !sanitized.shelterId) {
      sanitized.shelterId = allowedFields.shelterId;
    }

    return sanitized;
  }

  /**
   * Map message type to ZIM message type
   * @param {string} messageType - Our message type
   * @returns {number} ZIM message type
   */
  mapMessageTypeToZIM(messageType) {
    const typeMap = {
      text: 1, // ZIM.MessageType.Text
      image: 11, // ZIM.MessageType.Image
      file: 12, // ZIM.MessageType.File
      audio: 13, // ZIM.MessageType.Audio
      video: 14, // ZIM.MessageType.Video
      system: 200, // ZIM.MessageType.Custom
    };

    return typeMap[messageType] || 1; // Default to text
  }

  /**
   * Handle incoming ZIM message
   * @param {Object} zimMessage - ZIM message object
   * @param {string} conversationId - Conversation ID
   * @returns {Object} Created message
   */
  async handleIncomingZIMMessage(zimMessage, conversationId) {
    try {
      // Parse extended data
      let extendedData = {};
      try {
        extendedData = JSON.parse(zimMessage.extendedData || '{}');
      } catch (error) {
        logger.warn('Failed to parse ZIM message extended data:', error);
      }

      // Check for duplicate by clientMsgId for idempotency
      if (extendedData.clientMsgId) {
        const existingMessage = await Message.findOne({
          'metadata.clientMsgId': extendedData.clientMsgId,
          conversationId: conversationId,
        });

        if (existingMessage) {
          logger.info(
            `Duplicate message detected by clientMsgId: ${extendedData.clientMsgId}, returning existing message`
          );
          return existingMessage;
        }
      }

      // Check for duplicate by ZIM message ID
      const existingByZimId = await Message.findOne({
        'metadata.zimMessageId': zimMessage.messageID,
      });

      if (existingByZimId) {
        logger.info(
          `Duplicate message detected by ZIM message ID: ${zimMessage.messageID}, returning existing message`
        );
        return existingByZimId;
      }

      // Determine sender role from extended data or conversation
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new ApiError(404, 'Conversation not found');
      }

      const senderRole =
        extendedData.senderRole ||
        (conversation.userId.toString() === zimMessage.senderUserID
          ? 'user'
          : 'shelter');

      // Create message from ZIM data
      const message = new Message({
        conversationId,
        senderId: zimMessage.senderUserID,
        role: senderRole,
        type: this.mapZIMTypeToMessage(zimMessage.type),
        content: zimMessage.message || '',
        attachments: extendedData.attachments || [],
        extendedData: this.sanitizeExtendedData(extendedData, {
          conversationId,
          petId: conversation.petId,
          shelterId: conversation.shelterId,
        }),
        metadata: {
          zimMessageId: zimMessage.messageID,
          zimTimestamp: zimMessage.timestamp,
          messageSeq: zimMessage.messageSeq,
          clientMsgId: extendedData.clientMsgId, // Add client message ID for idempotency
          ...extendedData.metadata,
        },
        status: 'delivered',
      });

      await message.save();

      // Update unread counters
      await this.updateUnreadCounters(
        conversationId,
        zimMessage.senderUserID,
        'increment'
      );

      logger.info(
        `Incoming ZIM message ${zimMessage.messageID} saved as ${message._id}`
      );

      return message;
    } catch (error) {
      logger.error('Error handling incoming ZIM message:', error);
      throw error;
    }
  }

  /**
   * Map ZIM message type to our message type
   * @param {number} zimType - ZIM message type
   * @returns {string} Our message type
   */
  mapZIMTypeToMessage(zimType) {
    const typeMap = {
      1: 'text', // ZIM.MessageType.Text
      11: 'image', // ZIM.MessageType.Image
      12: 'file', // ZIM.MessageType.File
      13: 'audio', // ZIM.MessageType.Audio
      14: 'video', // ZIM.MessageType.Video
      200: 'system', // ZIM.MessageType.Custom
    };

    return typeMap[zimType] || 'text'; // Default to text
  }

  /**
   * Find duplicate message by ZIM message ID and client message ID
   * @param {string} zimMessageId - ZIM message ID
   * @param {string} extendedData - Extended data containing clientMsgId
   * @returns {Object|null} Existing message or null
   */
  async findDuplicateMessage(zimMessageId, extendedData) {
    try {
      // Check for duplicate by ZIM message ID
      const existingByZimId = await Message.findOne({
        'metadata.zimMessageId': zimMessageId,
      });

      if (existingByZimId) {
        return existingByZimId;
      }

      // Check for duplicate by clientMsgId
      if (extendedData) {
        let parsedExtendedData = {};
        try {
          parsedExtendedData = JSON.parse(extendedData);
        } catch (error) {
          logger.warn(
            'Failed to parse extended data for duplicate check:',
            error
          );
          return null;
        }

        if (parsedExtendedData.clientMsgId) {
          const existingByClientId = await Message.findOne({
            'metadata.clientMsgId': parsedExtendedData.clientMsgId,
          });

          if (existingByClientId) {
            return existingByClientId;
          }
        }
      }

      return null;
    } catch (error) {
      logger.error('Error finding duplicate message:', error);
      return null;
    }
  }

  /**
   * Create message from ZIM data
   * @param {Object} params - Parameters
   * @param {Object} params.zimMessage - ZIM message data
   * @param {string} params.conversationId - Conversation ID
   * @param {number} params.conversationType - Conversation type
   * @returns {Object} Created message
   */
  async createMessageFromZIM({ zimMessage, conversationId, conversationType }) {
    try {
      const {
        messageID,
        senderUserID,
        messageType,
        message: messageContent,
        timestamp,
        extendedData,
        messageSeq,
      } = zimMessage;

      // Parse extended data
      let parsedExtendedData = {};
      try {
        parsedExtendedData = JSON.parse(extendedData || '{}');
      } catch (error) {
        logger.warn('Failed to parse extended data:', error);
      }

      // Find conversation by ZIM group ID
      const conversation = await Conversation.findOne({
        $or: [
          { 'zim.groupId': conversationId },
          { 'zim.conversationId': conversationId },
        ],
      });

      if (!conversation) {
        throw new ApiError(
          404,
          `Conversation not found for ZIM ID: ${conversationId}`
        );
      }

      // Determine sender role
      const senderRole =
        parsedExtendedData.senderRole ||
        (conversation.userId.toString() === senderUserID ? 'user' : 'shelter');

      // Create message
      const message = new Message({
        conversationId: conversation._id,
        senderId: senderUserID,
        role: senderRole,
        type: this.mapZIMTypeToMessageType(messageType),
        content: messageContent || '',
        attachments: parsedExtendedData.attachments || [],
        extendedData: parsedExtendedData,
        metadata: {
          zimMessageId: messageID,
          zimTimestamp: timestamp,
          messageSeq: messageSeq,
          clientMsgId: parsedExtendedData.clientMsgId,
          ...parsedExtendedData.metadata,
        },
        status: 'delivered',
      });

      await message.save();

      // Update conversation with last message info
      await Conversation.findByIdAndUpdate(
        conversation._id,
        {
          $set: {
            lastMessage: {
              messageId: message._id,
              content: messageContent,
              senderId: senderUserID,
              senderRole: senderRole,
              timestamp: new Date(timestamp),
              type: message.type,
            },
            lastMessageAt: new Date(timestamp),
            updatedAt: new Date(),
          },
          $inc: {
            'unreadCounts.$[elem].count': 1,
          },
        },
        {
          arrayFilters: [{ 'elem.user': { $ne: senderUserID } }],
        }
      );

      logger.info(
        `Message created from ZIM: ${message._id} for conversation ${conversation._id}`
      );
      return message;
    } catch (error) {
      logger.error('Error creating message from ZIM:', error);
      throw error;
    }
  }
}

export default new MessageService();
