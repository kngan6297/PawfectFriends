import { api } from './api';
import { adminApi } from './admin.service';

export interface AnalyticsPeriod {
    period: '7d' | '30d' | '90d' | '1y';
    startDate?: string;
    endDate?: string;
}

export interface SystemAnalytics {
    users: {
        total: number;
        active: number;
        locked: number;
        admins: number;
        growth: number;
    };
    shelters: {
        total: number;
        approved: number;
        pending: number;
        banned: number;
        growth: number;
    };
    pets: {
        total: number;
        approved: number;
        pending: number;
        rejected: number;
        growth: number;
    };
    adoptions: {
        total: number;
        approved: number;
        pending: number;
        rejected: number;
        avgProcessingTime: number;
        successRate: number;
        growth: number;
    };
    reviews: {
        total: number;
        averageRating: number;
        growth: number;
    };
    notifications: {
        total: number;
        sent: number;
        read: number;
        readRate: number;
    };
    content: {
        total: number;
        published: number;
        draft: number;
        growth: number;
    };
}

export interface ShelterAnalytics {
    overview: {
        totalPets: number;
        totalAdoptions: number;
        avgProcessingTime: number;
        successRate: number;
        avgTimeToAdoption: number;
        totalReviews: number;
        averageRating: number;
    };
    trends: {
        adoptionsOverTime: Array<{ date: string; count: number }>;
        petsOverTime: Array<{ date: string; count: number }>;
        reviewsOverTime: Array<{ date: string; count: number; rating: number }>;
    };
    demographics: {
        petTypes: Array<{ type: string; count: number; percentage: number }>;
        petAges: Array<{ age: string; count: number; percentage: number }>;
        petSizes: Array<{ size: string; count: number; percentage: number }>;
    };
    performance: {
        responseTime: number;
        profileViews: number;
        inquiryRate: number;
        conversionRate: number;
    };
}

export interface UserAnalytics {
    profile: {
        totalViews: number;
        totalFavorites: number;
        totalInquiries: number;
        avgResponseTime: number;
    };
    activity: {
        totalLogins: number;
        lastLogin: string;
        avgSessionDuration: number;
        totalSessions: number;
    };
    preferences: {
        favoritePetTypes: Array<{ type: string; count: number }>;
        favoriteShelters: Array<{ shelterId: string; shelterName: string; count: number }>;
        searchHistory: Array<{ query: string; count: number; lastSearched: string }>;
    };
}

export interface AnalyticsFilters {
    period?: AnalyticsPeriod;
    shelterId?: string;
    userId?: string;
    dateRange?: {
        startDate: string;
        endDate: string;
    };
    includeDeleted?: boolean;
    groupBy?: 'day' | 'week' | 'month' | 'year';
}

class AnalyticsService {
    /**
     * Get system-wide analytics data
     */
    async getSystemAnalytics(filters?: AnalyticsFilters): Promise<SystemAnalytics> {
        try {
            const response = await adminApi.getSystemStats();

            // Handle the API response structure properly
            const stats = response.data.success ? response.data.data : response.data;

            // Calculate growth rates (mock data for now - would need historical data)
            const growthRate = 0.12; // 12% growth

            return {
                users: {
                    total: stats.totalUsers || 0,
                    active: stats.users?.active || 0,
                    locked: stats.users?.locked || 0,
                    admins: stats.users?.admins || 0,
                    growth: growthRate,
                },
                shelters: {
                    total: stats.totalShelters || 0,
                    approved: stats.shelters?.approved || 0,
                    pending: stats.shelters?.pending || 0,
                    banned: stats.shelters?.banned || 0,
                    growth: growthRate,
                },
                pets: {
                    total: stats.totalPets || 0,
                    approved: stats.pets?.approved || 0,
                    pending: stats.pets?.pending || 0,
                    rejected: stats.pets?.rejected || 0,
                    growth: growthRate,
                },
                adoptions: {
                    total: stats.totalAdoptions || 0,
                    approved: stats.adoptions?.approved || 0,
                    pending: stats.adoptions?.pending || 0,
                    rejected: stats.adoptions?.rejected || 0,
                    avgProcessingTime: 7.5, // Mock data
                    successRate: 85.2, // Mock data
                    growth: growthRate,
                },
                reviews: {
                    total: stats.totalReviews || 0,
                    averageRating: stats.reviews?.averageRating || 0,
                    growth: growthRate,
                },
                notifications: {
                    total: stats.notifications?.total || 0,
                    sent: stats.notifications?.sent || 0,
                    read: stats.notifications?.read || 0,
                    readRate: stats.notifications?.read && stats.notifications?.sent
                        ? (stats.notifications.read / stats.notifications.sent) * 100
                        : 0,
                },
                content: {
                    total: stats.content?.total || 0,
                    published: stats.content?.published || 0,
                    draft: stats.content?.draft || 0,
                    growth: growthRate,
                },
            };
        } catch (error) {
            console.error('Error fetching system analytics:', error);
            throw new Error('Failed to fetch system analytics');
        }
    }

