import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import { petApi, api } from "@/services/api";
import {
  recommendationService,
  ScoringPreferences,
  ScoredPet,
} from "@/services/recommendation.service";
import {
  recommendationClient,
  AIMatchScore,
} from "@/services/recommendationClient";
import { Pet } from "@/types/pet";
import { Button } from "@/components/ui/Button";
import { useToastContext } from "@/components/ui/ToastProvider";
import { useAuth } from "@/hooks/useAuth";
import { PreferencesForm } from "@/components/recommendations/PreferencesForm";
import { ResultsSection } from "@/components/recommendations/ResultsSection";
import { EmptyState } from "@/components/recommendations/EmptyState";
import { submitFeedback } from "@/components/recommendations/FeedbackHandler";
import { Brain, Zap, TrendingUp } from "lucide-react";
import { chatService } from "@/services/chat.service";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";
import { scrollToTopDelayed } from "@/utils/scrollUtils";

interface AiRecommendationsPageProps {}

type WhatIfOverrides = {
  budgetBoost?: number; // 0.2 = +20%
  spaceHint?: "small_apartment" | "house";
  timeCapMinutes?: number; // ex: 30
  coatPref?: "low_shed" | "any";
};

// Constants for easy tuning and maintenance
const LS_KEYS = {
  PREFS: "aiRecommendationPreferences",
  USED: "hasUsedRecommendations",
} as const;

const TOP_K = 12;
const DEBOUNCE_MS = 500;

// Performance tuning constants
const PETS_LIMIT = 100; // Increased from 30 to 100 for better variety
const STREAMING_THRESHOLD = 60; // Enable streaming for >60 pets
const EARLY_RESULTS_COUNT = 3; // Show top 3 results first when streaming

export const AiRecommendationsPage: React.FC<
  AiRecommendationsPageProps
