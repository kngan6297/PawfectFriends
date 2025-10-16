import mongoose from 'mongoose';
import { TIMELINE_STATUSES } from '../../constants/adoptionStatuses.js';

/**
 * Timeline Event Schema
 * Tracks the progression of adoption requests through various stages
 */
const timelineEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: TIMELINE_STATUSES,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    _id: true,
    timestamps: false,
  }
);

export { timelineEventSchema };