    /**
     * Get shelter-specific analytics data
     */
    async getShelterAnalytics(shelterId: string, filters?: AnalyticsFilters): Promise<ShelterAnalytics> {
        try {
            // Fetch shelter dashboard data
            const dashboardResponse = await api.get(`/api/shelters/${shelterId}/dashboard`);
            const dashboardData = dashboardResponse.data?.data?.stats;

            // Mock trend data - in real implementation, this would come from backend
            const mockTrends = this.generateMockTrendData(filters?.period?.period || '30d');

            return {
                overview: {
                    totalPets: dashboardData?.petStats?.total || 0,
                    totalAdoptions: dashboardData?.adoptionStats?.byStatus?.approved?.count || 0,
                    avgProcessingTime: dashboardData?.adoptionStats?.avgProcessingTime || 0,
                    successRate: parseFloat(dashboardData?.adoptionStats?.successRate || '0'),
                    avgTimeToAdoption: dashboardData?.adoptionStats?.avgProcessingTime || 0,
                    totalReviews: dashboardData?.reviewStats?.total || 0,
                    averageRating: dashboardData?.reviewStats?.averageRating || 0,
                },
                trends: {
                    adoptionsOverTime: mockTrends.adoptions,
                    petsOverTime: mockTrends.pets,
                    reviewsOverTime: mockTrends.reviews,
                },
                demographics: {
                    petTypes: [
                        { type: 'Dog', count: 45, percentage: 60 },
                        { type: 'Cat', count: 25, percentage: 33 },
                        { type: 'Other', count: 5, percentage: 7 },
                    ],
                    petAges: [
                        { age: 'Puppy/Kitten', count: 20, percentage: 27 },
                        { age: 'Young', count: 30, percentage: 40 },
                        { age: 'Adult', count: 20, percentage: 27 },
                        { age: 'Senior', count: 5, percentage: 6 },
                    ],
                    petSizes: [
                        { size: 'Small', count: 25, percentage: 33 },
                        { size: 'Medium', count: 30, percentage: 40 },
                        { size: 'Large', count: 20, percentage: 27 },
                    ],
                },
                performance: {
                    responseTime: 2.5, // hours
                    profileViews: 1250,
                    inquiryRate: 15.8, // percentage
                    conversionRate: 12.5, // percentage
                },
            };
        } catch (error) {
            console.error('Error fetching shelter analytics:', error);
            throw new Error('Failed to fetch shelter analytics');
        }
    }

    /**
     * Get user-specific analytics data
     */
    async getUserAnalytics(userId: string, filters?: AnalyticsFilters): Promise<UserAnalytics> {
        try {
            // Mock user analytics data - in real implementation, this would come from backend
            return {
                profile: {
                    totalViews: 150,
                    totalFavorites: 25,
                    totalInquiries: 8,
                    avgResponseTime: 4.2, // hours
                },
                activity: {
                    totalLogins: 45,
                    lastLogin: new Date().toISOString(),
                    avgSessionDuration: 25, // minutes
                    totalSessions: 45,
                },
                preferences: {
                    favoritePetTypes: [
                        { type: 'Dog', count: 15 },
                        { type: 'Cat', count: 8 },
                        { type: 'Rabbit', count: 2 },
                    ],
                    favoriteShelters: [
                        { shelterId: '1', shelterName: 'Happy Paws Shelter', count: 5 },
                        { shelterId: '2', shelterName: 'Animal Rescue Center', count: 3 },
                    ],
                    searchHistory: [
                        { query: 'Golden Retriever', count: 8, lastSearched: new Date().toISOString() },
                        { query: 'Small dogs', count: 5, lastSearched: new Date().toISOString() },
                    ],
                },
            };
        } catch (error) {
            console.error('Error fetching user analytics:', error);
            throw new Error('Failed to fetch user analytics');
        }
    }

