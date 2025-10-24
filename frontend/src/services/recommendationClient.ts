import { Pet } from "@/types/pet";
import { petApi } from "./api";
import { toISOString } from "@/utils/dateUtils";
import { getTopRecommendations } from "@/utils/matchScoring";

// ============================================================================
// CONSTANTS
// ============================================================================

// Get AI service URL with fallback logic
const getAIServiceURL = () => {
    const envUrl = import.meta.env.VITE_AI_SERVICE_URL;
    
    // If environment variable is set, use it
    if (envUrl) {
        return envUrl;
    }
    
    // Fallback: detect production environment and use production AI service URL
    if (import.meta.env.PROD || window.location.hostname.includes('pawfectfriends.xyz')) {
        return 'https://ai.pawfectfriends.xyz';
    }
    
    // Default to localhost for development
    return 'http://localhost:8000';
};

const CONSTANTS = {
    BASE_URL: getAIServiceURL(),
    TIMEOUT_MS: parseInt(import.meta.env.VITE_AI_SERVICE_TIMEOUT || '10000'),
    TOP_K: parseInt(import.meta.env.VITE_TOP_K_DEFAULT || '6'),
    DEFAULT_LIMIT: 5,
    APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
    MAX_RETRIES: 1, // Only retry once for network/timeout errors
} as const;

// Debug AI service configuration
console.log('🤖 AI Service Configuration:', {
    VITE_AI_SERVICE_URL: import.meta.env.VITE_AI_SERVICE_URL,
    detectedURL: getAIServiceURL(),
    BASE_URL: CONSTANTS.BASE_URL,
    isProduction: import.meta.env.PROD,
    environment: import.meta.env.MODE,
    hostname: window.location.hostname
});

// ============================================================================
// ERROR SHAPING
// ============================================================================

export class AIError extends Error {
    constructor(
        message: string,
        public code: string,
        public status?: number,
        public requestId?: string
    ) {
        super(message);
        this.name = 'AIError';
    }

    static fromResponse(status: number, message: string, requestId: string): AIError {
        const code = status >= 500 ? 'SERVER_ERROR' :
            status >= 400 ? 'CLIENT_ERROR' : 'UNKNOWN_ERROR';

        const userMessage = status >= 500 ? 'Server is busy, please try again later' :
            status >= 400 ? 'Invalid request, please check your input' :
                'An unexpected error occurred';

        return new AIError(userMessage, code, status, requestId);
    }

    static fromTimeout(timeoutMs: number, requestId: string): AIError {
        return new AIError(
            'Request timed out, please check your connection',
            'TIMEOUT',
            undefined,
            requestId
        );
    }

    static fromNetwork(error: Error, requestId: string): AIError {
        return new AIError(
            'Network is unstable, please check your connection',
            'NETWORK_ERROR',
            undefined,
            requestId
        );
    }

