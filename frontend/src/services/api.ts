import axios, { AxiosError } from 'axios';
import { Pet } from "@/types/pet";
import { AdoptionRequest as Adoption } from "@/types/adoption";

export const endpoints = {
    pets: {
        list: "/api/pets",
        favorite: (id: string) => `/api/pets/${id}/favorite`,
        search: "/api/pets/search",
        similar: (id: string) => `/api/pets/${id}/similar`,
        latest: "/api/pets/latest",
    },
    user: {
        favorites: "/api/users/favorite-pets",
        profile: "/api/users/profile",
        updateProfile: "/api/users/profile",
        preferences: "/api/users/preferences",
        location: "/api/users/location",
        viewedPets: "/api/users/viewed-pets",
        shelters: "/api/users/shelters",
    },
    shelter: {
        profile: (id: string) => `/api/shelters/${id}`,
        incrementViews: (id: string) => `/api/shelters/${id}/view`,
        stats: "/api/shelters/dashboard/stats",
        dashboard: "/api/shelters/dashboard/overview",
    },
    notification: {
        list: "/api/notifications",
        unreadCount: "/api/notifications/unread-count",
        markRead: (id: string) => `/api/notifications/${id}/read`,
        markAllRead: "/api/notifications/mark-all-read",
        delete: (id: string) => `/api/notifications/${id}`,
        archive: (id: string) => `/api/notifications/${id}/archive`,
        settings: "/api/notifications/settings",
        test: "/api/notifications/test",
    },
    auth: {
        login: "/api/auth/login",
        register: "/api/auth/register",
        logout: "/api/auth/logout",
        verify: "/api/auth/verify",
        forgotPassword: "/api/auth/forgot-password",
        resetPassword: "/api/auth/reset-password",
    }
} as const;

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

// List of public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
    '/api/pets', // Pet list
    '/api/pets/latest', // Latest pets
    '/api/pets/search', // Pet search
    '/api/recommendations/personalized', // AI recommendations
];

