/**
 * Type definitions for adoption-related data structures
 */

/**
 * Contract status enumeration
 * @typedef {'none'|'drafted'|'sent'|'signed'|'void'} ContractStatus
 */
export const ContractStatus = {
  NONE: 'none',
  DRAFTED: 'drafted',
  SENT: 'sent',
  SIGNED: 'signed',
  VOID: 'void',
};

/**
 * Contract language enumeration
 * @typedef {'en'|'vi'} ContractLanguage
 */
export const ContractLanguage = {
  ENGLISH: 'en',
  VIETNAMESE: 'vi',
};

/**
 * Contract details interface
 * @typedef {Object} ContractDetails
 * @property {ContractStatus} status - Current contract status
 * @property {string} title - Contract title
 * @property {string} [description] - Contract description
 * @property {string} [terms] - Additional terms imported by shelter
 * @property {string} [content] - Markdown content of the rendered contract
 * @property {ContractLanguage} [lang] - Contract language
 * @property {string} [fileKey] - S3/GridFS key for file storage
 * @property {string} [fileUrl] - Public/secure URL for file access
 * @property {boolean} [generated] - Whether contract was auto-generated
 * @property {string} [uploadedAt] - ISO timestamp when contract was uploaded
 * @property {string} [sentAt] - ISO timestamp when contract was sent
 * @property {string} [signedAt] - ISO timestamp when contract was signed
 * @property {number} [version] - Contract version number
 * @property {string} [checksum] - SHA256 checksum of content
 */
export const ContractDetailsSchema = {
  status: {
    type: String,
    enum: Object.values(ContractStatus),
    default: ContractStatus.NONE,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  terms: {
    type: String,
    trim: true,
  },
  content: {
    type: String,
    trim: true,
  },
  lang: {
    type: String,
    enum: Object.values(ContractLanguage),
    default: ContractLanguage.ENGLISH,
  },
  fileKey: {
    type: String,
    trim: true,
  },
  fileUrl: {
    type: String,
    trim: true,
  },
  generated: {
    type: Boolean,
    default: false,
  },
  uploadedAt: {
    type: Date,
  },
  sentAt: {
    type: Date,
  },
  signedAt: {
    type: Date,
  },
  version: {
    type: Number,
    default: 1,
  },
  checksum: {
    type: String,
    trim: true,
  },
};

/**
 * Contract generation options
 * @typedef {Object} ContractGenerationOptions
 * @property {ContractLanguage} [language] - Language for contract generation
 * @property {string} [customTerms] - Custom additional terms
 * @property {string} [version] - Contract version
 * @property {boolean} [generatePdf] - Whether to generate PDF
 * @property {string} [title] - Custom contract title
 * @property {string} [description] - Custom contract description
 */
export const ContractGenerationOptionsSchema = {
  language: {
    type: String,
    enum: Object.values(ContractLanguage),
    default: ContractLanguage.ENGLISH,
  },
  customTerms: {
    type: String,
    default: '',
  },
  version: {
    type: String,
    default: '1.0',
  },
  generatePdf: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
};

/**
 * Contract template data for generation
 * @typedef {Object} ContractTemplateData
 * @property {string} currentDate - Formatted current date
 * @property {string} contractId - Unique contract identifier
 * @property {Object} user - User information
 * @property {string} user.name - User's full name
 * @property {string} user.email - User's email
 * @property {string} user.phone - User's phone number
 * @property {Object} pet - Pet information
 * @property {string} pet.name - Pet's name
 * @property {string} pet.type - Pet's type/species
 * @property {string} pet.breed - Pet's breed
 * @property {string|number} pet.age - Pet's age
 * @property {string} pet.description - Pet's description
 * @property {Object} shelter - Shelter information
 * @property {string} shelter.name - Shelter's name
 * @property {string} shelter.address - Shelter's address
 * @property {string} shelter.phone - Shelter's phone
 * @property {string} shelter.email - Shelter's email
 * @property {string} additionalTerms - Additional custom terms
 */
export const ContractTemplateDataSchema = {
  currentDate: String,
  contractId: String,
  user: {
    name: String,
    email: String,
    phone: String,
  },
  pet: {
    name: String,
    type: String,
    breed: String,
    age: [String, Number],
    description: String,
  },
  shelter: {
    name: String,
    address: String,
    phone: String,
    email: String,
  },
  additionalTerms: String,
};

/**
 * Contract file information
 * @typedef {Object} ContractFile
 * @property {string} originalName - Original filename
 * @property {string} mimetype - MIME type of the file
 * @property {number} size - File size in bytes
 * @property {Buffer} [buffer] - File buffer data
 * @property {string} [url] - Cloud storage URL
 */
export const ContractFileSchema = {
  originalName: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  buffer: Buffer,
  url: String,
};

/**
 * Contract validation result
 * @typedef {Object} ContractValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {string[]} errors - Array of validation error messages
 */
export const ContractValidationResultSchema = {
  isValid: {
    type: Boolean,
    required: true,
  },
  errors: [String],
};

/**
 * Contract template information
 * @typedef {Object} ContractTemplateInfo
 * @property {ContractLanguage} language - Template language
 * @property {string} title - Template title
 * @property {string} description - Template description
 * @property {string} version - Template version
 */
export const ContractTemplateInfoSchema = {
  language: {
    type: String,
    enum: Object.values(ContractLanguage),
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  version: {
    type: String,
    required: true,
  },
};

// Export all schemas and enums
// All exports are now individual exports above
