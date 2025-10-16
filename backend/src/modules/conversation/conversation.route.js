import express from 'express';
import {
  handleEnsureConversation,
  handleUpdateConversationStatus,
  handleToggleConversationPin,
  handleGetUserConversations,
  handleGetShelterConversations,
  handleGetConversation,
  handleMarkConversationAsRead,
  handleAddConversationNote,
  handleArchiveConversation,
  handleCompleteConversation,
  handleCancelConversation,
  handleGetConversationStats,
  handleUpdateLastMessage,
  handleGetConversationMetadata,
  handleZegoWebhook,
  handleAddMessage,
  handleMarkAsGreeted,
  handleRetryPendingMembers,
} from './conversation.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { conversationValidation } from './conversation.validation.js';
import { authenticate } from '../../middleware/auth.js';
import { conversationValidationMiddleware } from '../../middleware/conversationRateLimit.js';

const router = express.Router();

// Zego webhook route (no authentication required)
router.post('/zim/webhook', handleZegoWebhook);

// All other conversation routes require authentication
router.use(authenticate);

// Debug middleware for conversation routes
router.use((req, res, next) => {
  console.log('💬 Conversation route accessed:', {
    method: req.method,
    url: req.url,
    userId: req.user?._id,
    userExists: !!req.user,
  });
  next();
});

// Core conversation routes with enhanced validation
router.post(
  '/',
  ...conversationValidationMiddleware.general,
  validateRequest(conversationValidation.createConversation),
  handleEnsureConversation
);

router.post(
  '/ensure',
  ...conversationValidationMiddleware.ensureConversation,
  validateRequest(conversationValidation.ensureConversation),
  handleEnsureConversation
);

router.get('/stats', handleGetConversationStats);

// Conversation metadata route
router.post('/metadata', handleGetConversationMetadata);

// User conversation routes
router.get(
  '/',
  validateRequest(conversationValidation.getConversations, 'query'),
  handleGetUserConversations
);

// Shelter conversation routes
router.get('/shelter', handleGetShelterConversations);

// Specific conversation routes
router.get(
  '/:id',
  ...conversationValidationMiddleware.general,
  handleGetConversation
);

// Conversation status management
router.patch(
  '/:id/status',
  ...conversationValidationMiddleware.updateStatus,
  validateRequest(conversationValidation.updateConversationStatus),
  handleUpdateConversationStatus
);

// Conversation pin management (shelter only)
router.patch(
  '/:id/pin',
  ...conversationValidationMiddleware.general,
  handleToggleConversationPin
);

// Conversation read status
router.post(
  '/:id/read',
  ...conversationValidationMiddleware.general,
  handleMarkConversationAsRead
);

// Conversation notes
router.post(
  '/:id/notes',
  ...conversationValidationMiddleware.addNotes,
  validateRequest(conversationValidation.addConversationNote),
  handleAddConversationNote
);

// Conversation lifecycle management
router.post(
  '/:id/archive',
  ...conversationValidationMiddleware.general,
  handleArchiveConversation
);
router.post(
  '/:id/complete',
  ...conversationValidationMiddleware.general,
  handleCompleteConversation
);
router.post(
  '/:id/cancel',
  ...conversationValidationMiddleware.general,
  handleCancelConversation
);

// Message management
router.patch(
  '/:id/last-message',
  ...conversationValidationMiddleware.updateMessage,
  validateRequest(conversationValidation.updateLastMessage),
  handleUpdateLastMessage
);

// Client-side message persistence
router.post('/add-message', handleAddMessage);

// Mark conversation as greeted
router.post('/mark-greeted', handleMarkAsGreeted);

// Retry pending ZIM members
router.post(
  '/:id/retry-pending',
  ...conversationValidationMiddleware.general,
  handleRetryPendingMembers
);

export { router as conversationRouter };
