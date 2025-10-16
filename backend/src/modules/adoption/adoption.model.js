import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { adoptionSchema } from './adoption.validation.js';
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
import { applicationDetailsSchema } from './applicationDetails.schema.js';
import { noteSchema } from './note.schema.js';
import { timelineEventSchema } from './timeline.schema.js';
import { meetingSchema } from './meeting.schema.js';
import { documentSchema } from './document.schema.js';
import { followUpSchema } from './followUp.schema.js';
import {
  ContractDetailsSchema,
  ContractFileSchema,
  ContractStatus,
  ContractLanguage,
} from '../../types/adoption.js';

const adoptionRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet',
      required: true,
    },
    shelter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ADOPTION_STATUSES,
      default: 'pending',
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    decisionDate: Date,
    applicationDetails: {
      type: applicationDetailsSchema,
      required: true,
    },
    notes: [noteSchema],
    timeline: [timelineEventSchema],
    meetings: [meetingSchema],
    documents: [documentSchema],
    followUps: [followUpSchema],
    finalDecision: {
      status: {
        type: String,
        enum: FINAL_DECISION_STATUSES,
      },
      date: Date,
      reason: String,
      decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      conditions: [String],
    },
    rejectionReason: {
      type: String,
      enum: REJECTION_REASONS,
      required: function () {
        return this.status === 'rejected';
      },
    },
    rejectionDetails: {
      type: String,
      maxlength: 1000,
      required: function () {
        return this.status === 'rejected';
      },
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    reminders: [
      {
        sentAt: Date,
        method: { type: String, enum: REMINDER_TYPES },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null for auto
      },
    ],
    // Additional Information Requests
    informationRequests: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
        },
        requestedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        dueDate: {
          type: Date,
          required: true,
        },
        status: {
          type: String,
          enum: INFORMATION_REQUEST_STATUSES,
          default: 'pending',
        },
        category: {
          type: String,
          enum: INFORMATION_REQUEST_CATEGORIES,
          required: true,
        },
        title: {
          type: String,
          required: true,
          maxlength: 200,
        },
        description: {
          type: String,
          required: true,
          maxlength: 1000,
        },
        requiredFields: [
          {
            fieldName: {
              type: String,
              required: true,
            },
            fieldType: {
              type: String,
              enum: FIELD_TYPES,
              required: true,
            },
            label: {
              type: String,
              required: true,
            },
            placeholder: String,
            required: {
              type: Boolean,
              default: false,
            },
            options: [String], // For select fields
            validation: {
              minLength: Number,
              maxLength: Number,
              pattern: String,
            },
          },
        ],
        submittedAt: Date,
        submittedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        response: {
          answers: [
            {
              fieldName: String,
              value: mongoose.Schema.Types.Mixed,
              fileUrl: String, // For file uploads
              fileName: String,
            },
          ],
          additionalNotes: String,
        },
        reviewedAt: Date,
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reviewNotes: String,
        reminders: [
          {
            sentAt: Date,
            method: { type: String, enum: REMINDER_TYPES },
            by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          },
        ],
        isUrgent: {
          type: Boolean,
          default: false,
        },
        priority: {
          type: String,
          enum: PRIORITY_LEVELS,
          default: 'medium',
        },
      },
    ],
    preliminaryEvaluation: {
      evaluatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      evaluatedAt: Date,
      decision: {
        type: String,
        enum: PRELIMINARY_EVALUATION_STATUSES,
      },
      notes: String,
      rejectionReason: {
        type: String,
        enum: REJECTION_REASONS,
      },
    },
    interviewResults: {
      conductedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      conductedAt: Date,
      outcome: {
        type: String,
        enum: ['passed', 'failed', 'conditional'],
      },
      notes: String,
      recommendations: [String],
      nextSteps: String,
    },
    homeVisitResults: {
      conductedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      conductedAt: Date,
      outcome: {
        type: String,
        enum: ['passed', 'failed', 'conditional'],
      },
      notes: String,
      recommendations: [String],
      safetyAssessment: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
      },
      environmentSuitable: Boolean,
    },
    contractDetails: {
      // Contract status and basic info (optional for initial request)
      status: {
        type: String,
        enum: Object.values(ContractStatus),
        default: ContractStatus.NONE,
      },
      title: {
        type: String,
        trim: true,
        // Optional for initial adoption request
      },
      description: {
        type: String,
        trim: true,
      },
      terms: {
        type: String,
        trim: true,
      },
      content: {
        type: String,
        trim: true,
      },
      lang: {
        type: String,
        enum: Object.values(ContractLanguage),
        default: ContractLanguage.ENGLISH,
      },
      fileKey: {
        type: String,
        trim: true,
      },
      fileUrl: {
        type: String,
        trim: true,
      },
      generated: {
        type: Boolean,
        default: false,
      },
      uploadedAt: {
        type: Date,
      },
      sentAt: {
        type: Date,
      },
      signedAt: {
        type: Date,
      },
      version: {
        type: Number,
        default: 1,
      },
      checksum: {
        type: String,
        trim: true,
      },
      conditions: [String],
      file: {
        // File fields are optional for initial adoption request
        originalName: {
          type: String,
          // Optional for initial adoption request
        },
        mimetype: {
          type: String,
          // Optional for initial adoption request
        },
        size: {
          type: Number,
          // Optional for initial adoption request
        },
        buffer: Buffer,
        url: String,
      },
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      signedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      contractUrl: String, // Legacy field for backward compatibility
    },
    handoverDetails: {
      handoverDate: Date,
      handoverLocation: String,
      handoverNotes: String,
      handoverMethod: {
        type: String,
        enum: ['in_person', 'delivery', 'pickup'],
        default: 'in_person',
      },
      witnessName: String,
      witnessContact: String,
      completedAt: Date,
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual fields for easy population and access
adoptionRequestSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
});

