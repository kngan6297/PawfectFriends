import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import { zimService } from '../../services/zim.service.js';
import { zimApiService } from '../../services/zim-api.service.js';
import { User } from '../user/user.model.js';
import Conversation from '../conversation/conversation.model.js';
import logger from '../../utils/logger.js';
import { ApiError } from '../../utils/errors.js';

const rtcRouter = express.Router();

/**
 * @route POST /api/rtc/zim/register-user
 * @desc Register a user in ZIM system and get token
 * @access Private (requires authentication)
 */
rtcRouter.post('/zim/register-user', authenticate, async (req, res, next) => {
  try {
    const { userID, userName, userAvatar } = req.body;
    const currentUser = req.user;

    // Use current user data if not provided
    const targetUserID = userID || currentUser.id;
    const targetUserName = userName || currentUser.name;
    const targetUserAvatar = userAvatar || currentUser.avatar;

    // Validate required fields
    if (!targetUserID || !targetUserName) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'userID and userName are required',
        },
      });
    }

    // Check if ZIM is configured
    if (!zimService.isConfigured()) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'ZIM service is not properly configured',
        },
      });
    }

    // Register user in ZIM
    const zimData = await zimService.registerUser(
      targetUserID,
      targetUserName,
      targetUserAvatar
    );

    // Update user's ZIM user ID in database
    await User.findByIdAndUpdate(targetUserID, {
      zimUserId: targetUserID, // Use our user ID as ZIM user ID
    });

    logger.info(`ZIM user registered: ${targetUserID} (${targetUserName})`);

    res.json({
      success: true,
      data: zimData,
      message: 'User registered in ZIM system successfully',
    });
  } catch (error) {
    logger.error('ZIM user registration error:', error);
    next(error);
  }
});

/**
 * @route POST /api/rtc/zim/token
 * @desc Generate ZIM token for user and auto-retry pending conversations
 * @access Private (requires authentication)
 */
rtcRouter.post('/zim/token', authenticate, async (req, res, next) => {
  try {
    const currentUser = req.user;
    const { userID, userName, userAvatar } = req.body;

    // Use current user data if not provided
    const targetUserID = userID || currentUser.id;
    const targetUserName = userName || currentUser.name;
    const targetUserAvatar = userAvatar || currentUser.avatar;

    // Check if ZIM is configured
    if (!zimService.isConfigured()) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'ZIM service is not properly configured',
        },
      });
    }

    // Generate token
    const zimData = await zimService.registerUser(
      targetUserID,
      targetUserName,
      targetUserAvatar
    );

    // Auto-retry pending conversations for shelters
    if (currentUser.role === 'shelter' && currentUser.zimUserId) {
      queueMicrotask(async () => {
        try {
          await retryPendingConversationsForShelter(currentUser);
        } catch (error) {
          logger.error('Error retrying pending conversations:', error);
        }
      });
    }

    res.json({
      success: true,
      data: zimData,
      message: 'ZIM token generated successfully',
    });
  } catch (error) {
    logger.error('ZIM token generation error:', error);
    next(error);
  }
});

/**
 * @route GET /api/rtc/zim/config
 * @desc Get ZIM configuration for client
 * @access Public
 */
rtcRouter.get('/zim/config', (req, res) => {
  try {
    const config = zimService.getConfig();

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    logger.error('ZIM config error:', error);
    next(error);
  }
});

/**
 * Retry inviting shelter to all pending conversations
 * This is called automatically when a shelter gets their ZIM token
 * @param {Object} shelter - Shelter user object
 */
