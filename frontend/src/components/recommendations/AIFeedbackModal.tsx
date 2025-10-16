import React, { useState } from "react";
import { X, ThumbsUp, ThumbsDown, Brain, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

interface AIFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: "positive" | "negative", reason: string) => void;
  petName: string;
  matchScore?: number;
}

export const AIFeedbackModal: React.FC<AIFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  petName,
  matchScore,
}) => {
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(
    null
  );
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback || !reason.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(feedback, reason.trim());
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFeedback(null);
    setReason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                AI Learning Feedback
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
              Help our AI learn! Your feedback improves future recommendations
              for <span className="font-medium text-gray-900">{petName}</span>
              {matchScore && (
                <span className="block text-sm text-gray-500 mt-1">
                  Current AI match score: {Math.round(matchScore * 100)}%
                </span>
              )}
            </p>

            {/* Feedback Options */}
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="feedback"
                  value="positive"
                  checked={feedback === "positive"}
                  onChange={(e) => setFeedback(e.target.value as "positive")}
                  className="sr-only"
                />
                <div
                  className={`flex items-center gap-3 w-full ${
                    feedback === "positive" ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  <ThumbsUp
                    className={`h-6 w-6 ${
                      feedback === "positive"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                  <div>
                    <div className="font-medium">👍 This pet fits me</div>
                    <div className="text-sm text-gray-500">
                      AI will increase similar pet scores
                    </div>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-red-300 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="feedback"
                  value="negative"
                  checked={feedback === "negative"}
                  onChange={(e) => setFeedback(e.target.value as "negative")}
                  className="sr-only"
                />
                <div
                  className={`flex items-center gap-3 w-full ${
                    feedback === "negative" ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  <ThumbsDown
                    className={`h-6 w-6 ${
                      feedback === "negative" ? "text-red-600" : "text-gray-400"
                    }`}
                  />
                  <div>
                    <div className="font-medium">👎 Not a good fit</div>
                    <div className="text-sm text-gray-500">
                      AI will decrease similar pet scores
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Reason Input */}
          {feedback && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why{" "}
                {feedback === "positive"
                  ? "does this pet fit"
                  : "isn't this pet a good fit"}
                ?
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Tell us why ${
                  feedback === "positive"
                    ? "this pet is perfect"
                    : "this pet doesn't work"
                } for you...`}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          )}

          {/* AI Learning Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">🤖 AI Learning Impact</p>
                <p className="text-xs mt-1">
                  Your feedback helps our machine learning model understand your
                  preferences better. Similar pets will be scored more
                  accurately in future recommendations.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!feedback || !reason.trim() || isSubmitting}
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
