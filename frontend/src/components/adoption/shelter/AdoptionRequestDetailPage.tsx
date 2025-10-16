import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MessageSquare,
  User,
  PawPrint,
  Home,
  FileText,
  ChevronLeft,
  Plus,
  StickyNote,
  Upload,
  CheckSquare,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { useToastContext } from "@/components/ui/ToastProvider";
import { adoptionApi } from "@/services/api";
import { chatService } from "@/services/chat.service";
import { useAuth } from "@/context/AuthContext";
import RequestAdditionalInformation from "../shared/RequestAdditionalInformation";
import InformationRequestsList from "../shared/InformationRequestsList";
import ContractGenerator from "../shared/ContractGenerator";
import PostApprovalScheduling from "../user/PostApprovalScheduling";
import ContractSigning from "../shared/ContractSigning";
import CompleteHandover from "../shared/CompleteHandover";
import CompleteAdoption from "../shared/CompleteAdoption";
import { AdoptionRequest, HandoverDetails } from "@/types/adoption";
import { ContractDetails } from "@/types/contract";
import { formatDisplayDate } from "@/utils/dateUtils";

// Extended interface for the component that includes populated data
interface PopulatedAdoptionRequest
  extends Omit<AdoptionRequest, "user" | "pet" | "contractDetails"> {
  _id: string; // Backend uses _id
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  pet: {
    _id: string;
    name: string;
    photos: any[];
    type: string;
    breed: string;
    age: number | string;
    description: string;
  };
  contractDetails?: ContractDetails;
  handoverDetails?: HandoverDetails;
}

interface AdoptionRequestDetailProps {
  request: PopulatedAdoptionRequest;
  onStatusUpdate?: () => void;
  isRefreshing?: boolean;
}

