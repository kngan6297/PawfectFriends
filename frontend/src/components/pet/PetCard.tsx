import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MapPin,
  MessageSquare,
  Clock,
  Send,
  Camera,
  Sparkles,
  Brain,
  Crown,
  Eye,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import { Pet } from "@/types/pet";
import { ScoredPet } from "@/services/recommendation.service";
import { Card, CardContent } from "@/components/ui/Card";
import { MATCH_THRESHOLDS } from "@/constants/match.constants";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

import { clsx } from "clsx";

import { formatDistanceToNow } from "date-fns";

interface PetCardProps {
  // Core pet data - can be either Pet or ScoredPet
  pet: Pet | ScoredPet;

  // Variant control - determines which features to show
  variant?: "basic" | "ai" | "smart" | "recommendation";

  // Feature control props
  showAiFeatures?: boolean;
  showRecommendationFeatures?: boolean;
  showHealthBadges?: boolean;
  showMatchInsights?: boolean;
  showQuickApply?: boolean;
  showFeedback?: boolean;
  showAdvancedOptions?: boolean;
  showConfidence?: boolean;
  showMatchScore?: boolean;
  showWizardExplanation?: boolean;

  // Badge control
  suppressBadges?: boolean;

  // Match score and AI data (for scored pets)
  matchScore?: number;
  factors?: string[];
  explanation?: string;
  confidence?: number;
  ml_score?: number;
  rule_score?: number;
  learned_bonus?: number;

  // UI state props
  isFavorite?: boolean;
  isFeatured?: boolean;
  index?: number;

  // Event handlers
  onFavoriteToggle?: (petId: string, newIsFavorite: boolean) => void;
  onFeedback?: (
    petId: string,
    feedback: "positive" | "negative" | "good" | "bad",
    reason?: string
  ) => void;
  onShare?: (petId: string) => void;
  onContact?: (petId: string) => void;
  onQuickApply?: (petId: string) => void;
  onPetInteraction?: (
    petId: string,
    interactionType: "view" | "favorite" | "chat"
  ) => void;

  // Styling
  className?: string;
  size?: "sm" | "md" | "lg";

  // Wizard-specific props
  wizardPreferences?: any;

  // i18n/Label props
  labels?: {
    viewDetails?: string;
    quickApply?: string;
    applying?: string;
    favorite?: string;
    chat?: string;
    share?: string;
    aiExplanation?: string;
    aiExplanationSubtitle?: string;
    petCharacteristics?: string;
    scoreBreakdown?: string;
    mlScore?: string;
    ruleScore?: string;
    learningBonus?: string;
    highConfidence?: string;
    mediumConfidence?: string;
    lowConfidence?: string;
    confidence?: string;
    perfectMatch?: string;
    bestMatch?: string;
    medicalHistoryAvailable?: string;
    medicalHistoryItems?: string;
    photoComingSoon?: string;
    unknownBreed?: string;
    lookingForHome?: string;
    pawfectFriendsShelter?: string;
  };
}

// Match Score Ring Component (simplified version)
const MatchScoreRing: React.FC<{
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}> = ({ score, size = "md", showLabel = false }) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  // Clamp score to [0, 1] range and get color class
  const safe = Math.max(0, Math.min(1, score));
  const color =
    safe >= MATCH_THRESHOLDS.high
      ? "stroke-emerald-500"
      : safe >= 0.6
      ? "stroke-amber-500"
      : "stroke-rose-500";

  const percentage = Math.round(safe * 100);
  const strokeDasharray = 2 * Math.PI * 18; // radius = 18
  const strokeDashoffset = strokeDasharray * (1 - safe);

  return (
    <div className="relative">
      <svg className={sizeClasses[size]} viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          className={color}
          strokeWidth="3"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-700">{percentage}%</span>
      </div>
      {showLabel && (
        <div className="text-center mt-1">
          <span className="text-xs text-gray-600">Match</span>
        </div>
      )}
    </div>
  );
};

