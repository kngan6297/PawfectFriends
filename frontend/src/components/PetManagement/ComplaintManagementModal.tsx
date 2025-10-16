import React, { useState, useEffect } from "react";
import AccessibleModal from "@/components/common/AccessibleModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "../../components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "react-toastify";
import axios from "axios";
import { formatDisplayDate } from "@/utils/dateUtils";

interface Complaint {
  _id: string;
  date: string;
  reporter: {
    name: string;
    email: string;
  };
  reason: string;
  description: string;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  adminNotes?: string;
  resolvedBy?: {
    name: string;
    email: string;
  };
  resolvedAt?: string;
}

interface ComplaintManagementModalProps {
  open: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
  onComplaintUpdated?: () => void;
}

const ComplaintManagementModal: React.FC<ComplaintManagementModalProps> = ({
  open,
  onClose,
  petId,
  petName,
  onComplaintUpdated,
}) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingComplaint, setUpdatingComplaint] = useState<string | null>(
    null
  );
  const [selectedStatus, setSelectedStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "investigating", label: "Investigating" },
    { value: "resolved", label: "Resolved" },
    { value: "dismissed", label: "Dismissed" },
  ];

  const reasonLabels = {
    inappropriate_content: "Inappropriate Content",
    false_information: "False Information",
    animal_welfare: "Animal Welfare",
    shelter_concerns: "Shelter Concerns",
    adoption_process: "Adoption Process",
    other: "Other",
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "investigating":
        return "primary";
      case "resolved":
        return "success";
      case "dismissed":
        return "secondary";
      default:
        return "default";
    }
  };

  useEffect(() => {
    if (open && petId) {
      fetchComplaints();
    }
  }, [open, petId]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/pets/${petId}/complaints`);
      setComplaints(response.data.data || []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast.error("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (complaintId: string) => {
    if (!selectedStatus) {
      toast.error("Please select a status");
      return;
    }

    setUpdatingComplaint(complaintId);
    try {
      await axios.patch(`/api/pets/${petId}/complaints/${complaintId}`, {
        status: selectedStatus,
        adminNotes: adminNotes.trim() || undefined,
      });

      toast.success("Complaint status updated successfully");
      setSelectedStatus("");
      setAdminNotes("");
      fetchComplaints();
      onComplaintUpdated?.();
    } catch (error) {
      console.error("Error updating complaint status:", error);
      toast.error("Failed to update complaint status");
    } finally {
      setUpdatingComplaint(null);
    }
  };

  const handleClose = () => {
    setComplaints([]);
    setSelectedStatus("");
    setAdminNotes("");
    setUpdatingComplaint(null);
    onClose();
  };

  return (
    <AccessibleModal
      isOpen={open}
      onClose={handleClose}
      title={`Complaints - ${petName}`}
    >
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No complaints found for this pet.
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {complaints.map((complaint) => (
              <div
                key={complaint._id}
                className="border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={getStatusBadgeVariant(complaint.status)}>
                        {complaint.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDisplayDate(new Date(complaint.createdAt))}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {
                        reasonLabels[
                          complaint.reason as keyof typeof reasonLabels
                        ]
                      }
                    </p>
                    <p className="text-sm text-gray-600">
                      Reported by: {complaint.reporter.name} (
                      {complaint.reporter.email})
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm text-gray-700">
                    {complaint.description}
                  </p>
                </div>

                {complaint.adminNotes && (
                  <div className="bg-blue-50 rounded p-3">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Admin Notes:
                    </p>
                    <p className="text-sm text-blue-700">
                      {complaint.adminNotes}
                    </p>
                  </div>
                )}

                {complaint.resolvedBy && (
                  <div className="bg-green-50 rounded p-3">
                    <p className="text-sm font-medium text-green-900 mb-1">
                      Resolved by: {complaint.resolvedBy.name}
                    </p>
                    <p className="text-sm text-green-700">
                      {new Date(complaint.resolvedAt!).toLocaleDateString(
                        "en-GB"
                      )}
                    </p>
                  </div>
                )}

                <div className="border-t pt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Update Status
                    </label>
                    <Select
                      value={selectedStatus}
                      onValueChange={(value) => setSelectedStatus(value)}
                      disabled={updatingComplaint === complaint._id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes (Optional)
                    </label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this complaint..."
                      rows={3}
                      disabled={updatingComplaint === complaint._id}
                      maxLength={500}
                    />
                  </div>

                  <Button
                    onClick={() => handleStatusUpdate(complaint._id)}
                    disabled={
                      !selectedStatus || updatingComplaint === complaint._id
                    }
                    size="sm"
                  >
                    {updatingComplaint === complaint._id
                      ? "Updating..."
                      : "Update Status"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccessibleModal>
  );
};

export default ComplaintManagementModal;
