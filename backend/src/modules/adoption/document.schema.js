import mongoose from 'mongoose';
import {
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
} from '../../constants/adoptionStatuses.js';

/**
 * Document Schema
 * Manages documents uploaded during the adoption process
 */
const documentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: DOCUMENT_TYPES,
      required: true,
    },
    url: String,
    name: String,
    status: {
      type: String,
      enum: DOCUMENT_STATUSES,
      default: 'pending',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    _id: true,
    timestamps: false,
  }
);

export { documentSchema };
