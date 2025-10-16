import { zimService } from './zim.service.js';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/errors.js';

/**
 * ZIM Group Service for managing group conversations
 * Handles group creation, member management, and group operations
 */
class ZIMGroupService {
  constructor() {
    this.baseUrl = process.env.ZIM_API_BASE_URL || 'https://zim-api.zego.im';
  }

  /**
   * Generate a standardized group ID for pet conversations
   * @param {string} shelterId - Shelter ID
   * @param {string} petId - Pet ID
   * @param {string} userId - User ID
   * @returns {string} Generated group ID
   * @deprecated Use makeZimGroupId in ConversationService instead
   */
  generateGroupId(shelterId, petId, userId) {
    return `grp_${shelterId}_${petId}_${userId}`;
  }

  /**
   * Validate group ID format
   * @param {string} groupId - Group ID to validate
   * @returns {boolean} True if valid
   */
  isValidGroupId(groupId) {
    // Support both old format (grp_...) and new short format (g_...)
    const oldPattern = /^grp_[a-fA-F0-9]{24}_[a-fA-F0-9]{24}_[a-fA-F0-9]{24}$/;
    const newPattern = /^g_[A-Za-z0-9_-]{22}_[a-fA-F0-9]{6}$/;
    return oldPattern.test(groupId) || newPattern.test(groupId);
  }

  /**
   * Parse group ID to extract components
   * @param {string} groupId - Group ID to parse
   * @returns {Object} Parsed components
   */
  parseGroupId(groupId) {
    if (!this.isValidGroupId(groupId)) {
      throw new Error(`Invalid group ID format: ${groupId}`);
    }

    const parts = groupId.split('_');
    return {
      shelterId: parts[1],
      petId: parts[2],
      userId: parts[3],
    };
  }

  /**
   * Ensure a ZIM group exists for the conversation
   * This is a mock implementation - in production, this would call ZIM API
   * @param {string} groupId - Group ID
   * @param {Array} members - Array of member objects
   * @param {Object} groupInfo - Group information
   * @returns {Object} Group creation/retrieval result
   */
  async ensureGroup(groupId, members, groupInfo = {}) {
    try {
      if (!this.isValidGroupId(groupId)) {
        throw new Error(`Invalid group ID format: ${groupId}`);
      }

      // Mock group creation/retrieval
      // In production, this would call ZIM API endpoints:
      // 1. Check if group exists
      // 2. Create group if it doesn't exist
      // 3. Add members to group
      // 4. Return group information

      const groupData = {
        groupId,
        groupName: groupInfo.name || `Pet Adoption Chat`,
        groupAvatar: groupInfo.avatar || '',
        memberCount: members.length,
        members: members.map((member) => ({
          userID: member.userID,
          userName: member.userName,
          userAvatar: member.userAvatar || '',
          role: member.role || 0, // 0 = member, 1 = admin
        })),
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      logger.info(
        `ZIM group ensured: ${groupId} with ${members.length} members`
      );

      return {
        success: true,
        group: groupData,
        message: 'Group ensured successfully',
      };
    } catch (error) {
      logger.error('ZIM group ensure failed:', error);
      throw new ApiError(500, 'Failed to ensure ZIM group', error.message);
    }
  }

  /**
   * Add member to ZIM group
   * @param {string} groupId - Group ID
   * @param {Object} member - Member to add
   * @returns {Object} Add member result
   */
  async addMember(groupId, member) {
    try {
      if (!this.isValidGroupId(groupId)) {
        throw new Error(`Invalid group ID format: ${groupId}`);
      }

      // Mock member addition
      // In production, this would call ZIM API to add member

      logger.info(`Member added to ZIM group ${groupId}: ${member.userID}`);

      return {
        success: true,
        message: 'Member added successfully',
      };
    } catch (error) {
      logger.error('ZIM group add member failed:', error);
      throw new ApiError(
        500,
        'Failed to add member to ZIM group',
        error.message
      );
    }
  }

  /**
   * Remove member from ZIM group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID to remove
   * @returns {Object} Remove member result
   */
  async removeMember(groupId, userId) {
    try {
      if (!this.isValidGroupId(groupId)) {
        throw new Error(`Invalid group ID format: ${groupId}`);
      }

      // Mock member removal
      // In production, this would call ZIM API to remove member

      logger.info(`Member removed from ZIM group ${groupId}: ${userId}`);

      return {
        success: true,
        message: 'Member removed successfully',
      };
    } catch (error) {
      logger.error('ZIM group remove member failed:', error);
      throw new ApiError(
        500,
        'Failed to remove member from ZIM group',
        error.message
      );
    }
  }

  /**
   * Get group information
   * @param {string} groupId - Group ID
   * @returns {Object} Group information
   */
  async getGroupInfo(groupId) {
    try {
      if (!this.isValidGroupId(groupId)) {
        throw new Error(`Invalid group ID format: ${groupId}`);
      }

      // Mock group info retrieval
      // In production, this would call ZIM API to get group info

      const groupInfo = {
        groupId,
        groupName: `Pet Adoption Chat`,
        groupAvatar: '',
        memberCount: 2,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      return {
        success: true,
        group: groupInfo,
      };
    } catch (error) {
      logger.error('ZIM group info retrieval failed:', error);
      throw new ApiError(500, 'Failed to get ZIM group info', error.message);
    }
  }

  /**
   * Update group information
   * @param {string} groupId - Group ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Update result
   */
  async updateGroupInfo(groupId, updates) {
    try {
      if (!this.isValidGroupId(groupId)) {
        throw new Error(`Invalid group ID format: ${groupId}`);
      }

      // Mock group update
      // In production, this would call ZIM API to update group

      logger.info(`ZIM group updated: ${groupId}`, updates);

      return {
        success: true,
        message: 'Group updated successfully',
      };
    } catch (error) {
      logger.error('ZIM group update failed:', error);
      throw new ApiError(500, 'Failed to update ZIM group', error.message);
    }
  }

  /**
   * Delete ZIM group
   * @param {string} groupId - Group ID
   * @returns {Object} Delete result
   */
  async deleteGroup(groupId) {
    try {
      if (!this.isValidGroupId(groupId)) {
        throw new Error(`Invalid group ID format: ${groupId}`);
      }

      // Mock group deletion
      // In production, this would call ZIM API to delete group

      logger.info(`ZIM group deleted: ${groupId}`);

      return {
        success: true,
        message: 'Group deleted successfully',
      };
    } catch (error) {
      logger.error('ZIM group deletion failed:', error);
      throw new ApiError(500, 'Failed to delete ZIM group', error.message);
    }
  }

  /**
   * Check if ZIM service is available
   * @returns {boolean} True if available
   */
  isAvailable() {
    return zimService.isConfigured();
  }
}

// Export singleton instance
export const zimGroupService = new ZIMGroupService();
export default zimGroupService;
