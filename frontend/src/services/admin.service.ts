import { api } from './api';

export type ReportPeriod = "7d" | "30d" | "90d" | "1y";

export const adminApi = {
    // System Statistics
    getSystemStats: () => api.get('/api/admin/stats'),

    // User Management
    getAllUsers: (filters?: any) => api.get('/api/admin/users', { params: filters }),
    getUserById: (userId: string) => api.get(`/api/admin/users/${userId}`),
    updateUser: (userId: string, data: any) => api.put(`/api/admin/users/${userId}`, data),
    deleteUser: (userId: string) => api.delete(`/api/admin/users/${userId}`),
    createUser: (data: any) => api.post('/api/admin/users', data),
    lockUser: (userId: string, reason: string) => api.post(`/api/admin/users/${userId}/lock`, { reason }),
    unlockUser: (userId: string) => api.post(`/api/admin/users/${userId}/unlock`),
    resetUserPassword: (userId: string, newPassword: string) =>
        api.post(`/api/admin/users/${userId}/reset-password`, { newPassword }),

    // Shelter Management
    getAllShelters: (filters?: any) => api.get('/api/admin/shelters', { params: filters }),
    updateShelter: (shelterId: string, data: any) => api.put(`/api/admin/shelters/${shelterId}`, data),
    deleteShelter: (shelterId: string) => api.delete(`/api/admin/shelters/${shelterId}`),

    banShelter: (shelterId: string, reason: string) => api.post(`/api/admin/shelters/${shelterId}/ban`, { reason }),
    unbanShelter: (shelterId: string) => api.post(`/api/admin/shelters/${shelterId}/unban`),

    // Pet Management
    getAllPets: async (filters?: any) => {
        console.log("Admin API: getAllPets called with filters:", filters);
        const response = await api.get('/api/admin/pets', { params: filters });
        console.log("Admin API: getAllPets response:", response);
        return response;
    },
    updatePet: (petId: string, data: any) => api.put(`/api/admin/pets/${petId}`, data),
    deletePet: (petId: string) => api.delete(`/api/admin/pets/${petId}`),

    // NEW: Separate endpoints for status updates
    updatePetModeration: (petId: string, data: { moderationStatus: string }) =>
        api.patch(`/api/admin/pets/${petId}/moderation`, data),
    updatePetAdoption: (petId: string, data: { adoptionStatus: string }) =>
        api.patch(`/api/admin/pets/${petId}/adoption`, data),

    // Bulk operations
    bulkApproveAllPets: () => api.post('/api/admin/pets/bulk-approve-all'),

    rejectPet: (petId: string, reason: string) => api.post(`/api/admin/pets/${petId}/reject`, { reason }),

    // Review Management
    getAllReviews: (filters?: any) => api.get('/api/admin/reviews', { params: filters }),
    updateReview: (reviewId: string, data: any) => api.put(`/api/admin/reviews/${reviewId}`, data),
    deleteReview: (reviewId: string) => api.delete(`/api/admin/reviews/${reviewId}`),

    // Adoption Management
    getAllAdoptions: (filters?: any) => api.get('/api/admin/adoptions', { params: filters }),
    updateAdoption: (adoptionId: string, data: any) => api.put(`/api/admin/adoptions/${adoptionId}`, data),

    // Admin Management
    getAllAdmins: () => api.get('/api/admin/admins'),
    updatePermissions: (adminId: string, permissions: string[]) =>
        api.patch(`/api/admin/admins/${adminId}/permissions`, { permissions }),

    // System Logs
    getSystemLogs: (filters?: any) => api.get('/api/admin/logs', { params: filters }),

    // Reports/Violations Management
    getAllReports: (filters?: any) => {
        console.log("🔧 [AdminService] getAllReports called with filters:", filters);
        const url = '/api/admin/reports';
        console.log("🔧 [AdminService] Making request to:", url, "with params:", filters);
        return api.get(url, { params: filters });
    },
    getReportById: (reportId: string) => api.get(`/api/admin/reports/${reportId}`),
    updateReportStatus: (reportId: string, status: string) => api.put(`/api/admin/reports/${reportId}/status`, { status }),
    applyReportAction: (reportId: string, action: string, data?: any) => api.post(`/api/admin/reports/${reportId}/action`, { action, ...data }),
    getReportStats: (period: ReportPeriod = "30d") => {
        console.log("🔧 [AdminService] getReportStats called with period:", period);
        const url = '/api/admin/reports/stats';
        const params = { period };
        console.log("🔧 [AdminService] Making request to:", url, "with params:", params);
        return api.get(url, { params });
    },



    // Banners/Communications Management
    // (REMOVED)


    // Audit Logs
    getAuditLogs: (filters?: any) => api.get('/api/admin/audit-logs', { params: filters }),
    getActivityLogs: (filters?: any) => api.get('/api/admin/activity-logs', { params: filters }),
    getSecurityLogs: (filters?: any) => api.get('/api/admin/security-logs', { params: filters }),
    exportLogs: (filters?: any) => api.get('/api/admin/logs/export', { params: filters, responseType: 'blob' }),

    // System Settings Management
    getSystemSettings: () => api.get('/api/admin/settings'),
    updateSystemSettings: (settings: any) => api.put('/api/admin/settings', settings),
    resetSystemSettings: () => api.post('/api/admin/settings/reset'),
    getSystemHealth: () => api.get('/api/admin/system/health'),
    testEmailConfiguration: () => api.post('/api/admin/system/test-email'),
    testDatabaseConnection: () => api.post('/api/admin/system/test-database'),
    testStorageConnection: () => api.post('/api/admin/system/test-storage'),
    exportSystemSettings: () => api.get('/api/admin/settings/export', { responseType: 'blob' }),
    importSystemSettings: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/api/admin/settings/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Generic delete method
    deleteItem: (type: string, itemId: string) => {
        switch (type) {
            case 'user':
                return api.delete(`/api/admin/users/${itemId}`);
            case 'shelter':
                return api.delete(`/api/admin/shelters/${itemId}`);
            case 'pet':
                return api.delete(`/api/admin/pets/${itemId}`);
            case 'review':
                return api.delete(`/api/admin/reviews/${itemId}`);
            case 'report':
                return api.delete(`/api/admin/reports/${itemId}`);
            case 'banner':
                // (REMOVED)
                break;
            default:
                throw new Error(`Unknown item type: ${type}`);
        }
    },
}; 