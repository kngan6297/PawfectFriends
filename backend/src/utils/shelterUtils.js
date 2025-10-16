import mongoose from 'mongoose';
import logger from './logger.js';

/**
 * Utility functions for shelter-pet relationships
 *
 * This module provides helper functions to work with the discriminator pattern
 * where Shelter is a discriminator of the User model, and pets reference User
 * but should only reference shelter-type users.
 */

/**
 * Validates if a user ID is actually a shelter
 * @param {string} userId - The user ID to validate
 * @returns {Promise<boolean>} - True if user is a shelter, false otherwise
 */
export async function isShelter(userId) {
  try {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return false;
    }

    const user = await mongoose.model('User').findById(userId);
    return user && user.role === 'shelter';
  } catch (error) {
    logger.error('Error validating shelter:', error);
    return false;
  }
}

/**
 * Gets shelter data with proper population
 * @param {string} shelterId - The shelter ID
 * @param {Object} options - Population options
 * @returns {Promise<Object|null>} - Shelter data or null
 */
export async function getShelterData(shelterId, options = {}) {
  try {
    if (!shelterId || !mongoose.Types.ObjectId.isValid(shelterId)) {
      return null;
    }

    const select =
      options.select ||
      'name location phone website bio rating operatingHours adoptionProcess requirements photos';
    const shelter = await mongoose
      .model('User')
      .findById(shelterId)
      .select(select)
      .where('role', 'shelter');

    return shelter;
  } catch (error) {
    logger.error('Error getting shelter data:', error);
    return null;
  }
}

/**
 * Gets all shelters with basic information
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} - Array of shelter data
 */
export async function getAllShelters(filters = {}) {
  try {
    const query = { role: 'shelter' };

    // Add location filters
    if (filters.city) {
      query['location.city'] = { $regex: filters.city, $options: 'i' };
    }
    if (filters.state) {
      query['location.state'] = { $regex: filters.state, $options: 'i' };
    }
    if (filters.country) {
      query['location.country'] = { $regex: filters.country, $options: 'i' };
    }

    // Add search filter
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { bio: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const shelters = await mongoose
      .model('User')
      .find(query)
      .select('name location phone website bio rating photos')
      .sort({ name: 1 });

    return shelters;
  } catch (error) {
    logger.error('Error getting all shelters:', error);
    return [];
  }
}

/**
 * Validates pet-shelter relationship
 * @param {string} petId - The pet ID
 * @param {string} shelterId - The shelter ID
 * @returns {Promise<Object>} - Validation result
 */
export async function validatePetShelterRelationship(petId, shelterId) {
  try {
    const Pet = mongoose.model('Pet');
    return await Pet.validateShelterRelationship(petId, shelterId);
  } catch (error) {
    logger.error('Error validating pet-shelter relationship:', error);
    return { valid: false, error: 'Validation error' };
  }
}

/**
 * Gets pets with populated shelter data
 * @param {Object} filters - Filter options
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of pets with shelter data
 */
export async function getPetsWithShelterData(filters = {}, options = {}) {
  try {
    const Pet = mongoose.model('Pet');
    const query = Pet.find(filters);

    // Populate shelter data
    query.populate({
      path: 'shelter',
      select: 'name location phone website bio rating',
      match: { role: 'shelter' },
    });

    // Apply sorting
    if (options.sort) {
      query.sort(options.sort);
    }

    // Apply pagination
    if (options.limit) {
      query.limit(options.limit);
    }
    if (options.skip) {
      query.skip(options.skip);
    }

    return await query.exec();
  } catch (error) {
    logger.error('Error getting pets with shelter data:', error);
    return [];
  }
}

/**
 * Migration helper: If you ever need to extract Shelter into a separate model
 * This function helps with the migration process
 */
export async function prepareForShelterMigration() {
  try {
    // Get all shelter users
    const shelters = await mongoose
      .model('User')
      .find({ role: 'shelter' })
      .select(
        '_id name email phone location bio website socialMedia operatingHours adoptionProcess requirements photos rating'
      );

    logger.info(`Found ${shelters.length} shelters for potential migration`);

    // Return data structure that could be used to create separate Shelter model
    return shelters.map((shelter) => ({
      oldId: shelter._id,
      shelterData: {
        name: shelter.name,
        email: shelter.email,
        phone: shelter.phone,
        location: shelter.location,
        bio: shelter.bio,
        website: shelter.website,
        socialMedia: shelter.socialMedia,
        operatingHours: shelter.operatingHours,
        adoptionProcess: shelter.adoptionProcess,
        requirements: shelter.requirements,
        photos: shelter.photos,
        rating: shelter.rating,
        createdAt: shelter.createdAt,
        updatedAt: shelter.updatedAt,
      },
    }));
  } catch (error) {
    logger.error('Error preparing for shelter migration:', error);
    return [];
  }
}

export default {
  isShelter,
  getShelterData,
  getAllShelters,
  validatePetShelterRelationship,
  getPetsWithShelterData,
  prepareForShelterMigration,
};
