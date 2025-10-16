import slugify from 'slugify';
import { Pet } from '../modules/pet/pet.model.js';
import logger from './logger.js';

/**
 * Slug Generator Utility
 * Handles generation of unique slugs for pets with various fallback strategies
 */

/**
 * Generate a base slug from a string
 * @param {string} text - The text to slugify
 * @param {Object} options - Slugify options
 * @returns {string} The base slug
 */
export const generateBaseSlug = (text, options = {}) => {
  const defaultOptions = {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
    ...options,
  };

  return slugify(text, defaultOptions);
};

/**
 * Check if a slug is unique in the database
 * @param {string} slug - The slug to check
 * @param {string} excludeId - ID to exclude from check (for updates)
 * @param {string} modelName - Model name to check against (default: 'Pet')
 * @returns {Promise<boolean>} True if slug is unique
 */
export const isSlugUnique = async (
  slug,
  excludeId = null,
  modelName = 'Pet'
) => {
  try {
    let Model;

    // Dynamically import the model
    switch (modelName.toLowerCase()) {
      case 'pet':
        Model = Pet;
        break;
      // Add other models as needed
      default:
        throw new Error(`Unknown model: ${modelName}`);
    }

    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Model.findOne(query);
    return !existing;
  } catch (error) {
    logger.error('Error checking slug uniqueness:', error);
    return false;
  }
};

/**
 * Generate a unique slug with counter suffix strategy
 * @param {string} baseSlug - The base slug
 * @param {string} excludeId - ID to exclude from check
 * @param {string} modelName - Model name to check against
 * @param {number} maxAttempts - Maximum attempts before using fallback
 * @returns {Promise<string>} Unique slug
 */
export const generateUniqueSlugWithCounter = async (
  baseSlug,
  excludeId = null,
  modelName = 'Pet',
  maxAttempts = 100
) => {
  let finalSlug = baseSlug;
  let counter = 1;

  while (counter <= maxAttempts) {
    const isUnique = await isSlugUnique(finalSlug, excludeId, modelName);

    if (isUnique) {
      return finalSlug;
    }

    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  // If we exceed max attempts, use timestamp fallback
  const timestampSuffix = Date.now().toString(36);
  return `${baseSlug}-${timestampSuffix}`;
};

/**
 * Generate a unique slug with ObjectId suffix strategy
 * @param {string} baseSlug - The base slug
 * @param {string} objectId - ObjectId to use as suffix
 * @returns {string} Unique slug with ObjectId suffix
 */
export const generateSlugWithObjectId = (baseSlug, objectId) => {
  const objectIdSuffix = objectId
    ? objectId.toString().slice(-6)
    : Date.now().toString(36);
  return `${baseSlug}-${objectIdSuffix}`;
};

/**
 * Generate a unique slug with timestamp suffix strategy
 * @param {string} baseSlug - The base slug
 * @returns {string} Unique slug with timestamp suffix
 */
export const generateSlugWithTimestamp = (baseSlug) => {
  const timestampSuffix = Date.now().toString(36);
  return `${baseSlug}-${timestampSuffix}`;
};

/**
 * Generate a unique slug with random suffix strategy
 * @param {string} baseSlug - The base slug
 * @param {number} length - Length of random suffix (default: 6)
 * @returns {string} Unique slug with random suffix
 */
export const generateSlugWithRandomSuffix = (baseSlug, length = 6) => {
  const randomSuffix = Math.random()
    .toString(36)
    .substring(2, 2 + length);
  return `${baseSlug}-${randomSuffix}`;
};

/**
 * Main function to generate a unique slug
 * @param {string} text - The text to create slug from
 * @param {Object} options - Options for slug generation
 * @param {string} options.excludeId - ID to exclude from uniqueness check
 * @param {string} options.modelName - Model name to check against
 * @param {string} options.strategy - Strategy to use for uniqueness ('counter', 'objectid', 'timestamp', 'random')
 * @param {string} options.objectId - ObjectId to use with objectid strategy
 * @param {number} options.maxAttempts - Maximum attempts for counter strategy
 * @returns {Promise<string>} Unique slug
 */
export const generateUniqueSlug = async (text, options = {}) => {
  const {
    excludeId = null,
    modelName = 'Pet',
    strategy = 'counter',
    objectId = null,
    maxAttempts = 100,
  } = options;

  try {
    // Generate base slug
    const baseSlug = generateBaseSlug(text);

    // Check if base slug is already unique
    const isBaseUnique = await isSlugUnique(baseSlug, excludeId, modelName);
    if (isBaseUnique) {
      return baseSlug;
    }

    // Apply strategy based on preference
    switch (strategy) {
      case 'counter':
        return await generateUniqueSlugWithCounter(
          baseSlug,
          excludeId,
          modelName,
          maxAttempts
        );

      case 'objectid':
        return generateSlugWithObjectId(baseSlug, objectId);

      case 'timestamp':
        return generateSlugWithTimestamp(baseSlug);

      case 'random':
        return generateSlugWithRandomSuffix(baseSlug);

      default:
        // Fallback to counter strategy
        return await generateUniqueSlugWithCounter(
          baseSlug,
          excludeId,
          modelName,
          maxAttempts
        );
    }
  } catch (error) {
    logger.error('Error generating unique slug:', error);

    // Fallback to timestamp strategy
    const baseSlug = generateBaseSlug(text);
    return generateSlugWithTimestamp(baseSlug);
  }
};

/**
 * Validate slug format
 * @param {string} slug - The slug to validate
 * @returns {boolean} True if slug is valid
 */
export const validateSlug = (slug) => {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // Check length
  if (slug.length < 1 || slug.length > 100) {
    return false;
  }

  // Check format (only lowercase letters, numbers, and hyphens)
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug);
};

