import {
  asyncHandler,
  sendSuccessResponse,
} from '../../../middleware/responseHandler.js';
import {
  logSecurityEvent,
  logAdminAction,
  logDangerousAdminAction,
  SecurityEventType,
} from '../../../utils/securityLogger.js';
import { adminSettingsService } from '../services/settings.service.admin.js';

export const AdminGetSystemSettings = asyncHandler(async (req, res) => {
  const settings = await adminSettingsService.getSettings();

  // Log admin access to system settings
  await logAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_STATS_ACCESSED,
    req.user._id,
    'Accessed system settings',
    { settingsKeys: Object.keys(settings) },
    {},
    { ip: req.ip, userAgent: req.get('User-Agent') }
  );

  return sendSuccessResponse(
    res,
    200,
    'System settings retrieved successfully',
    settings
  );
});

export const AdminUpdateSystemSettings = asyncHandler(async (req, res) => {
  const settingsData = req.body;
  const updatedSettings =
    await adminSettingsService.updateSettings(settingsData);

  // Log dangerous admin action - system settings update
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_SETTINGS_UPDATED,
    req.user._id,
    'Updated system settings',
    {
      updatedKeys: Object.keys(settingsData),
      settingsCount: Object.keys(updatedSettings).length,
    },
    req.body.reason || 'No reason provided',
    {
      settingsData,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(
    res,
    200,
    'System settings updated successfully',
    updatedSettings
  );
});

export const AdminResetSystemSettings = asyncHandler(async (req, res) => {
  const resetSettings = await adminSettingsService.resetSettings();

  // Log dangerous admin action - system settings reset
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_SETTINGS_RESET,
    req.user._id,
    'Reset system settings to defaults',
    {
      resetKeys: Object.keys(resetSettings),
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
    'System settings reset to defaults successfully',
    resetSettings
  );
});

export const AdminGetSystemHealth = asyncHandler(async (req, res) => {
  const health = await adminSettingsService.getSystemHealth();

  // Log admin access to system health
  await logAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_STATS_ACCESSED,
    req.user._id,
    'Accessed system health status',
    { healthStatus: health.status },
    {},
    { ip: req.ip, userAgent: req.get('User-Agent') }
  );

  return sendSuccessResponse(
    res,
    200,
    'System health retrieved successfully',
    health
  );
});

export const AdminTestEmailConfiguration = asyncHandler(async (req, res) => {
  const result = await adminSettingsService.testEmailConfiguration();

  // Log admin action - email configuration test
  await logAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_TEST_PERFORMED,
    req.user._id,
    'Tested email configuration',
    { testResult: result.success },
    {},
    { ip: req.ip, userAgent: req.get('User-Agent') }
  );

  return sendSuccessResponse(
    res,
    200,
    result.success
      ? 'Email configuration test successful'
      : 'Email configuration test failed',
    result
  );
});

export const AdminTestDatabaseConnection = asyncHandler(async (req, res) => {
  const result = await adminSettingsService.testDatabaseConnection();

  // Log admin action - database connection test
  await logAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_TEST_PERFORMED,
    req.user._id,
    'Tested database connection',
    { testResult: result.success },
    {},
    { ip: req.ip, userAgent: req.get('User-Agent') }
  );

  return sendSuccessResponse(
    res,
    200,
    result.success
      ? 'Database connection test successful'
      : 'Database connection test failed',
    result
  );
});

export const AdminTestStorageConnection = asyncHandler(async (req, res) => {
  const result = await adminSettingsService.testStorageConnection();

  // Log admin action - storage connection test
  await logAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_TEST_PERFORMED,
    req.user._id,
    'Tested storage connection',
    { testResult: result.success },
    {},
    { ip: req.ip, userAgent: req.get('User-Agent') }
  );

  return sendSuccessResponse(
    res,
    200,
    result.success
      ? 'Storage connection test successful'
      : 'Storage connection test failed',
    result
  );
});

export const AdminExportSystemSettings = asyncHandler(async (req, res) => {
  const settings = await adminSettingsService.exportSettings();

  // Log admin action - settings export
  await logAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_SETTINGS_EXPORTED,
    req.user._id,
    'Exported system settings',
    { settingsCount: Object.keys(settings).length },
    {},
    { ip: req.ip, userAgent: req.get('User-Agent') }
  );

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="system-settings.json"'
  );
  return res.json(settings);
});

export const AdminImportSystemSettings = asyncHandler(async (req, res) => {
  const file = req.file;
  const result = await adminSettingsService.importSettings(file);

  // Log dangerous admin action - settings import
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_SETTINGS_IMPORTED,
    req.user._id,
    'Imported system settings from file',
    {
      importedKeys: Object.keys(result.settings),
      fileName: file.originalname,
    },
    req.body.reason || 'No reason provided',
    {
      fileName: file.originalname,
      fileSize: file.size,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(
    res,
    200,
    'System settings imported successfully',
    result
  );
});
