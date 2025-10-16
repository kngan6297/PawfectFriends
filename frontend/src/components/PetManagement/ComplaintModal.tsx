import React, { useState } from "react";
import AccessibleModal from "@/components/common/AccessibleModal";
import { Button } from "@/components/ui/Button";
import FormField from "@/components/common/FormField";
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

interface ComplaintModalProps {
  open: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
  onComplaintSubmitted?: () => void;
}

const ComplaintModal: React.FC<ComplaintModalProps> = ({
  open,
  onClose,
  petId,
  petName,
  onComplaintSubmitted,
}) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const complaintReasons = [
    { value: "inappropriate_content", label: "Inappropriate Content" },
    { value: "false_information", label: "False Information" },
    { value: "animal_welfare", label: "Animal Welfare Concerns" },
    { value: "shelter_concerns", label: "Shelter Concerns" },
    { value: "adoption_process", label: "Adoption Process Issues" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/api/pets/${petId}/complaints`, {
        reason,
        description: description.trim(),
      });

      toast.success("Complaint submitted successfully");
      setReason("");
      setDescription("");
      onClose();
      onComplaintSubmitted?.();
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error("Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason("");
      setDescription("");
      onClose();
    }
  };

  return (
    <AccessibleModal
      isOpen={open}
      onClose={handleClose}
      title={`Report ${petName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Report *
          </label>
          <Select
            value={reason}
            onValueChange={setReason}
            disabled={loading}
            required
          >
            <option value="">Select a reason</option>
            {complaintReasons.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide details about your concern..."
            rows={4}
            disabled={loading}
            required
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {description.length}/1000 characters
          </p>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="accent-pink" disabled={loading}>
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </form>
    </AccessibleModal>
  );
};

export default ComplaintModal;
