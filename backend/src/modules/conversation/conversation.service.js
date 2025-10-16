import Conversation from './conversation.model.js';
import { User } from '../user/user.model.js';
import { Shelter } from '../user/user.model.js';
import { Pet } from '../pet/pet.model.js';
import { zimGroupService } from '../../services/zim-group.service.js';
import { zimService } from '../../services/zim.service.js';
import { zimApiService } from '../../services/zim-api.service.js';
import logger from '../../utils/logger.js';
import { ApiError } from '../../utils/errors.js';
import { logChatActivity } from '../../utils/activityLogger.js';
import crypto from 'node:crypto';

class ConversationService {
  /**
   * Generate a short, stable ZIM group ID (≤64 characters)
   * @param {string} groupKey - Logical key (grp_<shelterId>_<petId>_<userId>)
   * @param {string} petId - Pet ID for tail
   * @returns {string} Short group ID (g_<base64url(sha1(groupKey)).slice(0,22)>_<last6OfPet>)
   */
  makeZimGroupId(groupKey, petId) {
    // 64 is the ceiling. Make ID form: g_<base64url(sha1(groupKey)).slice(0,22)>_<last6OfPet>
    // 2 + 1 + 22 + 1 + 6 = 32 characters
    const digest = crypto
      .createHash('sha1')
      .update(groupKey)
      .digest('base64url')
      .slice(0, 22);
    const tail = (petId || '').slice(-6);
    return `g_${digest}_${tail}`; // example: g_Lu2q2tC9p6mej0s1hQZ1mw_355728
  }

  /**
   * Build group ID from shelter and pet IDs
   * @param {string} shelterId - Shelter ID
   * @param {string} petId - Pet ID
   * @returns {string} Group ID
   */
  buildGroupId(shelterId, petId) {
    return `g_s${shelterId.slice(-6)}_p${petId.slice(-6)}`;
  }

