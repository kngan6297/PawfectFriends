import Joi from 'joi';
import {
  objectIdSchema,
  validateImageUrl,
  validateDocumentUrl,
} from '../../utils/validation.js';

// Common schemas
const metadataSchema = Joi.object({
  externalId: Joi.string(),
  source: Joi.string(),
  organizationId: Joi.string(),
  originalUrl: Joi.string().uri(),
  lastUpdated: Joi.date(),
});

// Health record validation schema
const healthRecordSchema = Joi.object({
  condition: Joi.string().min(2).max(100).required(),
  treatment: Joi.string().min(2).max(200).required(),
  date: Joi.date().default(Date.now),
  veterinarian: Joi.string().min(2).max(100).optional(),
  notes: Joi.string().max(500).optional(),
  severity: Joi.string().valid('low', 'medium', 'high').default('medium'),
});

// Behavior record validation schema
const behaviorRecordSchema = Joi.object({
  behavior: Joi.string().min(2).max(100).required(),
  description: Joi.string().min(2).max(200).required(),
  date: Joi.date().default(Date.now),
  observedBy: Joi.string().min(2).max(100).optional(),
  notes: Joi.string().max(500).optional(),
  type: Joi.string()
    .valid('positive', 'negative', 'neutral')
    .default('neutral'),
});

export const petSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  slug: Joi.string(),
  type: Joi.string().valid('dog', 'cat', 'bird', 'other').required(),
  species: Joi.string().min(2).max(50).required(),
  breed: Joi.string()
    .min(2)
    .max(50)
    .invalid('unknown', 'Unknown', 'UNKNOWN', 'Unknown Breed', 'Mixed Breed')
    .required(),
  age: Joi.alternatives()
    .try(
      Joi.number().integer().min(0).max(30),
      Joi.string().valid('baby', 'young', 'adult', 'senior')
    )
    .required(),
  gender: Joi.string().valid('male', 'female', 'unknown').required(),
  size: Joi.string().valid('small', 'medium', 'large').required(),
  coat: Joi.string()
    .valid('short', 'medium', 'long', 'wire', 'curly', 'smooth', 'rough')
    .optional(),
  primaryColor: Joi.string().min(2).max(50).required(),
  secondaryColor: Joi.string().min(2).max(50).optional(),
  description: Joi.string().min(10).max(5000).required(),
  photos: Joi.array().items(
    Joi.object({
      _id: Joi.string(),
      url: Joi.string()
        .custom(validateImageUrl, 'image-url-validation')
        .required()
        .messages({
          'any.invalid':
            'URL must be a valid image URL with proper format and image extension',
          'any.required': 'Photo URL is required',
        }),
      small: Joi.string().uri().optional(),
      medium: Joi.string().uri().optional(),
      large: Joi.string().uri().optional(),
      full: Joi.string().uri().optional(),
      caption: Joi.string().max(200).optional(),
    })
  ),

  status: Joi.string()
    .valid(
      'adoptable',
      'pending',
      'adopted',
      'hidden',
      'waiting',
      'in_treatment',
      'fostered',
      'flagged',
      'rejected'
    )
    .required(),
  shelter: objectIdSchema,
  health: Joi.object({
    vaccinated: Joi.boolean().default(false),
    neutered: Joi.boolean().default(false),
    medicalHistory: Joi.array().items(
      Joi.object({
        condition: Joi.string(),
        treatment: Joi.string(),
        date: Joi.date(),
      })
    ),
  }),
  behavior: Joi.object({
    goodWith: Joi.array().items(
      Joi.string().valid('dogs', 'cats', 'children', 'other')
    ),
    activityLevel: Joi.string().valid('low', 'medium', 'high'),
    training: Joi.array().items(
      Joi.string().valid(
        'leash-trained',
        'obedience-trained',
        'house-trained',
        'crate-trained',
        'potty-trained'
      )
    ),
    // Enhanced behavior fields for AI matching
    crateTrained: Joi.boolean().default(false),
    leashTrained: Joi.boolean().default(false),
    houseTrained: Joi.boolean().default(false),
    obedienceTrained: Joi.boolean().default(false),
    pottyTrained: Joi.boolean().default(false),
    socialWithStrangers: Joi.boolean().default(false),
    goodWithOtherPets: Joi.boolean().default(false),
    needsExercise: Joi.boolean().default(false),
    independent: Joi.boolean().default(false),
    affectionate: Joi.boolean().default(false),
    protective: Joi.boolean().default(false),
  }),
  attributes: Joi.object({
    houseTrained: Joi.boolean().default(false),
    specialNeeds: Joi.boolean().default(false),
    declawed: Joi.boolean().default(false),
    spayedNeutered: Joi.boolean().default(false),
    shotsCurrent: Joi.boolean().default(false),
    // Enhanced training attributes for AI matching
    leashTrained: Joi.boolean().default(false),
    crateTrained: Joi.boolean().default(false),
    obedienceTrained: Joi.boolean().default(false),
    pottyTrained: Joi.boolean().default(false),
    microchipped: Joi.boolean().default(false),
  }),
  // Enhanced fields for better pet recommendations
  lifestyle: Joi.object({
    energyLevel: Joi.string().valid('low', 'medium', 'high').optional(),
    independenceLevel: Joi.string().valid('low', 'medium', 'high').optional(),
    socialNeeds: Joi.string().valid('low', 'medium', 'high').optional(),
    apartmentFriendly: Joi.boolean().optional(),
    requiresYard: Joi.boolean().optional(),
  }).optional(),
  care: Joi.object({
    groomingNeeds: Joi.string().valid('minimal', 'moderate', 'high').optional(),
    exerciseNeeds: Joi.string().valid('low', 'medium', 'high').optional(),
    attentionNeeds: Joi.string().valid('low', 'medium', 'high').optional(),
    medicalCareLevel: Joi.string()
      .valid('basic', 'moderate', 'advanced')
      .optional(),
  }).optional(),
  experience: Joi.object({
    suitableForFirstTimeOwners: Joi.boolean().optional(),
    trainingRequired: Joi.string()
      .valid('none', 'basic', 'advanced')
      .optional(),
    patienceRequired: Joi.string().valid('low', 'medium', 'high').optional(),
  }).optional(),
  allergies: Joi.object({
    hypoallergenic: Joi.boolean().optional(),
    sheddingLevel: Joi.string().valid('low', 'medium', 'high').optional(),
    danderLevel: Joi.string().valid('low', 'medium', 'high').optional(),
  }).optional(),
  tags: Joi.array()
    .items(
      Joi.string().valid(
        'Cute',
        'Friendly',
        'Playful',
        'Calm',
        'Energetic',
        'Gentle',
        'Loving',
        'Smart',
        'Quiet',
        'Active',
        'Independent',
        'Social',
        'Protective',
        'Curious',
        'Affectionate',
        'Loyal',
        'Patient',
        'Adventurous',
        'Relaxed',
        'Cheerful'
      )
    )
    .default([]),

  views: Joi.number().default(0),
  savedBy: Joi.array().items(Joi.string()),
  adoptionRequests: Joi.array().items(Joi.string()),
  isApproved: Joi.boolean().default(true),
  metadata: metadataSchema,
  healthRecords: Joi.array().items(healthRecordSchema).default([]),
  behaviorRecords: Joi.array().items(behaviorRecordSchema).default([]),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
});

