import React from "react";
import { Card } from "@/components/ui/Card";
import { CollapsibleContent } from "@/components/ui/CollapsibleContent";
import {
  Brain,
  Lightbulb,
  TrendingUp,
  Heart,
  Shield,
  Clock,
  Home,
  Users,
} from "lucide-react";
import { ScoringPreferences } from "@/services/recommendation.service";

interface LifestyleInsightsProps {
  preferences: ScoringPreferences;
}

export const LifestyleInsights: React.FC<LifestyleInsightsProps> = ({
  preferences,
}) => {
  const generateInsights = () => {
    const insights: Array<{
      type: "positive" | "warning" | "info";
      icon: React.ReactNode;
      title: string;
      description: string;
      category: string;
    }> = [];

    // Lifestyle-based insights
    if (preferences.lifestyle?.includes("homebody")) {
      // Make lifestyle insights species-aware
      const preferredSpecies = preferences.preferredSpecies?.[0]?.toLowerCase();

      if (preferredSpecies === "cat") {
        insights.push({
          type: "positive",
          icon: <Home className="w-5 h-5" />,
          title: "Perfect for Indoor Cats",
          description:
            "Your homebody lifestyle is perfect for cats who enjoy indoor companionship and cozy napping spots.",
          category: "Lifestyle Match",
        });
      } else if (preferredSpecies === "dog") {
        insights.push({
          type: "positive",
          icon: <Home className="w-5 h-5" />,
          title: "Great for Indoor Dogs",
          description:
            "Your homebody lifestyle is perfect for small dogs or low-energy breeds that enjoy indoor companionship.",
          category: "Lifestyle Match",
        });
      } else {
        // Generic fallback
        insights.push({
          type: "positive",
          icon: <Home className="w-5 h-5" />,
          title: "Great for Indoor Pets",
          description:
            "Your homebody lifestyle is perfect for cats, small dogs, or birds that enjoy indoor companionship.",
          category: "Lifestyle Match",
        });
      }
    }

    if (preferences.lifestyle?.includes("active")) {
      // Make lifestyle insights species-aware
      const preferredSpecies = preferences.preferredSpecies?.[0]?.toLowerCase();

      if (preferredSpecies === "cat") {
        insights.push({
          type: "positive",
          icon: <TrendingUp className="w-5 h-5" />,
          title: "Perfect for Active Cats",
          description:
            "Your active lifestyle is ideal for energetic cats who enjoy interactive play and climbing activities.",
          category: "Lifestyle Match",
        });
      } else if (preferredSpecies === "dog") {
        insights.push({
          type: "positive",
          icon: <TrendingUp className="w-5 h-5" />,
          title: "Perfect for Active Dogs",
          description:
            "Your active lifestyle is ideal for high-energy breeds that need lots of exercise and outdoor activities.",
          category: "Lifestyle Match",
        });
      } else {
        // Generic fallback
        insights.push({
          type: "positive",
          icon: <TrendingUp className="w-5 h-5" />,
          title: "Perfect for Active Pets",
          description:
            "Your active lifestyle is ideal for high-energy pets that need lots of exercise and outdoor activities.",
          category: "Lifestyle Match",
        });
      }
    }

    if (preferences.lifestyle?.includes("busy")) {
      // Make lifestyle insights species-aware
      const preferredSpecies = preferences.preferredSpecies?.[0]?.toLowerCase();

      if (preferredSpecies === "cat") {
        insights.push({
          type: "warning",
          icon: <Clock className="w-5 h-5" />,
          title: "Cats are Perfect for Busy Schedules",
          description:
            "With your busy schedule, cats are ideal as they're independent and don't require constant attention.",
          category: "Time Management",
        });
      } else if (preferredSpecies === "dog") {
        insights.push({
          type: "warning",
          icon: <Clock className="w-5 h-5" />,
          title: "Consider Low-Maintenance Dogs",
          description:
            "With your busy schedule, consider adult dogs or low-energy breeds that don't require constant attention.",
          category: "Time Management",
        });
      } else {
        // Generic fallback
        insights.push({
          type: "warning",
          icon: <Clock className="w-5 h-5" />,
          title: "Consider Low-Maintenance Pets",
          description:
            "With your busy schedule, consider cats, fish, or low-maintenance pets that don't require constant attention.",
          category: "Time Management",
        });
      }
    }

    if (preferences.lifestyle?.includes("traveler")) {
      insights.push({
        type: "warning",
        icon: <Shield className="w-5 h-5" />,
        title: "Plan for Pet Care",
        description:
          "Frequent travel requires a solid pet care plan. Consider pets that adapt well to pet sitters or boarding.",
        category: "Travel Considerations",
      });
    }

    // Experience-based insights
    if (preferences.experience?.includes("first-time")) {
      insights.push({
        type: "info",
        icon: <Brain className="w-5 h-5" />,
        title: "Start with Adult Pets",
        description:
          "As a first-time owner, consider adult pets who are already trained and have established personalities.",
        category: "Experience Level",
      });
    }

    if (preferences.experience?.includes("experienced")) {
      insights.push({
        type: "positive",
        icon: <Heart className="w-5 h-5" />,
        title: "Ready for Special Needs",
        description:
          "Your experience makes you a great candidate for pets with special needs or behavioral challenges.",
        category: "Experience Level",
      });
    }

    // Living space insights
    if (
      preferences.livingSpace?.some(
        (space) =>
          space === "apartment-limited" || space === "apartment-moderate"
      )
    ) {
      insights.push({
        type: "info",
        icon: <Home className="w-5 h-5" />,
        title: "Apartment-Friendly Options",
        description:
          "Small dogs, cats, birds, or fish are excellent choices for apartment living with limited space.",
        category: "Living Space",
      });
    }

    if (
      preferences.livingSpace?.some(
        (space) => space === "house-yard" || space === "rural-spacious"
      )
    ) {
      insights.push({
        type: "positive",
        icon: <TrendingUp className="w-5 h-5" />,
        title: "Perfect for Active Dogs",
        description:
          "Your yard provides excellent space for active dogs to play and exercise safely.",
        category: "Living Space",
      });
    }

    // Time availability insights
    if (preferences.timeAvailable?.includes("minimal")) {
      insights.push({
        type: "warning",
        icon: <Clock className="w-5 h-5" />,
        title: "Low-Maintenance Required",
        description:
          "With limited time, focus on pets that are independent and require minimal daily care.",
        category: "Time Management",
      });
    }

    if (
      preferences.timeAvailable?.some(
        (time) => time === "significant" || time === "wfh"
      )
    ) {
      insights.push({
        type: "positive",
        icon: <Heart className="w-5 h-5" />,
        title: "Great for High-Maintenance Pets",
        description:
          "Your availability allows for pets that need lots of attention, training, or medical care.",
        category: "Time Management",
      });
    }

    // Family insights
    if (preferences.hasChildren?.includes("yes")) {
      insights.push({
        type: "info",
        icon: <Users className="w-5 h-5" />,
        title: "Child-Friendly Pets",
        description:
          "Look for pets known for being gentle, patient, and good with children.",
        category: "Family Considerations",
      });
    }

    if (preferences.hasOtherPets?.includes("yes")) {
      insights.push({
        type: "info",
        icon: <Shield className="w-5 h-5" />,
        title: "Consider Compatibility",
        description:
          "Choose pets that get along well with your existing pets and have similar energy levels.",
        category: "Family Considerations",
      });
    }

    // Activity level insights - updated to match wizard version
    if (preferences.activityLevel?.includes("low")) {
      insights.push({
        type: "info",
        icon: <Home className="w-5 h-5" />,
        title: "Calm Companions",
        description:
          "Consider low-energy pets that enjoy quiet companionship and don't require intense exercise.",
        category: "Activity Match",
      });
    }

    if (preferences.activityLevel?.includes("high")) {
      insights.push({
        type: "positive",
        icon: <TrendingUp className="w-5 h-5" />,
        title: "High-Energy Pets Welcome",
        description:
          "Your active lifestyle can accommodate energetic pets that need lots of exercise and outdoor time.",
        category: "Activity Match",
      });
    }

    // Budget insights - updated to match wizard version
    if (preferences.budget?.includes("low")) {
      insights.push({
        type: "warning",
        icon: <Shield className="w-5 h-5" />,
        title: "Consider Adoption Costs",
        description:
          "Adoption fees and initial setup costs vary. Research ongoing care expenses for your chosen pet type.",
        category: "Budget Planning",
      });
    }

    if (preferences.budget?.includes("high")) {
      insights.push({
        type: "positive",
        icon: <Heart className="w-5 h-5" />,
        title: "Premium Care Options",
        description:
          "Your budget allows for premium pet care, specialized training, and high-quality food and supplies.",
        category: "Budget Planning",
      });
    }

    // Allergy insights
    if (
      preferences.allergies?.some(
        (allergy) => allergy === "pet-hair" || allergy === "pet-dander"
      )
    ) {
      insights.push({
        type: "warning",
        icon: <Shield className="w-5 h-5" />,
        title: "Hypoallergenic Options",
        description:
          "Consider hypoallergenic breeds or pets that produce less dander to manage your allergies.",
        category: "Health Considerations",
      });
    }

    // Additional info insights
    if (preferences.additionalInfo) {
      insights.push({
        type: "info",
        icon: <Brain className="w-5 h-5" />,
        title: "Custom Requirements",
        description:
          "We'll consider your specific needs and preferences when making recommendations.",
        category: "Custom Requirements",
      });
    }

    return insights;
  };

  const insights = generateInsights();

  const getInsightColor = (type: string) => {
    switch (type) {
      case "positive":
        return "border-green-200 bg-green-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "info":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const getInsightIconColor = (type: string) => {
    switch (type) {
      case "positive":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "info":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          AI Lifestyle Insights
        </h3>
      </div>

      <CollapsibleContent
        maxLines={4}
        showToggle={insights.length > 4}
        toggleText={{
          showMore: `Show ${insights.length - 4} more insights`,
          showLess: "Show fewer insights",
        }}
      >
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getInsightColor(
                insight.type
              )}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 ${getInsightIconColor(
                    insight.type
                  )}`}
                >
                  {insight.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {insight.title}
                    </h4>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                      {insight.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Card>
  );
};
