import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { generateCallId, generateRoomId } from "@/config/zegoCloud";
import { useCommunicationPermissions } from "@/utils/chatPermissions";
import { adoptionService } from "@/services/adoption.service";
import { chatService } from "@/services/chat.service";
import { useToastContext } from "@/components/ui/ToastProvider";

interface ContactShelterButtonsProps {
  shelterId?: string;
  shelterName?: string;
  petId?: string;
  petName?: string;
  className?: string;
}

export const ContactShelterButtons: React.FC<ContactShelterButtonsProps> = ({
  shelterId,
  shelterName,
  petId,
  petName,
  className = "",
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasAdoptionRequest, setHasAdoptionRequest] = useState(false);
  const [hasCompletedAdoption, setHasCompletedAdoption] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToastContext();

  // Check communication permissions
  const {
    canCommunicate,
    reason,
    requiresAdoptionRequest,
    buttonState,
    permissionMessage,
  } = useCommunicationPermissions(
    user,
    "shelter",
    hasAdoptionRequest,
    hasCompletedAdoption
  );

  // Check adoption status on component mount
  useEffect(() => {
    const checkAdoptionStatus = async () => {
      if (!user || !shelterId) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has adoption request or completed adoption with this shelter
        const adoptionStatus = await adoptionService.checkUserAdoptionStatus(
          user._id || user.email,
          shelterId,
          petId
        );
        setHasAdoptionRequest(adoptionStatus.hasRequest);
        setHasCompletedAdoption(adoptionStatus.hasCompleted);
      } catch (error) {
        console.error("Error checking adoption status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdoptionStatus();
  }, [user, shelterId, petId]);

  // Don't show if user is not logged in
  if (!user) {
    return (
      <div className={`space-y-2 ${className}`}>
        <p className="text-sm text-gray-600">
          Please log in to contact the shelter
        </p>
        <Button onClick={() => navigate("/login")} variant="primary" size="sm">
          Log In to Contact
        </Button>
      </div>
    );
  }

  // Note: Removed the email ID check since we now allow chat/call for all logged-in users

  const handleVideoCall = () => {
    if (!canCommunicate) return;

    const callId = generateCallId();
    const params = new URLSearchParams({
      callId,
      shelter: shelterId || "",
      pet: petId || "",
      petName: petName || "",
      shelterName: shelterName || "",
      targetUserId: shelterId || "",
      contextType: "pet",
      contextId: petId || "",
    });
    navigate(`/call?${params.toString()}`);
  };

  const handleAudioCall = () => {
    if (!canCommunicate) return;

    const callId = generateCallId();
    const params = new URLSearchParams({
      callId,
      type: "audio",
      shelter: shelterId || "",
      pet: petId || "",
      petName: petName || "",
      shelterName: shelterName || "",
      targetUserId: shelterId || "",
      contextType: "pet",
      contextId: petId || "",
    });
    navigate(`/call?${params.toString()}`);
  };

  const handleChat = async () => {
    if (!canCommunicate || !user) return;

    try {
      // Create a new conversation with the shelter
      const conversation = await chatService.createChat(
        shelterId!,
        user.id,
        `Hi! I'm interested in ${petName}. Can you tell me more about the adoption process?`,
        petId,
        petName
      );

      // Navigate to the chat with the conversation ID
      navigate(`/chat/${conversation.id}`);
    } catch (error: any) {
      console.error("Failed to create chat:", error);

      // Handle specific error cases
      if (error.message?.includes("already exists")) {
        showToast({
          type: "info",
          title: "Chat Already Exists",
          message:
            "You already have a conversation with this shelter. Opening existing chat...",
        });
        // Navigate to chat page to show existing conversations
        navigate("/chat");
      } else {
        showToast({
          type: "error",
          title: "Failed to Create Chat",
          message: "Unable to start a conversation. Please try again.",
        });
        // Fallback to regular chat page if creation fails
        navigate("/chat");
      }
    }
  };

  const handleAdoptionRequest = () => {
    navigate(`/pets/${petId}/adopt`);
  };

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Contact {shelterName || "Shelter"}
        </h3>
        {petName && <p className="text-sm text-gray-600">About {petName}</p>}
      </div>

      {/* Permission message */}
      {!canCommunicate && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-yellow-800 mb-2">{permissionMessage}</p>
              {requiresAdoptionRequest && (
                <Button
                  onClick={handleAdoptionRequest}
                  variant="outline"
                  size="sm"
                  className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                >
                  Submit Adoption Request
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Communication buttons */}
      {buttonState.visible && (
        <div className="grid grid-cols-1 gap-2">
          {/* Video Call Button */}
          <Button
            onClick={handleVideoCall}
            variant={buttonState.enabled ? "primary" : "outline"}
            size="sm"
            className={`w-full flex items-center justify-center ${
              !buttonState.enabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!buttonState.enabled}
            title={buttonState.tooltip}
          >
            <Video className="h-4 w-4 mr-2" />
            Video Call
          </Button>

          {/* Audio Call Button */}
          <Button
            onClick={handleAudioCall}
            variant={buttonState.enabled ? "secondary" : "outline"}
            size="sm"
            className={`w-full flex items-center justify-center ${
              !buttonState.enabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!buttonState.enabled}
            title={buttonState.tooltip}
          >
            <Phone className="h-4 w-4 mr-2" />
            Audio Call
          </Button>

          {/* Chat Button */}
          <Button
            onClick={handleChat}
            variant="outline"
            size="sm"
            className={`w-full flex items-center justify-center ${
              !buttonState.enabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!buttonState.enabled}
            title={buttonState.tooltip}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
        </div>
      )}

      {canCommunicate && (
        <div className="text-xs text-gray-500 text-center mt-2">
          <p>Secure communication powered by ZegoCloud</p>
          <p className="mt-1">
            💡 After learning more, consider submitting an adoption request
          </p>
        </div>
      )}
    </div>
  );
};
