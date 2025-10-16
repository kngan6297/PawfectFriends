import React from "react";
import { Badge } from "@/components/ui/Badge";
import { clsx } from "clsx";
import { usePetTooltipRegistration, PET_TOOLTIPS } from "./usePetTooltip";
import { getMatchLevelInfo } from "@/utils/matchUtils";

interface MatchScoreBadgeProps {
  petId: string;
  matchScore: number;
  index: number;
  className?: string;
}

export const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({
  petId,
  matchScore,
  index,
  className = "",
}) => {
  const score = Math.round(matchScore * 100);
  const badgeContent = getMatchLevelInfo(score);

  if (!badgeContent) {
    return null;
  }

  // Register tooltip
  const matchScoreTooltipId = usePetTooltipRegistration({
    petId,
    tooltipId: "matchScore",
    content: PET_TOOLTIPS.matchScore(score),
  });

  return (
    <div className={`absolute top-3 left-3 z-10 ${className}`}>
      <Badge
        variant={badgeContent.variant}
        className={clsx(
          "px-3 py-1 text-sm font-semibold shadow-md border-0 text-white",
          badgeContent.gradient
        )}
        data-tooltip-id={matchScoreTooltipId}
      >
        <span className="flex items-center">
          <span className="mr-1">{badgeContent.icon}</span>
          {badgeContent.text}
        </span>
      </Badge>
    </div>
  );
};