/**
 * Sanitize slug (remove invalid characters, normalize)
 * @param {string} slug - The slug to sanitize
 * @returns {string} Sanitized slug
 */
export const sanitizeSlug = (slug) => {
  if (!slug || typeof slug !== 'string') {
    return '';
  }

  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '') // Remove invalid characters
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Extract base slug from a slug with suffix
 * @param {string} slug - The slug with suffix
 * @returns {string} Base slug without suffix
 */
export const extractBaseSlug = (slug) => {
  if (!slug || typeof slug !== 'string') {
    return '';
  }

  // Remove numeric suffix (e.g., "max-1" -> "max")
  return slug.replace(/-\d+$/, '');
};

/**
 * Get all slugs that start with a base slug
 * @param {string} baseSlug - The base slug to search for
 * @param {string} modelName - Model name to search in
 * @returns {Promise<string[]>} Array of existing slugs
 */
export const getExistingSlugs = async (baseSlug, modelName = 'Pet') => {
  try {
    let Model;

    switch (modelName.toLowerCase()) {
      case 'pet':
        Model = Pet;
        break;
      default:
        throw new Error(`Unknown model: ${modelName}`);
    }

    const regex = new RegExp(`^${baseSlug}(-\\d+)?$`);
    const pets = await Model.find({ slug: regex }).select('slug');

    return pets.map((pet) => pet.slug);
  } catch (error) {
    logger.error('Error getting existing slugs:', error);
    return [];
  }
};

/**
 * Generate next available counter for a base slug
 * @param {string} baseSlug - The base slug
 * @param {string} modelName - Model name to check
 * @returns {Promise<number>} Next available counter
 */
export const getNextCounter = async (baseSlug, modelName = 'Pet') => {
  try {
    const existingSlugs = await getExistingSlugs(baseSlug, modelName);

    if (existingSlugs.length === 0) {
      return 1; // No existing slugs, start with 1
    }

    // Extract counters from existing slugs
    const counters = existingSlugs
      .map((slug) => {
        const match = slug.match(new RegExp(`^${baseSlug}-(\\d+)$`));
        return match ? parseInt(match[1]) : 0;
      })
      .filter((counter) => counter > 0);

    // Find the next available counter
    const maxCounter = Math.max(0, ...counters);
    return maxCounter + 1;
  } catch (error) {
    logger.error('Error getting next counter:', error);
    return 1;
  }
};
