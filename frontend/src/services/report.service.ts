import { api } from './api';
import {
    Report,
    CreateReportData,
    UpdateReportStatusData,
    ApplyAdminActionData,
    ReportFilters,
    ReportQueryOptions,
    ReportStats,
    ReportsResponse,
} from '../types/report';

export const reportService = {
    // Create a new report
    createReport: async (data: CreateReportData): Promise<Report> => {
        const response = await api.post('/reports', data);
        return response.data.data;
    },

    // Get reports (admin only)
    getReports: async (
        filters: ReportFilters = {},
        options: ReportQueryOptions = {}
    ): Promise<ReportsResponse> => {
        const params = new URLSearchParams();

        // Add filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });

        // Add options
        Object.entries(options).forEach(([key, value]) => {
            if (value) params.append(key, value.toString());
        });

        const response = await api.get(`/reports?${params.toString()}`);
        return response.data;
    },

    // Get a specific report by ID
    getReportById: async (reportId: string): Promise<Report> => {
        const response = await api.get(`/reports/${reportId}`);
        return response.data.data;
    },

    // Update report status
    updateReportStatus: async (
        reportId: string,
        data: UpdateReportStatusData
    ): Promise<Report> => {
        const response = await api.patch(`/reports/${reportId}/status`, data);
        return response.data.data;
    },

    // Apply admin action
    applyAdminAction: async (
        reportId: string,
        data: ApplyAdminActionData
    ): Promise<Report> => {
        const response = await api.patch(`/reports/${reportId}/action`, data);
        return response.data.data;
    },

    // Get report statistics
    getReportStats: async (): Promise<ReportStats> => {
        const response = await api.get('/reports/stats');
        return response.data.data;
    },

    // Get reports by user (admin only)
    getReportsByUser: async (userId: string): Promise<Report[]> => {
        const response = await api.get(`/reports/user/${userId}`);
        return response.data.data;
    },

    // Get reports submitted by current user
    getMyReports: async (): Promise<Report[]> => {
        const response = await api.get('/reports/my-reports');
        return response.data.data;
    },
}; 