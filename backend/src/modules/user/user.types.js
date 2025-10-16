/**
 * User roles enum
 * @enum {string}
 */
export const UserRoleEnum = {
  USER: 'user',
  SHELTER: 'shelter',
  ADMIN: 'admin',
};

// Alias for backward compatibility
export const UserRole = UserRoleEnum;

/**
 * User preferences interface
 * @typedef {Object} UserPreferencesType
 * @property {string[]} petTypes - Array of preferred pet types
 * @property {Object} ageRange - Preferred age range for pets
 * @property {number} ageRange.min - Minimum age
 * @property {number} ageRange.max - Maximum age
 * @property {number} distance - Maximum distance for pet search
 */

/**
 * User location interface
 * @typedef {Object} UserLocationType
 * @property {string} type - Location type (Point)
 * @property {number[]} coordinates - [longitude, latitude]
 * @property {string} address - Human-readable address
 */

/**
 * Refresh token interface
 * @typedef {Object} RefreshTokenType
 * @property {string} token - The refresh token string
 * @property {Date} expires - Token expiration date
 */

/**
 * User interface
 * @typedef {Object} UserType
 * @property {string} email - User's email address
 * @property {string} password - Hashed password
 * @property {string} name - User's full name
 * @property {UserRoleEnum} role - User's role
 * @property {boolean} emailVerified - Whether email is verified
 * @property {string} [emailVerificationToken] - Email verification token
 * @property {Date} [emailVerificationExpires] - Email verification expiry
 * @property {string} [resetPasswordToken] - Password reset token
 * @property {Date} [resetPasswordExpires] - Password reset expiry
 * @property {Date} [lastLogin] - Last login timestamp
 * @property {boolean} isActive - Whether user is active
 * @property {string} phone - User's phone number
 * @property {string} [avatar] - User's avatar URL
 * @property {string} [bio] - User's bio
 * @property {UserPreferencesType} preferences - User preferences
 * @property {UserLocationType|null} location - User's location (nullable)
 * @property {string[]} favoritePets - Array of favorite pet IDs (ObjectId strings)
 * @property {string[]} viewedPets - Array of viewed pet IDs (ObjectId strings)
 * @property {RefreshTokenType[]} refreshTokens - Array of refresh tokens with expiration
 */

/**
 * Shelter interface
 * @typedef {Object} ShelterType
 * @property {string} name - Name of the shelter (consistent with UserType)
 * @property {Object} location - Shelter location with address details
 * @property {string} [bio] - Shelter description/bio
 * @property {string} [website] - Shelter website
 * @property {Object} operatingHours - Operating hours
 * @property {Object} operatingHours.monday - Monday hours
 * @property {string} operatingHours.monday.open - Opening time
 * @property {string} operatingHours.monday.close - Closing time
 * @property {Object} operatingHours.tuesday - Tuesday hours
 * @property {string} operatingHours.tuesday.open - Opening time
 * @property {string} operatingHours.tuesday.close - Closing time
 * @property {Object} operatingHours.wednesday - Wednesday hours
 * @property {string} operatingHours.wednesday.open - Opening time
 * @property {string} operatingHours.wednesday.close - Closing time
 * @property {Object} operatingHours.thursday - Thursday hours
 * @property {string} operatingHours.thursday.open - Opening time
 * @property {string} operatingHours.thursday.close - Closing time
 * @property {Object} operatingHours.friday - Friday hours
 * @property {string} operatingHours.friday.open - Opening time
 * @property {string} operatingHours.friday.close - Closing time
 * @property {Object} operatingHours.saturday - Saturday hours
 * @property {string} operatingHours.saturday.open - Opening time
 * @property {string} operatingHours.saturday.close - Closing time
 * @property {Object} operatingHours.sunday - Sunday hours
 * @property {string} operatingHours.sunday.open - Opening time
 * @property {string} operatingHours.sunday.close - Closing time
 */

/**
 * Operating hours interface for shelters
 * @typedef {Object} OperatingHoursType
 * @property {Object} monday - Monday hours
 * @property {string} monday.open - Opening time
 * @property {string} monday.close - Closing time
 * @property {Object} tuesday - Tuesday hours
 * @property {string} tuesday.open - Opening time
 * @property {string} tuesday.close - Closing time
 * @property {Object} wednesday - Wednesday hours
 * @property {string} wednesday.open - Opening time
 * @property {string} wednesday.close - Closing time
 * @property {Object} thursday - Thursday hours
 * @property {string} thursday.open - Opening time
 * @property {string} thursday.close - Closing time
 * @property {Object} friday - Friday hours
 * @property {string} friday.open - Opening time
 * @property {string} friday.close - Closing time
 * @property {Object} saturday - Saturday hours
 * @property {string} saturday.open - Opening time
 * @property {string} saturday.close - Closing time
 * @property {Object} sunday - Sunday hours
 * @property {string} sunday.open - Opening time
 * @property {string} sunday.close - Closing time
 */

/**
 * User registration data interface
 * @typedef {Object} UserRegistrationType
 * @property {string} email - User's email address
 * @property {string} password - User's password (will be hashed)
 * @property {string} name - User's full name
 * @property {string} phone - User's phone number
 * @property {UserRoleEnum} [role] - User's role (defaults to 'user')
 */

/**
 * User profile update data interface
 * @typedef {Object} UserProfileUpdateType
 * @property {string} [name] - User's full name
 * @property {string} [phone] - User's phone number
 * @property {string} [avatar] - User's avatar URL
 * @property {string} [bio] - User's bio
 * @property {UserLocationType} [location] - User's location
 * @property {UserPreferencesType} [preferences] - User preferences
 */

/**
 * Login credentials interface
 * @typedef {Object} LoginCredentialsType
 * @property {string} emailOrPhone - User's email or phone number
 * @property {string} password - User's password
 */

/**
 * Authentication response interface
 * @typedef {Object} AuthResponseType
 * @property {UserType} user - User object
 * @property {string} token - JWT token
 */

// Export type definitions for JSDoc (these are available globally when imported)
export const UserTypes = {
  UserPreferencesType: /** @type {UserPreferencesType} */ ({}),
  UserLocationType: /** @type {UserLocationType} */ ({}),
  RefreshTokenType: /** @type {RefreshTokenType} */ ({}),
  UserType: /** @type {UserType} */ ({}),
  ShelterType: /** @type {ShelterType} */ ({}),
  OperatingHoursType: /** @type {OperatingHoursType} */ ({}),
  UserRegistrationType: /** @type {UserRegistrationType} */ ({}),
  UserProfileUpdateType: /** @type {UserProfileUpdateType} */ ({}),
  LoginCredentialsType: /** @type {LoginCredentialsType} */ ({}),
  AuthResponseType: /** @type {AuthResponseType} */ ({}),
};

// Default export for backward compatibility
export default {
  UserRoleEnum,
  UserRole,
  UserTypes,
};