const AdoptionRequestDetail: React.FC<AdoptionRequestDetailProps> = ({
  request,
  onStatusUpdate,
  isRefreshing = false,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToastContext();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "information" | "notes" | "timeline" | "contract" | "schedule"
  >("overview");
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverData, setHandoverData] = useState({
    method: "in_person",
    location: "",
    notes: "",
    completedBy: "",
  });

  // Local state for request data to handle immediate updates
  const [localRequest, setLocalRequest] = useState(request);

  // Update local request when prop changes
  React.useEffect(() => {
    setLocalRequest(request);
  }, [request]);

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "schedule") {
      setActiveTab("schedule");
    }
  }, [searchParams]);

  // Handle contract signing (if status changes from sent to signed)
  React.useEffect(() => {
    if (
      request.contractDetails?.status === "signed" &&
      localRequest.contractDetails?.status === "sent"
    ) {
      setLocalRequest((prev: any) => ({
        ...prev,
        contractDetails: {
          ...(prev.contractDetails || {}),
          status: "signed",
          signedAt: new Date().toISOString(),
        },
      }));
    }
  }, [request.contractDetails?.status, localRequest.contractDetails?.status]);

  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: { color: "yellow", icon: Clock, label: "Pending Review" },
      approved: { color: "green", icon: CheckCircle, label: "Approved" },
      rejected: { color: "red", icon: XCircle, label: "Rejected" },
      scheduled: { color: "blue", icon: Calendar, label: "Scheduled" },
      completed: { color: "green", icon: CheckCircle, label: "Completed" },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setIsUpdating(true);

      // Call the appropriate API based on status
      if (newStatus === "approved") {
        // Use updateStatus for more flexibility (handles both pending->approved and scheduled->approved)
        await adoptionApi.updateStatus(request._id, "approved");
        showToast({
          type: "success",
          title: "Request Approved",
          description: "The adoption request has been approved successfully.",
        });
      } else if (newStatus === "rejected") {
        await adoptionApi.updateStatus(
          request._id,
          "rejected",
          "Rejected by shelter"
        );
        showToast({
          type: "success",
          title: "Request Rejected",
          description: "The adoption request has been rejected.",
        });
      }

      onStatusUpdate?.();
    } catch (error) {
      console.error("Error updating request status:", error);
      showToast({
        type: "error",
        title: "Update Failed",
        description: "Failed to update request status. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      showToast({
        type: "error",
        title: "Note Required",
        description: "Please enter a note before saving.",
      });
      return;
    }

    try {
      await adoptionApi.addNote(request._id, {
        content: noteContent,
        isInternal: isInternalNote,
      });

      showToast({
        type: "success",
        title: "Note Added",
        description: "Note has been added successfully.",
      });

      setNoteContent("");
      setIsInternalNote(false);
      setShowAddNoteModal(false);
      onStatusUpdate?.();
    } catch (error) {
      console.error("Error adding note:", error);
      showToast({
        type: "error",
        title: "Failed to Add Note",
        description: "Unable to add note. Please try again.",
      });
    }
  };

  const handleCompleteHandover = async () => {
    if (!handoverData.location.trim()) {
      showToast({
        type: "error",
        title: "Missing Information",
        description: "Please provide handover location",
      });
      return;
    }

    try {
      setIsUpdating(true);
      await adoptionApi.completeHandover(request._id, {
        ...handoverData,
        completedBy: user?._id,
      });

      // Update local state immediately
      setLocalRequest((prev: any) => ({
        ...prev,
        handoverDetails: {
          ...handoverData,
          completedAt: new Date().toISOString(),
          completedBy: user?._id,
        },
        status: "completed", // Update main status to completed
      }));

      showToast({
        type: "success",
        title: "Handover Completed",
        description: "Adoption process completed successfully",
      });

      setShowHandoverModal(false);
      setHandoverData({
        method: "in_person",
        location: "",
        notes: "",
        completedBy: "",
      });
      onStatusUpdate?.();
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Handover Failed",
        description:
          error.response?.data?.message || "Failed to complete handover",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const statusInfo = getStatusInfo(request.status);

  const tabContent = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <div className="space-y-6">
          {/* Applicant Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Applicant Information
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{request.user?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{request.user?.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{request.user?.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Applied Date</p>
                  <p className="font-medium">
                    {formatDisplayDate(new Date(request.createdAt))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pet Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <PawPrint className="h-5 w-5" />
                Pet Information
              </h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                {(() => {
                  const petData = request.petDetails || request.pet;
                  return (
                    <img
                      src={
                        (petData?.photos?.[0] as any)?.medium ||
                        (petData?.photos?.[0] as any)?.small ||
                        (petData?.photos?.[0] as any)?.url ||
                        petData?.photos?.[0] ||
                        "/placeholder-pet.jpg"
                      }
                      alt={petData?.name || "Pet"}
                      className="h-20 w-20 rounded-lg object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-pet.jpg";
                      }}
                    />
                  );
                })()}
                <div className="flex-1">
                  {/* Use petDetails (populated from backend) instead of pet */}
                  {(() => {
                    const petData = request.petDetails || request.pet;
                    return (
                      <>
                        <h4 className="text-lg font-semibold">
                          {petData?.name || "Unknown Pet"}
                        </h4>
                        <p className="text-gray-600">
                          {petData?.breed || "Unknown Breed"} •{" "}
                          {petData?.type || "Unknown Type"}
                        </p>
                        {petData?.age && (
                          <p className="text-sm text-gray-500">
                            Age:{" "}
                            {typeof petData.age === "number"
                              ? `${petData.age} year${
                                  petData.age !== 1 ? "s" : ""
                                } old`
                              : petData.age}
                          </p>
                        )}
                        {petData?.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {petData.description}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Home className="h-5 w-5" />
                Application Details
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Living Situation
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
                    {request.applicationDetails?.hasYard &&
                      request.applicationDetails?.yardDetails && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Yard Fenced:</span>
                            <span className="font-medium">
                              {request.applicationDetails.yardDetails.isFenced
                                ? "Yes"
                                : "No"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Yard Size:</span>
                            <span className="font-medium">
                              {request.applicationDetails.yardDetails.size ||
                                "Not specified"}
                            </span>
                          </div>
                        </>
                      )}
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
                        {request.applicationDetails?.hasChildren ? "Yes" : "No"}
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

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Experience & Plans
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Experience:</p>
                      <p className="font-medium">
                        {request.applicationDetails?.experience ||
                          "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Reason for Adopting:</p>
                      <p className="font-medium">
                        {request.applicationDetails?.reasonForAdopting ||
                          "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">
                        Planned Care Routine:
                      </p>
                      <p className="font-medium">
                        {request.applicationDetails?.plannedCareRoutine ||
                          "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Veterinarian Information */}
          {request.applicationDetails?.veterinarianInfo && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Veterinarian Reference
                </h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">
                      {request.applicationDetails.veterinarianInfo.name ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="font-medium">
                      {request.applicationDetails.veterinarianInfo.contact ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Clinic</p>
                    <p className="font-medium">
                      {request.applicationDetails.veterinarianInfo.clinic ||
                        "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* References */}
          {request.applicationDetails?.references &&
            request.applicationDetails.references.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal References
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {request.applicationDetails.references.map(
                      (ref: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Name</p>
                              <p className="font-medium">{ref.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                Relationship
                              </p>
                              <p className="font-medium">{ref.relationship}</p>
                            </div>
                            {ref.phone && (
                              <div>
                                <p className="text-sm text-gray-600">Phone</p>
                                <p className="font-medium">{ref.phone}</p>
                              </div>
                            )}
                            {ref.email && (
                              <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-medium">{ref.email}</p>
                              </div>
                            )}
                            {ref.yearsKnown && (
                              <div>
                                <p className="text-sm text-gray-600">
                                  Years Known
                                </p>
                                <p className="font-medium">
                                  {ref.yearsKnown} years
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      ),
    },
    {
      id: "information",
      label: "Information Requests",
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Additional Information Requests
            </h3>
            <RequestAdditionalInformation
              requestId={request._id}
              onRequestCreated={() => onStatusUpdate?.()}
            />
          </div>
          <InformationRequestsList
            requestId={request._id}
            userRole="shelter_admin"
            onRefresh={() => onStatusUpdate?.()}
          />
        </div>
      ),
    },
    {
      id: "notes",
      label: "Notes",
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notes & Comments</h3>
            <Button
              variant="outline"
              leftIcon={Plus}
              onClick={() => setShowAddNoteModal(true)}
            >
              Add Note
            </Button>
          </div>
          <div className="text-center py-8">
            <StickyNote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No notes available</p>
            <p className="text-sm text-gray-400 mt-2">
              Add notes to track important information about this adoption
              request
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "timeline",
      label: "Timeline",
      content: (
        <div className="space-y-4">
          {request.timeline && request.timeline.length > 0 ? (
            <div className="space-y-4">
              {request.timeline.map((event: any, index: number) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">
                        {event.status.replace("_", " ")}
                      </span>
                      <span className="text-sm text-gray-500">
                        {format(
                          new Date(event.date),
                          "MMM dd, yyyy 'at' h:mm a"
                        )}
                      </span>
                    </div>
                    {event.note && (
                      <p className="text-sm text-gray-600">{event.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No timeline events available</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "contract",
      label: "Contract Management",
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Contract & Handover</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                leftIcon={Upload}
                onClick={() => setShowContractModal(true)}
                disabled={localRequest.contractDetails?.status === "signed"}
              >
                {localRequest.contractDetails
                  ? "Regenerate Contract"
                  : "Generate Contract"}
              </Button>
            </div>
          </div>

          {/* Contract Generation Section */}
          {localRequest.status === "approved" && (
            <ContractGenerator
              adoptionRequestId={localRequest._id || localRequest.id}
              onContractGenerated={(contractData) => {
                setLocalRequest((prev: any) => ({
                  ...prev,
                  contractDetails: contractData.contractDetails,
                }));
                onStatusUpdate?.();
              }}
              existingContract={localRequest.contractDetails}
              disabled={localRequest.contractDetails?.status === "signed"}
              adoptionStatus={localRequest.status}
              canGenerateContract={localRequest.status === "approved"}
            />
          )}

          {/* Contract Signing Section (for user view) */}
          {localRequest.contractDetails?.status === "sent" && (
            <ContractSigning
              adoptionRequestId={localRequest._id}
              contractDetails={localRequest.contractDetails}
              onContractSigned={(contractData) => {
                setLocalRequest((prev: any) => ({
                  ...prev,
                  contractDetails: contractData.contractDetails,
                }));
                onStatusUpdate?.();
              }}
              disabled={isUpdating}
            />
          )}

          {/* Complete Handover Section */}
          {localRequest.contractDetails?.status === "signed" && (
            <CompleteHandover
              adoptionRequestId={localRequest._id}
              onHandoverCompleted={(adoptionData) => {
                setLocalRequest(adoptionData);
                onStatusUpdate?.();
              }}
              disabled={isUpdating}
            />
          )}

          {/* Complete Adoption Section - Show when both contract is signed and handover is completed */}
          {localRequest.contractDetails?.status === "signed" &&
            localRequest.handoverDetails?.completedAt &&
            localRequest.status !== "completed" && (
              <CompleteAdoption
                adoptionRequestId={localRequest._id}
                onAdoptionCompleted={(adoptionData) => {
                  setLocalRequest(adoptionData);
                  onStatusUpdate?.();
                }}
                disabled={isUpdating}
              />
            )}

          {/* Contract Status Display */}
          <Card>
            <CardHeader>
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Contract Status
              </h4>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge
                    variant={
                      localRequest.contractDetails?.status === "signed"
                        ? "success"
                        : localRequest.contractDetails?.status === "sent"
                        ? "default"
                        : localRequest.contractDetails?.status === "drafted"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {localRequest.contractDetails?.status || "Not uploaded"}
                  </Badge>
                </div>

                {localRequest.contractDetails?.title && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Title:</span>
                    <span className="font-medium">
                      {localRequest.contractDetails.title}
                    </span>
                  </div>
                )}

                {localRequest.contractDetails?.uploadedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Uploaded:</span>
                    <span className="text-sm">
                      {format(
                        new Date(localRequest.contractDetails.uploadedAt),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </span>
                  </div>
                )}

                {localRequest.contractDetails?.sentAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sent:</span>
                    <span className="text-sm">
                      {format(
                        new Date(localRequest.contractDetails.sentAt),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </span>
                  </div>
                )}

                {localRequest.contractDetails?.signedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Signed:</span>
                    <span className="text-sm">
                      {format(
                        new Date(localRequest.contractDetails.signedAt),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* View Contract Button */}
              {localRequest.contractDetails && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    leftIcon={FileText}
                    onClick={() => setActiveTab("contract")}
                    className="w-full"
                  >
                    {localRequest.contractDetails.generated
                      ? "View Generated Contract"
                      : "View Contract"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Handover Status Display */}
          {localRequest.handoverDetails && (
            <Card>
              <CardHeader>
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Handover Status
                </h4>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Method:</span>
                    <span className="font-medium">
                      {localRequest.handoverDetails.method}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="font-medium">
                      {localRequest.handoverDetails.location}
                    </span>
                  </div>

                  {localRequest.handoverDetails.completedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completed:</span>
                      <span className="text-sm">
                        {format(
                          new Date(localRequest.handoverDetails.completedAt),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </span>
                    </div>
                  )}

                  {localRequest.handoverDetails.notes && (
                    <div>
                      <span className="text-sm text-gray-600">Notes:</span>
                      <p className="mt-1 text-sm">
                        {localRequest.handoverDetails.notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ),
    },
    {
      id: "schedule",
      label: "Schedule Meeting",
      content: (
        <div className="space-y-6">
          {/* Debug logging */}
          {console.log(
            "🔍 Schedule tab - request status:",
            request.status,
            "isApproved:",
            request.status === "approved" || request.status === "scheduled"
          )}
          <PostApprovalScheduling
            requestId={request._id}
            requestData={{
              user: {
                _id: request.user._id || "",
                name: request.user.name,
                email: request.user.email,
              },
              pet: {
                _id: request.pet._id,
                name: request.pet.name,
              },
            }}
            onMeetingUpdate={() => {
              // Refresh the request data when meetings are updated
              onStatusUpdate?.();
            }}
            isApproved={
              request.status === "approved" || request.status === "scheduled"
            }
            requestStatus={request.status}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => navigate("/shelter/adoption-requests")}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to All Requests
          </Button>

          <div className="flex items-center gap-3">
            <Badge
              variant={statusInfo.color as any}
              className="flex items-center gap-1"
            >
              <statusInfo.icon className="h-3 w-3" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Adoption Request Details
            </h1>
            <p className="text-gray-600">
              Review and manage this adoption application
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {request.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  leftIcon={Plus}
                  onClick={() => setActiveTab("information" as const)}
                >
                  Request Info
                </Button>
                <Button
                  variant="outline"
                  leftIcon={StickyNote}
                  onClick={() => setActiveTab("notes" as const)}
                >
                  Add Note
                </Button>
                <Button
                  variant="outline"
                  leftIcon={MessageSquare}
                  onClick={async () => {
                    // Check for user ID in both possible field names
                    const userId = request.user?._id;

                    if (!userId) {
                      showToast({
                        type: "error",
                        title: "User Information Missing",
                        description:
                          "Unable to find user information for this request.",
                      });
                      return;
                    }

                    if (!user?._id) {
                      showToast({
                        type: "error",
                        title: "Authentication Required",
                        description: "Please log in to send messages.",
                      });
                      return;
                    }

                    try {
                      // Create a new conversation with the user
                      const conversation = await chatService.createChat(
                        userId,
                        user._id,
                        `Hi! I'm following up on your adoption request for ${
                          request.pet?.name || "this pet"
                        }.`
                      );

                      // Navigate to the communication page with conversation ID
                      navigate(
                        `/communication?conversationId=${
                          (conversation as any).id
                        }`
                      );
                    } catch (error: any) {
                      console.error("Failed to create chat:", error);
                      showToast({
                        type: "error",
                        title: "Failed to Start Chat",
                        description:
                          error.response?.data?.message ||
                          "Unable to start a conversation. Please try again.",
                      });
                    }
                  }}
                >
                  Message User
                </Button>
                <Button
                  variant="outline"
                  leftIcon={XCircle}
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={isUpdating || isRefreshing}
                  className="text-red-600 hover:text-red-700"
                >
                  {isRefreshing ? "Refreshing..." : "Reject"}
                </Button>
                <Button
                  variant="primary"
                  leftIcon={CheckCircle}
                  onClick={() => handleStatusUpdate("approved")}
                  disabled={isUpdating || isRefreshing}
                >
                  {isRefreshing ? "Refreshing..." : "Approve"}
                </Button>
              </>
            )}

            {request.status === "scheduled" && (
              <Button
                variant="primary"
                leftIcon={CheckCircle}
                onClick={() => handleStatusUpdate("approved")}
                disabled={isUpdating || isRefreshing}
              >
                {isRefreshing ? "Refreshing..." : "Change to Approved"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}

      {/* Tab Implementation */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabContent.map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as
                      | "overview"
                      | "information"
                      | "notes"
                      | "timeline"
                      | "contract"
                      | "schedule"
                  )
                }
                className={`py-4 px-1 border-b-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">
          {tabContent.find((tab) => tab.id === activeTab)?.content}
        </div>
      </div>

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Note</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Note Content
                </label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Enter your note here..."
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="internalNote"
                  checked={isInternalNote}
                  onChange={(e) => setIsInternalNote(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="internalNote" className="text-sm text-gray-600">
                  Internal note (not visible to user)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddNoteModal(false);
                  setNoteContent("");
                  setIsInternalNote(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddNote}
                disabled={!noteContent.trim()}
              >
                Add Note
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Generation Modal */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Contract Generator</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowContractModal(false);
                }}
              >
                ×
              </Button>
            </div>
            <div className="p-4">
              <ContractGenerator
                adoptionRequestId={request._id || request.id}
                onContractGenerated={(contractData) => {
                  setLocalRequest((prev: any) => ({
                    ...prev,
                    contractDetails: contractData.contractDetails,
                  }));
                  setShowContractModal(false);
                  onStatusUpdate?.();
                }}
                existingContract={localRequest.contractDetails}
                disabled={localRequest.contractDetails?.status === "signed"}
                adoptionStatus={localRequest.status}
                canGenerateContract={localRequest.status === "approved"}
              />
            </div>
          </div>
        </div>
      )}

      {/* Handover Completion Modal */}
      {showHandoverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold mb-4">Complete Handover</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Handover Method *
                </label>
                <select
                  value={handoverData.method}
                  onChange={(e) =>
                    setHandoverData({ ...handoverData, method: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Select handover method"
                >
                  <option value="in_person">In Person</option>
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={handoverData.location}
                  onChange={(e) =>
                    setHandoverData({
                      ...handoverData,
                      location: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter handover location..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={handoverData.notes}
                  onChange={(e) =>
                    setHandoverData({ ...handoverData, notes: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter handover notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowHandoverModal(false);
                  setHandoverData({
                    method: "in_person",
                    location: "",
                    notes: "",
                    completedBy: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCompleteHandover}
                disabled={!handoverData.location.trim() || isUpdating}
              >
                {isUpdating ? "Completing..." : "Complete Handover"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdoptionRequestDetail;