adoptionRequestSchema.virtual('petDetails', {
  ref: 'Pet',
  localField: 'pet',
  foreignField: '_id',
  justOne: true,
});

adoptionRequestSchema.virtual('shelterDetails', {
  ref: 'User',
  localField: 'shelter',
  foreignField: '_id',
  justOne: true,
});

// Virtual for user full name (computed from userDetails)
adoptionRequestSchema.virtual('userFullName').get(function () {
  if (this.userDetails) {
    return `${this.userDetails.firstName || ''} ${this.userDetails.lastName || ''}`.trim();
  }
  return '';
});

// Virtual for pet name and basic info
adoptionRequestSchema.virtual('petName').get(function () {
  if (this.petDetails) {
    return this.petDetails.name || '';
  }
  return '';
});

// Virtual for shelter name
adoptionRequestSchema.virtual('shelterName').get(function () {
  if (this.shelterDetails) {
    return this.shelterDetails.name || '';
  }
  return '';
});

// Virtual for application age (days since application)
adoptionRequestSchema.virtual('applicationAge').get(function () {
  if (this.applicationDate) {
    const now = new Date();
    const diffTime = Math.abs(now - this.applicationDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for status display name
adoptionRequestSchema.virtual('statusDisplayName').get(function () {
  const statusMap = {
    pending: 'Pending Review',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return statusMap[this.status] || this.status;
});

// Virtual for timeline status
adoptionRequestSchema.virtual('currentTimelineStatus').get(function () {
  if (this.timeline && this.timeline.length > 0) {
    // Get the most recent timeline entry
    const sortedTimeline = this.timeline.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    return sortedTimeline[0].status;
  }
  return null;
});

// Virtual for decision maker details
adoptionRequestSchema.virtual('decisionMakerDetails', {
  ref: 'User',
  localField: 'finalDecision.decidedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for evaluator details
adoptionRequestSchema.virtual('evaluatorDetails', {
  ref: 'User',
  localField: 'preliminaryEvaluation.evaluatedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for interview conductor details
adoptionRequestSchema.virtual('interviewConductorDetails', {
  ref: 'User',
  localField: 'interviewResults.conductedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for home visit conductor details
adoptionRequestSchema.virtual('homeVisitConductorDetails', {
  ref: 'User',
  localField: 'homeVisitResults.conductedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for contract signer details
adoptionRequestSchema.virtual('contractSignerDetails', {
  ref: 'User',
  localField: 'contractDetails.signedBy',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are included when converting to JSON
adoptionRequestSchema.set('toJSON', { virtuals: true });
adoptionRequestSchema.set('toObject', { virtuals: true });

// Instance methods for common operations
adoptionRequestSchema.methods.addTimelineEvent = function (
  status,
  note,
  updatedBy
) {
  this.timeline.push({
    status,
    date: new Date(),
    note,
    updatedBy,
  });
  return this.save();
};

adoptionRequestSchema.methods.addNote = function (
  content,
  author,
  isInternal = false
) {
  this.notes.push({
    content,
    author,
    isInternal,
    createdAt: new Date(),
  });
  return this.save();
};

adoptionRequestSchema.methods.updateStatus = function (
  newStatus,
  note,
  updatedBy
) {
  this.status = newStatus;
  if (newStatus === 'approved' || newStatus === 'rejected') {
    this.decisionDate = new Date();
  }
  return this.addTimelineEvent(newStatus, note, updatedBy);
};

adoptionRequestSchema.methods.isOverdue = function () {
  // Check if application is overdue (e.g., more than 30 days without decision)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.applicationDate < thirtyDaysAgo && this.status === 'pending';
};

adoptionRequestSchema.methods.getNextStep = function () {
  // Determine the next step based on current status
  const nextSteps = {
    pending: 'Initial Review',
    under_review: 'Preliminary Evaluation',
    approved: 'Final Approval',
    rejected: 'Rejection Notice',
    completed: 'Adoption Complete',
    cancelled: 'Application Cancelled',
  };
  return nextSteps[this.status] || 'Unknown';
};

// Static methods for common queries
adoptionRequestSchema.statics.findByUser = function (userId) {
  return this.find({ user: userId }).populate(
    'userDetails petDetails shelterDetails'
  );
};

adoptionRequestSchema.statics.findByShelter = function (shelterId) {
  return this.find({ shelter: shelterId }).populate(
    'userDetails petDetails shelterDetails'
  );
};

adoptionRequestSchema.statics.findByStatus = function (status) {
  return this.find({ status }).populate(
    'userDetails petDetails shelterDetails'
  );
};

adoptionRequestSchema.statics.findOverdue = function () {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.find({
    applicationDate: { $lt: thirtyDaysAgo },
    status: 'pending',
  }).populate('userDetails petDetails shelterDetails');
};

// Add mongoose-paginate-v2 plugin
adoptionRequestSchema.plugin(mongoosePaginate);

// Create indexes
adoptionRequestSchema.index({ user: 1 });
adoptionRequestSchema.index({ pet: 1 });
adoptionRequestSchema.index({ shelter: 1 });
adoptionRequestSchema.index({ status: 1 });
adoptionRequestSchema.index({ applicationDate: -1 });

// Unique compound index to prevent duplicate adoption requests
adoptionRequestSchema.index({ user: 1, pet: 1 }, { unique: true });

// Create the AdoptionRequest model
const AdoptionRequest = mongoose.model(
  'AdoptionRequest',
  adoptionRequestSchema
);

export { AdoptionRequest };
