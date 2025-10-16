import express from 'express';
import {
  AdminGetAllUsers,
  AdminGetUserById,
  AdminUpdateUser,
  AdminDeleteUser,
  AdminGetSystemStats,
  AdminGetAllShelters,
  AdminGetAllAdmins,
  AdminUpdatePermissions,
  AdminGetSystemLogs,
  AdminCreateUser,
  AdminUpdateShelter,
  AdminDeleteShelter,
  AdminBanShelter,
  AdminUnbanShelter,
  AdminGetAllPets,
  AdminUpdatePet,
  AdminDeletePet,
  AdminRejectPet,
  AdminBulkApproveAllPets,
  AdminGetAllReviews,
  AdminUpdateReview,
  AdminDeleteReview,
  AdminGetAllAdoptions,
  AdminUpdateAdoption,
  AdminLockUser,
  AdminUnlockUser,
  AdminResetUserPassword,
  AdminGetPetLogs,
  AdminGetFlaggedPets,
  AdminGetReports,
  AdminGetReportById,
  AdminUpdateReportStatus,
  AdminApplyAdminAction,
  AdminGetReportStats,
  AdminGetAuditLogs,
  AdminGetActivityLogs,
  AdminGetSecurityLogs,
  AdminExportLogs,
  AdminGetSystemSettings,
  AdminUpdateSystemSettings,
  AdminResetSystemSettings,
  AdminGetSystemHealth,
  AdminTestEmailConfiguration,
  AdminTestDatabaseConnection,
  AdminTestStorageConnection,
  AdminExportSystemSettings,
  AdminImportSystemSettings,
} from './controllers/admin.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  AdminUpdateSchema,
  adminQueryValidationSchema,
  shelterUpdateSchema,
  petUpdateSchema,
  reviewUpdateSchema,
  adoptionUpdateSchema,
  reportsQuerySchema,
} from './admin.validation.js';
import { userRegistrationSchema } from '../user/user.validation.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { apiLimiter } from '../../middleware/rateLimiter.js';

export const adminRouter = express.Router();

// All admin routes require authentication and admin role
adminRouter.use(authenticate, authorize('admin'));

// System stats
adminRouter.get('/stats', AdminGetSystemStats);

// User management
adminRouter.get(
  '/users',
  validateRequest(adminQueryValidationSchema),
  AdminGetAllUsers
);
adminRouter.get('/users/:userId', AdminGetUserById);
adminRouter.put(
  '/users/:userId',
  validateRequest(AdminUpdateSchema),
  AdminUpdateUser
);
adminRouter.post(
  '/users',
  validateRequest(userRegistrationSchema),
  AdminCreateUser
);
adminRouter.delete('/users/:userId', AdminDeleteUser);

// User management - Lock/Unlock/Reset Password
adminRouter.post('/users/:userId/lock', AdminLockUser);
adminRouter.post('/users/:userId/unlock', AdminUnlockUser);
adminRouter.post('/users/:userId/reset-password', AdminResetUserPassword);

// Admin management
adminRouter.get('/admins', apiLimiter, AdminGetAllAdmins);
adminRouter.patch(
  '/admins/:id/permissions',
  apiLimiter,
  AdminUpdatePermissions
);

// System logs
adminRouter.get('/logs', AdminGetSystemLogs);

// Shelter management
adminRouter.get('/shelters', AdminGetAllShelters);
adminRouter.put(
  '/shelters/:shelterId',
  validateRequest(shelterUpdateSchema),
  AdminUpdateShelter
);
adminRouter.delete('/shelters/:shelterId', AdminDeleteShelter);

adminRouter.post('/shelters/:shelterId/ban', AdminBanShelter);
adminRouter.post('/shelters/:shelterId/unban', AdminUnbanShelter);

// Pet management
adminRouter.get('/pets', AdminGetAllPets);
adminRouter.get('/pets/flagged', AdminGetFlaggedPets);
adminRouter.put(
  '/pets/:petId',
  validateRequest(petUpdateSchema),
  AdminUpdatePet
);
adminRouter.delete('/pets/:petId', AdminDeletePet);

adminRouter.post('/pets/:petId/reject', AdminRejectPet);
adminRouter.post('/pets/bulk-approve-all', AdminBulkApproveAllPets);
adminRouter.get('/pets/:petId/logs', AdminGetPetLogs);

// Review management
adminRouter.get('/reviews', AdminGetAllReviews);
adminRouter.put(
  '/reviews/:reviewId',
  validateRequest(reviewUpdateSchema),
  AdminUpdateReview
);
adminRouter.delete('/reviews/:reviewId', AdminDeleteReview);

// Adoption management
adminRouter.get('/adoptions', AdminGetAllAdoptions);
adminRouter.put(
  '/adoptions/:adoptionId',
  validateRequest(adoptionUpdateSchema),
  AdminUpdateAdoption
);

// Report management
adminRouter.get('/reports', AdminGetReports);
adminRouter.get(
  '/reports/stats',
  validateRequest(reportsQuerySchema, 'query'),
  AdminGetReportStats
);
adminRouter.get('/reports/:reportId', AdminGetReportById);
adminRouter.put('/reports/:reportId/status', AdminUpdateReportStatus);
adminRouter.post('/reports/:reportId/action', AdminApplyAdminAction);

// Audit logs
adminRouter.get('/audit-logs', AdminGetAuditLogs);
adminRouter.get('/activity-logs', AdminGetActivityLogs);
adminRouter.get('/security-logs', AdminGetSecurityLogs);
adminRouter.get('/logs/export', AdminExportLogs);

// System settings management
adminRouter.get('/settings', AdminGetSystemSettings);
adminRouter.put('/settings', AdminUpdateSystemSettings);
adminRouter.post('/settings/reset', AdminResetSystemSettings);
adminRouter.get('/system/health', AdminGetSystemHealth);
adminRouter.post('/system/test-email', AdminTestEmailConfiguration);
adminRouter.post('/system/test-database', AdminTestDatabaseConnection);
adminRouter.post('/system/test-storage', AdminTestStorageConnection);
adminRouter.get('/settings/export', AdminExportSystemSettings);
adminRouter.post('/settings/import', AdminImportSystemSettings);
