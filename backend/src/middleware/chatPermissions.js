import chatPermissionsService from '../services/chatPermissions.service.js';
import { AppError } from '../utils/errors.js';

/**
 * Middleware to check chat/call permissions before allowing communication
 */
const checkCommunicationPermission = async (req, res, next) => {
  try {
    const { targetUserId, targetShelterId, contextType, contextId } = req.body;
    const initiatorId = req.user?._id;

    // Determine target ID (could be user or shelter)
    const targetId = targetUserId || targetShelterId;

    if (!targetId) {
      return next(new AppError('Target user or shelter ID is required', 400));
    }

    // Check permissions
    const permissionResult = await chatPermissionsService.canCommunicate(
      initiatorId,
      targetId,
      contextType || 'general',
      contextId || null
    );

    if (!permissionResult.allowed) {
      return next(
        new AppError(
          permissionResult.reason || 'Communication not allowed',
          403
        )
      );
    }

    // Add permission info to request for logging
    req.communicationPermission = permissionResult;
    next();
  } catch (error) {
    console.error('Error checking communication permission:', error);
    return next(new AppError('Permission check failed', 500));
  }
};

/**
 * Middleware to check permissions for joining existing rooms/calls
 */
const checkJoinPermission = async (req, res, next) => {
  try {
    const { roomId, callId } = req.body || req.params;
    const userId = req.user._id;

    // For now, allow if user is authenticated
    // In production, you'd check room/call participants and permissions
    if (!userId) {
      return next(
        new AppError('Authentication required to join room/call', 401)
      );
    }

    // Additional room/call specific permission checks can be added here
    next();
  } catch (error) {
    console.error('Error checking join permission:', error);
    return next(new AppError('Permission check failed', 500));
  }
};

/**
 * Middleware to validate user role and authentication
 */
const requireAuthentication = (req, res, next) => {
  if (!req.user || !req.user._id) {
    return next(
      new AppError('Authentication required for communication features', 401)
    );
  }

  // Block guest users
  if (req.user.role === 'guest') {
    return next(
      new AppError(
        'Guests cannot use chat/call features. Please register or log in.',
        403
      )
    );
  }

  next();
};

/**
 * Middleware to check admin permissions
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};

/**
 * Middleware to log communication attempts for security monitoring
 */
const logCommunicationAttempt = (req, res, next) => {
  const { targetUserId, targetShelterId, contextType, contextId } = req.body;
  const initiatorId = req.user?._id;
  const targetId = targetUserId || targetShelterId;

  console.log(
    `Communication attempt: ${initiatorId} -> ${targetId}, context: ${contextType}, id: ${contextId}`
  );

  // In production, you might want to store this in a security log table
  next();
};

export {
  checkCommunicationPermission,
  checkJoinPermission,
  requireAuthentication,
  requireAdmin,
  logCommunicationAttempt,
};
