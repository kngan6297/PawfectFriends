import React from "react";
import { Card } from "@/components/ui/Card";
import { CollapsibleContent } from "@/components/ui/CollapsibleContent";
import {
  User,
  Home,
  Clock,
  Heart,
  Activity,
  Briefcase,
  Plane,
  Volume2,
  Scissors,
  GraduationCap,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { ScoringPreferences } from "@/services/recommendation.service";
import { getPreferenceString } from "@/utils/preferenceUtils";

interface LifestyleSummaryProps {
  preferences: ScoringPreferences;
}

export const LifestyleSummary: React.FC<LifestyleSummaryProps> = ({
  preferences,
}) => {
  const getLifestyleIcon = (lifestyle: string) => {
    switch (lifestyle) {
      case "homebody":
        return "🏠";
      case "busy":
        return "💼";
      case "active":
        return "🏃";
      case "traveler":
        return "✈️";
      case "student":
        return "🎓";
      case "retired":
        return "🌅";
      default:
        return "👤";
    }
  };

  const getExperienceIcon = (experience: string) => {
    switch (experience) {
      case "first-time":
        return "👶";
      case "some":
        return "📚";
      case "experienced":
        return "🎯";
      case "professional":
        return "🏥";
      default:
        return "🐾";
    }
  };

  const getTimeIcon = (time: string) => {
    switch (time) {
      case "minimal":
        return "⏰";
      case "moderate":
        return "📅";
      case "significant":
        return "🕐";
      case "wfh":
        return "🏠";
      case "flexible":
        return "🔄";
      default:
        return "⏰";
    }
  };

  const getSpaceIcon = (space: string) => {
    switch (space) {
      case "apartment":
        return "🏢";
      case "house":
        return "🏠";
      case "yard":
        return "🌳";
      case "farm":
        return "🚜";
      default:
        return "🏠";
    }
  };

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case "sedentary":
        return "🛋️";
      case "moderate":
        return "🚶";
      case "very-active":
        return "💪";
      case "outdoor":
        return "🏔️";
      default:
        return "🏃";
    }
  };

  const getWorkIcon = (work: string) => {
    switch (work) {
      case "9to5":
        return "💼";
      case "flexible":
        return "🔄";
      case "remote":
        return "🏠";
      case "shift-work":
        return "🌙";
      case "part-time":
        return "⏰";
      case "unemployed":
        return "🏖️";
      default:
        return "💼";
    }
  };

  const getTravelIcon = (travel: string) => {
    switch (travel) {
      case "rarely":
        return "🏠";
      case "occasionally":
        return "✈️";
      case "frequently":
        return "🌍";
      case "business":
        return "💼";
      default:
        return "✈️";
    }
  };

  const getNoiseIcon = (noise: string) => {
    switch (noise) {
      case "low":
        return "🔇";
      case "moderate":
        return "🔉";
      case "high":
        return "🔊";
      default:
        return "🔇";
    }
  };

  const getGroomingIcon = (grooming: string) => {
    switch (grooming) {
      case "minimal":
        return "🛁";
      case "moderate":
        return "🧴";
      case "extensive":
        return "💇";
      default:
        return "🛁";
    }
  };

  const getTrainingIcon = (training: string) => {
    switch (training) {
      case "basic":
        return "🎓";
      case "moderate":
        return "📚";
      case "advanced":
        return "🏆";
      case "sport":
        return "🥇";
      default:
        return "🎓";
    }
  };

  const getBudgetIcon = (budget: string) => {
    switch (budget) {
      case "low":
        return "💰";
      case "moderate":
        return "💵";
      case "high":
        return "💎";
      default:
        return "💰";
    }
  };

  const getAllergyIcon = (allergy: string) => {
    switch (allergy) {
      case "none":
        return "✅";
      case "pet-hair":
        return "🤧";
      case "pet-dander":
        return "😷";
      case "unknown":
        return "❓";
      default:
        return "✅";
    }
  };

  const formatLabel = (value: string | string[] | undefined) => {
    if (!value) return "Not specified";

    // Handle arrays (convert to string first)
    const stringValue = Array.isArray(value) ? value.join(", ") : value;

    if (typeof stringValue !== "string") return "Not specified";

    // Convert camelCase to readable text
    return stringValue
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/-/g, " ");
  };

  const lifestyleSections = [
    {
      title: "Basic Lifestyle",
      icon: <User className="w-5 h-5" />,
      items: [
        {
          label: "Lifestyle",
          value: preferences.lifestyle,
          icon: getLifestyleIcon(getPreferenceString(preferences.lifestyle)),
        },
        {
          label: "Experience",
          value: preferences.experience,
          icon: getExperienceIcon(getPreferenceString(preferences.experience)),
        },
        {
          label: "Time Available",
          value: preferences.timeAvailable,
          icon: getTimeIcon(getPreferenceString(preferences.timeAvailable)),
        },
        {
          label: "Living Space",
          value: preferences.livingSpace,
          icon: getSpaceIcon(getPreferenceString(preferences.livingSpace)),
        },
      ],
    },
    {
      title: "Activity & Schedule",
      icon: <Activity className="w-5 h-5" />,
      items: [
        {
          label: "Activity Level",
          value: preferences.activityLevel,
          icon: getActivityIcon(getPreferenceString(preferences.activityLevel)),
        },
        {
          label: "Work Schedule",
          value: preferences.workSchedule,
          icon: getWorkIcon(getPreferenceString(preferences.workSchedule)),
        },
        {
          label: "Travel Frequency",
          value: preferences.travelFrequency,
          icon: getTravelIcon(getPreferenceString(preferences.travelFrequency)),
        },
      ],
    },
    {
      title: "Preferences & Constraints",
      icon: <Heart className="w-5 h-5" />,
      items: [
        {
          label: "Noise Tolerance",
          value: preferences.noiseTolerance,
          icon: getNoiseIcon(getPreferenceString(preferences.noiseTolerance)),
        },
        {
          label: "Grooming Preference",
          value: preferences.groomingPreference,
          icon: getGroomingIcon(
            getPreferenceString(preferences.groomingPreference)
          ),
        },
        {
          label: "Training Commitment",
          value: preferences.trainingCommitment,
          icon: getTrainingIcon(
            getPreferenceString(preferences.trainingCommitment)
          ),
        },
        {
          label: "Budget",
          value: preferences.budget,
          icon: getBudgetIcon(getPreferenceString(preferences.budget)),
        },
        {
          label: "Allergies",
          value: preferences.allergies,
          icon: getAllergyIcon(getPreferenceString(preferences.allergies)),
        },
      ],
    },
    {
      title: "Family & Environment",
      icon: <Home className="w-5 h-5" />,
      items: [
        {
          label: "Has Children",
          value: preferences.hasChildren,
          icon: preferences.hasChildren?.includes("yes")
            ? "👶"
            : preferences.hasChildren?.includes("no")
            ? "👤"
            : "❓",
        },
        {
          label: "Has Other Pets",
          value: preferences.hasOtherPets,
          icon: preferences.hasOtherPets?.includes("yes")
            ? "🐾"
            : preferences.hasOtherPets?.includes("no")
            ? "🏠"
            : "❓",
        },
        {
          label: "Has Yard",
          value: preferences.hasYard,
          icon: preferences.hasYard?.includes("yes")
            ? "🌳"
            : preferences.hasYard?.includes("no")
            ? "🏠"
            : "❓",
        },
      ],
    },
    {
      title: "Pet Preferences",
      icon: <Heart className="w-5 h-5" />,
      items: [
        {
          label: "Preferred Species",
          value: preferences.preferredSpecies?.join(", "),
          icon: "🐾",
        },
        {
          label: "Additional Info",
          value: preferences.additionalInfo,
          icon: "💭",
        },
      ],
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Your Lifestyle Profile
        </h3>
      </div>

      <div className="space-y-6">
        {lifestyleSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              {section.icon}
              <span>{section.title}</span>
            </div>

            <CollapsibleContent
              maxLines={2}
              showToggle={section.items.length > 4}
              toggleText={{
                showMore: `Show ${section.items.length - 4} more`,
                showLess: "Show less",
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 truncate">
                        {item.label}
                      </div>
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {formatLabel(item.value)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </div>
        ))}
      </div>
    </Card>
  );
};
