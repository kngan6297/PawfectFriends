import { create } from 'zustand';
import { AdoptionRequest } from '@/types';
import { adoptionService } from '@/services/adoptionService';

interface AdoptionState {
    requests: AdoptionRequest[];
    isLoading: boolean;
    error: string | null;
}

interface AdoptionActions {
    fetchUserRequests: () => Promise<void>;
    createRequest: (petId: string, applicationDetails: any) => Promise<AdoptionRequest | null>;
    updateRequest: (requestId: string, updates: any) => Promise<void>;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
}

export const useAdoptionStore = create<AdoptionState & AdoptionActions>((set, get) => ({
    // State
    requests: [],
    isLoading: false,
    error: null,

    // Actions
    fetchUserRequests: async () => {
        set({ isLoading: true, error: null });

        try {
            const response = await adoptionService.getUserRequests();
            if (response.success && response.data) {
                set({
                    requests: response.data,
                    isLoading: false,
                });
            } else {
                set({
                    isLoading: false,
                    error: response.message || 'Failed to fetch adoption requests',
                });
            }
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to fetch adoption requests',
            });
        }
    },

    createRequest: async (petId: string, applicationDetails: any) => {
        set({ isLoading: true, error: null });

        try {
            const response = await adoptionService.createRequest(petId, applicationDetails);

            if (response.success && response.data) {
                const { requests } = get();
                set({
                    requests: [response.data, ...requests],
                    isLoading: false,
                });
                return response.data;
            } else {
                set({
                    isLoading: false,
                    error: response.message || 'Failed to create adoption request',
                });
                return null;
            }
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to create adoption request',
            });
            return null;
        }
    },

    updateRequest: async (requestId: string, updates: any) => {
        try {
            const response = await adoptionService.updateRequest(requestId, updates);

            if (response.success && response.data) {
                const { requests } = get();
                const updatedRequests = requests.map(req =>
                    req.id === requestId ? { ...req, ...response.data } : req
                );
                set({ requests: updatedRequests });
            } else {
                set({ error: response.message || 'Failed to update adoption request' });
            }
        } catch (error: any) {
            set({ error: error.message || 'Failed to update adoption request' });
        }
    },

    setLoading: (loading: boolean) => {
        set({ isLoading: loading });
    },

    setError: (error: string | null) => {
        set({ error });
    },

    clearError: () => {
        set({ error: null });
    },
}));
