import React from "react";
import {
  AlertTriangle,
  Info,
  Settings,
  Clock,
  Building2,
  Dog,
  Baby,
  DollarSign,
  Users,
} from "lucide-react";
import { clsx } from "clsx";

interface SmartSuggestionProps {
  type: "warning" | "info";
  message: string;
  suggestion?: string;
  className?: string;
  onAdjust?: (suggestionType: string, conflictId?: string) => void;
  suggestionType?: string;
  showAdjustButton?: boolean;
  iconOverride?: React.ReactNode;
  conflictId?: string;
  onIgnore?: (conflictId: string) => void;
  onDismiss?: (conflictId: string) => void;
}

// Icon mapping for different conflict types
const getConflictIcon = (
  suggestionType?: string,
  type: "warning" | "info" = "info"
) => {
  if (!suggestionType) {
    return type === "warning" ? (
      <AlertTriangle className="h-4 w-4" />
    ) : (
      <Info className="h-4 w-4" />
    );
  }

  const iconMap: Record<string, React.ReactNode> = {
    time_availability: <Clock className="h-4 w-4" />,
    activity_level: <AlertTriangle className="h-4 w-4" />,
    space_consideration: <Building2 className="h-4 w-4" />,
    experience_level: <AlertTriangle className="h-4 w-4" />,
    yard_requirement: <Dog className="h-4 w-4" />,
    family_friendly: <Baby className="h-4 w-4" />,
    budget_consideration: <DollarSign className="h-4 w-4" />,
    lifestyle_mismatch: <Users className="h-4 w-4" />,
  };

  return (
    iconMap[suggestionType] ||
    (type === "warning" ? (
      <AlertTriangle className="h-4 w-4" />
    ) : (
      <Info className="h-4 w-4" />
    ))
  );
};

