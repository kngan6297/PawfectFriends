import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet',
      required: true,
      index: true,
    },
    feedbackType: {
      type: String,
      required: true,
      enum: ['positive', 'negative', 'neutral'],
      index: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },
    userPreferences: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    petAttributes: {
      type: {
        type: String,
        enum: ['dog', 'cat', 'bird', 'other'],
      },
      breed: String,
      age: {
        type: String,
        enum: ['baby', 'young', 'adult', 'senior'],
      },
      size: {
        type: String,
        enum: ['small', 'medium', 'large'],
      },
      behavior: mongoose.Schema.Types.Mixed,
      attributes: mongoose.Schema.Types.Mixed,
    },
    recommendationScore: {
      type: Number,
      min: 0,
      max: 1,
      required: false,
    },
    sessionId: {
      type: String,
      required: false,
      index: true,
    },
    additionalDetails: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    // ML training metadata
    processedForTraining: {
      type: Boolean,
      default: false,
      index: true,
    },
    trainingImpact: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying
feedbackSchema.index({ userId: 1, timestamp: -1 });
feedbackSchema.index({ petId: 1, timestamp: -1 });
feedbackSchema.index({ feedbackType: 1, timestamp: -1 });
feedbackSchema.index({ recommendationScore: 1, timestamp: -1 });
feedbackSchema.index({ processedForTraining: 1, timestamp: -1 });

// Compound indexes for common queries
feedbackSchema.index({ userId: 1, feedbackType: 1, timestamp: -1 });
feedbackSchema.index({ petId: 1, feedbackType: 1, timestamp: -1 });

// Text search index for reason field
feedbackSchema.index({ reason: 'text' });

// Virtual for feedback age
feedbackSchema.virtual('ageInDays').get(function () {
  return Math.floor((Date.now() - this.timestamp) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to ensure data consistency
feedbackSchema.pre('save', function (next) {
  // Ensure timestamp is set
  if (!this.timestamp) {
    this.timestamp = new Date();
  }

  // Ensure recommendationScore is within bounds
  if (this.recommendationScore !== undefined) {
    this.recommendationScore = Math.max(
      0,
      Math.min(1, this.recommendationScore)
    );
  }

  next();
});

// Static method to get feedback statistics
feedbackSchema.statics.getFeedbackStats = async function (
  userId = null,
  petId = null
) {
  const match = {};
  if (userId) match.userId = userId;
  if (petId) match.petId = petId;

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$feedbackType',
        count: { $sum: 1 },
        avgScore: { $avg: '$recommendationScore' },
        recentCount: {
          $sum: {
            $cond: [
              {
                $gte: [
                  '$timestamp',
                  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return stats;
};

// Instance method to mark as processed for training
feedbackSchema.methods.markAsProcessed = function (trainingImpact = {}) {
  this.processedForTraining = true;
  this.trainingImpact = trainingImpact;
  return this.save();
};

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