  /**
   * Ensure conversation exists for user-shelter-pet combination (idempotent)
   * This is the core function for the "each pet = 1 separate conversation" feature
   * @param {string} userId - User ID
   * @param {string} shelterId - Shelter ID
   * @param {string} petId - Pet ID
   * @param {Object} options - Optional parameters
   * @returns {Object} Conversation object
   */
  async ensureConversation({ userId, shelterId, petId }) {
    try {
      // Validate inputs
      if (!userId || !shelterId || !petId) {
        throw ApiError.badRequest('userId, shelterId, and petId are required');
      }

      // Validate ObjectId format
      const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
      if (
        !isValidObjectId(userId) ||
        !isValidObjectId(shelterId) ||
        !isValidObjectId(petId)
      ) {
        throw ApiError.badRequest('Invalid ID format');
      }

      // Get user and shelter with zimUserId
      const user = await User.findById(userId).select(
        'zimUserId firstName lastName email avatar isActive role'
      );
      const shelter = await Shelter.findById(shelterId).select(
        'zimUserId name email avatar isActive'
      );

      if (!user || !user.isActive) {
        throw ApiError.notFound('User not found or inactive');
      }
      if (!shelter || !shelter.isActive) {
        throw ApiError.notFound('Shelter not found or inactive');
      }

      // Check if zimUserId exists for both user and shelter
      if (!user.zimUserId) {
        throw ApiError.badRequest(
          'User zimUserId not found. User must be registered with ZIM first.'
        );
      }
      if (!shelter.zimUserId) {
        throw ApiError.badRequest(
          'Shelter zimUserId not found. Shelter must be registered with ZIM first.'
        );
      }

      const userZimId = user.zimUserId; // example: user_6895e...
      const shelterZimId = shelter.zimUserId; // example: shelter_68af26...

      // Generate group ID
      const groupID = this.buildGroupId(shelterId, petId); // g_s6-...

      // Check if conversation already exists
      let conversation = await Conversation.findOne({
        userId,
        shelterId,
        petId,
        status: { $ne: 'cancelled' },
      })
        .populate('userId', 'firstName lastName email avatar zimUserId')
        .populate('shelterId', 'name email avatar zimUserId')
        .populate('petId', 'name type breed photos');

      if (conversation) {
        logger.info(
          `Conversation already exists: ${conversation._id} for user ${userId}, shelter ${shelterId}, pet ${petId}`
        );

        // If conversation exists but has pending members, try to invite them again
        if (
          conversation.status === 'pending_zim_member' &&
          conversation.pendingMemberZimIds.length > 0
        ) {
          const inviteRes = await zimApiService.inviteUsersIntoGroup(
            groupID,
            conversation.pendingMemberZimIds
          );

          if (inviteRes.errorUsers?.length) {
            // Still have errors, keep pending status
            logger.warn(
              `Still have pending ZIM members for conversation ${conversation._id}: ${inviteRes.errorUsers.join(', ')}`
            );
          } else {
            // All members invited successfully, update status
            conversation.status = 'ready';
            await conversation.clearPendingMembers();
            await conversation.save();
            logger.info(
              `Conversation ${conversation._id} status updated to ready`
            );
          }
        }

        const conversationData = conversation.toJSON();
        return {
          id: conversationData._id,
          conversationId: conversationData._id,
          zimGroupId: conversation.zim.groupId,
          groupID: conversation.zim.groupId,
          status: conversation.status,
          participants: [conversationData.userId, conversationData.shelterId],
          ...conversationData,
        };
      }

      // Validate pet exists
      const pet = await Pet.findById(petId).select(
        'name type breed photos status'
      );
      if (!pet) {
        throw ApiError.notFound('Pet not found');
      }

      // Create group with only chat user first
      await zimApiService.createGroup({ groupID, userIDs: [userZimId] });

      // Then invite shelter
      const inviteRes = await zimApiService.inviteUsersIntoGroup(groupID, [
        shelterZimId,
      ]);

      let conversationStatus = 'ready';
      let pendingMemberZimIds = [];

      if (inviteRes.errorUsers?.length) {
        // 51102: user not exist / not logged in yet
        conversationStatus = 'pending_zim_member';
        pendingMemberZimIds = inviteRes.errorUsers;
        logger.warn(
          `Failed to invite shelter to group ${groupID}: ${inviteRes.errorUsers.join(', ')}`
        );
      }

      // Create conversation in database
      conversation = await Conversation.create({
        userId,
        shelterId,
        petId,
        zim: {
          type: 'group',
          groupKey: `grp_${shelterId}_${petId}_${userId}`,
          groupId: groupID,
        },
        status: conversationStatus,
        pendingMemberZimIds,
        metadata: {
          adoptionId: null,
          priority: 'normal',
          tags: [],
        },
        settings: {
          autoArchive: true,
          notifications: {
            user: {
              email: true,
              push: true,
              sms: false,
            },
            shelter: {
              email: true,
              push: true,
              sms: false,
            },
          },
        },
      });

      // Populate the created conversation
      await conversation.populate([
        { path: 'userId', select: 'firstName lastName email avatar zimUserId' },
        { path: 'shelterId', select: 'name email avatar zimUserId' },
        { path: 'petId', select: 'name type breed photos' },
      ]);

      // Create user object for activity logging
      const userForLogging = {
        _id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      };

      // Log activity
      await logChatActivity(
        userForLogging,
        'chat_created',
        {
          chatId: conversation._id,
          groupId: groupID,
        },
        null, // req object not available in service
        {
          userId,
          shelterId,
          petId,
          petName: pet.name,
          shelterName: shelter.name,
        }
      );

      logger.info(
        `Pet conversation created: ${conversation._id} for user ${userId}, shelter ${shelterId}, pet ${petId} with status: ${conversationStatus}`
      );

      const conversationData = conversation.toJSON();
      return {
        id: conversationData._id,
        conversationId: conversationData._id,
        zimGroupId: groupID,
        groupID: groupID,
        status: conversationStatus,
        participants: [conversationData.userId, conversationData.shelterId],
        ...conversationData,
      };
    } catch (error) {
      logger.error('Error ensuring conversation:', error);
      throw error;
    }
  }

