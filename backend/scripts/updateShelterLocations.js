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

// Real Vietnamese location data for 3 shelters
const shelterLocationUpdates = [
  {
    name: 'Ho Chi Minh City Animal Rescue',
    email: 'rescue@hcmc-animals.org',
    location: {
      version: 'v1',
      province: {
        code: 79,
        name: 'Ho Chi Minh City',
        codename: 'tp_ho_chi_minh',
        division_type: 'central city',
        phone_code: 28,
      },
      district: {
        code: 769,
        name: 'Tan Binh District',
        codename: 'quan_tan_binh',
        division_type: 'district',
        province_code: 79,
      },
      ward: {
        code: 26734,
        name: 'Ward 7',
        codename: 'phuong_7',
        division_type: 'ward',
        district_code: 769,
      },
      details: {
        street: '123 Nguyen Van Troi Street',
        note: 'Near Tan Son Nhat Airport',
      },
      postalCode: '700000',
      country: 'VN',
      formatted:
        '123 Nguyen Van Troi Street, Ward 7, Tan Binh District, Ho Chi Minh City, 700000, VN',
    },
  },
  {
    name: 'Hanoi Pet Sanctuary',
    email: 'sanctuary@hanoi-pets.org',
    location: {
      version: 'v1',
      province: {
        code: 1,
        name: 'Ha Noi',
        codename: 'thanh_pho_ha_noi',
        division_type: 'central city',
        phone_code: 24,
      },
      district: {
        code: 1,
        name: 'Ba Dinh District',
        codename: 'quan_ba_dinh',
        division_type: 'district',
        province_code: 1,
      },
      ward: {
        code: 1,
        name: 'Phuc Xa Ward',
        codename: 'phuong_phuc_xa',
        division_type: 'ward',
        district_code: 1,
      },
      details: {
        street: '456 Hoang Hoa Tham Street',
        note: 'Near West Lake',
      },
      postalCode: '100000',
      country: 'VN',
      formatted:
        '456 Hoang Hoa Tham Street, Phuc Xa Ward, Ba Dinh District, Ha Noi, 100000, VN',
    },
  },
  {
    name: 'Da Nang Animal Care Center',
    email: 'care@danang-animals.org',
    location: {
      version: 'v1',
      province: {
        code: 48,
        name: 'Da Nang',
        codename: 'thanh_pho_da_nang',
        division_type: 'central city',
        phone_code: 236,
      },
      district: {
        code: 490,
        name: 'Hai Chau District',
        codename: 'quan_hai_chau',
        division_type: 'district',
        province_code: 48,
      },
      ward: {
        code: 20200,
        name: 'Thach Thang Ward',
        codename: 'phuong_thach_thang',
        division_type: 'ward',
        district_code: 490,
      },
      details: {
        street: '789 Le Duan Street',
        note: 'Near Han Market',
      },
      postalCode: '500000',
      country: 'VN',
      formatted:
        '789 Le Duan Street, Thach Thang Ward, Hai Chau District, Da Nang, 500000, VN',
    },
  },
];

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

// Function to update shelter locations
const updateShelterLocations = async () => {
  try {
    await connectToDatabase();

    logger.info('🔄 Starting shelter location updates...');

    for (const updateData of shelterLocationUpdates) {
      logger.info(`🔄 Updating shelter: ${updateData.name}`);

      // Find existing shelter by email
      const existingShelter = await User.findOne({
        email: updateData.email,
        role: 'shelter',
      });

      if (existingShelter) {
        // Update the shelter with new location data
        await User.findOneAndUpdate(
          { email: updateData.email, role: 'shelter' },
          {
            $set: {
              name: updateData.name,
              location: updateData.location,
            },
          },
          { new: true }
        );

        logger.info(`✅ Updated shelter: ${updateData.name}`);
        logger.info(`📍 Location: ${updateData.location.formatted}`);
      } else {
        // Create new shelter if it doesn't exist
        const newShelter = new User({
          name: updateData.name,
          email: updateData.email,
          password: 'Shelter@123', // Default password
          role: 'shelter',
          emailVerified: true,
          accountLocked: false,
          phone: '0987654321',
          avatar:
            'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=500',
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
          location: updateData.location,
          shelterInfo: {
            description: `Welcome to ${updateData.name}! We are dedicated to finding loving homes for all our furry friends.`,
            website: `https://${updateData.name.toLowerCase().replace(/\s+/g, '')}.org`,
            phone: '0987654321',
            socialMedia: {
              facebook: `https://facebook.com/${updateData.name.toLowerCase().replace(/\s+/g, '')}`,
              twitter: `https://twitter.com/${updateData.name.toLowerCase().replace(/\s+/g, '')}`,
              instagram: `https://instagram.com/${updateData.name.toLowerCase().replace(/\s+/g, '')}`,
            },
          },
          metadata: {
            source: 'location-update-script',
            createdBy: 'update-script',
            lastUpdated: new Date(),
          },
        });

        await newShelter.save();
        logger.info(`✅ Created new shelter: ${updateData.name}`);
        logger.info(`📍 Location: ${updateData.location.formatted}`);
      }
    }

    logger.info('✅ All shelter location updates completed successfully!');
  } catch (error) {
    logger.error('❌ Error updating shelter locations:', error);
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

// Run the update
updateShelterLocations().catch((error) => {
  logger.error('❌ Script failed:', error);
  process.exit(1);
});
