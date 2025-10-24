import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  useParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { adoptionApi, API_BASE_URL } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Home, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { StatusBadge } from "@/components/adoption/shared/StatusBadge";
import { ContractActions } from "@/components/adoption/shared/ContractActions";
import { Timeline } from "@/components/adoption/shared/Timeline";
import { AdoptionProgressStepper } from "@/components/adoption/shared/AdoptionProgressStepper";
import ContractSigning from "@/components/adoption/shared/ContractSigning";
import { formatDate, formatRelativeTime } from "@/utils/dateUtils";
import { getContractUrl } from "@/utils/contractUtils";

// Helper function to validate ObjectId format
const isObjectId = (v: string) => /^[0-9a-fA-F]{24}$/.test(v);

const UserAdoptionRequestDetailPage: React.FC = () => {
  const { requestId: requestIdParam } = useParams<{ requestId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  // Allow state passing if you have navigate(path, { state: { requestId } })
  const requestIdFromState = (
    location.state as { requestId?: string } | undefined
  )?.requestId;

  const requestId = requestIdParam || requestIdFromState || "";

  console.log(
    "🔍 UserAdoptionRequestDetailPage requestId:",
    requestId,
    typeof requestId,
    "isValid:",
    isObjectId(requestId)
  );

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasFetchedRef = useRef<boolean>(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    // Guard early: if invalid, report and return to list
    if (!requestId || !isObjectId(requestId)) {
      console.warn("Invalid requestId:", requestId, typeof requestId);
      toast.error("Invalid path or missing requestId.");
      navigate("/adoptions");
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

  // Handle deep link tabs
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "timeline" && request && timelineRef.current) {
      // Small delay to ensure the timeline is rendered
      setTimeout(() => {
        timelineRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } else if (tab === "contract" && request?.contractDetails) {
      // Scroll to contract section
      setTimeout(() => {
        const contractSection = document.getElementById("contract-section");
        contractSection?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [searchParams, request]);

  const fetchAdoptionRequest = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      setError(null);
      const response = await adoptionApi.getById(requestId);
      const requestData = response;

      if (abortController.signal.aborted) {
        return;
      }
      setRequest(requestData);
    } catch (err: any) {
      if (abortController.signal.aborted) {
        return;
      }
      console.error("Error fetching adoption request:", err);
      let errorMessage = "Failed to fetch adoption request";

      if (err.response?.status === 404) {
        errorMessage = "Adoption request not found";
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to view this request";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [requestId, toast]);

  const handleRefresh = useCallback(async () => {
    await fetchAdoptionRequest();
  }, [fetchAdoptionRequest]);

  // Contract action handlers
  const handleOpenAsBlob = async () => {
    setIsProcessing(true);
    try {
      // download protected file via API and open blob
      const res = await adoptionApi.getContractFile(requestId, {
        responseType: "blob",
      } as any);
      const blob = new Blob([res.data], {
        type: res.headers?.["content-type"] || "application/pdf",
      });
      const objUrl = URL.createObjectURL(blob);
      window.open(objUrl, "_blank");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenContract = async () => {
    setIsProcessing(true);
    try {
      const url = getContractUrl(request);

      if (!url) {
        // There is no file → if there is content text, take the user to the Contract tab to view & sign
        if (
          request?.contractDetails?.content ||
          request?.contractDetails?.terms
        ) {
          navigate(`/adoptions/${requestId}?tab=contract`, { replace: false });
          // scroll to section
          setTimeout(
            () =>
              document
                .getElementById("contract-section")
                ?.scrollIntoView({ behavior: "smooth" }),
            50
          );
          return;
        }
        toast.info("Contract is being prepared by the shelter.");
        return;
      }

      // Public URL/absolute → open directly
      if (/^https?:\/\//i.test(url)) {
        window.open(url, "_blank");
        return;
      }

      // Relative URL (starts with /) → prefix with backend URL
      if (url.startsWith("/")) {
        const backendUrl = API_BASE_URL;
        window.open(`${backendUrl}${url}`, "_blank");
        return;
      }

      // URL internal → fallback blob
      await handleOpenAsBlob();
    } catch (e: any) {
      // If 404/403 falls, go to the Contract tab for the user to read the text content
      const status = e?.response?.status;
      if (status === 404 || status === 403) {
        navigate(`/adoptions/${requestId}?tab=contract`);
        toast.info("Contract file not available yet. Showing details instead.");
        return;
      }
      toast.error("Cannot open contract. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReviewContract = () => {
    // Go straight to the Contract tab to review the content + CTA to sign
    navigate(`/adoptions/${requestId}?tab=contract`, { replace: false });
    setTimeout(
      () =>
        document
          .getElementById("contract-section")
          ?.scrollIntoView({ behavior: "smooth" }),
      50
    );
  };

  const handleViewSigned = async () => {
    // signed is the same as open (signed file)
    await handleOpenContract();
  };

  const handleDownloadPDF = async () => {
    setIsProcessing(true);
    try {
      const url = getContractUrl(request);
      if (url && /^https?:\/\//i.test(url)) {
        const a = document.createElement("a");
        a.href = url;
        a.download =
          request?.contractDetails?.file?.originalName || "contract.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      // Relative URL (starts with /) → prefix with backend URL
      if (url && url.startsWith("/")) {
        const backendUrl = API_BASE_URL;
        const a = document.createElement("a");
        a.href = `${backendUrl}${url}`;
        a.download =
          request?.contractDetails?.file?.originalName || "contract.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      // if internal → load blob
      const res = await adoptionApi.getContractFile(requestId, {
        responseType: "blob",
      } as any);
      const blob = new Blob([res.data], {
        type: res.headers?.["content-type"] || "application/pdf",
      });
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download =
        request?.contractDetails?.file?.originalName || "contract.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Contract signing handler - available for future use or if ContractActions supports onSign prop
  // Currently unused but kept for potential future implementation
  const handleSignContract = async () => {
    setIsProcessing(true);
    try {
      await adoptionApi.signContract(requestId, {}); // server will attach signedAt/status=signed
      toast.success("You have successfully signed the contract.");
      await fetchAdoptionRequest(); // refresh UI
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          "Failed to sign contract. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto mb-4" />
            <p className="text-gray-600">Loading adoption request...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{error}</p>
          </div>
          <div className="space-x-4">
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => navigate("/adoptions")}>
              Back to Adoptions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Adoption Request Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The adoption request you're looking for doesn't exist or has been
            removed.
          </p>
          <Button onClick={() => navigate("/adoptions")}>
            Back to Adoptions
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
              onClick={() => navigate("/dashboard")}
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
              onClick={() => navigate("/adoptions")}
              className="hover:text-gray-700 transition-colors"
            >
              Adoptions
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

      {/* User Adoption Request Detail Content */}
      <main className="bg-white rounded-lg shadow-sm border p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Progress Tracker
            </h1>
            <p className="text-gray-600 mt-1">
              {request?.pet?.name
                ? `Tracking adoption progress for ${request.pet.name}`
                : "Track your adoption request progress"}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-500">
                Request #{request?.id?.slice(-8) || request?._id?.slice(-8)}
              </span>
              <StatusBadge status={request?.status || "unknown"} />
            </div>
          </div>
          <Button
            onClick={() => navigate("/adoptions")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Adoptions
          </Button>
        </header>

        {/* Adoption Progress Stepper */}
        <AdoptionProgressStepper
          currentStatus={request?.status || "submitted"}
          contractDetails={request?.contractDetails}
          className="mb-6"
        />

        {/* Quick Status Overview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                Current Status:{" "}
                {request?.status?.charAt(0).toUpperCase() +
                  request?.status?.slice(1) || "Unknown"}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Last updated {formatRelativeTime(request?.updatedAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">
                Submitted {formatDate(request?.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Contract Information */}
        {request?.contractDetails && (
          <section id="contract-section" aria-labelledby="contract-heading">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2
                  id="contract-heading"
                  className="text-lg font-semibold text-gray-900"
                >
                  Contract Information
                </h2>
                <StatusBadge
                  status={
                    request.contractDetails.status === "signed"
                      ? "success"
                      : request.contractDetails.status === "sent"
                      ? "warning"
                      : "secondary"
                  }
                />
              </div>

              {/* Status-specific messaging */}
              <div className="mb-4">
                {request.contractDetails.status === "sent" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Action Required
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Please review and sign the contract below to proceed
                          with your adoption.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {request.contractDetails.status === "signed" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-green-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Contract Signed ✓
                        </h3>
                        <p className="text-sm text-green-700 mt-1">
                          The shelter will contact you for next steps.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!["sent", "signed"].includes(
                  request.contractDetails.status
                ) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-blue-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Contract Status:{" "}
                          {request.contractDetails.status
                            ?.charAt(0)
                            .toUpperCase() +
                            request.contractDetails.status?.slice(1)}
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">
                          {request.contractDetails.status === "drafted"
                            ? "Contract is being prepared by the shelter."
                            : "Contract details will be available soon."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Main Contract Action Button */}
              <div className="flex justify-center mb-6">
                <Button
                  variant={
                    request.contractDetails.status === "signed"
                      ? "outline"
                      : "primary"
                  }
                  size="lg"
                  disabled={isProcessing}
                  onClick={() => {
                    if (request.contractDetails.status === "signed") {
                      handleViewSigned();
                    } else if (request.contractDetails.status === "sent") {
                      handleOpenContract();
                    } else {
                      handleReviewContract();
                    }
                  }}
                  className={`px-8 ${
                    request.contractDetails.status === "signed"
                      ? "text-green-600 border-green-300 bg-green-50 hover:bg-green-100"
                      : "text-white bg-blue-600 hover:bg-blue-700"
                  } ${isProcessing ? "opacity-75 cursor-not-allowed" : ""}`}
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      {request.contractDetails.status === "signed"
                        ? "View Signed Contract"
                        : request.contractDetails.status === "sent"
                        ? "View Contract PDF"
                        : "Review Contract"}
                    </>
                  )}
                </Button>
              </div>

              {/* Contract Signing Interface */}
              {request.contractDetails.status === "sent" && (
                <div className="mb-6">
                  <ContractSigning
                    adoptionRequestId={requestId}
                    contractDetails={request.contractDetails}
                    onContractSigned={(contractData) => {
                      // Update the local request state
                      setRequest((prev: any) => ({
                        ...prev,
                        contractDetails: contractData.contractDetails,
                      }));
                      // Refresh the full request data
                      fetchAdoptionRequest();
                    }}
                    disabled={isProcessing}
                  />
                </div>
              )}

              {/* Contract Details */}
              <ContractActions
                contractDetails={request.contractDetails}
                onReviewContract={handleReviewContract}
                onOpenContract={handleOpenContract}
                onDownloadPDF={handleDownloadPDF}
                onViewSigned={handleViewSigned}
              />
            </div>
          </section>
        )}

        {/* Enhanced Timeline */}
        <section
          ref={timelineRef}
          aria-labelledby="timeline-heading"
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              id="timeline-heading"
              className="text-lg font-semibold text-gray-900"
            >
              Progress Timeline
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Implement refresh timeline functionality
                handleRefresh();
              }}
            >
              Refresh
            </Button>
          </div>
          {request?.timeline && request.timeline.length > 0 ? (
            <Timeline events={request.timeline} />
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500 mb-2">No timeline events yet</p>
              <p className="text-sm text-gray-400">
                Updates will appear here as your adoption request progresses
              </p>
            </div>
          )}
        </section>

        {/* Document Uploads */}
        <section aria-labelledby="documents-heading" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="documents-heading"
              className="text-lg font-semibold text-gray-900"
            >
              Required Documents
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Implement document upload functionality
                toast.info("Document upload functionality coming soon");
              }}
            >
              Upload Document
            </Button>
          </div>
          {request?.documents && request.documents.length > 0 ? (
            <div className="space-y-3">
              {request.documents.map((doc: any) => (
                <div
                  key={doc._id || doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-blue-600 text-sm font-medium">
                        {doc.type?.charAt(0).toUpperCase() || "D"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-500">
                        Uploaded {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={
                        doc.status === "approved"
                          ? "success"
                          : doc.status === "rejected"
                          ? "danger"
                          : "warning"
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.url, "_blank")}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500 mb-2">No documents uploaded yet</p>
              <p className="text-sm text-gray-400">
                Upload required documents to speed up your adoption process
              </p>
            </div>
          )}
        </section>

        {/* Notes & Communication */}
        <section aria-labelledby="communication-heading" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="communication-heading"
              className="text-lg font-semibold text-gray-900"
            >
              Notes & Communication
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Implement contact shelter functionality
                toast.info("Contact shelter functionality coming soon");
              }}
            >
              Contact Shelter
            </Button>
          </div>

          {/* Communication History */}
          <div className="space-y-4 mb-4">
            {request?.meetings && request.meetings.length > 0 ? (
              request.meetings.map((meeting: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start p-4 bg-gray-50 rounded-lg"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-green-600 text-sm font-medium">
                      {meeting.type?.charAt(0).toUpperCase() || "M"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">
                        {meeting.type
                          ?.replace("_", " ")
                          .replace(/\b\w/g, (l: string) => l.toUpperCase()) ||
                          "Meeting"}
                      </p>
                      <StatusBadge
                        status={
                          meeting.status === "completed"
                            ? "success"
                            : meeting.status === "cancelled"
                            ? "danger"
                            : "warning"
                        }
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Scheduled: {formatDate(meeting.scheduledDate)}
                    </p>
                    {meeting.notes && (
                      <p className="text-sm text-gray-500">{meeting.notes}</p>
                    )}
                    {meeting.location && (
                      <p className="text-sm text-gray-500">
                        Location: {meeting.location}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500 mb-2">
                  No communication history yet
                </p>
                <p className="text-sm text-gray-400">
                  The shelter will contact you to schedule meetings and
                  interviews
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Need Help or Have Questions?
            </h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
                onClick={() => {
                  // TODO: Implement contact shelter functionality
                  toast.info("Contact shelter functionality coming soon");
                }}
              >
                Contact Shelter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
                onClick={() => {
                  // TODO: Implement FAQ functionality
                  toast.info("FAQ functionality coming soon");
                }}
              >
                View FAQ
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default UserAdoptionRequestDetailPage;