// Helper function to check if an endpoint is public
const isPublicEndpoint = (url: string): boolean => {
    // Check if it's a GET request to a pet detail page (/:petId)
    if (url.match(/^\/api\/pets\/[^\/]+$/) && !url.includes('/favorite') && !url.includes('/similar')) {
        return true;
    }

    // Check if it's exactly one of the public endpoints (not just starting with them)
    return PUBLIC_ENDPOINTS.some(endpoint => url === endpoint || url.startsWith(endpoint + '?'));
};

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        // Always add Authorization header if token exists
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // Also set default headers for consistency
            api.defaults.headers.common.Authorization = `Bearer ${token}`;
        }

        // Debug request data for admin endpoints
        if (config.url && config.url.includes('/admin')) {
            console.log("🔧 [API] Admin request debug:", {
                url: config.url,
                method: config.method,
                headers: config.headers,
                params: config.params,
                data: config.data,
                dataType: typeof config.data,
                hasToken: !!token
            });
        }

        // Debug request data for notes endpoint
        if (config.url && config.url.includes('/notes')) {
            console.log("📝 API request debug:", {
                url: config.url,
                method: config.method,
                headers: config.headers,
                data: config.data,
                dataType: typeof config.data
            });
        }

        // Debug request data for viewed-pets endpoint
        if (config.url && config.url.includes('/viewed-pets')) {
            console.log("🐾 Viewed pets API request debug:", {
                url: config.url,
                method: config.method,
                headers: config.headers,
                data: config.data,
                dataType: typeof config.data,
                token: token ? `${token.substring(0, 10)}...` : 'none',
                hasAuthHeader: !!config.headers.Authorization
            });
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        // Debug response data for admin endpoints
        if (response.config.url && response.config.url.includes('/admin')) {
            console.log("🔧 [API] Admin response debug:", {
                url: response.config.url,
                status: response.status,
                statusText: response.statusText,
                data: response.data,
                headers: response.headers
            });
        }
        return response;
    },
    (error) => {
        // Debug error data for admin endpoints
        if (error.config?.url && error.config.url.includes('/admin')) {
            console.log("🔧 [API] Admin error debug:", {
                url: error.config.url,
                method: error.config.method,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                headers: error.response?.headers,
                message: error.message
            });
        }
        // Handle authentication errors
        if (error.response?.status === 401) {
            // Don't redirect for public endpoints, auth endpoints, RTC endpoints, or contract endpoints
            const isPublicRoute = isPublicEndpoint(error.config?.url || '');
            const isAuthEndpoint = error.config?.url?.includes('/auth/login') ||
                error.config?.url?.includes('/auth/register');
            const isRTCEndpoint = error.config?.url?.includes('/api/rtc/');
            const isContractEndpoint = error.config?.url?.includes('/contract/');

            if (!isPublicRoute && !isAuthEndpoint && !isRTCEndpoint && !isContractEndpoint) {
                // Clear any stored auth data
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                // Check if this might be a backend reset (user was previously authenticated)
                const wasAuthenticated = localStorage.getItem("wasAuthenticated") === "true";
                console.log("API Interceptor: 401 error detected", {
                    url: error.config?.url,
                    wasAuthenticated,
                    isPublicRoute,
                    isAuthEndpoint,
                    isRTCEndpoint,
                    isContractEndpoint
                });

                if (wasAuthenticated) {
                    // This looks like a backend reset, redirect to home
                    console.log("API Interceptor: Backend reset detected, redirecting to home");
                    localStorage.removeItem("wasAuthenticated");
                    window.location.href = "/";
                } else {
                    // Normal authentication failure, redirect to login
                    console.log("API Interceptor: Normal auth failure, redirecting to login");
                    window.location.href = "/login";
                }
            } else if (isRTCEndpoint) {
                // For RTC endpoints, just log the error without redirecting
                console.log("API Interceptor: RTC endpoint 401 error - not redirecting", {
                    url: error.config?.url,
                    error: error.response?.data
                });
            } else if (isContractEndpoint) {
                // For contract endpoints, just log the error without redirecting
                console.log("API Interceptor: Contract endpoint 401 error - not redirecting", {
                    url: error.config?.url,
                    error: error.response?.data
                });
            }
        }

        // Handle forbidden errors (account locked, etc.)
        if (error.response?.status === 403) {
            // Don't redirect for auth endpoints, public endpoints, RTC endpoints, or contract file endpoints
            const isPublicRoute = isPublicEndpoint(error.config?.url || '');
            const isAuthEndpoint = error.config?.url?.includes('/auth/');
            const isRTCEndpoint = error.config?.url?.includes('/api/rtc/');
            const isContractFileEndpoint = error.config?.url?.includes('/contract/file');
            if (!isAuthEndpoint && !isPublicRoute && !isRTCEndpoint && !isContractFileEndpoint) {
                // Use window.location for API interceptors since we don't have access to navigate
                window.location.href = "/login";
            } else if (isRTCEndpoint) {
                // For RTC endpoints, just log the error without redirecting
                console.log("API Interceptor: RTC endpoint 403 error - not redirecting", {
                    url: error.config?.url,
                    error: error.response?.data
                });
            } else if (isContractFileEndpoint) {
                // For contract file endpoints, just log the error without redirecting
                console.log("API Interceptor: Contract file 403 error - not redirecting", {
                    url: error.config?.url,
                    error: error.response?.data
                });
            }
        }

        // Enhance error messages for better user experience
        if (error.response?.data?.message) {
            // Keep the specific error message from the backend
            error.userMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
            // Handle different error response formats
            error.userMessage = error.response.data.error;
        } else {
            // Fallback error messages
            switch (error.response?.status) {
                case 400:
                    error.userMessage = "Invalid request. Please check your input and try again.";
                    break;
                case 401:
                    error.userMessage = "Authentication failed. Please check your credentials.";
                    break;
                case 403:
                    error.userMessage = "Access denied. You don't have permission to perform this action.";
                    break;
                case 404:
                    error.userMessage = "The requested resource was not found.";
                    break;
                case 429:
                    error.userMessage = "Too many requests. Please wait a moment and try again.";
                    break;
                case 500:
                    error.userMessage = "Server error. Please try again later.";
                    break;
                default:
                    error.userMessage = "An unexpected error occurred. Please try again.";
            }
        }

        return Promise.reject(error);
    }
);

