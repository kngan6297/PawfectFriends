import Joi from 'joi';
import { objectIdSchema } from '../../utils/validation.js';

// Custom validation for pet ownership
const petOwnershipSchema = Joi.object({
  petId: objectIdSchema.required().messages({
    'any.required': 'petId is required',
    'string.pattern.name': 'petId must be a valid ObjectId',
  }),
  shelterId: objectIdSchema.required().messages({
    'any.required': 'shelterId is required',
    'string.pattern.name': 'shelterId must be a valid ObjectId',
  }),
}).custom(async (value, helpers) => {
  // This will be validated in the service layer
  // We just ensure the format is correct here
  return value;
}, 'Pet ownership validation');

// Spam prevention schema
const spamPreventionSchema = Joi.object({
  // Rate limiting will be handled by middleware
  // This schema just validates the structure
  requestId: Joi.string().uuid().optional().messages({
    'string.guid': 'requestId must be a valid UUID',
  }),
  timestamp: Joi.date().max('now').optional().messages({
    'date.max': 'timestamp cannot be in the future',
  }),
});

// Ensure conversation schema with comprehensive validation
export const ensureConversationSchema = Joi.object({
  userId: objectIdSchema.optional().messages({
    'string.pattern.name': 'userId must be a valid ObjectId',
  }),
  shelterId: objectIdSchema.required().messages({
    'any.required': 'shelterId is required',
    'string.pattern.name': 'shelterId must be a valid ObjectId',
  }),
  petId: objectIdSchema.required().messages({
    'any.required': 'petId is required',
    'string.pattern.name': 'petId must be a valid ObjectId',
  }),
  adoptionId: objectIdSchema.optional().messages({
    'string.pattern.name': 'adoptionId must be a valid ObjectId',
  }),
  priority: Joi.string()
    .valid('low', 'normal', 'high', 'urgent')
    .optional()
    .default('normal')
    .messages({
      'any.only': 'Priority must be one of: low, normal, high, urgent',
    }),
  tags: Joi.array()
    .items(Joi.string().trim().min(1).max(50))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 10 tags',
      'string.min': 'Tag cannot be empty',
      'string.max': 'Tag cannot exceed 50 characters',
    }),
  autoArchive: Joi.boolean().optional().default(true),
  updateZimGroup: Joi.boolean().optional().default(false),
  // Spam prevention fields
  requestId: Joi.string().uuid().optional().messages({
    'string.guid': 'requestId must be a valid UUID',
  }),
  timestamp: Joi.date().max('now').optional().messages({
    'date.max': 'timestamp cannot be in the future',
  }),
  // Pet ownership validation
  // Pet ownership validation is handled in service layer
})
  .custom(async (value, helpers) => {
    // Additional validation for pet-shelter relationship
    // This will be validated in the service layer
    const { petId, shelterId } = value;

    if (petId && shelterId) {
      // Basic format validation is done by Joi
      // Business logic validation (pet belongs to shelter)
      // will be handled in the service layer
    }

    return value;
  }, 'Pet-shelter relationship validation')
  .messages({
    'any.custom': 'Pet must belong to the specified shelter',
  });

// Enhanced validation for conversation status updates
export const updateConversationStatusSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'archived', 'blocked', 'completed', 'cancelled')
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only':
        'Status must be one of: active, archived, blocked, completed, cancelled',
    }),
  reason: Joi.string().trim().max(500).optional().messages({
    'string.max': 'Reason cannot exceed 500 characters',
  }),
  notifyParticipants: Joi.boolean().optional().default(true),
  requestId: Joi.string().uuid().optional().messages({
    'string.guid': 'requestId must be a valid UUID',
  }),
  timestamp: Joi.date().max('now').optional().messages({
    'date.max': 'timestamp cannot be in the future',
  }),
});

