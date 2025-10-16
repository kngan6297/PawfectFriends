import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';
import { ServerError } from './errors.js';

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
export const uploadToLocalStorage = async (file, folder) => {
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
    const serverUrl = config.clientUrl || 'http://localhost:5000';
    const url = `${serverUrl}/uploads/${folder}/${fileName}`;

    return {
      url,
      path: filePath,
      public_id: fileName, // For compatibility with Cloudinary interface
    };
  } catch (error) {
    console.error('Local file upload error:', error);
    throw new ServerError('Failed to upload file to local storage');
  }
};

/**
 * Deletes a file from local storage
 * @param {string} filePath - The path of the file to delete
 * @returns {Promise<void>}
 */
export const deleteFromLocalStorage = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Local file deletion error:', error);
    // Don't throw error for deletion failures
  }
};

/**
 * Uploads a file (compatible with Cloudinary interface)
 * @param {Object} file - The file object from multer
 * @param {string|Object} folderOrOptions - The folder or options object
 * @returns {Promise<Object>} The upload result with URL and public_id
 */
export const uploadToCloudinary = async (file, folderOrOptions) => {
  try {
    let folder = 'uploads';

    // Handle different parameter formats
    if (typeof folderOrOptions === 'string') {
      folder = folderOrOptions;
    } else if (typeof folderOrOptions === 'object') {
      folder = folderOrOptions.folder || 'uploads';
    }

    const result = await uploadToLocalStorage(file, folder);

    return {
      url: result.url,
      public_id: result.public_id,
      secure_url: result.url, // For compatibility with Cloudinary interface
      path: result.path, // Include the file path
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new ServerError('Failed to upload file');
  }
};

/**
 * Deletes a file (compatible with Cloudinary interface)
 * @param {string} publicId - The public ID or file path
 * @returns {Promise<Object>} The deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    // If publicId is a full path, use it directly
    if (publicId.includes('/')) {
      await deleteFromLocalStorage(publicId);
    } else {
      // Otherwise, construct the path
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const filePath = path.join(uploadsDir, publicId);
      await deleteFromLocalStorage(filePath);
    }

    return { result: 'ok' };
  } catch (error) {
    console.error('File deletion error:', error);
    return { result: 'error', message: error.message };
  }
};
