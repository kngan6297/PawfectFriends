import mongoose from 'mongoose';
import logger from '../../utils/logger.js';

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'spam',
        'fraud',
        'harassment',
        'inappropriate_content',
        'fake_profile',
        'scam',
        'violation_of_terms',
        'other',
      ],
    },
    description: {
      type: String,
      required: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    evidence: [
      {
        type: {
          type: String,
          enum: ['screenshot', 'link', 'text'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        description: String,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'dismissed'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      maxlength: [500, 'Admin notes cannot exceed 500 characters'],
    },
    adminAction: {
      type: String,
      enum: [
        'none',
        'warning',
        'temporary_ban',
        'permanent_ban',
        'content_removal',
      ],
      default: 'none',
    },
    actionDetails: {
      banDuration: Number, // in days, for temporary bans
      banReason: String,
      warningMessage: String,
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    handledAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create indexes
reportSchema.index({ reporter: 1 });
reportSchema.index({ reportedUser: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ reason: 1 });

// Pre-save middleware to update updatedAt
reportSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
reportSchema.statics.findByStatus = async function (status) {
  return this.find({ status })
    .populate('reporter', 'name email')
    .populate('reportedUser', 'name email role')
    .populate('handledBy', 'name email')
    .sort({ createdAt: -1 });
};

reportSchema.statics.findByReportedUser = async function (userId) {
  return this.find({ reportedUser: userId })
    .populate('reporter', 'name email')
    .populate('reportedUser', 'name email role')
    .populate('handledBy', 'name email')
    .sort({ createdAt: -1 });
};

reportSchema.statics.getReportStats = async function () {
  try {
    // Check if collection exists and has documents
    const count = await this.countDocuments();
    if (count === 0) {
      return [];
    }

    const stats = await this.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    return stats || [];
  } catch (error) {
    logger.error('Error in getReportStats aggregation:', error);
    return [];
  }
};

// Instance methods
reportSchema.methods.updateStatus = async function (
  status,
  adminId,
  notes = ''
) {
  this.status = status;
  this.adminNotes = notes;
  this.handledBy = adminId;
  this.handledAt = new Date();
  return this.save();
};

reportSchema.methods.applyAction = async function (action, actionDetails = {}) {
  this.adminAction = action;
  this.actionDetails = actionDetails;
  this.handledAt = new Date();
  return this.save();
};

// Create and export the model
const Report = mongoose.model('Report', reportSchema);

export { Report };
