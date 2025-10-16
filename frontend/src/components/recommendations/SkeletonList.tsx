import React from "react";
import { Card } from "@/components/ui/Card";

interface SkeletonListProps {
  count: number;
  className?: string;
  columns?: number;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count,
  className = "",
  columns,
}) => {
  // Use provided columns or default responsive grid
  const gridClasses = columns
    ? `grid-cols-${columns}`
    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid ${gridClasses} gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="p-6 animate-pulse">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 bg-gray-200 rounded-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>

          {/* Image */}
          <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>

          {/* Description */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>

          {/* AI Explanation */}
          <div className="mb-4 p-3 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              <div className="h-3 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <div className="flex-1 h-8 bg-gray-200 rounded"></div>
            <div className="flex-1 h-8 bg-gray-200 rounded"></div>
            <div className="flex-1 h-8 bg-gray-200 rounded"></div>
          </div>
        </Card>
      ))}
    </div>
  );
};
