import React from "react";
import useShelterViewTracking from "../../hooks/useShelterViewTracking";

interface ShelterDetailWithTrackingProps {
  shelterId: string;
  shelter: {
    _id: string;
    name: string;
    description?: string;
    profileViews?: number;
    // ... other shelter properties
  };
  children?: React.ReactNode;
}

/**
 * Example component showing how to integrate view tracking
 * This component automatically tracks views when users stay on the page for >3 seconds
 */
export const ShelterDetailWithTracking: React.FC<
  ShelterDetailWithTrackingProps
> = ({ shelterId, shelter, children }) => {
  // Track view with custom options
  const { trackView, hasTracked, isTracking } = useShelterViewTracking(
    shelterId,
    {
      minStayTime: 3000, // 3 seconds minimum stay
      maxViewsPerSession: 5, // Max 5 views per session
      enabled: true, // Enable tracking
      trackOnMount: true, // Track when component mounts
    }
  );

  return (
    <div className="shelter-detail">
      {/* View tracking status (for debugging) */}
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-gray-500 mb-2">
          View tracking:{" "}
          {hasTracked ? "Tracked" : isTracking ? "Tracking..." : "Not tracked"}
        </div>
      )}

      {/* Shelter header */}
      <div className="shelter-header mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{shelter.name}</h1>
        {shelter.profileViews && (
          <p className="text-sm text-gray-600 mt-2">
            {shelter.profileViews} profile views
          </p>
        )}
      </div>

      {/* Shelter description */}
      {shelter.description && (
        <div className="shelter-description mb-6">
          <p className="text-gray-700">{shelter.description}</p>
        </div>
      )}

      {/* Manual tracking button (for testing) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Debug Controls:</h3>
          <button
            onClick={trackView}
            disabled={hasTracked}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            {hasTracked ? "Already Tracked" : "Manually Track View"}
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="shelter-content">{children}</div>
    </div>
  );
};

export default ShelterDetailWithTracking;
