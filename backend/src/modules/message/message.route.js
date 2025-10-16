import express from 'express';
import {
  handleCreateMessage,
  handleSendMessage,
  handleGetMessages,
  handleGetMessage,
  handleMarkAsRead,
  handleMarkAsDelivered,
  handleAddReaction,
  handleRemoveReaction,
  handleEditMessage,
  handleDeleteMessage,
  handleGetUnreadCount,
  handleGetMessagesByPet,
  handleGetSystemMessages,
  handleGetMessageStats,
  handleSyncMessageStatus,
  handleZIMDeliveryEvent,
  handleZIMReadEvent,
  handleIncomingZIMMessage,
  handleDownloadAttachment,
  handleGetAttachmentInfo,
  handleListAttachments,
  handlePersistMessages,
} from './message.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { messageValidation } from './message.validation.js';
import { authenticate } from '../../middleware/auth.js';
import { conversationValidationMiddleware } from '../../middleware/conversationRateLimit.js';

const router = express.Router();

// All message routes require authentication
router.use(authenticate);

// Debug middleware for message routes
router.use((req, res, next) => {
  console.log('💬 Message route accessed:', {
    method: req.method,
    url: req.url,
    userId: req.user?._id,
    userExists: !!req.user,
  });
  next();
});

// Message creation with enhanced validation
router.post(
  '/',
  ...conversationValidationMiddleware.general,
  validateRequest(messageValidation.createMessage),
  handleCreateMessage
);

// Send message (alias for create with ZIM)
router.post(
  '/send',
  ...conversationValidationMiddleware.general,
  validateRequest(messageValidation.createMessage),
  handleSendMessage
);

// Persist messages from ZIM (fallback for webhook)
router.post(
  '/persist',
  ...conversationValidationMiddleware.general,
  handlePersistMessages
);

// Get messages for conversation
router.get(
  '/conversation/:conversationId',
  ...conversationValidationMiddleware.general,
  validateRequest(messageValidation.getMessages, 'query'),
  handleGetMessages
);

// Get specific message
router.get(
  '/:id',
  ...conversationValidationMiddleware.general,
  handleGetMessage
);

// Message status management
router.post(
  '/:id/read',
  ...conversationValidationMiddleware.general,
  handleMarkAsRead
);

router.post(
  '/:id/delivered',
  ...conversationValidationMiddleware.general,
  handleMarkAsDelivered
);

// Message reactions
router.post(
  '/:id/reactions',
  ...conversationValidationMiddleware.general,
  validateRequest(messageValidation.addReaction),
  handleAddReaction
);

router.delete(
  '/:id/reactions',
  ...conversationValidationMiddleware.general,
  handleRemoveReaction
);

// Message editing and deletion
router.put(
  '/:id',
  ...conversationValidationMiddleware.general,
  validateRequest(messageValidation.editMessage),
  handleEditMessage
);

router.delete(
  '/:id',
  ...conversationValidationMiddleware.general,
  handleDeleteMessage
);

// Message queries
router.get(
  '/unread/:conversationId',
  ...conversationValidationMiddleware.general,
  validateRequest(messageValidation.getUnreadCount, 'query'),
  handleGetUnreadCount
);

router.get(
  '/pet/:petId',
  ...conversationValidationMiddleware.general,
  validateRequest(messageValidation.getMessagesByPet, 'query'),
  handleGetMessagesByPet
);

router.get(
  '/system/:conversationId',
  ...conversationValidationMiddleware.general,
  validateRequest(messageValidation.getSystemMessages, 'query'),
  handleGetSystemMessages
);

router.get(
  '/stats/:conversationId',
  ...conversationValidationMiddleware.general,
  handleGetMessageStats
);

// Message synchronization
router.patch(
  '/:id/sync',
  ...conversationValidationMiddleware.general,
  validateRequest(messageValidation.syncMessageStatus),
  handleSyncMessageStatus
);

// Attachment management
router.get(
  '/:messageId/attachments',
  ...conversationValidationMiddleware.general,
  handleListAttachments
);

router.get(
  '/:messageId/attachments/:attachmentId',
  ...conversationValidationMiddleware.general,
  handleGetAttachmentInfo
);

router.get(
  '/:messageId/attachments/:attachmentId/download',
  ...conversationValidationMiddleware.general,
  handleDownloadAttachment
);

// ZIM event handlers (no authentication required for webhooks)
router.post(
  '/zim/delivery',
  validateRequest(messageValidation.zimDeliveryEvent),
  handleZIMDeliveryEvent
);
router.post(
  '/zim/read',
  validateRequest(messageValidation.zimReadEvent),
  handleZIMReadEvent
);
router.post(
  '/zim/incoming',
  validateRequest(messageValidation.incomingZIMMessage),
  handleIncomingZIMMessage
);

export { router as messageRouter };
