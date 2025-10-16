import mongoose from 'mongoose';
import logger from '../../utils/logger.js';
import { petSchema as petValidationSchema } from './pet.validation.js';
import slugify from 'slugify';

const petSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    slug: String,
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: ['dog', 'cat', 'bird', 'other'],
    },
    species: {
      type: String,
      required: [true, 'Species is required'],
      trim: true,
    },
    breed: {
      type: String,
      required: [true, 'Breed is required'],
    },
    age: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Age is required'],
      validate: {
        validator: function (value) {
          if (typeof value === 'number') {
            return value >= 0 && value <= 30;
          }
          if (typeof value === 'string') {
            return ['baby', 'young', 'adult', 'senior'].includes(value);
          }
          return false;
        },
        message:
          'Age must be a number (0-30) or one of: baby, young, adult, senior',
      },
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['male', 'female', 'unknown'],
    },
    size: {
      type: String,
      required: [true, 'Size is required'],
      enum: ['small', 'medium', 'large'],
    },
    coat: {
      type: String,
      enum: ['short', 'medium', 'long', 'wire', 'curly', 'smooth', 'rough'],
    },
    primaryColor: {
      type: String,
      required: [true, 'Primary color is required'],
    },
    secondaryColor: {
      type: String,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    photos: {
      type: [
        {
          _id: String,
          url: {
            type: String,
            required: false,
            validate: {
              validator: function (url) {
                if (!url) return true; // Allow empty URLs

                // Basic URL format validation
                const urlPattern = /^https?:\/\/.+/;
                if (!urlPattern.test(url)) {
                  return false;
                }

                // Special case: Allow Petfinder URLs (cloudfront.net/photos/pets/ or cloudfront.net/animal/) without file extensions
                if (
                  url.includes('cloudfront.net/photos/pets/') ||
                  url.includes('cloudfront.net/animal/')
                ) {
                  // Check URL length (reasonable limit)
                  if (url.length > 2048) {
                    return false;
                  }
                  return true;
                }

                // Special case: Allow picsum.photos URLs without file extensions (for testing/development)
                if (url.includes('picsum.photos')) {
                  // Check URL length (reasonable limit)
                  if (url.length > 2048) {
                    return false;
                  }
                  return true;
                }

                // Special case: Allow localhost upload URLs for development
                if (url.includes('localhost') && url.includes('/uploads/')) {
                  // Check URL length (reasonable limit)
                  if (url.length > 2048) {
                    return false;
                  }
                  return true;
                }

                // Special case: Allow Cloudinary URLs
                if (
                  url.includes('cloudinary.com') ||
                  url.includes('res.cloudinary.com')
                ) {
                  // Check URL length (reasonable limit)
                  if (url.length > 2048) {
                    return false;
                  }
                  return true;
                }

                // Check for common image file extensions for non-Petfinder URLs
                const imageExtensions =
                  /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i;
                if (!imageExtensions.test(url)) {
                  return false;
                }

                // Check URL length (reasonable limit)
                if (url.length > 2048) {
                  return false;
                }

                return true;
              },
              message:
                'URL must be a valid image URL (https:// or http://) with image extension (.jpg, .png, .gif, etc.) or a valid Petfinder URL (cloudfront.net/photos/pets/ or cloudfront.net/animal/), and less than 2048 characters',
            },
          },
          small: String,
          medium: String,
          large: String,
          full: String,
          caption: String,
        },
      ],
      default: [],
    },

    status: {
      type: String,
      required: true,
      enum: [
        'adoptable',
        'pending',
        'adopted',
        'hidden',
        'waiting',
        'in_treatment',
        'fostered',
        'flagged',
        'rejected',
      ],
      default: 'adoptable',
      validate: {
        validator: function (status) {
          // Admin-only statuses that require special permissions
          const adminOnlyStatuses = ['flagged', 'rejected'];

          // If this is a new document, validation will be handled in pre-save
          if (this.isNew) {
            return true;
          }

          // For updates, check if status change requires admin privileges
          if (adminOnlyStatuses.includes(status)) {
            // This validation will be handled in the service layer with proper role checking
            // The actual role validation should be done in the controller/service
            return true;
          }

          return true;
        },
        message: 'Status change requires appropriate permissions',
      },
    },
    // Approval field for admin management
    isApproved: {
      type: Boolean,
      default: true, // Default to approved for script-created pets
    },
    shelter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // References User model, but can be populated with Shelter discriminator
      required: true,
      validate: {
        validator: async function (shelterId) {
          if (!shelterId) return false;

          try {
            // Check if the referenced user is actually a shelter
            const shelter = await mongoose.model('User').findById(shelterId);
            return shelter && shelter.role === 'shelter';
          } catch (error) {
            return false;
          }
        },
        message: 'Shelter must reference a valid shelter user',
      },
    },
    health: {
      vaccinated: {
        type: Boolean,
        default: false,
      },
      neutered: {
        type: Boolean,
        default: false,
      },
      medicalHistory: [
        {
          condition: String,
          treatment: String,
          date: Date,
        },
      ],
    },
    behavior: {
      goodWith: [
        {
          type: String,
          enum: ['dogs', 'cats', 'children', 'other'],
        },
      ],
      activityLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
      },
      training: [
        {
          type: String,
          enum: [
            'leash-trained',
            'obedience-trained',
            'house-trained',
            'crate-trained',
            'potty-trained',
          ],
        },
      ],
      // Enhanced behavior fields for AI matching
      crateTrained: {
        type: Boolean,
        default: false,
      },
      leashTrained: {
        type: Boolean,
        default: false,
      },
      houseTrained: {
        type: Boolean,
        default: false,
      },
      obedienceTrained: {
        type: Boolean,
        default: false,
      },
      pottyTrained: {
        type: Boolean,
        default: false,
      },
      // Additional behavior insights for AI matching
      socialWithStrangers: {
        type: Boolean,
        default: false,
      },
      goodWithOtherPets: {
        type: Boolean,
        default: false,
      },
      needsExercise: {
        type: Boolean,
        default: false,
      },
      independent: {
        type: Boolean,
        default: false,
      },
      affectionate: {
        type: Boolean,
        default: false,
      },
      protective: {
        type: Boolean,
        default: false,
      },
    },
    // Enhanced fields for better pet recommendations
    lifestyle: {
      energyLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      independenceLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      socialNeeds: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      apartmentFriendly: {
        type: Boolean,
        default: true,
      },
      requiresYard: {
        type: Boolean,
        default: false,
      },
    },
    care: {
      groomingNeeds: {
        type: String,
        enum: ['minimal', 'moderate', 'high'],
        default: 'moderate',
      },
      exerciseNeeds: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      attentionNeeds: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      medicalCareLevel: {
        type: String,
        enum: ['basic', 'moderate', 'advanced'],
        default: 'basic',
      },
    },
    experience: {
      suitableForFirstTimeOwners: {
        type: Boolean,
        default: true,
      },
      trainingRequired: {
        type: String,
        enum: ['none', 'basic', 'advanced'],
        default: 'basic',
      },
      patienceRequired: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
    },
    allergies: {
      hypoallergenic: {
        type: Boolean,
        default: false,
      },
      sheddingLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
      danderLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
    },
    attributes: {
      houseTrained: {
        type: Boolean,
        default: false,
      },
      specialNeeds: {
        type: Boolean,
        default: false,
      },
      declawed: {
        type: Boolean,
        default: false,
      },
      spayedNeutered: {
        type: Boolean,
        default: false,
      },
      shotsCurrent: {
        type: Boolean,
        default: false,
      },
      // Enhanced training attributes for AI matching
      leashTrained: {
        type: Boolean,
        default: false,
      },
      crateTrained: {
        type: Boolean,
        default: false,
      },
      obedienceTrained: {
        type: Boolean,
        default: false,
      },
      pottyTrained: {
        type: Boolean,
        default: false,
      },
      microchipped: {
        type: Boolean,
        default: false,
      },
    },
    tags: [
      {
        type: String,
        enum: [
          'Cute',
          'Friendly',
          'Playful',
          'Calm',
          'Energetic',
          'Gentle',
          'Loving',
          'Smart',
          'Quiet',
          'Active',
          'Independent',
          'Social',
          'Protective',
          'Curious',
          'Affectionate',
          'Loyal',
          'Patient',
          'Adventurous',
          'Relaxed',
          'Cheerful',
        ],
      },
    ],

    views: {
      type: Number,
      default: 0,
    },
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    adoptionRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdoptionRequest',
      },
    ],
    metadata: {
      externalId: String,
      source: String,
      organizationId: String,
      originalUrl: String,
      lastUpdated: Date,
    },
    healthRecords: [
      {
        condition: String,
        treatment: String,
        date: {
          type: Date,
          default: Date.now,
        },
        veterinarian: String,
        notes: String,
        severity: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium',
        },
      },
    ],
    behaviorRecords: [
      {
        behavior: String,
        description: String,
        date: {
          type: Date,
          default: Date.now,
        },
        observedBy: String,
        notes: String,
        type: {
          type: String,
          enum: ['positive', 'negative', 'neutral'],
          default: 'neutral',
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

// Create indexes
petSchema.index({ name: 'text', description: 'text' });
petSchema.index({ type: 1 });
petSchema.index({ breed: 1 });
petSchema.index({ status: 1 });
petSchema.index({ shelter: 1 });
petSchema.index({ views: -1 });
petSchema.index({ slug: 1 }, { unique: true, sparse: true });

// Enhanced recommendation indexes
petSchema.index({ 'lifestyle.energyLevel': 1 });
petSchema.index({ 'lifestyle.independenceLevel': 1 });
petSchema.index({ 'lifestyle.socialNeeds': 1 });
petSchema.index({ 'lifestyle.apartmentFriendly': 1 });
petSchema.index({ 'care.groomingNeeds': 1 });
petSchema.index({ 'care.exerciseNeeds': 1 });
petSchema.index({ 'experience.suitableForFirstTimeOwners': 1 });
petSchema.index({ 'allergies.hypoallergenic': 1 });
petSchema.index({ 'allergies.sheddingLevel': 1 });
petSchema.index({ age: 1, size: 1, type: 1 }); // Compound index for common queries
petSchema.index({ 'behavior.activityLevel': 1, 'lifestyle.energyLevel': 1 }); // Compound index for energy matching

// Add Joi validation middleware
petSchema.pre('validate', async function (next) {
  try {
    // Import sanitization function
    const { sanitizePetDataForValidation } = await import(
      '../../utils/petSanitizer.js'
    );

    // Convert ObjectId to string for validation and remove MongoDB-specific fields
    const petData = this.toObject();

    // Sanitize the data before validation to ensure only valid fields are included
    const dataToValidate = sanitizePetDataForValidation(petData);

    await petValidationSchema.validateAsync(dataToValidate, {
      abortEarly: false,
      stripUnknown: { objects: true, arrays: true },
    });
    next();
  } catch (error) {
    next(error);
  }
});

// Add validation error handling
petSchema.post('save', function (error, doc, next) {
  if (error.name === 'ValidationError') {
    logger.error('Validation error saving pet:', error);
    next(new Error('Validation failed: ' + error.message));
  } else if (error.code === 11000) {
    // Handle duplicate key errors (including slug duplicates)
    logger.error('Duplicate key error saving pet:', error);

    if (error.keyPattern && error.keyPattern.slug) {
      next(
        new Error(
          'A pet with this name already exists. Please choose a different name.'
        )
      );
    } else {
      next(new Error('Pet with this external ID already exists'));
    }
  } else {
    next(error);
  }
});

/**
 * Pre-save middleware for slug generation
 *
 * This middleware ensures unique slugs by:
 * 1. Generating a base slug from the pet name
 * 2. Checking for existing slugs with the same name
 * 3. Adding numeric suffixes (1, 2, 3...) if duplicates exist
 * 4. Using ObjectId suffix as fallback if too many duplicates
 *
 * Examples:
 * - "Max" -> "max"
 * - "Max" (second pet) -> "max-1"
 * - "Max" (third pet) -> "max-2"
 * - "Max" (100th pet) -> "max-abc123" (ObjectId suffix)
 */
petSchema.pre('save', async function (next) {
  try {
    // Only generate slug if it doesn't exist or if name has changed
    if (!this.slug || this.isModified('name')) {
      const baseSlug = slugify(this.name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
      });

      // Check if slug already exists
      let finalSlug = baseSlug;
      let counter = 1;

      // Keep checking until we find a unique slug
      while (true) {
        const existingPet = await this.constructor.findOne({
          slug: finalSlug,
          _id: { $ne: this._id }, // Exclude current pet if updating
        });

        if (!existingPet) {
          break; // Slug is unique
        }

        // If slug exists, try with counter suffix
        finalSlug = `${baseSlug}-${counter}`;
        counter++;

        // If counter gets too high, use ObjectId as fallback
        if (counter > 100) {
          const objectIdSuffix = this._id
            ? this._id.toString().slice(-6)
            : Date.now().toString(36);
          finalSlug = `${baseSlug}-${objectIdSuffix}`;
          break;
        }
      }

      this.slug = finalSlug;
    }
    next();
  } catch (error) {
    logger.error('Error generating slug:', error);
    // Fallback to simple slug with ObjectId if error occurs
    const baseSlug = slugify(this.name, { lower: true });
    const objectIdSuffix = this._id
      ? this._id.toString().slice(-6)
      : Date.now().toString(36);
    this.slug = `${baseSlug}-${objectIdSuffix}`;
    next();
  }
});

// Methods
petSchema.methods.incrementViews = async function () {
  this.views += 1;
  return this.save();
};

petSchema.methods.addHealthRecord = async function (record) {
  this.healthRecords.push(record);
  return this.save();
};

petSchema.methods.addBehaviorRecord = async function (record) {
  this.behaviorRecords.push(record);
  return this.save();
};

petSchema.methods.updateStatus = async function (status) {
  this.status = status;
  return this.save();
};

// Virtual populate for shelter data
petSchema.virtual('shelterData', {
  ref: 'User',
  localField: 'shelter',
  foreignField: '_id',
  justOne: true,
  options: { match: { role: 'shelter' } },
});

// Virtual fields for recommendation scoring
petSchema.virtual('recommendationScore').get(function () {
  // This will be calculated dynamically based on user preferences
  return 0; // Default score
});

// Virtual field for lifestyle summary
petSchema.virtual('lifestyleSummary').get(function () {
  const summary = [];

  if (this.lifestyle?.energyLevel) {
    summary.push(`${this.lifestyle.energyLevel} energy`);
  }
  if (this.lifestyle?.independenceLevel) {
    summary.push(`${this.lifestyle.independenceLevel} independence`);
  }
  if (this.lifestyle?.socialNeeds) {
    summary.push(`${this.lifestyle.socialNeeds} social needs`);
  }

  return summary.join(', ') || 'Standard lifestyle';
});

// Virtual field for care summary
petSchema.virtual('careSummary').get(function () {
  const summary = [];

  if (this.care?.groomingNeeds) {
    summary.push(`${this.care.groomingNeeds} grooming`);
  }
  if (this.care?.exerciseNeeds) {
    summary.push(`${this.care.exerciseNeeds} exercise`);
  }
  if (this.care?.attentionNeeds) {
    summary.push(`${this.care.attentionNeeds} attention`);
  }

  return summary.join(', ') || 'Standard care';
});

// Virtual field for allergy friendliness
petSchema.virtual('allergyFriendliness').get(function () {
  if (this.allergies?.hypoallergenic) {
    return 'Hypoallergenic';
  }
  if (
    this.allergies?.sheddingLevel === 'low' &&
    this.allergies?.danderLevel === 'low'
  ) {
    return 'Allergy-friendly';
  }
  if (
    this.allergies?.sheddingLevel === 'medium' &&
    this.allergies?.danderLevel === 'medium'
  ) {
    return 'Moderately allergy-friendly';
  }
  return 'Standard';
});

// Static methods with enhanced query capabilities
petSchema.statics.generateUniqueSlug = async function (name, excludeId = null) {
  const baseSlug = slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });

  let finalSlug = baseSlug;
  let counter = 1;

  // Keep checking until we find a unique slug
  while (true) {
    const query = { slug: finalSlug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingPet = await this.findOne(query);

    if (!existingPet) {
      break; // Slug is unique
    }

    // If slug exists, try with counter suffix
    finalSlug = `${baseSlug}-${counter}`;
    counter++;

    // If counter gets too high, use timestamp as fallback
    if (counter > 100) {
      const timestampSuffix = Date.now().toString(36);
      finalSlug = `${baseSlug}-${timestampSuffix}`;
      break;
    }
  }

  return finalSlug;
};

petSchema.statics.findBySlug = async function (slug) {
  return this.findOne({ slug }).populate('shelter', 'name location');
};

/**
 * Find pets by shelter with pagination and filtering
 * @param {string} shelterId - The shelter ID
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {Object} options.filters - Additional filters
 * @param {string} options.sortBy - Sort field (default: 'createdAt')
 * @param {string} options.sortOrder - Sort order 'asc' or 'desc' (default: 'desc')
 * @param {boolean} options.populateShelter - Whether to populate shelter data (default: true)
 * @returns {Promise<Object>} - Object with pets and pagination info
 *
 * @example
 * // Basic usage
 * const result = await Pet.findByShelter('shelterId123');
 *
 * // With pagination and filtering
 * const result = await Pet.findByShelter('shelterId123', {
 *   page: 2,
 *   limit: 20,
 *   filters: { status: 'adoptable', type: 'dog' },
 *   sortBy: 'name',
 *   sortOrder: 'asc'
 * });
 *
 * // Result structure:
 * {
 *   pets: [...],
 *   pagination: {
 *     page: 2,
 *     limit: 20,
 *     total: 150,
 *     pages: 8,
 *     hasNext: true,
 *     hasPrev: true
 *   }
 * }
 */
petSchema.statics.findByShelter = async function (shelterId, options = {}) {
  const {
    page = 1,
    limit = 10,
    filters = {},
    sortBy = 'createdAt',
    sortOrder = 'desc',
    populateShelter = true,
  } = options;

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const query = { shelter: shelterId, ...filters };

  const [pets, total] = await Promise.all([
    this.find(query)
      .populate(
        populateShelter ? 'shelter' : '',
        'name location phone website bio rating'
      )
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return {
    pets,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

/**
 * Find pets by shelter with detailed shelter information
 * @param {string} shelterId - The shelter ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Object with pets and pagination info
 */
petSchema.statics.findByShelterWithDetails = async function (
  shelterId,
  options = {}
) {
  const {
    page = 1,
    limit = 10,
    filters = {},
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const query = { shelter: shelterId, ...filters };

  const [pets, total] = await Promise.all([
    this.find(query)
      .populate({
        path: 'shelter',
        select:
          'name location phone website bio rating operatingHours adoptionProcess requirements photos',
        match: { role: 'shelter' },
      })
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return {
    pets,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

/**
 * Find available pets with advanced filtering and pagination
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Object with pets and pagination info
 */
petSchema.statics.findAvailable = async function (filters = {}, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    populateShelter = true,
    search = null,
    location = null,
    ageRange = null,
  } = options;

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  // Build query with advanced filters
  const query = { status: 'adoptable', ...filters };

  // Text search
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { breed: { $regex: search, $options: 'i' } },
    ];
  }

  // Age range filter
  if (ageRange) {
    if (typeof ageRange.min === 'number' && typeof ageRange.max === 'number') {
      query.age = { $gte: ageRange.min, $lte: ageRange.max };
    }
  }

  const [pets, total] = await Promise.all([
    this.find(query)
      .populate(populateShelter ? 'shelter' : '', 'name location')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return {
    pets,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

/**
 * Find pets by characteristics with advanced filtering
 * @param {Object} characteristics - Pet characteristics
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Object with pets and pagination info
 */
petSchema.statics.findByCharacteristics = async function (
  characteristics,
  options = {}
) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    populateShelter = true,
  } = options;

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const query = { status: 'adoptable', ...characteristics };

  const [pets, total] = await Promise.all([
    this.find(query)
      .populate(populateShelter ? 'shelter' : '', 'name location')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return {
    pets,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

/**
 * Advanced search with multiple criteria
 * @param {Object} searchCriteria - Search criteria
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Object with pets and pagination info
 *
 * @example
 * // Basic search
 * const result = await Pet.advancedSearch({
 *   type: 'dog',
 *   search: 'golden retriever'
 * });
 *
 * // Complex search with multiple criteria
 * const result = await Pet.advancedSearch({
 *   type: 'dog',
 *   gender: 'male',
 *   size: 'large',
 *   search: 'friendly family dog',
 *   vaccinated: true,
 *   neutered: true,
 *   goodWith: ['children', 'dogs']
 * }, {
 *   page: 1,
 *   limit: 20,
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc'
 * });
 *
 * // Search criteria options:
 * // - type: 'dog' | 'cat' | 'bird' | 'other'
 * // - gender: 'male' | 'female' | 'unknown'
 * // - size: 'small' | 'medium' | 'large'
 * // - search: text search across name, description, breed
 * // - vaccinated: boolean
 * // - neutered: boolean
 * // - goodWith: array of ['dogs', 'cats', 'children', 'other']
 */
petSchema.statics.advancedSearch = async function (
  searchCriteria,
  options = {}
) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    populateShelter = true,
  } = options;

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  // Build complex query
  const query = { status: 'adoptable' };

  // Basic filters
  if (searchCriteria.type) query.type = searchCriteria.type;
  if (searchCriteria.breed)
    query.breed = { $regex: searchCriteria.breed, $options: 'i' };
  if (searchCriteria.gender) query.gender = searchCriteria.gender;
  if (searchCriteria.size) query.size = searchCriteria.size;
  if (searchCriteria.age) query.age = searchCriteria.age;

  // Text search
  if (searchCriteria.search) {
    query.$or = [
      { name: { $regex: searchCriteria.search, $options: 'i' } },
      { description: { $regex: searchCriteria.search, $options: 'i' } },
      { breed: { $regex: searchCriteria.search, $options: 'i' } },
    ];
  }

  // Health filters
  if (searchCriteria.vaccinated !== undefined)
    query['health.vaccinated'] = searchCriteria.vaccinated;
  if (searchCriteria.neutered !== undefined)
    query['health.neutered'] = searchCriteria.neutered;

  // Behavior filters
  if (searchCriteria.goodWith) {
    query['behavior.goodWith'] = {
      $in: Array.isArray(searchCriteria.goodWith)
        ? searchCriteria.goodWith
        : [searchCriteria.goodWith],
    };
  }

  const [pets, total] = await Promise.all([
    this.find(query)
      .populate(
        populateShelter ? 'shelter' : '',
        'name location phone website bio rating'
      )
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return {
    pets,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

petSchema.statics.validateShelterRelationship = async function (
  petId,
  shelterId
) {
  try {
    const pet = await this.findById(petId);
    if (!pet) {
      return { valid: false, error: 'Pet not found' };
    }

    const shelter = await mongoose.model('User').findById(shelterId);
    if (!shelter || shelter.role !== 'shelter') {
      return { valid: false, error: 'Invalid shelter reference' };
    }

    if (pet.shelter.toString() !== shelterId.toString()) {
      return { valid: false, error: 'Pet does not belong to this shelter' };
    }

    return { valid: true, pet, shelter };
  } catch (error) {
    return { valid: false, error: 'Validation error' };
  }
};

/**
 * Find pets based on user preferences for recommendations
 * @param {Object} userPreferences - User's adoption preferences
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of pets with recommendation scores
 */
petSchema.statics.findRecommendations = async function (
  userPreferences,
  options = {}
) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'recommendationScore',
    sortOrder = 'desc',
    populateShelter = true,
  } = options;

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  // Build recommendation query
  const query = { status: 'adoptable' };

  // Basic preference filters
  if (userPreferences.type) query.type = userPreferences.type;
  if (userPreferences.gender) query.gender = userPreferences.gender;
  if (userPreferences.size) query.size = userPreferences.size;
  if (userPreferences.age) query.age = userPreferences.age;

  // Experience level filter
  if (userPreferences.experienceLevel === 'first-time') {
    query['experience.suitableForFirstTimeOwners'] = true;
  }

  // Living situation filters
  if (userPreferences.livingSituation === 'apartment') {
    query['lifestyle.apartmentFriendly'] = true;
  }

  // Allergy filters
  if (userPreferences.allergyFriendly) {
    query['allergies.hypoallergenic'] = true;
  }

  // Energy level matching
  if (userPreferences.activityLevel) {
    query['lifestyle.energyLevel'] = userPreferences.activityLevel;
  }

  // Special needs filter
  if (userPreferences.openToSpecialNeeds !== undefined) {
    query.attributes = query.attributes || {};
    query.attributes.specialNeeds = userPreferences.openToSpecialNeeds;
  }

  const pets = await this.find(query)
    .populate(
      populateShelter ? 'shelter' : '',
      'name location phone website bio rating'
    )
    .sort(sort)
    .skip(skip)
    .limit(limit);

  // Calculate recommendation scores and sort
  const petsWithScores = pets.map((pet) => {
    const score = calculateRecommendationScore(pet, userPreferences);
    return { ...pet.toObject(), recommendationScore: score };
  });

  // Sort by recommendation score
  petsWithScores.sort((a, b) => b.recommendationScore - a.recommendationScore);

  return petsWithScores;
};

/**
 * Calculate recommendation score based on user preferences
 * @param {Object} pet - Pet document
 * @param {Object} userPreferences - User's preferences
 * @returns {number} - Recommendation score (0-100)
 */
function calculateRecommendationScore(pet, userPreferences) {
  let score = 0;
  const maxScore = 100;

  // Basic matching (40 points)
  if (pet.type === userPreferences.type) score += 10;
  if (pet.gender === userPreferences.gender) score += 10;
  if (pet.size === userPreferences.size) score += 10;
  if (pet.age === userPreferences.age) score += 10;

  // Experience level (20 points)
  if (
    userPreferences.experienceLevel === 'first-time' &&
    pet.experience?.suitableForFirstTimeOwners
  ) {
    score += 20;
  }

  // Lifestyle compatibility (20 points)
  if (
    userPreferences.livingSituation === 'apartment' &&
    pet.lifestyle?.apartmentFriendly
  ) {
    score += 10;
  }
  if (
    userPreferences.activityLevel &&
    pet.lifestyle?.energyLevel === userPreferences.activityLevel
  ) {
    score += 10;
  }

  // Allergy considerations (10 points)
  if (userPreferences.allergyFriendly && pet.allergies?.hypoallergenic) {
    score += 10;
  }

  // Special needs (10 points)
  if (userPreferences.openToSpecialNeeds === pet.attributes?.specialNeeds) {
    score += 10;
  }

  return Math.min(score, maxScore);
}

/**
 * Find pets by lifestyle characteristics
 * @param {Object} lifestyleCriteria - Lifestyle preferences
 * @returns {Promise<Array>} - Array of matching pets
 */
petSchema.statics.findByLifestyle = async function (lifestyleCriteria) {
  const query = { status: 'adoptable' };

  if (lifestyleCriteria.energyLevel) {
    query['lifestyle.energyLevel'] = lifestyleCriteria.energyLevel;
  }
  if (lifestyleCriteria.independenceLevel) {
    query['lifestyle.independenceLevel'] = lifestyleCriteria.independenceLevel;
  }
  if (lifestyleCriteria.socialNeeds) {
    query['lifestyle.socialNeeds'] = lifestyleCriteria.socialNeeds;
  }
  if (lifestyleCriteria.apartmentFriendly !== undefined) {
    query['lifestyle.apartmentFriendly'] = lifestyleCriteria.apartmentFriendly;
  }

  return this.find(query).populate('shelter', 'name location');
};

/**
 * Find pets by care requirements
 * @param {Object} careCriteria - Care preferences
 * @returns {Promise<Array>} - Array of matching pets
 */
petSchema.statics.findByCareRequirements = async function (careCriteria) {
  const query = { status: 'adoptable' };

  if (careCriteria.groomingNeeds) {
    query['care.groomingNeeds'] = careCriteria.groomingNeeds;
  }
  if (careCriteria.exerciseNeeds) {
    query['care.exerciseNeeds'] = careCriteria.exerciseNeeds;
  }
  if (careCriteria.attentionNeeds) {
    query['care.attentionNeeds'] = careCriteria.attentionNeeds;
  }
  if (careCriteria.medicalCareLevel) {
    query['care.medicalCareLevel'] = careCriteria.medicalCareLevel;
  }

  return this.find(query).populate('shelter', 'name location');
};

// Create and export the model
const Pet = mongoose.model('Pet', petSchema);

export { Pet };
