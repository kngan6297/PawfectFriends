import Joi from 'joi';
import mongoose from 'mongoose';

/**
 * Joi validator for MongoDB ObjectId
 */
export const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'Object Id Validation');
