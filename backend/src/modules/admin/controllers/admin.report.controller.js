import {
  asyncHandler,
  sendSuccessResponse,
} from '../../../middleware/responseHandler.js';
import {
  getReports,
  getReportById,
  updateReportStatus,
  applyAdminAction,
  getReportStats,
} from '../../report/report.service.js';
import { Report } from '../../report/report.model.js';
import { User, Shelter } from '../../user/user.model.js';
import { Pet } from '../../pet/pet.model.js';
import { AdoptionRequest } from '../../adoption/adoption.model.js';
import { Review } from '../../review/review.model.js';

// Utility function to convert period to date
const periodToDate = (period) => {
  const date = new Date();
  switch (period) {
    case '7d':
      date.setDate(date.getDate() - 7);
      break;
    case '30d':
      date.setDate(date.getDate() - 30);
      break;
    case '90d':
      date.setDate(date.getDate() - 90);
      break;
    case '1y':
      date.setFullYear(date.getFullYear() - 1);
      break;
    default:
      date.setDate(date.getDate() - 30); // default to 30 days
  }
  return date;
};

export const AdminGetReports = asyncHandler(async (req, res) => {
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

  const result = await getReports(filters, options);
  return sendSuccessResponse(
    res,
    200,
    'Reports retrieved successfully',
    result.reports || []
  );
});

export const AdminGetReportById = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const report = await getReportById(reportId);
  return sendSuccessResponse(res, 200, 'Report retrieved successfully', report);
});

export const AdminUpdateReportStatus = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { status } = req.body;
  const updatedReport = await updateReportStatus(reportId, status);
  return sendSuccessResponse(
    res,
    200,
    'Report status updated successfully',
    updatedReport
  );
});

export const AdminApplyAdminAction = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { action } = req.body;
  const updatedReport = await applyAdminAction(reportId, action);
  return sendSuccessResponse(
    res,
    200,
    'Admin action applied successfully',
    updatedReport
  );
});

export const AdminGetReportStats = asyncHandler(async (req, res) => {
  try {
    const { period } = req.query;
    const from = periodToDate(period);

    const [
      totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
      investigatingReports,
      statusStats,
      reasonStats,
    ] = await Promise.all([
      Report.countDocuments({}),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'resolved' }),
      Report.countDocuments({ status: 'dismissed' }),
      Report.countDocuments({ status: 'investigating' }),
      Report.aggregate([
        { $match: { createdAt: { $gte: from } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $match: { createdAt: { $gte: from } } },
        { $group: { _id: '$reason', count: { $sum: 1 } } },
      ]),
    ]);

    // Convert arrays to objects
    const byStatus = {};
    statusStats.forEach((stat) => {
      byStatus[stat._id] = stat.count;
    });

    const byReason = {};
    reasonStats.forEach((stat) => {
      byReason[stat._id] = stat.count;
    });

    const stats = {
      total: totalReports,
      pending: pendingReports,
      resolved: resolvedReports,
      dismissed: dismissedReports,
      investigating: investigatingReports,
      byStatus,
      byReason,
    };

    return sendSuccessResponse(
      res,
      200,
      'Report stats retrieved successfully',
      stats
    );
  } catch (error) {
    console.error('[reports/stats] error:', error);
    return res.status(400).json({
      success: false,
      message: 'Invalid request for reports/stats',
    });
  }
});
