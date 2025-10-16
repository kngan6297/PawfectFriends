import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { adoptionApi } from "@/services/api";
import { formatDisplayDate } from "@/utils/dateUtils";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MessageSquare,
  Eye,
  RefreshCw,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/Select";
import { RejectionReasonModal } from "@/components/adoption/shelter/RejectionReasonModal";
import { chatService } from "@/services/chat.service";
import { useToastContext } from "@/components/ui/ToastProvider";
import RequestAdditionalInformation from "./RequestAdditionalInformation";
import { RequestCardSkeleton } from "./RequestCardSkeleton";

// Helper function to validate ObjectId format
const isObjectId = (v: string) => /^[0-9a-fA-F]{24}$/.test(v);

// Unified interface that combines both data structures
interface UnifiedAdoptionRequest {
  _id?: string;
  id?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  pet?: {
    _id: string;
    name: string;
    photos: string[];
    type?: string;
    breed?: string;
    age?: number;
    description?: string;
  };
  status: "pending" | "approved" | "rejected" | "scheduled" | "completed";
  createdAt: string;
  updatedAt?: string;
  reason?: string;
  experience?: string;
  livingSituation?: string;
  applicationDetails?: {
    housingType?: string;
    hasYard?: boolean;
    yardDetails?: {
      isFenced?: boolean;
      size?: string;
    };
    hasOtherPets?: boolean;
    otherPetsDetails?: Array<{
      type: string;
      species: string;
      age: number;
      description: string;
    }>;
    hasChildren?: boolean;
    childrenAges?: number[];
    workSchedule?: string;
    experience?: string;
    reasonForAdopting?: string;
    plannedCareRoutine?: string;
    veterinarianInfo?: {
      name?: string;
      contact?: string;
      clinic?: string;
    };
    references?: Array<{
      name: string;
      relationship: string;
      phone?: string;
      email?: string;
      yearsKnown?: number;
    }>;
  };
  notes?: any[];
  documents?: any[];
  reminderSent?: boolean;
  reminders?: { sentAt: string }[];
  contractDetails?: {
    status?: "pending" | "sent" | "signed" | "completed";
    contractUrl?: string;
    signedAt?: string;
  };
}

interface AdoptionRequestsListProps {
  viewMode: "shelter" | "user" | "admin";
  showStats?: boolean;
  showQuickActions?: boolean;
  showFilters?: boolean;
  layout?: "cards" | "table";
  onRequestAction?: (requestId: string, action: string, data?: any) => void;
  onRefresh?: () => void;
  className?: string;
  // Required props for external data
  requests: UnifiedAdoptionRequest[];
  stats?: any;
  loading?: boolean;
  error?: string | null;
}

const PET_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Cpath d='M100 60c-22.1 0-40 17.9-40 40s17.9 40 40 40 40-17.9 40-40-17.9-40-40-40zm0 60c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20z' fill='%239ca3af'/%3E%3C/svg%3E";

// Centralized status configuration
const STATUSES = {
  all: { label: "All Requests", value: "all", variant: "secondary" as const },
  pending: { label: "Pending", value: "pending", variant: "warning" as const },
  approved: {
    label: "Approved",
    value: "approved",
    variant: "accent-green" as const,
  },
  scheduled: {
    label: "Scheduled",
    value: "scheduled",
    variant: "accent-purple" as const,
  },
  completed: {
    label: "Completed",
    value: "completed",
    variant: "accent-blue" as const,
  },
  rejected: {
    label: "Rejected",
    value: "rejected",
    variant: "danger" as const,
  },
} as const;

type StatusKey = keyof typeof STATUSES;

