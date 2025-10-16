import mongoose from 'mongoose';
import { reviewSchema as reviewValidationSchema } from './review.validation.js';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shelter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adoption: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdoptionRequest',
      required: true,
      // Only the user who adopted the pet can review the shelter
      // This ensures 1 user - 1 pet - 1 review relationship
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    photos: [
      {
        type: String,
        validate: {
          validator: function (v) {
            return /^https?:\/\/.+/.test(v);
          },
          message: 'Photo must be a valid URL',
        },
      },
    ],
    response: {
      comment: {
        type: String,
        trim: true,
        maxlength: 1000,
      },
      timestamp: Date,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reports: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reason: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add Joi validation middleware
reviewSchema.pre('validate', async function (next) {
  try {
    await reviewValidationSchema.validateAsync(this.toObject(), {
      abortEarly: false,
      stripUnknown: { objects: true, arrays: true },
    });
    next();
  } catch (error) {
    next(error);
  }
});

// Indexes
reviewSchema.index({ adoption: 1 }, { unique: true }); // Only one review per adoption (1 pet - 1 review)
reviewSchema.index({ user: 1, adoption: 1 }, { unique: true }); // One user can only review one adoption (1 user - 1 adoption)
reviewSchema.index({ shelter: 1, status: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ helpfulCount: -1 });
reviewSchema.index({ createdAt: -1 });

// Virtual for average rating
reviewSchema.virtual('averageRating').get(function () {
  return this.rating;
});

// Methods
reviewSchema.methods.markHelpful = async function (userId) {
  if (this.helpfulUsers.includes(userId)) {
    this.helpfulUsers.pull(userId);
    this.helpfulCount--;
  } else {
    this.helpfulUsers.push(userId);
    this.helpfulCount++;
  }
  return this.save();
};

reviewSchema.methods.addReport = async function (userId, reason) {
  if (!this.reports.some((report) => report.user.equals(userId))) {
    this.reports.push({ user: userId, reason });
    return this.save();
  }
  return this;
};

// Create and export the Review model
export const Review = mongoose.model('Review', reviewSchema);