    // Helper to determine if error is retryable
    isRetryable(): boolean {
        return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT';
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

const generateRequestId = (): string => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createTimeoutController = (timeoutMs: number = CONSTANTS.TIMEOUT_MS): AbortController => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller;
};

// ============================================================================
// TRANSFORMATIONS
// ============================================================================

/**
 * Normalizes preferences to ensure all fields are arrays for consistent API communication
 */
const normalizePreferences = (preferences: any): any => {
    const toArray = (value: any): string[] => {
        if (!value) return [];
        if (value === '') return []; // Handle empty strings
        if (Array.isArray(value)) return value.filter(item => item != null && item !== '');
        return [value].filter(item => item != null && item !== '');
    };

    // Clean the preferences object to remove any undefined/null/empty string values
    const cleanedPreferences = Object.fromEntries(
        Object.entries(preferences).filter(([_, value]) => value != null && value !== '')
    );

    return {
        ...cleanedPreferences,
        // Core preferences
        lifestyle: toArray(preferences.lifestyle),
        experience: toArray(preferences.experience),
        livingSpace: toArray(preferences.livingSpace),
        timeAvailable: toArray(preferences.timeAvailable),
        hasChildren: toArray(preferences.hasChildren),
        hasOtherPets: toArray(preferences.hasOtherPets),
        preferredSpecies: toArray(preferences.preferredSpecies),
        preferredTypes: toArray(preferences.preferredTypes),
        preferredSizes: toArray(preferences.preferredSizes),
        preferredAges: toArray(preferences.preferredAges),
        preferredBreeds: toArray(preferences.preferredBreeds),

        // Additional preferences
        activityLevel: toArray(preferences.activityLevel),
        workSchedule: toArray(preferences.workSchedule),
        travelFrequency: toArray(preferences.travelFrequency),
        noiseTolerance: toArray(preferences.noiseTolerance),
        groomingPreference: toArray(preferences.groomingPreference),
        trainingCommitment: toArray(preferences.trainingCommitment),
        budget: toArray(preferences.budget),
        allergies: toArray(preferences.allergies),
        homeType: toArray(preferences.homeType),
        spaceAvailable: toArray(preferences.spaceAvailable),
        hasYard: toArray(preferences.hasYard),

        // Additional preference fields that AI services might expect
        petAge: toArray(preferences.preferredAges),
        petSize: toArray(preferences.preferredSizes),
        petBreed: toArray(preferences.preferredBreeds),
        petType: toArray(preferences.preferredTypes),
        petGender: toArray(preferences.preferredGender),
        petEnergyLevel: toArray(preferences.preferredEnergyLevel),
        petTemperament: toArray(preferences.preferredTemperament),
        petSpecialNeeds: toArray(preferences.preferredSpecialNeeds),
        petTrainingLevel: toArray(preferences.preferredTrainingLevel),
        petGroomingLevel: toArray(preferences.preferredGroomingLevel)
    };
};

/**
 * Normalizes Pet object to AI service format with consistent property names
 * Ensures petId is always a string to prevent mapping failures from server/DB number/string mixing
 */
const toAiPet = (pet: Pet) => {
    // Log the original pet data for debugging
    console.log(`[AI Service] Transforming pet:`, {
        id: pet.id || pet._id,
        name: pet.name,
        type: pet.type,
        breed: pet.breed,
        age: pet.age,
        size: pet.size
    });

    // Ensure all required fields have valid values
    const transformedPet = {
        id: String(pet.id ?? pet._id ?? ''),
        name: pet.name || 'Unknown',
        type: pet.type || 'unknown',
        breed: pet.breed ?? pet.breeds?.primary ?? 'Unknown',
        // Convert age to string if it's a descriptive value, otherwise use 0
        age: pet.age && typeof pet.age === 'string' ? pet.age : '0',
        size: pet.size || 'unknown',
        description: pet.description || '',
        photos: pet.photos?.map(photo => photo.url).filter(Boolean) ?? [],
        health_records: pet.health ? [pet.health] : [],
        behavior_records: pet.behavior ? [pet.behavior] : [],
        created_at: pet.createdAt ? toISOString(pet.createdAt) : new Date().toISOString(),
        view_count: typeof pet.views === 'number' ? pet.views : 0,
        adoptionFee: typeof pet.adoptionFee === 'number' ? pet.adoptionFee : 0,
        status: pet.status || 'unknown',
        // Add additional fields that might be required by AI service
        gender: (pet as any).gender || 'unknown',
        color: (pet as any).color || 'unknown',
        weight: (pet as any).weight || 'unknown',
        energy_level: (pet as any).energyLevel || 'medium',
        good_with_children: (pet as any).goodWithChildren || 'unknown',
        good_with_dogs: (pet as any).goodWithDogs || 'unknown',
        good_with_cats: (pet as any).goodWithCats || 'unknown',

        // Additional fields that AI services commonly expect
        temperament: (pet as any).temperament || 'unknown',
        special_needs: (pet as any).specialNeeds || false,
        house_trained: (pet as any).houseTrained || false,
        microchipped: (pet as any).microchipped || false,
        declawed: (pet as any).declawed || false,
        spayed_neutered: (pet as any).spayedNeutered || false,
        vaccinated: (pet as any).vaccinated || false,
        location: (pet as any).location || 'unknown',
        organization: (pet as any).organization || 'unknown',
        contact_info: (pet as any).contactInfo || 'unknown'
    };

    // Log the transformed pet for debugging
    console.log(`[AI Service] Transformed pet:`, {
        id: transformedPet.id,
        name: transformedPet.name,
        type: transformedPet.type,
        breed: transformedPet.breed,
        age: transformedPet.age,
        size: transformedPet.size
    });

    return transformedPet;
};

// ============================================================================
// HTTP CLIENT
// ============================================================================

interface HttpOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    timeout?: number;
    signal?: AbortSignal;
    credentials?: RequestCredentials; // For CORS with cookies/JWT
    headers?: Record<string, string>; // For Authorization headers
}

