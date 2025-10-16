import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/errors.js';

// In-memory store for rate limiting (in production, use Redis)
const requestCounts = new Map();

// Rate limiters for different conversation operations
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if available, otherwise IP
      return req.user?._id || req.ip;
    },
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded`, {
        userId: req.user?._id,
        ip: req.ip,
        endpoint: req.path,
        method: req.method,
      });

      res.status(429).json({
        success: false,
        message: message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

const rateLimiters = {
  // Ensure conversation: 5 requests per minute per user
  ensureConversation: createRateLimiter(
    60 * 1000, // 1 minute
    5, // 5 requests
    'Too many conversation creation requests. Please try again later.'
  ),

  // Update status: 10 requests per minute per user
  updateStatus: createRateLimiter(
    60 * 1000, // 1 minute
    10, // 10 requests
    'Too many status update requests. Please try again later.'
  ),

  // Add notes: 20 requests per minute per user
  addNotes: createRateLimiter(
    60 * 1000, // 1 minute
    20, // 20 requests
    'Too many note creation requests. Please try again later.'
  ),

  // General conversation operations: 30 requests per minute per user
  general: createRateLimiter(
    60 * 1000, // 1 minute
    30, // 30 requests
    'Too many requests. Please try again later.'
  ),
};

// Spam detection patterns
const spamPatterns = {
  repeatedChars: /(.)\1{10,}/,
  excessiveCaps: /[A-Z]{20,}/,
  urlSpam: /(https?:\/\/[^\s]+){3,}/,
  specialCharSpam: /[!@#$%^&*()_+=\[\]{}|;':",./<>?~`]{20,}/,
  repeatedWords: /\b(\w+)\s+\1\s+\1\s+\1/,
};

/**
 * Check if content appears to be spam
 * @param {string} content - Content to check
 * @returns {Object} Spam detection result
 */
const detectSpam = (content) => {
  const issues = [];

  for (const [patternName, pattern] of Object.entries(spamPatterns)) {
    if (pattern.test(content)) {
      issues.push(patternName);
    }
  }

  // Check for excessive length
  if (content.length > 10000) {
    issues.push('excessiveLength');
  }

  // Check for repeated phrases
  const words = content.toLowerCase().split(/\s+/);
  const wordCounts = {};
  words.forEach((word) => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });

  const repeatedWords = Object.entries(wordCounts)
    .filter(([word, count]) => count > 5 && word.length > 3)
    .map(([word]) => word);

  if (repeatedWords.length > 0) {
    issues.push('repeatedWords');
  }

  return {
    isSpam: issues.length > 0,
    issues,
    confidence: issues.length / Object.keys(spamPatterns).length,
  };
};

/**
 * Get rate limiter for specific operation
 * @param {string} operation - Operation type
 * @returns {Function} Rate limiter middleware
 */
export const getRateLimiter = (operation = 'general') => {
  return rateLimiters[operation] || rateLimiters.general;
};

/**
 * Spam detection middleware
 * @param {string} field - Field to check for spam
 * @returns {Function} Middleware function
 */
export const createSpamDetectionMiddleware = (field = 'content') => {
  return (req, res, next) => {
    const content = req.body[field];

    if (content && typeof content === 'string') {
      const spamResult = detectSpam(content);

      if (spamResult.isSpam) {
        logger.warn('Spam detected in conversation request', {
          userId: req.user?._id,
          field,
          issues: spamResult.issues,
          confidence: spamResult.confidence,
          contentLength: content.length,
        });

        throw new ApiError(
          400,
          'Content appears to be spam and cannot be processed.'
        );
      }
    }

    next();
  };
};

/**
 * Pet ownership validation middleware
 * @returns {Function} Middleware function
 */
export const validatePetOwnership = async (req, res, next) => {
  try {
    const { petId, shelterId } = req.body;

    if (!petId || !shelterId) {
      return next();
    }

    // Import Pet model dynamically to avoid circular dependencies
    const { Pet } = await import('../modules/pet/pet.model.js');

    const pet = await Pet.findById(petId).select('shelter');

    if (!pet) {
      throw new ApiError(404, 'Pet not found');
    }

    if (!pet.shelter) {
      throw new ApiError(400, 'Pet has no associated shelter');
    }

    if (pet.shelter.toString() !== shelterId) {
      throw new ApiError(400, 'Pet does not belong to the specified shelter');
    }

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error('Pet ownership validation error:', error);
    throw new ApiError(500, 'Failed to validate pet ownership');
  }
};

/**
 * Conversation access validation middleware
 * @returns {Function} Middleware function
 */
export const validateConversationAccess = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;

    if (!conversationId) {
      return next();
    }

    // Import Conversation model dynamically
    const conversationModule = await import(
      '../modules/conversation/conversation.model.js'
    );

    const Conversation = conversationModule.default;

    if (!Conversation) {
      logger.error(
        'Conversation model not found in import:',
        conversationModule
      );
      throw new ApiError(500, 'Failed to load conversation model');
    }

    const conversation = await Conversation.findById(conversationId).select(
      'userId shelterId status'
    );

    if (!conversation) {
      throw new ApiError(404, 'Conversation not found');
    }

    // Check if user is a participant
    const isParticipant =
      conversation.userId.toString() === userId.toString() ||
      conversation.shelterId.toString() === userId.toString();

    if (!isParticipant) {
      throw new ApiError(
        403,
        'Access denied: You are not a participant in this conversation'
      );
    }

    // Check if conversation is accessible
    if (conversation.status === 'cancelled') {
      throw new ApiError(410, 'Conversation has been cancelled');
    }

    req.conversation = conversation;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error('Conversation access validation error:', error);
    throw new ApiError(500, 'Failed to validate conversation access');
  }
};

/**
 * Enhanced conversation validation middleware
 * Combines rate limiting, spam detection, and access validation
 */
export const conversationValidationMiddleware = {
  ensureConversation: [
    getRateLimiter('ensureConversation'),
    validatePetOwnership,
    createSpamDetectionMiddleware('content'),
  ],

  updateStatus: [getRateLimiter('updateStatus'), validateConversationAccess],

  addNotes: [
    getRateLimiter('addNotes'),
    validateConversationAccess,
    createSpamDetectionMiddleware('content'),
  ],

  updateMessage: [
    getRateLimiter('general'),
    validateConversationAccess,
    createSpamDetectionMiddleware('content'),
  ],

  general: [getRateLimiter('general'), validateConversationAccess],
};

export default {
  getRateLimiter,
  createSpamDetectionMiddleware,
  validatePetOwnership,
  validateConversationAccess,
  conversationValidationMiddleware,
  detectSpam,
};