async function retryPendingConversationsForShelter(shelter) {
  try {
    logger.info(
      `Auto-retrying pending conversations for shelter: ${shelter._id}`
    );

    // Find all pending conversations for this shelter
    const pendingConversations = await Conversation.find({
      shelterId: shelter._id,
      status: 'pending_zim_member',
      pendingMemberZimIds: { $in: [shelter.zimUserId] },
    });

    if (pendingConversations.length === 0) {
      logger.info(`No pending conversations found for shelter: ${shelter._id}`);
      return;
    }

    logger.info(
      `Found ${pendingConversations.length} pending conversations for shelter: ${shelter._id}`
    );

    // Retry each pending conversation
    for (const conversation of pendingConversations) {
      try {
        const inviteRes = await zimApiService.inviteUsersIntoGroup(
          conversation.zim.groupId,
          [shelter.zimUserId]
        );

        if (!inviteRes.errorUsers?.length) {
          // Successfully invited, update conversation status
          await Conversation.updateOne(
            { _id: conversation._id },
            {
              $set: { status: 'ready' },
              $pull: { pendingMemberZimIds: shelter.zimUserId },
            }
          );

          logger.info(
            `Successfully invited shelter ${shelter._id} to conversation ${conversation._id}`
          );
        } else {
          // Still have errors, keep pending status
          logger.warn(
            `Failed to invite shelter ${shelter._id} to conversation ${conversation._id}: ${inviteRes.errorUsers.join(', ')}`
          );
        }
      } catch (error) {
        logger.error(
          `Error retrying conversation ${conversation._id} for shelter ${shelter._id}:`,
          error
        );
      }
    }

    logger.info(
      `Completed auto-retry for shelter ${shelter._id} with ${pendingConversations.length} conversations`
    );
  } catch (error) {
    logger.error(
      `Error in retryPendingConversationsForShelter for shelter ${shelter._id}:`,
      error
    );
    throw error;
  }
}

/**
 * @route POST /api/rtc/zim/webhooks/zim
 * @desc ZIM webhook endpoint for callbacks
 * @access Public (but signature verified)
 */
rtcRouter.post('/zim/webhooks/zim', async (req, res) => {
  try {
    const { eventType, data } = req.body;

    logger.info('ZIM webhook received:', { eventType, data });

    // Handle different ZIM events
    switch (eventType) {
      case 'message.received':
        await handleMessageReceived(data);
        break;
      case 'message.delivered':
        await handleMessageDelivered(data);
        break;
      case 'message.read':
        await handleMessageRead(data);
        break;
      case 'user.join':
        await handleUserJoin(data);
        break;
      case 'user.leave':
        await handleUserLeave(data);
        break;
      case 'conversation.created':
        await handleConversationCreated(data);
        break;
      default:
        logger.warn(`Unhandled ZIM event type: ${eventType}`);
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    logger.error('ZIM webhook error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Webhook processing failed',
      },
    });
  }
});

/**
 * Handle message received event from ZIM
 * This is the main event that saves messages to the database
 */
async function handleMessageReceived(data) {
  try {
    const {
      messageId,
      conversationId,
      senderUserId,
      messageType,
      messageContent,
      timestamp,
      extendedData,
      messageSeq,
    } = data;

    logger.info('Processing message received:', {
      messageId,
      conversationId,
      senderUserId,
      messageType,
    });

    // Parse extended data for clientMsgId and other metadata
    let parsedExtendedData = {};
    try {
      parsedExtendedData = JSON.parse(extendedData || '{}');
    } catch (error) {
      logger.warn('Failed to parse extended data:', error);
    }

    // Check for duplicates by zimMessageId and clientMsgId
    const Message = (await import('../message/message.model.js')).default;
    const Conversation = (await import('../conversation/conversation.model.js'))
      .default;

    // Check for duplicate by ZIM message ID
    const existingByZimId = await Message.findOne({
      'metadata.zimMessageId': messageId,
    });

    if (existingByZimId) {
      logger.info(
        `Duplicate message detected by ZIM message ID: ${messageId}, skipping`
      );
      return;
    }

    // Check for duplicate by clientMsgId
    if (parsedExtendedData.clientMsgId) {
      const existingByClientId = await Message.findOne({
        'metadata.clientMsgId': parsedExtendedData.clientMsgId,
        conversationId: conversationId,
      });

      if (existingByClientId) {
        logger.info(
          `Duplicate message detected by clientMsgId: ${parsedExtendedData.clientMsgId}, skipping`
        );
        return;
      }
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      $or: [
        { 'zim.groupId': conversationId },
        { 'zim.conversationId': conversationId },
      ],
    });

    if (!conversation) {
      logger.warn(
        `Conversation not found for ZIM conversation ID: ${conversationId}`
      );
      return;
    }

    // Determine sender role
    const senderRole =
      parsedExtendedData.senderRole ||
      (conversation.userId.toString() === senderUserId ? 'user' : 'shelter');

    // Create message
    const message = new Message({
      conversationId: conversation._id,
      senderId: senderUserId,
      role: senderRole,
      type: mapZIMTypeToMessageType(messageType),
      content: messageContent || '',
      attachments: parsedExtendedData.attachments || [],
      extendedData: parsedExtendedData,
      metadata: {
        zimMessageId: messageId,
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
            senderId: senderUserId,
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
        arrayFilters: [{ 'elem.user': { $ne: senderUserId } }],
      }
    );

    logger.info(
      `Message saved to database: ${message._id} for conversation ${conversation._id}`
    );
  } catch (error) {
    logger.error('Error handling message received:', error);
  }
}

