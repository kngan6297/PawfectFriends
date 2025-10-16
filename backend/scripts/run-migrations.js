#!/usr/bin/env node

/**
 * Migration Runner for PawfectFriends Backend
 *
 * This script runs database migrations in order to ensure
 * the database schema is up to date with the application code.
 */

import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from '../src/utils/logger.js';
import config from '../src/config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Migration registry
const migrations = [
  {
    id: '001-add-pet-conversation-indexes',
    name: 'Add Pet Conversation Indexes',
    file: join(
      __dirname,
      '../src/db/migrations/001-add-pet-conversation-indexes.js'
    ),
  },
];

class MigrationRunner {
  constructor() {
    this.db = null;
    this.migrationsCollection = 'migrations';
  }

  async connect() {
    try {
      if (!config.mongoUri) {
        throw new Error('MongoDB URI not configured');
      }

      await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });

      this.db = mongoose.connection.db;
      logger.info('✅ Connected to MongoDB');
    } catch (error) {
      logger.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      logger.info('✅ Disconnected from MongoDB');
    } catch (error) {
      logger.error('❌ Error disconnecting from MongoDB:', error);
    }
  }

  async getCompletedMigrations() {
    try {
      const collection = this.db.collection(this.migrationsCollection);
      const completed = await collection.find({}).toArray();
      return completed.map((m) => m.id);
    } catch (error) {
      logger.warn('⚠️ Could not fetch completed migrations:', error.message);
      return [];
    }
  }

  async markMigrationCompleted(migrationId, success = true) {
    try {
      const collection = this.db.collection(this.migrationsCollection);
      await collection.insertOne({
        id: migrationId,
        completedAt: new Date(),
        success,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(
        `❌ Failed to mark migration ${migrationId} as completed:`,
        error
      );
    }
  }

  async runMigration(migration) {
    try {
      logger.info(`🚀 Running migration: ${migration.name}`);

      // Import the migration module
      const migrationModule = await import(migration.file);

      if (!migrationModule.up) {
        throw new Error(
          `Migration ${migration.id} does not export an 'up' function`
        );
      }

      // Run the migration
      await migrationModule.up();

      // Mark as completed
      await this.markMigrationCompleted(migration.id, true);

      logger.info(`✅ Migration completed: ${migration.name}`);
      return true;
    } catch (error) {
      logger.error(`❌ Migration failed: ${migration.name}`, error);
      await this.markMigrationCompleted(migration.id, false);
      return false;
    }
  }

  async runMigrations() {
    try {
      await this.connect();

      const completedMigrations = await this.getCompletedMigrations();
      const pendingMigrations = migrations.filter(
        (m) => !completedMigrations.includes(m.id)
      );

      if (pendingMigrations.length === 0) {
        logger.info('✅ All migrations are up to date');
        return;
      }

      logger.info(`📋 Found ${pendingMigrations.length} pending migrations`);

      let successCount = 0;
      let failureCount = 0;

      for (const migration of pendingMigrations) {
        const success = await this.runMigration(migration);
        if (success) {
          successCount++;
        } else {
          failureCount++;
          logger.error(
            `❌ Stopping migration process due to failure in: ${migration.name}`
          );
          break;
        }
      }

      logger.info(
        `📊 Migration Summary: ${successCount} successful, ${failureCount} failed`
      );

      if (failureCount > 0) {
        process.exit(1);
      }
    } catch (error) {
      logger.error('❌ Migration runner failed:', error);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }

  async rollbackMigration(migrationId) {
    try {
      await this.connect();

      const migration = migrations.find((m) => m.id === migrationId);
      if (!migration) {
        throw new Error(`Migration ${migrationId} not found`);
      }

      logger.info(`🔄 Rolling back migration: ${migration.name}`);

      // Import the migration module
      const migrationModule = await import(migration.file);

      if (!migrationModule.down) {
        throw new Error(
          `Migration ${migration.id} does not export a 'down' function`
        );
      }

      // Run the rollback
      await migrationModule.down();

      // Remove from completed migrations
      const collection = this.db.collection(this.migrationsCollection);
      await collection.deleteOne({ id: migrationId });

      logger.info(`✅ Rollback completed: ${migration.name}`);
    } catch (error) {
      logger.error(`❌ Rollback failed: ${migration.name}`, error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const migrationId = args[1];

  const runner = new MigrationRunner();

  switch (command) {
    case 'up':
    case 'migrate':
      await runner.runMigrations();
      break;

    case 'down':
    case 'rollback':
      if (!migrationId) {
        logger.error('❌ Migration ID required for rollback');
        process.exit(1);
      }
      await runner.rollbackMigration(migrationId);
      break;

    case 'status':
      await runner.connect();
      const completed = await runner.getCompletedMigrations();
      logger.info('📋 Migration Status:');
      migrations.forEach((migration) => {
        const status = completed.includes(migration.id) ? '✅' : '⏳';
        logger.info(`  ${status} ${migration.id}: ${migration.name}`);
      });
      await runner.disconnect();
      break;

    default:
      logger.info('Usage:');
      logger.info(
        '  node run-migrations.js up          - Run all pending migrations'
      );
      logger.info(
        '  node run-migrations.js down <id>   - Rollback a specific migration'
      );
      logger.info(
        '  node run-migrations.js status      - Show migration status'
      );
      process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('❌ Migration runner failed:', error);
    process.exit(1);
  });
}

export default MigrationRunner;
