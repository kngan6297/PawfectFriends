/**
 * Utility functions for working with group-based conversation IDs
 * Format: grp_${shelterId}_${userId}_${petId}
 */

/**
 * Generate a deterministic group ID for adoption request conversations
 * @param {string} shelterId - The shelter's ObjectId
 * @param {string} userId - The user's ObjectId
 * @param {string} petId - The pet's ObjectId
 * @returns {string} The group ID in format: grp_${shelterId}_${userId}_${petId}
 */
export function generateGroupId(shelterId, userId, petId) {
  if (!shelterId || !userId || !petId) {
    throw new Error('All parameters (shelterId, userId, petId) are required');
  }

  return `grp_${shelterId}_${userId}_${petId}`;
}

/**
 * Parse a group ID to extract its components
 * @param {string} groupId - The group ID to parse
 * @returns {Object} Object containing shelterId, userId, and petId
 * @throws {Error} If the group ID format is invalid
 */
export function parseGroupId(groupId) {
  if (!groupId || typeof groupId !== 'string') {
    throw new Error('Group ID must be a non-empty string');
  }

  if (!groupId.startsWith('grp_')) {
    throw new Error('Group ID must start with "grp_"');
  }

  const parts = groupId.split('_');
  if (parts.length !== 4) {
    throw new Error(
      'Group ID must have format: grp_${shelterId}_${userId}_${petId}'
    );
  }

  const [, shelterId, userId, petId] = parts;

  return {
    shelterId,
    userId,
    petId,
    originalGroupId: groupId,
  };
}

/**
 * Validate if a string is a valid group ID format
 * @param {string} groupId - The group ID to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidGroupId(groupId) {
  try {
    parseGroupId(groupId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract group ID from various conversation identifiers
 * @param {string} identifier - Could be groupId, conversationId, or other format
 * @returns {string|null} The group ID if found, null otherwise
 */
export function extractGroupId(identifier) {
  if (!identifier || typeof identifier !== 'string') {
    return null;
  }

  // If it's already a group ID, return it
  if (identifier.startsWith('grp_')) {
    return identifier;
  }

  // If it's a conversation ID that might contain group info, try to extract
  // This is a fallback for legacy conversations
  return null;
}

export default {
  generateGroupId,
  parseGroupId,
  isValidGroupId,
  extractGroupId,
};
