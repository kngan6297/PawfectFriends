import { ApiError } from '../utils/errors.js';
import { User } from '../modules/user/user.model.js';
import { validateAndThrow } from './validateRequest.js';

/**
 * Shelter Access Middleware
 * Handles shelter ID logic for different user roles
 */

/**
 * Middleware to determine and validate shelter ID for operations
 * @param {Object} options - Configuration options
 * @param {string} options.paramName - Parameter name for shelter ID (default: 'shelterId')
 * @param {string} options.bodyField - Body field name for shelter ID (default: 'shelterId')
 * @param {boolean} options.allowAdminOverride - Whether admins can override shelter ID (default: true)
 * @param {boolean} options.requireShelter - Whether shelter ID is required (default: true)
 * @returns {Function} Express middleware function
 */
export const handleShelterAccess = (options = {}) => {
  const {
    paramName = 'shelterId',
    bodyField = 'shelterId',
    allowAdminOverride = true,
    requireShelter = true,
  } = options;

  return async (req, res, next) => {
    try {
      let shelterId = null;

      // Determine shelter ID based on user role and request
      if (req.user.role === 'admin' && allowAdminOverride) {
        // Admin can specify shelter ID in body or params
        shelterId =
          req.body[bodyField] || req.params[paramName] || req.query[paramName];

        if (shelterId) {
          // Validate the provided shelter ID
          validateAndThrow(shelterId, 'shelter ID');

          // Verify the shelter exists and is a valid shelter
          const shelter = await User.findOne({
            _id: shelterId,
            role: 'shelter',
          }).select('_id name email');

          if (!shelter) {
            throw ApiError.badRequest('Invalid shelter ID provided');
          }

          // Store the target shelter info for logging/auditing
          req.targetShelter = shelter;
        }
      }

      // If no shelter ID specified (for admin) or user is not admin, use user's shelter
      if (!shelterId) {
        if (req.user.role === 'shelter') {
          shelterId = req.user._id;
        } else if (req.user.role === 'admin') {
          // Admin without specified shelter - this might be for global operations
          shelterId = null;
        } else {
          throw ApiError.forbidden('Shelter access required');
        }
      }

      // Validate shelter ID is required if specified
      if (requireShelter && !shelterId) {
        throw ApiError.badRequest('Shelter ID is required');
      }

      // Attach shelter ID to request for use in controllers
      req.shelterId = shelterId;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to validate shelter ownership for specific operations
 * @param {Object} options - Configuration options
 * @param {string} options.resourceParam - Parameter name for resource ID (e.g., 'petId')
 * @param {string} options.resourceModel - Model name for the resource
 * @returns {Function} Express middleware function
 */
export const validateShelterOwnership = (options = {}) => {
  const { resourceParam = 'petId', resourceModel = 'Pet' } = options;

  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceParam];
      if (!resourceId) {
        throw ApiError.badRequest(`${resourceParam} is required`);
      }

      // Validate resource ID format
      validateAndThrow(resourceId, resourceParam);

      // Import the model dynamically
      const modelModule = await import(
        `../modules/${resourceModel.toLowerCase()}/${resourceModel.toLowerCase()}.model.js`
      );

      // Handle both default and named exports
      const Model = modelModule.default || modelModule[resourceModel];

      // Find the resource and check ownership
      const resource = await Model.findById(resourceId);
      if (!resource) {
        throw ApiError.notFound(`${resourceModel} not found`);
      }

      // Check if user has access to this resource
      const hasAccess = await checkResourceAccess(
        req.user,
        resource,
        req.shelterId
      );
      if (!hasAccess) {
        throw ApiError.forbidden('Access denied to this resource');
      }

      // Attach resource to request for use in controllers
      req.resource = resource;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has access to a specific resource
 * @param {Object} user - User object
 * @param {Object} resource - Resource object
 * @param {string} shelterId - Shelter ID to check against
 * @returns {Promise<boolean>} True if user has access
 */
async function checkResourceAccess(user, resource, shelterId) {
  // Admin has access to all resources
  if (user.role === 'admin') {
    return true;
  }

  // Shelter users can only access their own resources
  if (user.role === 'shelter') {
    // Check if resource belongs to the user's shelter
    if (
      resource.shelter &&
      resource.shelter.toString() === user._id.toString()
    ) {
      return true;
    }

    // Check if resource belongs to the specified shelter (for admin operations)
    if (
      shelterId &&
      resource.shelter &&
      resource.shelter.toString() === shelterId.toString()
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Middleware to log shelter operations for audit purposes
 * @returns {Function} Express middleware function
 */
export const logShelterOperation = () => {
  return (req, res, next) => {
    // Log the operation for audit purposes
    const operation = {
      userId: req.user._id,
      userRole: req.user.role,
      targetShelterId: req.shelterId,
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    };

    // If admin is operating on behalf of another shelter, log it
    if (req.user.role === 'admin' && req.targetShelter) {
      operation.adminOperation = true;
      operation.targetShelterName = req.targetShelter.name;
    }

    // You can log this to a database, file, or external service
    console.log('Shelter Operation:', operation);

    next();
  };
};

/**
 * Helper function to get shelter ID for different scenarios
 * @param {Object} req - Express request object
 * @returns {string|null} Shelter ID
 */
export const getShelterId = (req) => {
  // If shelter ID is already determined by middleware
  if (req.shelterId) {
    return req.shelterId;
  }

  // Fallback logic
  if (req.user.role === 'shelter') {
    return req.user._id;
  }

  return null;
};

/**
 * Helper function to check if user can access a specific shelter
 * @param {Object} user - User object
 * @param {string} shelterId - Shelter ID to check
 * @returns {boolean} True if user can access the shelter
 */
export const canAccessShelter = (user, shelterId) => {
  // Admin can access any shelter
  if (user.role === 'admin') {
    return true;
  }

  // Shelter users can only access their own shelter
  if (user.role === 'shelter') {
    return user._id.toString() === shelterId.toString();
  }

  return false;
};