export const petApi = {
    getPets: async (params: {
        limit?: number;
        status?: string;
        type?: string;
        breed?: string;
        size?: string;
        location?: string;
        page?: number;
        gender?: string;
        age?: string;
        search?: string;
    }, favoritePetIds: string[] = []) => {
        const cleanedParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v != null && v !== "")
        );

        const petsRes = await api.get(endpoints.pets.list, { params: cleanedParams });

        let pets: Pet[] = [];
        let pagination: any = undefined;

        if (petsRes.data?.data?.pets && Array.isArray(petsRes.data.data.pets)) {
            pets = petsRes.data.data.pets;
            pagination = petsRes.data.data.pagination;
        } else {
            console.error('Invalid response structure:', petsRes.data);
            throw new Error("Invalid response structure");
        }

        // If no favoritePetIds provided, try to get from user's favorites
        let favoriteSet = new Set(favoritePetIds);
        if (favoritePetIds.length === 0) {
            try {
                // This would need to be implemented based on user authentication
                // For now, we'll use the provided favoritePetIds
            } catch (error) {
                console.log('Could not fetch user favorites, using provided list');
            }
        }

        const petsWithFlags = pets.map((pet: Pet) => ({
            ...pet,
            isFavorite: pet.id ? favoriteSet.has(pet.id) : false,
        }));

        return pagination ? { pets: petsWithFlags, pagination } : { pets: petsWithFlags };
    },

    searchPets: async (searchQuery: string) => {
        const response = await api.get(endpoints.pets.search, {
            params: { q: searchQuery }
        });
        return response.data;
    },

    getSimilarPets: async (petId: string) => {
        const response = await api.get(endpoints.pets.similar(petId));
        return response.data;
    },

    getLatestPets: async (limit?: number, signal?: AbortSignal) => {
        const params = limit ? { limit } : {};
        const response = await api.get(endpoints.pets.latest, {
            params,
            signal
        });
        if (response.data?.success) {
            return response.data.data;
        }
        throw new Error('Failed to fetch latest pets');
    },

    toggleFavorite: async (id: string) => {
        return api.patch(`/api/pets/${id}/toggle-favorite`);
    },

    checkFavoriteStatus: async (id: string) => {
        return api.get(`/api/pets/${id}/favorite/check`);
    },

    getById: async (id: string): Promise<Pet> => {
        const response = await api.get(`/api/pets/${id}`);
        if (!response.data?.success || !response.data?.data) {
            throw new Error("Pet not found");
        }
        return {
            ...response.data.data,
            id: response.data.data._id || response.data.data.id,
        };
    },

    // Shelter-specific methods
    getShelterStats: async () => {
        const response = await api.get('/api/pets/shelter/stats');
        return response;
    },

    getShelterDashboard: async () => {
        const response = await api.get('/api/shelters/dashboard/overview');
        return response;
    },

    getShelterAnalytics: async (period = '30d') => {
        const response = await api.get('/api/shelters/dashboard/analytics', {
            params: { period }
        });
        return response;
    },

    getAdoptionTrends: async (filters: {
        startDate?: string;
        endDate?: string;
        groupBy?: 'day' | 'week' | 'month';
        period?: '7d' | '30d' | '90d' | '1y';
    } = {}) => {
        const response = await api.get('/api/shelters/dashboard/trends', {
            params: filters
        });
        return response;
    },

    getAdoptionRatesByAttributes: async (filters: {
        startDate?: string;
        endDate?: string;
        period?: '7d' | '30d' | '90d' | '1y';
    } = {}) => {
        const response = await api.get('/api/shelters/dashboard/rates-by-attributes', {
            params: filters
        });
        return response;
    },

    getTimeToAdoptionStats: async (filters: {
        startDate?: string;
        endDate?: string;
        period?: '7d' | '30d' | '90d' | '1y';
    } = {}) => {
        const response = await api.get('/api/shelters/dashboard/time-to-adoption', {
            params: filters
        });
        return response;
    },

    getDetailedTrendAnalytics: async (filters: {
        startDate?: string;
        endDate?: string;
        groupBy?: 'day' | 'week' | 'month';
        period?: '7d' | '30d' | '90d' | '1y';
    } = {}) => {
        const response = await api.get('/api/shelters/dashboard/detailed-trends', {
            params: filters
        });
        return response;
    },

    getRejectionReasonsAnalytics: async (filters: {
        startDate?: string;
        endDate?: string;
        period?: '7d' | '30d' | '90d' | '1y';
    } = {}) => {
        const response = await api.get('/api/shelters/dashboard/analytics/rejection-reasons', {
            params: filters
        });
        return response;
    },

    getDetailedReports: async (reportType: string, startDate?: string, endDate?: string) => {
        const response = await api.get('/api/shelters/dashboard/reports', {
            params: { reportType, startDate, endDate }
        });
        return response;
    },

    getShelterPets: async () => {
        const response = await api.get('/api/pets/shelter/pets', {
            params: {
                limit: 1000, // Request all pets (or a very high number)
                page: 1
            }
        });
        return response;
    },

    getAdoptionRequests: async (params: { status?: string } = {}) => {
        const response = await api.get('/api/adoptions/shelter', { params });
        return response;
    },

    deletePet: async (petId: string) => {
        const response = await api.delete(`/api/pets/${petId}`);
        return response;
    },

    updatePet: async (petId: string, data: FormData) => {
        const response = await api.put(`/api/pets/${petId}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    },

    updateAdoptionRequest: async (requestId: string, data: {
        status: string;
        rejectionReason?: string;
        rejectionDetails?: string;
    }) => {
        const response = await api.patch(`/api/adoptions/${requestId}`, data);
        return response;
    },

    sendReminder: async (requestId: string) => {
        const response = await api.post(`/api/adoptions/${requestId}/reminders`);
        return response;
    },

    updatePetStatus: async (petId: string, status: string) => {
        const response = await api.patch(`/api/pets/${petId}/status`, { status });
        return response;
    },

    createPet: async (data: FormData) => {
        const response = await api.post('/api/pets', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    },

    scheduleMeeting: async (requestId: string, meetingData: any) => {
        const response = await api.post(`/api/adoptions/${requestId}/meetings`, meetingData);
        return response;
    },

    updateMeetingStatus: async (requestId: string, meetingId: string, status: string, notes?: string) => {
        const response = await api.patch(`/api/adoptions/${requestId}/meetings/${meetingId}`, { status, notes });
        return response;
    },

    getAdoptionRequestMeetings: async (requestId: string) => {
        const response = await api.get(`/api/adoptions/${requestId}/meetings`);
        return response;
    },

    getAllShelterMeetings: async (params: { startDate?: string; endDate?: string; status?: string } = {}) => {
        const response = await api.get('/api/adoptions/shelter/meetings', { params });
        return response;
    },

    rescheduleMeeting: async (requestId: string, meetingId: string, newDate: string, newLocation?: string, reason?: string) => {
        const response = await api.patch(`/api/adoptions/${requestId}/meetings/${meetingId}/reschedule`, {
            scheduledDate: newDate,
            location: newLocation,
            reason: reason,
        });
        return response;
    },

    createMeetingReminder: async (meetingId: string, reminderData: any) => {
        const response = await api.post(`/api/meetings/${meetingId}/reminders`, reminderData);
        return response;
    },

    getMeetingReminders: async (meetingId: string) => {
        const response = await api.get(`/api/meetings/${meetingId}/reminders`);
        return response;
    },

    deleteMeetingReminder: async (reminderId: string) => {
        const response = await api.delete(`/api/reminders/${reminderId}`);
        return response;
    },

    getShelterCalendar: async (params: { month?: number; year?: number } = {}) => {
        const response = await api.get('/api/shelter/calendar', { params });
        return response;
    },

    getShelterReviews: async (shelterId: string, params: { page?: number; limit?: number } = {}) => {
        const response = await api.get(`/api/reviews/shelters/${shelterId}/reviews`, { params });
        return response;
    },

    respondToReview: async (reviewId: string, response: string) => {
        const apiResponse = await api.post(`/api/reviews/${reviewId}/response`, { content: response });
        return apiResponse;
    },
};

interface AdoptionApplicationDetails {
    housingType: 'house' | 'apartment' | 'condo' | 'other';
    hasYard: boolean;
    yardDetails?: {
        isFenced: boolean;
        size: string;
    };
    hasOtherPets: boolean;
    otherPetsDetails?: Array<{
        type: string;
        species: string;
        age: number;
        description: string;
    }>;
    hasChildren: boolean;
    childrenAges?: number[];
    workSchedule: string;
    experience?: string;
    reasonForAdopting: string;
    plannedCareRoutine: string;
    veterinarianInfo: {
        name: string;
        contact: string;
        clinic: string;
    };
    references: Array<{
        name: string;
        relationship: string;
        phone: string;
        email: string;
        yearsKnown: number;
    }>;
}

interface AdoptionNote {
    content: string;
    author: string;
    isInternal: boolean;
    timestamp: Date;
}

interface AdoptionTimeline {
    status: 'submitted' | 'pending' | 'approved' | 'scheduled' | 'completed' | 'rejected';
    date: Date;
    note?: string;
}

export interface AdoptionMeeting {
    _id: string;
    type: 'phone_call' | 'text_message' | 'facebook_chat' | 'zalo_chat' | 'in_person';
    scheduledDate: Date;
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
    notes?: string;
    location: string;
    participants: string[];
    rescheduleCount?: number;
    previousDate?: Date;
    originalDate?: Date;
    rescheduleHistory?: Array<{
        fromDate: Date;
        toDate: Date;
        reason: string;
        rescheduledBy: string;
        rescheduledAt: Date;
    }>;
}

interface AdoptionDocument {
    name: string;
    url: string;
    type: 'id' | 'proof_of_residence' | 'reference_letter' | 'vet_records' | 'other';
    status: 'pending' | 'approved' | 'rejected';
    uploadedAt: Date;
    verifiedAt?: Date;
    verifiedBy?: string;
}

interface AdoptionFinalDecision {
    status: 'approved' | 'rejected';
    date: Date;
    reason?: string;
    decidedBy: string;
    conditions?: string[];
}

interface Adoption {
    id: string;
    user: string;
    pet: string;
    shelter: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    applicationDetails: AdoptionApplicationDetails;
    notes: AdoptionNote[];
    timeline: AdoptionTimeline[];
    meetings: AdoptionMeeting[];
    documents: AdoptionDocument[];
    finalDecision?: AdoptionFinalDecision;
    followUp?: Array<{
        scheduledDate: Date;
        completedDate?: Date;
        type: string;
        notes?: string;
    }>;
    reminderSent?: boolean;
    reminders?: Array<{
        sentAt: Date;
        method?: string;
        by?: string;
    }>;
    // Populated fields from backend
    userDetails?: {
        _id: string;
        name: string;
        email: string;
        phone?: string;
    };
    petDetails?: {
        _id: string;
        name: string;
        photos: string[];
        type: string;
        breed: string;
        age: number | string;
        description: string;
    };
    shelterDetails?: {
        _id: string;
        name: string;
        email: string;
    };
}

export const adoptionApi = {
    getAll: async (): Promise<Adoption[]> => {
        const response = await api.get('/api/adoptions');
        return response.data.data;
    },
    getById: async (id: string): Promise<Adoption> => {
        const response = await api.get(`/api/adoptions/${id}`);
        return response.data.data;
    },
    getUserRequests: async (params: { status?: string; page?: number; limit?: number } = {}): Promise<{ data: Adoption[]; pagination: any }> => {
        const response = await api.get('/api/adoptions/user', { params });
        return response.data;
    },
    createRequest: async (petId: string, applicationDetails: AdoptionApplicationDetails): Promise<Adoption> => {
        console.log("🐾 Creating adoption request for petId:", petId);
        const response = await api.post(`/api/adoptions/${petId}`, applicationDetails);
        return response.data.data;
    },
    updateApplication: async (id: string, applicationDetails: AdoptionApplicationDetails): Promise<Adoption> => {
        console.log("🐾 Updating adoption application for id:", id);
        const response = await api.put(`/api/adoptions/${id}/application`, applicationDetails);
        return response.data.data;
    },
    updateStatus: async (id: string, status: Adoption['status'], rejectionReason?: string, conditions?: string[]): Promise<Adoption> => {
        const response = await api.patch(`/api/adoptions/${id}`, { status, rejectionReason, conditions });
        return response.data.data;
    },
    addNote: async (id: string, noteData: { content: string; isInternal?: boolean; isMilestone?: boolean; timelineStatus?: string }): Promise<Adoption> => {
        console.log("📝 API call - addNote:", { id, noteData });
        console.log("📝 API call - noteData type:", typeof noteData);
        console.log("📝 API call - noteData stringified:", JSON.stringify(noteData));

        // Ensure the data is properly structured
        const cleanNoteData = {
            content: String(noteData.content || ''),
            isInternal: Boolean(noteData.isInternal),
            isMilestone: Boolean(noteData.isMilestone),
            timelineStatus: noteData.timelineStatus || undefined,
        };

        console.log("📝 API call - cleanNoteData:", cleanNoteData);

        const response = await api.post(`/api/adoptions/${id}/notes`, cleanNoteData);
        return response.data.data;
    },
    addTimelineEvent: async (id: string, status: string, note: string, updatedBy: string): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/timeline`, { status, note, updatedBy });
        return response.data.data;
    },
    uploadDocument: async (id: string, document: Omit<AdoptionDocument, 'status' | 'uploadedAt' | 'verifiedAt' | 'verifiedBy'>): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/documents`, document);
        return response.data.data;
    },
    verifyDocument: async (id: string, documentId: string, status: 'approved' | 'rejected'): Promise<Adoption> => {
        const response = await api.patch(`/api/adoptions/${id}/documents/${documentId}`, { status });
        return response.data.data;
    },
    deleteDocument: async (id: string, documentId: string): Promise<Adoption> => {
        const response = await api.delete(`/api/adoptions/${id}/documents/${documentId}`);
        return response.data.data;
    },

    // New workflow methods
    performPreliminaryEvaluation: async (id: string, evaluation: any): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/evaluate`, evaluation);
        return response.data.data;
    },

    updateInterviewResults: async (id: string, results: any): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/interview-results`, results);
        return response.data.data;
    },

    updateHomeVisitResults: async (id: string, results: any): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/home-visit-results`, results);
        return response.data.data;
    },

    approveAdoptionRequest: async (id: string, approvalDetails: any): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/approve`, approvalDetails);
        return response.data.data;
    },

    generateContract: async (id: string, payload: {
        version?: string;
        generatePdf?: boolean;
    }): Promise<Adoption> => {
        // Normalize the payload to match backend expectations
        const contractDetails = {
            version: payload.version || '1.0',
            generatePdf: payload.generatePdf !== false,
        };

        const response = await api.post(`/api/adoptions/${id}/contract/generate`, contractDetails);
        return response.data.data;
    },

    getContractFile: async (id: string, config?: any): Promise<string> => {
        const response = await api.get(`/api/adoptions/${id}/contract/file`, config);
        return response.data.url || response.data;
    },

    // Legacy method for backward compatibility
    getContractUrl: async (id: string): Promise<string> => {
        return adoptionApi.getContractFile(id);
    },

    signContract: async (id: string, signatureDetails: any): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/contract/sign`, signatureDetails);
        return response.data.data;
    },

    sendContract: async (id: string): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/contract/send`, {});
        return response.data.data;
    },

    completeHandover: async (id: string, handoverDetails: any): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/handover/complete`, handoverDetails);
        return response.data.data;
    },

    completeAdoption: async (id: string): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/complete`);
        return response.data.data;
    },

    schedulePostAdoptionFollowUp: async (id: string, followUpData: any): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/post-adoption-follow-up`, followUpData);
        return response.data.data;
    },

    completeFollowUp: async (id: string, followUpId: string, completionData: any): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/follow-up/${followUpId}/complete`, completionData);
        return response.data.data;
    },

    // Meeting methods
    scheduleMeeting: async (id: string, meetingData: any): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/meetings`, meetingData);
        return response.data.data;
    },

    updateMeetingStatus: async (id: string, meetingId: string, status: string, notes?: string): Promise<Adoption> => {
        const response = await api.patch(`/api/adoptions/${id}/meetings/${meetingId}`, { status, notes });
        return response.data.data;
    },

    getAdoptionRequestMeetings: async (id: string): Promise<{ meetings: AdoptionMeeting[] }> => {
        const response = await api.get(`/api/adoptions/${id}/meetings`);
        return response.data.data;
    },

    // User-specific functions for accessing their own adoption request data
    getUserAdoptionRequestDetails: async (requestId: string): Promise<{ data: any }> => {
        const response = await api.get(`/api/adoptions/${requestId}/user-details`);
        return response.data;
    },

    getUserAdoptionRequestMeetings: async (requestId: string): Promise<{ data: any[] }> => {
        const response = await api.get(`/api/adoptions/${requestId}/user-meetings`);
        return response.data;
    },

    getUserInformationRequests: async (requestId: string): Promise<{ data: any[] }> => {
        const response = await api.get(`/api/adoptions/${requestId}/user-information-requests`);
        return response.data;
    },

    scheduleHandover: async (id: string, handoverData: any): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/handover`, handoverData);
        return response.data.data;
    },

    makeFinalDecision: async (id: string, decision: any): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/decision`, decision);
        return response.data.data;
    },

    scheduleFollowUp: async (id: string, followUpData: any): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/follow-up`, followUpData);
        return response.data.data;
    },

    // Information Request Methods
    createInformationRequest: async (id: string, requestData: any): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/information-request`, requestData);
        return response.data.data;
    },

    submitInformationResponse: async (id: string, responseData: any): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/information-response`, responseData);
        return response.data.data;
    },

    getInformationRequests: async (id: string): Promise<{ data: any[] }> => {
        const response = await api.get(`/api/adoptions/${id}/information-requests`);
        return response.data;
    },

    reviewInformationRequest: async (id: string, reviewData: any): Promise<Adoption> => {
        const response = await api.patch(`/api/adoptions/${id}/information-request/${reviewData.informationRequestId}`, reviewData);
        return response.data.data;
    },

    deleteInformationRequest: async (id: string, requestId: string): Promise<Adoption> => {
        const response = await api.delete(`/api/adoptions/${id}/information-request/${requestId}`);
        return response.data.data;
    },

    sendInformationRequestReminder: async (id: string, reminderData: any): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/information-request-reminder`, reminderData);
        return response.data.data;
    },


    uploadContractDocument: async (id: string, documentData: any): Promise<Adoption> => {
        const response = await api.post(`/api/adoptions/${id}/contract-documents`, documentData);
        return response.data.data;
    },

    deleteContractDocument: async (id: string, documentId: string): Promise<Adoption> => {
        const response = await api.delete(`/api/adoptions/${id}/contract-documents/${documentId}`);
        return response.data.data;
    }
};

