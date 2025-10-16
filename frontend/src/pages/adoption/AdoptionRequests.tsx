import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { petApi, adoptionApi } from "@/services/api";
import { format } from "date-fns";
import NotesSection from "@/components/adoption/user/NotesSection";
import DocumentUpload from "@/components/adoption/shared/DocumentUpload";
import ContractDocument from "@/components/adoption/shelter/ContractDocument";
import PostApprovalScheduling from "@/components/adoption/user/PostApprovalScheduling";
import ContactShelter from "@/components/adoption/user/ContactShelter";
import DecisionResult from "@/components/adoption/shelter/DecisionResult";
import RequestAdditionalInformation from "@/components/adoption/shared/RequestAdditionalInformation";
import InformationRequestsList from "@/components/adoption/shared/InformationRequestsList";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import AdoptionRequestsList from "@/components/adoption/shared/AdoptionRequestsList";

interface AdoptionNote {
  _id?: string;
  content: string;
  author: string;
  isInternal: boolean;
  timestamp: Date;
}

interface AdoptionDocument {
  _id?: string;
  type:
    | "id"
    | "proof_of_residence"
    | "reference_letter"
    | "vet_records"
    | "other";
  url: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
}

interface AdoptionRequest {
  _id: string;
  pet: {
    _id: string;
    name: string;
    photos: string[];
    type: string;
    breed: string;
    age: number | string;
    description: string;
  };
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: string;
  updatedAt: string;
  reason: string;
  experience: string;
  livingSituation: string;
  notes?: AdoptionNote[];
  documents?: AdoptionDocument[];
  contractDocuments?: any[];
  reminderSent: boolean;
  reminders?: { sentAt: string }[];
}

const PET_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Cpath d='M100 60c-22.1 0-40 17.9-40 40s17.9 40 40 40 40-17.9 40-40-17.9-40-40-40zm0 60c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20z' fill='%239ca3af'/%3E%3C/svg%3E";

