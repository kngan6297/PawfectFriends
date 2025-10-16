import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        // Pet-related actions
        'pet_created',
        'pet_updated',
        'pet_deleted',
        'pet_status_changed',
        'pet_photo_uploaded',
        'pet_photo_deleted',
        'health_record_added',
        'health_record_updated',
        'behavior_record_added',
        'behavior_record_updated',

        // Adoption-related actions
        'adoption_request_created',
        'adoption_request_updated',
        'adoption_request_approved',
        'adoption_request_rejected',
        'adoption_request_cancelled',
        'adoption_completed',

        // User-related actions
        'user_registered',
        'user_updated',
        'user_deleted',
        'user_role_changed',
        'user_status_changed',
        'avatar_updated',
        'avatar_deleted',

        // Chat-related actions
        'chat_created',
        'message_sent',
        'message_deleted',
        'chat_archived',

        // Review-related actions
        'review_created',
        'review_updated',
        'review_deleted',

        // System actions
        'login',
        'logout',
        'password_changed',
        'email_verified',
        'session_created',
        'session_revoked',

        // Recommendation actions
        'recommendation_generated',
        'recommendation_viewed',
        'recommendation_feedback',
        'pet_interaction',
        'favorite_added',
        'favorite_removed',

        // Shelter actions
        'shelter_created',
        'shelter_updated',
        'shelter_deleted',

        // Admin actions
        'admin_action',
        'bulk_operation',
        'data_export',
        'data_import',

        // File operations
        'file_uploaded',
        'file_deleted',
        'document_uploaded',
        'document_deleted',
      ],
    },
    category: {
      type: String,
      required: true,
      enum: [
        'pet',
        'adoption',
        'user',
        'chat',
        'review',
        'system',
        'shelter',
        'admin',
        'file',
        'recommendation',
      ],
    },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    description: {
      type: String,
      required: true,
    },
    performedBy: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        required: true,
      },
    },
    shelter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shelter',
      required: false,
    },
    metadata: {
      // Pet-related metadata
      petId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
      },
      petName: String,
      oldStatus: String,
      newStatus: String,
      fieldChanged: String,
      oldValue: String,
      newValue: String,

      // Adoption-related metadata
      adoptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdoptionRequest',
      },
      requestId: String,
      reason: String,

      // User-related metadata
      targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      targetUserName: String,
      oldRole: String,
      newRole: String,

      // Chat-related metadata
      chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
      },
      messageId: String,

      // File-related metadata
      fileName: String,
      fileSize: Number,
      fileType: String,
      fileUrl: String,

      // System metadata
      ipAddress: String,
      userAgent: String,
      sessionId: String,

      // General metadata
      additionalData: mongoose.Schema.Types.Mixed,

      // Recommendation-related metadata
      recommendationId: String,
      interactionType: String,
      userPreferences: mongoose.Schema.Types.Mixed,
      petCount: Number,
      feedbackType: String,
      feedbackReason: String,
      recommendationScore: Number,
      sessionId: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ category: 1, timestamp: -1 });
activityLogSchema.index({ 'performedBy._id': 1, timestamp: -1 });
activityLogSchema.index({ shelter: 1, timestamp: -1 });
activityLogSchema.index({ 'metadata.petId': 1, timestamp: -1 });
activityLogSchema.index({ severity: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

// Text search index
activityLogSchema.index({
  description: 'text',
  'performedBy.name': 'text',
  'metadata.petName': 'text',
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
