import Joi from 'joi';
import { objectIdSchema } from '../../utils/validation.js';

// Create message schema
export const createMessageSchema = Joi.object({
  conversationId: objectIdSchema.required().messages({
    'any.required': 'conversationId is required',
    'string.pattern.name': 'conversationId must be a valid ObjectId',
  }),
  type: Joi.string()
    .valid('text', 'image', 'file', 'system')
    .optional()
    .default('text')
    .messages({
      'any.only': 'Type must be one of: text, image, file, system',
    }),
  content: Joi.string()
    .trim()
    .min(1)
    .max(5000)
    .when('type', {
      is: Joi.string().valid('text'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'string.base': 'Content must be a string',
      'string.empty': 'Content cannot be empty',
      'string.min': 'Content must be at least 1 character',
      'string.max': 'Content cannot exceed 5000 characters',
      'any.required': 'Content is required for text messages',
    })
    .custom((value, helpers) => {
      // Basic spam detection for content
      if (value) {
        const repeatedChars = /(.)\1{15,}/;
        if (repeatedChars.test(value)) {
          return helpers.error('string.spam');
        }

        const capsCount = (value.match(/[A-Z]/g) || []).length;
        if (capsCount > value.length * 0.7) {
          return helpers.error('string.spam');
        }
      }

      return value;
    }, 'Content spam detection'),
  attachments: Joi.array()
    .items(
      Joi.object({
        type: Joi.string()
          .valid('image', 'video', 'audio', 'file', 'document')
          .required()
          .messages({
            'any.required': 'Attachment type is required',
            'any.only':
              'Attachment type must be one of: image, video, audio, file, document',
          }),
        url: Joi.string().uri().required().messages({
          'any.required': 'Attachment URL is required',
          'string.uri': 'Attachment URL must be a valid URI',
        }),
        fileName: Joi.string().trim().max(255).optional().messages({
          'string.max': 'File name cannot exceed 255 characters',
        }),
        fileSize: Joi.number()
          .integer()
          .min(0)
          .max(100 * 1024 * 1024) // 100MB max
          .optional()
          .messages({
            'number.max': 'File size cannot exceed 100MB',
          }),
        mimeType: Joi.string().trim().max(100).optional().messages({
          'string.max': 'MIME type cannot exceed 100 characters',
        }),
        duration: Joi.number().min(0).optional().messages({
          'number.min': 'Duration must be positive',
        }),
        width: Joi.number().integer().min(1).max(4096).optional().messages({
          'number.min': 'Width must be at least 1',
          'number.max': 'Width cannot exceed 4096',
        }),
        height: Joi.number().integer().min(1).max(4096).optional().messages({
          'number.min': 'Height must be at least 1',
          'number.max': 'Height cannot exceed 4096',
        }),
        thumbnailUrl: Joi.string().uri().optional().messages({
          'string.uri': 'Thumbnail URL must be a valid URI',
        }),
        originalName: Joi.string().trim().max(255).optional().messages({
          'string.max': 'Original name cannot exceed 255 characters',
        }),
      })
    )
    .max(10)
    .optional()
    .default([])
    .messages({
      'array.max': 'Cannot have more than 10 attachments',
    }),
  extendedData: Joi.object().optional().default({}).messages({
    'object.base': 'Extended data must be an object',
  }),
  metadata: Joi.object({
    petId: objectIdSchema.optional(),
    adoptionId: objectIdSchema.optional(),
    systemType: Joi.string()
      .valid(
        'conversation_started',
        'pet_inquiry',
        'adoption_request',
        'meeting_scheduled',
        'document_requested',
        'status_update',
        'reminder',
        'other'
      )
      .optional(),
    location: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      address: Joi.string().trim().max(500).optional(),
      name: Joi.string().trim().max(255).optional(),
    }).optional(),
    replyToMessageId: objectIdSchema.optional(),
    forwardedFrom: Joi.object({
      messageId: objectIdSchema.required(),
      originalSender: Joi.string().trim().max(255).required(),
      originalTimestamp: Joi.date().max('now').required(),
    }).optional(),
  })
    .optional()
    .default({}),
}).messages({
  'string.spam': 'Content appears to be spam',
});

