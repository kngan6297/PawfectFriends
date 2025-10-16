import mongoose from 'mongoose';

/**
 * Note Schema
 * Contains notes and comments related to adoption requests
 */
const noteSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isInternal: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
    timestamps: false,
  }
);

export { noteSchema };
