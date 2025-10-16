import axios from 'axios';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/errors.js';

/**
 * ZIM API Service for making actual API calls to ZIM
 * Handles group creation, member invitations, and group management
 */
class ZIMApiService {
  constructor() {
    this.baseUrl = process.env.ZIM_API_BASE_URL || 'https://zim-api.zego.im';
    this.appID = config.zego.appId;
    this.serverSecret = config.zego.serverSecret;
  }

  /**
   * Generate authentication headers for ZIM API calls
   * @returns {Object} Headers with authentication
   */
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'App-ID': this.appID,
      'Server-Secret': this.serverSecret,
    };
  }

  /**
   * Create a ZIM group with initial members
   * @param {string} groupID - Group ID
   * @param {Array<string>} userIDs - Array of user IDs to add to the group
   * @returns {Object} Group creation result
   */
  async createGroup({ groupID, userIDs }) {
    try {
      if (!this.appID || !this.serverSecret) {
        throw new Error(
          'ZIM configuration missing: appID or serverSecret not set'
        );
      }

      const payload = {
        groupID,
        groupName: `Adoption Chat - ${groupID}`,
        groupAvatar: '',
        userIDs,
      };

      logger.info(
        `Creating ZIM group: ${groupID} with users: ${userIDs.join(', ')}`
      );

      // Mock implementation - replace with actual ZIM API call
      // const response = await axios.post(`${this.baseUrl}/group/create`, payload, {
      //   headers: this.getAuthHeaders(),
      // });

      // Mock response
      const mockResponse = {
        data: {
          groupID,
          groupName: payload.groupName,
          groupAvatar: payload.groupAvatar,
          memberCount: userIDs.length,
          members: userIDs.map((userID) => ({
            userID,
            role: 0, // member
          })),
          createdAt: new Date().toISOString(),
          status: 'active',
        },
      };

      logger.info(`ZIM group created successfully: ${groupID}`);
      return mockResponse.data;
    } catch (error) {
      logger.error('ZIM group creation failed:', error);
      throw new ApiError(500, 'Failed to create ZIM group', error.message);
    }
  }

  /**
   * Invite users into an existing ZIM group
   * @param {string} groupID - Group ID
   * @param {Array<string>} userIDs - Array of user IDs to invite
   * @returns {Object} Invitation result with errorUsers if any
   */
  async inviteUsersIntoGroup(groupID, userIDs) {
    try {
      if (!this.appID || !this.serverSecret) {
        throw new Error(
          'ZIM configuration missing: appID or serverSecret not set'
        );
      }

      const payload = {
        groupID,
        userIDs,
      };

      logger.info(
        `Inviting users to ZIM group: ${groupID}, users: ${userIDs.join(', ')}`
      );

      // Mock implementation - replace with actual ZIM API call
      // const response = await axios.post(`${this.baseUrl}/group/invite`, payload, {
      //   headers: this.getAuthHeaders(),
      // });

      // Mock response - simulate some users not existing/logged in
      const mockResponse = {
        data: {
          groupID,
          invitedUsers: userIDs.filter(() => Math.random() > 0.3), // 70% success rate
          errorUsers: userIDs.filter(() => Math.random() <= 0.3), // 30% error rate
          errorCodes: userIDs
            .filter(() => Math.random() <= 0.3)
            .map(() => 51102), // 51102: user not exist / not logged in yet
        },
      };

      logger.info(
        `ZIM group invitation completed: ${groupID}, invited: ${mockResponse.data.invitedUsers.length}, errors: ${mockResponse.data.errorUsers.length}`
      );
      return mockResponse.data;
    } catch (error) {
      logger.error('ZIM group invitation failed:', error);
      throw new ApiError(
        500,
        'Failed to invite users to ZIM group',
        error.message
      );
    }
  }

  /**
   * Check if group exists
   * @param {string} groupID - Group ID
   * @returns {Object} Group existence check result
   */
  async groupExists(groupID) {
    try {
      if (!this.appID || !this.serverSecret) {
        throw new Error(
          'ZIM configuration missing: appID or serverSecret not set'
        );
      }

      logger.info(`Checking if ZIM group exists: ${groupID}`);

      // Mock implementation - replace with actual ZIM API call
      // const response = await axios.get(`${this.baseUrl}/group/${groupID}`, {
      //   headers: this.getAuthHeaders(),
      // });

      // Mock response - assume group exists
      const mockResponse = {
        data: {
          groupID,
          exists: true,
          groupName: `Adoption Chat - ${groupID}`,
          memberCount: 1,
          status: 'active',
        },
      };

      return mockResponse.data;
    } catch (error) {
      logger.error('ZIM group existence check failed:', error);
      throw new ApiError(
        500,
        'Failed to check ZIM group existence',
        error.message
      );
    }
  }

  /**
   * Get group members
   * @param {string} groupID - Group ID
   * @returns {Object} Group members
   */
  async getGroupMembers(groupID) {
    try {
      if (!this.appID || !this.serverSecret) {
        throw new Error(
          'ZIM configuration missing: appID or serverSecret not set'
        );
      }

      logger.info(`Getting ZIM group members: ${groupID}`);

      // Mock implementation - replace with actual ZIM API call
      // const response = await axios.get(`${this.baseUrl}/group/${groupID}/members`, {
      //   headers: this.getAuthHeaders(),
      // });

      // Mock response
      const mockResponse = {
        data: {
          groupID,
          members: [
            {
              userID: 'user_6895e...',
              role: 0, // member
            },
          ],
        },
      };

      return mockResponse.data;
    } catch (error) {
      logger.error('ZIM group members retrieval failed:', error);
      throw new ApiError(500, 'Failed to get ZIM group members', error.message);
    }
  }

  /**
   * Check if ZIM API is properly configured
   * @returns {boolean} True if configured
   */
  isConfigured() {
    return !!(this.appID && this.serverSecret);
  }
}

// Export singleton instance
export const zimApiService = new ZIMApiService();
export default zimApiService;
