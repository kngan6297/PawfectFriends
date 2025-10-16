import messageService from './message.service.js';
import logger from '../../utils/logger.js';
import { ApiError } from '../../utils/errors.js';

/**
 * Create and send a new message
 * POST /api/messages
 */
export const handleCreateMessage = async (req, res) => {
  try {
    const {
      conversationId,
      type = 'text',
      content,
      attachments = [],
      extendedData = {},
      metadata = {},
      sendViaZIM = true,
    } = req.body;

    const senderId = req.user._id;
    const role = req.user.role === 'shelter' ? 'shelter' : 'user';

    const message = await messageService.createMessage({
      conversationId,
      senderId,
      role,
      type,
      content,
      attachments,
      extendedData,
      metadata,
      sendViaZIM,
    });

    res.status(201).json({
      success: true,
      message: 'Message created and sent successfully',
      data: message,
    });
  } catch (error) {
    logger.error('Create message error:', error);

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
 * Send a message (alias for createMessage)
 * POST /api/messages/send
 */
export const handleSendMessage = async (req, res) => {
  try {
    const {
      conversationId,
      type = 'text',
      content,
      attachments = [],
      extendedData = {},
      metadata = {},
    } = req.body;

    const senderId = req.user._id;
    const role = req.user.role === 'shelter' ? 'shelter' : 'user';

    const message = await messageService.createMessage({
      conversationId,
      senderId,
      role,
      type,
      content,
      attachments,
      extendedData,
      metadata,
      sendViaZIM: true, // Always send via ZIM for send endpoint
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    logger.error('Send message error:', error);

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
 * Get messages for a conversation
 * GET /api/messages/conversation/:conversationId
 */
export const handleGetMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const {
      limit = 50,
      before,
      after,
      type,
      role,
      status,
      sort = 'desc',
    } = req.query;

    const sortOrder = sort === 'asc' ? { createdAt: 1 } : { createdAt: -1 };

    const messages = await messageService.getMessages(conversationId, {
      limit: parseInt(limit),
      before: before ? new Date(before) : undefined,
      after: after ? new Date(after) : undefined,
      type,
      role,
      status,
      sort: sortOrder,
    });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    logger.error('Get messages error:', error);

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
 * Get a specific message
 * GET /api/messages/:id
 */
export const handleGetMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await messageService.getMessage(id, userId);

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    logger.error('Get message error:', error);

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
 * Mark message as read
 * POST /api/messages/:id/read
 */
export const handleMarkAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role === 'shelter' ? 'shelter' : 'user';

    const message = await messageService.markAsRead(id, userId, userRole);

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: message,
    });
  } catch (error) {
    logger.error('Mark as read error:', error);

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
 * Mark message as delivered
 * POST /api/messages/:id/delivered
 */
export const handleMarkAsDelivered = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role === 'shelter' ? 'shelter' : 'user';

    const message = await messageService.markAsDelivered(id, userId, userRole);

    res.status(200).json({
      success: true,
      message: 'Message marked as delivered',
      data: message,
    });
  } catch (error) {
    logger.error('Mark as delivered error:', error);

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
 * Add reaction to message
 * POST /api/messages/:id/reactions
 */
export const handleAddReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required',
      });
    }

    const message = await messageService.addReaction(id, userId, emoji);

    res.status(200).json({
      success: true,
      message: 'Reaction added successfully',
      data: message,
    });
  } catch (error) {
    logger.error('Add reaction error:', error);

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
 * Remove reaction from message
 * DELETE /api/messages/:id/reactions
 */
export const handleRemoveReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await messageService.removeReaction(id, userId);

    res.status(200).json({
      success: true,
      message: 'Reaction removed successfully',
      data: message,
    });
  } catch (error) {
    logger.error('Remove reaction error:', error);

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
 * Edit message
 * PUT /api/messages/:id
 */
export const handleEditMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, attachments = [] } = req.body;
    const userId = req.user._id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    const message = await messageService.editMessage(
      id,
      userId,
      content,
      attachments
    );

    res.status(200).json({
      success: true,
      message: 'Message edited successfully',
      data: message,
    });
  } catch (error) {
    logger.error('Edit message error:', error);

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
 * Delete message
 * DELETE /api/messages/:id
 */
export const handleDeleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await messageService.deleteMessage(id, userId);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      data: message,
    });
  } catch (error) {
    logger.error('Delete message error:', error);

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
 * Get unread message count
 * GET /api/messages/unread/:conversationId
 */
export const handleGetUnreadCount = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { lastReadAt } = req.query;
    const userId = req.user._id;

    const count = await messageService.getUnreadCount(
      conversationId,
      userId,
      lastReadAt ? new Date(lastReadAt) : null
    );

    res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    logger.error('Get unread count error:', error);

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
 * Get messages by pet
 * GET /api/messages/pet/:petId
 */
export const handleGetMessagesByPet = async (req, res) => {
  try {
    const { petId } = req.params;
    const { limit = 50, conversationId } = req.query;

    const messages = await messageService.getMessagesByPet(petId, {
      limit: parseInt(limit),
      conversationId,
    });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    logger.error('Get messages by pet error:', error);

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
 * Get system messages
 * GET /api/messages/system/:conversationId
 */
export const handleGetSystemMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { systemType } = req.query;

    const messages = await messageService.getSystemMessages(
      conversationId,
      systemType
    );

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    logger.error('Get system messages error:', error);

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
 * Get message statistics
 * GET /api/messages/stats/:conversationId
 */
export const handleGetMessageStats = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const stats = await messageService.getMessageStats(conversationId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get message stats error:', error);

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
 * Sync message status with ZIM
 * PATCH /api/messages/:id/sync
 */
export const handleSyncMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, zimData = {} } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const message = await messageService.syncMessageStatus(id, status, zimData);

    res.status(200).json({
      success: true,
      message: 'Message status synced successfully',
      data: message,
    });
  } catch (error) {
    logger.error('Sync message status error:', error);

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
 * Handle ZIM message delivery event
 * POST /api/messages/zim/delivery
 */
export const handleZIMDeliveryEvent = async (req, res) => {
  try {
    const { zimMessageId, userId, userRole } = req.body;

    if (!zimMessageId || !userId || !userRole) {
      return res.status(400).json({
        success: false,
        message: 'zimMessageId, userId, and userRole are required',
      });
    }

    const message = await messageService.handleZIMDeliveryEvent(
      zimMessageId,
      userId,
      userRole
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message delivery event processed',
      data: message,
    });
  } catch (error) {
    logger.error('ZIM delivery event error:', error);

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
 * Handle ZIM message read event
 * POST /api/messages/zim/read
 */
export const handleZIMReadEvent = async (req, res) => {
  try {
    const { zimMessageId, userId, userRole } = req.body;

    if (!zimMessageId || !userId || !userRole) {
      return res.status(400).json({
        success: false,
        message: 'zimMessageId, userId, and userRole are required',
      });
    }

    const message = await messageService.handleZIMReadEvent(
      zimMessageId,
      userId,
      userRole
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message read event processed',
      data: message,
    });
  } catch (error) {
    logger.error('ZIM read event error:', error);

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
 * Handle incoming ZIM message
 * POST /api/messages/zim/incoming
 */
export const handleIncomingZIMMessage = async (req, res) => {
  try {
    const { zimMessage, conversationId } = req.body;

    if (!zimMessage || !conversationId) {
      return res.status(400).json({
        success: false,
        message: 'zimMessage and conversationId are required',
      });
    }

    const message = await messageService.handleIncomingZIMMessage(
      zimMessage,
      conversationId
    );

    res.status(201).json({
      success: true,
      message: 'Incoming ZIM message processed',
      data: message,
    });
  } catch (error) {
    logger.error('Incoming ZIM message error:', error);

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
 * Download message attachment
 * GET /api/messages/:messageId/attachments/:attachmentId/download
 */
export const handleDownloadAttachment = async (req, res) => {
  try {
    const { messageId, attachmentId } = req.params;
    const userId = req.user._id;

    // Get message and verify access
    const message = await messageService.getMessage(messageId, userId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Find the specific attachment
    const attachment = message.attachments.find(
      (att) => att._id?.toString() === attachmentId
    );

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
      });
    }

    // Check if attachment has a valid URL
    if (!attachment.url) {
      return res.status(404).json({
        success: false,
        message: 'Attachment URL not available',
      });
    }

    // Set appropriate headers for download
    const fileName =
      attachment.fileName || attachment.originalName || 'attachment';
    const mimeType = attachment.mimeType || 'application/octet-stream';

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);

    // If it's a local file, stream it
    if (attachment.url.startsWith('/') || attachment.url.startsWith('./')) {
      // Local file - stream it
      const fs = await import('fs');
      const path = await import('path');

      try {
        const filePath = path.resolve(attachment.url);
        const fileStream = fs.createReadStream(filePath);

        fileStream.on('error', (error) => {
          logger.error('Error streaming file:', error);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Error reading file',
            });
          }
        });

        fileStream.pipe(res);
      } catch (error) {
        logger.error('Error accessing file:', error);
        res.status(500).json({
          success: false,
          message: 'Error accessing file',
        });
      }
    } else {
      // External URL - redirect to it
      res.redirect(attachment.url);
    }
  } catch (error) {
    logger.error('Download attachment error:', error);

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
 * Get attachment info
 * GET /api/messages/:messageId/attachments/:attachmentId
 */
export const handleGetAttachmentInfo = async (req, res) => {
  try {
    const { messageId, attachmentId } = req.params;
    const userId = req.user._id;

    // Get message and verify access
    const message = await messageService.getMessage(messageId, userId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Find the specific attachment
    const attachment = message.attachments.find(
      (att) => att._id?.toString() === attachmentId
    );

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: attachment,
    });
  } catch (error) {
    logger.error('Get attachment info error:', error);

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
 * List all attachments for a message
 * GET /api/messages/:messageId/attachments
 */
export const handleListAttachments = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Get message and verify access
    const message = await messageService.getMessage(messageId, userId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    res.status(200).json({
      success: true,
      data: message.attachments,
    });
  } catch (error) {
    logger.error('List attachments error:', error);

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
 * Persist messages from ZIM (fallback for webhook)
 * POST /api/messages/persist
 */
export const handlePersistMessages = async (req, res) => {
  try {
    const { messages, conversationId, conversationType } = req.body;

    if (!messages || !Array.isArray(messages) || !conversationId) {
      return res.status(400).json({
        success: false,
        message: 'messages array and conversationId are required',
      });
    }

    logger.info('Persisting messages from ZIM:', {
      messageCount: messages.length,
      conversationId,
      conversationType,
    });

    // Process each message
    const persistedMessages = [];
    for (const zimMessage of messages) {
      try {
        // Check for duplicates by zimMessageId and clientMsgId
        const existingMessage = await messageService.findDuplicateMessage(
          zimMessage.messageID,
          zimMessage.extendedData
        );

        if (existingMessage) {
          logger.info(
            `Duplicate message detected, skipping: ${zimMessage.messageID}`
          );
          continue;
        }

        // Create message in database
        const message = await messageService.createMessageFromZIM({
          zimMessage,
          conversationId,
          conversationType,
        });

        persistedMessages.push(message);
      } catch (error) {
        logger.error(
          `Error persisting individual message ${zimMessage.messageID}:`,
          error
        );
        // Continue with other messages even if one fails
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully persisted ${persistedMessages.length} messages`,
      data: {
        persistedCount: persistedMessages.length,
        totalCount: messages.length,
        messages: persistedMessages,
      },
    });
  } catch (error) {
    logger.error('Persist messages error:', error);

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