export const createPetSchema = petSchema.fork(['photos'], (schema) =>
  schema.optional()
);

export const updatePetSchema = petSchema.fork(
  Object.keys(petSchema.describe().keys),
  (schema) => schema.optional()
);

export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      'adoptable',
      'pending',
      'adopted',
      'hidden',
      'waiting',
      'in_treatment',
      'fostered',
      'flagged',
      'rejected'
    )
    .required(),
  reason: Joi.string().max(200).optional().messages({
    'string.max': 'Reason cannot exceed 200 characters',
  }),
});

export const uploadImagesSchema = Joi.object({
  photos: Joi.array()
    .items(
      Joi.object({
        url: Joi.string()
          .custom(validateImageUrl, 'image-url-validation')
          .required()
          .messages({
            'any.invalid':
              'URL must be a valid image URL with proper format and image extension',
            'any.required': 'Photo URL is required',
          }),
        small: Joi.string().uri().optional(),
        medium: Joi.string().uri().optional(),
        large: Joi.string().uri().optional(),
        full: Joi.string().uri().optional(),
        caption: Joi.string().max(200).optional(),
      })
    )
    .min(1)
    .max(10)
    .required(),
});

export const petValidation = {
  createPet: createPetSchema,
  updatePet: updatePetSchema,
  updateStatus: updateStatusSchema,
  uploadImages: uploadImagesSchema,
  addHealthRecord: healthRecordSchema,
  addBehaviorRecord: behaviorRecordSchema,
};
