import React from "react";
import { Badge } from "@/components/ui/Badge";
import { usePetTooltipRegistration, PET_TOOLTIPS } from "./usePetTooltip";

interface MatchInsightsBadgeProps {
  petId: string;
  insights: string[];
  className?: string;
}

export const MatchInsightsBadge: React.FC<MatchInsightsBadgeProps> = ({
  petId,
  insights,
  className = "",
}) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  // Register tooltip
  const insightsTooltipId = usePetTooltipRegistration({
    petId,
    tooltipId: "insight",
    content: PET_TOOLTIPS.matchInsights(insights),
  });

  return (
    <div className={`flex items-center ${className}`}>
      <Badge
        variant="accent-blue"
        size="sm"
        data-tooltip-id={insightsTooltipId}
      >
        🧠 {insights.length} match insights
      </Badge>
    </div>
  );
};
