/**
 * Migration: Add Pet Conversation Indexes
 *
 * This migration adds critical indexes for the "each pet = 1 separate conversation" feature:
 * - Unique constraint on user-shelter-pet combinations
 * - Optimized indexes for conversation and message queries
 * - ZIM group ID mapping support
 */

import mongoose from 'mongoose';
import logger from '../../utils/logger.js';

export const up = async () => {
  try {
    logger.info('🚀 Starting migration: Add Pet Conversation Indexes');

    const db = mongoose.connection.db;

    // Add indexes to conversations collection
    logger.info('📊 Adding indexes to conversations collection...');

    // Unique constraint for pet conversations
    await db.collection('conversations').createIndex(
      {
        participants: 1,
        'metadata.petId': 1,
        'metadata.shelterId': 1,
      },
      {
        unique: true,
        partialFilterExpression: {
          type: 'p2p',
          'metadata.petId': { $exists: true },
          'metadata.shelterId': { $exists: true },
        },
        name: 'unique_pet_conversation',
      }
    );

    // Index for lastMessageAt sorting
    await db
      .collection('conversations')
      .createIndex(
        { 'lastMessage.timestamp': -1, status: 1 },
        { name: 'lastMessage_status' }
      );

    // Index for pet-related conversations
    await db.collection('conversations').createIndex(
      {
        'metadata.petId': 1,
        'metadata.shelterId': 1,
        status: 1,
      },
      { name: 'pet_shelter_status' }
    );

    // Index for user's pet conversations
    await db.collection('conversations').createIndex(
      {
        participants: 1,
        'metadata.petId': 1,
        status: 1,
      },
      { name: 'user_pet_status' }
    );

    // Index for ZIM group ID
    await db
      .collection('conversations')
      .createIndex({ 'metadata.zimGroupId': 1 }, { name: 'zim_group_id' });

    // Add indexes to messages collection
    logger.info('📊 Adding indexes to messages collection...');

    // Compound index for conversation messages with sorting
    await db.collection('messages').createIndex(
      {
        conversationId: 1,
        createdAt: -1,
        isDeleted: 1,
      },
      { name: 'conversation_created_deleted' }
    );

    // Index for sender messages with timestamp
    await db.collection('messages').createIndex(
      {
        sender: 1,
        createdAt: -1,
        isDeleted: 1,
      },
      { name: 'sender_created_deleted' }
    );

    // Index for message status queries
    await db.collection('messages').createIndex(
      {
        status: 1,
        createdAt: -1,
      },
      { name: 'status_created' }
    );

    // Index for message type filtering
    await db.collection('messages').createIndex(
      {
        type: 1,
        createdAt: -1,
      },
      { name: 'type_created' }
    );

    // Index for pet-related message queries
    await db.collection('messages').createIndex(
      {
        'metadata.petId': 1,
        createdAt: -1,
      },
      { name: 'pet_created' }
    );

    // Index for adoption-related message queries
    await db.collection('messages').createIndex(
      {
        'metadata.adoptionId': 1,
        createdAt: -1,
      },
      { name: 'adoption_created' }
    );

    logger.info(
      '✅ Migration completed successfully: Pet Conversation Indexes added'
    );
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    throw error;
  }
};

export const down = async () => {
  try {
    logger.info('🔄 Rolling back migration: Remove Pet Conversation Indexes');

    const db = mongoose.connection.db;

    // Remove indexes from conversations collection
    const conversationIndexes = [
      'unique_pet_conversation',
      'lastMessage_status',
      'pet_shelter_status',
      'user_pet_status',
      'zim_group_id',
    ];

    for (const indexName of conversationIndexes) {
      try {
        await db.collection('conversations').dropIndex(indexName);
        logger.info(`🗑️ Dropped index: ${indexName}`);
      } catch (error) {
        logger.warn(`⚠️ Could not drop index ${indexName}:`, error.message);
      }
    }

    // Remove indexes from messages collection
    const messageIndexes = [
      'conversation_created_deleted',
      'sender_created_deleted',
      'status_created',
      'type_created',
      'pet_created',
      'adoption_created',
    ];

    for (const indexName of messageIndexes) {
      try {
        await db.collection('messages').dropIndex(indexName);
        logger.info(`🗑️ Dropped index: ${indexName}`);
      } catch (error) {
        logger.warn(`⚠️ Could not drop index ${indexName}:`, error.message);
      }
    }

    logger.info('✅ Rollback completed successfully');
  } catch (error) {
    logger.error('❌ Rollback failed:', error);
    throw error;
  }
};

export default { up, down };
