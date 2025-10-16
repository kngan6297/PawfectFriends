import { config as dotenvConfig } from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Simple logger for this script
const logger = {
  info: (msg, ...args) => console.log(`ℹ️ ${msg}`, ...args),
  error: (msg, ...args) => console.error(`❌ ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`⚠️ ${msg}`, ...args),
};

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = resolve(__dirname, '../.env');
const result = dotenvConfig({ path: envPath });

if (result.error) {
  logger.error('❌ Error loading .env file:', result.error);
  process.exit(1);
}

// Simple User schema for this script
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: String,
    emailVerified: Boolean,
    accountLocked: Boolean,
    phone: String,
    avatar: String,
    isVerified: Boolean,
    isApproved: Boolean,
    status: String,
    isActive: Boolean,
    isBanned: Boolean,
    lastLogin: Date,
    loginAttempts: Number,
    lockUntil: Date,
    banExpiry: Date,
    banReason: String,
    bannedBy: String,
    bannedAt: Date,
    warnings: [String],
    contentRemovals: [String],
    location: Object,
    shelterInfo: Object,
    metadata: Object,
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

// Database connection function
const connectToDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    logger.info('🔄 Connecting to database...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info('✅ Connected to database successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

// Function to check existing shelters
const checkExistingShelters = async () => {
  try {
    await connectToDatabase();

    logger.info('🔄 Checking existing shelters...');

    const shelters = await User.find({ role: 'shelter' }).select(
      'name email location createdAt'
    );

    logger.info(`📊 Found ${shelters.length} shelters:`);

    shelters.forEach((shelter, index) => {
      logger.info(`\n${index + 1}. ${shelter.name}`);
      logger.info(`   Email: ${shelter.email}`);
      logger.info(`   Created: ${shelter.createdAt}`);
      logger.info(
        `   Location: ${shelter.location ? JSON.stringify(shelter.location, null, 2) : 'NO LOCATION DATA'}`
      );
    });
  } catch (error) {
    logger.error('❌ Error checking shelters:', error);
    throw error;
  } finally {
    try {
      await mongoose.disconnect();
      logger.info('👋 Disconnected from database');
    } catch (disconnectError) {
      logger.error(
        '❌ Error disconnecting from database:',
        disconnectError.message
      );
    }
  }
};

// Run the check
checkExistingShelters().catch((error) => {
  logger.error('❌ Script failed:', error);
  process.exit(1);
});
