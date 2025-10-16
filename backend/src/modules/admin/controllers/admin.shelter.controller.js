import {
  asyncHandler,
  sendSuccessResponse,
} from '../../../middleware/responseHandler.js';
import {
  logAdminAction,
  logDangerousAdminAction,
  SecurityEventType,
} from '../../../utils/securityLogger.js';
import { adminShelterService } from '../services/shelter.service.admin.js';

export const AdminGetAllShelters = asyncHandler(async (req, res) => {
  const filters = req.query;
  const shelters = await adminShelterService.getAll(filters);

  // Log admin access to shelter data
  await logAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_STATS_ACCESSED,
    req.user._id,
    'Accessed all shelters list',
    { shelterCount: shelters.length, filters },
    {},
    { ip: req.ip, userAgent: req.get('User-Agent') }
  );

  return sendSuccessResponse(
    res,
    200,
    'Shelters retrieved successfully',
    shelters
  );
});

export const AdminUpdateShelter = asyncHandler(async (req, res) => {
  const { shelterId } = req.params;
  const shelter = await adminShelterService.update(shelterId, req.body);

  // Log dangerous admin action - shelter modification
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.SHELTER_UPDATED,
    req.user._id,
    'Updated shelter profile',
    {
      targetShelterId: shelterId,
      targetShelterName: shelter.name,
      targetShelterEmail: shelter.email,
    },
    req.body.reason || 'No reason provided',
    {
      changes: req.body,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(res, 200, 'Shelter updated successfully', shelter);
});

export const AdminDeleteShelter = asyncHandler(async (req, res) => {
  const { shelterId } = req.params;

  // Get shelter info before deletion for logging
  const { Shelter } = await import('../../user/user.model.js');
  const shelterToDelete =
    await Shelter.findById(shelterId).select('name email status');

  await adminShelterService.delete(shelterId);

  // Log dangerous admin action - shelter deletion
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.SHELTER_DELETED,
    req.user._id,
    'Deleted shelter account',
    {
      targetShelterId: shelterId,
      targetShelterName: shelterToDelete?.name,
      targetShelterEmail: shelterToDelete?.email,
      targetShelterStatus: shelterToDelete?.status,
    },
    req.body.reason || 'No reason provided',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(res, 200, 'Shelter deleted successfully');
});

export const AdminBanShelter = asyncHandler(async (req, res) => {
  const { shelterId } = req.params;
  const { reason } = req.body;

  // Get shelter info before banning for logging
  const { Shelter } = await import('../../user/user.model.js');
  const shelterToBan =
    await Shelter.findById(shelterId).select('name email status');

  const shelter = await adminShelterService.ban(shelterId, reason);

  // Log dangerous admin action - shelter banning
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.SHELTER_BANNED,
    req.user._id,
    'Banned shelter account',
    {
      targetShelterId: shelterId,
      targetShelterName: shelterToBan?.name,
      targetShelterEmail: shelterToBan?.email,
      targetShelterStatus: shelterToBan?.status,
    },
    reason || 'No reason provided',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(res, 200, 'Shelter banned successfully', shelter);
});

export const AdminUnbanShelter = asyncHandler(async (req, res) => {
  const { shelterId } = req.params;

  // Get shelter info before unbanning for logging
  const { Shelter } = await import('../../user/user.model.js');
  const shelterToUnban =
    await Shelter.findById(shelterId).select('name email status');

  const shelter = await adminShelterService.unban(shelterId);

  // Log dangerous admin action - shelter unbanning
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.SHELTER_UNBANNED,
    req.user._id,
    'Unbanned shelter account',
    {
      targetShelterId: shelterId,
      targetShelterName: shelterToUnban?.name,
      targetShelterEmail: shelterToUnban?.email,
      targetShelterStatus: shelterToUnban?.status,
    },
    req.body.reason || 'No reason provided',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(
    res,
    200,
    'Shelter unbanned successfully',
    shelter
  );
});
