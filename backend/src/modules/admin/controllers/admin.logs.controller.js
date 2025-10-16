import {
  asyncHandler,
  sendSuccessResponse,
} from '../../../middleware/responseHandler.js';
import { User } from '../../user/user.model.js';
import {
  logAdminAction,
  logDangerousAdminAction,
  SecurityEventType,
} from '../../../utils/securityLogger.js';
import { adminSystemService } from '../services/system.service.admin.js';
import {
  getAuditLogs,
  getActivityLogs,
  getSecurityLogs,
  exportLogs,
} from '../../monitoring/monitoring.service.js';

export const AdminGetSystemStats = asyncHandler(async (req, res) => {
  const stats = await adminSystemService.getStats();

  // Log dangerous admin action - system stats access
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_STATS_ACCESSED,
    req.user._id,
    'Accessed system statistics',
    { stats },
    'System monitoring',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(
    res,
    200,
    'System stats retrieved successfully',
    stats
  );
});

export const AdminGetSystemLogs = asyncHandler(async (req, res) => {
  const { startDate, endDate, action } = req.query;
  const query = {};

  if (startDate && endDate) {
    query.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  if (action) {
    query.action = action;
  }

  const logs = await User.aggregate([
    { $unwind: '$accessLogs' },
    { $match: query },
    { $sort: { 'accessLogs.timestamp': -1 } },
    { $limit: 100 },
  ]);

  // Log dangerous admin action - system logs access
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_LOGS_ACCESSED,
    req.user._id,
    'Accessed system logs',
    {
      logCount: logs.length,
      startDate,
      endDate,
      action,
    },
    'System monitoring',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(
    res,
    200,
    'System logs retrieved successfully',
    logs
  );
});

export const AdminGetAuditLogs = asyncHandler(async (req, res) => {
  const filters = req.query;
  const result = await getAuditLogs(filters);

  // Log dangerous admin action - audit logs access
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.AUDIT_LOGS_ACCESSED,
    req.user._id,
    'Accessed audit logs',
    {
      logCount: result.logs.length,
      filters,
    },
    'Security monitoring',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(
    res,
    200,
    'Audit logs retrieved successfully',
    result
  );
});

export const AdminGetActivityLogs = asyncHandler(async (req, res) => {
  const filters = req.query;
  const result = await getActivityLogs(filters);

  // Log dangerous admin action - activity logs access
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.SYSTEM_LOGS_ACCESSED,
    req.user._id,
    'Accessed activity logs',
    {
      logCount: result.logs.length,
      filters,
    },
    'Activity monitoring',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(
    res,
    200,
    'Activity logs retrieved successfully',
    result
  );
});

export const AdminGetSecurityLogs = asyncHandler(async (req, res) => {
  const filters = req.query;
  const result = await getSecurityLogs(filters);

  // Log dangerous admin action - security logs access
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.SECURITY_LOGS_ACCESSED,
    req.user._id,
    'Accessed security logs',
    {
      logCount: result.logs.length,
      filters,
    },
    'Security monitoring',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(
    res,
    200,
    'Security logs retrieved successfully',
    result
  );
});

export const AdminExportLogs = asyncHandler(async (req, res) => {
  const filters = req.query;
  const logs = await exportLogs(filters);

  // Log dangerous admin action - log export
  await logDangerousAdminAction(
    SecurityEventType.ADMIN_ACTION.DATA_EXPORTED,
    req.user._id,
    'Exported system logs',
    {
      logCount: logs.length,
      filters,
    },
    'Data export',
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  );

  return sendSuccessResponse(res, 200, 'Logs exported successfully', logs);
});
