import mongoose from 'mongoose';
import { HOUSING_TYPES } from '../../constants/adoptionStatuses.js';

/**
 * Application Details Schema
 * Contains all the details submitted by the adopter during the adoption application process
 */
const applicationDetailsSchema = new mongoose.Schema(
  {
    // Housing Information
    housingType: {
      type: String,
      enum: HOUSING_TYPES,
      required: true,
    },
    hasYard: {
      type: Boolean,
      default: false,
    },
    yardDetails: {
      isFenced: {
        type: Boolean,
        default: false,
      },
      size: String,
    },

    // Pet Experience
    hasOtherPets: {
      type: Boolean,
      default: false,
    },
    otherPetsDetails: [
      {
        type: {
          type: String,
          required: true,
        },
        species: {
          type: String,
          required: true,
        },
        age: {
          type: Number,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],

    // Family Information
    hasChildren: {
      type: Boolean,
      default: false,
    },
    childrenAges: [Number],

    // Lifestyle Information
    workSchedule: {
      type: String,
      required: true,
    },
    experience: String,

    // Adoption Motivation
    reasonForAdopting: {
      type: String,
      required: true,
    },
    plannedCareRoutine: String,

    // Veterinarian Information
    veterinarianInfo: {
      name: {
        type: String,
        required: function () {
          return this.hasOtherPets === true;
        },
      },
      contact: {
        type: String,
        required: function () {
          return this.hasOtherPets === true;
        },
      },
      clinic: {
        type: String,
        required: function () {
          return this.hasOtherPets === true;
        },
      },
    },

    // References
    references: [
      {
        name: {
          type: String,
          required: true,
        },
        relationship: {
          type: String,
          required: true,
        },
        phone: String,
        email: String,
        yearsKnown: Number,
      },
    ],
  },
  {
    _id: false, // Disable _id for subdocuments
    timestamps: false, // Disable timestamps for subdocuments
  }
);

// Add validation methods
applicationDetailsSchema.methods.validateHousingDetails = function () {
  if (this.hasYard && !this.yardDetails) {
    return {
      valid: false,
      error: 'Yard details required when hasYard is true',
    };
  }
  return { valid: true };
};

applicationDetailsSchema.methods.validateOtherPetsDetails = function () {
  if (
    this.hasOtherPets &&
    (!this.otherPetsDetails || this.otherPetsDetails.length === 0)
  ) {
    return {
      valid: false,
      error: 'Other pets details required when hasOtherPets is true',
    };
  }
  return { valid: true };
};

applicationDetailsSchema.methods.validateChildrenAges = function () {
  if (
    this.hasChildren &&
    (!this.childrenAges || this.childrenAges.length === 0)
  ) {
    return {
      valid: false,
      error: 'Children ages required when hasChildren is true',
    };
  }
  return { valid: true };
};

applicationDetailsSchema.methods.validateReferences = function () {
  if (!this.references || this.references.length === 0) {
    return { valid: false, error: 'At least one reference is required' };
  }
  return { valid: true };
};

applicationDetailsSchema.methods.validateVeterinarianInfo = function () {
  if (this.hasOtherPets) {
    if (!this.veterinarianInfo) {
      return {
        valid: false,
        error: 'Veterinarian information required when hasOtherPets is true',
      };
    }

    if (
      !this.veterinarianInfo.name ||
      !this.veterinarianInfo.contact ||
      !this.veterinarianInfo.clinic
    ) {
      return {
        valid: false,
        error:
          'All veterinarian information fields (name, contact, clinic) are required when hasOtherPets is true',
      };
    }
  }
  return { valid: true };
};

// Pre-save middleware to validate the application details
applicationDetailsSchema.pre('save', function (next) {
  const housingValidation = this.validateHousingDetails();
  if (!housingValidation.valid) {
    return next(new Error(housingValidation.error));
  }

  const petsValidation = this.validateOtherPetsDetails();
  if (!petsValidation.valid) {
    return next(new Error(petsValidation.error));
  }

  const childrenValidation = this.validateChildrenAges();
  if (!childrenValidation.valid) {
    return next(new Error(childrenValidation.error));
  }

  const veterinarianValidation = this.validateVeterinarianInfo();
  if (!veterinarianValidation.valid) {
    return next(new Error(veterinarianValidation.error));
  }

  const referencesValidation = this.validateReferences();
  if (!referencesValidation.valid) {
    return next(new Error(referencesValidation.error));
  }

  next();
});

export { applicationDetailsSchema };
