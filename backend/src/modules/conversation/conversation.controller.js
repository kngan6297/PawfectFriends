import conversationService from './conversation.service.js';
import Conversation from './conversation.model.js';
import logger from '../../utils/logger.js';
import { ApiError } from '../../utils/errors.js';

/**
 * Retry inviting pending ZIM members to a conversation
 * POST /api/conversations/:id/retry-pending
 * Note: :id can be either MongoDB ObjectId or ZIM group ID
 */
export const handleRetryPendingMembers = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const currentUserId = req.user._id;

    // Validate conversation ID
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required',
      });
    }

    // Check if the ID is a MongoDB ObjectId or ZIM group ID
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(conversationId);
    let conversation;

    if (isObjectId) {
      // MongoDB ObjectId - use existing method
      conversation = await conversationService.getConversation(
        conversationId,
        currentUserId
      );
    } else {
      // ZIM group ID - find by zim.groupId
      conversation = await Conversation.findOne({
        'zim.groupId': conversationId,
      })
        .populate('userId', 'firstName lastName email avatar zimUserId')
        .populate('shelterId', 'name email avatar zimUserId')
        .populate('petId', 'name type breed photos');

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found',
        });
      }

      // Check if user has access to this conversation
      const isUser = conversation.userId._id.toString() === currentUserId;
      const isShelter = conversation.shelterId._id.toString() === currentUserId;

      if (!isUser && !isShelter) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this conversation',
        });
      }
    }

    // Only shelter can retry pending members
    if (conversation.shelterId._id.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Only shelter can retry pending members',
      });
    }

    // Retry pending members using the MongoDB ObjectId
    const result = await conversationService.retryPendingMembers(
      conversation._id
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    logger.error('Retry pending members error:', error);

    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};
