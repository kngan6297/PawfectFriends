/**
 * File Upload Configuration
 * Cloudinary-only configuration for file uploads
 */

export const fileUploadConfig = {
  // File size limits (in bytes)
  maxFileSize: 5 * 1024 * 1024, // 5MB

  // Allowed file types
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],

  // Allowed file extensions
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],

  // Provider-specific configurations
  providers: {
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      folder: process.env.CLOUDINARY_FOLDER || 'pawfect-friends',
      transformation: {
        quality: 'auto',
        fetch_format: 'auto',
      },
    },
  },

  // Image processing options
  imageProcessing: {
    resize: {
      enabled: true,
      maxWidth: 1920,
      maxHeight: 1080,
      maintainAspectRatio: true,
    },
    compression: {
      enabled: true,
      quality: 80,
    },
    formats: {
      webp: true,
      jpeg: true,
      png: true,
    },
  },

  // Security settings
  security: {
    scanForViruses: process.env.SCAN_FILES === 'true',
    validateFileContent: true,
    maxFilesPerRequest: 10,
  },
};

/**
 * Validate file upload configuration
 * @returns {Object} Validation result
 */
export const validateFileUploadConfig = () => {
  const errors = [];

  // Check required Cloudinary environment variables
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    errors.push('CLOUDINARY_CLOUD_NAME environment variable is required');
  }
  if (!process.env.CLOUDINARY_API_KEY) {
    errors.push('CLOUDINARY_API_KEY environment variable is required');
  }
  if (!process.env.CLOUDINARY_API_SECRET) {
    errors.push('CLOUDINARY_API_SECRET environment variable is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Check if file type is allowed
 * @param {string} mimetype - File MIME type
 * @param {string} filename - Original filename
 * @returns {boolean} True if file type is allowed
 */
export const isAllowedFileType = (mimetype, filename) => {
  // Check MIME type
  if (!fileUploadConfig.allowedMimeTypes.includes(mimetype)) {
    return false;
  }

  // Check file extension
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return fileUploadConfig.allowedExtensions.includes(extension);
};

/**
 * Generate file upload error message
 * @param {string} errorType - Type of error
 * @returns {string} Error message
 */
export const getFileUploadErrorMessage = (errorType) => {
  const messages = {
    'file-too-large': `File size exceeds the maximum limit of ${fileUploadConfig.maxFileSize / (1024 * 1024)}MB`,
    'invalid-file-type': `Only ${fileUploadConfig.allowedExtensions.join(', ')} files are allowed`,
    'too-many-files': `Maximum ${fileUploadConfig.security.maxFilesPerRequest} files allowed per request`,
    'upload-failed': 'File upload failed. Please try again.',
    'virus-detected': 'File appears to be unsafe and cannot be uploaded.',
    'provider-error': 'Cloudinary service is temporarily unavailable.',
  };

  return messages[errorType] || 'File upload error occurred';
};
