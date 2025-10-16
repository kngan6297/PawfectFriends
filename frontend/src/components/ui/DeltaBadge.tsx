import React from "react";
import { trendColor, trendIcon, formatPercentage } from "@/utils/format";

interface DeltaBadgeProps {
  delta?: number;
  className?: string;
}

export const DeltaBadge: React.FC<DeltaBadgeProps> = ({
  delta = 0,
  className = "",
}) => {
  if (delta === 0) return null;

  return (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${trendColor(
        delta
      )} ${className}`}
      title={`${delta > 0 ? "Increase" : "Decrease"} of ${Math.abs(
        delta
      ).toFixed(1)}% from previous period`}
    >
      {trendIcon(delta)} {Math.abs(delta).toFixed(0)}%
    </span>
  );
};

export default DeltaBadge;