export const userApi = {
    getProfile: async () => {
        const response = await api.get(endpoints.user.profile);
        return response;
    },

    updateProfile: async (data: any) => {
        const response = await api.put(endpoints.user.profile, data);
        return response;
    },

    getViewedPets: async () => {
        const response = await api.get(endpoints.user.viewedPets);
        return response;
    },

    addViewedPet: async (petId: string) => {

        // Validate petId format before sending
        if (!petId || typeof petId !== 'string' || petId.length !== 24) {
            console.error("❌ Invalid petId format:", petId);
            throw new Error("Invalid pet ID format");
        }

        // Check if we have an auth token
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("❌ No auth token found for viewed-pets request");
            throw new Error("Authentication required");
        }

        try {
            // Note: Backend only expects petId in URL params, no request body needed
            // The user ID is extracted from the auth token by the backend
            const response = await api.post(`/api/users/viewed-pets/${petId}`);
            console.log("✅ addViewedPet success (idempotent):", response.data);
            return response;
        } catch (e) {
            const err = e as AxiosError<any>;
            console.error('addViewedPet error', {
                status: err.response?.status,
                data: err.response?.data,   // <-- see why
                petId
            });
            throw err;
        }
    },

    getFavorites: async () => {
        const response = await api.get(endpoints.user.favorites);
        return response;
    },

    toggleFavorite: async (petId: string) => {
        const response = await api.post(`/api/users/favorite-pets/${petId}`);
        return response;
    },

    updatePreferences: async (preferences: any) => {
        const response = await api.put(endpoints.user.preferences, preferences);
        return response;
    },

    updateLocation: async (location: any) => {
        const response = await api.put(endpoints.user.location, location);
        return response;
    },

    changePassword: async (data: any) => {
        const response = await api.put('/api/users/change-password', data);
        return response;
    },

    updateAddress: async (data: any) => {
        const response = await api.put('/api/users/profile/address', data);
        return response;
    },

    updateSecuritySettings: async (data: any) => {
        const response = await api.put('/api/users/profile/security', data);
        return response;
    },

    uploadAvatar: async (file: File) => {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await api.post('/api/users/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    },

    deleteAvatar: async () => {
        const response = await api.delete('/api/users/avatar');
        return response;
    },
};

export const authApi = {
    login: async (emailOrPhone: string, password: string) => {
        const response = await api.post("/auth/login", { emailOrPhone, password });
        if (!response.data.success) {
            throw new Error(response.data.message || 'Login failed');
        }
        return response.data;
    },
    verifyEmail: async (token: string) => {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        if (!response.data.success) {
            throw new Error(response.data.message || 'Verification failed');
        }
        return response.data;
    },
    resendVerificationEmail: async () => {
        const response = await api.post("/auth/resend-verification");
        return response.data;
    },
};

export const shelterApi = {
    getProfile: async (shelterId: string) => {
        const response = await api.get(endpoints.shelter.profile(shelterId));
        return response.data;
    },

    getAllShelters: async () => {
        const response = await api.get('/api/shelters');
        return response.data;
    },

    incrementProfileViews: async (shelterId: string) => {
        const response = await api.post(endpoints.shelter.incrementViews(shelterId));
        return response.data;
    },

    getStats: async () => {
        const response = await api.get(endpoints.shelter.stats);
        return response.data;
    },

    getDashboard: async () => {
        const response = await api.get(endpoints.shelter.dashboard);
        return response.data;
    },
};

export const notificationApi = {
    getNotifications: async (params: {
        page?: number;
        limit?: number;
        type?: string;
        isRead?: boolean;
    } = {}) => {
        const response = await api.get(endpoints.notification.list, { params });
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await api.get(endpoints.notification.unreadCount);
        return response.data;
    },

    markAsRead: async (notificationId: string) => {
        const response = await api.patch(endpoints.notification.markRead(notificationId));
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await api.patch(endpoints.notification.markAllRead);
        return response.data;
    },

    deleteNotification: async (notificationId: string) => {
        const response = await api.delete(endpoints.notification.delete(notificationId));
        return response.data;
    },

    archiveNotification: async (notificationId: string) => {
        const response = await api.patch(endpoints.notification.archive(notificationId));
        return response.data;
    },

    getSettings: async () => {
        const response = await api.get(endpoints.notification.settings);
        return response.data;
    },

    updateSettings: async (settings: any) => {
        const response = await api.put(endpoints.notification.settings, settings);
        return response.data;
    },

    testNotification: async (data: { type?: string; title?: string; message?: string }) => {
        const response = await api.post(endpoints.notification.test, data);
        return response.data;
    },
};

// Utility function to ensure auth token is set
export const ensureAuthToken = () => {
    const token = localStorage.getItem("token");
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        return true;
    }
    return false;
};

