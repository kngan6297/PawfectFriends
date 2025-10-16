import { config as dotenvConfig } from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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

// Function to create admin user
const createAdminUser = async () => {
  try {
    await connectToDatabase();

    logger.info('🔄 Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: 'admin@pawfectfriends.org',
    });
    if (existingAdmin) {
      logger.warn('⚠️ Admin user already exists!');
      logger.info(`📧 Email: ${existingAdmin.email}`);
      logger.info(`👤 Name: ${existingAdmin.name}`);
      logger.info(`🔑 Role: ${existingAdmin.role}`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin@123', 12);

    // Create admin user
    const adminUser = new User({
      name: 'Yue',
      email: 'admin@pawfectfriends.org',
      password: hashedPassword,
      role: 'admin',
      emailVerified: true,
      accountLocked: false,
      phone: '0987654321',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500',
      isVerified: true,
      isApproved: true,
      status: 'active',
      isActive: true,
      isBanned: false,
      lastLogin: new Date(),
      loginAttempts: 0,
      lockUntil: null,
      banExpiry: null,
      banReason: null,
      bannedBy: null,
      bannedAt: null,
      warnings: [],
      contentRemovals: [],
      metadata: {
        source: 'admin-creation-script',
        createdBy: 'system',
        lastUpdated: new Date(),
      },
    });

    await adminUser.save();
    logger.info('✅ Admin user created successfully!');
    logger.info(`📧 Email: ${adminUser.email}`);
    logger.info(`🔑 Password: Admin@123`);
    logger.info(`👤 Name: ${adminUser.name}`);
    logger.info(`🔑 Role: ${adminUser.role}`);
  } catch (error) {
    logger.error('❌ Error creating admin user:', error);
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

// Run the script
createAdminUser().catch((error) => {
  logger.error('❌ Script failed:', error);
  process.exit(1);
});
