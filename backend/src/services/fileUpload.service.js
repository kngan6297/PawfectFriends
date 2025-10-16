import { ApiError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import {
  fileUploadConfig,
  isAllowedFileType,
  getFileUploadErrorMessage,
} from '../config/fileUpload.config.js';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Standardized file object format
 * @typedef {Object} FileObject
 * @property {string} url - The URL where the file can be accessed
 * @property {string} id - Unique identifier for the file
 * @property {string} [caption] - Optional caption for the file
 * @property {string} [filename] - Original filename
 * @property {string} [mimetype] - File MIME type
 * @property {number} [size] - File size in bytes
 */

/**
 * Cloudinary File Upload Service
 * Handles file uploads exclusively through Cloudinary
 */
class FileUploadService {
  constructor() {
    this.cloudinary = null;
    this.initializeCloudinary();
  }

  /**
   * Initialize Cloudinary
   */
  initializeCloudinary() {
    try {
      // Configure Cloudinary
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      this.cloudinary = cloudinary;
      logger.info('Cloudinary upload service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Cloudinary:', error);
      throw new ApiError('Cloudinary service unavailable', 500);
    }
  }

  /**
   * Process uploaded files and convert to standardized format
   * @param {Array} files - Array of uploaded files from multer
   * @param {Object} options - Processing options
   * @returns {Promise<Array<FileObject>>} Array of standardized file objects
   */
  async processUploadedFiles(files, options = {}) {
    if (!files || files.length === 0) {
      return [];
    }

    const processedFiles = [];

    for (const file of files) {
      try {
        const fileObject = await this.processFile(file, options);
        processedFiles.push(fileObject);
      } catch (error) {
        logger.error('Error processing uploaded file:', error);
        throw new ApiError('Failed to process uploaded file', 500);
      }
    }

    return processedFiles;
  }

  /**
   * Process a single file
   * @param {Object} file - Multer file object
   * @param {Object} options - Processing options
   * @returns {Promise<FileObject>} Processed file object
   */
  async processFile(file, options = {}) {
    const { generateUrl = true, addCaption = false } = options;

    // Validate file type
    if (!isAllowedFileType(file.mimetype, file.originalname)) {
      throw new ApiError(getFileUploadErrorMessage('invalid-file-type'), 400);
    }

    // Generate unique ID for the file
    const fileId = this.generateFileId();

    // Upload to Cloudinary
    let url = null;
    if (generateUrl) {
      url = await this.uploadToCloudinary(file, fileId, options);
    }

    // Create standardized file object
    const fileObject = {
      id: fileId,
      url: url || `file://${fileId}`,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      caption: addCaption ? this.extractCaption(file.originalname) : null,
      uploadedAt: new Date().toISOString(),
      provider: 'cloudinary',
    };

    logger.debug(`File processed: ${fileObject.filename} -> ${fileObject.url}`);
    return fileObject;
  }

  /**
   * Upload file to Cloudinary
   * @param {Object} file - Multer file object
   * @param {string} fileId - Unique file ID
   * @param {Object} options - Upload options
   * @returns {Promise<string>} File URL
   */
  async uploadToCloudinary(file, fileId, options = {}) {
    if (!this.cloudinary) {
      throw new ApiError('Cloudinary not initialized', 500);
    }

    try {
      const cloudinaryConfig = fileUploadConfig.providers.cloudinary;
      const folder = cloudinaryConfig.folder || 'pawfect-friends';

      // Upload to Cloudinary
      const result = await this.cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          public_id: `${folder}/${fileId}`,
          folder: folder,
          resource_type: 'auto',
          transformation: cloudinaryConfig.transformation || {
            quality: 'auto',
            fetch_format: 'auto',
          },
        }
      );

      logger.info(`File uploaded to Cloudinary: ${result.public_id}`);
      return result.secure_url;
    } catch (error) {
      logger.error('Cloudinary upload failed:', error);
      throw new ApiError('Failed to upload file to Cloudinary', 500);
    }
  }

  /**
   * Delete file from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(publicId) {
    if (!this.cloudinary) {
      throw new ApiError('Cloudinary not initialized', 500);
    }

    try {
      const result = await this.cloudinary.uploader.destroy(publicId);
      logger.info(`File deleted from Cloudinary: ${publicId}`);
      return result.result === 'ok';
    } catch (error) {
      logger.error('Cloudinary delete failed:', error);
      throw new ApiError('Failed to delete file from Cloudinary', 500);
    }
  }

  /**
   * Generate a unique file ID
   * @returns {string} Unique file ID
   */
  generateFileId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract caption from filename (optional feature)
   * @param {string} filename - Original filename
   * @returns {string|null} Extracted caption or null
   */
  extractCaption(filename) {
    // Simple caption extraction - remove extension and clean up
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    return nameWithoutExt.replace(/[-_]/g, ' ').trim() || null;
  }

  /**
   * Get Cloudinary instance (for advanced operations)
   * @returns {Object} Cloudinary instance
   */
  getCloudinaryInstance() {
    return this.cloudinary;
  }
}

// Create and export singleton instance
const fileUploadService = new FileUploadService();
export default fileUploadService;