// Enhanced conversation note schema with spam prevention
export const addConversationNoteSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.base': 'Content must be a string',
      'string.empty': 'Content cannot be empty',
      'string.min': 'Content must be at least 1 character',
      'string.max': 'Content cannot exceed 1000 characters',
      'any.required': 'Content is required',
    })
    .custom((value, helpers) => {
      // Basic spam detection - check for repeated characters
      const repeatedChars = /(.)\1{10,}/;
      if (repeatedChars.test(value)) {
        return helpers.error('string.spam');
      }

      // Check for excessive special characters
      const specialCharCount = (
        value.match(/[!@#$%^&*()_+=\[\]{}|;':",./<>?~`]/g) || []
      ).length;
      if (specialCharCount > value.length * 0.5) {
        return helpers.error('string.spam');
      }

      return value;
    }, 'Spam detection'),
  type: Joi.string()
    .valid('general', 'adoption_notes', 'medical', 'behavior', 'follow_up')
    .optional()
    .default('general')
    .messages({
      'any.only':
        'Type must be one of: general, adoption_notes, medical, behavior, follow_up',
    }),
  isPrivate: Joi.boolean().optional().default(false),
  requestId: Joi.string().uuid().optional().messages({
    'string.guid': 'requestId must be a valid UUID',
  }),
  timestamp: Joi.date().max('now').optional().messages({
    'date.max': 'timestamp cannot be in the future',
  }),
}).messages({
  'string.spam': 'Content appears to be spam',
});

// Enhanced last message schema with spam prevention
export const updateLastMessageSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.base': 'Content must be a string',
      'string.empty': 'Content cannot be empty',
      'string.min': 'Content must be at least 1 character',
      'string.max': 'Content cannot exceed 5000 characters',
      'any.required': 'Content is required',
    })
    .custom((value, helpers) => {
      // Spam detection for message content
      const repeatedChars = /(.)\1{15,}/;
      if (repeatedChars.test(value)) {
        return helpers.error('string.spam');
      }

      // Check for excessive caps
      const capsCount = (value.match(/[A-Z]/g) || []).length;
      if (capsCount > value.length * 0.7) {
        return helpers.error('string.spam');
      }

      // Check for URL spam patterns
      const urlPattern = /(https?:\/\/[^\s]+)/g;
      const urls = value.match(urlPattern) || [];
      if (urls.length > 3) {
        return helpers.error('string.spam');
      }

      return value;
    }, 'Message spam detection'),
  type: Joi.string()
    .valid('text', 'image', 'file', 'audio', 'video', 'system')
    .optional()
    .default('text')
    .messages({
      'any.only':
        'Type must be one of: text, image, file, audio, video, system',
    }),
  messageId: Joi.string().trim().max(100).optional().messages({
    'string.max': 'MessageId cannot exceed 100 characters',
  }),
  requestId: Joi.string().uuid().optional().messages({
    'string.guid': 'requestId must be a valid UUID',
  }),
  timestamp: Joi.date().max('now').optional().messages({
    'date.max': 'timestamp cannot be in the future',
  }),
}).messages({
  'string.spam': 'Message content appears to be spam',
});

// Query parameters for getting conversations
export const getConversationsQuerySchema = Joi.object({
  status: Joi.string()
    .valid('active', 'archived', 'blocked', 'completed', 'cancelled')
    .optional()
    .messages({
      'any.only':
        'Status must be one of: active, archived, blocked, completed, cancelled',
    }),
  pinned: Joi.boolean().optional(),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(50)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
  offset: Joi.number().integer().min(0).optional().default(0).messages({
    'number.base': 'Offset must be a number',
    'number.integer': 'Offset must be an integer',
    'number.min': 'Offset must be at least 0',
  }),
});

// Query parameters for getting shelter conversations
export const getShelterConversationsQuerySchema = Joi.object({
  status: Joi.string()
    .valid('active', 'archived', 'blocked', 'completed', 'cancelled')
    .optional()
    .messages({
      'any.only':
        'Status must be one of: active, archived, blocked, completed, cancelled',
    }),
  petId: objectIdSchema.optional(),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(50)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
  offset: Joi.number().integer().min(0).optional().default(0).messages({
    'number.base': 'Offset must be a number',
    'number.integer': 'Offset must be an integer',
    'number.min': 'Offset must be at least 0',
  }),
});

