import logger from './logger.js';

/**
 * Gets the allowed fields from the Pet schema dynamically
 * @returns {Promise<Array>} Array of allowed field names
 */
async function getAllowedPetFields() {
  try {
    // Import Pet model dynamically to avoid circular dependencies
    const { Pet } = await import('../modules/pet/pet.model.js');
    const schemaPaths = Object.keys(Pet.schema.paths);
    logger.debug(`🔍 Pet schema paths found: ${schemaPaths.length}`);
    logger.debug(`🔍 All schema paths: ${schemaPaths.join(', ')}`);

    const allowedFields = schemaPaths.filter(
      (k) => !['_id', '__v'].includes(k)
    );

    logger.debug(
      `🔍 Allowed fields (${allowedFields.length}): ${allowedFields.join(', ')}`
    );

    return allowedFields;
  } catch (error) {
    logger.error('❌ Error getting allowed Pet fields:', error.message);
    // Fallback to a hardcoded list of known valid fields
    return [
      'name',
      'slug',
      'type',
      'species',
      'breed',
      'age',
      'gender',
      'size',
      'coat',
      'primaryColor',
      'secondaryColor',
      'description',
      'photos',
      'videos',
      'status',
      'shelter',
      'health',
      'behavior',
      'attributes',
      'tags',
      'adoptionFee',
      'views',
      'savedBy',
      'adoptionRequests',
      'metadata',
    ];
  }
}

/**
 * Sanitizes a pet object to ensure only valid schema fields are included.
 *
 * IMPORTANT: This function MUST be called before creating any Pet object or inserting into MongoDB,
 * even when using spread operators or merging data:
 *
 * // ❌ WRONG - Don't do this:
 * const doc = {
 *   ...someObj,
 *   ...otherData,
 *   // ...
 * };
 * await new Pet(doc).save();
 *
 * // ✅ CORRECT - Always sanitize before saving:
 * const doc = {
 *   ...someObj,
 *   ...otherData,
 *   // ...
 * };
 * const cleanDoc = sanitizePetObject(doc);
 * await new Pet(cleanDoc).save();
 *
 * @param {Object} obj - The object to sanitize
 * @returns {Object} - Object containing only valid Pet schema fields
 */
export function sanitizePetObject(obj) {
  if (!obj || typeof obj !== 'object') {
    logger.warn('⚠️ Invalid object provided to sanitizePetObject:', obj);
    return {};
  }

  // Use a whitelist approach to ensure only valid fields are included
  const whitelistedFields = [
    'name',
    'slug',
    'type',
    'species',
    'breed',
    'age',
    'gender',
    'size',
    'coat',
    'primaryColor',
    'secondaryColor',
    'description',
    'photos',
    'videos',
    'status',
    'shelter',
    'health',
    'behavior',
    'attributes',
    'tags',
    'adoptionFee',
    'views',
    'savedBy',
    'adoptionRequests',
    'metadata',
    'isApproved',
    // Enhanced fields for better pet recommendations
    'lifestyle',
    'care',
    'experience',
    'allergies',
    'healthRecords',
    'behaviorRecords',
  ];

  // Debug: Log the whitelisted fields
  logger.debug(
    `📋 Whitelisted fields (${whitelistedFields.length}): ${whitelistedFields.join(', ')}`
  );

  const result = whitelistedFields.reduce((clean, key) => {
    if (obj[key] !== undefined) clean[key] = obj[key];
    return clean;
  }, {});

  // Debug: Log what was included
  logger.debug(`📋 Input object fields: ${Object.keys(obj).join(', ')}`);
  logger.debug(`📋 Output object fields: ${Object.keys(result).join(', ')}`);

  return result;
}

/**
 * Sanitizes pet data before validation to ensure only valid schema fields are included.
 * This function should be called before any validation operations.
 *
 * @param {Object} petData - The pet data to sanitize
 * @returns {Object} - Sanitized pet data ready for validation
 */
export function sanitizePetDataForValidation(petData) {
  if (!petData || typeof petData !== 'object') {
    logger.warn(
      '⚠️ Invalid pet data provided for validation sanitization:',
      petData
    );
    return {};
  }

  // Remove MongoDB-specific fields that shouldn't be validated
  const { _id, __v, id, createdAt, updatedAt, ...dataToValidate } = petData;

  // Convert ObjectId to string for validation if needed
  if (dataToValidate.shelter && typeof dataToValidate.shelter === 'object') {
    dataToValidate.shelter = dataToValidate.shelter.toString();
  }

  // Apply the same sanitization as for database operations
  return sanitizePetObject(dataToValidate);
}

/**
 * Sanitizes update data for pet updates to ensure only valid fields are included.
 *
 * @param {Object} updateData - The update data to sanitize
 * @returns {Object} - Sanitized update data
 */
export function sanitizePetUpdateData(updateData) {
  if (!updateData || typeof updateData !== 'object') {
    logger.warn(
      '⚠️ Invalid update data provided for sanitization:',
      updateData
    );
    return {};
  }

  // For updates, we allow all the same fields as creation
  const whitelistedUpdateFields = [
    'name',
    'slug',
    'type',
    'species',
    'breed',
    'age',
    'gender',
    'size',
    'coat',
    'primaryColor',
    'secondaryColor',
    'description',
    'photos',
    'videos',
    'status',
    'shelter',
    'health',
    'behavior',
    'attributes',
    'tags',
    'adoptionFee',
    'views',
    'savedBy',
    'adoptionRequests',
    'metadata',
    'isApproved',
  ];

  const result = whitelistedUpdateFields.reduce((clean, key) => {
    if (updateData[key] !== undefined) clean[key] = updateData[key];
    return clean;
  }, {});

  logger.debug(`📋 Update data sanitized: ${Object.keys(result).join(', ')}`);
  return result;
}

export { getAllowedPetFields };
