import React from "react";
import { useAuthStore } from "@/store/authStore";
import GuestPetDetailScreen from "@/screens/guest/GuestPetDetailScreen";
import UserPetDetailScreen from "@/screens/user/UserPetDetailScreen";

export default function PetDetailScreen() {
  const { isAuthenticated } = useAuthStore?.() ?? { isAuthenticated: false };

  if (isAuthenticated) {
    return <UserPetDetailScreen />;
  }

  return <GuestPetDetailScreen />;
}