const AdoptionRequests: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] =
    useState<AdoptionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const request = await adoptionApi.getById(requestId!);

      // Debug: Log the request data to see what's being returned
      console.log("🔍 Adoption request data:", request);
      console.log("🔍 Pet details:", request.petDetails);
      console.log("🔍 User details:", request.userDetails);

      // Transform the API response to match our frontend interface
      const transformedRequest: AdoptionRequest = {
        _id: request.id,
        pet: {
          _id: request.petDetails?._id || request.pet,
          name: request.petDetails?.name || "Unknown Pet",
          photos: request.petDetails?.photos || [],
          type: request.petDetails?.type || "",
          breed: request.petDetails?.breed || "",
          age: request.petDetails?.age || 0,
          description: request.petDetails?.description || "",
        },
        user: {
          _id: request.userDetails?._id || request.user,
          name: request.userDetails?.name || "Unknown User",
          email: request.userDetails?.email || "",
          phone: request.userDetails?.phone || "",
        },
        status: request.status,
        createdAt: request.timeline?.[0]?.date
          ? new Date(request.timeline[0].date).toISOString()
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reason: request.applicationDetails?.reasonForAdopting || "",
        experience: request.applicationDetails?.experience || "",
        livingSituation: request.applicationDetails?.housingType || "",
        notes: (request.notes || []).map((note: any) => ({
          _id: note._id,
          content: note.content,
          author: note.author?.name || note.author || "Unknown User",
          isInternal: note.isInternal || false,
          timestamp: new Date(note.createdAt || note.timestamp || new Date()),
        })),
        documents: (request.documents || []).map((doc: any) => ({
          _id: doc._id,
          type:
            doc.type === "application" || doc.type === "contract"
              ? "other"
              : doc.type,
          url: doc.url,
          name: doc.name,
          status: doc.status,
          uploadedAt: new Date(doc.uploadedAt),
          verifiedAt: doc.verifiedAt ? new Date(doc.verifiedAt) : undefined,
          verifiedBy: doc.verifiedBy?.name || doc.verifiedBy,
        })),
        reminderSent: request.reminderSent || false,
        reminders:
          request.reminders?.map((reminder) => ({
            sentAt:
              typeof reminder.sentAt === "string"
                ? reminder.sentAt
                : reminder.sentAt.toISOString(),
            method: reminder.method,
            by: reminder.by,
          })) || [],
      };
      setSelectedRequest(transformedRequest);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch request details";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: "approved" | "rejected") => {
    try {
      await adoptionApi.updateStatus(requestId!, newStatus);
      toast.success(`Request ${newStatus} successfully`);
      fetchRequestDetails();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to ${newStatus} request`;
      toast.error(errorMessage);
    }
  };

  const handleNotesUpdate = (updatedNotes: AdoptionNote[]) => {
    if (selectedRequest) {
      setSelectedRequest({
        ...selectedRequest,
        notes: updatedNotes,
      });
    }
  };

  const handleDocumentsUpdate = (updatedDocuments: AdoptionDocument[]) => {
    if (selectedRequest) {
      setSelectedRequest({
        ...selectedRequest,
        documents: updatedDocuments,
      });
    }
  };

  const handleContractDocumentsUpdate = (updatedContractDocuments: any[]) => {
    if (selectedRequest) {
      setSelectedRequest({
        ...selectedRequest,
        contractDocuments: updatedContractDocuments,
      });
    }
  };

  const handleSendReminder = async () => {
    try {
      await petApi.sendReminder(requestId!);
      toast.success("Reminder sent successfully");
      fetchRequestDetails();
    } catch (error) {
      toast.error("Failed to send reminder");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-red-600">
            Error Loading {requestId ? "Request" : "Requests"}
          </h3>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <button
            onClick={
              requestId
                ? fetchRequestDetails
                : () => navigate("/adoption-requests")
            }
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render detail view if requestId is present
  if (requestId && selectedRequest) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </button>
            <h1 className="mt-2 text-2xl font-semibold text-gray-900">
              Adoption Request Details
            </h1>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(
                selectedRequest.status
              )}`}
            >
              {selectedRequest.status.charAt(0).toUpperCase() +
                selectedRequest.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pet Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Pet Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src={
                    selectedRequest.pet.photos &&
                    selectedRequest.pet.photos.length > 0 &&
                    selectedRequest.pet.photos[0]
                      ? selectedRequest.pet.photos[0]
                      : PET_PLACEHOLDER
                  }
                  alt={selectedRequest.pet.name || "Pet"}
                  className="h-24 w-24 rounded-lg object-cover"
                  onError={(e) => {
                    console.log(
                      "❌ Image failed to load:",
                      e.currentTarget.src
                    );
                    e.currentTarget.src = PET_PLACEHOLDER;
                  }}
                />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedRequest.pet.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedRequest.pet.breed}
                  </p>
                  <p className="text-sm text-gray-500">
                    {typeof selectedRequest.pet.age === "number"
                      ? `${selectedRequest.pet.age} years old`
                      : selectedRequest.pet.age || "Unknown age"}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Description
                </h4>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedRequest.pet.description}
                </p>
              </div>
            </div>
          </div>

          {/* Applicant Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Applicant Information
            </h2>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Name</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedRequest.user.name}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Email</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedRequest.user.email}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedRequest.user.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Adoption Details */}
          <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Adoption Details
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Reason for Adoption
                </h4>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedRequest.reason}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Pet Experience
                </h4>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedRequest.experience}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Living Situation
                </h4>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedRequest.livingSituation}
                </p>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="lg:col-span-2">
            <NotesSection
              requestId={requestId!}
              notes={selectedRequest.notes || []}
              onNotesUpdate={handleNotesUpdate}
            />
          </div>

          {/* Documents Section */}
          <div className="lg:col-span-2">
            <DocumentUpload
              requestId={requestId!}
              documents={selectedRequest.documents || []}
              onDocumentsUpdate={handleDocumentsUpdate}
              readOnly={user?.role === "user"}
              showUpload={user?.role !== "user"}
            />
          </div>

          {/* Contract Documents Section - Only for shelters */}
          {user?.role === "shelter" || user?.role === "admin" ? (
            <div className="lg:col-span-2">
              <ContractDocument
                requestId={requestId!}
                contractDocuments={selectedRequest.contractDocuments || []}
                onContractDocumentsUpdate={handleContractDocumentsUpdate}
              />
            </div>
          ) : null}

          {/* Interview Scheduling Section */}
          <div className="lg:col-span-2">
            <PostApprovalScheduling
              requestId={requestId!}
              requestData={{
                user: {
                  _id: selectedRequest.user._id || "",
                  name: selectedRequest.user.name,
                  email: selectedRequest.user.email,
                },
                pet: {
                  _id: selectedRequest.pet._id,
                  name: selectedRequest.pet.name,
                },
              }}
              onMeetingUpdate={fetchRequestDetails}
              isApproved={selectedRequest.status === "approved"}
              requestStatus={selectedRequest.status}
            />
          </div>

          {/* Adoption Workflow Components - Only for shelter staff */}
          {(user?.role === "shelter" || user?.role === "admin") && (
            <div className="lg:col-span-2 space-y-6">
              <ContactShelter
                requestId={requestId!}
                onContactComplete={fetchRequestDetails}
              />
              <NotesSection
                requestId={requestId!}
                onNotesRecorded={fetchRequestDetails}
                scope="meeting"
              />
              <DecisionResult
                requestId={requestId!}
                onDecisionMade={fetchRequestDetails}
              />
            </div>
          )}

          {/* Information Requests Section */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-900">
                  Additional Information Requests
                </h2>
                {(user?.role === "shelter" || user?.role === "admin") && (
                  <RequestAdditionalInformation
                    requestId={requestId!}
                    onRequestCreated={fetchRequestDetails}
                  />
                )}
              </div>

              <InformationRequestsList
                requestId={requestId!}
                userRole={(user?.role || "user") as any}
                onRefresh={fetchRequestDetails}
              />
            </div>
          </div>

          {/* Reminder Status Section */}
          <div className="lg:col-span-2 mb-4">
            {selectedRequest.reminderSent && (
              <Badge variant="warning">Reminder Sent</Badge>
            )}
            {selectedRequest.reminders &&
              selectedRequest.reminders.length > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  Last reminder:{" "}
                  {format(
                    new Date(
                      selectedRequest.reminders[
                        selectedRequest.reminders.length - 1
                      ].sentAt
                    ),
                    "MMM d, yyyy"
                  )}
                </span>
              )}
            {(user?.role === "shelter" || user?.role === "admin") && (
              <Button onClick={handleSendReminder} className="ml-4" size="sm">
                Send Reminder
              </Button>
            )}
          </div>

          {/* Action Buttons for Shelter Staff */}
          {(user?.role === "shelter" || user?.role === "admin") &&
            selectedRequest.status === "pending" && (
              <div className="lg:col-span-2 flex justify-end space-x-4">
                <button
                  onClick={() => handleStatusUpdate("rejected")}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => handleStatusUpdate("approved")}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Approve Request
                </button>
              </div>
            )}
        </div>
      </div>
    );
  }

  // Render list view using the unified component
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AdoptionRequestsList
        viewMode={
          user?.role === "shelter" || user?.role === "admin" ? "admin" : "user"
        }
        showStats={false}
        showQuickActions={false}
        showFilters={true}
        layout="table"
        requests={[]}
      />
    </div>
  );
};

export default AdoptionRequests;
