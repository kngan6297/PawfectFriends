import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { adoptionApi } from "@/services/api";
import AdoptionRequestDetail from "@/components/adoption/shelter/AdoptionRequestDetailPage";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Home, ChevronRight } from "lucide-react";
import { useToastContext } from "@/components/ui/ToastProvider";
import { toast } from "react-toastify";

// Helper function to validate ObjectId format
const isObjectId = (v: string) => /^[0-9a-fA-F]{24}$/.test(v);

const AdoptionRequestDetailPage: React.FC = () => {
  const { requestId: requestIdParam } = useParams<{ requestId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  // Allow state passing if you have navigate(path, { state: { requestId } })
  const requestIdFromState = (
    location.state as { requestId?: string } | undefined
  )?.requestId;

  const requestId = requestIdParam || requestIdFromState || "";

  // Debug: Log the requestId to see what we're getting
  console.log(
    "🔍 AdoptionRequestDetailPage requestId:",
    requestId,
    typeof requestId,
    "isValid:",
    isObjectId(requestId)
  );
  const { showToast } = useToastContext();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasFetchedRef = useRef<boolean>(false);

  // Wait for auth to finish loading before checking permissions
  useEffect(() => {
    if (authLoading) {
      return; // Still loading auth state
    }

    if (!user || user.role !== "shelter") {
      navigate("/unauthorized");
      return;
    }

    // Guard early: if invalid, report and return to list
    if (!requestId || !isObjectId(requestId)) {
      console.warn("Invalid requestId:", requestId, typeof requestId);
      toast.error("Invalid path or missing requestId.");
      navigate("/shelter/adoption-requests"); // navigate to list page
      return;
    }

    // Prevent double API calls in React StrictMode (dev)
    if (hasFetchedRef.current) {
      console.log("🔍 Skipping duplicate fetch due to StrictMode");
      return;
    }
    hasFetchedRef.current = true;

    fetchAdoptionRequest();

    // Cleanup function to reset fetch flag when requestId changes
    return () => {
      hasFetchedRef.current = false;
    };
  }, [requestId, user, authLoading, navigate]);

  const fetchAdoptionRequest = useCallback(async () => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      setError(null);

      // Fetch the adoption request details with proper response handling
      const response = await adoptionApi.getById(requestId);
      const requestData = response;

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      setRequest(requestData);
    } catch (err: any) {
      // Don't update state if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      console.error("Error fetching adoption request:", err);

      // Handle different error types with specific messages
      let errorMessage = "Failed to fetch adoption request";
      let errorTitle = "Error";

      if (err.response?.status === 404) {
        errorMessage = "Adoption request not found";
        errorTitle = "Not Found";
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to view this request";
        errorTitle = "Access Denied";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later";
        errorTitle = "Server Error";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      // Only update loading state if request wasn't aborted
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [requestId, showToast]);

  const handleStatusUpdate = useCallback(() => {
    // Set refreshing state and refresh the request data
    setRefreshing(true);
    fetchAdoptionRequest().finally(() => {
      setRefreshing(false);
    });
  }, [fetchAdoptionRequest]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (authLoading || loading) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb skeleton */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Error Loading Request
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate("/shelter/adoption-requests")}
            >
              Back to Requests
            </Button>
            <Button variant="primary" onClick={fetchAdoptionRequest}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Request Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The adoption request you're looking for doesn't exist or you don't
            have permission to view it.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate("/shelter/adoption-requests")}
          >
            Back to Requests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb navigation */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <button
              onClick={() => navigate("/shelter/dashboard")}
              className="flex items-center hover:text-gray-700 transition-colors"
            >
              <Home className="h-4 w-4 mr-1" />
              Dashboard
            </button>
          </li>
          <li>
            <ChevronRight className="h-4 w-4" />
          </li>
          <li>
            <button
              onClick={() => navigate("/shelter/adoption-requests")}
              className="hover:text-gray-700 transition-colors"
            >
              Adoption Requests
            </button>
          </li>
          <li>
            <ChevronRight className="h-4 w-4" />
          </li>
          <li className="text-gray-900 font-medium">
            Request #
            {request?.id?.slice(-8) ||
              request?._id?.slice(-8) ||
              requestId?.slice(-8)}
          </li>
        </ol>
      </nav>

      {/* Adoption Request Detail Component */}
      <AdoptionRequestDetail
        request={request}
        onStatusUpdate={handleStatusUpdate}
        isRefreshing={refreshing}
      />
    </div>
  );
};

export default AdoptionRequestDetailPage;
