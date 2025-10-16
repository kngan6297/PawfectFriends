import React, { useState } from "react";
import { X, MessageSquare } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface FeedbackModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit: (reason: string, details?: string) => void;
  petName?: string;
  className?: string;
  // For self-contained mode (like AiFeedbackButton)
  showButton?: boolean;
  buttonText?: string;
}

const FEEDBACK_REASONS = [
  {
    value: "too-large",
    label: "Too large",
    icon: "🐕",
    description: "Pet is bigger than I prefer",
  },
  {
    value: "too-small",
    label: "Too small",
    icon: "🐕",
    description: "Pet is smaller than I prefer",
  },
  {
    value: "not-good-with-kids",
    label: "Not good with kids",
    icon: "👶",
    description: "Concerned about child safety",
  },
  {
    value: "wrong-personality",
    label: "Wrong personality",
    icon: "😊",
    description: "Energy level or temperament doesn't match",
  },
  {
    value: "too-active",
    label: "Too active/energetic",
    icon: "⚡",
    description: "More energetic than I can handle",
  },
  {
    value: "too-calm",
    label: "Too calm/low energy",
    icon: "😴",
    description: "Less active than I prefer",
  },
  {
    value: "age-preference",
    label: "Age doesn't match",
    icon: "📅",
    description: "Looking for different age range",
  },
  {
    value: "breed-preference",
    label: "Breed preference",
    icon: "🏷️",
    description: "Looking for different breed",
  },
  {
    value: "health-concerns",
    label: "Health concerns",
    icon: "🏥",
    description: "Medical issues concern me",
  },
  {
    value: "behavior-concerns",
    label: "Behavior concerns",
    icon: "⚠️",
    description: "Training or behavior issues",
  },
  {
    value: "other",
    label: "Other reason",
    icon: "❓",
    description: "Something else",
  },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  onSubmit,
  petName,
  className,
  showButton = false,
  buttonText = "Pet not suitable? Tell us why",
}) => {
  // Internal state for self-contained mode
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [feedbackDetails, setFeedbackDetails] = useState("");

  // Determine if we're in external or internal mode
  const isExternalMode = externalIsOpen !== undefined;
  const isOpen = isExternalMode ? externalIsOpen : internalIsOpen;

  const handleSubmit = () => {
    if (selectedReason) {
      onSubmit(selectedReason, feedbackDetails);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedReason("");
    setFeedbackDetails("");
    if (isExternalMode) {
      externalOnClose?.();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleOpen = () => {
    if (!isExternalMode) {
      setInternalIsOpen(true);
    }
  };

  // If in external mode and not open, return null
  if (isExternalMode && !isOpen) return null;

  // If showing button (self-contained mode)
  if (showButton) {
    return (
      <div className={className}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpen}
          className="text-gray-600 hover:text-primary-600"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>

        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardBody className="p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Help us improve our recommendations
                  </h3>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close feedback modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {petName && (
                  <p className="text-sm text-gray-600 mb-4">
                    Why isn't <strong>{petName}</strong> a good match for you?
                  </p>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Why isn't this pet suitable for you?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {FEEDBACK_REASONS.map((reason) => (
                        <label
                          key={reason.value}
                          className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="radio"
                            name="feedback-reason"
                            value={reason.value}
                            checked={selectedReason === reason.value}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{reason.icon}</span>
                              <span className="text-sm font-medium text-gray-700">
                                {reason.label}
                              </span>
                            </div>
                            {selectedReason === reason.value && (
                              <p className="text-xs text-gray-500 mt-1">
                                {reason.description}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional details (optional):
                    </label>
                    <textarea
                      value={feedbackDetails}
                      onChange={(e) => setFeedbackDetails(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Tell us more about your preferences..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!selectedReason}
                  >
                    Submit Feedback
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // External modal mode (original FeedbackModal behavior)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardBody className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Help us improve our recommendations
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close feedback modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {petName && (
            <p className="text-sm text-gray-600 mb-4">
              Why isn't <strong>{petName}</strong> a good match for you?
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why isn't this pet suitable for you?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEEDBACK_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="feedback-reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{reason.icon}</span>
                        <span className="text-sm font-medium text-gray-700">
                          {reason.label}
                        </span>
                      </div>
                      {selectedReason === reason.value && (
                        <p className="text-xs text-gray-500 mt-1">
                          {reason.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional details (optional):
              </label>
              <textarea
                value={feedbackDetails}
                onChange={(e) => setFeedbackDetails(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Tell us more about your preferences..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!selectedReason}
            >
              Submit Feedback
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