// Edit message schema
export const editMessageSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'any.required': 'Content is required',
      'string.empty': 'Content cannot be empty',
      'string.min': 'Content must be at least 1 character',
      'string.max': 'Content cannot exceed 5000 characters',
    })
    .custom((value, helpers) => {
      // Basic spam detection for content
      const repeatedChars = /(.)\1{15,}/;
      if (repeatedChars.test(value)) {
        return helpers.error('string.spam');
      }

      const capsCount = (value.match(/[A-Z]/g) || []).length;
      if (capsCount > value.length * 0.7) {
        return helpers.error('string.spam');
      }

      return value;
    }, 'Content spam detection'),
  attachments: Joi.array()
    .items(
      Joi.object({
        type: Joi.string()
          .valid('image', 'video', 'audio', 'file', 'document')
          .required(),
        url: Joi.string().uri().required(),
        fileName: Joi.string().trim().max(255).optional(),
        fileSize: Joi.number()
          .integer()
          .min(0)
          .max(100 * 1024 * 1024)
          .optional(),
        mimeType: Joi.string().trim().max(100).optional(),
        duration: Joi.number().min(0).optional(),
        width: Joi.number().integer().min(1).max(4096).optional(),
        height: Joi.number().integer().min(1).max(4096).optional(),
        thumbnailUrl: Joi.string().uri().optional(),
        originalName: Joi.string().trim().max(255).optional(),
      })
    )
    .max(10)
    .optional()
    .default([]),
}).messages({
  'string.spam': 'Content appears to be spam',
});

// Add reaction schema
export const addReactionSchema = Joi.object({
  emoji: Joi.string().trim().min(1).max(10).required().messages({
    'any.required': 'Emoji is required',
    'string.empty': 'Emoji cannot be empty',
    'string.min': 'Emoji must be at least 1 character',
    'string.max': 'Emoji cannot exceed 10 characters',
  }),
});

// Get messages query schema
export const getMessagesQuerySchema = Joi.object({
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
  before: Joi.date().optional().messages({
    'date.base': 'Before must be a valid date',
  }),
  after: Joi.date().optional().messages({
    'date.base': 'After must be a valid date',
  }),
  type: Joi.string()
    .valid('text', 'image', 'file', 'system')
    .optional()
    .messages({
      'any.only': 'Type must be one of: text, image, file, system',
    }),
  role: Joi.string().valid('user', 'shelter').optional().messages({
    'any.only': 'Role must be one of: user, shelter',
  }),
  status: Joi.string().valid('sent', 'delivered', 'read').optional().messages({
    'any.only': 'Status must be one of: sent, delivered, read',
  }),
  sort: Joi.string().valid('asc', 'desc').optional().default('desc').messages({
    'any.only': 'Sort must be either asc or desc',
  }),
});

// Get unread count query schema
export const getUnreadCountQuerySchema = Joi.object({
  lastReadAt: Joi.date().optional().messages({
    'date.base': 'lastReadAt must be a valid date',
  }),
});

// Get messages by pet query schema
export const getMessagesByPetQuerySchema = Joi.object({
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
  conversationId: objectIdSchema.optional(),
});

// Get system messages query schema
export const getSystemMessagesQuerySchema = Joi.object({
  systemType: Joi.string()
    .valid(
      'conversation_started',
      'pet_inquiry',
      'adoption_request',
      'meeting_scheduled',
      'document_requested',
      'status_update',
      'reminder',
      'other'
    )
    .optional()
    .messages({
      'any.only': 'System type must be one of the valid system message types',
    }),
});

