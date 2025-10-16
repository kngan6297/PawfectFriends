import Joi from 'joi';
import { objectIdSchema } from '../../utils/validation.js';

const evidenceSchema = Joi.object({
  type: Joi.string().valid('screenshot', 'link', 'text').required(),
  content: Joi.string().required(),
  description: Joi.string().optional(),
});

export const createReportSchema = Joi.object({
  reportedUserId: objectIdSchema.required(),
  reason: Joi.string()
    .valid(
      'spam',
      'fraud',
      'harassment',
      'inappropriate_content',
      'fake_profile',
      'scam',
      'violation_of_terms',
      'other'
    )
    .required(),
  description: Joi.string().min(10).max(1000).required(),
  evidence: Joi.array().items(evidenceSchema).optional(),
});

export const updateReportStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'investigating', 'resolved', 'dismissed')
    .required(),
  adminNotes: Joi.string().max(500).optional(),
});

export const applyAdminActionSchema = Joi.object({
  action: Joi.string()
    .valid(
      'none',
      'warning',
      'temporary_ban',
      'permanent_ban',
      'content_removal'
    )
    .required(),
  actionDetails: Joi.object({
    banDuration: Joi.number().min(1).max(365).when('action', {
      is: 'temporary_ban',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    banReason: Joi.string()
      .max(200)
      .when('action', {
        is: Joi.string().valid('temporary_ban', 'permanent_ban'),
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    warningMessage: Joi.string().max(500).when('action', {
      is: 'warning',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  }).optional(),
});

export const reportQuerySchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'investigating', 'resolved', 'dismissed')
    .optional(),
  reason: Joi.string()
    .valid(
      'spam',
      'fraud',
      'harassment',
      'inappropriate_content',
      'fake_profile',
      'scam',
      'violation_of_terms',
      'other'
    )
    .optional(),
  reportedUserId: objectIdSchema.optional(),
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
  sortBy: Joi.string().valid('createdAt', 'status', 'reason').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});

export const reportValidation = {
  createReport: createReportSchema,
  updateStatus: updateReportStatusSchema,
  applyAction: applyAdminActionSchema,
  query: reportQuerySchema,
};