export const handleEnsureConversation = async (req, res) => {
  try {
    const { userId, shelterId, petId, ...options } = req.body;
    const currentUserId = req.user._id;

    // Validate required fields
    if (!shelterId || !petId) {
      return res.status(400).json({
        success: false,
        message: 'shelterId and petId are required',
      });
    }

    // Use current user ID if not provided
    const targetUserId = userId || currentUserId;

    // Ensure conversation exists
    const result = await conversationService.ensureConversation({
      userId: targetUserId,
      shelterId,
      petId,
    });

    res.status(200).json({
      success: true,
      message: 'Conversation ensured successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Ensure conversation error:', error);

    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

/**
 * Update conversation status (close/reopen)
 * PATCH /api/conversations/:id/status
 */
export const handleUpdateConversationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
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
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    await conversationService.updateStatus(id, status, req.user._id);

    res.status(200).json({
      success: true,
      message: `Conversation ${status} successfully`,
    });
  } catch (error) {
    logger.error('Update conversation status error:', error);

    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

/**
 * Toggle conversation pin status (for shelter only)
 * PATCH /api/conversations/:id/pin
 */
export const handleToggleConversationPin = async (req, res) => {
  try {
    const { id } = req.params;

    await conversationService.togglePin(id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Conversation pin status toggled successfully',
    });
  } catch (error) {
    logger.error('Toggle conversation pin error:', error);

    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

/**
 * Get user's conversations
 * GET /api/conversations
 */
export const handleGetUserConversations = async (req, res) => {
  try {
    const { status, pinned, limit, offset } = req.query;

    const options = {};
    if (status) options.status = status;
    if (pinned) options.pinned = pinned === 'true';
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const conversations = await conversationService.getUserConversations(
      req.user._id,
      options
    );

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    logger.error('Get user conversations error:', error);

    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

/**
 * Get shelter's conversations
 * GET /api/conversations/shelter
 */
export const handleGetShelterConversations = async (req, res) => {
  try {
    const { status, petId, limit, offset } = req.query;

    const options = {};
    if (status) options.status = status;
    if (petId) options.petId = petId;
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const conversations = await conversationService.getShelterConversations(
      req.user._id,
      options
    );

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    logger.error('Get shelter conversations error:', error);

    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

/**
 * Get conversation by ID
 * GET /api/conversations/:id
 */
export const handleGetConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await conversationService.getConversation(
      id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    logger.error('Get conversation error:', error);

    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

/**
 * Reset unread count for conversation
 * POST /api/conversations/:id/read
 */
export const handleMarkConversationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await conversationService.resetUnreadCount(id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Conversation marked as read',
    });
  } catch (error) {
    logger.error('Mark conversation as read error:', error);

    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

/**
 * Add note to conversation
 * POST /api/conversations/:id/notes
 */
export const handleAddConversationNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, type = 'general', isPrivate = false } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required',
      });
    }

    await conversationService.addNote(
      id,
      content,
      req.user._id,
      type,
      isPrivate
    );

    res.status(201).json({
      success: true,
      message: 'Note added successfully',
    });
  } catch (error) {
    logger.error('Add conversation note error:', error);

    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

/**
 * Archive conversation
 * POST /api/conversations/:id/archive
 */
export const handleArchiveConversation = async (req, res) => {
  try {
    const { id } = req.params;

    await conversationService.archiveConversation(id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Conversation archived successfully',
    });
  } catch (error) {
    logger.error('Archive conversation error:', error);

    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

/**
 * Complete conversation (adoption completed)
 * POST /api/conversations/:id/complete
 */
export const handleCompleteConversation = async (req, res) => {
  try {
    const { id } = req.params;

    await conversationService.completeConversation(id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Conversation completed successfully',
    });
  } catch (error) {
    logger.error('Complete conversation error:', error);

    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

/**
 * Cancel conversation
 * POST /api/conversations/:id/cancel
 */
export const handleCancelConversation = async (req, res) => {
  try {
    const { id } = req.params;

    await conversationService.cancelConversation(id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Conversation cancelled successfully',
    });
  } catch (error) {
    logger.error('Cancel conversation error:', error);

    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

/**
 * Get conversation statistics
 * GET /api/conversations/stats
 */
export const handleGetConversationStats = async (req, res) => {
  try {
    const stats = await conversationService.getConversationStats(req.user._id);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get conversation stats error:', error);

    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

/**
 * Update last message in conversation
 * PATCH /api/conversations/:id/last-message
 */
export const handleUpdateLastMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, type = 'text', messageId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    const messageData = {
      content,
      type,
      messageId,
      timestamp: new Date(),
    };

    await conversationService.updateLastMessage(id, messageData, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Last message updated successfully',
    });
  } catch (error) {
    logger.error('Update last message error:', error);

    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

/**
 * Get conversation metadata for multiple conversations
 * POST /api/conversations/metadata
 */
export const handleGetConversationMetadata = async (req, res) => {
  try {
    const { groupIds } = req.body;

    if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'groupIds array is required',
      });
    }

    const metadata =
      await conversationService.getConversationMetadata(groupIds);

    res.status(200).json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    logger.error('Get conversation metadata error:', error);

    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

/**
 * Handle Zego webhook for message events
 * POST /api/conversations/zim/webhook
 * This endpoint receives webhook events from Zego for message delivery/receipt
 */
export const handleZegoWebhook = async (req, res) => {
  try {
    const { event, data } = req.body;

    logger.info('Zego webhook received:', { event, dataType: typeof data });

    // Verify webhook signature if needed (implement based on Zego docs)
    // const signature = req.headers['x-zego-signature'];
    // if (!verifyZegoSignature(req.body, signature)) {
    //   return res.status(401).json({ success: false, message: 'Invalid signature' });
    // }

    // Handle different event types
    switch (event) {
      case 'message.delivered':
      case 'message.received':
        await handleMessageEvent(data);
        break;

      case 'conversation.updated':
        await handleConversationEvent(data);
        break;

      default:
        logger.warn('Unknown webhook event type:', event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Zego webhook error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Webhook processing failed' });
  }
};

/**
 * Handle message events from Zego webhook
 */
async function handleMessageEvent(data) {
  try {
    const { message, conversation } = data;

    if (!message || !conversation) {
      logger.warn('Invalid message event data:', data);
      return;
    }

    // Extract conversation details
    const { conversationID, conversationType } = conversation;
    const { messageID, clientMsgId, content, type, timestamp, senderUserID } =
      message;

    logger.info('Processing message event:', {
      messageID,
      clientMsgId,
      conversationID,
      conversationType,
      senderUserID,
      type,
    });

    // Upsert message to database (dedupe by messageID and clientMsgId)
    await conversationService.upsertMessage({
      zimMessageId: messageID,
      clientMsgId: clientMsgId,
      conversationId: conversationID,
      conversationType: conversationType,
      content: content,
      messageType: type,
      senderId: senderUserID,
      timestamp: new Date(timestamp),
      extendedData: message.extendedData || '{}',
    });

    // Update conversation lastMessage and lastMessageAt
    await conversationService.updateConversationLastMessage(conversationID, {
      content: content,
      type: type,
      messageId: messageID,
      timestamp: new Date(timestamp),
      senderId: senderUserID,
    });

    // Update unread counts for participants
    await conversationService.updateUnreadCounts(conversationID, senderUserID);

    logger.info('Message event processed successfully:', {
      messageID,
      conversationID,
    });
  } catch (error) {
    logger.error('Error processing message event:', error);
    throw error;
  }
}

/**
 * Handle conversation events from Zego webhook
 */
async function handleConversationEvent(data) {
  try {
    const { conversation, eventType } = data;

    if (!conversation) {
      logger.warn('Invalid conversation event data:', data);
      return;
    }

    logger.info('Processing conversation event:', {
      conversationID: conversation.conversationID,
      eventType,
      conversationType: conversation.conversationType,
    });

    // Handle different conversation event types
    switch (eventType) {
      case 'created':
        // Conversation created - ensure it exists in our database
        await conversationService.ensureConversationFromWebhook(conversation);
        break;

      case 'updated':
        // Conversation updated - sync changes
        await conversationService.syncConversationFromWebhook(conversation);
        break;

      case 'deleted':
        // Conversation deleted - mark as inactive
        await conversationService.markConversationInactive(
          conversation.conversationID
        );
        break;

      default:
        logger.warn('Unknown conversation event type:', eventType);
    }

    logger.info('Conversation event processed successfully:', {
      conversationID: conversation.conversationID,
      eventType,
    });
  } catch (error) {
    logger.error('Error processing conversation event:', error);
    throw error;
  }
}

/**
 * Handle client-side message persistence
 * POST /api/conversations/add-message
 */
export const handleAddMessage = async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || !conversationId) {
      return res.status(400).json({
        success: false,
        message: 'message and conversationId are required',
      });
    }

    // Use the existing addMessage service method
    await conversationService.addMessage(message, conversationId);

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Add message error:', error);
    res.status(500).json({ success: false, message: 'Failed to add message' });
  }
};

/**
 * Mark conversation as greeted
 * POST /api/conversations/mark-greeted
 */
export const handleMarkAsGreeted = async (req, res) => {
  try {
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'conversationId is required',
      });
    }

    await conversationService.markAsGreeted(conversationId);

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Mark as greeted error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to mark as greeted' });
  }
};
