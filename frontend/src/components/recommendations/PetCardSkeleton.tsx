import React from "react";
import { Card } from "@/components/ui/Card";

interface PetCardSkeletonProps {
  count?: number;
}

export const PetCardSkeleton: React.FC<PetCardSkeletonProps> = ({
  count = 6,
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="p-6 animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-20"></div>
            </div>
          </div>

          {/* Image skeleton */}
          <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>

          {/* Description skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>

          {/* AI Explanation skeleton */}
          <div className="mb-4 p-3 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>

          {/* Match Factors skeleton */}
          <div className="mb-4">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="flex flex-wrap gap-1">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-14"></div>
            </div>
          </div>

          {/* Actions skeleton */}
          <div className="flex gap-2">
            <div className="flex-1 h-8 bg-gray-200 rounded"></div>
            <div className="flex-1 h-8 bg-gray-200 rounded"></div>
            <div className="flex-1 h-8 bg-gray-200 rounded"></div>
          </div>

          {/* Feedback skeleton */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="h-3 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-12"></div>
              <div className="h-6 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
};
