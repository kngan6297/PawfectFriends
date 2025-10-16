import { v2 as cloudinary } from 'cloudinary';
import '../config/env.js'; // Load environment variables

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file, folder = 'pets') => {
  try {
    // Convert buffer to base64 string
    const base64String = file.toString('base64');
    const dataUri = `data:application/octet-stream;base64,${base64String}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: folder,
      resource_type: 'auto', // Automatically detect file type
      use_filename: true,
      unique_filename: true,
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to cloud storage');
  }
};

export const deleteFromCloudinary = async (publicId) => {
  // TODO: Implement actual image deletion functionality
  return { result: 'ok' };
};

export const getCloudinaryUrl = (publicId, options = {}) => {
  // TODO: Implement actual URL generation functionality
  return publicId;
};
