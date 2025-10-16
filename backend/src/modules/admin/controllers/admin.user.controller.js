import {
  asyncHandler,
  sendSuccessResponse,
  sendErrorResponse,
} from '../../../middleware/responseHandler.js';
import logger from '../../../utils/logger.js';
import { User } from '../../user/user.model.js';
import {
  logSecurityEvent,
  logAdminAction,
  logDangerousAdminAction,
  SecurityEventType,
} from '../../../utils/securityLogger.js';
import { adminUserService } from '../services/user.service.admin.js';

export const AdminGetAllUsers = asyncHandler(async (req, res) => {
  const filters = req.query;
  const result = await adminUserService.getAll(filters);

  // Log admin access to user data
  await logAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_STATS_ACCESSED,
    req.user._id,
    'Accessed all users list',
    { userCount: result.users.length, filters },
    {},
    { ip: req.ip, userAgent: req.get('User-Agent') }
  );

  return sendSuccessResponse(res, 200, 'Users retrieved successfully', result);
});

export const AdminGetUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await adminUserService.getById(userId);

  // Log admin access to specific user data
  await logAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_STATS_ACCESSED,
    req.user._id,
    'Accessed user details',
    { targetUserId: userId, userName: user.name },
    {},
    { ip: req.ip, userAgent: req.get('User-Agent') }
  );

  return sendSuccessResponse(res, 200, 'User retrieved successfully', user);
});

export const AdminSearchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
    ],
  };

  const users = await User.find(searchQuery)
    .select('-password -emailVerificationToken -resetPasswordToken')
    .sort({ createdAt: -1 });

  // Log admin search action
  await logAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_STATS_ACCESSED,
    req.user._id,
    'Searched users',
    { searchQuery: query, resultCount: users.length },
    {},
    { ip: req.ip, userAgent: req.get('User-Agent') }
  );

  return sendSuccessResponse(res, 200, 'Users found successfully', users);
});

export const AdminUpdateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await adminUserService.update(userId, req.body);

  // Log dangerous admin action - user modification
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.USER_UPDATED,
    req.user._id,
    'Updated user profile',
    {
      targetUserId: userId,
      targetUserEmail: user.email,
      targetUserName: user.name,
    },
    req.body.reason || 'No reason provided',
    {
      changes: req.body,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(res, 200, 'User updated successfully', user);
});

export const AdminDeleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Get user info before deletion for logging
  const userToDelete = await User.findById(userId).select('name email role');

  await adminUserService.delete(userId);

  // Log dangerous admin action - user deletion
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.USER_DELETED,
    req.user._id,
    'Deleted user account',
    {
      targetUserId: userId,
      targetUserEmail: userToDelete?.email,
      targetUserName: userToDelete?.name,
      targetUserRole: userToDelete?.role,
    },
    req.body.reason || 'No reason provided',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(res, 200, 'User deleted successfully');
});

export const AdminCreateUser = asyncHandler(async (req, res) => {
  const user = await adminUserService.create(req.body);

  // Log admin action - user creation
  await logAdminAction(
    SecurityEventType.ADMIN_ACTION.USER_CREATED,
    req.user._id,
    'Created new user account',
    {
      newUserId: user._id,
      newUserEmail: user.email,
      newUserName: user.name,
      newUserRole: user.role,
    },
    req.body,
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(res, 201, 'User created successfully', user);
});

export const AdminGetAllAdmins = asyncHandler(async (req, res) => {
  const admins = await adminUserService.getAllAdmins();

  // Log admin access to admin list
  await logAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_STATS_ACCESSED,
    req.user._id,
    'Accessed admin users list',
    { adminCount: admins.length },
    {},
    { ip: req.ip, userAgent: req.get('User-Agent') }
  );

  return sendSuccessResponse(res, 200, 'Admins retrieved successfully', admins);
});

export const AdminUpdatePermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const admin = await User.findById(id);

  if (!admin) {
    return sendErrorResponse(res, 404, 'Admin not found');
  }

  // Log dangerous admin action - permission modification
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.USER_PERMISSIONS_UPDATED,
    req.user._id,
    'Updated admin permissions',
    {
      targetAdminId: id,
      targetAdminEmail: admin.email,
      targetAdminName: admin.name,
    },
    req.body.reason || 'No reason provided',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  // Admin role provides full access, no granular permissions needed
  const data = {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    note: 'Admin role grants complete system access without granular permissions',
  };

  return sendSuccessResponse(
    res,
    200,
    'Admin role provides full system access',
    data
  );
});

export const AdminLockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  // Get user info before locking for logging
  const userToLock = await User.findById(userId).select('name email role');

  const user = await adminUserService.lock(userId, reason);

  // Log dangerous admin action - user locking
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.USER_LOCKED,
    req.user._id,
    'Locked user account',
    {
      targetUserId: userId,
      targetUserEmail: userToLock?.email,
      targetUserName: userToLock?.name,
      targetUserRole: userToLock?.role,
    },
    reason || 'No reason provided',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(res, 200, 'User locked successfully', user);
});

export const AdminUnlockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Get user info before unlocking for logging
  const userToUnlock = await User.findById(userId).select('name email role');

  const user = await adminUserService.unlock(userId);

  // Log dangerous admin action - user unlocking
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.USER_UNLOCKED,
    req.user._id,
    'Unlocked user account',
    {
      targetUserId: userId,
      targetUserEmail: userToUnlock?.email,
      targetUserName: userToUnlock?.name,
      targetUserRole: userToUnlock?.role,
    },
    req.body.reason || 'No reason provided',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(res, 200, 'User unlocked successfully', user);
});

export const AdminResetUserPassword = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;

  // Get user info before password reset for logging
  const userToReset = await User.findById(userId).select('name email role');

  const result = await adminUserService.resetPassword(userId, newPassword);

  // Log dangerous admin action - password reset
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.USER_PASSWORD_RESET,
    req.user._id,
    'Reset user password',
    {
      targetUserId: userId,
      targetUserEmail: userToReset?.email,
      targetUserName: userToReset?.name,
      targetUserRole: userToReset?.role,
    },
    req.body.reason || 'No reason provided',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(res, 200, result.message);
});
