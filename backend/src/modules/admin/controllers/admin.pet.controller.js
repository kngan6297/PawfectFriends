import {
  asyncHandler,
  sendSuccessResponse,
} from '../../../middleware/responseHandler.js';
import {
  logAdminAction,
  logDangerousAdminAction,
  SecurityEventType,
} from '../../../utils/securityLogger.js';
import { adminPetService } from '../services/pet.service.admin.js';
import { getPetEditLogs, getFlaggedPets } from '../../pet/pet.service.js';

export const AdminGetAllPets = asyncHandler(async (req, res) => {
  const filters = req.query;
  const pets = await adminPetService.getAll(filters);

  // Log admin access to pet data
  await logAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_STATS_ACCESSED,
    req.user._id,
    'Accessed all pets list',
    { petCount: pets.length, filters },
    {},
    { ip: req.ip, userAgent: req.get('User-Agent') }
  );

  return sendSuccessResponse(res, 200, 'Pets retrieved successfully', pets);
});

export const AdminUpdatePet = asyncHandler(async (req, res) => {
  const { petId } = req.params;

  // Get pet info before update for logging
  const { Pet } = await import('../../pet/pet.model.js');
  const petToUpdate = await Pet.findById(petId).select(
    'name type breed shelter status'
  );

  const pet = await adminPetService.update(petId, req.body, req.user._id);

  // Log dangerous admin action - pet modification
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.PET_UPDATED,
    req.user._id,
    'Updated pet profile',
    {
      targetPetId: petId,
      targetPetName: petToUpdate?.name,
      targetPetType: petToUpdate?.type,
      targetPetBreed: petToUpdate?.breed,
      targetPetShelter: petToUpdate?.shelter,
      targetPetStatus: petToUpdate?.status,
    },
    req.body.reason || 'No reason provided',
    {
      changes: req.body,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(res, 200, 'Pet updated successfully', pet);
});

export const AdminDeletePet = asyncHandler(async (req, res) => {
  const { petId } = req.params;

  // Get pet info before deletion for logging
  const { Pet } = await import('../../pet/pet.model.js');
  const petToDelete = await Pet.findById(petId).select(
    'name type breed shelter status'
  );

  await adminPetService.delete(petId);

  // Log dangerous admin action - pet deletion
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.PET_DELETED,
    req.user._id,
    'Deleted pet profile',
    {
      targetPetId: petId,
      targetPetName: petToDelete?.name,
      targetPetType: petToDelete?.type,
      targetPetBreed: petToDelete?.breed,
      targetPetShelter: petToDelete?.shelter,
      targetPetStatus: petToDelete?.status,
    },
    req.body.reason || 'No reason provided',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(res, 200, 'Pet deleted successfully');
});

export const AdminRejectPet = asyncHandler(async (req, res) => {
  const { petId } = req.params;
  const { reason } = req.body;

  // Get pet info before rejection for logging
  const { Pet } = await import('../../pet/pet.model.js');
  const petToReject = await Pet.findById(petId).select(
    'name type breed shelter status'
  );

  const pet = await adminPetService.reject(petId, reason, req.user._id);

  // Log dangerous admin action - pet rejection
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.PET_REJECTED,
    req.user._id,
    'Rejected pet profile',
    {
      targetPetId: petId,
      targetPetName: petToReject?.name,
      targetPetType: petToReject?.type,
      targetPetBreed: petToReject?.breed,
      targetPetShelter: petToReject?.shelter,
      targetPetStatus: petToReject?.status,
    },
    reason || 'No reason provided',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(res, 200, 'Pet rejected successfully', pet);
});

export const AdminGetPetLogs = asyncHandler(async (req, res) => {
  const { petId } = req.params;
  const editLogs = await getPetEditLogs(petId);

  // Log admin access to pet logs
  await logAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_LOGS_ACCESSED,
    req.user._id,
    'Accessed pet edit logs',
    { targetPetId: petId, logCount: editLogs.length },
    {},
    { ip: req.ip, userAgent: req.get('User-Agent') }
  );

  return sendSuccessResponse(
    res,
    200,
    'Pet logs retrieved successfully',
    editLogs
  );
});

export const AdminGetFlaggedPets = asyncHandler(async (req, res) => {
  const filters = req.query;
  const pets = await getFlaggedPets(filters);

  // Log admin access to flagged pets
  await logAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_STATS_ACCESSED,
    req.user._id,
    'Accessed flagged pets list',
    { flaggedPetCount: pets.length, filters },
    {},
    { ip: req.ip, userAgent: req.get('User-Agent') }
  );

  return sendSuccessResponse(
    res,
    200,
    'Flagged pets retrieved successfully',
    pets
  );
});

export const AdminBulkApproveAllPets = asyncHandler(async (req, res) => {
  const result = await adminPetService.bulkApproveAll(req.user._id);

  // Log dangerous admin action - bulk pet approval
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.PET_UPDATED,
    req.user._id,
    'Bulk approved all pending pets',
    {
      petsApproved: result.modifiedCount,
    },
    'Bulk approval of all pending pets',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(res, 200, result.message, {
    approvedCount: result.modifiedCount,
  });
});
