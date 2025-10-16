import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    // Core pet conversation fields
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    shelterId: {
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

    // ZIM integration
    zim: {
      type: {
        type: String,
        enum: ['group'],
        default: 'group',
        required: true,
      },
      groupKey: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },
      groupId: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },
    },

    // Conversation status
    status: {
      type: String,
      enum: [
        'active',
        'archived',
        'blocked',
        'completed',
        'cancelled',
        'pending_zim_member',
        'ready',
      ],
      default: 'active',
      required: true,
      index: true,
    },

    // Last message information
    lastMessage: {
      content: {
        type: String,
        trim: true,
        maxlength: 5000,
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      type: {
        type: String,
        enum: ['text', 'image', 'file', 'audio', 'video', 'system'],
        default: 'text',
      },
      messageId: {
        type: String,
        trim: true,
      },
    },

    // Last message timestamp for sorting
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Unread counts for user and shelter
    unread: {
      user: {
        type: Number,
        default: 0,
        min: 0,
      },
      shelter: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Shelter-specific features
    pinnedByShelter: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Greeting tracking
    greeted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Pending ZIM member tracking
    pendingMemberZimIds: [
      {
        type: String,
        trim: true,
      },
    ],

    // Messages array for storing ZIM messages
    messages: [
      {
        zimMessageId: {
          type: String,
          required: true,
          trim: true,
        },
        clientMsgId: {
          type: String,
          trim: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
        },
        messageType: {
          type: Number,
          required: true,
        },
        senderId: {
          type: String,
          required: true,
          trim: true,
        },
        timestamp: {
          type: Date,
          required: true,
        },
        extendedData: {
          type: String,
          default: '{}',
        },
      },
    ],

    // Notes array for conversation context
    notes: [
      {
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: 1000,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: [
            'general',
            'adoption_notes',
            'medical',
            'behavior',
            'follow_up',
          ],
          default: 'general',
        },
        isPrivate: {
          type: Boolean,
          default: false, // false = visible to both parties, true = shelter only
        },
      },
    ],

    // Additional metadata
    metadata: {
      // Adoption-related metadata
      adoptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Adoption',
      },
      // Conversation priority
      priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
      },
      // Tags for categorization
      tags: [String],
      // Custom metadata
      custom: mongoose.Schema.Types.Mixed,
    },

    // Conversation settings
    settings: {
      // Auto-archive after adoption completion
      autoArchive: {
        type: Boolean,
        default: true,
      },
      // Notification preferences
      notifications: {
        user: {
          email: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          sms: { type: Boolean, default: false },
        },
        shelter: {
          email: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          sms: { type: Boolean, default: false },
        },
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Critical unique index: one conversation per user-shelter-pet combination
conversationSchema.index(
  {
    userId: 1,
    shelterId: 1,
    petId: 1,
  },
  {
    unique: true,
    name: 'unique_pet_conversation',
  }
);

// Performance indexes
conversationSchema.index({ userId: 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ shelterId: 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ petId: 1, status: 1 });
conversationSchema.index({ 'zim.groupId': 1 });
conversationSchema.index({ pinnedByShelter: 1, lastMessageAt: -1 });
conversationSchema.index({ 'metadata.adoptionId': 1 });
conversationSchema.index({ 'metadata.priority': 1, lastMessageAt: -1 });

// Virtual for total unread count
conversationSchema.virtual('totalUnreadCount').get(function () {
  return this.unread.user + this.unread.shelter;
});

// Virtual for participant count (always 2 for pet conversations)
conversationSchema.virtual('participantCount').get(function () {
  return 2; // Always user + shelter
});

// Virtual for conversation age
conversationSchema.virtual('ageInDays').get(function () {
  const now = new Date();
  const created = this.createdAt;
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
});

// Virtual for last activity
conversationSchema.virtual('lastActivity').get(function () {
  return this.lastMessageAt || this.updatedAt;
});

// Virtual for conversationId (compatibility with frontend)
conversationSchema.virtual('conversationId').get(function () {
  return this._id.toString();
});

// Methods
conversationSchema.methods.isParticipant = function (userId) {
  // Handle both populated and non-populated fields
  const userIdStr = this.userId._id
    ? this.userId._id.toString()
    : this.userId.toString();
  const shelterIdStr = this.shelterId._id
    ? this.shelterId._id.toString()
    : this.shelterId.toString();

  return userIdStr === userId.toString() || shelterIdStr === userId.toString();
};

conversationSchema.methods.getUnreadCount = function (userId) {
  const userIdStr = this.userId._id
    ? this.userId._id.toString()
    : this.userId.toString();
  const shelterIdStr = this.shelterId._id
    ? this.shelterId._id.toString()
    : this.shelterId.toString();

  if (userIdStr === userId.toString()) {
    return this.unread.user;
  } else if (shelterIdStr === userId.toString()) {
    return this.unread.shelter;
  }
  return 0;
};

conversationSchema.methods.incrementUnreadCount = function (userId) {
  const userIdStr = this.userId._id
    ? this.userId._id.toString()
    : this.userId.toString();
  const shelterIdStr = this.shelterId._id
    ? this.shelterId._id.toString()
    : this.shelterId.toString();

  if (userIdStr === userId.toString()) {
    this.unread.user += 1;
  } else if (shelterIdStr === userId.toString()) {
    this.unread.shelter += 1;
  }
  return this.save();
};

conversationSchema.methods.resetUnreadCount = function (userId) {
  const userIdStr = this.userId._id
    ? this.userId._id.toString()
    : this.userId.toString();
  const shelterIdStr = this.shelterId._id
    ? this.shelterId._id.toString()
    : this.shelterId.toString();

  if (userIdStr === userId.toString()) {
    this.unread.user = 0;
  } else if (shelterIdStr === userId.toString()) {
    this.unread.shelter = 0;
  }
  return this.save();
};

conversationSchema.methods.addNote = function (
  content,
  addedBy,
  type = 'general',
  isPrivate = false
) {
  this.notes.push({
    content,
    addedBy,
    type,
    isPrivate,
  });
  return this.save();
};

conversationSchema.methods.updateLastMessage = function (messageData) {
  this.lastMessage = {
    content: messageData.content,
    sender: messageData.sender,
    timestamp: messageData.timestamp || new Date(),
    type: messageData.type || 'text',
    messageId: messageData.messageId,
  };
  this.lastMessageAt = this.lastMessage.timestamp;
  return this.save();
};

conversationSchema.methods.togglePin = function () {
  this.pinnedByShelter = !this.pinnedByShelter;
  return this.save();
};

conversationSchema.methods.markAsGreeted = function () {
  this.greeted = true;
  return this.save();
};

conversationSchema.methods.addPendingMember = function (zimUserId) {
  if (!this.pendingMemberZimIds.includes(zimUserId)) {
    this.pendingMemberZimIds.push(zimUserId);
  }
  return this.save();
};

conversationSchema.methods.removePendingMember = function (zimUserId) {
  this.pendingMemberZimIds = this.pendingMemberZimIds.filter(
    (id) => id !== zimUserId
  );
  return this.save();
};

conversationSchema.methods.clearPendingMembers = function () {
  this.pendingMemberZimIds = [];
  return this.save();
};

conversationSchema.methods.addMessage = function (messageData) {
  // Add message to the messages array (if it exists) or create it
  if (!this.messages) {
    this.messages = [];
  }

  this.messages.push({
    zimMessageId: messageData.zimMessageId,
    clientMsgId: messageData.clientMsgId,
    content: messageData.content,
    messageType: messageData.messageType,
    senderId: messageData.senderId,
    timestamp: messageData.timestamp,
    extendedData: messageData.extendedData || '{}',
  });

  return this.save();
};

// Static methods
conversationSchema.statics.findOrCreatePetConversation = async function (
  userId,
  shelterId,
  petId,
  zimGroupId = null
) {
  // Check if conversation already exists
  const existingConversation = await this.findOne({
    userId,
    shelterId,
    petId,
    status: { $ne: 'cancelled' },
  });

  if (existingConversation) {
    // Update ZIM group ID if provided and not already set
    if (zimGroupId && !existingConversation.zim.groupId) {
      existingConversation.zim.groupId = zimGroupId;
      await existingConversation.save();
    }
    return existingConversation;
  }

  // Generate ZIM group ID if not provided
  if (!zimGroupId) {
    zimGroupId = `grp_${shelterId}_${petId}_${userId}`;
  }

  // Create new pet conversation
  return this.create({
    userId,
    shelterId,
    petId,
    zim: {
      type: 'group',
      groupId: zimGroupId,
    },
  });
};

conversationSchema.statics.findByUser = function (userId, options = {}) {
  const query = {
    $or: [{ userId: userId }, { shelterId: userId }],
    status: { $ne: 'cancelled' },
  };

  if (options.status) {
    query.status = options.status;
  }

  if (options.pinned) {
    query.pinnedByShelter = true;
  }

  return this.find(query)
    .populate('userId', 'firstName lastName email avatar')
    .populate('shelterId', 'name email avatar')
    .populate('petId', 'name type breed photos')
    .populate('lastMessage.sender', 'firstName lastName avatar')
    .populate('notes.addedBy', 'firstName lastName avatar')
    .sort({ pinnedByShelter: -1, lastMessageAt: -1 });
};

conversationSchema.statics.findByShelter = function (shelterId, options = {}) {
  const query = {
    shelterId,
    status: { $ne: 'cancelled' },
  };

  if (options.status) {
    query.status = options.status;
  }

  if (options.petId) {
    query.petId = options.petId;
  }

  return this.find(query)
    .populate('userId', 'firstName lastName email avatar')
    .populate('shelterId', 'name email avatar')
    .populate('petId', 'name type breed photos')
    .populate('lastMessage.sender', 'firstName lastName avatar')
    .populate('notes.addedBy', 'firstName lastName avatar')
    .sort({ pinnedByShelter: -1, lastMessageAt: -1 });
};

conversationSchema.statics.findByPet = function (petId, options = {}) {
  const query = {
    petId,
    status: { $ne: 'cancelled' },
  };

  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .populate('userId', 'firstName lastName email avatar')
    .populate('shelterId', 'name email avatar')
    .populate('petId', 'name type breed photos')
    .populate('lastMessage.sender', 'firstName lastName avatar')
    .populate('notes.addedBy', 'firstName lastName avatar')
    .sort({ lastMessageAt: -1 });
};

conversationSchema.statics.getConversationStats = async function (userId) {
  const stats = await this.aggregate([
    {
      $match: {
        $or: [{ userId: userId }, { shelterId: userId }],
        status: { $ne: 'cancelled' },
      },
    },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        activeConversations: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
        pinnedConversations: {
          $sum: { $cond: ['$pinnedByShelter', 1, 0] },
        },
        totalUnread: {
          $sum: {
            $cond: [
              { $eq: ['$userId', userId] },
              '$unread.user',
              '$unread.shelter',
            ],
          },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalConversations: 0,
      activeConversations: 0,
      pinnedConversations: 0,
      totalUnread: 0,
    }
  );
};

// Pre-save middleware
conversationSchema.pre('save', function (next) {
  // Update lastMessageAt when lastMessage changes
  if (this.isModified('lastMessage') && this.lastMessage.timestamp) {
    this.lastMessageAt = this.lastMessage.timestamp;
  }

  // Ensure notes are sorted by date
  if (this.isModified('notes')) {
    this.notes.sort((a, b) => b.addedAt - a.addedAt);
  }

  next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
