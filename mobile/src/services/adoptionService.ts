import { apiService } from './apiService';
import { AdoptionRequest, AdoptionApplicationDetails, ApiResponse, PaginatedResponse } from '@/types';
import { apiEndpoints } from '@/constants';

export const adoptionService = {
    async getUserRequests(params?: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResponse<AdoptionRequest>> {
        const response = await apiService.get(apiEndpoints.adoptions.user, params);
        return response.data;
    },

    async getById(id: string): Promise<ApiResponse<AdoptionRequest>> {
        return apiService.get(apiEndpoints.adoptions.byId(id));
    },

    async createRequest(petId: string, applicationDetails: AdoptionApplicationDetails): Promise<ApiResponse<AdoptionRequest>> {
        return apiService.post(apiEndpoints.adoptions.create(petId), applicationDetails);
    },

    async updateRequest(requestId: string, updates: any): Promise<ApiResponse<AdoptionRequest>> {
        return apiService.patch(apiEndpoints.adoptions.byId(requestId), updates);
    },

    async getMeetings(requestId: string): Promise<ApiResponse<any[]>> {
        return apiService.get(apiEndpoints.adoptions.meetings(requestId));
    },

    async addNote(requestId: string, noteData: {
        content: string;
        isInternal?: boolean;
    }): Promise<ApiResponse<AdoptionRequest>> {
        return apiService.post(apiEndpoints.adoptions.notes(requestId), noteData);
    },

    async scheduleMeeting(requestId: string, meetingData: {
        type: string;
        scheduledDate: string;
        location: string;
        notes?: string;
    }): Promise<ApiResponse<AdoptionRequest>> {
        return apiService.post(`${apiEndpoints.adoptions.meetings(requestId)}`, meetingData);
    },

    async updateMeetingStatus(requestId: string, meetingId: string, status: string, notes?: string): Promise<ApiResponse<AdoptionRequest>> {
        return apiService.patch(`${apiEndpoints.adoptions.meetings(requestId)}/${meetingId}`, { status, notes });
    },

    async getUserRequestDetails(requestId: string): Promise<ApiResponse<AdoptionRequest>> {
        return apiService.get(`${apiEndpoints.adoptions.byId(requestId)}/user-details`);
    },

    async getUserMeetings(requestId: string): Promise<ApiResponse<any[]>> {
        return apiService.get(`${apiEndpoints.adoptions.byId(requestId)}/user-meetings`);
    },

    async getUserInformationRequests(requestId: string): Promise<ApiResponse<any[]>> {
        return apiService.get(`${apiEndpoints.adoptions.byId(requestId)}/user-information-requests`);
    },

    async submitInformationResponse(requestId: string, responseData: any): Promise<ApiResponse<AdoptionRequest>> {
        return apiService.post(`${apiEndpoints.adoptions.byId(requestId)}/information-response`, responseData);
    },

    async getContractFile(requestId: string): Promise<ApiResponse<{ url: string }>> {
        return apiService.get(`${apiEndpoints.adoptions.byId(requestId)}/contract/file`);
    },

    async signContract(requestId: string, signatureData: any): Promise<ApiResponse<AdoptionRequest>> {
        return apiService.post(`${apiEndpoints.adoptions.byId(requestId)}/contract/sign`, signatureData);
    },
};
