import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "react-router-dom";

const CommunicationPage: React.FC = () => {
  const { user } = useAuth();
  const [communicationUrl, setCommunicationUrl] = useState("");
  const [searchParams] = useSearchParams();

  console.log("🔍 CommunicationPage - Component mounted");
  console.log("🔍 CommunicationPage - User:", user);
  console.log("🔍 CommunicationPage - Search params:", Object.fromEntries(searchParams.entries()));

  useEffect(() => {
    console.log("🔍 CommunicationPage - useEffect triggered");
    
    // Set the communication URL based on environment
    let url = import.meta.env.DEV
      ? `http://localhost:${import.meta.env.VITE_COMMUNICATION_PORT || "3000"}`
      : import.meta.env.VITE_COMMUNICATION_URL || "/communication";

    console.log("🔍 CommunicationPage - Base URL:", url);
    console.log("🔍 CommunicationPage - Environment:", {
      DEV: import.meta.env.DEV,
      VITE_COMMUNICATION_PORT: import.meta.env.VITE_COMMUNICATION_PORT,
      VITE_COMMUNICATION_URL: import.meta.env.VITE_COMMUNICATION_URL
    });

    // Add URL parameters if they exist
    const petId = searchParams.get("petId");
    const shelterId = searchParams.get("shelterId");

    console.log("🔍 CommunicationPage - URL params:", { petId, shelterId });

    if (petId || shelterId) {
      const params = new URLSearchParams();
      if (petId) params.append("petId", petId);
      if (shelterId) params.append("shelterId", shelterId);
      url += `?${params.toString()}`;
    }

    console.log("🔍 CommunicationPage - Final URL:", url);
    setCommunicationUrl(url);

    // Share user data and token with communication app
    if (user) {
      const token = localStorage.getItem("token");
      
      // Handle different user data structures
      const userData = user.data || user; // Handle both {data: {...}} and direct user object
      
      const authData = {
        userId: userData._id || userData.id,
        userName: userData.name,
        userAvatar: userData.avatar,
        userRole: userData.role || user.role,
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
      
      // Handle different user data structures
      const userData = user.data || user; // Handle both {data: {...}} and direct user object
      
      const authData = {
        userId: userData._id || userData.id,
        userName: userData.name,
        userAvatar: userData.avatar,
        userRole: userData.role || user.role,
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
