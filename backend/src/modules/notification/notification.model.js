import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    type: {
      type: String,
      enum: [
        'adoption_request',
        'adoption_status_change',
        'new_message',
        'pet_status_change',
        'review_received',
        'system_alert',
        'reminder',
        'meeting_scheduled',
        'document_uploaded',
        'profile_view',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    data: {
      // Flexible data object for different notification types
      adoptionRequestId: mongoose.Schema.Types.ObjectId,
      petId: mongoose.Schema.Types.ObjectId,
      chatId: mongoose.Schema.Types.ObjectId,
      reviewId: mongoose.Schema.Types.ObjectId,
      meetingId: mongoose.Schema.Types.ObjectId,
      documentId: mongoose.Schema.Types.ObjectId,
      status: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
      },
      actionUrl: String,
      actionText: String,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    sentVia: [
      {
        type: {
          type: String,
          enum: ['in_app', 'email', 'push', 'sms'],
          default: 'in_app',
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['pending', 'sent', 'delivered', 'failed'],
          default: 'pending',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

// Pre-save middleware to set expiration for certain notification types
notificationSchema.pre('save', function (next) {
  if (!this.expiresAt) {
    // Set expiration based on notification type
    const now = new Date();
    switch (this.type) {
      case 'reminder':
        this.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        break;
      case 'system_alert':
        this.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        break;
      default:
        this.expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
    }
  }
  next();
});

// Instance methods
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsUnread = function () {
  this.isRead = false;
  this.readAt = null;
  return this.save();
};

notificationSchema.methods.archive = function () {
  this.isArchived = true;
  return this.save();
};

// Static methods
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    isArchived: false,
  });
};

notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    {
      recipient: userId,
      isRead: false,
      isArchived: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );
};

export const Notification = mongoose.model('Notification', notificationSchema);