> = () => {
  // Streamlined preferences - focus on essential fields only
  const [preferences, setPreferences] = useState<ScoringPreferences>({
    lifestyle: [],
    experience: [],
    livingSpace: [],
    timeAvailable: [],
    hasChildren: [],
    hasOtherPets: [],
    preferredSpecies: [], // Start with empty array to require user selection
    // Core fields only - removed complex wizard fields
    budget: [],
    activityLevel: [],
    // Additional fields initialized as arrays for consistency
    preferredTypes: [],
    preferredSizes: [],
    preferredAges: [],
    preferredBreeds: [],
    workSchedule: [],
    travelFrequency: [],
    noiseTolerance: [],
    groomingPreference: [],
    trainingCommitment: [],
    allergies: [],
    homeType: [],
    spaceAvailable: [],
    hasYard: [],
  });

  const [pets, setPets] = useState<Pet[]>([]);
  const [scoredPets, setScoredPets] = useState<ScoredPet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRecommendations, setHasRecommendations] = useState(false);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] =
    useState(false);
  const [showTutorialBanner, setShowTutorialBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoGenerate, setAutoGenerate] = useState(false); // Don't auto-generate until user submits

  // NEW — What-if + Vibe
  const [vibeText, setVibeText] = useState("");
  const [whatIfOverrides, setWhatIfOverrides] = useState<WhatIfOverrides>({});

  // Race condition fix: track latest request ID
  const lastReqId = useRef(0);

  // Fix stale closure: use ref for autoGenerate since it's only used for localStorage decisions
  const autoGenerateRef = useRef(autoGenerate);

  // Guard against React 18 Strict Mode double-effect execution
  const didInitRef = useRef(false);

  // Refs for scrolling to form fields
  const budgetFieldRef = useRef<HTMLDivElement>(null);
  const livingSpaceFieldRef = useRef<HTMLDivElement>(null);
  const timeAvailableFieldRef = useRef<HTMLDivElement>(null);
  const activityLevelFieldRef = useRef<HTMLDivElement>(null);

  const { showToast } = useToastContext();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Helper functions
  const isEmpty = (arr?: unknown[]) => !arr || arr.length === 0;
  const hasAny = (arr?: unknown[]) => !!arr && arr.length > 0;
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);
  const isAdoptable = (p: Pet) =>
    !["adopted", "reserved"].includes((p.status || "").toLowerCase());
  const devLog = (...args: any[]) => {
    if (import.meta.env.DEV) console.log(...args);
  };

  // Update ref when autoGenerate changes
  useEffect(() => {
    autoGenerateRef.current = autoGenerate;
  }, [autoGenerate]);

  // Load user preferences on mount
  useEffect(() => {
    // Guard against React 18 Strict Mode double-effect execution
    if (didInitRef.current) {
      console.log(
        "AiRecommendationsPage - useEffect mount skipped (already initialized)"
      );
      return;
    }

    console.log(
      "AiRecommendationsPage - useEffect mount - calling loadUserPreferences"
    );

    didInitRef.current = true;
    loadUserPreferences();
    loadPets();

    // Check if this is the user's first time
    let hasUsedRecommendations: string | null = null;
    try {
      hasUsedRecommendations = localStorage.getItem(LS_KEYS.USED);
    } catch {
      // localStorage not available (e.g., Safari private mode)
    }
    if (!hasUsedRecommendations) {
      setShowTutorialBanner(true);
    }

    // Scroll to top when page loads
    scrollToTopDelayed();
  }, []);

  // Define validation function before using it
  const hasValidPreferences = (): boolean => {
    // Core required fields - these are mandatory
    const hasCore =
      hasAny(preferences.lifestyle) &&
      hasAny(preferences.experience) &&
      hasAny(preferences.preferredSpecies);

    // Context fields - these provide additional information but aren't required
    const hasContextFields =
      hasAny(preferences.budget) ||
      hasAny(preferences.livingSpace) ||
      hasAny(preferences.timeAvailable) ||
      hasAny(preferences.activityLevel);

    // Allow recommendations with just core fields, but encourage context fields
    const isValid = hasCore;
    const hasGoodContext = hasCore && hasContextFields;

    // Only log in development to avoid spam in production
    devLog("hasValidPreferences check:", {
      lifestyle: preferences.lifestyle,
      experience: preferences.experience,
      preferredSpecies: preferences.preferredSpecies,
      budget: preferences.budget,
      livingSpace: preferences.livingSpace,
      timeAvailable: preferences.timeAvailable,
      activityLevel: preferences.activityLevel,
      hasCore,
      hasContextFields,
      hasGoodContext,
      isValid,
    });

    return isValid;
  };

  // Memoize validation to avoid calling hasValidPreferences() multiple times during render
  const isValid = useMemo(() => hasValidPreferences(), [preferences]);

  // NEW — What-if + Vibe helpers
  const applyWhatIfOverride = useCallback(
    (field: keyof WhatIfOverrides, value: any) => {
      setWhatIfOverrides((prev: WhatIfOverrides) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const clearWhatIfOverride = useCallback((field: keyof WhatIfOverrides) => {
    setWhatIfOverrides((prev: WhatIfOverrides) => {
      const newOverrides = { ...prev };
      delete newOverrides[field];
      return newOverrides;
    });
  }, []);

  // Memoize effective preferences to reduce unnecessary changes
  const effectivePreferences = useMemo(
    () => ({
      ...preferences,
      ...whatIfOverrides,
      vibeText,
    }),
    [preferences, whatIfOverrides, vibeText]
  );

  const hasWhatIfOverrides = useCallback(() => {
    return Object.keys(whatIfOverrides).length > 0;
  }, [whatIfOverrides]);

  const clearAllOverrides = useCallback(() => {
    setWhatIfOverrides({});
    setVibeText("");
  }, []);

  const getWhatIfSummary = useCallback(() => {
    const overrides = Object.entries(whatIfOverrides).map(([field, value]) => {
      return `${field}: ${Array.isArray(value) ? value.join(", ") : value}`;
    });

    const summary = [];
    if (overrides.length > 0) {
      summary.push(`What-if: ${overrides.join("; ")}`);
    }
    if (vibeText) {
      summary.push(`Vibe: "${vibeText}"`);
    }

    return summary;
  }, [whatIfOverrides, vibeText]);

  const generateRecommendations = useCallback(async () => {
    console.log("generateRecommendations called with:", {
      hasValidPreferences: isValid,
      petsLength: pets.length,
      preferences,
    });

    if (!isValid || pets.length === 0) {
      console.log(
        "generateRecommendations early return - invalid preferences or no pets"
      );
      return;
    }

    // Generate unique request ID for this call
    const reqId = ++lastReqId.current;

    setIsGeneratingRecommendations(true);

    try {
      // Only save preferences to localStorage when explicitly generating recommendations
      // Don't save during auto-generation to avoid interfering with form state
      if (!autoGenerateRef.current) {
        try {
          localStorage.setItem(LS_KEYS.PREFS, JSON.stringify(preferences));
        } catch {
          // localStorage not available (e.g., Safari private mode)
        }
      }

      // Use memoized effective preferences

      console.log(
        "Generating AI recommendations with preferences:",
        effectivePreferences
      );

      // Validate preferences before sending to AI service
      const requiredFields: (keyof ScoringPreferences)[] = [
        "lifestyle",
        "experience",
        "preferredSpecies",
      ];
      const missingFields = requiredFields.filter(
        (field) =>
          !effectivePreferences[field] ||
          (Array.isArray(effectivePreferences[field]) &&
            effectivePreferences[field].length === 0)
      );

      if (missingFields.length > 0) {
        console.error("Missing required preference fields:", missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Smart pre-filtering: Include more pets for variety while prioritizing preferences
      // First filter out non-adoptable pets (pending, adopted, etc.)
      const adoptablePets = pets.filter((p) => p.status === "adoptable");
      console.log(`Filtered ${adoptablePets.length} adoptable pets out of ${pets.length} total pets`);

      let petsToSend = adoptablePets;

      // Smart species filtering - prioritize all selected species
      const preferredSpeciesSet = new Set(
        (effectivePreferences.preferredSpecies ?? []).map((s: string) =>
          s.toLowerCase()
        )
      );

      if (preferredSpeciesSet.size > 0) {
        const preferred = adoptablePets.filter((p) =>
          preferredSpeciesSet.has(p.type?.toLowerCase() || "")
        );
        let petsToSend = preferred;

        console.log(
          `Found ${preferred.length} pets of preferred species [${Array.from(
            preferredSpeciesSet
          ).join(", ")}] out of ${adoptablePets.length} adoptable pets`
        );

        // If we have very few pets of preferred species, include some other species for variety
        if (preferred.length < 5) {
          console.log(
            `Only ${preferred.length} pets of preferred species [${Array.from(
              preferredSpeciesSet
            ).join(", ")}], including other species for variety`
          );

          // Get a few pets from other species to add variety (but still heavily penalize them in scoring)
          const others = adoptablePets
            .filter(
              (p) => !preferredSpeciesSet.has(p.type?.toLowerCase() || "")
            )
            .slice(0, 10); // Limit to 10 other species pets for variety

          // Combine preferred species pets with some other species pets
          petsToSend = [...preferred, ...others];

          console.log(
            `Added variety: ${preferred.length} preferred species + ${others.length} other species = ${petsToSend.length} total pets`
          );
        } else {
          // We have enough pets of preferred species, filter to just those
          petsToSend = preferred;
          console.log(
            `Species-filtered pets: ${petsToSend.length} out of ${
              adoptablePets.length
            } adoptable pets match species preferences [${Array.from(preferredSpeciesSet).join(
              ", "
            )}]`
          );
        }
      }

      // Filter by distance preference
      if (effectivePreferences.maxDistance) {
        // For now, we'll log that distance filtering is available
        // In the future, this would integrate with user location and pet coordinates
        console.log(
          `Distance filtering enabled: max ${effectivePreferences.maxDistance} miles`
        );
        // TODO: Implement actual distance filtering when user location is available
      }

      // NEW — different payload for AI Page
      const payloadForAi = {
        source: "ai",
        answers: effectivePreferences, // 9 core sentences in use
        implicitSignals: { vibe_text: vibeText || null },
        whatIfOverrides, // { budgetBoost, spaceHint, timeCapMinutes, coatPref ... }
      };

      // Log the exact data being sent
      console.log("Sending to AI service:", {
        payloadForAi,
        preferences: effectivePreferences,
        preferencesKeys: Object.keys(effectivePreferences),
        whatIfOverrides: whatIfOverrides,
        vibeText: vibeText,
        petsCount: petsToSend.length,
        petSample: petsToSend
          .slice(0, 2)
          .map((p) => ({ id: p._id, name: p.name, type: p.type })),
      });

      // Log validation details
      console.log("Preference validation:", {
        lifestyle: preferences.lifestyle,
        experience: preferences.experience,
        preferredSpecies: preferences.preferredSpecies,
        hasValidPreferences: hasValidPreferences(),
      });

      // Use AI service to score pets directly
      // Performance note: For >60 pets, consider sending only pet IDs to AI service
      // and fetching full pet data after scoring to reduce payload size
      const aiMatches = await recommendationClient.getAIMatchScores(
        payloadForAi, // Send enhanced payload instead of just preferences
        petsToSend
      );

      // Check if this request is still the latest one
      if (reqId !== lastReqId.current) {
        console.log(
          "Discarding old request results - newer request in progress"
        );
        return;
      }

      console.log(`AI service returned ${aiMatches.length} match scores`);

      // Transform AI match scores into ScoredPet format and apply preference-based scoring
      // Note: petsToSend is already filtered by species preference, so we only need to filter by status
      const availablePets = petsToSend.filter(isAdoptable);

      console.log(
        `Filtered pets: ${availablePets.length} available out of ${petsToSend.length} total (${pets.length} total before species filtering)`
      );

      if (availablePets.length === 0) {
        throw new Error("No adoptable pets available after filtering");
      }

      const scoredPetsResult = availablePets.map((pet) => {
        // Use pet.id if _id is not available
        const petId = pet._id || pet.id;
        const aiMatch = aiMatches.find((match) => match.petId === petId);
        let baseScore = aiMatch?.score ?? 0;

        // Enhanced scoring system: Apply bonuses for multiple preference matches
        // This creates more differentiation between pets even with similar base AI scores
        if (preferredSpeciesSet.size > 0) {
          const petSpecies = pet.type?.toLowerCase();

          if (preferredSpeciesSet.has(petSpecies || "")) {
            // Moderate bonus for species preference match (multiply by 1.3)
            baseScore = baseScore * 1.3;
            console.log(
              `Species preference bonus applied to ${pet.name}: ${
                pet.type
              } matches preferred species [${Array.from(
                preferredSpeciesSet
              ).join(", ")}], score: ${baseScore}`
            );
          } else {
            // Moderate penalty for species preference mismatch (multiply by 0.7)
            baseScore = baseScore * 0.7;
            console.log(
              `Species preference penalty applied to ${pet.name}: ${
                pet.type
              } doesn't match preferred species [${Array.from(
                preferredSpeciesSet
              ).join(", ")}], score: ${baseScore}`
            );
          }
        }

        // Apply additional preference bonuses for other important factors
        if (preferences.preferredAges && preferences.preferredAges.length > 0) {
          const preferredAge = preferences.preferredAges[0].toLowerCase();
          const petAge = pet.age?.toLowerCase();

          if (petAge === preferredAge) {
            baseScore = baseScore * 1.2; // 20% bonus for age match
            console.log(
              `Age preference bonus applied to ${pet.name}: ${pet.age} matches ${preferredAge}, score: ${baseScore}`
            );
          }
        }

        if (
          preferences.preferredSizes &&
          preferences.preferredSizes.length > 0
        ) {
          const preferredSize = preferences.preferredSizes[0].toLowerCase();
          const petSize = pet.size?.toLowerCase();

          if (petSize === preferredSize) {
            baseScore = baseScore * 1.15; // 15% bonus for size match
            console.log(
              `Size preference bonus applied to ${pet.name}: ${pet.size} matches ${preferredSize}, score: ${baseScore}`
            );
          }
        }

        // Bonus for experience level compatibility
        if (preferences.experience && preferences.experience.length > 0) {
          const experience = preferences.experience[0].toLowerCase();
          const petAge = pet.age?.toLowerCase();

          // First-time owners get bonus for adult pets, experienced owners get bonus for young pets
          if (experience === "first-time" && petAge === "adult") {
            baseScore = baseScore * 1.4; // 40% bonus for first-time + adult
            console.log(
              `Experience bonus applied to ${pet.name}: first-time owner + adult pet, score: ${baseScore}`
            );
          } else if (experience === "professional" && petAge === "baby") {
            baseScore = baseScore * 1.4; // 40% bonus for professional + baby
            console.log(
              `Experience bonus applied to ${pet.name}: professional owner + baby pet, score: ${baseScore}`
            );
          }
        }

        // Bonus for lifestyle compatibility
        if (preferences.lifestyle && preferences.lifestyle.length > 0) {
          const lifestyle = preferences.lifestyle[0].toLowerCase();
          const petAge = pet.age?.toLowerCase();

          // Active lifestyle gets bonus for high-energy pets, homebody gets bonus for low-energy pets
          if (lifestyle === "active" && petAge === "baby") {
            baseScore = baseScore * 1.3; // 30% bonus for active + baby
            console.log(
              `Lifestyle bonus applied to ${pet.name}: active lifestyle + baby pet, score: ${baseScore}`
            );
          } else if (lifestyle === "homebody" && petAge === "senior") {
            baseScore = baseScore * 1.3; // 30% bonus for homebody + senior
            console.log(
              `Lifestyle bonus applied to ${pet.name}: homebody lifestyle + senior pet, score: ${baseScore}`
            );
          }
        }

        // Bonus for living space compatibility
        if (preferences.livingSpace && preferences.livingSpace.length > 0) {
          const livingSpace = preferences.livingSpace[0].toLowerCase();
          const petSize = pet.size?.toLowerCase();

          // Small apartment gets bonus for small pets, house gets bonus for large pets
          if (livingSpace === "apartment-limited" && petSize === "small") {
            baseScore = baseScore * 1.2; // 20% bonus for small apartment + small pet
            console.log(
              `Living space bonus applied to ${pet.name}: small apartment + small pet, score: ${baseScore}`
            );
          } else if (livingSpace === "house" && petSize === "large") {
            baseScore = baseScore * 1.2; // 20% bonus for house + large pet
            console.log(
              `Living space bonus applied to ${pet.name}: house + large pet, score: ${baseScore}`
            );
          }
        }

        // Apply score clamping to prevent multiplicative explosion
        // Clamp between 0 and 100 to maintain reasonable score scale
        baseScore = clamp(baseScore, 0, 100);

        const confidence =
          aiMatch?.confidence ?? (aiMatch?.score != null ? 0.8 : 0.3);

        return {
          pet,
          score: baseScore,
          factors: aiMatch?.reasons ?? [],
          explanation:
            aiMatch?.reasons?.join(", ") ?? "No AI analysis available",
          confidence,
          ml_score: baseScore,
          rule_score: undefined,
          learned_bonus: undefined,
        } as ScoredPet;
      });

      // NEW — What-if adjustments (FE fallback if BE does not support it yet)
      const applyWhatIfAdjustments = (
        items: ScoredPet[],
        overrides: WhatIfOverrides,
        prefs: ScoringPreferences
      ) => {
        if (!overrides || Object.keys(overrides).length === 0) return items;

        return items.map((sp) => {
          let s = sp.score;

          // override 1 example: +20% budget => increase grooming/food cost
          if (overrides.budgetBoost) {
            s = s * (1 + overrides.budgetBoost); // +20% => 1.2x
          }

          // override 2 example: small apartment => lower size group "large" & high energy (if meta exists)
          if (overrides.spaceHint === "small_apartment") {
            const size = sp.pet.size?.toLowerCase();
            if (size === "large") s *= 0.8;
            // if meta activity exists: s *= 0.9 for high-energy
          }

          // override 3 example: only 30'/day => penalize high activity pet (if present)
          if (overrides.timeCapMinutes && overrides.timeCapMinutes <= 30) {
            // missing meta activity? slight global penalty to suggest low-maintenance pet
            s *= 0.92;
          }

          // override 4 example: like "low shed"
          if (overrides.coatPref === "low_shed") {
            // if there is a coat/attributes field then check, if not then lightly reward the "short hair" pet
            const coat =
              (sp.pet as any).coat || (sp.pet as any).attributes?.coat;
            if (!coat) s *= 0.98; // coat unknown → slight discount
          }

          // Apply clamping to prevent score explosion from what-if adjustments
          s = clamp(s, 0, 100);

          return { ...sp, score: s };
        });
      };

      // Apply what-if adjustments before sorting
      let adjusted = applyWhatIfAdjustments(
        scoredPetsResult,
        whatIfOverrides,
        preferences
      );

      // Sort by score (highest first) and limit to top results
      adjusted.sort((a, b) => b.score - a.score);

      // Ensure we have enough results, even if some don't perfectly match preferences
      let topResults = adjusted.slice(0, TOP_K);

      // If we don't have enough results with high scores, include more pets
      if (topResults.length < TOP_K && adjusted.length > TOP_K) {
        console.log(
          `Only ${topResults.length} high-scoring pets found, including more pets to reach ${TOP_K}`
        );
        topResults = adjusted.slice(0, TOP_K);
      }

      // Note: Since we pre-filter pets by species preference, all results should already match
      // This ensures the AI service only processes relevant pets and generates appropriate insights

      // Log the final ranking results for debugging
      console.log(`Generated ${topResults.length} top recommendations:`);
      topResults.forEach((result, index) => {
        console.log(
          `${index + 1}. ${result.pet.name} (${
            result.pet.type
          }) - Score: ${result.score.toFixed(3)} - Status: ${result.pet.status}`
        );
      });

      // Log what-if adjustments if any were applied
      if (hasWhatIfOverrides() || vibeText) {
        console.log("What-if adjustments applied:", {
          overrides: whatIfOverrides,
          vibeText: vibeText,
          adjustmentSummary: getWhatIfSummary(),
        });
      }

      // Log species distribution in top results
      const speciesCount = topResults.reduce((acc, result) => {
        const species = result.pet.type || "unknown";
        acc[species] = (acc[species] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log("Species distribution in top results:", speciesCount);

      // Early streaming: Show top results immediately for large datasets
      if (petsToSend.length > STREAMING_THRESHOLD) {
        const early = adjusted.slice(0, EARLY_RESULTS_COUNT);
        console.log(
          `Early streaming: Showing ${early.length} results first (${petsToSend.length} pets processed)`
        );
        setScoredPets(early);
        setHasRecommendations(true);

        // Schedule full results update after early results are shown
        setTimeout(() => {
          console.log(
            `Streaming complete: Showing all ${topResults.length} results`
          );
          setScoredPets(topResults);
        }, 0);
      } else {
        // For smaller datasets, show all results immediately
        setScoredPets(topResults);
        setHasRecommendations(true);
      }

      // Scroll to top when recommendations are generated
      scrollToTopDelayed();

      // Mark that user has used recommendations
      try {
        localStorage.setItem(LS_KEYS.USED, "true");
      } catch {
        // localStorage not available (e.g., Safari private mode)
      }
      setShowTutorialBanner(false);

      // Record interaction for learning (only for logged-in users)
      // Note: For AI recommendations, we don't record individual pet interactions
      // since these are generated recommendations without specific pet IDs
      if (user?._id) {
        try {
          // Record the recommendation generation event
          const response = await api.post(
            "/recommendations/interactions/record-enhanced",
            {
              petId: null, // No specific pet for AI recommendations
              interactionType: "recommendation_generated",
              timestamp: new Date().toISOString(),
              preferences,
              petCount: topResults.length,
              recommendationId: `${Date.now()}`,
              recommendationScore: topResults[0]?.score ?? 0,
              sessionId: `${Date.now()}`,
            }
          );

          if (response.data?.success) {
            console.log("Recommendation generation recorded successfully");
          }
        } catch (error) {
          console.warn("Failed to record recommendation generation:", error);
          // Don't show error to user as this is not critical
        }
      }

      showToast({
        type: "success",
        title: "AI Recommendations Updated!",
        description: `Found ${topResults.length} top matches for you!`,
      });
    } catch (error) {
      console.error("Error generating AI recommendations:", error);

      // Provide more specific error messages
      let errorMessage = "Please try again later.";
      if (error instanceof Error) {
        if (error.message.includes("Missing required fields")) {
          errorMessage = error.message;
        } else if (error.message.includes("Invalid request")) {
          errorMessage =
            "Invalid preferences data. Please check your selections and try again.";
        } else if (error.message.includes("Server is busy")) {
          errorMessage =
            "AI service is busy. Please try again in a few minutes.";
        }
      }

      showToast({
        type: "error",
        title: "Failed to generate recommendations",
        description: errorMessage,
      });
    } finally {
      // Only update loading state if this is still the latest request
      if (reqId === lastReqId.current) {
        setIsGeneratingRecommendations(false);
      }
    }
  }, [effectivePreferences, pets, user, showToast]);

  // Test AI service connectivity
  const testAIService = useCallback(async () => {
    try {
      const isHealthy = await recommendationClient.checkHealth();
      console.log("AI Service health check:", isHealthy);
      if (!isHealthy) {
        showToast({
          type: "warning",
          title: "AI Service Warning",
          description:
            "AI service may be unavailable. Recommendations may not work. Please try again later or contact support if the issue persists.",
        });
      } else {
        console.log("AI Service is healthy and ready");
      }
    } catch (error) {
      console.warn("AI Service health check failed:", error);
      showToast({
        type: "error",
        title: "AI Service Error",
        description:
          "Unable to connect to AI service. Please check your internet connection and try again.",
      });
    }
  }, [showToast]);

  // Test AI service on mount
  useEffect(() => {
    testAIService();
  }, [testAIService]);

  // Auto-generate results when preferences change (debounced)
  useDebouncedEffect(
    () => {
      console.log("Auto-generation effect triggered:", {
        autoGenerate,
        petsLength: pets.length,
        hasValidPrefs: isValid,
        effectivePreferences,
      });

      if (autoGenerate && pets.length > 0 && isValid) {
        console.log(
          "Starting auto-generation - calling generateRecommendations"
        );
        generateRecommendations();
      }
    },
    [effectivePreferences, pets, autoGenerate, isValid],
    DEBOUNCE_MS
  );

  const loadUserPreferences = () => {
    // Load from user profile first, then localStorage
    if (user?.preferences) {
      // Use the initial state values as base, then merge with user preferences
      const basePreferences = {
        lifestyle: [],
        experience: [],
        livingSpace: [],
        timeAvailable: [],
        hasChildren: [],
        hasOtherPets: [],
        preferredSpecies: [], // Start with empty array to require user selection
        budget: [],
        activityLevel: [],
        // Additional fields initialized as arrays for consistency
        preferredTypes: [],
        preferredSizes: [],
        preferredAges: [],
        preferredBreeds: [],
        workSchedule: [],
        travelFrequency: [],
        noiseTolerance: [],
        groomingPreference: [],
        trainingCommitment: [],
        allergies: [],
        homeType: [],
        spaceAvailable: [],
        hasYard: [],
      };
      const mergedPreferences = { ...basePreferences, ...user.preferences };
      console.log("AiRecommendationsPage - loadUserPreferences from user:", {
        base: basePreferences,
        userPrefs: user.preferences,
        merged: mergedPreferences,
      });
      setPreferences(mergedPreferences);
    } else {
      let savedPreferences: string | null = null;
      try {
        savedPreferences = localStorage.getItem(LS_KEYS.PREFS);
      } catch {
        // localStorage not available (e.g., Safari private mode)
      }
      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences);
        console.log(
          "AiRecommendationsPage - loadUserPreferences from localStorage:",
          {
            current: preferences,
            saved: parsedPreferences,
          }
        );
        setPreferences(parsedPreferences);
      }
    }
  };

  const loadPets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load pets with performance-optimized limit
      // Current: 30 pets for fast response
      // Future: Consider 60-100 with streaming optimizations
      const response = await petApi.getPets({ limit: PETS_LIMIT });
      setPets(response.pets || []);

      // Performance note: For >60 pets, consider:
      // - Score by page and merge gradually
      // - Send IDs instead of full pet objects to AI service
      // - Stream results early (show top-3 first)
    } catch (error) {
      console.error("Error loading pets:", error);
      setError("Failed to load pets. Please try again later.");
      showToast({
        type: "error",
        title: "Failed to load pets",
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPreviousSession = async () => {
    loadUserPreferences();
    await generateRecommendations();
  };

  const scrollToMissingFields = () => {
    // Find the first missing field and scroll to it
    if (isEmpty(preferences.budget) && budgetFieldRef.current) {
      budgetFieldRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } else if (
      isEmpty(preferences.livingSpace) &&
      livingSpaceFieldRef.current
    ) {
      livingSpaceFieldRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } else if (
      isEmpty(preferences.timeAvailable) &&
      timeAvailableFieldRef.current
    ) {
      timeAvailableFieldRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } else if (
      isEmpty(preferences.activityLevel) &&
      activityLevelFieldRef.current
    ) {
      activityLevelFieldRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      // Save preferences to localStorage when form is submitted
      try {
        localStorage.setItem(LS_KEYS.PREFS, JSON.stringify(preferences));
      } catch {
        // localStorage not available (e.g., Safari private mode)
      }
      await generateRecommendations();
    }
  };

  const handlePetInteraction = async (
    petId: string,
    interactionType: "view" | "favorite" | "chat"
  ) => {
    try {
      // Record interaction for AI learning (only for logged-in users)
      if (user?._id) {
        const interactionResult = await recommendationService.recordInteraction(
          petId,
          interactionType,
          {
            sessionId: Date.now().toString(),
            timestamp: new Date().toISOString(),
          }
        );

        if (interactionResult?.success) {
          console.log(
            "Interaction recorded successfully:",
            interactionResult.activityLogId
          );
        }
      }

      if (interactionType === "favorite" && user) {
        await petApi.toggleFavorite(petId);

        // Optimistic UI update - immediately reflect the change
        setScoredPets((prev) =>
          prev.map((sp) =>
            sp.pet._id === petId
              ? { ...sp, pet: { ...sp.pet, isFavorite: !sp.pet.isFavorite } }
              : sp
          )
        );

        showToast({
          type: "success",
          title: "Updated favorites",
          description: "Your favorites have been updated.",
        });
      } else if (interactionType === "chat" && user) {
        // Find the pet to get shelter information
        const pet = scoredPets.find((sp) => sp.pet._id === petId)?.pet;

        if (pet && pet.shelter) {
          try {
            // Create a new conversation with the shelter
            const conversation = await chatService.createChat(
              pet.shelter._id,
              user._id,
              `Hi! I'm interested in ${pet.name}. Can you tell me more about the adoption process?`
            );

            // Navigate to the chat with the conversation ID
            navigate(`/chat/${conversation.id}`);
          } catch (error: any) {
            console.error("Failed to create chat:", error);

            // Handle specific error cases
            if (error.message?.includes("already exists")) {
              showToast({
                type: "info",
                title: "Chat Already Exists",
                description:
                  "You already have a conversation with this shelter. Opening existing chat...",
              });
              // Navigate to chat page to show existing conversations
              navigate("/chat");
            } else {
              showToast({
                type: "error",
                title: "Failed to Create Chat",
                description:
                  "Unable to start a conversation. Please try again.",
              });
              // Fallback to regular chat page if creation fails
              navigate("/chat");
            }
          }
        } else {
          showToast({
            type: "error",
            title: "Pet Information Missing",
            description: "Unable to find shelter information for this pet.",
          });
        }
      } else if (interactionType === "view") {
        navigate(`/pets/${petId}`);
      } else if (!user) {
        showToast({
          type: "info",
          title: "Sign in to continue",
          description:
            "Please sign in to save favorites and chat with shelters.",
        });
      }
    } catch (error) {
      console.error("Error recording interaction:", error);
    }
  };

  const handleFeedback = async (
    petId: string,
    feedback: "positive" | "negative" | "good" | "bad",
    reason?: string
  ) => {
    try {
      // Find the pet and its score
      const scoredPet = scoredPets.find((sp) => sp.pet._id === petId);

      if (!scoredPet) {
        console.error("Pet not found for feedback");
        return;
      }

      // Map feedback types to the expected format
      const mappedFeedback =
        feedback === "good"
          ? "positive"
          : feedback === "bad"
          ? "negative"
          : feedback;
      const feedbackReason = reason || "No reason provided";

      const result = await submitFeedback({
        petId,
        feedback: mappedFeedback,
        reason: feedbackReason,
        scoredPet,
        userPreferences: preferences,
        userId: user?._id,
      });

      showToast({
        type: "success",
        title: "Thanks for your feedback!",
        description:
          mappedFeedback === "positive"
            ? "Your feedback helps us improve our AI recommendations!"
            : "We'll use this to provide better matches in the future.",
      });

      // Log both AI service and backend feedback results
      console.log("AI Feedback learning impact:", result.learningImpact);
      if (result.backendResult) {
        console.log("Backend feedback stored:", result.backendResult);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      showToast({
        type: "error",
        title: "Failed to submit feedback",
        description: "Please try again later.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-4">
            <Brain className="w-10 h-10 text-blue-600" />
            Quick AI Pet Matching
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-3">
            Get instant personalized pet recommendations powered by AI
          </p>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Works for guests. Sign in to save favorites & chat.
          </p>
        </div>

        {error ? (
          <EmptyState
            variant="error"
            message="Failed to load pets"
            description={error}
            actionText="Try Again"
            onAction={loadPets}
          />
        ) : isLoading ? (
          <EmptyState isLoading={true} hasRecommendations={false} />
        ) : null}

        {!isLoading && !hasRecommendations && !isGeneratingRecommendations && (
          <div className="max-w-5xl mx-auto">
            {/* Quick Start Banner */}
            {showTutorialBanner && (
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Zap className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">
                      ⚡ Instant AI Matching
                    </h3>
                    <div className="text-blue-700 mb-4">
                      <p className="text-sm">
                        Just select a few key preferences and get instant
                        AI-powered recommendations. Results update automatically
                        as you type - like a search engine!
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Link
                        to="/recommendations/wizard"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        Need Guidance? Try Wizard
                      </Link>
                      <button
                        onClick={() => setShowTutorialBanner(false)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-600 bg-transparent hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        Got it!
                      </button>
                    </div>
                  </div>
                  <div className="ml-auto pl-4">
                    <button
                      onClick={() => setShowTutorialBanner(false)}
                      aria-label="Dismiss tutorial"
                      className="inline-flex text-blue-400 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              {/* Context Fields Encouragement */}
              {isValid &&
                isEmpty(preferences.budget) &&
                isEmpty(preferences.livingSpace) &&
                isEmpty(preferences.timeAvailable) &&
                isEmpty(preferences.activityLevel) && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3 text-amber-800">
                      <span className="text-lg mt-0.5">💡</span>
                      <div className="flex-1">
                        <p className="text-sm text-amber-700 mb-3">
                          Consider adding your budget, living space, time
                          availability, or activity level for more personalized
                          recommendations.
                        </p>
                        <button
                          onClick={scrollToMissingFields}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-amber-800 bg-amber-100 hover:bg-blue-200 border border-amber-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                        >
                          Add Now →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              <PreferencesForm
                preferences={preferences}
                onPreferencesChange={(newPrefs) => {
                  // Only log in development to avoid spam in production
                  devLog(
                    "AiRecommendationsPage - onPreferencesChange called:",
                    {
                      old: preferences,
                      new: newPrefs,
                    }
                  );
                  setPreferences(newPrefs);
                }}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                onLoadPreviousSession={handleLoadPreviousSession}
                onToggleSelectType={() => {}} // Disabled for speed
              />
            </div>
          </div>
        )}

        {hasRecommendations && (
          <div className="max-w-7xl mx-auto">
            {/* Loading indicator above results when generating new recommendations */}
            {isGeneratingRecommendations && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-blue-800 font-medium">
                    Updating AI recommendations...
                  </span>
                </div>
              </div>
            )}

            <ResultsSection
              scoredPets={scoredPets}
              isGeneratingRecommendations={isGeneratingRecommendations}
              isLoading={isLoading}
              onAdjustPreferences={() => setHasRecommendations(false)}
              onPetInteraction={handlePetInteraction}
              onFeedback={handleFeedback}
              showAdvancedOptions={false} // Simplified for speed
              preferences={preferences}
              showConfidence={true}
              showReasons={true}
              showCarePlan={false} // differentiate from Wizard
            />
          </div>
        )}
      </div>
    </div>
  );
};
