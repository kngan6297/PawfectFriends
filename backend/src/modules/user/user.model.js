import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../utils/jwt.js';
import { completeUserSchema } from './user.validation.js';
import { UserRole } from './user.types.js';
import { shelterFieldsSchema } from '../shelter/shelter.validation.js';
import { AddressSchema } from '../../schemas/AddressSchema.js';

// Base user schema
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'shelter', 'admin'],
      default: 'user',
    },
    // ZIM integration field - maps to ZIM user ID
    zimUserId: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined values
      index: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    accountLocked: {
      type: Boolean,
      default: false,
    },
    lockUntil: Date,
    // Ban and warning fields for report system
    isBanned: {
      type: Boolean,
      default: false,
    },
    banExpiry: Date,
    banReason: String,
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    bannedAt: Date,
    // Approval and status fields for admin management
    isApproved: {
      type: Boolean,
      default: true, // Default to approved for script-created accounts
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'banned', 'inactive'],
      default: 'active', // Default to active for script-created accounts
    },
    warnings: [
      {
        reason: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    contentRemovals: [
      {
        reason: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    // Soft delete fields
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deletionReason: {
      type: String,
      enum: [
        'user_requested',
        'admin_action',
        'policy_violation',
        'inactive_account',
        'system_cleanup',
      ],
    },
  },
  {
    timestamps: true,
    discriminatorKey: 'role',
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

// Base user schema indexes
userSchema.index({ zimUserId: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });

// User schema
const userProfileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String, default: '' },
    bio: { type: String, trim: true, maxlength: 500 },

    // location thống nhất
    location: { type: AddressSchema, required: false },

    preferences: {
      petTypes: { type: [String], default: [] },
      ageRange: {
        min: { type: Number, default: undefined },
        max: { type: Number, default: undefined },
      },
      updatedAt: { type: Date, default: undefined },
    },

    requirements: {
      petType: {
        type: String,
        enum: ['dog', 'cat', 'bird', 'other', 'any'],
        default: 'any',
      },
      gender: {
        type: String,
        enum: ['male', 'female', 'unknown', 'any'],
        default: 'any',
      },
      size: {
        type: String,
        enum: ['small', 'medium', 'large', 'any'],
        default: 'any',
      },
      age: {
        type: String,
        enum: ['baby', 'young', 'adult', 'senior', 'any'],
        default: 'any',
      },

      experienceLevel: {
        type: String,
        enum: ['first-time', 'experienced', 'expert'],
        default: 'first-time',
      },
      livingSituation: {
        type: String,
        enum: ['apartment', 'house', 'condo', 'farm'],
        default: 'apartment',
      },
      activityLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      timeAvailability: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      budgetRange: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },

      allergyFriendly: { type: Boolean, default: false },
      openToSpecialNeeds: { type: Boolean, default: false },

      hasChildren: { type: Boolean, default: false },
      childrenAgeRange: {
        min: { type: Number, default: undefined },
        max: { type: Number, default: undefined },
      },

      hasOtherPets: { type: Boolean, default: false },
      otherPetTypes: { type: [String], default: [] },

      trainingPreference: {
        type: String,
        enum: ['none', 'basic', 'advanced'],
        default: 'basic',
      },
      groomingPreference: {
        type: String,
        enum: ['minimal', 'moderate', 'high'],
        default: 'moderate',
      },
      exercisePreference: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      socialPreference: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      independencePreference: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      medicalCarePreference: {
        type: String,
        enum: ['basic', 'moderate', 'advanced'],
        default: 'basic',
      },
      patienceLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      travelFrequency: {
        type: String,
        enum: ['rarely', 'occasionally', 'frequently'],
        default: 'occasionally',
      },
      workSchedule: {
        type: String,
        enum: ['flexible', 'part-time', 'full-time', 'shift-work'],
        default: 'full-time',
      },
      homeEnvironment: {
        type: String,
        enum: ['quiet', 'moderate', 'busy'],
        default: 'moderate',
      },

      hasYard: { type: Boolean, default: false },
      yardSize: {
        type: String,
        enum: ['none', 'small', 'medium', 'large'],
        default: 'none',
      },

      climate: {
        type: String,
        enum: ['cold', 'moderate', 'hot', 'variable'],
        default: 'moderate',
      },
      commitmentLevel: {
        type: String,
        enum: ['short-term', 'medium-term', 'long-term'],
        default: 'long-term',
      },

      preferredBreeds: { type: [String], default: [] },
      dealBreakers: { type: [String], default: [] },

      additionalNotes: { type: String, maxlength: 1000, default: '' },
      lastUpdated: { type: Date, default: Date.now },
      completionPercentage: { type: Number, min: 0, max: 100, default: 0 },
    },

    favoritePets: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', default: [] },
    ],
    viewedPets: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', default: [] },
    ],
    adoptionHistory: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'AdoptionRequest' },
    ],
    reviewHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],

    twoFactorEnabled: { type: Boolean, default: false },
    loginNotifications: { type: Boolean, default: true },
  },
  {
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    id: false,
  }
);

