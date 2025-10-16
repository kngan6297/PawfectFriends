import { useState, useEffect, useCallback } from 'react';
import { petApi } from '@/services/api';
import { Pet } from '@/types/pet';
import { toast } from 'react-toastify';

interface DashboardStats {
    petStats: {
        total: number;
        byStatus: Record<string, { count: number; avgViews: number }>;
        topPets: any[];
        monthlyStats?: any[];
    };
    adoptionStats: {
        byStatus: Record<string, { count: number; avgProcessingTime: number }>;
        successRate: string;
        avgProcessingTime: number;
        monthlyAdoptions?: any[];
    };
    reviewStats: {
        total: number;
        avgRating: number;
        recentReviews: any[];
        ratingBreakdown?: Array<{ _id: number; count: number }>;
    };
    recentActivity: {
        recentPets: any[];
        recentRequests: any[];
        recentReviews: any[];
    };
}

interface DashboardAdoptionRequest {
    _id: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    pet?: {
        id: string;
        name: string;
        photos: Array<{ url: string }>;
    } | null;
    status: "pending" | "approved" | "rejected" | "scheduled" | "completed";
    applicationDetails: any;
    createdAt: string;
}

interface UseShelterDataReturn {
    // Data
    stats: DashboardStats | null;
    pets: Pet[];
    requests: DashboardAdoptionRequest[];
    meetings: any[];

    // Loading states
    isLoading: boolean;
    error: string | null;

    // Actions
    refreshData: () => Promise<void>;
    updateRequestStatusFilter: (filter: string) => void;
    requestStatusFilter: string;
}

// Global cache to prevent duplicate requests
let dataCache: {
    stats: DashboardStats | null;
    pets: Pet[];
    requests: DashboardAdoptionRequest[];
    meetings: any[];
    lastFetch: number;
} = {
    stats: null,
    pets: [],
    requests: [],
    meetings: [],
    lastFetch: 0,
};

const CACHE_DURATION = 30000; // 30 seconds

export const useShelterData = (): UseShelterDataReturn => {
    const [stats, setStats] = useState<DashboardStats | null>(dataCache.stats);
    const [pets, setPets] = useState<Pet[]>(dataCache.pets);
    const [requests, setRequests] = useState<DashboardAdoptionRequest[]>(dataCache.requests);
    const [meetings, setMeetings] = useState<any[]>(dataCache.meetings);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requestStatusFilter, setRequestStatusFilter] = useState<string>("all");
    const [isInitialized, setIsInitialized] = useState(false);

    const fetchAllData = useCallback(async (forceRefresh = false) => {
        const now = Date.now();
        const isCacheValid = now - dataCache.lastFetch < CACHE_DURATION;

        // Return cached data if it's still valid and not forcing refresh
        if (isCacheValid && !forceRefresh && dataCache.stats) {
            setStats(dataCache.stats);
            setPets(dataCache.pets);
            setRequests(dataCache.requests);
            setMeetings(dataCache.meetings);
            setError(null);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            console.log("🔄 Fetching shelter data...");

            // Fetch all data in parallel
            const [dashboardResponse, petsResponse, requestsResponse, meetingsResponse] = await Promise.all([
                petApi.getShelterDashboard(),
                petApi.getShelterPets(),
                petApi.getAdoptionRequests({
                    status: requestStatusFilter !== "all" ? requestStatusFilter : undefined,
                }),
                petApi.getAllShelterMeetings(),
            ]);

            console.log("📊 Dashboard response:", dashboardResponse);
            console.log("🐕 Pets response:", petsResponse);
            console.log("📝 Requests response:", requestsResponse);
            console.log("📅 Meetings response:", meetingsResponse);

            // Process dashboard data
            let updatedStats = null;
            if (dashboardResponse.data?.data?.stats) {
                updatedStats = dashboardResponse.data.data.stats;
            } else if (dashboardResponse.data?.stats) {
                updatedStats = dashboardResponse.data.stats;
            }

            // Ensure stats has required structure
            if (updatedStats) {
                updatedStats = {
                    petStats: updatedStats.petStats || { total: 0, byStatus: {}, topPets: [] },
                    adoptionStats: updatedStats.adoptionStats || { byStatus: {}, successRate: "0%", avgProcessingTime: 0 },
                    reviewStats: {
                        ...updatedStats.reviewStats,
                        total: updatedStats.reviewStats?.total || 0,
                        avgRating: updatedStats.reviewStats?.avgRating || 0,
                        recentReviews: updatedStats.reviewStats?.recentReviews || [],
                        ratingBreakdown: updatedStats.reviewStats?.ratingBreakdown || []
                    },
                    recentActivity: updatedStats.recentActivity || { recentPets: [], recentRequests: [], recentReviews: [] }
                };
            }

            // Process pets data
            const petsData = petsResponse.data?.data || petsResponse.data || petsResponse;
            const processedPets = Array.isArray(petsData) ? petsData : [];

            // Process adoption requests data
            const requestsData = requestsResponse.data?.data || [];
            const processedRequests = Array.isArray(requestsData) ? requestsData.map((request: any) => {
                const transformedRequest = {
                    _id: request._id,
                    user: {
                        id: request.userDetails?._id || request.user?._id || request.user,
                        name: request.userDetails?.name || request.user?.name || request.userDetails?.email || 'Unknown User',
                        email: request.userDetails?.email || request.user?.email || 'No email'
                    },
                    pet: {
                        id: request.petDetails?._id || request.pet?._id || request.pet || 'unknown',
                        name: request.petDetails?.name || request.pet?.name || 'Pet information not available',
                        photos: request.petDetails?.photos || request.pet?.photos || []
                    },
                    status: request.status || 'pending',
                    applicationDetails: request.applicationDetails || {},
                    createdAt: request.createdAt || request.applicationDate || new Date().toISOString(),
                    updatedAt: request.updatedAt || request.createdAt || new Date().toISOString()
                };



                return transformedRequest;
            }) : [];

            // Process meetings data
            const meetingsData = meetingsResponse.data?.data || [];

            // Update state
            setStats(updatedStats);
            setPets(processedPets);
            setRequests(processedRequests);
            setMeetings(meetingsData);

            // Update cache
            dataCache = {
                stats: updatedStats,
                pets: processedPets,
                requests: processedRequests,
                meetings: meetingsData,
                lastFetch: now,
            };

        } catch (error) {
            console.error("Shelter data fetch error:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch data";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial data fetch
    useEffect(() => {
        if (!isInitialized) {
            setIsInitialized(true);
            fetchAllData();
        }
    }, [fetchAllData, isInitialized]);

    const refreshData = useCallback(async () => {
        await fetchAllData(true); // Force refresh
    }, [fetchAllData]);

    const updateRequestStatusFilter = useCallback((filter: string) => {
        setRequestStatusFilter(filter);
    }, []);

    return {
        stats,
        pets,
        requests,
        meetings,
        isLoading,
        error,
        refreshData,
        updateRequestStatusFilter,
        requestStatusFilter,
    };
}; 