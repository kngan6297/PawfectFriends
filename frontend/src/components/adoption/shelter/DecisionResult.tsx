import React, { useState } from "react";
import { toast } from "react-toastify";
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
import { ThumbsUp } from "lucide-react";
import { adoptionApi } from "@/services/api";
import { useAdoptionAction } from "@/hooks/useAdoptionAction";
import AdoptionActionCard from "../shared/AdoptionActionCard";

interface DecisionResultProps {
  requestId: string;
  onDecisionMade: () => void;
}

const DecisionResult: React.FC<DecisionResultProps> = ({
  requestId,
  onDecisionMade,
}) => {
  const {
    showModal,
    formData,
    setFormData,
    loading,
    setLoading,
    openModal,
    closeModal,
    updateAdoptionStatus,
  } = useAdoptionAction({ requestId, onComplete: onDecisionMade });

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (formData.decision === "approve") {
        await adoptionApi.approveAdoptionRequest(requestId, formData);
        toast.success("Adoption request approved");
      } else if (formData.decision === "reject") {
        await adoptionApi.performPreliminaryEvaluation(requestId, formData);
        await updateAdoptionStatus("rejected", formData.rejectionReason);
        toast.success("Adoption request rejected");
      } else if (formData.decision === "proceed") {
        await adoptionApi.performPreliminaryEvaluation(requestId, formData);
        await updateAdoptionStatus("proceed", formData.notes);
        toast.success("Adoption request marked to proceed");
      }

      closeModal();
      onDecisionMade();
    } catch (error: any) {
      console.error("❌ Decision failed:", error);
      toast.error("Decision failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const decisionIcon = (
    <svg
      className="mx-auto h-12 w-12 text-gray-300 mb-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  return (
    <AdoptionActionCard
      title="Final Decision"
      description="Make the final decision on this adoption request"
      icon={ThumbsUp}
      buttonText="Make Decision"
      showModal={showModal}
      loading={loading}
      onButtonClick={openModal}
      onClose={closeModal}
      onSubmit={handleSubmit}
      emptyStateIcon={decisionIcon}
      emptyStateText="No decision made yet"
      emptyStateSubtext="Review the application and make a final decision"
    >
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Final Decision</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Decision</label>
            <Select
              value={formData.decision || ""}
              onValueChange={(value) =>
                setFormData({ ...formData, decision: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Approval</SelectLabel>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="proceed">Proceed to Next Step</SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Rejection</SelectLabel>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {formData.decision === "reject" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Rejection Reason
              </label>
              <Select
                value={formData.rejectionReason || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, rejectionReason: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incomplete_application">
                    Incomplete Application
                  </SelectItem>
                  <SelectItem value="unsuitable_housing">
                    Unsuitable Housing
                  </SelectItem>
                  <SelectItem value="no_experience">
                    No Pet Experience
                  </SelectItem>
                  <SelectItem value="financial_concerns">
                    Financial Concerns
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Textarea
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add any additional notes about your decision..."
              rows={4}
            />
          </div>
        </div>
      </div>
    </AdoptionActionCard>
  );
};

export default DecisionResult;
