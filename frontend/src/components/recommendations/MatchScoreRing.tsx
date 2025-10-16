import React from "react";
import { Star } from "lucide-react";
import { MATCH_THRESHOLDS } from "@/constants/match.constants";

interface MatchScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const MatchScoreRing: React.FC<MatchScoreRingProps> = ({
  score,
  size = "md",
  showLabel = true,
}) => {
  const percentage = score * 100;
  const radius = size === "sm" ? 20 : size === "lg" ? 35 : 28;
  const strokeWidth = size === "sm" ? 3 : size === "lg" ? 5 : 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= MATCH_THRESHOLDS.perfect) return "text-yellow-600 stroke-yellow-500";
    if (score >= MATCH_THRESHOLDS.best) return "text-green-600 stroke-green-500";
    if (score >= MATCH_THRESHOLDS.high) return "text-blue-600 stroke-blue-500";
    if (score >= 0.7) return "text-yellow-600 stroke-yellow-500";
    if (score >= 0.6) return "text-orange-600 stroke-orange-500";
    return "text-gray-600 stroke-gray-400";
  };

  const getScoreVariant = (score: number) => {
    if (score >= MATCH_THRESHOLDS.perfect) return "perfect";
    if (score >= MATCH_THRESHOLDS.best) return "success";
    if (score >= MATCH_THRESHOLDS.high) return "primary";
    if (score >= 0.7) return "warning";
    if (score >= 0.6) return "secondary";
    return "secondary";
  };

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className={`${sizeClasses[size]} transform -rotate-90`}
        viewBox={`0 0 ${radius * 2 + strokeWidth} ${radius * 2 + strokeWidth}`}
      >
        {/* Background circle */}
        <circle
          cx={radius + strokeWidth / 2}
          cy={radius + strokeWidth / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={radius + strokeWidth / 2}
          cy={radius + strokeWidth / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${getScoreColor(
            score
          )}`}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-center gap-1">
          <Star
            className={`w-3 h-3 ${
              score >= MATCH_THRESHOLDS.perfect
                ? "text-yellow-500"
                : score >= MATCH_THRESHOLDS.best
                ? "text-yellow-500"
                : "text-gray-400"
            }`}
          />
          <span
            className={`font-bold ${textSizeClasses[size]} ${getScoreColor(
              score
            )}`}
          >
            {percentage.toFixed(0)}%
          </span>
        </div>
        {showLabel && (
          <span className={`text-xs text-gray-500 mt-1`}>
            {score >= 0.95
              ? "Perfect Match"
              : score >= 0.9
              ? "Best Match"
              : "Match"}
          </span>
        )}
      </div>
    </div>
  );
};