// Function to manually refresh auth token on API instance
export const refreshApiAuthToken = () => {
    const token = localStorage.getItem("token");
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        console.log("🔑 API auth token refreshed successfully");
        return true;
    } else {
        delete api.defaults.headers.common.Authorization;
        console.log("🔑 API auth token cleared");
        return false;
    }
};

// Debug function to check auth status
export const debugAuthStatus = () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    // Debug auth status
    console.log("Auth Debug Status:", {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'none',
        hasUser: !!user,
        apiDefaultAuth: api.defaults.headers.common.Authorization ?
            `${(api.defaults.headers.common.Authorization as string)?.substring(0, 20)}...` : 'none',
        localStorageKeys: Object.keys(localStorage).filter(key =>
            key.includes('token') || key.includes('user') || key.includes('auth')
        )
    });

    return { hasToken: !!token, hasUser: !!user };
};

// Test function to verify viewed-pets endpoint
export const testViewedPetsEndpoint = async (testPetId: string = "507f1f77bcf86cd799439011") => {
    console.log("🧪 Testing viewed-pets endpoint with:", testPetId);

    try {
        // First check auth status
        const authStatus = debugAuthStatus();
        if (!authStatus.hasToken) {
            console.error("❌ No auth token available for test");
            return false;
        }

        // Test the endpoint
        const response = await api.post(`/api/users/viewed-pets/${testPetId}`);
        console.log("✅ Test successful:", response.data);
        return true;
    } catch (error: any) {
        console.error("❌ Test failed:", {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            hasToken: !!localStorage.getItem("token")
        });
        return false;
    }
};

// Ensure token is set on initial load
ensureAuthToken();

// Export utility functions for debugging and auth management
// Note: These functions are already exported individually above

/*
 * Debug Functions Usage Examples:
 * 
 * In browser console, you can use these functions to debug auth issues:
 * 
 * 1. Check auth status:
 *    import { debugAuthStatus } from '@/services/api';
 *    debugAuthStatus();
 * 
 * 2. Refresh auth token:
 *    import { refreshApiAuthToken } from '@/services/api';
 *    refreshApiAuthToken();
 * 
 * 3. Test viewed-pets endpoint:
 *    import { testViewedPetsEndpoint } from '@/services/api';
 *    testViewedPetsEndpoint();
 * 
 * 4. Ensure auth token is set:
 *    import { ensureAuthToken } from '@/services/api';
 *    ensureAuthToken();
 */