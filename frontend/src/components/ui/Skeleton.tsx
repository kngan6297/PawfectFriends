import React from "react";

// Generic skeleton component
export const Skeleton: React.FC<{
  className?: string;
}> = ({ className = "" }) => (
  <div className={`skeleton-pulse bg-gray-200 rounded ${className}`} />
);

// Basic skeleton bar component
export const SkeletonBar: React.FC<{
  width?: string;
  height?: string;
  className?: string;
}> = ({ width = "w-full", height = "h-4", className = "" }) => (
  <div
    className={`skeleton-pulse bg-gray-200 rounded ${width} ${height} ${className}`}
  />
);

// Skeleton card for charts and content areas
export const SkeletonCard: React.FC<{
  lines?: number;
  height?: number;
  title?: boolean;
  className?: string;
}> = ({ lines = 6, height = 280, title = true, className = "" }) => (
  <div className={`p-4 ${className}`}>
    {title && (
      <div className="mb-3 h-5 w-40 bg-gray-200 rounded skeleton-pulse" />
    )}
    <div
      className={`space-y-3 ${
        height === 288 ? "skeleton-chart-height-large" : "skeleton-chart-height"
      }`}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBar key={i} />
      ))}
    </div>
  </div>
);

// Skeleton for KPI cards
export const SkeletonKPI: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 4, className = "" }) => (
  <div className={`grid gap-4 grid-auto-fit-kpi ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="text-center">
        <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2 skeleton-pulse" />
        <div className="h-8 w-16 bg-gray-200 rounded mx-auto mb-2 skeleton-pulse" />
        <div className="h-4 w-20 bg-gray-200 rounded mx-auto skeleton-pulse" />
      </div>
    ))}
  </div>
);

// Skeleton for data tables/lists
export const SkeletonList: React.FC<{
  rows?: number;
  showAvatar?: boolean;
  className?: string;
}> = ({ rows = 5, showAvatar = true, className = "" }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-3">
        {showAvatar && (
          <div className="h-8 w-8 bg-gray-200 rounded-full skeleton-pulse" />
        )}
        <div className="flex-1 space-y-2">
          <SkeletonBar width="w-32" height="h-4" />
          <SkeletonBar width="w-48" height="h-3" />
        </div>
      </div>
    ))}
  </div>
);

// Skeleton for pending items
export const SkeletonPending: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 2, className = "" }) => (
  <div className={`grid gap-4 grid-auto-fit-pending ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
      >
        <div className="flex items-center">
          <div className="h-5 w-5 bg-gray-200 rounded mr-3 skeleton-pulse" />
          <div>
            <div className="h-4 w-24 bg-gray-200 rounded mb-1 skeleton-pulse" />
            <div className="h-3 w-32 bg-gray-200 rounded skeleton-pulse" />
          </div>
        </div>
        <div className="h-6 w-8 bg-gray-200 rounded skeleton-pulse" />
      </div>
    ))}
  </div>
);

// Skeleton for buttons/actions
export const SkeletonButton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 3, className = "" }) => (
  <div className={`grid gap-4 grid-auto-fit-buttons ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-10 bg-gray-200 rounded skeleton-pulse" />
    ))}
  </div>
);

// Dark mode support for skeletons
export const SkeletonBarDark: React.FC<{
  width?: string;
  height?: string;
  className?: string;
}> = ({ width = "w-full", height = "h-4", className = "" }) => (
  <div
    className={`skeleton-pulse skeleton-bg rounded ${width} ${height} ${className}`}
  />
);

// Enhanced skeleton card with dark mode support
export const SkeletonCardDark: React.FC<{
  lines?: number;
  height?: number;
  title?: boolean;
  className?: string;
}> = ({ lines = 6, height = 280, title = true, className = "" }) => (
  <div className={`p-4 ${className}`}>
    {title && (
      <div className="mb-3 h-5 w-40 skeleton-bg rounded skeleton-pulse" />
    )}
    <div
      className={`space-y-3 ${
        height === 288 ? "skeleton-chart-height-large" : "skeleton-chart-height"
      }`}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBarDark key={i} />
      ))}
    </div>
  </div>
);
