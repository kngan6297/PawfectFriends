import crypto from 'crypto';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import CryptoJS from 'crypto-js';

/**
 * ZIM Service for managing ZIM user registration and token generation
 */
class ZIMService {
  constructor() {
    this.appID = config.zego.appId;
    this.serverSecret = config.zego.serverSecret;
    this.tokenTTL = parseInt(config.zego.tokenTTL) || 7200; // 2 hours default
  }

  /**
   * Generate ZIM token for user authentication
   * @param {string} userID - User ID in our system
   * @param {string} userName - User display name
   * @param {number} expireTime - Token expiration time (Unix timestamp)
   * @returns {string} ZIM token
   */
  generateToken(userID, userName, expireTime) {
    try {
      if (!this.appID || !this.serverSecret) {
        throw new Error(
          'ZIM configuration missing: appID or serverSecret not set'
        );
      }

      const time = Math.floor(Date.now() / 1000);
      const body = {
        user_id: String(userID),
        expire: expireTime,
        ctime: time,
        app_id: Number(this.appID),
        nonce: Math.floor(Math.random() * 2147483647),
      };

      const key = CryptoJS.enc.Utf8.parse(this.serverSecret);
      let iv = Math.random().toString().substring(2, 18);
      if (iv.length < 16) iv += iv.substring(0, 16 - iv.length);

      const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(body), key, {
        iv: CryptoJS.enc.Utf8.parse(iv),
      }).toString();

      const ciphert = new Uint8Array(
        Array.from(Buffer.from(ciphertext, 'base64')).map((val) => val)
      );
      const len_ciphert = ciphert.length;

      const uint8 = new Uint8Array(8 + 2 + 16 + 2 + len_ciphert);
      // expire: 8
      uint8.set([0, 0, 0, 0]);
      uint8.set(
        new Uint8Array(new Int32Array([body.expire]).buffer).reverse(),
        4
      );
      // iv length: 2
      uint8[8] = iv.length >> 8;
      uint8[9] = iv.length - (uint8[8] << 8);
      // iv: 16
      uint8.set(
        new Uint8Array(Array.from(iv).map((val) => val.charCodeAt(0))),
        10
      );
      // ciphertext length: 2
      uint8[26] = len_ciphert >> 8;
      uint8[27] = len_ciphert - (uint8[26] << 8);
      // ciphertext
      uint8.set(ciphert, 28);

      const token = `04${Buffer.from(uint8).toString('base64')}`;

      logger.info(`ZIM token generated for user: ${userID}`);
      return token;
    } catch (error) {
      logger.error('ZIM token generation failed:', error);
      throw error;
    }
  }

  /**
   * Register a user in ZIM system
   * Note: ZIM users are automatically created when they first login with a valid token
   * This method prepares the token for user registration
   * @param {string} userID - User ID in our system
   * @param {string} userName - User display name
   * @param {string} userAvatar - User avatar URL (optional)
   * @returns {Object} Registration data including token
   */
  async registerUser(userID, userName, userAvatar = '') {
    try {
      if (!userID || !userName) {
        throw new Error(
          'userID and userName are required for ZIM registration'
        );
      }

      // Calculate expiration time
      const expireTime = Math.floor(Date.now() / 1000) + this.tokenTTL;

      // Generate token
      const token = this.generateToken(userID, userName, expireTime);

      logger.info(
        `ZIM user registration prepared for: ${userID} (${userName})`
      );

      return {
        userID,
        userName,
        userAvatar,
        token,
        expireTime,
        appID: this.appID,
      };
    } catch (error) {
      logger.error('ZIM user registration failed:', error);
      throw error;
    }
  }

  /**
   * Check if ZIM is properly configured
   * @returns {boolean} True if ZIM is configured
   */
  isConfigured() {
    return !!(this.appID && this.serverSecret);
  }

  /**
   * Get ZIM configuration for client
   * @returns {Object} ZIM configuration
   */
  getConfig() {
    return {
      appID: this.appID,
      serverSecret: this.serverSecret ? '***' : '', // Hide secret in logs
      tokenTTL: this.tokenTTL,
      configured: this.isConfigured(),
    };
  }
}

// Export singleton instance
export const zimService = new ZIMService();
export default zimService;
