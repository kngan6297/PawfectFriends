import mongoose from 'mongoose';
import {
  FOLLOW_UP_TYPES,
  FOLLOW_UP_STATUSES,
  REMINDER_TYPES,
} from '../../constants/adoptionStatuses.js';

/**
 * Follow-up Schema
 * Manages post-adoption follow-up activities
 */
const followUpSchema = new mongoose.Schema(
  {
    scheduledDate: Date,
    completedDate: Date,
    type: {
      type: String,
      enum: FOLLOW_UP_TYPES,
      required: true,
    },
    notes: String,
    status: {
      type: String,
      enum: FOLLOW_UP_STATUSES,
      default: 'scheduled',
    },
    reminders: [
      {
        sentAt: Date,
        type: {
          type: String,
          enum: REMINDER_TYPES,
        },
      },
    ],
  },
  {
    _id: true,
    timestamps: false,
  }
);

export { followUpSchema };