// Sync message status schema
export const syncMessageStatusSchema = Joi.object({
  status: Joi.string().valid('sent', 'delivered', 'read').required().messages({
    'any.required': 'Status is required',
    'any.only': 'Status must be one of: sent, delivered, read',
  }),
  zimData: Joi.object({
    zimMessageId: Joi.string().trim().max(100).optional().messages({
      'string.max': 'ZIM message ID cannot exceed 100 characters',
    }),
    zimTimestamp: Joi.date().optional().messages({
      'date.base': 'ZIM timestamp must be a valid date',
    }),
  })
    .optional()
    .default({}),
});

// ZIM delivery event schema
export const zimDeliveryEventSchema = Joi.object({
  zimMessageId: Joi.string().trim().required().messages({
    'any.required': 'ZIM message ID is required',
    'string.empty': 'ZIM message ID cannot be empty',
  }),
  userId: objectIdSchema.required().messages({
    'any.required': 'User ID is required',
    'string.pattern.name': 'User ID must be a valid ObjectId',
  }),
  userRole: Joi.string().valid('user', 'shelter').required().messages({
    'any.required': 'User role is required',
    'any.only': 'User role must be either user or shelter',
  }),
});

// ZIM read event schema
export const zimReadEventSchema = Joi.object({
  zimMessageId: Joi.string().trim().required().messages({
    'any.required': 'ZIM message ID is required',
    'string.empty': 'ZIM message ID cannot be empty',
  }),
  userId: objectIdSchema.required().messages({
    'any.required': 'User ID is required',
    'string.pattern.name': 'User ID must be a valid ObjectId',
  }),
  userRole: Joi.string().valid('user', 'shelter').required().messages({
    'any.required': 'User role is required',
    'any.only': 'User role must be either user or shelter',
  }),
});

// Incoming ZIM message schema
export const incomingZIMMessageSchema = Joi.object({
  zimMessage: Joi.object({
    messageID: Joi.string().trim().required().messages({
      'any.required': 'ZIM message ID is required',
      'string.empty': 'ZIM message ID cannot be empty',
    }),
    senderUserID: Joi.string().trim().required().messages({
      'any.required': 'Sender user ID is required',
      'string.empty': 'Sender user ID cannot be empty',
    }),
    type: Joi.number().integer().min(1).required().messages({
      'any.required': 'Message type is required',
      'number.base': 'Message type must be a number',
      'number.integer': 'Message type must be an integer',
      'number.min': 'Message type must be at least 1',
    }),
    message: Joi.string().trim().optional().allow('').messages({
      'string.base': 'Message content must be a string',
    }),
    extendedData: Joi.string().trim().optional().allow('').messages({
      'string.base': 'Extended data must be a string',
    }),
    timestamp: Joi.number().integer().min(0).optional().messages({
      'number.base': 'Timestamp must be a number',
      'number.integer': 'Timestamp must be an integer',
      'number.min': 'Timestamp must be non-negative',
    }),
    messageSeq: Joi.number().integer().min(1).optional().messages({
      'number.base': 'Message sequence must be a number',
      'number.integer': 'Message sequence must be an integer',
      'number.min': 'Message sequence must be at least 1',
    }),
  })
    .required()
    .messages({
      'any.required': 'ZIM message object is required',
      'object.base': 'ZIM message must be an object',
    }),
  conversationId: objectIdSchema.required().messages({
    'any.required': 'Conversation ID is required',
    'string.pattern.name': 'Conversation ID must be a valid ObjectId',
  }),
});

// Export all schemas
export const messageValidation = {
  createMessage: createMessageSchema,
  editMessage: editMessageSchema,
  addReaction: addReactionSchema,
  getMessages: getMessagesQuerySchema,
  getUnreadCount: getUnreadCountQuerySchema,
  getMessagesByPet: getMessagesByPetQuerySchema,
  getSystemMessages: getSystemMessagesQuerySchema,
  syncMessageStatus: syncMessageStatusSchema,
  zimDeliveryEvent: zimDeliveryEventSchema,
  zimReadEvent: zimReadEventSchema,
  incomingZIMMessage: incomingZIMMessageSchema,
};