/**
 * Map ZIM message type to our message type
 */
function mapZIMTypeToMessageType(zimType) {
  const typeMap = {
    1: 'text', // ZIM.MessageType.Text
    2: 'image', // ZIM.MessageType.Image
    3: 'audio', // ZIM.MessageType.Audio
    4: 'video', // ZIM.MessageType.Video
    5: 'file', // ZIM.MessageType.File
    6: 'location', // ZIM.MessageType.Location
    7: 'custom', // ZIM.MessageType.Custom
    8: 'command', // ZIM.MessageType.Command
    9: 'barrage', // ZIM.MessageType.Barrage
    10: 'multiple', // ZIM.MessageType.Multiple
    11: 'revoke', // ZIM.MessageType.Revoke
    12: 'tips', // ZIM.MessageType.Tips
  };

  return typeMap[zimType] || 'text';
}

/**
 * Handle message delivered event from ZIM
 */
async function handleMessageDelivered(data) {
  try {
    const { messageId, conversationId, userId } = data;

    // Update message status in database
    const Message = (await import('../message/message.model.js')).default;
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { deliveredTo: { user: userId, timestamp: new Date() } },
    });

    logger.info(`Message delivered: ${messageId} to user ${userId}`);
  } catch (error) {
    logger.error('Error handling message delivered:', error);
  }
}

/**
 * Handle message read event from ZIM
 */
async function handleMessageRead(data) {
  try {
    const { messageId, conversationId, userId } = data;

    // Update message read status in database
    const Message = (await import('../message/message.model.js')).default;
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { readBy: { user: userId, readAt: new Date() } },
    });

    // Reset unread count for this user in conversation
    const Conversation = (await import('../conversation/conversation.model.js'))
      .default;
    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: { 'unreadCounts.$[elem].count': 0 },
      },
      {
        arrayFilters: [{ 'elem.user': userId }],
      }
    );

    logger.info(`Message read: ${messageId} by user ${userId}`);
  } catch (error) {
    logger.error('Error handling message read:', error);
  }
}

/**
 * Handle user join event from ZIM
 */
async function handleUserJoin(data) {
  try {
    const { conversationId, userId, timestamp } = data;

    // Log user join activity
    const { logChatActivity } = await import('../../utils/activityLogger.js');
    await logChatActivity('user_joined', {
      userId,
      chatId: conversationId,
      metadata: { timestamp },
    });

    logger.info(`User joined conversation: ${userId} in ${conversationId}`);
  } catch (error) {
    logger.error('Error handling user join:', error);
  }
}

/**
 * Handle user leave event from ZIM
 */
async function handleUserLeave(data) {
  try {
    const { conversationId, userId, timestamp } = data;

    // Log user leave activity
    const { logChatActivity } = await import('../../utils/activityLogger.js');
    await logChatActivity('user_left', {
      userId,
      chatId: conversationId,
      metadata: { timestamp },
    });

    logger.info(`User left conversation: ${userId} from ${conversationId}`);
  } catch (error) {
    logger.error('Error handling user leave:', error);
  }
}

/**
 * Handle conversation created event from ZIM
 */
async function handleConversationCreated(data) {
  try {
    const { conversationId, type, participants, name, timestamp } = data;

    // Log conversation creation activity
    const { logChatActivity } = await import('../../utils/activityLogger.js');
    await logChatActivity('conversation_created', {
      userId: participants[0], // First participant as creator
      chatId: conversationId,
      metadata: { type, participantCount: participants.length, timestamp },
    });

    logger.info(`Conversation created: ${conversationId} (${type})`);
  } catch (error) {
    logger.error('Error handling conversation created:', error);
  }
}

export { rtcRouter };
