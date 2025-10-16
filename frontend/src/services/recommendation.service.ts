import { api } from '@/services/api';
import { Pet } from '@/types/pet';
import { UserRequirements } from '@/types/user';

export interface ScoringPreferences {
    // Core preferences - all as arrays for consistency
    lifestyle?: string[];
    experience?: string[];
    livingSpace?: string[];
    timeAvailable?: string[];
    hasChildren?: string[];
    hasOtherPets?: string[];
    preferredSpecies?: string[];
    preferredTypes?: string[];
    preferredSizes?: string[];
    preferredAges?: string[];
    preferredBreeds?: string[];
    maxDistance?: number;

    // Additional lifestyle preferences - all as arrays
    activityLevel?: string[];
    workSchedule?: string[];
    travelFrequency?: string[];
    noiseTolerance?: string[];
    groomingPreference?: string[];
    trainingCommitment?: string[];
    budget?: string[];
    allergies?: string[];

    // Additional fields from wizard version - all as arrays
    homeType?: string[];
    spaceAvailable?: string[];
    hasYard?: string[];
    additionalInfo?: string;
}

export interface ScoredPet {
    pet: Pet;
    score: number;
    ml_score?: number;
    rule_score?: number;
    learned_bonus?: number;
    factors: string[];
    explanation: string;
    confidence: number;
}

export interface WizardRecommendationResponse {
    recommendations: ScoredPet[];
    total: number;
    userPreferences: ScoringPreferences;
    isGuest: boolean;
    useML: boolean;
}

