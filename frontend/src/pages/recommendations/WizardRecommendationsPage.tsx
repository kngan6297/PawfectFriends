import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { petApi } from "@/services/api";
import {
  recommendationService,
  ScoringPreferences,
  ScoredPet,
  WizardRecommendationResponse,
} from "@/services/recommendation.service";
import { Pet } from "@/types/pet";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToastContext } from "@/components/ui/ToastProvider";
import { useAuth } from "@/hooks/useAuth";
import { PetCard } from "@/components/pet/PetCard";
import { PetCardSkeleton } from "@/components/recommendations/PetCardSkeleton";
import { StepForm } from "@/components/recommendations/StepForm";
import { LifestyleStep } from "@/components/recommendations/LifestyleStep";
import { LivingConditionsStep } from "@/components/recommendations/LivingConditionsStep";
import { PetPreferencesStep } from "@/components/recommendations/PetPreferencesStep";
import { ReviewStep } from "@/components/recommendations/ReviewStep";
import { WizardFeedbackModal } from "@/components/recommendations/WizardFeedbackModal";
import {
  Heart,
  MessageCircle,
  Eye,
  Star,
  ArrowLeft,
  RefreshCw,
  Brain,
  Zap,
  TrendingUp,
  ArrowRight,
  User,
  Users,
  Shield,
  Info,
  CheckCircle,
  AlertTriangle,
  FileDown,
} from "lucide-react";
import { chatService } from "@/services/chat.service";

interface WizardRecommendationsPageProps {}

// Wizard stage management types
type WizardStage = "wizard" | "summary" | "results";

type ReadinessBars = {
  time: number; // 0-100
  budget: number; // 0-100
  space: number; // 0-100
  experience: number; // 0-100
};

type Readiness = {
  score: number; // 0-100
  bars: ReadinessBars;
  flags: string[]; // ['low_time','apt_small',...]
  badge: boolean; // enough points -> true
};

type PolicyGate = {
  id: string;
  severity: "warn" | "deprioritize" | "block";
  reason: string;
};

export const WizardRecommendationsPage: React.FC<
  WizardRecommendationsPageProps
> = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [stage, setStage] = useState<WizardStage>("wizard");
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [policyGates, setPolicyGates] = useState<PolicyGate[]>([]);
  const [carePlan, setCarePlan] = useState<string | null>(null);

  // Learning interaction tracking for readiness points
  const [viewedInfoPanels, setViewedInfoPanels] = useState<
    Record<string, boolean>
  >({});
  const [ackTips, setAckTips] = useState<Record<string, boolean>>({});

  const [preferences, setPreferences] = useState<ScoringPreferences>({
    lifestyle: [],
    experience: [],
    livingSpace: [],
    timeAvailable: [],
    hasChildren: [],
    hasOtherPets: [],
    preferredSpecies: ["dog", "cat"],
    // Additional wizard-specific fields
    homeType: [],
    spaceAvailable: [],
    hasYard: [],
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
    additionalInfo: "",
  });

  const [wizardResults, setWizardResults] =
    useState<WizardRecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRecommendations, setHasRecommendations] = useState(false);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] =
    useState(false);
  const [showGuestBanner, setShowGuestBanner] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedPetForFeedback, setSelectedPetForFeedback] =
    useState<ScoredPet | null>(null);

  const { showToast } = useToastContext();
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalSteps = 4;

  // Learning interaction tracking functions
  // These functions track user engagement with educational content
  // Each interaction contributes to the readiness score and badge system
  const markInfoViewed = (id: string) => {
    setViewedInfoPanels((prev) => ({ ...prev, [id]: true }));
    console.log(`Info panel viewed: ${id} - contributes to readiness score`);
  };

  const acknowledgeTip = (id: string) => {
    setAckTips((prev) => ({ ...prev, [id]: true }));
    console.log(`Tip acknowledged: ${id} - contributes to readiness score`);
  };

  // Helper function to check if array contains a value
  const has = (arr?: any[], val?: string) =>
    Array.isArray(arr) && val
      ? arr.some((x) => String(x).toLowerCase().includes(val))
      : false;

  // Calculate readiness from core sentences + interactions (FE fallback)
  function computeReadiness(
    prefs: ScoringPreferences,
    viewed: Record<string, boolean>,
    acks: Record<string, boolean>
  ): Readiness {
    // Helper function to safely get array values
    const getArrayValue = (value: any): string[] => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string") return [value];
      if (value === null || value === undefined) return [];
      return [String(value)];
    };

    // time
    let timeScore = 60;
    const timeArray = getArrayValue(prefs.timeAvailable);
    const ta = timeArray.map(String).join(" ").toLowerCase();
    if (ta.includes("2") || ta.includes("120") || ta.includes("high"))
      timeScore = 90;
    else if (ta.includes("1") || ta.includes("60") || ta.includes("medium"))
      timeScore = 75;
    else if (ta.includes("30") || ta.includes("low")) timeScore = 55;

    // budget
    let budgetScore = 70;
    const budgetArray = getArrayValue(prefs.budget);
    const bud = budgetArray.map(String).join(" ").toLowerCase();
    if (bud.includes("high")) budgetScore = 90;
    else if (bud.includes("medium")) budgetScore = 75;
    else if (bud.includes("low")) budgetScore = 55;

    // space
    let spaceScore = 70;
    const spaceArray = getArrayValue(prefs.livingSpace);
    const ls = spaceArray.map(String).join(" ").toLowerCase();
    if (ls.includes("rural")) spaceScore = 95;
    else if (ls.includes("house")) spaceScore = 85;
    else if (ls.includes("apartment")) spaceScore = 65;
    if (has(prefs.hasYard as any, "true"))
      spaceScore = Math.min(spaceScore + 5, 100);

    // experience
    let expScore = 70;
    const expArray = getArrayValue(prefs.experience);
    const ex = expArray.map(String).join(" ").toLowerCase();
    if (ex.includes("professional")) expScore = 95;
    else if (ex.includes("experienced") || ex.includes("some")) expScore = 80;
    else if (ex.includes("first")) expScore = 60;

    // bonus from interactions (see info + ack tip)
    const learnBonus = Math.min(
      Object.values(viewed).filter(Boolean).length * 2 +
        Object.values(acks).filter(Boolean).length * 3,
      10
    );

    const bars: ReadinessBars = {
      time: timeScore,
      budget: budgetScore,
      space: spaceScore,
      experience: expScore,
    };

    let score = Math.round(
      (bars.time + bars.budget + bars.space + bars.experience) / 4 + learnBonus
    );
    score = Math.min(score, 100);

    const flags: string[] = [];
    if (timeScore < 65) flags.push("low_time");
    if (budgetScore < 65) flags.push("low_budget");
    if (spaceScore < 70) flags.push("limited_space");
    if (expScore < 65) flags.push("novice");

    const badge = score >= 75;
    return { score, bars, flags, badge };
  }

  // Safety Gating - Apply lightweight rules to hide/deprioritize risk groups
  function computePolicyGates(prefs: ScoringPreferences): PolicyGate[] {
    const gates: PolicyGate[] = [];

    // Helper function to safely get array values
    const getArrayValue = (value: any): string[] => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string") return [value];
      if (value === null || value === undefined) return [];
      return [String(value)];
    };

    const ls = getArrayValue(prefs.livingSpace)
      .map(String)
      .join(" ")
      .toLowerCase();
    const act = getArrayValue(prefs.activityLevel)
      .map(String)
      .join(" ")
      .toLowerCase();
    const ta = getArrayValue(prefs.timeAvailable)
      .map(String)
      .join(" ")
      .toLowerCase();
    const bud = getArrayValue(prefs.budget).map(String).join(" ").toLowerCase();
    const kids = getArrayValue(prefs.hasChildren)
      .map(String)
      .join(" ")
      .toLowerCase();

    // apartment + high energy + time < 60m
    if (
      ls.includes("apartment") &&
      act.includes("high") &&
      (ta.includes("30") || ta.includes("low"))
    ) {
      gates.push({
        id: "high_energy_small_space",
        severity: "deprioritize",
        reason:
          "Small space & limited time are not ideal for high-energy pets.",
      });
    }

    // low budget + high grooming
    const groom = getArrayValue(prefs.groomingPreference)
      .map(String)
      .join(" ")
      .toLowerCase();
    if (bud.includes("low") && groom.includes("high")) {
      gates.push({
        id: "grooming_cost",
        severity: "warn",
        reason: "High grooming needs may exceed your stated budget.",
      });
    }

    // kids present + very large size
    const size = getArrayValue(prefs.preferredSizes)
      .map(String)
      .join(" ")
      .toLowerCase();
    if (kids.includes("yes") && size.includes("large")) {
      gates.push({
        id: "kids_vs_large",
        severity: "warn",
        reason: "Large, strong pets may not be ideal with small children.",
      });
    }

    return gates;
  }

  function applyGatesToRecommendations(
    recs: ScoredPet[],
    gates: PolicyGate[]
  ): ScoredPet[] {
    let out = recs.slice();
    for (const g of gates) {
      if (g.id === "high_energy_small_space") {
        // lower pet size "large" score
        out = out.map((sp) => {
          const sz = sp.pet.size?.toLowerCase();
          return sz === "large" ? { ...sp, score: sp.score * 0.85 } : sp;
        });
      }
      if (g.id === "grooming_cost") {
        // if there is a coat/grooming tag then lower, if not then be gentle
        out = out.map((sp) => {
          const coat =
            (sp.pet as any).coat || (sp.pet as any).attributes?.coat || "";
          const heavy =
            String(coat).toLowerCase().includes("long") ||
            String(coat).toLowerCase().includes("double");
          return heavy ? { ...sp, score: sp.score * 0.9 } : sp;
        });
      }
      // 'warn' only displays a warning; does not lower the score
    }
    return out;
  }

  // Create a 30-day Care Plan (FE template + download button)
  function buildCarePlanText(prefs: ScoringPreferences, r: Readiness): string {
    const species = (prefs.preferredSpecies || ["pet"]).join(", ");
    return [
      `30-Day Care Plan (${species})`,
      `Readiness: ${r.score}/100`,
      "",
      "Week 1: Setup & Bonding",
      "- Prepare essentials: food, bowl, bed, litter/training pads, crate or carrier.",
      "- 10–15min gentle play twice daily; establish feeding schedule.",
      "",
      "Week 2: Routine & Basic Training",
      "- Short daily walks or play sessions matched to activity level.",
      "- Begin basic commands / litter routine; positive reinforcement.",
      "",
      "Week 3: Health & Socialization",
      "- Vet checks / vaccinations per species; gentle socialization at home.",
      "- Grooming intro (brushing, nail check).",
      "",
      "Week 4: Consistency & Environment",
      "- Enrichments (puzzle toys/scratching post).",
      "- Review budget/time; adjust routine for sustainability.",
      "",
      "Tips:",
      "- Keep water fresh; maintain clean sleeping/litter area.",
      "- Track appetite, energy, stool; if abnormal → vet advice.",
    ].join("\n");
  }

  function downloadCarePlanFile(text: string, filename = "CarePlan.txt") {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Update readiness state and policy gates whenever relevant data changes
  useEffect(() => {
    const readinessData = computeReadiness(
      preferences,
      viewedInfoPanels,
      ackTips
    );
    const policyGatesData = computePolicyGates(preferences);

    setReadiness(readinessData);
    setPolicyGates(policyGatesData);
  }, [preferences, viewedInfoPanels, ackTips]);

  // Log badge achievement when earned
  useEffect(() => {
    if (user?._id && readiness?.badge) {
      console.log("🎖️ User earned readiness badge:", {
        userId: user._id,
        score: readiness.score,
        timestamp: new Date().toISOString(),
      });
      // TODO: Integrate with backend badge system when available
    }
  }, [user?._id, readiness?.badge, readiness?.score]);

  // Track step completion for learning interactions - FIXED: moved to useEffect
  useEffect(() => {
    // Only mark as viewed when step actually changes, not on every render
    switch (currentStep) {
      case 1:
        markInfoViewed("lifestyle_basics");
        break;
      case 2:
        markInfoViewed("living_conditions_basics");
        acknowledgeTip("space_considerations");
        break;
      case 3:
        markInfoViewed("pet_preferences_basics");
        acknowledgeTip("species_considerations");
        break;
      case 4:
        markInfoViewed("review_basics");
        acknowledgeTip("final_checklist");
        break;
    }
  }, [currentStep]); // Only run when currentStep changes

  useEffect(() => {
    // Show guest banner if user is not logged in
    if (!user) {
      setShowGuestBanner(true);
    } else {
      // Hide guest banner if user is logged in
      setShowGuestBanner(false);
    }
  }, [user]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      // Award learning points for completing steps
      const nextStep = currentStep + 1;

      // Mark step completion and award points
      switch (currentStep) {
        case 1:
          if (
            preferences.lifestyle?.length &&
            preferences.experience?.length &&
            preferences.timeAvailable?.length
          ) {
            acknowledgeTip("lifestyle_completed");
            markInfoViewed("lifestyle_insights");
          }
          break;
        case 2:
          if (
            preferences.livingSpace?.length &&
            preferences.livingSpace?.length > 0 &&
            preferences.hasChildren?.length &&
            preferences.hasChildren?.length > 0 &&
            preferences.hasOtherPets?.length &&
            preferences.hasOtherPets?.length > 0
          ) {
            acknowledgeTip("living_conditions_completed");
            markInfoViewed("space_insights");
          }
          break;
        case 3:
          if (preferences.preferredSpecies?.length) {
            acknowledgeTip("pet_preferences_completed");
            markInfoViewed("species_insights");
          }
          break;
      }

      setCurrentStep(nextStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEditStep = (step: number) => {
    setCurrentStep(step);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: // Lifestyle
        return !!(
          preferences.lifestyle &&
          preferences.experience &&
          preferences.timeAvailable
        );
      case 2: // Living Conditions
        return !!(
          preferences.livingSpace?.length &&
          preferences.livingSpace?.length > 0 &&
          preferences.hasChildren?.length &&
          preferences.hasChildren?.length > 0 &&
          preferences.hasOtherPets?.length &&
          preferences.hasOtherPets?.length > 0
        );
      case 3: // Pet Preferences
        return !!(
          preferences.preferredSpecies?.length &&
          preferences.preferredSpecies?.length > 0
        );
      case 4: // Review
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setIsGeneratingRecommendations(true);

    try {
      localStorage.setItem(
        "wizardRecommendationPreferences",
        JSON.stringify(preferences)
      );

      console.log("Submitting wizard preferences:", preferences);

      // 1) Call the service as before
      const results = await recommendationService.getWizardRecommendations(
        preferences,
        {
          limit: 20,
          minScore: 0.1,
          useML: !!user, // Only use ML for logged-in users
        }
      );

      console.log(
        `Wizard service returned ${results.recommendations.length} recommendations`
      );

      // Apply safety gates to deprioritize unsuitable pets
      const gatedRecommendations = applyGatesToRecommendations(
        results.recommendations,
        policyGates
      );

      // Log policy gate application
      if (policyGates.length > 0) {
        console.log(`Applied ${policyGates.length} policy gates:`, policyGates);
        console.log(
          "Original recommendations count:",
          results.recommendations.length
        );
        console.log(
          "Gated recommendations count:",
          gatedRecommendations.length
        );
      }

      // Update results with gated recommendations
      const updatedResults = {
        ...results,
        recommendations: gatedRecommendations,
      };

      setWizardResults(updatedResults);
      setHasRecommendations(true);

      // 2) Calculate readiness + gates + care plan (FE fallback)
      const r = computeReadiness(preferences, viewedInfoPanels, ackTips);
      setReadiness(r);

      const gates = computePolicyGates(preferences);
      setPolicyGates(gates);

      const plan = buildCarePlanText(preferences, r);
      setCarePlan(plan);

      // 3) Go to SUMMARY (different from AI at this point)
      setStage("summary");

      if (user?._id) {
        await recommendationService.recordInteraction(
          "wizard_recommendation_generated",
          "view",
          {
            preferences,
            petCount: results.recommendations.length,
            isGuest: results.isGuest,
          }
        );
      }

      showToast({
        type: "success",
        title: "Profile Completed",
        description: `You earned a readiness score of ${r.score}/100. Review your plan, then see matches.`,
      });
    } catch (error) {
      console.error("Error getting wizard recommendations:", error);
      showToast({
        type: "error",
        title: "Failed to get recommendations",
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
      setIsGeneratingRecommendations(false);
    }
  };

  const handlePetInteraction = async (
    petId: string,
    interactionType: "view" | "favorite" | "chat"
  ) => {
    try {
      // Record the interaction
      await recommendationService.recordInteraction(
        "wizard_recommendation_generated",
        "view",
        {
          petId,
          sessionId: Date.now().toString(),
          interactionType,
          userPreferences: preferences,
        }
      );

      if (interactionType === "favorite" && user) {
        await petApi.toggleFavorite(petId);
        showToast({
          type: "success",
          title: "Pet added to favorites!",
          description: "This pet has been added to your favorites.",
        });
      } else if (interactionType === "chat" && user) {
        // Find the pet to get shelter information
        const pet = wizardResults?.recommendations.find(
          (sp: ScoredPet) => sp.pet.id === petId || sp.pet._id === petId
        )?.pet;

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
      }
    } catch (error) {
      console.error("Error recording interaction:", error);
    }
  };

  const handleFeedback = async (
    petId: string,
    feedback: "rule_adjustment",
    reason: string
  ) => {
    try {
      // Find the pet and its score
      const scoredPet = wizardResults?.recommendations.find(
        (sp: ScoredPet) => sp.pet.id === petId || sp.pet._id === petId
      );

      if (!scoredPet) {
        console.error("Pet not found for feedback");
        return;
      }

      // Submit feedback to backend for rule adjustment
      await recommendationService.submitFeedback({
        petId,
        feedback: "positive",
        sessionId: Date.now().toString(),
        reason: `Wizard rule adjustment: ${reason}`,
        userPreferences: preferences,
        petAttributes: scoredPet.pet,
      });

      showToast({
        type: "success",
        title: "Thanks for your feedback!",
        description: "Your feedback helps us improve our matching rules.",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      showToast({
        type: "error",
        title: "Failed to submit feedback",
        description: "Please try again later.",
      });
    }
  };

  const openFeedbackModal = (scoredPet: ScoredPet) => {
    setSelectedPetForFeedback(scoredPet);
    setIsFeedbackModalOpen(true);
  };

  const closeFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
    setSelectedPetForFeedback(null);
  };

  const goBackToWizard = () => {
    setHasRecommendations(false);
    closeFeedbackModal();
  };

  const renderPetCard = (scoredPet: ScoredPet, index: number) => (
    <PetCard
      key={scoredPet.pet.id || scoredPet.pet._id}
      pet={scoredPet.pet}
      variant="recommendation"
      matchScore={scoredPet.score}
      index={index}
      onFavoriteToggle={(petId, newIsFavorite) =>
        handlePetInteraction(petId, newIsFavorite ? "favorite" : "view")
      }
      onFeedback={(petId) => openFeedbackModal(scoredPet)}
      onContact={(petId) => handlePetInteraction(petId, "chat")}
      onQuickApply={(petId) => navigate(`/pets/${petId}`)}
      // Wizard-specific props
      wizardPreferences={preferences}
    />
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <LifestyleStep
            preferences={preferences}
            onPreferencesChange={setPreferences}
            onViewInfo={markInfoViewed} // from previous Wizard patch
            onAckTip={acknowledgeTip} // from previous Wizard patch
          />
        );
      case 2:
        return (
          <LivingConditionsStep
            preferences={preferences}
            onPreferencesChange={setPreferences}
          />
        );
      case 3:
        return (
          <PetPreferencesStep
            preferences={preferences}
            onPreferencesChange={setPreferences}
          />
        );
      case 4:
        return (
          <ReviewStep preferences={preferences} onEditStep={handleEditStep} />
        );
      default:
        return null;
    }
  };

  // Summary Stage - Show readiness assessment and care plan before results
  if (stage === "summary" && readiness && carePlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-4">
              <Shield className="w-10 h-10 text-green-600" />
              Your Adoption Readiness Summary
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              🎯 <strong>Rule-based matching</strong> with{" "}
              <strong>safety gating</strong> applied. Your matches are
              pre-filtered for safety and suitability.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                🛡️ Safety First
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                📚 Educational Journey
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                🎖️ Readiness Badge
              </span>
            </div>
          </div>

          <div className="max-w-6xl mx-auto space-y-8">
            {/* Readiness Assessment - Enhanced */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-green-900 flex items-center gap-4">
                  <CheckCircle className="w-8 h-8" />
                  Readiness Assessment
                </h2>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {readiness.score}/100
                    </div>
                    <div className="text-sm text-green-600">Total Score</div>
                  </div>
                  {readiness.badge && (
                    <Badge
                      variant="success"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg px-6 py-3 border-0 shadow-lg"
                    >
                      🏆 Ready Badge Earned!
                    </Badge>
                  )}
                </div>
              </div>

              {/* Enhanced Readiness Bars */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                {[
                  { label: "Time", value: readiness.bars.time, icon: "⏰" },
                  { label: "Budget", value: readiness.bars.budget, icon: "💰" },
                  { label: "Space", value: readiness.bars.space, icon: "🏠" },
                  {
                    label: "Experience",
                    value: readiness.bars.experience,
                    icon: "🎓",
                  },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="text-sm font-semibold text-green-700 mb-3">
                      {label}
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-4 mb-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${value}%` }}
                      ></div>
                    </div>
                    <div className="text-lg font-bold text-green-700">
                      {value}%
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {value >= 80
                        ? "Excellent"
                        : value >= 60
                        ? "Good"
                        : "Needs attention"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Learning Progress - Enhanced */}
              <div className="bg-white rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                    📚 Learning Progress
                  </h3>
                  <span className="text-sm text-green-600 font-medium">
                    +
                    {Math.min(
                      Object.values(viewedInfoPanels).filter(Boolean).length *
                        2 +
                        Object.values(ackTips).filter(Boolean).length * 3,
                      10
                    )}{" "}
                    bonus points
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold">
                        {Object.keys(viewedInfoPanels).length}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-green-800">
                        Info Panels Viewed
                      </div>
                      <div className="text-sm text-green-600">
                        Educational content engaged
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">
                        {Object.keys(ackTips).length}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-blue-800">
                        Tips Acknowledged
                      </div>
                      <div className="text-sm text-blue-600">
                        Proactive learning
                      </div>
                    </div>
                  </div>
                </div>
                {readiness.flags.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Areas to Improve
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {readiness.flags.map((flag) => (
                        <span
                          key={flag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                        >
                          {flag.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Safety Gating - Enhanced to show it's been applied */}
            {policyGates.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-amber-800 flex items-center gap-3">
                    <Shield className="w-7 h-7" />
                    Safety Gating Applied
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-amber-600 font-medium">
                      {policyGates.length} safety rule
                      {policyGates.length !== 1 ? "s" : ""} applied
                    </span>
                    <Badge className="bg-amber-600 text-white">
                      🛡️ Active Protection
                    </Badge>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-amber-200 mb-4">
                  <p className="text-amber-800 font-medium mb-3">
                    ✅{" "}
                    <strong>
                      Safety gating has been applied to your recommendations.
                    </strong>
                  </p>
                  <p className="text-amber-700 text-sm">
                    We've automatically filtered and deprioritized pets that may
                    not be suitable for your living conditions, ensuring you
                    only see safe and appropriate matches.
                  </p>
                </div>

                <div className="space-y-4">
                  {policyGates.map((gate) => (
                    <div
                      key={gate.id}
                      className={`p-4 rounded-xl border-l-4 ${
                        gate.severity === "deprioritize"
                          ? "bg-orange-50 border-orange-400"
                          : "bg-amber-50 border-amber-400"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {gate.severity === "deprioritize" ? (
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                          ) : (
                            <Info className="w-5 h-5 text-amber-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-amber-800 font-medium">
                            {gate.reason}
                          </p>
                          <p className="text-amber-600 mt-1 text-sm">
                            {gate.severity === "deprioritize"
                              ? "🚫 Some pets have been deprioritized in your results for safety"
                              : "⚠️ Please consider this when making your decision"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Care Plan - Enhanced */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-blue-900 flex items-center gap-3">
                  <FileDown className="w-7 h-7" />
                  Your 30-Day Care Plan
                </h3>
                <Button
                  onClick={() => {
                    const species = (
                      preferences.preferredSpecies || ["pet"]
                    ).join("_");
                    const filename = `CarePlan_${species}_${readiness.score}pts.txt`;
                    downloadCarePlanFile(carePlan, filename);
                  }}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                >
                  <FileDown className="w-5 h-5 mr-2" />
                  Download Care Plan
                </Button>
              </div>

              <div className="bg-white rounded-xl p-6 border border-blue-200">
                <p className="text-blue-700 mb-4 text-sm">
                  <strong>Personalized care guide</strong> based on your
                  readiness score of {readiness.score}/100. This plan is
                  tailored to your specific situation and pet preferences.
                </p>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg max-h-80 overflow-auto border border-gray-200">
                  {carePlan}
                </pre>
              </div>
            </div>

            {/* What's Next - Clear call to action */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-8 shadow-lg text-center">
              <h3 className="text-2xl font-bold text-purple-900 mb-4">
                🎯 Ready to See Your Matches?
              </h3>
              <p className="text-purple-700 mb-6 max-w-2xl mx-auto">
                Your recommendations have been <strong>safety-gated</strong> and
                are ready to view. Each pet has been carefully evaluated against
                your living conditions and preferences.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Button
                  onClick={() => setStage("wizard")}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Edit Answers
                </Button>
                <Button
                  onClick={() => setStage("results")}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View My Safe Matches
                </Button>
              </div>

              <div className="text-sm text-purple-600">
                <p className="mb-2">
                  <strong>✨ What makes Wizard different from AI:</strong>
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-xs">
                  <span>🛡️ Safety gating applied</span>
                  <span>📚 Educational learning</span>
                  <span>🎖️ Readiness assessment</span>
                  <span>📋 Care plan included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stage-based rendering - Three distinct modes
  // 1. Summary Stage - Already handled above with enhanced UI
  // 2. Results Stage - Show pet matches with applied safety gates

  // 2. Results Stage - Show pet matches with applied safety gates
  if (stage === "results" && hasRecommendations && wizardResults) {
    // apply gates (FE fallback)
    const gatedRecs = applyGatesToRecommendations(
      wizardResults.recommendations,
      policyGates
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-4">
              <Shield className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
              Your Safe & Suitable Matches
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4 mb-4">
              🛡️ <strong>Safety-gated recommendations</strong> based on your
              step-by-step preferences. Each pet has been evaluated for your
              living conditions.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                🛡️ Safety First
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                📚 Rule-based Matching
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                🎯 Personalized Results
              </span>
            </div>
          </div>

          {/* Guest Banner */}
          {!user && (
            <div className="mb-8 p-6 md:p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
                </div>
                <div className="ml-3 md:ml-4 flex-1">
                  <h3 className="text-sm md:text-base font-semibold text-blue-800">
                    You're browsing as a guest
                  </h3>
                  <div className="mt-2 md:mt-3 text-sm md:text-base text-blue-700">
                    <p>
                      Sign in to save favorites, chat with shelters, and get
                      personalized recommendations.
                    </p>
                  </div>
                  <div className="mt-3 md:mt-4">
                    <Link
                      to="/auth/login"
                      className="inline-flex items-center px-3 md:px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                  Your Perfect Matches
                </h2>
                <p className="text-gray-600 text-base md:text-lg">
                  {gatedRecs.length} pets scored based on your preferences
                  {wizardResults.useML && " using AI"}
                </p>
                {/* Add educational tag */}
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <Brain className="w-4 h-4 mr-2" />
                    Based on your lifestyle & living conditions
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setStage("summary")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Summary
              </Button>
            </div>

            {/* Enhanced Safety Gating Message */}
            {policyGates.length > 0 && (
              <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">
                    🛡️ Safety Gating Applied
                  </h3>
                </div>
                <p className="text-green-700 mb-3">
                  <strong>Your safety is our priority!</strong> We've
                  automatically filtered and deprioritized pets that may not be
                  suitable for your living conditions.
                </p>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-600">
                    ✅{" "}
                    <strong>
                      {policyGates.length} safety rule
                      {policyGates.length !== 1 ? "s" : ""} applied
                    </strong>{" "}
                    - ensuring every match is safe and appropriate for your
                    situation.
                  </p>
                </div>
              </div>
            )}

            {/* Enhanced Educational Match Explanation */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 md:p-8 shadow-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                </div>
                <div className="ml-3 md:ml-4 flex-1">
                  <h4 className="text-lg md:text-xl font-semibold text-green-900 mb-3 md:mb-4">
                    🛡️ How We Ensured Your Safety 🎯
                  </h4>
                  <div className="text-green-700 space-y-2 md:space-y-3">
                    <p className="text-sm md:text-base">
                      <strong>Rule-based safety matching:</strong> We used your
                      specific answers to find pets that meet your criteria AND
                      are safe for your situation:
                    </p>
                    <ul className="text-sm md:text-base space-y-1 md:space-y-2 ml-3 md:ml-4">
                      {preferences.lifestyle && (
                        <li>
                          • <strong>Lifestyle:</strong> {preferences.lifestyle}{" "}
                          → matched with pets that fit your daily routine
                        </li>
                      )}
                      {preferences.livingSpace && (
                        <li>
                          • <strong>Living Space:</strong>{" "}
                          {Array.isArray(preferences.livingSpace)
                            ? preferences.livingSpace.join(", ")
                            : preferences.livingSpace}
                          → filtered for pets suitable for your home
                        </li>
                      )}
                      {preferences.preferredSpecies &&
                        preferences.preferredSpecies.length > 0 && (
                          <li>
                            • <strong>Species:</strong>{" "}
                            {Array.isArray(preferences.preferredSpecies)
                              ? preferences.preferredSpecies.join(", ")
                              : preferences.preferredSpecies}{" "}
                            → focused on your preferred pet types
                          </li>
                        )}
                      {preferences.timeAvailable && (
                        <li>
                          • <strong>Time Available:</strong>{" "}
                          {preferences.timeAvailable} → matched with pets that
                          fit your schedule
                        </li>
                      )}
                    </ul>
                    <div className="bg-white rounded-lg p-4 border border-green-200 mt-4">
                      <p className="text-sm text-green-600">
                        <strong>🛡️ Safety First:</strong> This is different from
                        AI recommendations - we use clear rules and safety gates
                        based on your answers to ensure every match is safe,
                        suitable, and stable for your situation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isGeneratingRecommendations ? (
                <>
                  <div className="col-span-full text-center py-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="text-xl font-medium text-gray-700">
                        Finding your perfect matches...
                      </span>
                    </div>
                    <p className="text-gray-600 text-lg">
                      Analyzing your preferences and matching with available
                      pets
                    </p>
                  </div>
                  <PetCardSkeleton count={6} />
                </>
              ) : (
                gatedRecs.map((sp, index) => renderPetCard(sp, index))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Wizard Form Stage - Show the step-by-step form when stage === 'wizard'
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
            Safe Pet Matching Wizard
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4 mb-4">
            🛡️ <strong>Safety-first</strong> step-by-step questionnaire with
            educational learning. Get a readiness assessment, care plan, and
            pre-filtered safe matches.
          </p>
          <div className="flex flex-wrap justify-center gap-3 px-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              🛡️ Safety First
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              📚 Learn as you go
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              🎯 Rule-based matching
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
              📋 Care plan included
            </span>
          </div>
        </div>

        {/* Guest Banner */}
        {showGuestBanner && (
          <div className="mb-8 p-6 md:p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <User className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
              </div>
              <div className="ml-3 md:ml-4 flex-1">
                <h3 className="text-sm md:text-base font-semibold text-blue-800">
                  Welcome to our pet matching wizard!
                </h3>
                <div className="mt-2 md:mt-3 text-sm md:text-base text-blue-700">
                  <p>
                    This step-by-step guide will help you find your perfect pet.
                    You can use it as a guest, or sign in for personalized
                    recommendations.
                  </p>
                </div>
                <div className="mt-3 md:mt-4 flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/auth/login"
                    className="inline-flex items-center px-3 md:px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Sign In
                  </Link>
                  <button
                    onClick={() => setShowGuestBanner(false)}
                    className="inline-flex items-center px-3 md:px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-transparent hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Continue as Guest
                  </button>
                </div>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setShowGuestBanner(false)}
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

        <div className="max-w-5xl mx-auto">
          {/* Readiness Progress Display */}
          {readiness && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Readiness Assessment
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 font-medium">
                    {readiness.score}/100 points
                  </span>
                  {readiness.badge && (
                    <Badge
                      variant="success"
                      className="bg-green-600 text-white"
                    >
                      🏆 Ready Badge Earned!
                    </Badge>
                  )}
                </div>
              </div>

              {/* Readiness Bars */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-sm text-green-700 mb-1">Time</div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${readiness.bars.time}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {readiness.bars.time}%
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-green-700 mb-1">Budget</div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${readiness.bars.budget}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {readiness.bars.budget}%
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-green-700 mb-1">Space</div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${readiness.bars.space}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {readiness.bars.space}%
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-green-700 mb-1">Experience</div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${readiness.bars.experience}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {readiness.bars.experience}%
                  </div>
                </div>
              </div>

              {/* Learning Progress */}
              <div className="flex items-center justify-between text-sm text-green-700">
                <div className="flex items-center gap-4">
                  <span>
                    📚 Info panels: {Object.keys(viewedInfoPanels).length}
                  </span>
                  <span>💡 Tips: {Object.keys(ackTips).length}</span>
                </div>
                <div className="text-xs">
                  {readiness.flags.length > 0 && (
                    <span className="text-amber-600">
                      ⚠️ Areas to improve: {readiness.flags.join(", ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Care Plan Download */}
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <FileDown className="w-4 h-4" />
                    <span>30-Day Care Plan</span>
                  </div>
                  <Button
                    onClick={() => {
                      if (readiness) {
                        const carePlanText = buildCarePlanText(
                          preferences,
                          readiness
                        );
                        const species = (
                          preferences.preferredSpecies || ["pet"]
                        ).join("_");
                        const filename = `CarePlan_${species}_${readiness.score}pts.txt`;
                        downloadCarePlanFile(carePlanText, filename);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="text-green-700 border-green-300 hover:bg-green-50 hover:border-green-400"
                  >
                    Download PDF
                  </Button>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Personalized care plan based on your readiness score
                </p>
              </div>
            </div>
          )}

          {/* Safety Gates Display */}
          {policyGates.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-amber-800 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Safety Considerations
                </h3>
                <span className="text-sm text-amber-600 font-medium">
                  {policyGates.length} safety rule
                  {policyGates.length !== 1 ? "s" : ""} applied
                </span>
              </div>

              <div className="space-y-3">
                {policyGates.map((gate) => (
                  <div
                    key={gate.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      gate.severity === "deprioritize"
                        ? "bg-orange-50 border-orange-400"
                        : "bg-amber-50 border-amber-400"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {gate.severity === "deprioritize" ? (
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                        ) : (
                          <Info className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-amber-800 font-medium">
                          {gate.reason}
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          {gate.severity === "deprioritize"
                            ? "Some pets may be deprioritized in recommendations"
                            : "Please consider this when making your decision"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <StepForm
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSubmit={handleSubmit}
              canProceed={canProceed()}
              isLoading={isLoading}
            >
              {renderStep()}
            </StepForm>
          </div>
        </div>

        {/* Wizard Feedback Modal */}
        {selectedPetForFeedback && (
          <WizardFeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={closeFeedbackModal}
            onSubmit={(petId, feedback, reason) => {
              const actualPetId =
                selectedPetForFeedback.pet.id || selectedPetForFeedback.pet._id;
              if (actualPetId) {
                handleFeedback(actualPetId, feedback, reason);
              }
            }}
            onGoBackToWizard={goBackToWizard}
            petName={selectedPetForFeedback.pet.name || "Pet"}
            matchScore={selectedPetForFeedback.score}
          />
        )}
      </div>
    </div>
  );
};
