import multer from 'multer';
import { ApiError } from '../utils/errors.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function for documents
const fileFilter = (req, file, cb) => {
  // Accept various document types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      ApiError.validation(
        'Only PDF, DOC, DOCX, JPG, PNG, GIF, and TXT files are allowed!'
      ),
      false
    );
  }

  cb(null, true);
};

// Configure multer upload for documents
export const documentUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  },
});

// Single file upload middleware
export const uploadSingleDocument = documentUpload.single('file');

// Multiple files upload middleware
export const uploadMultipleDocuments = documentUpload.array('files', 5); // Max 5 files
