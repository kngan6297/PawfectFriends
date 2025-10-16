import {
  asyncHandler,
  sendSuccessResponse,
} from '../../../middleware/responseHandler.js';
import { adminAdoptionService } from '../services/adoption.service.admin.js';

export const AdminGetAllAdoptions = asyncHandler(async (req, res) => {
  const filters = req.query;
  const adoptions = await adminAdoptionService.getAll(filters);
  return sendSuccessResponse(
    res,
    200,
    'Adoptions retrieved successfully',
    adoptions
  );
});

export const AdminUpdateAdoption = asyncHandler(async (req, res) => {
  const { adoptionId } = req.params;
  const adoption = await adminAdoptionService.update(adoptionId, req.body);
  return sendSuccessResponse(
    res,
    200,
    'Adoption updated successfully',
    adoption
  );
});