// Additional validation schemas for comprehensive validation

// User ID validation schema
export const userIdValidationSchema = Joi.object({
  userId: objectIdSchema.required().messages({
    'any.required': 'userId is required',
    'string.pattern.name': 'userId must be a valid ObjectId',
  }),
});

// Shelter ID validation schema
export const shelterIdValidationSchema = Joi.object({
  shelterId: objectIdSchema.required().messages({
    'any.required': 'shelterId is required',
    'string.pattern.name': 'shelterId must be a valid ObjectId',
  }),
});

// Pet ID validation schema
export const petIdValidationSchema = Joi.object({
  petId: objectIdSchema.required().messages({
    'any.required': 'petId is required',
    'string.pattern.name': 'petId must be a valid ObjectId',
  }),
});

// Pet ownership validation schema (for service layer)
export const petOwnershipValidationSchema = Joi.object({
  petId: objectIdSchema.required(),
  shelterId: objectIdSchema.required(),
}).custom(async (value, helpers) => {
  // This will be validated in the service layer
  // by checking if pet.shelterId === shelterId
  return value;
}, 'Pet ownership validation');

// Rate limiting validation schema
export const rateLimitValidationSchema = Joi.object({
  requestId: Joi.string().uuid().optional(),
  timestamp: Joi.date().max('now').optional(),
  userAgent: Joi.string().max(500).optional(),
  ipAddress: Joi.string().ip().optional(),
});

// Conversation ID validation schema
export const conversationIdValidationSchema = Joi.object({
  id: objectIdSchema.required().messages({
    'any.required': 'Conversation ID is required',
    'string.pattern.name': 'Conversation ID must be a valid ObjectId',
  }),
});

// Enhanced query validation with pagination limits
export const enhancedQueryValidationSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'archived', 'blocked', 'completed', 'cancelled')
    .optional(),
  pinned: Joi.boolean().optional(),
  petId: objectIdSchema.optional(),
  shelterId: objectIdSchema.optional(),
  userId: objectIdSchema.optional(),
  limit: Joi.number().integer().min(1).max(100).optional().default(50),
  offset: Joi.number().integer().min(0).optional().default(0),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'lastMessageAt', 'priority')
    .optional()
    .default('lastMessageAt'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc'),
  search: Joi.string().trim().max(100).optional(),
  requestId: Joi.string().uuid().optional(),
  timestamp: Joi.date().max('now').optional(),
  userAgent: Joi.string().max(500).optional(),
  ipAddress: Joi.string().ip().optional(),
});

// Create conversation schema
export const createConversationSchema = Joi.object({
  type: Joi.string().valid('p2p', 'group').required().messages({
    'any.required': 'type is required',
    'any.only': 'type must be either "p2p" or "group"',
  }),
  participants: Joi.array().items(objectIdSchema).min(1).required().messages({
    'any.required': 'participants is required',
    'array.min': 'At least one participant is required',
  }),
  name: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Name must be at least 1 character',
    'string.max': 'Name must not exceed 100 characters',
  }),
  avatar: Joi.string().uri().optional().messages({
    'string.uri': 'Avatar must be a valid URL',
  }),
  customData: Joi.object().optional().messages({
    'object.base': 'customData must be an object',
  }),
});

// Export all schemas
export const conversationValidation = {
  createConversation: createConversationSchema,
  ensureConversation: ensureConversationSchema,
  updateConversationStatus: updateConversationStatusSchema,
  addConversationNote: addConversationNoteSchema,
  updateLastMessage: updateLastMessageSchema,
  getConversations: getConversationsQuerySchema,
  getShelterConversations: getShelterConversationsQuerySchema,
  // Additional validation schemas
  userIdValidation: userIdValidationSchema,
  shelterIdValidation: shelterIdValidationSchema,
  petIdValidation: petIdValidationSchema,
  petOwnershipValidation: petOwnershipValidationSchema,
  rateLimitValidation: rateLimitValidationSchema,
  conversationIdValidation: conversationIdValidationSchema,
  enhancedQueryValidation: enhancedQueryValidationSchema,
};