export const SmartSuggestion: React.FC<SmartSuggestionProps> = ({
  type,
  message,
  suggestion,
  className,
  onAdjust,
  suggestionType,
  showAdjustButton = true,
  iconOverride,
  conflictId,
  onIgnore,
  onDismiss,
}) => {
  const isWarning = type === "warning";
  const icon = iconOverride || getConflictIcon(suggestionType, type);

  const handleAdjust = () => {
    if (onAdjust && suggestionType) {
      onAdjust(suggestionType, conflictId);
    }
  };

  const handleIgnore = () => {
    if (onIgnore && conflictId) {
      onIgnore(conflictId);
    }
  };

  const handleDismiss = () => {
    if (onDismiss && conflictId) {
      onDismiss(conflictId);
    }
  };

  return (
    <div
      className={clsx(
        "p-4 rounded-lg border-l-4 text-sm",
        {
          "bg-amber-50 border-amber-400 text-amber-800": isWarning,
          "bg-blue-50 border-blue-400 text-blue-800": !isWarning,
        },
        className
      )}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <p className="text-base font-semibold">{message}</p>
          {suggestion && (
            <div className="mt-2">
              <p className="text-sm italic opacity-90">{suggestion}</p>
              <div className="mt-2 flex gap-2">
                {showAdjustButton && onAdjust && suggestionType && (
                  <button
                    onClick={handleAdjust}
                    className={clsx(
                      "text-sm font-medium flex items-center gap-1 transition-colors",
                      {
                        "text-amber-700 hover:text-amber-800": isWarning,
                        "text-blue-700 hover:text-blue-800": !isWarning,
                      }
                    )}
                  >
                    <Settings className="h-3 w-3" />
                    Adjust preferences
                  </button>
                )}
                {onIgnore && conflictId && (
                  <button
                    onClick={handleIgnore}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Ignore
                  </button>
                )}
                {onDismiss && conflictId && (
                  <button
                    onClick={handleDismiss}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to detect conflicts
export const detectConflicts = (preferences: any) => {
  const conflicts = [];

  // Active lifestyle but minimal time - HIGH PRIORITY (3)
  if (
    preferences.lifestyle === "active" &&
    preferences.timeAvailable === "minimal"
  ) {
    conflicts.push({
      id: "active_lifestyle_minimal_time",
      type: "warning" as const,
      priority: 3,
      message: "Active lifestyle with minimal time might be challenging",
      suggestion:
        "Consider pets that are more independent or require less exercise.",
      suggestionType: "time_availability",
    });
  }

  // Busy lifestyle but high activity preference - HIGH PRIORITY (3)
  if (
    preferences.lifestyle === "busy" &&
    preferences.activityLevel === "high"
  ) {
    conflicts.push({
      id: "busy_lifestyle_high_activity",
      type: "warning" as const,
      priority: 3,
      message: "High energy pets need more time and attention",
      suggestion: "Consider lower energy pets or adjust your availability.",
      suggestionType: "activity_level",
    });
  }

  // First-time owner with high energy pets - MEDIUM PRIORITY (2)
  if (
    preferences.experience === "first-time" &&
    preferences.activityLevel === "high"
  ) {
    conflicts.push({
      id: "first_time_high_energy",
      type: "warning" as const,
      priority: 2,
      message: "High energy pets can be challenging for first-time owners",
      suggestion: "Consider starting with a more moderate energy level pet.",
      suggestionType: "experience_level",
    });
  }

  // Children but no experience - MEDIUM PRIORITY (2)
  if (
    preferences.hasChildren === "yes" &&
    preferences.experience === "first-time"
  ) {
    conflicts.push({
      id: "children_no_experience",
      type: "warning" as const,
      priority: 2,
      message: "Pets with children need extra consideration",
      suggestion: "Look for family-friendly pets with gentle temperaments.",
      suggestionType: "family_friendly",
    });
  }

  // Limited space but large pet preference - MEDIUM PRIORITY (2)
  if (
    preferences.spaceAvailable === "limited" &&
    preferences.preferredSpecies.includes("dog")
  ) {
    conflicts.push({
      id: "limited_space_dog_preference",
      type: "info" as const,
      priority: 2,
      message: "Dogs in limited space need extra consideration",
      suggestion:
        "Look for smaller breeds or consider cats which adapt better to small spaces.",
      suggestionType: "space_consideration",
    });
  }

  // No yard but dog preference - LOW PRIORITY (1)
  if (
    preferences.hasYard === "no" &&
    preferences.preferredSpecies.includes("dog")
  ) {
    conflicts.push({
      id: "no_yard_dog_preference",
      type: "info" as const,
      priority: 1,
      message: "Dogs without yards need regular walks",
      suggestion:
        "Make sure you can commit to daily walks and outdoor exercise.",
      suggestionType: "yard_requirement",
    });
  }

  // Budget considerations - MEDIUM PRIORITY (2)
  if (
    preferences.budget === "low" &&
    preferences.preferredSpecies.includes("dog")
  ) {
    conflicts.push({
      id: "low_budget_large_pet",
      type: "warning" as const,
      priority: 2,
      message: "Large pets can have higher ongoing costs",
      suggestion:
        "Consider smaller pets or ensure you can afford food, vet care, and supplies.",
      suggestionType: "budget_consideration",
    });
  }

  // Lifestyle mismatch - MEDIUM PRIORITY (2)
  if (
    preferences.lifestyle === "sedentary" &&
    preferences.activityLevel === "high"
  ) {
    conflicts.push({
      id: "sedentary_high_activity",
      type: "info" as const,
      priority: 2,
      message: "High energy pets need active owners",
      suggestion:
        "Consider pets that match your activity level or be prepared to increase your activity.",
      suggestionType: "lifestyle_mismatch",
    });
  }

  // Sort conflicts by priority (highest first) and then by type (warnings first)
  return conflicts.sort((a, b) => {
    // First sort by priority (descending)
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    // Then sort by type (warnings before info)
    if (a.type === "warning" && b.type === "info") return -1;
    if (a.type === "info" && b.type === "warning") return 1;
    return 0;
  });
};
