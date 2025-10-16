import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    // Reference to the conversation this message belongs to
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },

    // Sender ID (can be user or shelter)
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Sender role to distinguish between user and shelter
    role: {
      type: String,
      enum: ['user', 'shelter'],
      required: true,
      index: true,
    },

    // Message type
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text',
      required: true,
      index: true,
    },

    // Message content
    content: {
      type: String,
      required: function () {
        return this.type !== 'system';
      },
      trim: true,
      maxlength: 5000,
    },

    // Message attachments
    attachments: [
      {
        type: {
          type: String,
          enum: ['image', 'video', 'audio', 'file', 'document'],
          required: true,
        },
        url: {
          type: String,
          required: true,
          trim: true,
        },
        fileName: {
          type: String,
          trim: true,
        },
        fileSize: {
          type: Number, // in bytes
        },
        mimeType: {
          type: String,
          trim: true,
        },
        // For media files
        duration: Number, // in seconds for audio/video
        width: Number, // for images/videos
        height: Number, // for images/videos
        thumbnailUrl: String, // for videos
        // Additional metadata
        originalName: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Extended data for custom message types and metadata
    extendedData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Message status
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
      required: true,
      index: true,
    },

    // Message metadata for tracking
    metadata: {
      // ZIM message ID for synchronization
      zimMessageId: {
        type: String,
        trim: true,
        index: true,
      },
      // Message sequence number
      messageSeq: {
        type: Number,
        index: true,
      },
      // Original message timestamp from ZIM
      zimTimestamp: Date,
      // Pet-related metadata
      petId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        index: true,
      },
      // Adoption-related metadata
      adoptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Adoption',
        index: true,
      },
      // System message type
      systemType: {
        type: String,
        enum: [
          'conversation_started',
          'pet_inquiry',
          'adoption_request',
          'meeting_scheduled',
          'document_requested',
          'status_update',
          'reminder',
          'other',
        ],
      },
      // Location data for location messages
      location: {
        latitude: Number,
        longitude: Number,
        address: String,
        name: String,
      },
      // Reply to another message
      replyToMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
      // Forwarded message data
      forwardedFrom: {
        messageId: mongoose.Schema.Types.ObjectId,
        originalSender: String,
        originalTimestamp: Date,
      },
    },

    // Message flags
    isEdited: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: Date,

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Message reactions
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        emoji: {
          type: String,
          required: true,
          maxlength: 10,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Read receipts
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
        role: {
          type: String,
          enum: ['user', 'shelter'],
          required: true,
        },
      },
    ],

    // Delivery receipts
    deliveredTo: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        deliveredAt: {
          type: Date,
          default: Date.now,
        },
        role: {
          type: String,
          enum: ['user', 'shelter'],
          required: true,
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

// Indexes for optimal query performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ role: 1, createdAt: -1 });
messageSchema.index({ type: 1, createdAt: -1 });
messageSchema.index({ status: 1, createdAt: -1 });
messageSchema.index({ isDeleted: 1, createdAt: -1 });

// Compound indexes for complex queries
messageSchema.index({
  conversationId: 1,
  isDeleted: 1,
  createdAt: -1,
});

messageSchema.index({
  senderId: 1,
  role: 1,
  createdAt: -1,
});

messageSchema.index({
  status: 1,
  conversationId: 1,
  createdAt: -1,
});

messageSchema.index({
  'metadata.petId': 1,
  createdAt: -1,
});

messageSchema.index({
  'metadata.adoptionId': 1,
  createdAt: -1,
});

messageSchema.index({
  'metadata.zimMessageId': 1,
});

// Virtual for reaction count
messageSchema.virtual('reactionCount', {
  get() {
    return this.reactions ? this.reactions.length : 0;
  },
});

// Virtual for read count
messageSchema.virtual('readCount', {
  get() {
    return this.readBy ? this.readBy.length : 0;
  },
});

// Virtual for delivery count
messageSchema.virtual('deliveryCount', {
  get() {
    return this.deliveredTo ? this.deliveredTo.length : 0;
  },
});

// Virtual for message age in minutes
messageSchema.virtual('ageInMinutes', {
  get() {
    if (!this.createdAt) return 0;
    const diffTime = Math.abs(Date.now() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60));
  },
});

// Method to mark message as read by user
messageSchema.methods.markAsRead = function (userId, userRole) {
  const existingRead = this.readBy.find(
    (entry) => entry.userId.toString() === userId.toString()
  );

  if (!existingRead) {
    this.readBy.push({
      userId,
      role: userRole,
      readAt: new Date(),
    });

    // Update status to read if all participants have read
    this.updateStatusIfAllRead();

    return this.save();
  }

  return Promise.resolve(this);
};

// Method to mark message as delivered to user
messageSchema.methods.markAsDelivered = function (userId, userRole) {
  const existingDelivery = this.deliveredTo.find(
    (entry) => entry.userId.toString() === userId.toString()
  );

  if (!existingDelivery) {
    this.deliveredTo.push({
      userId,
      role: userRole,
      deliveredAt: new Date(),
    });

    // Update status to delivered if not already read
    if (this.status === 'sent') {
      this.status = 'delivered';
    }

    return this.save();
  }

  return Promise.resolve(this);
};

// Method to update status based on read receipts
messageSchema.methods.updateStatusIfAllRead = function () {
  // This would need to be implemented based on conversation participants
  // For now, we'll mark as read if anyone has read it
  if (this.readBy.length > 0) {
    this.status = 'read';
  }
};