const http = async <T>(path: string, options: HttpOptions = {}): Promise<T> => {
    const {
        method = 'GET',
        body,
        timeout = CONSTANTS.TIMEOUT_MS,
        signal,
        credentials = 'same-origin', // Default to same-origin for security
        headers = {}
    } = options;

    const requestId = generateRequestId();
    const controller = new AbortController();

    if (signal) {
        signal.addEventListener('abort', () => controller.abort());
    }

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const url = `${CONSTANTS.BASE_URL}${path}`;

        const requestHeaders = {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'X-Client-Version': CONSTANTS.APP_VERSION,
            ...headers,
        };

        console.log(`[AI Service] ${method} ${url}`, { requestId, body });

        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
            credentials, // Include credentials for CORS
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[AI Service] HTTP ${response.status} error:`, {
                status: response.status,
                statusText: response.statusText,
                errorText,
                requestId,
                url,
                body
            });

            // Try to parse error response as JSON for more details
            let errorDetails = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorDetails = errorJson.detail || errorJson.message || errorText;
                console.error("[AI Service] Parsed error details:", errorJson);

                // Log specific validation errors if available
                if (errorJson.detail && Array.isArray(errorJson.detail)) {
                    console.error("[AI Service] Validation errors:", errorJson.detail.map((err: any) => ({
                        type: err.type,
                        location: err.loc?.join('.'),
                        message: err.msg,
                        input: err.input
                    })));

                    // Log the first few errors in detail to understand the pattern
                    const firstErrors = errorJson.detail.slice(0, 5);
                    console.error("[AI Service] First 5 validation errors:", firstErrors);

                    // Check if there are missing field errors
                    const missingFieldErrors = errorJson.detail.filter((err: any) => err.type === 'missing');
                    if (missingFieldErrors.length > 0) {
                        console.error("[AI Service] Missing field errors:", missingFieldErrors);

                        // Show exactly which fields are missing for the first few pets
                        const missingFieldLocations = missingFieldErrors.map((err: any) => err.loc?.join('.')).filter(Boolean);
                        const uniqueMissingFields = [...new Set(missingFieldLocations)];
                        console.error("[AI Service] Unique missing field locations:", uniqueMissingFields);

                        // Show the first few missing field errors in detail
                        const firstMissingErrors = missingFieldErrors.slice(0, 3);
                        console.error("[AI Service] First 3 missing field errors in detail:", firstMissingErrors);
                    }
                }
            } catch (e) {
                // If not JSON, use the raw text
                console.error("[AI Service] Raw error response:", errorText);
            }

            throw AIError.fromResponse(response.status, errorDetails, requestId);
        }

        const result = await response.json();
        console.log(`[AI Service] ${method} ${url} success`, { requestId, result });

        return result;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof AIError) {
            throw error;
        }

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw AIError.fromTimeout(timeout, requestId);
            }
            throw AIError.fromNetwork(error, requestId);
        }

        throw AIError.fromNetwork(new Error('Unknown error'), requestId);
    }
};

// ============================================================================
// INTERFACES
// ============================================================================

interface RecommendationRequest {
    status?: string;
    type?: string;
    limit?: number;
}

interface RecommendationResponse {
    pets: Pet[];
    success: boolean;
    error?: string;
}

// Separate Match Score from Confidence for clearer UI
export interface AIMatchScore {
    petId: string;
    score: number; // Match Score (0-1) - how well the pet matches preferences
    confidence?: number; // Confidence (0-1) - how certain the AI is about the score
    reasons: string[]; // Why this pet is recommended
}

interface AIRecommendationResponse {
    matches: AIMatchScore[];
}

// ============================================================================
// RECOMMENDATION CLIENT
// ============================================================================

export const recommendationClient = {
    /**
     * Check if AI service is available
     */
    async checkHealth(): Promise<boolean> {
        const healthUrl = `${CONSTANTS.BASE_URL}/health`;
        console.log(`🤖 [AI Service] Starting health check for: ${healthUrl}`);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            // Try a simple GET request to see if the service responds
            const response = await fetch(healthUrl, {
                method: 'GET',
                signal: controller.signal,
                mode: 'cors', // Explicitly set CORS mode
                credentials: 'omit', // Don't send credentials for health check
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            });

            clearTimeout(timeoutId);

            // Log the response for debugging
            console.log('🤖 [AI Service] Health check response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                url: response.url,
                headers: Object.fromEntries(response.headers.entries())
            });

            // If we get any successful response (2xx), the service is running
            if (response.ok) {
                try {
                    const data = await response.json();
                    console.log('🤖 [AI Service] Health check data:', data);
                    const isHealthy = data.status === 'OK';
                    console.log(`🤖 [AI Service] Health check result: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
                    return isHealthy;
                } catch (jsonError) {
                    console.warn('🤖 [AI Service] Failed to parse health check response:', jsonError);
                    console.log('🤖 [AI Service] Assuming healthy due to 200 response');
                    return true; // If we got a 200 response, service is likely OK
                }
            }

            console.warn(`🤖 [AI Service] Health check failed with status: ${response.status}`);
            return false;
        } catch (error) {
            console.warn('🤖 [AI Service] Health check failed:', error);

            // If CORS error, try a different approach - check if we can reach the service
            if (error instanceof TypeError && error.message.includes('CORS')) {
                console.log('🤖 [AI Service] CORS error detected, trying alternative health check...');
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    // Try to make a simple request to the ping endpoint
                    const fallbackResponse = await fetch(`${CONSTANTS.BASE_URL}/ping`, {
                        method: 'GET',
                        signal: controller.signal,
                        mode: 'no-cors', // Use no-cors mode as fallback
                    });

                    clearTimeout(timeoutId);

                    // With no-cors mode, we can't read the response, but if no error is thrown,
                    // the service is likely reachable
                    console.log('🤖 [AI Service] Fallback health check succeeded (no-cors mode)');
                    return true;
                } catch (fallbackError) {
                    console.warn('🤖 [AI Service] Fallback health check also failed:', fallbackError);
                    return false;
                }
            }

            console.warn('🤖 [AI Service] Health check failed with error:', error instanceof Error ? error.message : String(error));
            return false;
        }
    },

    async getRecommendations(
        preferences: any,
        requestParams: RecommendationRequest = {}
    ): Promise<RecommendationResponse> {
        try {
            const defaultParams = {
                status: "adoptable",
                type: preferences.preferredSpecies?.length > 0
                    ? preferences.preferredSpecies[0]
                    : undefined,
                limit: 20,
                ...requestParams,
            };

            const petsResponse = await petApi.getPets(defaultParams, []);

            if (petsResponse.pets && petsResponse.pets.length > 0) {
                const topPets = getTopRecommendations(
                    petsResponse.pets,
                    preferences,
                    CONSTANTS.TOP_K
                );

                return {
                    pets: topPets,
                    success: true,
                };
            } else {
                return {
                    pets: [],
                    success: true,
                };
            }
        } catch (error) {
            console.error("Error getting recommendations:", error);
            return {
                pets: [],
                success: false,
                error: "Failed to load pet recommendations",
            };
        }
    },

    /**
     * Get AI match scores for pets based on user preferences
     * Racing results are prevented by unique request IDs and consistent pet ID stringification.
     * Implements retry policy: retry once for NETWORK/TIMEOUT errors, never for 5xx errors.
     */
    async getAIMatchScores(
        preferences: any,
        pets: Pet[],
        signal?: AbortSignal
    ): Promise<AIMatchScore[]> {
        let lastError: AIError = new AIError("AI recommendation failed", "UNKNOWN_ERROR");

        // Validate input data before processing
        if (!preferences || typeof preferences !== 'object') {
            throw new AIError("Invalid preferences: must be an object", "INVALID_INPUT");
        }

        if (!Array.isArray(pets) || pets.length === 0) {
            throw new AIError("Invalid pets: must be a non-empty array", "INVALID_INPUT");
        }

        // Validate that pets have required fields
        const invalidPets = pets.filter(pet => !pet._id && !pet.id);
        if (invalidPets.length > 0) {
            console.warn("[AI Service] Some pets missing ID:", invalidPets);
        }

        // Check AI service health first
        const isHealthy = await this.checkHealth();
        if (!isHealthy) {
            console.warn('[AI Service] Service appears to be unavailable');
        }

        // Log the raw preferences for debugging
        console.log("[AI Service] Raw preferences received:", preferences);

        // Validate that required preference fields are present and non-empty
        // Handle both direct preferences and the new payloadForAi structure
        const actualPreferences = preferences.answers || preferences;
        const requiredFields = ['lifestyle', 'experience', 'preferredSpecies'];
        const missingFields = requiredFields.filter(field => {
            const value = actualPreferences[field];
            return !value || (Array.isArray(value) && value.length === 0);
        });

        if (missingFields.length > 0) {
            throw new AIError(`Missing required preference fields: ${missingFields.join(', ')}`, "INVALID_INPUT");
        }

        // Try up to MAX_RETRIES + 1 times (original attempt + retries)
        for (let attempt = 0; attempt <= CONSTANTS.MAX_RETRIES; attempt++) {
            try {
                const normalizedPreferences = normalizePreferences(actualPreferences);

                console.log(`[AI Service] Processing ${pets.length} pets for transformation`);

                // Transform pets and filter out any with missing required fields
                const transformedPets = pets
                    .map(toAiPet)
                    .filter(pet => {
                        // Only require the most essential fields: id, name, type
                        const essentialFields = ['id', 'name', 'type'];
                        const hasEssential = essentialFields.every(field => {
                            const value = pet[field as keyof typeof pet];
                            return value &&
                                (typeof value !== 'string' || value.trim() !== '') &&
                                (typeof value !== 'number' || !isNaN(value));
                        });

                        if (!hasEssential) {
                            console.warn(`[AI Service] Filtering out pet ${pet.id} due to missing essential fields:`,
                                essentialFields.filter(field => {
                                    const value = pet[field as keyof typeof pet];
                                    return !value ||
                                        (typeof value === 'string' && value.trim() === '') ||
                                        (typeof value === 'number' && isNaN(value));
                                })
                            );
                        }

                        return hasEssential;
                    });

                console.log(`[AI Service] After filtering: ${transformedPets.length} valid pets`);

                if (transformedPets.length === 0) {
                    console.error("[AI Service] All pets were filtered out. Sample pet data:", pets[0]);
                    throw new AIError("No valid pets found after filtering", "INVALID_INPUT");
                }

                // Log the normalized data being sent
                console.log("[AI Service] Sending request:", {
                    attempt: attempt + 1,
                    preferencesKeys: Object.keys(normalizedPreferences),
                    petsCount: transformedPets.length,
                    samplePet: transformedPets[0]
                });

                // Log the normalized preferences structure
                console.log("[AI Service] Normalized preferences:", normalizedPreferences);

                // Log a few transformed pets for debugging
                console.log("[AI Service] Sample transformed pets:", transformedPets.slice(0, 2));

                // Log the full request payload for debugging
                const requestPayload = {
                    preferences: normalizedPreferences,
                    pets: transformedPets,
                };
                console.log("[AI Service] Full request payload:", JSON.stringify(requestPayload, null, 2));

                const result: AIRecommendationResponse = await http('/recommend', {
                    method: 'POST',
                    body: {
                        preferences: normalizedPreferences,
                        pets: transformedPets,
                    },
                    signal,
                });

                // Debug: Log the raw response from AI service
                console.log("[AI Service] Raw response from AI service:", result);
                console.log("[AI Service] Response matches count:", result.matches?.length || 0);

                if (result.matches && result.matches.length > 0) {
                    console.log("[AI Service] Sample match scores:", result.matches.slice(0, 3).map(m => ({
                        petId: m.petId,
                        score: m.score,
                        confidence: m.confidence,
                        reasons: m.reasons
                    })));
                }

                // Ensure consistent pet_id handling - cast to string to prevent mapping failures
                const normalizedMatches = result.matches.map(match => ({
                    ...match,
                    petId: String(match.petId), // Ensure petId is always a string
                }));

                console.log("[AI Service] Final normalized matches:", normalizedMatches.slice(0, 3));

                return normalizedMatches;
            } catch (error) {
                lastError = error instanceof AIError ? error : new AIError("AI recommendation failed", "UNKNOWN_ERROR");

                // Don't retry on server errors (5xx) to avoid spam
                if (!lastError.isRetryable() || attempt === CONSTANTS.MAX_RETRIES) {
                    break;
                }

                console.warn(`[AI Service] Attempt ${attempt + 1} failed, retrying...`, {
                    error: lastError.message,
                    code: lastError.code,
                    requestId: lastError.requestId
                });

                // Small delay before retry to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }

        console.error("Error getting AI match scores after all attempts:", lastError);
        throw lastError;
    },

    /**
     * Build FAISS index for fast similarity search
     */
    async buildSimilarityIndex(pets: Pet[]): Promise<{
        status: string;
        message: string;
        faiss_available: boolean;
        sentence_transformers_available: boolean;
    }> {
        try {
            const transformedPets = pets.map(toAiPet);
            return await http('/api/similarity/build-index', {
                method: 'POST',
                body: transformedPets,
            });
        } catch (error) {
            console.error("Error building similarity index:", error);
            throw error instanceof AIError ? error : new AIError("Failed to build similarity index", "UNKNOWN_ERROR");
        }
    },

    /**
     * Find similar pets using advanced similarity methods
     */
    async findSimilarPets(params: {
        queryPetId: string;
        pets: Pet[];
        limit?: number;
        useFaiss?: boolean;
    }): Promise<{
        similar_pets: Array<{
            pet: Pet;
            similarity_score: number;
            pet_id: string;
        }>;
        search_method: string;
        query_pet_id: string;
    }> {
        try {
            const transformedPets = params.pets.map(toAiPet);

            const result = await http<{
                similar_pets: Array<{
                    pet: any;
                    similarity_score: number;
                    pet_id: string;
                }>;
                search_method: string;
                query_pet_id: string;
            }>('/api/similarity/find-similar', {
                method: 'POST',
                body: {
                    pet_id: String(params.queryPetId), // Ensure queryPetId is string
                    pets: transformedPets,
                    limit: params.limit ?? CONSTANTS.DEFAULT_LIMIT,
                    use_faiss: params.useFaiss !== false
                },
            });

            // Transform results back to frontend format with consistent string ID handling
            const similarPets = result.similar_pets.map((item) => {
                const originalPet = params.pets.find(p =>
                    String(p.id ?? p._id) === String(item.pet_id)
                );
                return {
                    pet: originalPet ?? item.pet,
                    similarity_score: item.similarity_score,
                    pet_id: String(item.pet_id) // Ensure pet_id is always a string
                };
            });

            return {
                similar_pets: similarPets,
                search_method: result.search_method,
                query_pet_id: String(result.query_pet_id) // Ensure query_pet_id is string
            };
        } catch (error) {
            console.error("Error finding similar pets:", error);
            throw error instanceof AIError ? error : new AIError("Failed to find similar pets", "UNKNOWN_ERROR");
        }
    },

    /**
     * Compute advanced match score using multiple similarity methods
     */
    async computeAdvancedMatch(params: {
        preferences: any;
        pet: Pet;
        useAdvanced?: boolean;
    }): Promise<{
        match_score: number;
        cosine_similarity: number;
        rule_based_score: number;
        text_similarity?: number;
        weighted_score: number;
        method_used: string;
    }> {
        try {
            const normalizedPreferences = normalizePreferences(params.preferences);
            const transformedPet = toAiPet(params.pet);

            return await http('/api/similarity/advanced-match', {
                method: 'POST',
                body: {
                    preferences: normalizedPreferences,
                    pet: transformedPet,
                    use_advanced: params.useAdvanced !== false
                },
            });
        } catch (error) {
            console.error("Error computing advanced match:", error);
            throw error instanceof AIError ? error : new AIError("Failed to compute advanced match", "UNKNOWN_ERROR");
        }
    },

    /**
     * Get current feature importance weights from AI service
     */
    async getFeatureImportance(): Promise<{
        feature_importance: Record<string, number>;
        total_feedback_count: number;
        last_training: string;
    }> {
        try {
            return await http('/api/features/importance', { method: 'GET' });
        } catch (error) {
            console.error("Error getting feature importance:", error);
            throw error instanceof AIError ? error : new AIError("Failed to get feature importance", "UNKNOWN_ERROR");
        }
    },

    /**
     * Train feature importance model based on feedback data
     */
    async trainFeatureImportance(): Promise<{
        status: string;
        message: string;
        feature_importance: Record<string, number>;
        feedback_count: number;
    }> {
        try {
            return await http('/api/features/importance/train', { method: 'POST' });
        } catch (error) {
            console.error("Error training feature importance:", error);
            throw error instanceof AIError ? error : new AIError("Failed to train feature importance", "UNKNOWN_ERROR");
        }
    },

    /**
     * Update feature importance weights manually
     */
    async updateFeatureImportance(importanceWeights: Record<string, number>): Promise<{
        status: string;
        message: string;
        feature_importance: Record<string, number>;
    }> {
        try {
            return await http('/api/features/importance', {
                method: 'PUT',
                body: importanceWeights,
            });
        } catch (error) {
            console.error("Error updating feature importance:", error);
            throw error instanceof AIError ? error : new AIError("Failed to update feature importance", "UNKNOWN_ERROR");
        }
    },

    /**
     * Get intelligent explanation for why a pet is recommended
     */
    async getPetExplanation(params: {
        petData: Pet;
        userPreferences: any;
        userId?: string;
        recommendationScore?: number;
    }): Promise<{
        main_explanation: string;
        detailed_breakdown: string;
        personalized_insight?: string;
        tips_and_advice: string;
        confidence: number;
    }> {
        try {
            const normalizedPreferences = normalizePreferences(params.userPreferences);
            const transformedPetData = toAiPet(params.petData);

            return await http('/api/explanations/generate', {
                method: 'POST',
                body: {
                    pet_data: transformedPetData,
                    user_preferences: normalizedPreferences,
                    user_id: params.userId,
                    recommendation_score: params.recommendationScore
                },
            });
        } catch (error) {
            console.error("Error getting pet explanation:", error);
            // Return fallback explanation
            return {
                main_explanation: `${params.petData.name} appears to be a good match based on your preferences.`,
                detailed_breakdown: "Consider factors like size, age, and breed characteristics when making your decision.",
                tips_and_advice: "Research the specific breed and care requirements before adoption.",
                confidence: 0.5
            };
        }
    },

    /**
     * Submit feedback to AI service for learning
     */
    async submitAIFeedback(feedbackData: {
        user_id: string;
        pet_id: string;
        feedback_type: 'positive' | 'negative' | 'neutral';
        reason: string;
        details?: string;
        user_preferences: any;
        pet_attributes: any;
        recommendation_score?: number;
        session_id?: string;
    }): Promise<{ success: boolean; learning_impact?: any; error?: string }> {
        try {
            const normalizedPreferences = normalizePreferences(feedbackData.user_preferences);
            const transformedPetAttributes = toAiPet(feedbackData.pet_attributes);

            const result = await http<{
                learning_impact?: any;
            }>('/api/feedback/recommendation', {
                method: 'POST',
                body: {
                    ...feedbackData,
                    user_preferences: normalizedPreferences,
                    pet_attributes: transformedPetAttributes,
                    timestamp: new Date().toISOString(),
                },
            });

            return {
                success: true,
                learning_impact: result.learning_impact
            };
        } catch (error) {
            console.error("Error submitting AI feedback:", error);
            return {
                success: false,
                error: error instanceof AIError ? error.message : "Failed to submit feedback to AI service"
            };
        }
    },

    async submitFeedback(feedbackData: {
        petId: string;
        sessionId: string;
        reason: string;
        details?: string;
        userPreferences: any;
        petAttributes: any;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            console.log("Submitting feedback:", feedbackData);
            return { success: true };
        } catch (error) {
            console.error("Error submitting feedback:", error);
            return {
                success: false,
                error: "Failed to submit feedback",
            };
        }
    },
}; 