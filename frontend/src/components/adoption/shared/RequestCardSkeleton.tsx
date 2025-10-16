import React from "react";
import { Card, CardContent } from "@/components/ui/Card";

export const RequestCardSkeleton: React.FC = () => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-3">
              {/* Pet Photo Thumbnail Skeleton */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-lg bg-gray-200 animate-pulse" />
              </div>

              {/* Pet Info and Status Skeleton */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div>
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mt-1" />
                  </div>
                </div>

                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-4" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-4" />

                {/* Contract Status Skeleton */}
                <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>

          <div className="ml-6 flex flex-col gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestCardSkeleton;
