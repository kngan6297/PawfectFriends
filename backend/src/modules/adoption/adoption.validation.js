import Joi from 'joi';
import {
  ADOPTION_STATUSES,
  TIMELINE_STATUSES,
  FINAL_DECISION_STATUSES,
  MEETING_STATUSES,
  DOCUMENT_STATUSES,
  INFORMATION_REQUEST_STATUSES,
  PRELIMINARY_EVALUATION_STATUSES,
  FOLLOW_UP_STATUSES,
  REJECTION_REASONS,
  INFORMATION_REQUEST_CATEGORIES,
  PRIORITY_LEVELS,
  FIELD_TYPES,
  DOCUMENT_TYPES,
  MEETING_TYPES,
  REMINDER_TYPES,
  FOLLOW_UP_TYPES,
  HOUSING_TYPES,
} from '../../constants/adoptionStatuses.js';

export const applicationDetailsSchema = Joi.object({
  housingType: Joi.string()
    .valid(...HOUSING_TYPES)
    .required(),
  hasYard: Joi.boolean().optional(),
  yardDetails: Joi.object({
    isFenced: Joi.boolean().optional(),
    size: Joi.string().optional(),
  }).optional(),
  hasOtherPets: Joi.boolean().optional(),
  otherPetsDetails: Joi.array()
    .items(
      Joi.object({
        type: Joi.string().required(),
        species: Joi.string().required(),
        age: Joi.number().required(),
        description: Joi.string().required(),
      })
    )
    .optional(),
  hasChildren: Joi.boolean().optional(),
  childrenAges: Joi.array().items(Joi.number()).optional(),
  workSchedule: Joi.string().required(),
  experience: Joi.string().optional(),
  reasonForAdopting: Joi.string().required(),
  plannedCareRoutine: Joi.string().optional(),
  veterinarianInfo: Joi.object({
    name: Joi.string().when('hasOtherPets', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    contact: Joi.string().when('hasOtherPets', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    clinic: Joi.string().when('hasOtherPets', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }).when('hasOtherPets', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  references: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        relationship: Joi.string().required(),
        phone: Joi.string().optional(),
        email: Joi.string().optional(),
        yearsKnown: Joi.number().optional(),
      })
    )
    .optional(),
});

// Validation schema for required fields in information requests
export const requiredFieldSchema = Joi.object({
  fieldName: Joi.string().required(),
  fieldType: Joi.string()
    .valid(...FIELD_TYPES)
    .required(),
  label: Joi.string().required(),
  placeholder: Joi.string().optional(),
  required: Joi.boolean().default(false),
  options: Joi.array().items(Joi.string()).optional(), // For select fields
  validation: Joi.object({
    minLength: Joi.number().optional(),
    maxLength: Joi.number().optional(),
    pattern: Joi.string().optional(),
  }).optional(),
});

// Validation schema for information request creation
export const createInformationRequestSchema = Joi.object({
  dueDate: Joi.date().greater('now').required(),
  category: Joi.string()
    .valid(...INFORMATION_REQUEST_CATEGORIES)
    .required(),
  title: Joi.string().max(200).required(),
  description: Joi.string().max(1000).required(),
  requiredFields: Joi.array().items(requiredFieldSchema).min(1).required(),
  isUrgent: Joi.boolean().default(false),
  priority: Joi.string()
    .valid(...PRIORITY_LEVELS)
    .default('medium'),
});

// Validation schema for information request response
export const submitInformationResponseSchema = Joi.object({
  answers: Joi.array()
    .items(
      Joi.object({
        fieldName: Joi.string().required(),
        value: Joi.any().optional(),
        fileUrl: Joi.string().uri().optional(),
        fileName: Joi.string().optional(),
      })
    )
    .required(),
  additionalNotes: Joi.string().max(1000).optional(),
});

// Validation schema for reviewing information request
export const reviewInformationRequestSchema = Joi.object({
  status: Joi.string()
    .valid(...FINAL_DECISION_STATUSES)
    .required(),
  reviewNotes: Joi.string().max(1000).optional(),
});

export const adoptionSchema = Joi.object({
  user: Joi.string().min(1).required().messages({
    'string.empty': 'User ID is required',
  }),
  pet: Joi.string().min(1).required().messages({
    'string.empty': 'Pet ID is required',
  }),
  shelter: Joi.string().min(1).required().messages({
    'string.empty': 'Shelter ID is required',
  }),
  status: Joi.string()
    .valid(...ADOPTION_STATUSES)
    .default('pending'),
  applicationDetails: applicationDetailsSchema.required(),
  rejectionReason: Joi.string()
    .valid(...REJECTION_REASONS)
    .when('status', {
      is: 'rejected',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      'any.required': 'Rejection reason is required when status is rejected',
      'any.forbidden':
        'Rejection reason should not be provided when status is not rejected',
    }),
  rejectionDetails: Joi.string()
    .max(1000)
    .when('status', {
      is: 'rejected',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      'any.required': 'Rejection details are required when status is rejected',
      'any.forbidden':
        'Rejection details should not be provided when status is not rejected',
      'string.max': 'Rejection details cannot exceed 1000 characters',
    }),
  notes: Joi.array()
    .items(
      Joi.object({
        content: Joi.string().required(),
        author: Joi.string().required(),
        isInternal: Joi.boolean().default(false),
        timestamp: Joi.date().default(() => new Date()),
      })
    )
    .optional(),
  timeline: Joi.array()
    .items(
      Joi.object({
        status: Joi.string()
          .valid(...TIMELINE_STATUSES)
          .required(),
        date: Joi.date().default(() => new Date()),
        note: Joi.string().optional(),
      })
    )
    .optional(),
  meetings: Joi.array()
    .items(
      Joi.object({
        type: Joi.string()
          .valid(...MEETING_TYPES)
          .required(),
        scheduledDate: Joi.date().optional(),
        status: Joi.string()
          .valid(...MEETING_STATUSES)
          .default('scheduled'),
        notes: Joi.string().optional(),
        location: Joi.string().optional(),
        participants: Joi.array().items(Joi.string()).optional(),
      })
    )
    .optional(),
  documents: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        url: Joi.string().required(),
        type: Joi.string()
          .valid(...DOCUMENT_TYPES)
          .required(),
        status: Joi.string()
          .valid(...DOCUMENT_STATUSES)
          .default('pending'),
        uploadedAt: Joi.date().default(() => new Date()),
        verifiedAt: Joi.date().optional(),
        verifiedBy: Joi.string().optional(),
      })
    )
    .optional(),
  finalDecision: Joi.object({
    status: Joi.string()
      .valid(...FINAL_DECISION_STATUSES)
      .optional(),
    date: Joi.date().optional(),
    reason: Joi.string().optional(),
    decidedBy: Joi.string().optional(),
    conditions: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  followUp: Joi.array()
    .items(
      Joi.object({
        scheduledDate: Joi.date().optional(),
        completedDate: Joi.date().optional(),
        type: Joi.string()
          .valid(...FOLLOW_UP_TYPES)
          .required(),
        status: Joi.string()
          .valid(...FOLLOW_UP_STATUSES)
          .default('scheduled'),
        notes: Joi.string().optional(),
      })
    )
    .optional(),
});
