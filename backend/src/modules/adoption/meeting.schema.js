import mongoose from 'mongoose';
import {
  MEETING_TYPES,
  MEETING_STATUSES,
  REMINDER_TYPES,
} from '../../constants/adoptionStatuses.js';

/**
 * Meeting Schema
 * Manages scheduled meetings and appointments during the adoption process
 */
const meetingSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: MEETING_TYPES,
      required: true,
    },
    scheduledDate: Date,
    completedDate: Date,
    location: String,
    notes: String,
    status: {
      type: String,
      enum: MEETING_STATUSES,
      default: 'scheduled',
    },
    // Reschedule tracking fields
    rescheduleCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 3, // Limit to 3 reschedules
    },
    previousDate: Date, // Store the previous date when rescheduled
    originalDate: Date, // Store the very first scheduled date
    rescheduleHistory: [
      {
        fromDate: Date,
        toDate: Date,
        reason: String,
        rescheduledBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        rescheduledAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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

export { meetingSchema };