    /**
     * Get comparative analytics between periods
     */
    async getComparativeAnalytics(
        currentPeriod: AnalyticsPeriod,
        previousPeriod: AnalyticsPeriod,
        type: 'system' | 'shelter' | 'user' = 'system',
        entityId?: string
    ) {
        try {
            let currentData, previousData;

            switch (type) {
                case 'system':
                    currentData = await this.getSystemAnalytics({ period: currentPeriod });
                    previousData = await this.getSystemAnalytics({ period: previousPeriod });
                    break;
                case 'shelter':
                    if (!entityId) throw new Error('Shelter ID required for shelter analytics');
                    currentData = await this.getShelterAnalytics(entityId, { period: currentPeriod });
                    previousData = await this.getShelterAnalytics(entityId, { period: previousPeriod });
                    break;
                case 'user':
                    if (!entityId) throw new Error('User ID required for user analytics');
                    currentData = await this.getUserAnalytics(entityId, { period: currentPeriod });
                    previousData = await this.getUserAnalytics(entityId, { period: previousPeriod });
                    break;
            }

            return {
                current: currentData,
                previous: previousData,
                comparison: this.calculateComparison(currentData, previousData),
            };
        } catch (error) {
            console.error('Error fetching comparative analytics:', error);
            throw new Error('Failed to fetch comparative analytics');
        }
    }

    /**
     * Export analytics data in various formats
     */
    async exportAnalytics(
        data: any,
        format: 'json' | 'csv' | 'pdf' = 'json',
        filename?: string
    ): Promise<void> {
        const timestamp = new Date().toISOString().split('T')[0];
        const defaultFilename = `analytics-${timestamp}`;

        switch (format) {
            case 'json':
                this.downloadJSON(data, filename || `${defaultFilename}.json`);
                break;
            case 'csv':
                this.downloadCSV(data, filename || `${defaultFilename}.csv`);
                break;
            case 'pdf':
                // PDF export would require additional library
                console.warn('PDF export not implemented yet');
                break;
        }
    }

    /**
     * Generate mock trend data for development/testing
     */
    private generateMockTrendData(period: string) {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
        const adoptions = [];
        const pets = [];
        const reviews = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            adoptions.push({
                date: dateStr,
                count: Math.floor(Math.random() * 5) + 1,
            });

            pets.push({
                date: dateStr,
                count: Math.floor(Math.random() * 3) + 1,
            });

            reviews.push({
                date: dateStr,
                count: Math.floor(Math.random() * 4) + 1,
                rating: Math.random() * 2 + 3, // 3-5 rating
            });
        }

        return { adoptions, pets, reviews };
    }

    /**
     * Calculate comparison metrics between two datasets
     */
    private calculateComparison(current: any, previous: any) {
        const comparison: any = {};

        const calculatePercentageChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        // This would need to be customized based on the data structure
        // For now, return a simple comparison
        return {
            totalChange: calculatePercentageChange(
                current.totalUsers || current.totalPets || 0,
                previous.totalUsers || previous.totalPets || 0
            ),
            growthRate: calculatePercentageChange(
                current.users?.growth || current.overview?.totalPets || 0,
                previous.users?.growth || previous.overview?.totalPets || 0
            ),
        };
    }

    /**
     * Download data as JSON file
     */
    private downloadJSON(data: any, filename: string) {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Download data as CSV file
     */
    private downloadCSV(data: any, filename: string) {
        // Simple CSV conversion - would need to be customized based on data structure
        const csvContent = this.convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Convert data to CSV format
     */
    private convertToCSV(data: any): string {
        // This is a simplified CSV conversion
        // In a real implementation, you'd want to handle nested objects properly
        const headers = Object.keys(data);
        const rows = [headers.join(',')];

        const values = headers.map(header => {
            const value = data[header];
            return typeof value === 'object' ? JSON.stringify(value) : value;
        });
        rows.push(values.join(','));

        return rows.join('\n');
    }
}

export const analyticsService = new AnalyticsService();