  /**
   * Retry inviting pending ZIM members to a conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Object} Retry result
   */
  async retryPendingMembers(conversationId) {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw ApiError.notFound('Conversation not found');
      }

      if (
        conversation.status !== 'pending_zim_member' ||
        conversation.pendingMemberZimIds.length === 0
      ) {
        return {
          success: true,
          message: 'No pending members to retry',
          status: conversation.status,
        };
      }

      const inviteRes = await zimApiService.inviteUsersIntoGroup(
        conversation.zim.groupId,
        conversation.pendingMemberZimIds
      );

      if (inviteRes.errorUsers?.length) {
        // Still have errors, update pending members list
        conversation.pendingMemberZimIds = inviteRes.errorUsers;
        await conversation.save();

        logger.warn(
          `Retry failed for conversation ${conversationId}: ${inviteRes.errorUsers.join(', ')}`
        );

        return {
          success: false,
          message: 'Some members still pending',
          pendingMembers: inviteRes.errorUsers,
          status: 'pending_zim_member',
        };
      } else {
        // All members invited successfully
        conversation.status = 'ready';
        await conversation.clearPendingMembers();
        await conversation.save();

        logger.info(
          `All pending members invited successfully for conversation ${conversationId}`
        );

        return {
          success: true,
          message: 'All members invited successfully',
          status: 'ready',
        };
      }
    } catch (error) {
      logger.error('Error retrying pending members:', error);
      throw error;
    }
  }
  async markAsGreeted(conversationId) {
    try {
      // conversationId is actually a ZIM group ID, so find by zim.groupId
      const conversation = await Conversation.findOne({
        'zim.groupId': conversationId,
      });

      if (!conversation) {
        logger.warn('Conversation not found for ZIM group ID:', conversationId);
        return; // Don't throw error, just log and return
      }

      await conversation.markAsGreeted();
      logger.info(`Conversation marked as greeted: ${conversationId}`);
    } catch (error) {
      logger.error('Error marking conversation as greeted:', error);
      throw error;
    }
  }

  /**
   * Update message with final messageID when it becomes available
   * @param {string} localMessageId - The local message ID to update
   * @param {string} finalMessageId - The final ZIM message ID
   * @param {string} conversationId - ZIM group ID
   */
  async updateMessageWithFinalId(
    localMessageId,
    finalMessageId,
    conversationId
  ) {
    try {
      const conversation = await Conversation.findOne({
        'zim.groupId': conversationId,
      });

      if (!conversation) {
        logger.warn(
          'Conversation not found for message update:',
          conversationId
        );
        return;
      }

      // Find the message by localMessageId
      const message = conversation.messages.find(
        (msg) => msg.zimMessageId === localMessageId
      );

      if (message) {
        message.zimMessageId = finalMessageId;
        await conversation.save();
        logger.info('Message updated with final ID:', {
          localMessageId,
          finalMessageId,
          conversationId,
        });
      } else {
        logger.warn('Message not found for update:', {
          localMessageId,
          conversationId,
        });
      }
    } catch (error) {
      logger.error('Error updating message with final ID:', error);
      throw error;
    }
  }

  /**
   * Update ZIM group for existing conversation
   * @param {Object} conversation - Conversation object
   */
  async updateZimGroup(conversation) {
    try {
      if (!conversation.zim.groupId) {
        return;
      }

      const members = [
        {
          userID: conversation.userId.toString(),
          userName: `${conversation.userId.firstName} ${conversation.userId.lastName}`,
          userAvatar: conversation.userId.avatar || '',
          role: 0,
        },
        {
          userID: conversation.shelterId.toString(),
          userName: conversation.shelterId.name,
          userAvatar: conversation.shelterId.avatar || '',
          role: 1,
        },
      ];

      const groupInfo = {
        name: `Adoption Chat - ${conversation.petId.name}`,
        avatar: conversation.petId.photos?.[0]?.url || '',
      };

      await zimGroupService.ensureGroup(
        conversation.zim.groupId,
        members,
        groupInfo
      );
    } catch (error) {
      logger.error('Error updating ZIM group:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Update last message in conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} messageData - Message data
   * @param {string} senderId - Sender ID
   */
  async updateLastMessage(conversationId, messageData, senderId) {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw ApiError.notFound('Conversation not found');
      }

      // Update last message
      await conversation.updateLastMessage({
        content: messageData.content,
        sender: senderId,
        timestamp: messageData.timestamp || new Date(),
        type: messageData.type || 'text',
        messageId: messageData.messageId,
      });

      // Increment unread count for the other participant
      const otherParticipantId =
        conversation.userId.toString() === senderId
          ? conversation.shelterId
          : conversation.userId;

      await conversation.incrementUnreadCount(otherParticipantId);

      logger.info(`Last message updated for conversation ${conversationId}`);
    } catch (error) {
      logger.error('Error updating last message:', error);
      throw error;
    }
  }

  /**
   * Update conversation status
   * @param {string} conversationId - Conversation ID
   * @param {string} status - New status
   * @param {string} userId - User making the change
   */
  async updateStatus(conversationId, status, userId) {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw ApiError.notFound('Conversation not found');
      }

      // Check if user is participant
      if (!conversation.isParticipant(userId)) {
        throw ApiError.forbidden('Access denied to this conversation');
      }

      // Validate status
      const validStatuses = [
        'active',
        'archived',
        'blocked',
        'completed',
        'cancelled',
      ];
      if (!validStatuses.includes(status)) {
        throw ApiError.badRequest(
          `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        );
      }

      conversation.status = status;
      await conversation.save();

      // Log activity
      await logChatActivity(
        user,
        'conversation_status_changed',
        {
          userId,
          conversationId,
          oldStatus: conversation.status,
          newStatus: status,
        },
        null, // req object not available in service
        {}
      );

      logger.info(
        `Conversation status updated: ${conversationId} to ${status} by user ${userId}`
      );
    } catch (error) {
      logger.error('Error updating conversation status:', error);
      throw error;
    }
  }

  /**
   * Reset unread count for user
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   */
  async resetUnreadCount(conversationId, userId) {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw ApiError.notFound('Conversation not found');
      }

      // Check if user is participant
      if (!conversation.isParticipant(userId)) {
        throw ApiError.forbidden('Access denied to this conversation');
      }

      await conversation.resetUnreadCount(userId);
      logger.info(
        `Unread count reset for conversation ${conversationId} for user ${userId}`
      );
    } catch (error) {
      logger.error('Error resetting unread count:', error);
      throw error;
    }
  }

  /**
   * Add note to conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} content - Note content
   * @param {string} addedBy - User adding the note
   * @param {string} type - Note type
   * @param {boolean} isPrivate - Whether note is private to shelter
   */
  async addNote(
    conversationId,
    content,
    addedBy,
    type = 'general',
    isPrivate = false
  ) {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw ApiError.notFound('Conversation not found');
      }

      // Check if user is participant
      if (!conversation.isParticipant(addedBy)) {
        throw ApiError.forbidden('Access denied to this conversation');
      }

      await conversation.addNote(content, addedBy, type, isPrivate);

      logger.info(
        `Note added to conversation ${conversationId} by user ${addedBy}`
      );
    } catch (error) {
      logger.error('Error adding note:', error);
      throw error;
    }
  }

  /**
   * Toggle pin status for shelter
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (must be shelter)
   */
  async togglePin(conversationId, userId) {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw ApiError.notFound('Conversation not found');
      }

      // Check if user is shelter
      if (conversation.shelterId.toString() !== userId) {
        throw ApiError.forbidden('Only shelter can pin conversations');
      }

      await conversation.togglePin();

      logger.info(
        `Conversation pin toggled: ${conversationId} by shelter ${userId}`
      );
    } catch (error) {
      logger.error('Error toggling pin:', error);
      throw error;
    }
  }

  /**
   * Get user's conversations
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} Conversations
   */
  async getUserConversations(userId, options = {}) {
    try {
      const { status, pinned, limit = 50, offset = 0 } = options;

      const queryOptions = {};
      if (status) queryOptions.status = status;
      if (pinned) queryOptions.pinned = true;

      const conversations = await Conversation.findByUser(userId, queryOptions)
        .limit(limit)
        .skip(offset);

      return conversations;
    } catch (error) {
      logger.error('Error getting user conversations:', error);
      throw error;
    }
  }

  /**
   * Get shelter's conversations
   * @param {string} shelterId - Shelter ID
   * @param {Object} options - Query options
   * @returns {Array} Conversations
   */
  async getShelterConversations(shelterId, options = {}) {
    try {
      const { status, petId, limit = 50, offset = 0 } = options;

      const queryOptions = {};
      if (status) queryOptions.status = status;
      if (petId) queryOptions.petId = petId;

      const conversations = await Conversation.findByShelter(
        shelterId,
        queryOptions
      )
        .limit(limit)
        .skip(offset);

      return conversations;
    } catch (error) {
      logger.error('Error getting shelter conversations:', error);
      throw error;
    }
  }

  /**
   * Get conversation by ID
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @returns {Object} Conversation
   */
  async getConversation(conversationId, userId) {
    try {
      const conversation = await Conversation.findById(conversationId)
        .populate('userId', 'firstName lastName email avatar')
        .populate('shelterId', 'name email avatar')
        .populate('petId', 'name type breed photos')
        .populate('lastMessage.sender', 'firstName lastName avatar')
        .populate('notes.addedBy', 'firstName lastName avatar');

      if (!conversation) {
        throw ApiError.notFound('Conversation not found');
      }

      // Check if user is participant
      if (!conversation.isParticipant(userId)) {
        throw ApiError.forbidden('Access denied to this conversation');
      }

      return conversation;
    } catch (error) {
      logger.error('Error getting conversation:', error);
      throw error;
    }
  }

  /**
   * Get conversation statistics
   * @param {string} userId - User ID
   * @returns {Object} Statistics
   */
  async getConversationStats(userId) {
    try {
      const stats = await Conversation.getConversationStats(userId);
      return stats;
    } catch (error) {
      logger.error('Error getting conversation stats:', error);
      throw error;
    }
  }

  /**
   * Archive conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   */
  async archiveConversation(conversationId, userId) {
    try {
      await this.updateStatus(conversationId, 'archived', userId);
      logger.info(`Conversation archived: ${conversationId} by user ${userId}`);
    } catch (error) {
      logger.error('Error archiving conversation:', error);
      throw error;
    }
  }

  /**
   * Complete conversation (adoption completed)
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   */
  async completeConversation(conversationId, userId) {
    try {
      await this.updateStatus(conversationId, 'completed', userId);
      logger.info(
        `Conversation completed: ${conversationId} by user ${userId}`
      );
    } catch (error) {
      logger.error('Error completing conversation:', error);
      throw error;
    }
  }

  /**
   * Cancel conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   */
  async cancelConversation(conversationId, userId) {
    try {
      await this.updateStatus(conversationId, 'cancelled', userId);
      logger.info(
        `Conversation cancelled: ${conversationId} by user ${userId}`
      );
    } catch (error) {
      logger.error('Error cancelling conversation:', error);
      throw error;
    }
  }

  /**
   * Add message to conversation (for client-side persistence)
   * @param {Object} message - ZIM message object
   * @param {string} conversationId - ZIM group ID
   */
  async addMessage(message, conversationId) {
    try {
      // For messages being sent, messageID might not be available yet
      // We'll persist them with localMessageID and update when messageID becomes available
      if (!message.messageID && !message.localMessageID) {
        logger.warn(
          'Invalid message: missing both messageID and localMessageID',
          { message }
        );
        return;
      }

      // Use localMessageID as zimMessageId if messageID is not available yet
      const zimMessageId = message.messageID || message.localMessageID;
      const clientMsgId = message.clientMsgId || message.localMessageID;

      // Extract message data from ZIM message object
      const messageData = {
        zimMessageId: zimMessageId,
        clientMsgId: clientMsgId,
        conversationId: conversationId,
        conversationType: 2, // Group conversation
        content: message.message || '',
        messageType: message.type,
        senderId: message.senderUserID,
        timestamp: new Date(message.timestamp),
        extendedData: message.extendedData || '{}',
      };

      // Use the existing upsertMessage method
      await this.upsertMessage(messageData);

      logger.info('Message added via client:', {
        zimMessageId: message.messageID,
        conversationId,
      });
    } catch (error) {
      logger.error('Error adding message via client:', error);
      throw error;
    }
  }

  /**
   * Get conversation metadata for multiple conversations
   * @param {Array<string>} groupIds - Array of ZIM group IDs
   * @returns {Array} Conversation metadata with pet and shelter names
   */
  async getConversationMetadata(groupIds) {
    try {
      // Find conversations by ZIM group IDs
      const conversations = await Conversation.find({
        'zim.groupId': { $in: groupIds },
      })
        .populate('petId', 'name photos')
        .populate('shelterId', 'name avatar')
        .lean();

      // Map to the expected format
      const metadata = conversations.map((conv) => ({
        groupId: conv.zim.groupId,
        shelterId: conv.shelterId?._id?.toString() || conv.shelterId, // Include shelter ID
        petName: conv.petId?.name || 'Pet',
        shelterName: conv.shelterId?.name || 'Shelter',
        shelterAvatar: conv.shelterId?.avatar || '', // Include shelter avatar
        petThumb: conv.petId?.photos?.[0] || '',
        lastMessageAt: conv.lastMessageAt,
        unreadCounts: conv.unread,
        status: conv.status,
      }));

      return metadata;
    } catch (error) {
      logger.error('Error getting conversation metadata:', error);
      throw error;
    }
  }

  /**
   * Upsert message to database (for webhook)
   * @param {Object} messageData - Message data from Zego webhook
   */
  async upsertMessage(messageData) {
    try {
      const {
        zimMessageId,
        clientMsgId,
        conversationId,
        conversationType,
        content,
        messageType,
        senderId,
        timestamp,
        extendedData,
      } = messageData;

      // Validate required fields
      if (!zimMessageId || zimMessageId.trim() === '') {
        logger.warn('Invalid message data: missing or empty zimMessageId', {
          messageData,
        });
        return;
      }

      // Find conversation by ZIM group ID
      const conversation = await Conversation.findOne({
        'zim.groupId': conversationId,
      });

      if (!conversation) {
        logger.warn('Conversation not found for message:', {
          conversationId,
          zimMessageId,
        });
        return;
      }

      // Check if message already exists (dedupe by zimMessageId or clientMsgId)
      const existingMessage = conversation.messages.find(
        (msg) =>
          msg.zimMessageId === zimMessageId || msg.clientMsgId === clientMsgId
      );

      if (existingMessage) {
        logger.info('Message already exists, skipping upsert:', {
          zimMessageId,
          clientMsgId,
        });
        return;
      }

      // Add message to conversation
      await conversation.addMessage({
        zimMessageId,
        clientMsgId,
        content,
        messageType,
        senderId,
        timestamp,
        extendedData: extendedData || '{}',
      });

      logger.info('Message upserted successfully:', {
        zimMessageId,
        conversationId,
      });
    } catch (error) {
      logger.error('Error upserting message:', error);
      throw error;
    }
  }

  /**
   * Update conversation last message (for webhook)
   * @param {string} conversationId - ZIM group ID
   * @param {Object} messageData - Message data
   */
  async updateConversationLastMessage(conversationId, messageData) {
    try {
      const conversation = await Conversation.findOne({
        'zim.groupId': conversationId,
      });

      if (!conversation) {
        logger.warn('Conversation not found for last message update:', {
          conversationId,
        });
        return;
      }

      await conversation.updateLastMessage({
        content: messageData.content,
        sender: messageData.senderId,
        timestamp: messageData.timestamp,
        type: messageData.type,
        messageId: messageData.messageId,
      });

      logger.info('Conversation last message updated:', { conversationId });
    } catch (error) {
      logger.error('Error updating conversation last message:', error);
      throw error;
    }
  }

  /**
   * Update unread counts for participants (for webhook)
   * @param {string} conversationId - ZIM group ID
   * @param {string} senderId - Sender ID
   */
  async updateUnreadCounts(conversationId, senderId) {
    try {
      const conversation = await Conversation.findOne({
        'zim.groupId': conversationId,
      });

      if (!conversation) {
        logger.warn('Conversation not found for unread count update:', {
          conversationId,
        });
        return;
      }

      // Increment unread count for the other participant
      const otherParticipantId =
        conversation.userId.toString() === senderId
          ? conversation.shelterId
          : conversation.userId;

      await conversation.incrementUnreadCount(otherParticipantId);

      logger.info('Unread counts updated:', { conversationId, senderId });
    } catch (error) {
      logger.error('Error updating unread counts:', error);
      throw error;
    }
  }

  /**
   * Ensure conversation from webhook (for conversation.created events)
   * @param {Object} conversationData - Conversation data from Zego
   */
  async ensureConversationFromWebhook(conversationData) {
    try {
      const { conversationID, conversationType } = conversationData;

      // Check if conversation already exists
      const existingConversation = await Conversation.findOne({
        'zim.groupId': conversationID,
      });

      if (existingConversation) {
        logger.info('Conversation already exists from webhook:', {
          conversationID,
        });
        return existingConversation;
      }

      // For group conversations, we need to extract user/shelter/pet info from group attributes
      // This would require additional logic to parse group attributes
      logger.info('Conversation created event received:', {
        conversationID,
        conversationType,
      });

      // TODO: Implement conversation creation from webhook if needed
      // This would require parsing group attributes to get userId, shelterId, petId
    } catch (error) {
      logger.error('Error ensuring conversation from webhook:', error);
      throw error;
    }
  }

  /**
   * Sync conversation from webhook (for conversation.updated events)
   * @param {Object} conversationData - Conversation data from Zego
   */
  async syncConversationFromWebhook(conversationData) {
    try {
      const { conversationID } = conversationData;

      const conversation = await Conversation.findOne({
        'zim.groupId': conversationID,
      });

      if (!conversation) {
        logger.warn('Conversation not found for sync:', { conversationID });
        return;
      }

      // Update conversation data as needed
      // This would depend on what data is provided in the webhook
      logger.info('Conversation synced from webhook:', { conversationID });
    } catch (error) {
      logger.error('Error syncing conversation from webhook:', error);
      throw error;
    }
  }

  /**
   * Mark conversation as inactive (for conversation.deleted events)
   * @param {string} conversationId - ZIM group ID
   */
  async markConversationInactive(conversationId) {
    try {
      const conversation = await Conversation.findOne({
        'zim.groupId': conversationId,
      });

      if (!conversation) {
        logger.warn('Conversation not found for deletion:', { conversationId });
        return;
      }

      conversation.status = 'cancelled';
      await conversation.save();

      logger.info('Conversation marked as inactive:', { conversationId });
    } catch (error) {
      logger.error('Error marking conversation as inactive:', error);
      throw error;
    }
  }
}

export default new ConversationService();
