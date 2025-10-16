import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "../../../components/ui/Select";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { adoptionApi } from "@/services/api";
import {
  FileText,
  User,
  Home,
  PawPrint,
  DollarSign,
  Stethoscope,
  Users,
  FolderOpen,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
} from "lucide-react";
import { format } from "date-fns";
import { formatDisplayDate } from "@/utils/dateUtils";

interface RequiredField {
  fieldName: string;
  fieldType:
    | "text"
    | "textarea"
    | "number"
    | "email"
    | "phone"
    | "date"
    | "file"
    | "select";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface InformationRequest {
  _id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  status: "pending" | "submitted" | "overdue" | "approved" | "rejected";
  isUrgent: boolean;
  priority: "low" | "medium" | "high" | "critical";
  requiredFields: RequiredField[];
  requestedAt: string;
  submittedAt?: string;
  response?: {
    answers: Array<{
      fieldName: string;
      value: any;
      fileUrl?: string;
      fileName?: string;
    }>;
    additionalNotes?: string;
  };
  reviewNotes?: string;
  reminders: Array<{
    sentAt: string;
    method: string;
  }>;
}

interface InformationRequestsListProps {
  requestId: string;
  userRole: "shelter_admin" | "admin" | "user";
  onRefresh?: () => void;
}

const CATEGORIES = [
  { value: "personal_information", label: "Personal Information", icon: User },
  { value: "housing_details", label: "Housing Details", icon: Home },
  { value: "pet_experience", label: "Pet Experience", icon: PawPrint },
  {
    value: "financial_information",
    label: "Financial Information",
    icon: DollarSign,
  },
  {
    value: "veterinarian_reference",
    label: "Veterinarian Reference",
    icon: Stethoscope,
  },
  { value: "personal_references", label: "Personal References", icon: Users },
  { value: "documents", label: "Documents", icon: FolderOpen },
  { value: "other", label: "Other", icon: FileText },
];

const InformationRequestsList: React.FC<InformationRequestsListProps> = ({
  requestId,
  userRole,
  onRefresh,
}) => {
  const [requests, setRequests] = useState<InformationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] =
    useState<InformationRequest | null>(null);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [responseData, setResponseData] = useState<{ [key: string]: any }>({});
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">(
    "approved"
  );
  const [reviewNotes, setReviewNotes] = useState("");

  const isShelterStaff = userRole === "shelter_admin" || userRole === "admin";

  useEffect(() => {
    fetchRequests();
  }, [requestId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      // Use user-specific API for regular users, shelter API for shelter/admin users
      let response;
      if (userRole === "user") {
        response = await adoptionApi.getUserInformationRequests(requestId);
      } else {
        response = await adoptionApi.getInformationRequests(requestId);
      }

      // Both APIs return {status: 'success', data: Array}
      // So we need to access response.data for both
      const requestsData = response.data || [];

      setRequests(requestsData);
    } catch (error) {
      console.error("Error fetching information requests:", error);
      toast.error("Failed to fetch information requests");
      setRequests([]); // Set empty array on error to prevent map error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return;

    try {
      const answers = Object.entries(responseData).map(
        ([fieldName, value]) => ({
          fieldName,
          value,
        })
      );

      await adoptionApi.submitInformationResponse(requestId, {
        informationRequestId: selectedRequest._id,
        answers,
        additionalNotes,
      });

      toast.success("Response submitted successfully");
      setResponseModalOpen(false);
      setResponseData({});
      setAdditionalNotes("");
      setSelectedRequest(null);
      fetchRequests();
      onRefresh?.();
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("Failed to submit response");
    }
  };

  const handleReviewRequest = async () => {
    if (!selectedRequest) return;

    try {
      await adoptionApi.reviewInformationRequest(requestId, {
        informationRequestId: selectedRequest._id,
        status: reviewStatus,
        reviewNotes,
      });

      toast.success(`Information request ${reviewStatus}`);
      setReviewModalOpen(false);
      setReviewStatus("approved");
      setReviewNotes("");
      setSelectedRequest(null);
      fetchRequests();
      onRefresh?.();
    } catch (error) {
      console.error("Error reviewing request:", error);
      toast.error("Failed to review request");
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this information request?"))
      return;

    try {
      await adoptionApi.deleteInformationRequest(
        requestId /* adoption request ID from props */,
        requestId /* information request ID from parameter */
      );
      toast.success("Information request deleted");
      fetchRequests();
      onRefresh?.();
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error("Failed to delete request");
    }
  };

  const handleSendReminder = async (requestId: string) => {
    try {
      await adoptionApi.sendInformationRequestReminder(requestId, {
        informationRequestId: requestId,
        reminderMethod: "email",
      });
      toast.success("Reminder sent successfully");
      fetchRequests();
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error("Failed to send reminder");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "submitted":
        return "info";
      case "overdue":
        return "destructive";
      case "approved":
        return "success";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = CATEGORIES.find((c) => c.value === category);
    return categoryData ? (
      React.createElement(categoryData.icon, { className: "h-4 w-4" })
    ) : (
      <FileText className="h-4 w-4" />
    );
  };

  const isOverdue = (dueDate: string) => {
    return (
      new Date(dueDate) < new Date() && selectedRequest?.status === "pending"
    );
  };

  const renderFieldInput = (
    field: RequiredField,
    value: any,
    onChange: (value: any) => void
  ) => {
    switch (field.fieldType) {
      case "textarea":
        return (
          <Textarea
            label={field.label}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
          />
        );
      case "number":
        return (
          <Input
            label={field.label}
            type="number"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      case "email":
        return (
          <Input
            label={field.label}
            type="email"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      case "phone":
        return (
          <Input
            label={field.label}
            type="tel"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      case "date":
        return (
          <Input
            label={field.label}
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        );
      case "file":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
            </label>
            <input
              type="file"
              title={field.label}
              onChange={(e) => onChange(e.target.files?.[0])}
              required={field.required}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        );
      case "select":
        return (
          <Select
            value={value || ""}
            onValueChange={(value) => onChange(value)}
            required={field.required}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            label={field.label}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading information requests...</p>
      </div>
    );
  }

  // Safety check to ensure requests is always an array
  if (!Array.isArray(requests)) {
    console.error("❌ Requests is not an array:", requests);
    return (
      <div className="text-center py-8 text-red-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-red-300" />
        <p>Error: Invalid data format</p>
        <p className="text-sm">Please refresh the page</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No information requests found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card
          key={request._id}
          className={`${
            isOverdue(request.dueDate) ? "border-red-200 bg-red-50" : ""
          }`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getCategoryIcon(request.category)}
                <div>
                  <h3 className="font-medium text-gray-900">{request.title}</h3>
                  <p className="text-sm text-gray-500">{request.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(request.status) as any}>
                  {request.status}
                </Badge>
                <Badge variant={getPriorityColor(request.priority) as any}>
                  {request.priority}
                </Badge>
                {request.isUrgent && (
                  <Badge variant="danger">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Urgent
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Due: {formatDisplayDate($1)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Requested:{" "}
                  {formatDisplayDate($1)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isShelterStaff && request.status === "pending" && (
                  <Button
                    onClick={() => handleSendReminder(request._id)}
                    leftIcon={Send}
                    variant="outline"
                    size="sm"
                  >
                    Send Reminder
                  </Button>
                )}

                {!isShelterStaff && request.status === "pending" && (
                  <Button
                    onClick={() => {
                      setSelectedRequest(request);
                      setResponseModalOpen(true);
                    }}
                    leftIcon={Upload}
                    variant="primary"
                    size="sm"
                  >
                    Submit Response
                  </Button>
                )}

                {isShelterStaff && request.status === "submitted" && (
                  <Button
                    onClick={() => {
                      setSelectedRequest(request);
                      setReviewModalOpen(true);
                    }}
                    leftIcon={Eye}
                    variant="outline"
                    size="sm"
                  >
                    Review Response
                  </Button>
                )}

                {isShelterStaff && (
                  <Button
                    onClick={() => handleDeleteRequest(request._id)}
                    leftIcon={Trash2}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {request.response && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">
                  Submitted Response
                </h4>
                <div className="space-y-3">
                  {request.response.answers.map((answer, index) => {
                    const field = request.requiredFields.find(
                      (f) => f.fieldName === answer.fieldName
                    );
                    return (
                      <div key={index} className="flex justify-between">
                        <span className="font-medium text-gray-700">
                          {field?.label || answer.fieldName}:
                        </span>
                        <span className="text-gray-900">
                          {answer.fileUrl ? (
                            <a
                              href={answer.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {answer.fileName || "Download File"}
                            </a>
                          ) : (
                            String(answer.value)
                          )}
                        </span>
                      </div>
                    );
                  })}
                  {request.response.additionalNotes && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Additional Notes:
                      </span>
                      <p className="text-gray-900 mt-1">
                        {request.response.additionalNotes}
                      </p>
                    </div>
                  )}
                </div>

                {request.reviewNotes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Review Notes
                    </h5>
                    <p className="text-gray-700">{request.reviewNotes}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Response Modal */}
      <Dialog open={responseModalOpen} onOpenChange={setResponseModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Response</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">
                  {selectedRequest.title}
                </h4>
                <p className="text-blue-700 text-sm mt-1">
                  {selectedRequest.description}
                </p>
              </div>

              <div className="space-y-4">
                {selectedRequest.requiredFields.map((field) => (
                  <div key={field.fieldName}>
                    {renderFieldInput(
                      field,
                      responseData[field.fieldName],
                      (value) =>
                        setResponseData((prev) => ({
                          ...prev,
                          [field.fieldName]: value,
                        }))
                    )}
                  </div>
                ))}
              </div>

              <Textarea
                label="Additional Notes (Optional)"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any additional information you'd like to provide..."
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResponseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitResponse}>Submit Response</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Response</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Select
              value={reviewStatus}
              onValueChange={(value) =>
                setReviewStatus(value as "approved" | "rejected")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select review decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approve</SelectItem>
                <SelectItem value="rejected">Reject</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              label="Review Notes (Optional)"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Provide feedback or notes about this response..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReviewRequest}>Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InformationRequestsList;
