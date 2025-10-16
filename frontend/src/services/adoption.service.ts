import { api } from './api';

export interface AdoptionStatus {
    hasRequest: boolean;
    hasCompleted: boolean;
    requestStatus?: 'pending' | 'under_review' | 'approved' | 'completed' | 'rejected';
    adoptionDate?: string;
}

class AdoptionService {
    /**
     * Check if user has adoption request or completed adoption with shelter
     */
    async checkUserAdoptionStatus(userId: string, shelterId: string, petId?: string): Promise<AdoptionStatus> {
        try {
            // Handle undefined or null userId
            if (!userId) {
                console.log('User ID is undefined/null, skipping adoption status check');
                return {
                    hasRequest: false,
                    hasCompleted: false
                };
            }

            // If userId looks like an email, skip the API call and return default values
            // This happens when the user object doesn't have a proper ObjectId
            if (userId.includes('@')) {
                console.log('User ID is an email, skipping adoption status check');
                return {
                    hasRequest: false,
                    hasCompleted: false
                };
            }

            const params = new URLSearchParams({
                userId,
                shelterId,
                ...(petId && { petId })
            });

            const response = await api.get(`/api/adoptions/status?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error checking adoption status:', error);
            // Return false values if API call fails
            return {
                hasRequest: false,
                hasCompleted: false
            };
        }
    }

    /**
     * Check if user can communicate with shelter based on adoption history
     */
    async canCommunicateWithShelter(userId: string, shelterId: string, petId?: string): Promise<boolean> {
        try {
            const status = await this.checkUserAdoptionStatus(userId, shelterId, petId);
            return status.hasRequest || status.hasCompleted;
        } catch (error) {
            console.error('Error checking communication eligibility:', error);
            return false;
        }
    }

    /**
     * Submit adoption request for a pet
     */
    async submitAdoptionRequest(petId: string, data: any) {
        try {
            const response = await api.post(`/adoption/request`, {
                petId,
                ...data
            });
            return response.data;
        } catch (error) {
            console.error('Error submitting adoption request:', error);
            throw error;
        }
    }

    /**
     * Get user's adoption requests
     */
    async getUserAdoptionRequests(userId?: string) {
        try {
            const response = await api.get('/adoption/requests', {
                params: userId ? { userId } : {}
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching adoption requests:', error);
            throw error;
        }
    }

    /**
     * Get shelter's adoption requests
     */
    async getShelterAdoptionRequests(shelterId?: string) {
        try {
            const response = await api.get('/adoption/shelter-requests', {
                params: shelterId ? { shelterId } : {}
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching shelter adoption requests:', error);
            throw error;
        }
    }

    /**
     * Get individual shelter adoption request
     */
    async getShelterAdoptionRequest(requestId: string) {
        try {
            const response = await api.get(`/adoption/${requestId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching shelter adoption request:', error);
            throw error;
        }
    }
}

export const adoptionService = new AdoptionService();
export default adoptionService;