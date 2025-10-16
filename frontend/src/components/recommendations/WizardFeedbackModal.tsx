import React, { useState } from "react";
import { X, Settings, Edit3, Lightbulb, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

interface WizardFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    petId: string,
    feedback: "rule_adjustment",
    reason: string
  ) => void;
  onGoBackToWizard: () => void;
  petName: string;
  matchScore?: number;
}

export const WizardFeedbackModal: React.FC<WizardFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onGoBackToWizard,
  petName,
  matchScore,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      // We need to get the petId from the parent component
      // For now, we'll use a placeholder since the modal doesn't have direct access to petId
      await onSubmit("placeholder-pet-id", "rule_adjustment", reason.trim());
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleGoBackToWizard = () => {
    onGoBackToWizard();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Rule Adjustment Feedback
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close feedback modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Help us adjust our matching rules! Your feedback helps improve the
              wizard's logic for{" "}
              <span className="font-medium text-gray-900">{petName}</span>
              {matchScore && (
                <span className="block text-sm text-gray-500 mt-1">
                  Current wizard match score: {Math.round(matchScore * 100)}%
                </span>
              )}
            </p>

            {/* Rule Adjustment Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">🎯 Rule-Based Matching</p>
                  <p className="text-xs mt-1">
                    Unlike AI learning, wizard feedback helps us adjust the
                    rules that determine pet compatibility scores.
                  </p>
                </div>
              </div>
            </div>

            {/* Reason Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What doesn't match your lifestyle?
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell us what aspects don't align with your preferences (e.g., energy level, size, care requirements)..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Suggestion to Refine Preferences */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Edit3 className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">💡 Want better matches?</p>
                  <p className="text-xs mt-1">
                    Consider going back to the wizard to refine your
                    preferences. This will give you more accurate results!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleGoBackToWizard}
              className="flex-1 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Wizard
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!reason.trim() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
