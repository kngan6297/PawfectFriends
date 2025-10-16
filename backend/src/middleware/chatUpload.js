import multer from 'multer';
import { ApiError } from '../utils/errors.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function for chat attachments
const fileFilter = (req, file, cb) => {
  // Allow images, documents, and other common file types
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    // Audio/Video (basic support)
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'video/mp4',
    'video/webm',
    'video/ogg',
  ];

  const allowedExtensions =
    /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|txt|csv|zip|rar|7z|mp3|wav|ogg|mp4|webm)$/i;

  if (
    !file.originalname.match(allowedExtensions) ||
    !allowedMimeTypes.includes(file.mimetype)
  ) {
    return cb(
      ApiError.validation(
        'Invalid file type. Allowed: images, documents, archives, audio, video files'
      ),
      false
    );
  }
  cb(null, true);
};

// Configure multer upload for chat attachments
export const chatUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5, // Maximum 5 files per message
  },
});

// Single file upload for chat attachments
export const singleChatUpload = chatUpload.single('attachment');

// Multiple files upload for chat attachments
export const multipleChatUpload = chatUpload.array('attachments', 5);
