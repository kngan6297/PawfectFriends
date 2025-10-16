import multer from 'multer';
import { ApiError } from '../utils/errors.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept images only - check both extension and mimetype
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  if (
    !file.originalname.match(allowedExtensions) ||
    !allowedMimeTypes.includes(file.mimetype)
  ) {
    return cb(
      ApiError.validation(
        'Only image files (JPG, PNG, GIF, WebP) are allowed!'
      ),
      false
    );
  }

  cb(null, true);
};

// Configure multer upload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