// Virtuals "đúng chuẩn"
userProfileSchema.virtual('requirementsSummary').get(function () {
  const r = this.requirements || {};
  if (!r.petType || r.petType === 'any') return 'Requirements not set';
  const summary = [];
  summary.push(`${r.petType} (${r.gender || 'any gender'})`);
  summary.push(`${r.size || 'any size'} ${r.age || 'any age'}`);
  if (r.experienceLevel) summary.push(`${r.experienceLevel} owner`);
  if (r.livingSituation) summary.push(`${r.livingSituation} living`);
  if (r.allergyFriendly) summary.push('allergy-friendly');
  if (r.openToSpecialNeeds) summary.push('open to special needs');
  return summary.join(', ');
});

userProfileSchema.virtual('requirementsPriority').get(function () {
  const completion = this.calculateRequirementsCompletion?.() ?? 0;
  if (completion >= 90) return 'high';
  if (completion >= 70) return 'medium';
  if (completion >= 50) return 'low';
  return 'minimal';
});

// User profile schema indexes
userProfileSchema.index({
  'requirements.petType': 1,
  'requirements.completionPercentage': -1,
});
userProfileSchema.index({
  'requirements.experienceLevel': 1,
  'requirements.completionPercentage': -1,
});
userProfileSchema.index({
  'requirements.livingSituation': 1,
  'requirements.completionPercentage': -1,
});
userProfileSchema.index({
  'requirements.allergyFriendly': 1,
  'requirements.completionPercentage': -1,
});
userProfileSchema.index({
  'requirements.openToSpecialNeeds': 1,
  'requirements.completionPercentage': -1,
});
userProfileSchema.index({ 'requirements.completionPercentage': -1 });
userProfileSchema.index({
  'requirements.petType': 1,
  'requirements.experienceLevel': 1,
  'requirements.livingSituation': 1,
});

// Location-based indexes for geographic queries
userProfileSchema.index({ 'location.province.code': 1 });
userProfileSchema.index({ 'location.district.code': 1 });
userProfileSchema.index({ 'location.ward.code': 1 });

// Shelter schema
const shelterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    avatar: { type: String, default: '' },
    profileViews: { type: Number, default: 0, min: 0 },
    bio: { type: String, trim: true, maxlength: 1000 },
    location: { type: AddressSchema, required: true },
    website: { type: String, trim: true },
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String,
    },
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    adoptionProcess: { type: String, trim: true, maxlength: 1000 },
    requirements: { type: String, trim: true, maxlength: 1000 },
    photos: [
      {
        type: String,
        validate: {
          validator: (v) => /^https?:\/\/.+/.test(v),
          message: 'Photo must be a valid URL',
        },
      },
    ],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    pets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }],
    adoptionRequests: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'AdoptionRequest' },
    ],
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Shelter schema indexes
shelterSchema.index({ 'location.province.code': 1 });
shelterSchema.index({ 'location.district.code': 1 });
shelterSchema.index({ 'location.ward.code': 1 });

// Admin schema
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  lastAction: {
    type: String,
    trim: true,
  },
  actionTimestamp: Date,
});

// Pre-save middleware for password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Methods
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function () {
  return generateToken({ id: this._id, role: this.role });
};

// Hide sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  return obj;
};

// User profile specific methods
userProfileSchema.methods.updateRequirements = function (newRequirements) {
  if (!this.requirements) this.requirements = {};
  Object.assign(this.requirements, newRequirements || {});
  this.requirements.lastUpdated = new Date();
  this.requirements.completionPercentage =
    this.calculateRequirementsCompletion();
  return this.save();
};

