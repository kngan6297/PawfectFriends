import { ApiError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';
import { Report } from './report.model.js';
import { User } from '../user/user.model.js';

// Transform function to map _id to id
const transformReport = (report) => {
  if (!report) return null;
  const reportObj = report.toObject ? report.toObject() : report;
  return {
    ...reportObj,
    id: reportObj._id,
    _id: undefined,
  };
};

export const createReport = async (reporterId, reportData) => {
  try {
    // Validate that reported user exists
    const reportedUser = await User.findById(reportData.reportedUserId);
    if (!reportedUser) {
      throw new ApiError('Reported user not found', 404);
    }

    // Prevent self-reporting
    if (reporterId.toString() === reportData.reportedUserId.toString()) {
      throw new ApiError('Cannot report yourself', 400);
    }

    // Check if user has already reported this user recently (within 24 hours)
    const existingReport = await Report.findOne({
      reporter: reporterId,
      reportedUser: reportData.reportedUserId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (existingReport) {
      throw new ApiError('You have already reported this user recently', 400);
    }

    const report = await Report.create({
      reporter: reporterId,
      reportedUser: reportData.reportedUserId,
      reason: reportData.reason,
      description: reportData.description,
      evidence: reportData.evidence || [],
    });

    await report.populate('reporter', 'name email');
    await report.populate('reportedUser', 'name email role');

    return transformReport(report);
  } catch (error) {
    logger.error('Error creating report:', error);
    throw error;
  }
};

export const getReports = async (filters = {}, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const query = {};
    const skip = (page - 1) * limit;

    // Apply filters
    if (filters.status) query.status = filters.status;
    if (filters.reason) query.reason = filters.reason;
    if (filters.reportedUserId) query.reportedUser = filters.reportedUserId;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const total = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email role')
      .populate('handledBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return {
      reports: reports.map(transformReport),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting reports:', error);
    throw error;
  }
};

export const getReportById = async (reportId) => {
  try {
    const report = await Report.findById(reportId)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email role')
      .populate('handledBy', 'name email');

    if (!report) {
      throw new ApiError('Report not found', 404);
    }

    return transformReport(report);
  } catch (error) {
    logger.error('Error getting report by ID:', error);
    throw error;
  }
};

export const updateReportStatus = async (
  reportId,
  status,
  adminId,
  adminNotes = ''
) => {
  try {
    const report = await Report.findById(reportId);
    if (!report) {
      throw new ApiError('Report not found', 404);
    }

    await report.updateStatus(status, adminId, adminNotes);
    await report.populate('reporter', 'name email');
    await report.populate('reportedUser', 'name email role');
    await report.populate('handledBy', 'name email');

    return transformReport(report);
  } catch (error) {
    logger.error('Error updating report status:', error);
    throw error;
  }
};

export const applyAdminAction = async (
  reportId,
  action,
  actionDetails = {},
  adminId
) => {
  try {
    const report = await Report.findById(reportId);
    if (!report) {
      throw new ApiError('Report not found', 404);
    }

    // Apply the action to the reported user
    const reportedUser = await User.findById(report.reportedUser);
    if (!reportedUser) {
      throw new ApiError('Reported user not found', 404);
    }

    switch (action) {
      case 'warning':
        // Add warning to user's record
        if (!reportedUser.warnings) reportedUser.warnings = [];
        reportedUser.warnings.push({
          reason: actionDetails.warningMessage,
          date: new Date(),
          adminId: adminId,
        });
        break;

      case 'temporary_ban':
        reportedUser.isBanned = true;
        reportedUser.banExpiry = new Date(
          Date.now() + actionDetails.banDuration * 24 * 60 * 60 * 1000
        );
        reportedUser.banReason = actionDetails.banReason;
        reportedUser.bannedBy = adminId;
        reportedUser.bannedAt = new Date();
        break;

      case 'permanent_ban':
        reportedUser.isBanned = true;
        reportedUser.banExpiry = null; // No expiry for permanent ban
        reportedUser.banReason = actionDetails.banReason;
        reportedUser.bannedBy = adminId;
        reportedUser.bannedAt = new Date();
        break;

      case 'content_removal':
        // This would typically trigger content removal logic
        // For now, we'll just mark it in the user's record
        if (!reportedUser.contentRemovals) reportedUser.contentRemovals = [];
        reportedUser.contentRemovals.push({
          reason: actionDetails.banReason || 'Content removal due to report',
          date: new Date(),
          adminId: adminId,
        });
        break;
    }

    await reportedUser.save();

    // Update the report
    await report.applyAction(action, actionDetails);
    report.handledBy = adminId;
    await report.save();

    await report.populate('reporter', 'name email');
    await report.populate('reportedUser', 'name email role');
    await report.populate('handledBy', 'name email');

    return transformReport(report);
  } catch (error) {
    logger.error('Error applying admin action:', error);
    throw error;
  }
};

export const getReportStats = async () => {
  try {
    // Check if Report collection exists and has documents
    const totalReports = await Report.countDocuments();

    // If no reports exist, return default stats
    if (totalReports === 0) {
      return {
        total: 0,
        byStatus: {},
        byReason: {},
      };
    }

    const stats = await Report.getReportStats();

    // Convert stats array to object - handle empty array
    const statsObj =
      Array.isArray(stats) && stats.length > 0
        ? stats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        : {};

    // Get counts by reason - handle empty collection
    const reasonStats = await Report.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 },
        },
      },
    ]);

    const reasonStatsObj =
      Array.isArray(reasonStats) && reasonStats.length > 0
        ? reasonStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        : {};

    return {
      total: totalReports || 0,
      byStatus: statsObj,
      byReason: reasonStatsObj,
    };
  } catch (error) {
    logger.error('Error getting report stats:', error);
    // Return default stats instead of throwing error
    return {
      total: 0,
      byStatus: {},
      byReason: {},
    };
  }
};

export const getReportsByUser = async (userId) => {
  try {
    const reports = await Report.findByReportedUser(userId);
    return reports.map(transformReport);
  } catch (error) {
    logger.error('Error getting reports by user:', error);
    throw error;
  }
};

export const getReportsByReporter = async (reporterId) => {
  try {
    const reports = await Report.find({ reporter: reporterId })
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email role')
      .populate('handledBy', 'name email')
      .sort({ createdAt: -1 });

    return reports.map(transformReport);
  } catch (error) {
    logger.error('Error getting reports by reporter:', error);
    throw error;
  }
};