// Method to add reaction
messageSchema.methods.addReaction = function (userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(
    (reaction) => reaction.userId.toString() !== userId.toString()
  );

  // Add new reaction
  this.reactions.push({
    userId,
    emoji,
    createdAt: new Date(),
  });

  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function (userId) {
  this.reactions = this.reactions.filter(
    (reaction) => reaction.userId.toString() !== userId.toString()
  );

  return this.save();
};

// Method to soft delete message
messageSchema.methods.softDelete = function (userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.content = '[Message deleted]';
  this.attachments = [];
  this.extendedData = {};

  return this.save();
};

// Method to edit message
messageSchema.methods.editMessage = function (newContent, newAttachments = []) {
  this.content = newContent;
  this.attachments = newAttachments;
  this.isEdited = true;
  this.extendedData = {
    ...this.extendedData,
    editedAt: new Date(),
  };

  return this.save();
};

// Static method to find messages by conversation
messageSchema.statics.findByConversation = function (
  conversationId,
  options = {}
) {
  const query = {
    conversationId,
    isDeleted: false,
  };

  if (options.before) {
    query.createdAt = { $lt: options.before };
  }

  if (options.after) {
    query.createdAt = { $gt: options.after };
  }

  if (options.type) {
    query.type = options.type;
  }

  if (options.role) {
    query.role = options.role;
  }

  if (options.status) {
    query.status = options.status;
  }

  const limit = options.limit || 50;
  const sort = options.sort || { createdAt: -1 };

  return this.find(query)
    .populate('senderId', 'firstName lastName name avatar')
    .populate('readBy.userId', 'firstName lastName name avatar')
    .populate('deliveredTo.userId', 'firstName lastName name avatar')
    .populate('reactions.userId', 'firstName lastName name avatar')
    .populate('metadata.petId', 'name type breed photos')
    .populate('metadata.adoptionId', 'status')
    .sort(sort)
    .limit(limit);
};

// Static method to get unread message count for user in conversation
messageSchema.statics.getUnreadCount = function (
  conversationId,
  userId,
  lastReadAt
) {
  const query = {
    conversationId,
    senderId: { $ne: userId },
    isDeleted: false,
  };

  if (lastReadAt) {
    query.createdAt = { $gt: lastReadAt };
  }

  return this.countDocuments(query);
};

// Static method to get messages by pet
messageSchema.statics.findByPet = function (petId, options = {}) {
  const query = {
    'metadata.petId': petId,
    isDeleted: false,
  };

  if (options.conversationId) {
    query.conversationId = options.conversationId;
  }

  const limit = options.limit || 50;

  return this.find(query)
    .populate('senderId', 'firstName lastName name avatar')
    .populate('conversationId', 'petId shelterId')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get system messages
messageSchema.statics.findSystemMessages = function (
  conversationId,
  systemType = null
) {
  const query = {
    conversationId,
    type: 'system',
    isDeleted: false,
  };

  if (systemType) {
    query['metadata.systemType'] = systemType;
  }

  return this.find(query)
    .populate('senderId', 'firstName lastName name avatar')
    .sort({ createdAt: -1 });
};

// Static method to get message statistics
messageSchema.statics.getMessageStats = function (conversationId) {
  return this.aggregate([
    {
      $match: {
        conversationId: new mongoose.Types.ObjectId(conversationId),
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        textMessages: {
          $sum: { $cond: [{ $eq: ['$type', 'text'] }, 1, 0] },
        },
        imageMessages: {
          $sum: { $cond: [{ $eq: ['$type', 'image'] }, 1, 0] },
        },
        fileMessages: {
          $sum: { $cond: [{ $eq: ['$type', 'file'] }, 1, 0] },
        },
        systemMessages: {
          $sum: { $cond: [{ $eq: ['$type', 'system'] }, 1, 0] },
        },
        userMessages: {
          $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] },
        },
        shelterMessages: {
          $sum: { $cond: [{ $eq: ['$role', 'shelter'] }, 1, 0] },
        },
        sentMessages: {
          $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] },
        },
        deliveredMessages: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
        },
        readMessages: {
          $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] },
        },
      },
    },
  ]);
};

// Pre-save middleware to update conversation's last message
messageSchema.pre('save', async function (next) {
  if (this.isNew && !this.isDeleted) {
    try {
      const Conversation = mongoose.model('Conversation');
      await Conversation.findByIdAndUpdate(this.conversationId, {
        lastMessage: {
          content: this.content,
          sender: this.senderId,
          timestamp: this.createdAt || new Date(),
          type: this.type,
          messageId: this._id,
        },
        lastMessageAt: this.createdAt || new Date(),
      });
    } catch (error) {
      console.error('Error updating conversation last message:', error);
    }
  }
  next();
});

// Post-save middleware to update unread counts
messageSchema.post('save', async function (doc) {
  if (doc.isNew && !doc.isDeleted) {
    try {
      const Conversation = mongoose.model('Conversation');
      const conversation = await Conversation.findById(doc.conversationId);

      if (conversation) {
        // Increment unread count for the other participant
        const otherParticipantId =
          conversation.userId.toString() === doc.senderId.toString()
            ? conversation.shelterId
            : conversation.userId;

        await conversation.incrementUnreadCount(otherParticipantId);
      }
    } catch (error) {
      console.error('Error updating conversation unread count:', error);
    }
  }
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
