/**
 * File Storage Service
 * Handles file storage and URL generation for local and cloud storage
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base storage directory
const BASE = path.join(process.cwd(), 'storage');

/**
 * Save buffer to file and return URL
 * @param {Buffer} buf - File buffer to save
 * @param {string} relPath - Relative path for storage
 * @param {string} mime - MIME type of the file
 * @returns {Promise<[string, string]>} Tuple of [filePath, url]
 */
export async function saveBufferAndGetUrl(buf, relPath, mime) {
  const full = path.join(BASE, relPath);

  // Ensure directory exists
  await fs.mkdir(path.dirname(full), { recursive: true });

  // Write file
  await fs.writeFile(full, buf);

  // Generate URL based on environment
  const url =
    process.env.NODE_ENV === 'production'
      ? await getProductionUrl(relPath, mime)
      : `/static/${relPath}`;

  return [relPath, url];
}

/**
 * Save file from stream and return URL
 * @param {ReadableStream} stream - File stream to save
 * @param {string} relPath - Relative path for storage
 * @param {string} mime - MIME type of the file
 * @returns {Promise<[string, string]>} Tuple of [filePath, url]
 */
export async function saveStreamAndGetUrl(stream, relPath, mime) {
  const full = path.join(BASE, relPath);

  // Ensure directory exists
  await fs.mkdir(path.dirname(full), { recursive: true });

  // Write stream to file
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  await fs.writeFile(full, buffer);

  // Generate URL
  const url =
    process.env.NODE_ENV === 'production'
      ? await getProductionUrl(relPath, mime)
      : `/static/${relPath}`;

  return [relPath, url];
}

/**
 * Delete file by relative path
 * @param {string} relPath - Relative path of file to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFile(relPath) {
  try {
    const full = path.join(BASE, relPath);
    await fs.unlink(full);
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
}

/**
 * Check if file exists
 * @param {string} relPath - Relative path to check
 * @returns {Promise<boolean>} File existence status
 */
export async function fileExists(relPath) {
  try {
    const full = path.join(BASE, relPath);
    await fs.access(full);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stats
 * @param {string} relPath - Relative path of file
 * @returns {Promise<Object|null>} File stats or null if not found
 */
export async function getFileStats(relPath) {
  try {
    const full = path.join(BASE, relPath);
    const stats = await fs.stat(full);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
    };
  } catch {
    return null;
  }
}

/**
 * List files in directory
 * @param {string} relPath - Relative directory path
 * @returns {Promise<string[]>} Array of file names
 */
export async function listFiles(relPath) {
  try {
    const full = path.join(BASE, relPath);
    const files = await fs.readdir(full);
    return files;
  } catch {
    return [];
  }
}

/**
 * Generate production URL (S3/CloudFront/etc.)
 * @param {string} relPath - Relative file path
 * @param {string} mime - MIME type
 * @returns {Promise<string>} Production URL
 */
async function getProductionUrl(relPath, mime) {
  // Check if Cloudinary is configured
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const { uploadToCloudinary } = await import('../utils/cloudinary.js');
      const full = path.join(BASE, relPath);
      const buffer = await fs.readFile(full);

      const result = await uploadToCloudinary(buffer, {
        folder: 'adoption-contracts',
        resource_type: 'raw',
        format: path.extname(relPath).slice(1),
      });

      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
    }
  }

  // Fallback to static URL
  return `/static/${relPath}`;
}

/**
 * Generate unique filename with timestamp
 * @param {string} originalName - Original filename
 * @param {string} prefix - Optional prefix
 * @returns {string} Unique filename
 */
export function generateUniqueFilename(originalName, prefix = '') {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  return `${prefix}${name}-${timestamp}-${random}${ext}`;
}

/**
 * Get file extension from MIME type
 * @param {string} mime - MIME type
 * @returns {string} File extension
 */
export function getExtensionFromMime(mime) {
  const mimeMap = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'text/plain': '.txt',
    'application/json': '.json',
    'text/markdown': '.md',
  };

  return mimeMap[mime] || '.bin';
}

/**
 * Validate file type
 * @param {string} mime - MIME type to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} Validation result
 */
export function validateFileType(mime, allowedTypes = []) {
  if (allowedTypes.length === 0) {
    return true; // No restrictions
  }

  return allowedTypes.includes(mime);
}

/**
 * Get storage statistics
 * @returns {Promise<Object>} Storage statistics
 */
export async function getStorageStats() {
  try {
    const stats = await fs.stat(BASE);
    if (!stats.isDirectory()) {
      return { error: 'Storage directory not found' };
    }

    // Get directory size recursively
    const getDirSize = async (dirPath) => {
      let size = 0;
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const fileStat = await fs.stat(filePath);

        if (fileStat.isDirectory()) {
          size += await getDirSize(filePath);
        } else {
          size += fileStat.size;
        }
      }

      return size;
    };

    const totalSize = await getDirSize(BASE);

    return {
      totalSize,
      totalSizeMB: Math.round((totalSize / 1024 / 1024) * 100) / 100,
      basePath: BASE,
      exists: true,
    };
  } catch (error) {
    return {
      error: error.message,
      exists: false,
    };
  }
}