const AdoptionRequestsList: React.FC<AdoptionRequestsListProps> = ({
  viewMode,
  showStats = true,
  showQuickActions = true,
  showFilters = true,
  layout = "cards",
  onRequestAction,
  onRefresh,
  className = "",
  // New props
  requests: externalRequests,
  stats: externalStats,
  loading: externalLoading,
  error: externalError,
}) => {
  // Debug: Log the requests data structure
  console.log("🔍 AdoptionRequestsList externalRequests:", externalRequests);
  if (externalRequests && externalRequests.length > 0) {
    console.log("🔍 First request structure:", externalRequests[0]);
    console.log("🔍 First request _id:", externalRequests[0]._id);
    console.log("🔍 First request id:", externalRequests[0].id);
  }
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(
    new Set()
  );
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedRequestForRejection, setSelectedRequestForRejection] =
    useState<UnifiedAdoptionRequest | null>(null);
  const { showToast } = useToastContext();

  // Use external data - no internal fetching
  const requests = externalRequests || [];
  const loading = externalLoading || false;
  const error = externalError || null;
  const stats = externalStats || null;

  const handleRequestAction = async (
    requestId: string,
    action: "approved" | "rejected",
    rejectionReason?: string,
    rejectionDetails?: string
  ) => {
    try {
      if (action === "approved") {
        await adoptionApi.approveAdoptionRequest(requestId, {});
        showToast({
          type: "success",
          title: "Success",
          description: "Adoption request approved successfully",
        });
      } else {
        await adoptionApi.updateStatus(requestId, "rejected", rejectionReason);
        showToast({
          type: "success",
          title: "Success",
          description: "Adoption request rejected",
        });
      }

      if (onRequestAction) {
        onRequestAction(requestId, action, {
          rejectionReason,
          rejectionDetails,
        });
      }

      // Refresh data through parent callback
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Error",
        description: err.response?.data?.message || "Failed to update request",
      });
    }
  };

  const handleApprovalWithMeeting = async (request: UnifiedAdoptionRequest) => {
    try {
      // First approve the request
      await adoptionApi.approveAdoptionRequest(request._id, {});

      // Then schedule a default interview meeting
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const meetingData = {
        type: "in_person",
        scheduledDate: futureDate,
        location: "Shelter Office",
        notes: `Initial meeting for ${request.pet?.name || "pet"} adoption`,
        duration: 60,
        participants: [request.user?._id].filter(Boolean),
      };

      await adoptionApi.scheduleMeeting(request._id, meetingData);

      // Status remains "approved" - scheduling meeting doesn't change adoption status
      // The backend will handle status changes through the proper workflow

      showToast({
        type: "success",
        title: "Request Approved & Meeting Scheduled",
        description:
          "The adoption request has been approved and an interview has been scheduled for next week.",
      });

      // Refresh data
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      console.error("Error approving with meeting:", err);
      showToast({
        type: "error",
        title: "Error",
        description:
          err.response?.data?.message ||
          "Failed to approve request or schedule meeting",
      });
    }
  };

  const toggleRequestDetails = (requestId: string) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  const handleRejectRequest = (request: UnifiedAdoptionRequest) => {
    setSelectedRequestForRejection(request);
    setShowRejectionModal(true);
  };

  const handleRejectionConfirm = async (
    rejectionReason: string,
    rejectionDetails: string
  ) => {
    if (selectedRequestForRejection) {
      await handleRequestAction(
        selectedRequestForRejection._id,
        "rejected",
        rejectionReason,
        rejectionDetails
      );
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      // Only filter out requests with completely missing user data
      if (!request.user || (!request.user.name && !request.user.email)) {
        console.warn(
          `Adoption request ${request._id} has missing user data and will be filtered out`
        );
        return false;
      }

      // Don't filter out requests with missing pet data - show them with placeholder
      // This ensures consistency between stats and displayed requests

      if (statusFilter === STATUSES.all.value) return true;
      return request.status === statusFilter;
    });
  }, [requests, statusFilter]);

  const getStatusVariant = (status: string) => {
    const statusConfig = STATUSES[status as StatusKey];
    return statusConfig?.variant || STATUSES.pending.variant;
  };

  const formatDate = (dateString: string) => {
    return formatDisplayDate(dateString);
  };

  // Quick Actions Component
  const QuickActions = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => setStatusFilter(STATUSES.pending.value)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  {STATUSES.pending.label} Review
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {
                    requests.filter((r) => r.status === STATUSES.pending.value)
                      .length
                  }
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      <Card
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => setStatusFilter(STATUSES.approved.value)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  {STATUSES.approved.label}
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {
                    requests.filter((r) => r.status === STATUSES.approved.value)
                      .length
                  }
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      <Card
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate("/shelter/scheduling")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  {STATUSES.scheduled.label}
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {
                    requests.filter(
                      (r) => r.status === STATUSES.scheduled.value
                    ).length
                  }
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Status Summary Component
  const StatusSummary = () => {
    if (!showStats || !stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Total Requests
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.adoptionStats?.total || requests.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Success Rate
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.adoptionStats?.successRate || "0%"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Avg Processing
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.adoptionStats?.avgProcessingTime || 0} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-lg font-bold text-gray-900">
                  {
                    requests.filter((r) => {
                      const requestDate = new Date(r.createdAt);
                      const now = new Date();
                      return (
                        requestDate.getMonth() === now.getMonth() &&
                        requestDate.getFullYear() === now.getFullYear()
                      );
                    }).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Cards Layout
  const renderCardsLayout = () => (
    <div className="space-y-4">
      {filteredRequests.map((request, index) => (
        <Card
          key={request._id}
          className={`hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer ${
            index % 2 === 0 ? "bg-white" : "bg-gray-50"
          }`}
          onClick={(e) => {
            // Don't trigger if clicking on buttons or interactive elements
            if (
              (e.target as HTMLElement).closest("button") ||
              (e.target as HTMLElement).closest("a") ||
              (e.target as HTMLElement).closest("[role='button']")
            ) {
              return;
            }

            // Navigate to detail page
            const id = request._id || request.id;
            if (id) {
              if (viewMode === "shelter" || viewMode === "admin") {
                navigate(`/shelter/adoption-requests/${id}`);
              } else {
                navigate(`/adoptions/${id}`);
              }
            }
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                {/* Pet Photo */}
                <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                  {request.pet?.photos?.[0] ? (
                    <img
                      src={request.pet.photos[0]}
                      alt={request.pet?.name || "Pet"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (
                          e.target as HTMLImageElement
                        ).nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <span className="text-lg font-medium text-gray-600 hidden">
                    {request.pet?.name?.[0] || "?"}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {request.pet?.name || "Pet information not available"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {request.pet?.breed && request.pet?.type
                      ? `${request.pet.breed} • ${request.pet.type}`
                      : request.pet?.breed ||
                        request.pet?.type ||
                        "Pet details"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Applied {formatDate(request.createdAt)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Click to view full details →
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex flex-col items-end space-y-1">
                  <Badge
                    variant={
                      request.status === "pending"
                        ? "warning"
                        : request.status === "approved"
                        ? "accent-green"
                        : request.status === "rejected"
                        ? "danger"
                        : "accent-blue"
                    }
                  >
                    {request.status === "approved"
                      ? "Approved ✓"
                      : request.status === "pending"
                      ? "Pending"
                      : request.status === "rejected"
                      ? "Rejected"
                      : request.status === "scheduled"
                      ? "Scheduled"
                      : request.status === "completed"
                      ? "Completed"
                      : request.status}
                  </Badge>

                  {/* Contract Ready Indicator */}
                  {viewMode === "user" &&
                    request.status === "approved" &&
                    request.contractDetails?.status === "sent" && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                      >
                        📄 Contract Ready
                      </Badge>
                    )}

                  {viewMode === "user" &&
                    request.status === "approved" &&
                    request.contractDetails?.status === "signed" && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-50 text-green-700 border-green-200"
                      >
                        ✅ Contract Signed
                      </Badge>
                    )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleRequestDetails(request._id)}
                  aria-expanded={expandedRequests.has(request._id)}
                  aria-controls={`request-details-${request._id}`}
                  aria-label={`${
                    expandedRequests.has(request._id) ? "Collapse" : "Expand"
                  } details for ${request.pet?.name || "adoption request"}`}
                >
                  {expandedRequests.has(request._id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="mb-4 flex flex-wrap gap-2">
              {viewMode === "user" && (
                <>
                  {request.status === "approved" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        // Navigate to contract signing or open contract modal
                        const id = request._id || request.id;
                        if (id) {
                          navigate(`/adoptions/${id}?tab=contract`);
                        }
                      }}
                    >
                      {request.contractDetails?.status === "sent"
                        ? "Sign Contract"
                        : request.contractDetails?.status === "signed"
                        ? "View Contract"
                        : "Review Contract"}
                    </Button>
                  )}

                  {request.status === "scheduled" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to scheduling details
                        const id = request._id || request.id;
                        if (id) {
                          navigate(`/adoptions/${id}?tab=schedule`);
                        }
                      }}
                    >
                      View Schedule
                    </Button>
                  )}

                  {request.status === "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Download contract or view completion details
                        const id = request._id || request.id;
                        if (id) {
                          navigate(`/adoptions/${id}?tab=contract`);
                        }
                      }}
                    >
                      Download Contract
                    </Button>
                  )}

                  {request.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // View application details
                        const id = request._id || request.id;
                        if (id) {
                          navigate(`/adoptions/${id}`);
                        }
                      }}
                    >
                      View Application
                    </Button>
                  )}

                  {request.status === "rejected" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // View rejection details
                        const id = request._id || request.id;
                        if (id) {
                          navigate(`/adoptions/${id}?tab=decision`);
                        }
                      }}
                    >
                      View Decision
                    </Button>
                  )}
                </>
              )}

              {(viewMode === "shelter" || viewMode === "admin") && (
                <>
                  {request.status === "pending" && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          if (onRequestAction) {
                            onRequestAction(
                              request._id || request.id || "",
                              "approved"
                            );
                          }
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequestForRejection(request);
                          setShowRejectionModal(true);
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {request.status === "approved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to scheduling or contract management
                        const id = request._id || request.id;
                        if (id) {
                          navigate(
                            `/shelter/adoption-requests/${id}?tab=schedule`
                          );
                        }
                      }}
                    >
                      Schedule Meeting
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // View full details
                      const id = request._id || request.id;
                      if (id) {
                        navigate(`/shelter/adoption-requests/${id}`);
                      }
                    }}
                  >
                    View Details
                  </Button>
                </>
              )}
            </div>

            {expandedRequests.has(request._id) && (
              <div
                id={`request-details-${request._id}`}
                className="mt-4 pt-4 border-t border-gray-200"
                role="region"
                aria-label={`Details for ${
                  request.user?.name || "adoption request"
                }`}
              >
                {/* User Information Section */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Applicant Information
                  </h4>
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {request.user?.name?.[0] || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.user?.name || "Unknown User"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.user?.email || "No email"}
                      </p>
                      {request.user?.phone && (
                        <p className="text-sm text-gray-500">
                          {request.user.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Application Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Housing Type:</span>
                        <span className="font-medium">
                          {request.applicationDetails?.housingType ||
                            "Not specified"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Has Yard:</span>
                        <span className="font-medium">
                          {request.applicationDetails?.hasYard ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Has Other Pets:</span>
                        <span className="font-medium">
                          {request.applicationDetails?.hasOtherPets
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Has Children:</span>
                        <span className="font-medium">
                          {request.applicationDetails?.hasChildren
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Work Schedule:</span>
                        <span className="font-medium">
                          {request.applicationDetails?.workSchedule ||
                            "Not specified"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Experience & Plans
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Experience:</span>
                        <p className="font-medium mt-1">
                          {request.applicationDetails?.experience ||
                            request.experience ||
                            "Not specified"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">
                          Reason for Adopting:
                        </span>
                        <p className="font-medium mt-1">
                          {request.applicationDetails?.reasonForAdopting ||
                            request.reason ||
                            "Not specified"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">
                          Planned Care Routine:
                        </span>
                        <p className="font-medium mt-1">
                          {request.applicationDetails?.plannedCareRoutine ||
                            "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {request.status === "pending" &&
                    (viewMode === "shelter" || viewMode === "admin") && (
                      <>
                        <Button
                          variant="accent-green"
                          size="sm"
                          leftIcon={CheckCircle}
                          onClick={() =>
                            handleRequestAction(request._id, "approved")
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={Calendar}
                          onClick={() => handleApprovalWithMeeting(request)}
                        >
                          Approve & Schedule
                        </Button>
                        <Button
                          variant="accent-pink"
                          size="sm"
                          leftIcon={XCircle}
                          onClick={() => handleRejectRequest(request)}
                        >
                          Reject
                        </Button>
                        <RequestAdditionalInformation
                          requestId={request._id}
                          onRequestCreated={() => {
                            if (onRefresh) onRefresh();
                          }}
                        />
                      </>
                    )}
                  {request.status === "approved" &&
                    (viewMode === "shelter" || viewMode === "admin") && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={Calendar}
                        onClick={() => navigate("/shelter/scheduling")}
                      >
                        Schedule Interview
                      </Button>
                    )}
                  {(viewMode === "shelter" || viewMode === "admin") && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={MessageSquare}
                      onClick={async () => {
                        if (!request.user?._id) {
                          showToast({
                            type: "error",
                            title: "User Information Missing",
                            description:
                              "Unable to find user information for this request.",
                          });
                          return;
                        }

                        try {
                          // Create a new conversation with the user
                          const conversation = await chatService.createChat(
                            request.user._id,
                            user?._id || "",
                            `Hi! I'm following up on your adoption request for ${
                              request.pet?.name || "this pet"
                            }.`
                          );

                          // Navigate to the chat with the conversation ID
                          navigate(
                            `/chat/${
                              conversation.id || conversation.participantId
                            }`
                          );
                        } catch (error: any) {
                          console.error("Failed to create chat:", error);

                          // Handle specific error cases
                          if (error.message?.includes("already exists")) {
                            showToast({
                              type: "info",
                              title: "Chat Already Exists",
                              description:
                                "You already have a conversation with this user. Opening existing chat...",
                            });
                            // Navigate to chat page to show existing conversations
                            navigate("/chat");
                          } else {
                            showToast({
                              type: "error",
                              title: "Failed to Create Chat",
                              description:
                                "Unable to start a conversation. Please try again.",
                            });
                            // Fallback to regular chat page if creation fails
                            navigate("/chat");
                          }
                        }
                      }}
                    >
                      Message User
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={Eye}
                    onClick={() => {
                      // Safely extract ID from request object
                      const req = request; // object
                      const id =
                        typeof req === "string" ? req : req?._id || req?.id;

                      console.log("🔍 Navigation debug:", {
                        request: req,
                        _id: req?._id,
                        id: req?.id,
                        extractedId: id,
                        type: typeof id,
                        requestKeys: Object.keys(req),
                      });

                      if (!id || typeof id !== "string" || !isObjectId(id)) {
                        console.error(
                          "❌ Bad id source:",
                          req,
                          "extracted id:",
                          id
                        );
                        return;
                      }

                      if (viewMode === "shelter" || viewMode === "admin") {
                        navigate(`/shelter/adoption-requests/${id}`);
                      } else {
                        navigate(`/adoptions/${id}`);
                      }
                    }}
                  >
                    View Full Details
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Table Layout
  const renderTableLayout = () => (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
            >
              Pet
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Requested On
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              Last Updated
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">View</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {filteredRequests.map((request) => (
            <tr key={request._id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={request.pet?.photos?.[0] || PET_PLACEHOLDER}
                      alt={request.pet?.name || "Pet"}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target && target.src !== PET_PLACEHOLDER) {
                          target.src = PET_PLACEHOLDER;
                        }
                      }}
                    />
                  </div>
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">
                      {request.pet?.name || "Unknown Pet"}
                    </div>
                    <div className="text-gray-500">
                      {request.pet?.breed && request.pet?.type
                        ? `${request.pet.breed} • ${request.pet.type}`
                        : request.pet?.breed ||
                          request.pet?.type ||
                          "Unknown breed"}
                    </div>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <Badge variant={getStatusVariant(request.status)}>
                  {request.status === "approved"
                    ? "Approved ✓"
                    : request.status === "pending"
                    ? "Pending"
                    : request.status === "rejected"
                    ? "Rejected"
                    : request.status === "scheduled"
                    ? "Scheduled"
                    : request.status === "completed"
                    ? "Completed"
                    : request.status.charAt(0).toUpperCase() +
                      request.status.slice(1)}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {formatDate(request.createdAt)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {request.updatedAt
                  ? formatDate(request.updatedAt)
                  : formatDate(request.createdAt)}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                {(() => {
                  const req = request;
                  const id =
                    typeof req === "string" ? req : req?._id || req?.id;

                  if (!id || typeof id !== "string" || !isObjectId(id)) {
                    return <span className="text-gray-400">No ID</span>;
                  }

                  return (
                    <Link
                      to={
                        viewMode === "shelter" || viewMode === "admin"
                          ? `/shelter/adoption-requests/${id}`
                          : `/adoptions/${id}`
                      }
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </Link>
                  );
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className={className}>
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
            {(viewMode === "shelter" || viewMode === "admin") && (
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            )}
          </div>
        </div>

        {/* Stats Skeleton */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 w-16 bg-gray-200 rounded mb-1"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filter Bar Skeleton */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg border mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-[180px] bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* Skeleton Cards */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className={`rounded-lg ${
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              }`}
            >
              <RequestCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Don't return early for error - show inline error instead

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Adoption Requests
          </h1>
          <p className="text-gray-600">
            {viewMode === "shelter" || viewMode === "admin"
              ? "Manage and review adoption applications"
              : "Track your adoption requests and their status"}
          </p>
        </div>
        <div className="flex space-x-4 mt-4 md:mt-0">
          {(viewMode === "shelter" || viewMode === "admin") && (
            <Button
              variant="primary"
              leftIcon={PlusCircle}
              onClick={() => navigate("/shelter/pets")}
            >
              Add Pet
            </Button>
          )}
        </div>
      </div>

      {/* Inline Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-red-800">
                Error Loading Adoption Requests
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onRefresh) onRefresh();
                  }}
                  className="text-red-700 border-red-300 hover:bg-red-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {showQuickActions && (viewMode === "shelter" || viewMode === "admin") && (
        <QuickActions />
      )}

      {/* Status Summary */}
      {showStats && (viewMode === "shelter" || viewMode === "admin") && (
        <StatusSummary />
      )}

      {/* Filter Bar - Sticky */}
      {showFilters && (
        <div className="sticky top-0 z-10 bg-white p-4 rounded-lg border mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">
                  Filter by Status:
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(STATUSES).map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Filter Chips */}
              <div className="flex flex-wrap gap-2">
                {/* All Requests Chip */}
                <button
                  onClick={() => setStatusFilter(STATUSES.all.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                    statusFilter === STATUSES.all.value
                      ? "bg-gray-100 text-gray-800 border-gray-300"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  All Requests
                </button>

                {Object.entries(STATUSES)
                  .filter(([key]) => key !== "all") // Exclude 'all' from quick chips
                  .map(([key, status]) => (
                    <button
                      key={status.value}
                      onClick={() => setStatusFilter(status.value)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                        statusFilter === status.value
                          ? status.value === "pending"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                            : status.value === "approved"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : status.value === "scheduled"
                            ? "bg-purple-100 text-purple-800 border-purple-300"
                            : status.value === "completed"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : status.value === "rejected"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : "bg-gray-100 text-gray-800 border-gray-300"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={RefreshCw}
                onClick={() => {
                  if (onRefresh) onRefresh();
                }}
                disabled={loading}
                className="text-gray-600 hover:text-gray-900"
              >
                Refresh
              </Button>
              <Badge variant="secondary">
                {filteredRequests.length} requests
              </Badge>
              {statusFilter !== STATUSES.all.value && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter(STATUSES.all.value)}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No adoption requests found
            </h3>
            <p className="text-gray-600 mb-6">
              {statusFilter === STATUSES.all.value
                ? viewMode === "shelter" || viewMode === "admin"
                  ? "There are no adoption requests at this time."
                  : "You haven't made any adoption requests yet."
                : `No ${
                    STATUSES[statusFilter as StatusKey]?.label || statusFilter
                  } adoption requests found.`}
            </p>
            {viewMode === "shelter" || viewMode === "admin" ? (
              <Button
                variant="primary"
                onClick={() => navigate("/shelter/pets")}
              >
                Add Pets to Get Started
              </Button>
            ) : (
              <Link
                to="/pets"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Available Pets
              </Link>
            )}
          </CardContent>
        </Card>
      ) : layout === "cards" ? (
        renderCardsLayout()
      ) : (
        renderTableLayout()
      )}

      {/* Rejection Modal */}
      <RejectionReasonModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onConfirm={handleRejectionConfirm}
        requestId={selectedRequestForRejection?._id || ""}
        petName={selectedRequestForRejection?.pet?.name || ""}
        userName={selectedRequestForRejection?.user?.name || ""}
      />
    </div>
  );
};

export default AdoptionRequestsList;
