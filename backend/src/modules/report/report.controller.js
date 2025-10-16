import { catchAsync } from '../../middleware/async.js';
import logger from '../../utils/logger.js';
import { ApiError } from '../../utils/errors.js';
import {
  logSecurityEvent,
  SecurityEventType,
} from '../../utils/securityLogger.js';
import { logUserActivity } from '../../utils/activityLogger.js';
import * as reportService from './report.service.js';

export const createReport = async (req, res) => {
  try {
    const report = await reportService.createReport(req.user._id, req.body);

    logSecurityEvent(SecurityEventType.USER.REPORTED, {
      reporterId: req.user._id,
      reportedUserId: req.body.reportedUserId,
      reason: req.body.reason,
    });

    // Log activity
    await logUserActivity(req.user, 'user_reported', req, {
      reportedUserId: req.body.reportedUserId,
      reason: req.body.reason,
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: report,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to create report');
  }
};

export const getReports = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      reason: req.query.reason,
      reportedUserId: req.query.reportedUserId,
    };

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };

    const result = await reportService.getReports(filters, options);
    res.json({
      success: true,
      data: result.reports,
      pagination: result.pagination,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get reports');
  }
};

export const getReportById = async (req, res) => {
  try {
    const report = await reportService.getReportById(req.params.reportId);
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get report');
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const report = await reportService.updateReportStatus(
      req.params.reportId,
      status,
      req.user._id,
      adminNotes
    );

    logSecurityEvent(SecurityEventType.REPORT.STATUS_UPDATED, {
      adminId: req.user._id,
      reportId: req.params.reportId,
      status,
    });

    // Log activity
    await logUserActivity(req.user, 'report_status_updated', req, {
      reportId: req.params.reportId,
      oldStatus: report.status,
      newStatus: status,
    });

    res.json({
      success: true,
      message: 'Report status updated successfully',
      data: report,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to update report status');
  }
};

export const applyAdminAction = async (req, res) => {
  try {
    const { action, actionDetails } = req.body;
    const report = await reportService.applyAdminAction(
      req.params.reportId,
      action,
      actionDetails,
      req.user._id
    );

    logSecurityEvent(SecurityEventType.REPORT.ACTION_APPLIED, {
      adminId: req.user._id,
      reportId: req.params.reportId,
      action,
      reportedUserId: report.reportedUser.id,
    });

    // Log activity
    await logUserActivity(req.user, 'admin_action_applied', req, {
      reportId: req.params.reportId,
      action,
      details: actionDetails,
    });

    res.json({
      success: true,
      message: 'Admin action applied successfully',
      data: report,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to apply admin action');
  }
};

export const getReportStats = async (req, res) => {
  try {
    const stats = await reportService.getReportStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get report statistics');
  }
};

export const getReportsByUser = async (req, res) => {
  try {
    const reports = await reportService.getReportsByUser(req.params.userId);
    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get reports by user');
  }
};

export const getReportsByReporter = async (req, res) => {
  try {
    const reports = await reportService.getReportsByReporter(req.user._id);
    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get reports by reporter');
  }
};

// Export controller object
export const reportController = {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  applyAdminAction,
  getReportStats,
  getReportsByUser,
  getReportsByReporter,
};
