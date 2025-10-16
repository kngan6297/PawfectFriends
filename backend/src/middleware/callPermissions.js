import { ApiError } from '../utils/errors.js';
import CallService from '../modules/chat/services/call.service.js';
import logger from '../utils/logger.js';

/**
 * Middleware to check call permissions before allowing Zego token generation
 */
export const checkCallPermission = async (req, res, next) => {
  try {
    const {
      scene,
      roomId,
      callerId,
      calleeId,
      chatId,
      adoptionRequestId,
      callType,
    } = req.body;

    // Only apply call permission checks for call scenes
    if (scene !== 'call') {
      return next();
    }

    const userId = req.user._id;

    // Validate required call context
    if (!roomId && (!callerId || !calleeId)) {
      return next(
        new ApiError.badRequest(
          'Missing required call context (roomId or callerId/calleeId)'
        )
      );
    }

    // Ensure user is the caller
    if (callerId && String(userId) !== String(callerId)) {
      return next(
        new ApiError.forbidden('Cannot issue call token for another user')
      );
    }

    try {
      // Use existing CallService validation logic
      if (roomId) {
        // RoomId-based validation
        await CallService.validateCallPermissions(userId, roomId, callType);
      } else {
        // CallerId/CalleeId-based validation
        await CallService.validateCallPermissions(
          userId,
          calleeId,
          callType,
          chatId
        );
      }

      logger.info('✅ Call permission validated for Zego token', {
        userId,
        scene,
        roomId,
        callerId,
        calleeId,
        chatId,
        adoptionRequestId,
        callType,
      });

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError.forbidden('Call permission validation failed');
    }
  } catch (error) {
    logger.error('❌ Call permission middleware error:', error);
    next(error);
  }
};

/**
 * Middleware to log call attempts for security monitoring
 */
export const logCallAttempt = (req, res, next) => {
  const {
    scene,
    roomId,
    callerId,
    calleeId,
    chatId,
    adoptionRequestId,
    callType,
  } = req.body;
  const userId = req.user?._id;

  if (scene === 'call') {
    logger.info('📞 Call attempt logged', {
      userId,
      roomId,
      callerId,
      calleeId,
      chatId,
      adoptionRequestId,
      callType,
      timestamp: new Date().toISOString(),
    });
  }

  next();
};