userProfileSchema.methods.calculateRequirementsCompletion = function () {
  const r = this.requirements || {};
  const requiredFields = [
    'petType',
    'gender',
    'size',
    'age',
    'experienceLevel',
    'livingSituation',
    'activityLevel',
    'timeAvailability',
    'budgetRange',
    'allergyFriendly',
    'openToSpecialNeeds',
    'hasChildren',
    'hasOtherPets',
    'trainingPreference',
    'groomingPreference',
    'exercisePreference',
    'socialPreference',
    'independencePreference',
    'medicalCarePreference',
    'patienceLevel',
    'travelFrequency',
    'workSchedule',
    'homeEnvironment',
    'hasYard',
    'climate',
    'commitmentLevel',
  ];
  let completed = 0;
  for (const f of requiredFields) {
    if (r[f] !== undefined && r[f] !== null && r[f] !== 'any') completed++;
  }
  return Math.round((completed / requiredFields.length) * 100);
};

userProfileSchema.methods.getMatchingPreferences = function () {
  // Return a clean object with only the matching preferences
  const { requirements } = this;
  return {
    petType: requirements.petType,
    gender: requirements.gender,
    size: requirements.size,
    age: requirements.age,
    experienceLevel: requirements.experienceLevel,
    livingSituation: requirements.livingSituation,
    activityLevel: requirements.activityLevel,
    allergyFriendly: requirements.allergyFriendly,
    openToSpecialNeeds: requirements.openToSpecialNeeds,
    hasChildren: requirements.hasChildren,
    hasOtherPets: requirements.hasOtherPets,
    trainingPreference: requirements.trainingPreference,
    groomingPreference: requirements.groomingPreference,
    exercisePreference: requirements.exercisePreference,
    socialPreference: requirements.socialPreference,
    independencePreference: requirements.independencePreference,
    medicalCarePreference: requirements.medicalCarePreference,
    patienceLevel: requirements.patienceLevel,
    hasYard: requirements.hasYard,
    preferredBreeds: requirements.preferredBreeds,
    dealBreakers: requirements.dealBreakers,
  };
};

userProfileSchema.methods.validateRequirements = function () {
  const errors = [];
  const r = this.requirements || {};
  if (!r.petType || r.petType === 'any') errors.push('Pet type is required');
  if (!r.experienceLevel) errors.push('Experience level is required');
  if (!r.livingSituation) errors.push('Living situation is required');

  if (r.hasChildren && r.childrenAgeRange) {
    if (r.childrenAgeRange.min > r.childrenAgeRange.max) {
      errors.push('Children age range is invalid');
    }
  }
  if (r.hasYard && r.yardSize === 'none') {
    errors.push('Yard size cannot be none if hasYard is true');
  }

  return { isValid: errors.length === 0, errors };
};

// Suggestions when adding viewedPets / favoritePets in service:
// await UserProfile.updateOne({ _id: uid }, { $addToSet: { viewedPets: petId } })
// await UserProfile.updateOne({ _id: uid }, { $addToSet: { favoritePets: petId } })