export const recommendationService = {
    // Get pet recommendations
    async getPetRecommendations(): Promise<Pet[]> {
        try {
            // Use the correct backend endpoint for personalized recommendations
            const response = await api.get('/api/recommendations/personalized');
            console.log('Recommendation response:', response.data);

            // The backend returns recommendations with pet objects nested inside
            const recommendations = response.data?.data?.recommendations || [];

            // Extract pet objects from recommendation objects
            const pets = recommendations.map((rec: any) => {
                // Handle both direct pet objects and recommendation objects
                if (rec.pet) {
                    return rec.pet;
                }
                return rec;
            });

            console.log('Extracted pets:', pets);
            return pets;
        } catch (error) {
            console.error('Failed to fetch pet recommendations:', error);
            // Return empty array for guest users or API errors
            return [];
        }
    },

    // Get requirements-based recommendations
    async getRequirementsBasedRecommendations(
        options: {
            limit?: number;
            minRequirementsCompletion?: number;
            includeRequirementsAnalysis?: boolean;
        } = {}
    ): Promise<any> {
        try {
            const response = await api.get('/api/recommendations/requirements-based', {
                params: options
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch requirements-based recommendations:', error);
            throw error;
        }
    },

    // Get similar users recommendations
    async getSimilarUsersRecommendations(
        options: {
            limit?: number;
            minSimilarity?: number;
            includeSimilarityScore?: boolean;
        } = {}
    ): Promise<any> {
        try {
            const response = await api.get('/api/recommendations/similar-users', {
                params: options
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch similar users recommendations:', error);
            throw error;
        }
    },

    // Update user requirements
    async updateUserRequirements(requirements: Partial<UserRequirements>): Promise<any> {
        try {
            const response = await api.put('/api/users/profile/requirements', requirements);
            return response.data;
        } catch (error) {
            console.error('Failed to update user requirements:', error);
            throw error;
        }
    },

    // Get user requirements
    async getUserRequirements(): Promise<UserRequirements | null> {
        try {
            const response = await api.get('/api/users/profile/requirements');
            return response.data?.data?.requirements || null;
        } catch (error) {
            console.error('Failed to fetch user requirements:', error);
            return null;
        }
    },

    // NEW: Get wizard-based recommendations (works for guests and users)
    async getWizardRecommendations(
        preferences: ScoringPreferences,
        options: {
            limit?: number;
            minScore?: number;
            useML?: boolean;
        } = {}
    ): Promise<WizardRecommendationResponse> {
        try {
            const {
                limit = 20,
                minScore = 0.1,
                useML = true
            } = options;

            console.log('Getting wizard recommendations with preferences:', preferences);

            const response = await api.post('/api/recommendations/wizard', preferences, {
                params: {
                    limit,
                    minScore,
                    useML
                }
            });

            if (response.data?.success && response.data?.data) {
                console.log(`Successfully got ${response.data.data.recommendations.length} wizard recommendations`);
                return response.data.data;
            }

            throw new Error('Invalid response from wizard recommendations API');

        } catch (error) {
            console.error('Error getting wizard recommendations:', error);
            // Return empty response for fallback
            return {
                recommendations: [],
                total: 0,
                userPreferences: preferences,
                isGuest: true,
                useML: false
            };
        }
    },

    // NEW: Score pets using AI service instead of local mapping
    async scorePetsWithAI(
        pets: Pet[],
        preferences: ScoringPreferences,
        options: {
            useLearning?: boolean;
            useML?: boolean;
            mlWeight?: number;
            ruleWeight?: number;
        } = {}
    ): Promise<ScoredPet[]> {
        try {
            const {
                useLearning = true,
                useML = true,
                mlWeight = 0.7,
                ruleWeight = 0.3
            } = options;

            console.log(`Scoring ${pets.length} pets with AI service`);

            const response = await api.post('/api/recommendations/score', {
                preferences,
                pets,
                useLearning,
                useML,
                mlWeight,
                ruleWeight
            });

            if (response.data?.success && response.data?.data?.scoredPets) {
                console.log(`Successfully scored ${response.data.data.scoredPets.length} pets with AI`);
                return response.data.data.scoredPets;
            }

            console.warn('AI scoring failed, falling back to local scoring');
            return this.fallbackLocalScoring(pets, preferences);

        } catch (error) {
            console.error('Error scoring pets with AI service:', error);
            console.log('Falling back to local scoring');
            return this.fallbackLocalScoring(pets, preferences);
        }
    },

    // Fallback local scoring when AI service is unavailable
    fallbackLocalScoring(pets: Pet[], preferences: ScoringPreferences): ScoredPet[] {
        console.log('Using fallback local scoring');

        const scoredPets: ScoredPet[] = [];

        for (const pet of pets) {
            let score = 0;
            const factors: string[] = [];

            // Basic preference matching
            if (preferences.preferredSpecies && preferences.preferredSpecies.includes(pet.type)) {
                score += 0.4;
                factors.push('Matches your preferred species');
            }

            // Size compatibility
            if (preferences.livingSpace && preferences.livingSpace.length > 0) {
                if (preferences.livingSpace.some(space => space.includes('apartment')) && pet.size === 'small') {
                    score += 0.25;
                    factors.push('Good for apartment living');
                } else if (preferences.livingSpace.some(space => space.includes('yard')) && pet.size === 'large') {
                    score += 0.25;
                    factors.push('Great for homes with yards');
                }
            }

            // Experience compatibility
            if (preferences.experience && preferences.experience.includes('first-time') && pet.age === 'adult') {
                score += 0.2;
                factors.push('Good for first-time owners');
            }

            // Add some randomization
            const randomBonus = Math.random() * 0.1;
            score += randomBonus;

            scoredPets.push({
                pet,
                score: Math.min(score, 1.0),
                factors,
                explanation: `${pet.name}: ${factors.join(', ')}.`,
                confidence: 0.5
            });
        }

        // Sort by score
        scoredPets.sort((a, b) => b.score - a.score);
        return scoredPets;
    },

    // Submit feedback for AI learning
    async submitFeedback(feedbackData: {
        petId: string;
        feedback: "positive" | "negative" | "neutral";
        reason: string;
        userPreferences?: any;
        petAttributes?: any;
        recommendationScore?: number;
        sessionId?: string;
        additionalDetails?: any;
    }): Promise<any> {
        try {
            const response = await api.post('/api/recommendations/feedback/submit', feedbackData);
            return response.data;
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            throw error;
        }
    },

    // Clear recommendation cache
    async clearRecommendationCache(): Promise<void> {
        try {
            await api.post('/recommendations/clear-cache');
        } catch (error) {
            console.error('Failed to clear recommendation cache:', error);
            throw error;
        }
    },

    // Record user interaction for AI learning
    async recordInteraction(
        petId: string,
        interactionType: 'view' | 'favorite' | 'chat' | 'adopt' | 'ignore' | 'recommendation_generated',
        additionalData: any = {}
    ): Promise<any> {
        try {
            const response = await api.post('/api/recommendations/interactions/record-enhanced', {
                petId,
                interactionType,
                timestamp: new Date().toISOString(),
                ...additionalData
            });
            return response.data;
        } catch (error) {
            console.error('Failed to record interaction:', error);
            // Don't throw error for interaction recording failures
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    },

    // Get recommendation analytics (admin only)
    async getRecommendationAnalytics(period: string = '30d'): Promise<any> {
        try {
            const response = await api.get('/api/recommendations/analytics', {
                params: { period }
            });
            return response.data?.data;
        } catch (error) {
            console.error('Failed to fetch recommendation analytics:', error);
            throw error;
        }
    },

    // Update user preferences
    async updatePreferences(preferences: ScoringPreferences): Promise<void> {
        try {
            await api.put('/api/recommendations/preferences', preferences);
        } catch (error) {
            console.error('Failed to update preferences:', error);
            throw error;
        }
    },

    // Get recommendation history
    async getRecommendationHistory(page: number = 1, limit: number = 20): Promise<any> {
        try {
            const response = await api.get('/api/recommendations/history', {
                params: { page, limit }
            });
            return response.data?.data;
        } catch (error) {
            console.error('Failed to fetch recommendation history:', error);
            throw error;
        }
    },

    // Get pet recommendation insights
    async getPetInsights(petId: string): Promise<any> {
        try {
            const response = await api.get(`/api/recommendations/insights/${petId}`);
            return response.data?.data;
        } catch (error) {
            console.error('Failed to fetch pet insights:', error);
            throw error;
        }
    }
}; 