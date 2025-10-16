import { recommendationClient } from "@/services/recommendationClient";
import { recommendationService } from "@/services/recommendation.service";
import { ScoredPet } from "@/services/recommendation.service";
import { ScoringPreferences } from "@/services/recommendation.service";
import { normalizePreferences } from "@/utils/preferences";

interface FeedbackHandlerParams {
    petId: string;
    feedback: "positive" | "negative" | "neutral";
    reason: string;
    scoredPet: ScoredPet;
    userPreferences: ScoringPreferences;
    userId?: string;
}

// Rate limiting: 1 feedback per pet per second
const feedbackRateLimit = new Map<string, number>();
const RATE_LIMIT_MS = 1000; // 1 second

const isRateLimited = (petId: string): boolean => {
    const now = Date.now();
    const lastFeedback = feedbackRateLimit.get(petId);

    if (lastFeedback && (now - lastFeedback) < RATE_LIMIT_MS) {
        return true;
    }

    feedbackRateLimit.set(petId, now);
    return false;
};

/**
 * Normalizes pet attributes to match the AI service standard format
 * Ensures consistent property names and data types between AI and backend
 */
const normalizePetAttributes = (scoredPet: ScoredPet) => ({
    id: String(scoredPet.pet.id || scoredPet.pet._id || ''), // Ensure ID is always a string
    name: scoredPet.pet.name,
    species: scoredPet.pet.type, // Always use 'species' for consistency with AI service
    breed: scoredPet.pet.breed || scoredPet.pet.breeds?.primary || "Unknown",
    age: scoredPet.pet.age,
    size: scoredPet.pet.size,
    description: scoredPet.pet.description,
    photos: (scoredPet.pet.photos?.map((photo) => photo.url) || []).filter(Boolean), // Ensure string[] and filter out empty values
    health_records: scoredPet.pet.health ? [scoredPet.pet.health] : [], // Use health instead of healthRecords
    behavior_records: scoredPet.pet.behavior ? [scoredPet.pet.behavior] : [], // Use behavior instead of behaviorRecords
    created_at: scoredPet.pet.createdAt ? new Date(scoredPet.pet.createdAt).toISOString() : new Date().toISOString(), // Use toISOString for consistency
    view_count: scoredPet.pet.views || 0,
    adoptionFee: scoredPet.pet.adoptionFee,
    status: scoredPet.pet.status,
});

export const submitFeedback = async ({
    petId,
    feedback,
    reason,
    scoredPet,
    userPreferences,
    userId,
}: FeedbackHandlerParams) => {
    try {
        // Check rate limiting
        if (isRateLimited(petId)) {
            throw new Error("Please wait a moment before submitting another feedback for this pet.");
        }

        // Normalize preferences to ensure all fields are arrays
        const normalizedPreferences = normalizePreferences(userPreferences);

        // Normalize pet attributes using the standard mapping
        const normalizedPetAttributes = normalizePetAttributes(scoredPet);

        // Ensure petId is always a string
        const normalizedPetId = String(petId);

        // Create stable session ID for both requests (timestamp + petId for uniqueness)
        const sessionId = `${Date.now()}-${normalizedPetId}`;

        // Validate and normalize reason field
        const normalizedReason = reason?.trim() || "No specific reason provided";

        // Parallel dispatch to both services - don't let one failure bring down the other
        const [aiResult, backendResult] = await Promise.allSettled([
            // Submit feedback to AI service for learning
            recommendationClient.submitAIFeedback({
                user_id: userId || "anonymous",
                pet_id: normalizedPetId,
                feedback_type: feedback,
                reason: normalizedReason,
                details: `User provided ${feedback} feedback: ${normalizedReason}`,
                user_preferences: normalizedPreferences,
                pet_attributes: normalizedPetAttributes,
                recommendation_score: scoredPet.score,
                session_id: sessionId,
            }),

            // Submit to backend for enhanced feedback storage
            recommendationService.submitFeedback({
                petId: normalizedPetId,
                feedback,
                reason: normalizedReason,
                userPreferences: normalizedPreferences,
                petAttributes: normalizedPetAttributes,
                recommendationScore: scoredPet.score,
                sessionId: sessionId,
                additionalDetails: {
                    confidence: scoredPet.confidence,
                    factors: scoredPet.factors,
                    explanation: scoredPet.explanation,
                },
            })
        ]);

        // Handle partial success scenarios
        const aiSuccess = aiResult.status === 'fulfilled';
        const backendSuccess = backendResult.status === 'fulfilled';

        // Extract results and errors
        const aiFeedbackResult = aiSuccess ? aiResult.value : null;
        const backendFeedbackResult = backendSuccess ? backendResult.value : null;
        const aiError = !aiSuccess ? aiResult.reason : null;
        const backendError = !backendSuccess ? backendResult.reason : null;

        // Log any failures for debugging (but don't throw)
        if (!aiSuccess) {
            console.warn('AI feedback submission failed:', aiError);
        }
        if (!backendSuccess) {
            console.warn('Backend feedback submission failed:', backendError);
        }

        // Note: AI client http wrapper already supports credentials: 'include' for CORS
        // and generates X-Request-ID headers automatically

        // Success criteria: at least one service succeeded
        if (aiSuccess || backendSuccess) {
            return {
                success: true,
                partialSuccess: !(aiSuccess && backendSuccess), // true if only one succeeded
                aiSuccess,
                backendSuccess,
                learningImpact: aiFeedbackResult?.learning_impact || null,
                backendResult: backendFeedbackResult || null,
                message: getFeedbackMessage(feedback, aiSuccess, backendSuccess),
                partialSuccessMessage: !(aiSuccess && backendSuccess)
                    ? "Feedback received! Some services may be temporarily unavailable."
                    : undefined,
            };
        }

        // Both services failed - throw error for UI to handle
        throw new Error(
            `Both feedback services failed. AI: ${aiError?.message || 'Unknown error'}, Backend: ${backendError?.message || 'Unknown error'}`
        );

    } catch (error) {
        console.error("Error submitting feedback:", error);
        throw error; // Re-throw to preserve original error message for rate limiting
    }
};

/**
 * Generates appropriate feedback message based on feedback type and service status
 */
const getFeedbackMessage = (
    feedback: "positive" | "negative" | "neutral",
    aiSuccess: boolean,
    backendSuccess: boolean
): string => {
    const baseMessage = feedback === "positive"
        ? "Your positive feedback helps us improve our AI recommendations!"
        : feedback === "negative"
            ? "We'll use this feedback to provide better matches in the future."
            : "Your neutral feedback helps us understand your preferences better.";

    if (aiSuccess && backendSuccess) {
        return baseMessage;
    } else if (aiSuccess) {
        return `${baseMessage} (AI learning active)`;
    } else if (backendSuccess) {
        return `${baseMessage} (Feedback stored)`;
    }

    return baseMessage;
}; 