import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "react-router-dom";

const CommunicationPage: React.FC = () => {
  const { user } = useAuth();
  const [communicationUrl, setCommunicationUrl] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Set the communication URL based on environment
    let url = import.meta.env.DEV
      ? `http://localhost:${import.meta.env.VITE_COMMUNICATION_PORT || "3000"}`
      : import.meta.env.VITE_COMMUNICATION_URL || "/communication";

    // Add URL parameters if they exist
    const petId = searchParams.get("petId");
    const shelterId = searchParams.get("shelterId");

    if (petId || shelterId) {
      const params = new URLSearchParams();
      if (petId) params.append("petId", petId);
      if (shelterId) params.append("shelterId", shelterId);
      url += `?${params.toString()}`;
    }

    setCommunicationUrl(url);

    // Share user data and token with communication app
    if (user) {
      const token = localStorage.getItem("token");
      const authData = {
        userId: user._id,
        userName: user.name,
        userAvatar: user.avatar,
        userRole: user.role,
        token: token, // Include the authentication token
        timestamp: Date.now(),
      };
      console.log("🔐 Storing auth data for chat app:", authData);
      localStorage.setItem("pawfect-friends-auth", JSON.stringify(authData));
      console.log("✅ Auth data stored successfully");
    } else {
      console.log("❌ No user data available to share with chat app");
    }
  }, [user, searchParams]);

  // Send auth data to iframe when it loads
  const handleIframeLoad = () => {
    if (user) {
      const token = localStorage.getItem("token");
      const authData = {
        userId: user._id,
        userName: user.name,
        userAvatar: user.avatar,
        userRole: user.role,
        token: token,
        timestamp: Date.now(),
      };

      console.log("📤 Sending auth data to iframe:", authData);

      // Send auth data to the iframe
      const iframe = document.querySelector("iframe");
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: "PAWFECT_AUTH_DATA",
            data: authData,
          },
          "*"
        );
        console.log("✅ Auth data sent to iframe successfully");
      }
    }
  };

  if (!communicationUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Communication Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <iframe
        src={communicationUrl}
        className="w-full h-full border-0"
        title="Communication Center"
        allow="camera; microphone; geolocation"
        onLoad={handleIframeLoad}
      />
    </div>
  );
};

export default CommunicationPage;
