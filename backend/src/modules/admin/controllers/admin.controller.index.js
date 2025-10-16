// User Management Controllers
export {
  AdminGetAllUsers,
  AdminGetUserById,
  AdminSearchUsers,
  AdminUpdateUser,
  AdminDeleteUser,
  AdminCreateUser,
  AdminGetAllAdmins,
  AdminUpdatePermissions,
  AdminLockUser,
  AdminUnlockUser,
  AdminResetUserPassword,
} from './admin.user.controller.js';

// Shelter Management Controllers
export {
  AdminGetAllShelters,
  AdminUpdateShelter,
  AdminDeleteShelter,
  AdminBanShelter,
  AdminUnbanShelter,
} from './admin.shelter.controller.js';

// Pet Management Controllers
export {
  AdminGetAllPets,
  AdminUpdatePet,
  AdminDeletePet,
  AdminRejectPet,
  AdminGetPetLogs,
  AdminGetFlaggedPets,
  AdminBulkApproveAllPets,
} from './admin.pet.controller.js';

// Review Management Controllers
export {
  AdminGetAllReviews,
  AdminUpdateReview,
  AdminDeleteReview,
} from './admin.review.controller.js';

// Adoption Management Controllers
export {
  AdminGetAllAdoptions,
  AdminUpdateAdoption,
} from './admin.adoption.controller.js';

// Report Management Controllers
export {
  AdminGetReports,
  AdminGetReportById,
  AdminUpdateReportStatus,
  AdminApplyAdminAction,
  AdminGetReportStats,
} from './admin.report.controller.js';

// Logs Management Controllers
export {
  AdminGetSystemStats,
  AdminGetSystemLogs,
  AdminGetAuditLogs,
  AdminGetActivityLogs,
  AdminGetSecurityLogs,
  AdminExportLogs,
} from './admin.logs.controller.js';

// Settings Management Controllers
export {
  AdminGetSystemSettings,
  AdminUpdateSystemSettings,
  AdminResetSystemSettings,
  AdminGetSystemHealth,
  AdminTestEmailConfiguration,
  AdminTestDatabaseConnection,
  AdminTestStorageConnection,
  AdminExportSystemSettings,
  AdminImportSystemSettings,
} from './admin.settings.controller.js';