userProfileSchema.methods.calculatePetCompatibility = function (pet) {
  let score = 0;
  const maxScore = 100;
  const { requirements } = this;

  // Basic matching (30 points)
  if (requirements.petType && pet.type === requirements.petType) score += 10;
  if (requirements.gender && pet.gender === requirements.gender) score += 5;
  if (requirements.size && pet.size === requirements.size) score += 5;
  if (requirements.age && pet.age === requirements.age) score += 10;

  // Experience level matching (20 points)
  if (
    requirements.experienceLevel === 'first-time' &&
    pet.experience?.suitableForFirstTimeOwners
  ) {
    score += 20;
  } else if (
    requirements.experienceLevel === 'experienced' &&
    pet.experience?.trainingRequired !== 'advanced'
  ) {
    score += 15;
  } else if (requirements.experienceLevel === 'expert') {
    score += 20;
  }

  // Living situation compatibility (15 points)
  if (
    requirements.livingSituation === 'apartment' &&
    pet.lifestyle?.apartmentFriendly
  ) {
    score += 15;
  } else if (
    requirements.livingSituation === 'house' &&
    pet.lifestyle?.requiresYard
  ) {
    score += 15;
  } else if (
    requirements.livingSituation === 'house' &&
    !pet.lifestyle?.requiresYard
  ) {
    score += 10;
  }

  // Lifestyle compatibility (15 points)
  if (
    requirements.activityLevel &&
    pet.lifestyle?.energyLevel === requirements.activityLevel
  ) {
    score += 10;
  }
  if (
    requirements.socialPreference &&
    pet.lifestyle?.socialNeeds === requirements.socialPreference
  ) {
    score += 5;
  }

  // Care requirements (10 points)
  if (
    requirements.groomingPreference &&
    pet.care?.groomingNeeds === requirements.groomingPreference
  ) {
    score += 5;
  }
  if (
    requirements.exercisePreference &&
    pet.care?.exerciseNeeds === requirements.exercisePreference
  ) {
    score += 5;
  }

  // Allergy considerations (10 points)
  if (requirements.allergyFriendly && pet.allergies?.hypoallergenic) {
    score += 10;
  }

  // Special needs (10 points)
  if (requirements.openToSpecialNeeds === pet.attributes?.specialNeeds) {
    score += 10;
  }

  // Deal breakers (negative points)
  if (requirements.dealBreakers && requirements.dealBreakers.length > 0) {
    const dealBreakerMatch = requirements.dealBreakers.some((dealBreaker) => {
      const petDescription =
        `${pet.name} ${pet.breed} ${pet.description}`.toLowerCase();
      return petDescription.includes(dealBreaker.toLowerCase());
    });
    if (dealBreakerMatch) {
      score -= 50; // Significant penalty for deal breakers
    }
  }

  // Breed preferences (bonus points)
  if (requirements.preferredBreeds && requirements.preferredBreeds.length > 0) {
    const breedMatch = requirements.preferredBreeds.some((preferredBreed) =>
      pet.breed.toLowerCase().includes(preferredBreed.toLowerCase())
    );
    if (breedMatch) {
      score += 15; // Bonus for preferred breeds
    }
  }

  return Math.max(0, Math.min(score, maxScore));
};

// Create base User model
export const User = mongoose.model('User', userSchema);

// Static methods for user requirements
User.findByRequirements = function (requirements, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'requirements.completionPercentage',
    sortOrder = 'desc',
    role = 'user',
  } = options;

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  // Build query based on requirements - ensure role filter is always applied
  const query = { role };

  // Add requirements filters only if requirements object exists
  if (requirements) {
    if (requirements.petType) {
      query['requirements.petType'] = requirements.petType;
    }

    if (requirements.experienceLevel) {
      query['requirements.experienceLevel'] = requirements.experienceLevel;
    }

    if (requirements.livingSituation) {
      query['requirements.livingSituation'] = requirements.livingSituation;
    }

    if (requirements.allergyFriendly !== undefined) {
      query['requirements.allergyFriendly'] = requirements.allergyFriendly;
    }

    if (requirements.openToSpecialNeeds !== undefined) {
      query['requirements.openToSpecialNeeds'] =
        requirements.openToSpecialNeeds;
    }
  }

  return this.find(query).sort(sort).skip(skip).limit(limit);
};

User.findUsersWithCompleteRequirements = function (options = {}) {
  const { page = 1, limit = 20, minCompletion = 70, role = 'user' } = options;

  const skip = (page - 1) * limit;

  // Ensure role filter is always applied and requirements exist
  const query = {
    role,
    'requirements.completionPercentage': { $gte: minCompletion },
    requirements: { $exists: true, $ne: null },
  };

  return this.find(query)
    .sort({ 'requirements.completionPercentage': -1 })
    .skip(skip)
    .limit(limit);
};

User.getRequirementsStats = async function () {
  const stats = await this.aggregate([
    {
      $match: {
        role: 'user',
        requirements: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        avgCompletion: { $avg: '$requirements.completionPercentage' },
        highPriority: {
          $sum: {
            $cond: [{ $gte: ['$requirements.completionPercentage', 90] }, 1, 0],
          },
        },
        mediumPriority: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$requirements.completionPercentage', 70] },
                  { $lt: ['$requirements.completionPercentage', 90] },
                ],
              },
              1,
              0,
            ],
          },
        },
        lowPriority: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$requirements.completionPercentage', 50] },
                  { $lt: ['$requirements.completionPercentage', 70] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalUsers: 0,
      avgCompletion: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
    }
  );
};

// Create discriminator models
export const UserProfile = User.discriminator('user', userProfileSchema);
export const Shelter = User.discriminator('shelter', shelterSchema);
export const Admin = User.discriminator('admin', adminSchema);
