import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";

interface InlineFeedbackProps {
  petId: string;
  onFeedback: (
    petId: string,
    feedback: "positive" | "negative",
    reason: string
  ) => void;
  onChat?: () => void;
  showChatButton?: boolean;
}

export const InlineFeedback: React.FC<InlineFeedbackProps> = ({
  petId,
  onFeedback,
  onChat,
  showChatButton = true,
}) => {
  const [feedbackGiven, setFeedbackGiven] = useState<"positive" | "negative" | null>(null);
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState("");

  const handleFeedback = (type: "positive" | "negative") => {
    if (feedbackGiven === type) {
      // User clicked the same feedback again, remove it
      setFeedbackGiven(null);
      setShowReasonInput(false);
      setReason("");
      return;
    }

    setFeedbackGiven(type);
    setShowReasonInput(true);
  };

  const submitFeedback = () => {
    if (reason.trim()) {
      onFeedback(petId, feedbackGiven!, reason.trim());
      setShowReasonInput(false);
      setReason("");
    }
  };

  const quickReasons = {
    positive: [
      "Perfect match for my lifestyle",
      "Great personality",
      "Good size for my home",
      "Low maintenance",
      "Good with kids/pets",
    ],
    negative: [
      "Too high energy",
      "Too much grooming needed",
      "Too large for my space",
      "Not good with kids",
      "Too expensive to maintain",
    ],
  };

  return (
    <div className="space-y-3">
      {/* Quick Feedback Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleFeedback("positive")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
            feedbackGiven === "positive"
              ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
              : "border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50"
          }`}
          title="This pet is a good match"
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm font-medium">Good Match</span>
        </button>

        <button
          onClick={() => handleFeedback("negative")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
            feedbackGiven === "negative"
              ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
              : "border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50"
          }`}
          title="This pet is not a good match"
        >
          <ThumbsDown className="w-4 h-4" />
          <span className="text-sm font-medium">Not for Me</span>
        </button>

        {showChatButton && onChat && (
          <button
            onClick={onChat}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100 transition-all duration-200"
            title="Chat with shelter about this pet"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Chat</span>
          </button>
        )}
      </div>

      {/* Reason Input */}
      {showReasonInput && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why is this {feedbackGiven === "positive" ? "a good" : "not a good"} match?
            </label>
            
            {/* Quick Reason Buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              {quickReasons[feedbackGiven!].map((quickReason) => (
                <button
                  key={quickReason}
                  onClick={() => setReason(quickReason)}
                  className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  {quickReason}
                </button>
              ))}
            </div>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Tell us why this pet is ${feedbackGiven === "positive" ? "a good" : "not a good"} match...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={submitFeedback}
              disabled={!reason.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit Feedback
            </button>
            <button
              onClick={() => {
                setShowReasonInput(false);
                setReason("");
                setFeedbackGiven(null);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* AI Learning Indicator */}
      {feedbackGiven && (
        <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <span>Teaching AI about your preferences...</span>
        </div>
      )}
    </div>
  );
};
