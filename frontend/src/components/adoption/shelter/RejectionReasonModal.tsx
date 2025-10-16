import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rejectionReason: string, rejectionDetails: string) => void;
  requestId: string;
  petName: string;
  userName: string;
}

const REJECTION_REASONS = [
  { value: "incomplete_application", label: "Incomplete Application" },
  { value: "unsuitable_housing", label: "Unsuitable Housing" },
  { value: "no_yard_for_dog", label: "No Yard for Dog" },
  { value: "other_pets_conflict", label: "Other Pets Conflict" },
  { value: "children_concerns", label: "Children Concerns" },
  { value: "work_schedule_issues", label: "Work Schedule Issues" },
  { value: "lack_of_experience", label: "Lack of Experience" },
  { value: "financial_concerns", label: "Financial Concerns" },
  { value: "vet_reference_issues", label: "Vet Reference Issues" },
  { value: "home_visit_failed", label: "Home Visit Failed" },
  { value: "interview_concerns", label: "Interview Concerns" },
  { value: "pet_already_adopted", label: "Pet Already Adopted" },
  { value: "other", label: "Other" },
];

export const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  requestId,
  petName,
  userName,
}) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionDetails, setRejectionDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!rejectionReason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(rejectionReason, rejectionDetails);
      handleClose();
    } catch (error) {
      console.error("Error rejecting request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRejectionReason("");
    setRejectionDetails("");
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Reject Adoption Request
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Rejecting adoption request for{" "}
            <span className="font-medium">{petName}</span> by{" "}
            <span className="font-medium">{userName}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label
              htmlFor="rejection-reason"
              className="text-sm font-medium text-gray-700"
            >
              Rejection Reason *
            </Label>
            <Select value={rejectionReason} onValueChange={setRejectionReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label
              htmlFor="rejection-details"
              className="text-sm font-medium text-gray-700"
            >
              Additional Details *
            </Label>
            <Textarea
              id="rejection-details"
              value={rejectionDetails}
              onChange={(e) => setRejectionDetails(e.target.value)}
              placeholder="Please provide specific details about why this request is being rejected..."
              className="mt-1"
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {rejectionDetails.length}/1000 characters
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="accent-pink"
            onClick={handleConfirm}
            disabled={
              !rejectionReason.trim() ||
              !rejectionDetails.trim() ||
              isSubmitting
            }
          >
            {isSubmitting ? "Rejecting..." : "Reject Request"}
          </Button>
        </div>
      </div>
    </div>
  );
};
