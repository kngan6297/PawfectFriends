import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import cloudinary from 'cloudinary';
import config from '../config/index.js';
import { ServerError } from './errors.js';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: config.fileUpload.cloudinary.cloudName,
  api_key: config.fileUpload.cloudinary.apiKey,
  api_secret: config.fileUpload.cloudinary.apiSecret,
});

/**
 * Creates uploads directory if it doesn't exist
 * @param {string} folder - The folder to create
 * @returns {Promise<string>} The path to the created directory
 */
const createUploadsDir = async (folder) => {
  const uploadsDir = path.join(process.cwd(), 'uploads', folder);
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

/**
 * Uploads a file to local storage
 * @param {Object} file - The file object from multer
 * @param {string} folder - The folder to upload to
 * @returns {Promise<Object>} The upload result with URL and path
 */
export const uploadFile = async (file, folder) => {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = await createUploadsDir(folder);

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Write file to disk
    await fs.writeFile(filePath, file.buffer);

    // Generate URL for the file
    const url = `${config.baseUrl}/uploads/${folder}/${fileName}`;

    return {
      url,
      path: filePath,
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new ServerError('Failed to upload file');
  }
};

/**
 * Deletes a file from local storage
 * @param {string} filePath - The path of the file to delete
 * @returns {Promise<void>}
 */
export const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('File deletion error:', error);
    throw new ServerError('Failed to delete file');
  }
};

/**
 * Uploads a file to Cloudinary
 * @param {Object|Buffer} file - The file object from multer or buffer
 * @param {string|Object} folder - The folder to upload to in Cloudinary or options object
 * @returns {Promise<Object>} The upload result with URL and public_id
 */
export const uploadToCloudinary = async (file, folderOrOptions) => {
  try {
    let uploadOptions = {};

    // Handle different parameter formats
    if (typeof folderOrOptions === 'string') {
      uploadOptions = {
        folder: `pawfect-friends/${folderOrOptions}`,
        resource_type: 'auto',
      };
    } else if (typeof folderOrOptions === 'object') {
      uploadOptions = {
        folder: `pawfect-friends/${folderOrOptions.folder || 'uploads'}`,
        resource_type: 'auto',
        ...folderOrOptions,
      };
    }

    let result;

    // Handle both file objects and buffers
    if (file.buffer) {
      // File is in memory (from multer memoryStorage)
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          {
            ...uploadOptions,
            resource_type: 'image', // Force image type for avatars
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
    } else if (file.path) {
      // File is on disk
      result = await cloudinary.v2.uploader.upload(file.path, uploadOptions);

      // Delete the local file after upload
      await fs.unlink(file.path);
    } else {
      throw new Error(
        'Invalid file format. Expected file object with buffer or path.'
      );
    }

    // For pet photos, generate multiple size variants
    if (uploadOptions.folder && uploadOptions.folder.includes('pets')) {
      const publicId = result.public_id;

      // Generate different size variants
      const smallUrl = cloudinary.v2.url(publicId, {
        width: 300,
        height: 200,
        crop: 'fill',
        quality: 'auto',
      });

      const mediumUrl = cloudinary.v2.url(publicId, {
        width: 600,
        height: 400,
        crop: 'fill',
        quality: 'auto',
      });

      const largeUrl = cloudinary.v2.url(publicId, {
        width: 800,
        height: 600,
        crop: 'fill',
        quality: 'auto',
      });

      const fullUrl = cloudinary.v2.url(publicId, {
        quality: 'auto',
      });

      return {
        url: result.secure_url,
        public_id: result.public_id,
        small: smallUrl,
        medium: mediumUrl,
        large: largeUrl,
        full: fullUrl,
      };
    }

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new ServerError('Failed to upload file to Cloudinary');
  }
};
