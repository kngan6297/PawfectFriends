import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import GuestHomeScreen from "@/screens/guest/GuestHomeScreen";

export default function GuestHomeWrapper() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const { colors } = useTheme();

  // Wait for store to hydrate
  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // If already hydrated, set immediately
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return unsubscribe;
  }, []);

  // Show loading state while checking authentication or hydrating
  if (isLoading || !isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If user is authenticated, redirect to authenticated home
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  // Show guest home screen for unauthenticated users
  return <GuestHomeScreen />;
}