// Inline Feedback Component (simplified version)
const InlineFeedback: React.FC<{
  petId: string;
  onFeedback: (
    petId: string,
    feedback: "positive" | "negative",
    reason: string
  ) => void;
  onChat?: () => void;
  showChatButton?: boolean;
}> = ({ petId, onFeedback, onChat, showChatButton = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<"positive" | "negative">("positive");
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (reason.trim()) {
      onFeedback(petId, feedback, reason);
      setReason("");
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="flex-1"
        >
          <MessageSquare className="w-4 h-4 mr-1" />
          Give Feedback
        </Button>
        {showChatButton && onChat && (
          <Button
            variant="outline"
            size="sm"
            onClick={onChat}
            className="flex-1"
          >
            <MessageCircle className="w-4 h-4 mr-1" aria-hidden="true" />
            Chat
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          variant={feedback === "positive" ? "primary" : "outline"}
          size="sm"
          onClick={() => setFeedback("positive")}
        >
          👍 Good Match
        </Button>
        <Button
          variant={feedback === "negative" ? "primary" : "outline"}
          size="sm"
          onClick={() => setFeedback("negative")}
        >
          👎 Not a Match
        </Button>
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why is this a good/bad match?"
        className="w-full p-2 border border-gray-300 rounded-md text-sm"
        rows={2}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} className="flex-1">
          Submit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export const PetCard: React.FC<PetCardProps> = ({
  pet,
  variant = "basic",
  showAiFeatures = false,
  showRecommendationFeatures = false,
  showHealthBadges = true,
  showMatchInsights = false,
  showQuickApply = false,
  showFeedback = false,
  showAdvancedOptions = false,
  showConfidence = false,
  showMatchScore = false,
  showWizardExplanation = false,
  suppressBadges = false,
  matchScore,
  factors = [],
  explanation = "",
  confidence,
  ml_score,
  rule_score,
  learned_bonus,
  isFavorite = false,
  isFeatured = false,
  index = 0,
  onFavoriteToggle,
  onFeedback,
  onShare,
  onContact,
  onQuickApply,
  onPetInteraction,
  className = "",
  size = "md",
  wizardPreferences,
  labels = {},
}) => {
  // Default labels with fallbacks
  const defaultLabels = {
    viewDetails: "View Details",
    quickApply: "Quick Apply",
    applying: "Applying...",
    favorite: "Favorite",
    chat: "Chat",
    share: "Share",
    aiExplanation: "AI Explanation",
    aiExplanationSubtitle: "This pet matches your preferences because:",
    petCharacteristics: "Pet Characteristics",
    scoreBreakdown: "Score Breakdown",
    mlScore: "ML Score:",
    ruleScore: "Rule Score:",
    learningBonus: "Learning Bonus:",
    highConfidence: "High",
    mediumConfidence: "Medium",
    lowConfidence: "Low",
    confidence: "Confidence",
    perfectMatch: "💯 Perfect Match",
    bestMatch: "🏆 Best Match",
    medicalHistoryAvailable: "Medical History Available",
    medicalHistoryItems: "item",
    photoComingSoon: "Photo coming soon",
    unknownBreed: "Unknown breed",
    lookingForHome: "This pet is looking for a forever home!",
    pawfectFriendsShelter: "Pawfect Friends Shelter",
  };

  const t = { ...defaultLabels, ...labels };
  // Extract scored pet data if available
  const scoredPet = "score" in pet ? (pet as ScoredPet) : null;
  const finalMatchScore = matchScore ?? scoredPet?.score;
  const finalFactors = factors.length > 0 ? factors : scoredPet?.factors ?? [];
  const finalExplanation = explanation || scoredPet?.explanation || "";
  const finalConfidence = confidence ?? scoredPet?.confidence;

  // Get the actual pet data (either direct Pet or from ScoredPet.pet)
  const actualPet = scoredPet ? scoredPet.pet : (pet as Pet);

  const [isQuickApplying, setIsQuickApplying] = useState(false);
  const petId = (actualPet._id || actualPet.id) as string;

  // Derive flags from variant + allow override with props
  const flags = useMemo(() => {
    const baseFlags = {
      showAiFeatures: false,
      showRecommendationFeatures: false,
      showHealthBadges: true,
      showMatchInsights: false,
      showQuickApply: false,
      showFeedback: false,
      showAdvancedOptions: false,
      showConfidence: false,
      showMatchScore: false,
      showWizardExplanation: false,
    };

    // Apply variant-based defaults
    if (variant === "ai") {
      baseFlags.showAiFeatures = true;
      baseFlags.showMatchScore = true;
      baseFlags.showConfidence = true;
    } else if (variant === "recommendation") {
      baseFlags.showRecommendationFeatures = true;
      baseFlags.showMatchScore = true;
      baseFlags.showConfidence = true;
      baseFlags.showFeedback = true;
    } else if (variant === "smart") {
      baseFlags.showAiFeatures = true;
      baseFlags.showMatchInsights = true;
      baseFlags.showQuickApply = true;
    }

    // Allow props to override variant defaults
    let finalFlags = {
      ...baseFlags,
      showAiFeatures: showAiFeatures ?? baseFlags.showAiFeatures,
      showRecommendationFeatures:
        showRecommendationFeatures ?? baseFlags.showRecommendationFeatures,
      showHealthBadges: showHealthBadges ?? baseFlags.showHealthBadges,
      showMatchInsights: showMatchInsights ?? baseFlags.showMatchInsights,
      showQuickApply: showQuickApply ?? baseFlags.showQuickApply,
      showFeedback: showFeedback ?? baseFlags.showFeedback,
      showAdvancedOptions: showAdvancedOptions ?? baseFlags.showAdvancedOptions,
      showConfidence: showConfidence ?? baseFlags.showConfidence,
      showMatchScore: showMatchScore ?? baseFlags.showMatchScore,
      showWizardExplanation:
        showWizardExplanation ?? baseFlags.showWizardExplanation,
    };

    // If suppressBadges is true, hide all badge-related features
    if (suppressBadges) {
      finalFlags = {
        ...finalFlags,
        showAiFeatures: false,
        showConfidence: false,
        showMatchScore: false,
        showMatchInsights: false,
      };
    }

    return finalFlags;
  }, [
    variant,
    showAiFeatures,
    showRecommendationFeatures,
    showHealthBadges,
    showMatchInsights,
    showQuickApply,
    showFeedback,
    showAdvancedOptions,
    showConfidence,
    showMatchScore,
    showWizardExplanation,
    suppressBadges,
  ]);

  const statusVariant = useMemo(() => {
    switch (actualPet.status) {
      case "adopted":
        return "success";
      case "pending":
        return "warning";
      default:
        return "primary";
    }
  }, [actualPet.status]);

  const mainPhoto =
    actualPet.photos?.[0]?.url || "https://placehold.co/400x300?text=No+Image";

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src = "https://placehold.co/400x300?text=No+Image";
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(petId, !isFavorite);
    }
  };

  const handleQuickApply = async () => {
    if (onQuickApply) {
      setIsQuickApplying(true);
      try {
        await onQuickApply(petId);
      } finally {
        setIsQuickApplying(false);
      }
    }
  };

  const matchInsights = useMemo(() => {
    const insights = [];

    if (actualPet.health?.vaccinated) {
      insights.push("vaccinated");
    }
    if (actualPet.health?.neutered) {
      insights.push("neutered");
    }
    if (actualPet.health?.houseTrained) {
      insights.push("house-trained");
    }
    if (actualPet.behavior?.training?.includes("leash-trained")) {
      insights.push("leash-trained");
    }
    if (actualPet.behavior?.goodWithChildren) {
      insights.push("good with kids");
    }
    if (actualPet.behavior?.goodWithDogs) {
      insights.push("good with dogs");
    }
    if (actualPet.behavior?.goodWithCats) {
      insights.push("good with cats");
    }

    return insights;
  }, [
    actualPet.health?.vaccinated,
    actualPet.health?.neutered,
    actualPet.health?.houseTrained,
    actualPet.behavior?.training,
    actualPet.behavior?.goodWithChildren,
    actualPet.behavior?.goodWithDogs,
    actualPet.behavior?.goodWithCats,
  ]);

  // Explainability chips derived from rules/preferences
  const explainabilityChips = useMemo(() => {
    const chips: string[] = [];

    // Apartment-friendly: user apartment + pet not large
    const livingSpacePref = Array.isArray(wizardPreferences?.livingSpace)
      ? wizardPreferences?.livingSpace.join(" ").toLowerCase()
      : String(wizardPreferences?.livingSpace || "").toLowerCase();
    if (livingSpacePref.includes("apartment")) {
      const size = String(
        (actualPet as any).size || (actualPet as any).attributes?.size || ""
      ).toLowerCase();
      if (size && size !== "large") chips.push("Apartment-friendly");
    }

    // Low grooming: coat short/smooth
    const coat = String(
      (actualPet as any).coat || (actualPet as any).attributes?.coat || ""
    ).toLowerCase();
    if (
      coat.includes("short") ||
      coat.includes("smooth") ||
      coat.includes("low")
    ) {
      chips.push("Low grooming");
    }

    // Kid-safe: user hasChildren yes + pet good with children
    const hasKids = Array.isArray(wizardPreferences?.hasChildren)
      ? wizardPreferences?.hasChildren.map(String).join(" ").toLowerCase()
      : String(wizardPreferences?.hasChildren || "").toLowerCase();
    if (
      hasKids.includes("yes") &&
      (actualPet as any).behavior?.goodWithChildren
    ) {
      chips.push("Kid-safe");
    }

    // Yard-friendly: user hasYard yes + pet size medium/large
    const hasYard = Array.isArray(wizardPreferences?.hasYard)
      ? wizardPreferences?.hasYard.map(String).join(" ").toLowerCase()
      : String(wizardPreferences?.hasYard || "").toLowerCase();
    const size = String(
      (actualPet as any).size || (actualPet as any).attributes?.size || ""
    ).toLowerCase();
    if (hasYard.includes("yes") && (size === "medium" || size === "large")) {
      chips.push("Yard-friendly");
    }

    // Low-shed: allergies present + coat short/smooth (heuristic)
    const allergies = Array.isArray(wizardPreferences?.allergies)
      ? wizardPreferences?.allergies.map(String).join(" ").toLowerCase()
      : String(wizardPreferences?.allergies || "").toLowerCase();
    if (allergies && (coat.includes("short") || coat.includes("smooth"))) {
      chips.push("Lower shedding");
    }

    return chips.slice(0, 3);
  }, [wizardPreferences, actualPet]);

  // Highlight priority: perfect > best > high > featured
  const score = finalMatchScore ?? 0;
  const highlight =
    score >= MATCH_THRESHOLDS.perfect
      ? "ring-2 ring-emerald-300 bg-emerald-50/40"
      : score >= MATCH_THRESHOLDS.best
      ? "ring-2 ring-green-200 bg-green-50/30"
      : score >= MATCH_THRESHOLDS.high
      ? "ring-2 ring-blue-200 bg-blue-50/30"
      : isFeatured
      ? "ring-2 ring-primary-300 bg-primary-50/30"
      : "";

  const isHighConfidence =
    finalConfidence !== undefined && finalConfidence >= MATCH_THRESHOLDS.high;

  const sizeHeights = {
    sm: "h-32",
    md: "h-48",
    lg: "h-64",
  };

  return (
    <Card
      hoverEffect
      className={clsx(
        "bg-white rounded-lg shadow-soft hover:shadow-medium h-full flex flex-col",
        "transition-all duration-300 motion-reduce:transition-none",
        highlight,
        className
      )}
    >
      <div className="relative group">
        <div
          className={clsx(
            "relative w-full rounded-t-xl overflow-hidden aspect-[4/3]",
            sizeHeights[size]
          )}
        >
          {actualPet.photos &&
          actualPet.photos.length > 0 &&
          actualPet.photos[0].url ? (
            <img
              src={mainPhoto}
              alt={`Photo of ${
                actualPet.name || actualPet.breeds?.primary || "a pet"
              }`}
              className="object-cover w-full h-full"
              loading="lazy"
              sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
              decoding="async"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center">
              <Camera
                className="w-6 h-6 mb-2 text-gray-400"
                aria-hidden="true"
              />
              <p className="font-medium text-gray-600">
                {actualPet.name || "Pet"}
              </p>
              <p className="text-xs text-gray-400">{t.photoComingSoon}</p>
            </div>
          )}

          {/* Clickable overlay */}
          <Link
            to={`/pets/${petId}`}
            className="absolute inset-0"
            aria-label={`View details for ${actualPet.name || "pet"}`}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && e.currentTarget.click()
            }
          />
        </div>

        {/* Left Badge Stack - Match Score, Perfect/Best Match, AI */}
        <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1">
          {/* Match Score Badge */}
          {flags.showMatchScore && finalMatchScore !== undefined && (
            <div className="bg-white bg-opacity-90 rounded-full p-2">
              <MatchScoreRing
                score={Math.max(0, Math.min(1, finalMatchScore))}
                size="sm"
                showLabel={false}
              />
            </div>
          )}

          {/* Perfect/Best Match Badge */}
          {score >= MATCH_THRESHOLDS.perfect && (
            <div className="flex items-center gap-2">
              <Sparkles
                className="w-4 h-4 text-yellow-500"
                aria-hidden="true"
              />
              <Badge variant="success" className="text-xs">
                {t.perfectMatch}
              </Badge>
            </div>
          )}

          {score >= MATCH_THRESHOLDS.best &&
            score < MATCH_THRESHOLDS.perfect && (
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                <Badge variant="success" className="text-xs">
                  {t.bestMatch}
                </Badge>
              </div>
            )}

          {/* High Match Badge - Add this for lower scores */}
          {score >= MATCH_THRESHOLDS.high && score < MATCH_THRESHOLDS.best && (
            <div className="flex items-center gap-2">
              <TrendingUp
                className="w-4 h-4 text-blue-500"
                aria-hidden="true"
              />
              <Badge variant="accent-blue" className="text-xs">
                🏆 High Match
              </Badge>
            </div>
          )}

          {/* Good Match Badge - Add this for even lower scores */}
          {score >= 0.6 && score < MATCH_THRESHOLDS.high && (
            <div className="flex items-center gap-2">
              <TrendingUp
                className="w-4 h-4 text-green-500"
                aria-hidden="true"
              />
              <Badge variant="accent-green" className="text-xs">
                ✅ Good Match
              </Badge>
            </div>
          )}

          {/* Fair Match Badge - Add this for lower scores */}
          {score >= 0.4 && score < 0.6 && (
            <div className="flex items-center gap-2">
              <TrendingUp
                className="w-4 h-4 text-yellow-500"
                aria-hidden="true"
              />
              <Badge variant="warning" className="text-xs">
                ⚠️ Fair Match
              </Badge>
            </div>
          )}

          {/* Poor Match Badge - Add this for very low scores */}
          {score < 0.4 && score > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500" aria-hidden="true" />
              <Badge variant="warning" className="text-xs">
                ❌ Poor Match
              </Badge>
            </div>
          )}

          {/* AI Learning Indicator */}
          {flags.showAiFeatures && (
            <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full border border-purple-200 text-xs font-medium">
              <TrendingUp className="w-3 h-3 inline mr-1" aria-hidden="true" />
              AI
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2 z-20">
          <Button
            onClick={handleFavoriteClick}
            variant="ghost"
            size="icon"
            className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors duration-200 shadow-soft"
            aria-label={
              isFavorite
                ? `Remove ${actualPet.name || "pet"} from favorites`
                : `Add ${actualPet.name || "pet"} to favorites`
            }
            aria-pressed={isFavorite}
          >
            <Heart
              className={clsx(
                "h-5 w-5 transition-colors duration-200 motion-reduce:transition-none",
                isFavorite
                  ? "text-red-500 fill-red-500"
                  : "text-gray-400 hover:text-red-500"
              )}
              aria-hidden="true"
            />
          </Button>

          {flags.showFeedback && onFeedback && (
            <Button
              onClick={() =>
                onFeedback(petId, "positive", "User clicked feedback button")
              }
              className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors duration-200 shadow-soft"
              aria-label={`Provide feedback for ${actualPet.name || "pet"}`}
            >
              <MessageSquare
                className="w-4 h-4 text-gray-400 hover:text-blue-500"
                aria-hidden="true"
              />
            </Button>
          )}
        </div>

        {/* Gradient foot for better badge readability */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/35 to-transparent" />

        {/* Status Badge */}
        <div className="absolute bottom-3 left-3 z-10">
          <Badge variant={statusVariant} size="sm">
            {(actualPet.status || "adoptable").charAt(0).toUpperCase() +
              (actualPet.status || "adoptable").slice(1)}
          </Badge>
        </div>
      </div>

      <CardContent className="flex-1 p-4 flex flex-col">
        {/* Content that can grow */}
        <div className="flex-1">
          {/* Pet Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {actualPet.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  {actualPet.breeds?.primary ??
                    actualPet.breed ??
                    t.unknownBreed}
                </span>
                {actualPet.age && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{actualPet.age}</span>
                  </>
                )}
                {actualPet.gender && (
                  <>
                    <span>•</span>
                    <span>{actualPet.gender === "male" ? "♂" : "♀"}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Pet Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {actualPet.description || t.lookingForHome}
          </p>

          {/* Explainability chips (why promoted) */}
          {explainabilityChips.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {explainabilityChips.map((chip, idx) => (
                <Badge key={`${chip}-${idx}`} variant="secondary" size="sm">
                  {chip}
                </Badge>
              ))}
            </div>
          )}

          {/* Location and Time */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" aria-hidden="true" />
              {actualPet.shelter?._id ? (
                <Link
                  to={`/shelters/${actualPet.shelter._id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {actualPet.shelter.name || t.pawfectFriendsShelter}
                </Link>
              ) : (
                <span>
                  {actualPet.shelter?.name || t.pawfectFriendsShelter}
                </span>
              )}
            </div>
            {actualPet.createdAt && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span>
                  {formatDistanceToNow(new Date(actualPet.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Health & Behavior Badges */}
          {flags.showHealthBadges && (
            <div className="mb-4 space-y-3">
              {/* Health Status */}
              <div className="flex flex-wrap gap-2">
                {actualPet.health?.vaccinated && (
                  <Badge key="vaccinated" variant="accent-blue" size="sm">
                    Vaccinated
                  </Badge>
                )}
                {actualPet.health?.neutered && (
                  <Badge key="neutered" variant="accent-purple" size="sm">
                    Neutered
                  </Badge>
                )}
                {actualPet.health?.houseTrained && (
                  <Badge key="house-trained" variant="accent-green" size="sm">
                    House Trained
                  </Badge>
                )}
                {actualPet.behavior?.training?.includes(
                  "obedience-trained"
                ) && (
                  <Badge
                    key="obedience-trained"
                    variant="accent-green"
                    size="sm"
                  >
                    Obedience Trained
                  </Badge>
                )}
              </div>

              {/* Medical History Alert */}
              {actualPet.health?.medicalHistory &&
                actualPet.health.medicalHistory.length > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
                    <span className="text-sm text-amber-700 font-medium">
                      {t.medicalHistoryAvailable}
                    </span>
                    <Badge variant="warning" size="sm">
                      {actualPet.health.medicalHistory.length}{" "}
                      {t.medicalHistoryItems}
                      {actualPet.health.medicalHistory.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                )}
            </div>
          )}

          {/* AI Explanation */}
          {flags.showRecommendationFeatures && finalFactors.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span className="text-sm font-medium text-blue-800">
                  {t.aiExplanation}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-blue-700 mb-2">
                  {t.aiExplanationSubtitle}
                </p>
                <ul className="list-disc pl-4 text-sm text-blue-700 space-y-1">
                  {finalFactors.slice(0, 3).map((factor, index) => (
                    <li key={`${factor}-${index}`} className="text-blue-700">
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Score Breakdown */}
          {flags.showAdvancedOptions &&
            (ml_score !== undefined || rule_score !== undefined) && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {t.scoreBreakdown}
                </h4>
                <div className="space-y-1 text-xs">
                  {ml_score !== undefined && (
                    <div className="flex justify-between">
                      <span>{t.mlScore}</span>
                      <span>{(ml_score * 100).toFixed(1)}%</span>
                    </div>
                  )}
                  {rule_score !== undefined && (
                    <div className="flex justify-between">
                      <span>{t.ruleScore}</span>
                      <span>{(rule_score * 100).toFixed(1)}%</span>
                    </div>
                  )}
                  {learned_bonus !== undefined && learned_bonus > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{t.learningBonus}</span>
                      <span>+{(learned_bonus * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Confidence Badge */}
          {flags.showConfidence && finalConfidence !== undefined && (
            <div className="mb-4">
              <Badge
                variant={
                  finalConfidence > 0.7
                    ? "success"
                    : finalConfidence > 0.5
                    ? "warning"
                    : "secondary"
                }
              >
                {finalConfidence > 0.7
                  ? t.highConfidence
                  : finalConfidence > 0.5
                  ? t.mediumConfidence
                  : t.lowConfidence}{" "}
                {t.confidence}
              </Badge>
            </div>
          )}

          {/* Match Insights */}
          {flags.showMatchInsights && matchInsights.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles
                  className="w-4 h-4 text-primary-600"
                  aria-hidden="true"
                />
                {t.petCharacteristics}
              </h4>
              <div className="space-y-2">
                {matchInsights.map((insight, index) => (
                  <div
                    key={`${insight}-${index}`}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="capitalize">{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed bottom section */}
        <div className="mt-auto">
          {/* Quick Apply Button */}
          {flags.showQuickApply && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleQuickApply}
              disabled={isQuickApplying}
              className="w-full mb-3"
            >
              <Send className="w-4 h-4 mr-2" aria-hidden="true" />
              {isQuickApplying ? t.applying : t.quickApply}
            </Button>
          )}

          {/* Strategic CTA Layout */}
          {onPetInteraction ? (
            <div className="space-y-3">
              {/* Primary CTA */}
              <Button
                variant="primary"
                size="sm"
                onClick={() => onPetInteraction(petId, "view")}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
                {t.viewDetails}
              </Button>

              {/* Secondary Actions Row */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPetInteraction(petId, "chat")}
                  className="flex-1 text-gray-600 hover:text-blue-500 hover:bg-blue-50"
                  role="button"
                >
                  <MessageCircle className="w-4 h-4 mr-1" aria-hidden="true" />
                  {t.chat}
                </Button>
                {onShare && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onShare(petId)}
                    className="flex-1 text-gray-600 hover:text-blue-500 hover:bg-blue-50"
                    role="button"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Primary CTA */}
              <Link
                to={`/pets/${petId}`}
                className="btn-primary w-full justify-center"
              >
                {t.viewDetails}
              </Link>

              {/* Secondary Actions Row */}
              <div className="flex gap-2">
                {onShare && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onShare(petId)}
                    className="flex-1 text-gray-600 hover:text-blue-500 hover:bg-blue-50"
                    role="button"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {t.share}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Inline Feedback */}
          {flags.showFeedback && onFeedback && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <InlineFeedback
                petId={petId}
                onFeedback={onFeedback}
                onChat={() => onPetInteraction?.(petId, "chat")}
                showChatButton={!!onPetInteraction}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
