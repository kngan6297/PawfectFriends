import React, { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { RefreshCw, Brain, Zap, TrendingUp } from "lucide-react";
import { PetCard } from "@/components/pet/PetCard";
import { SkeletonList } from "./SkeletonList";
import { EmptyState } from "./EmptyState";
import { LifestyleSummary } from "./LifestyleSummary";
import { LifestyleInsights } from "./LifestyleInsights";
import {
  ScoredPet,
  ScoringPreferences,
} from "@/services/recommendation.service";
import { MATCH_THRESHOLDS } from "@/constants/match.constants";
import { calculateSkeletonCount } from "@/utils/layout";
import { useBreakpoint } from "@/hooks/useBreakpoint";

interface ResultsSectionProps {
  scoredPets: ScoredPet[];
  isGeneratingRecommendations: boolean;
  isLoading?: boolean;
  onAdjustPreferences: () => void;
  onPetInteraction: (
    petId: string,
    interactionType: "view" | "favorite" | "chat"
  ) => void;
  onFeedback: (
    petId: string,
    feedback: "positive" | "negative" | "good" | "bad",
    reason?: string
  ) => void;
  showAdvancedOptions: boolean;
  preferences: ScoringPreferences;
  sortBy?: string;
  onSortChange?: (sortBy: string) => void;
  maxResults?: number;
  // NEW — AI-specific display controls
  showConfidence?: boolean;
  showReasons?: boolean;
  showCarePlan?: boolean;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  scoredPets,
  isGeneratingRecommendations,
  isLoading = false,
  onAdjustPreferences,
  onPetInteraction,
  onFeedback,
  showAdvancedOptions,
  preferences,
  sortBy = "score",
  onSortChange,
  maxResults,
  showConfidence = true,
  showReasons = true,
  showCarePlan = true,
}) => {
  // Get current breakpoint for responsive skeleton counting
  const { gridColumns } = useBreakpoint();

  // Sort pets locally based on sortBy
  const sortedPets = useMemo(() => {
    if (!scoredPets.length) return [];

    const pets = [...scoredPets];

    switch (sortBy) {
      case "score":
        return pets.sort((a, b) => b.score - a.score);
      case "newest":
        return pets.sort((a, b) => {
          const dateA = new Date(a.pet.createdAt || a.pet.updatedAt || 0);
          const dateB = new Date(b.pet.createdAt || b.pet.updatedAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
      case "distance":
        // For distance sorting, we'd need location data
        // For now, fall back to score sorting
        // TODO: Implement distance-based sorting when user location is available
        console.log(
          "Distance sorting requested but not yet implemented - falling back to score sorting"
        );
        return pets.sort((a, b) => b.score - a.score);
      default:
        return pets.sort((a, b) => b.score - a.score);
    }
  }, [scoredPets, sortBy]);

  // Loading state
  if (isLoading) {
    return (
      <SkeletonList
        count={calculateSkeletonCount(maxResults, gridColumns)}
        columns={gridColumns} // Dynamic based on current breakpoint
      />
    );
  }

  // No results state
  if (scoredPets.length === 0 && !isGeneratingRecommendations) {
    return (
      <EmptyState
        variant="no-results"
        message="No pets matched your preferences"
        description="Try adjusting your preferences to find more pets that match your lifestyle and requirements."
        actionText="Adjust Preferences"
        onAction={onAdjustPreferences}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with AI Learning Highlight */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-600" aria-hidden="true" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Your AI Recommendations
                </h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                <Zap className="w-4 h-4" aria-hidden="true" />⚡ Real-time AI
                Learning
              </div>
            </div>
            <p className="text-gray-600 mb-3">
              {sortedPets.length > 0
                ? `${sortedPets.length} pets scored using AI • Match strength based on your preferences`
                : "AI-powered pet matching based on your preferences"}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>
                  Perfect/Best Match (≥{Math.round(MATCH_THRESHOLDS.best * 100)}
                  %)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>
                  High Match (≥{Math.round(MATCH_THRESHOLDS.high * 100)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Good Match (≥60%)</span>
              </div>
            </div>

            {/* Distance Filter Note */}
            {sortBy === "distance" && (
              <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
                📍 Distance sorting requires location data. Set your location in
                your profile to enable this feature.
              </div>
            )}
          </div>
          <Button
            variant="outline"
            onClick={onAdjustPreferences}
            aria-label="Adjust preferences"
          >
            Adjust Preferences
          </Button>
        </div>
      </div>

      {/* Lifestyle Summary */}
      <LifestyleSummary preferences={preferences} />

      {/* Lifestyle Insights */}
      <LifestyleInsights preferences={preferences} />

      {/* Results Controls & Info */}
      <div className="flex items-center justify-between text-sm text-gray-600 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <span>
            Showing{" "}
            {Math.min(maxResults || sortedPets.length, sortedPets.length)} of{" "}
            {sortedPets.length} matches
          </span>
          <span className="text-gray-400">•</span>
          <span>Sort:</span>
        </div>
        <div className="flex items-center gap-1">
          {[
            { value: "score", label: "Score" },
            { value: "newest", label: "Newest" },
            { value: "distance", label: "Distance" },
          ].map((sortOption) => (
            <button
              key={sortOption.value}
              onClick={() => onSortChange?.(sortOption.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                sortBy === sortOption.value
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {sortOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPets.slice(0, maxResults).map((scoredPet, i) => {
            return (
              <div
                key={`${scoredPet.pet._id || scoredPet.pet.id}-${i}`}
                className="relative"
              >
                <PetCard
                  pet={scoredPet.pet}
                  variant="recommendation"
                  matchScore={scoredPet.score}
                  factors={scoredPet.factors}
                  explanation={scoredPet.explanation}
                  confidence={scoredPet.confidence}
                  ml_score={scoredPet.ml_score}
                  rule_score={scoredPet.rule_score}
                  learned_bonus={scoredPet.learned_bonus}
                  onPetInteraction={onPetInteraction}
                  onFeedback={onFeedback}
                  showAdvancedOptions={showAdvancedOptions}
                  suppressBadges={false}
                  showConfidence={showConfidence}
                  showMatchInsights={showReasons}
                  showWizardExplanation={showCarePlan}
                />
              </div>
            );
          })}
        </div>

        {/* Overlay for re-scoring (when we have existing results) */}
        {isGeneratingRecommendations && sortedPets.length > 0 && (
          <div className="absolute inset-0 backdrop-blur-sm bg-white/30 flex flex-col items-center justify-center gap-2 rounded-lg">
            <RefreshCw
              className="w-6 h-6 animate-spin text-blue-600"
              aria-hidden="true"
            />
            <span className="text-sm text-gray-700">
              Re-scoring your matches…
            </span>
          </div>
        )}

        {/* First-time loading (when no results exist) */}
        {isGeneratingRecommendations && sortedPets.length === 0 && (
          <>
            <div className="col-span-full text-center py-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <RefreshCw
                  className="w-6 h-6 animate-spin text-blue-600"
                  aria-hidden="true"
                />
                <span className="text-lg font-medium text-gray-700">
                  AI is analyzing your preferences...
                </span>
              </div>
              <p className="text-gray-500">
                Scoring pets based on your lifestyle and preferences
              </p>
            </div>
            <SkeletonList
              count={calculateSkeletonCount(maxResults, gridColumns)}
              columns={gridColumns} // Dynamic based on current breakpoint
            />
          </>
        )}
      </div>

      {/* AI Learning Footer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Brain className="w-4 h-4 text-purple-600" aria-hidden="true" />
          <span>
            Every interaction helps our AI learn and provide better
            recommendations for you and others!
          </span>
        </div>
      </div>
    </div>
  );
};
