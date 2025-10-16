import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const { colors } = useTheme();

  // Wait for store to hydrate
  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      console.log("Store hydration completed");
      setIsHydrated(true);
    });

    // If already hydrated, set immediately
    if (useAuthStore.persist.hasHydrated()) {
      console.log("Store already hydrated");
      setIsHydrated(true);
    }

    return unsubscribe;
  }, []);

  // Force re-render when auth state changes after hydration
  useEffect(() => {
    if (isHydrated) {
      console.log("Hydration complete, auth state:", {
        isAuthenticated,
        isLoading,
      });
    }
  }, [isHydrated, isAuthenticated, isLoading]);

  // Debug authentication state
  useEffect(() => {
    console.log(
      "Index component state:",
      "\n  isAuthenticated:",
      isAuthenticated,
      "\n  isLoading:",
      isLoading,
      "\n  isHydrated:",
      isHydrated,
      "\n  Should redirect to:",
      !isAuthenticated ? "/(guest-tabs)/home" : "/(tabs)/home",
      "\n  Will show loading?",
      isLoading || !isHydrated
    );
  }, [isAuthenticated, isLoading, isHydrated]);

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

  // Redirect to guest tabs for unauthenticated users
  // This allows users to browse pets with tab navigation without logging in
  if (!isAuthenticated) {
    console.log("Redirecting to guest home");
    return <Redirect href="/(guest-tabs)/home" />;
  }

  // Redirect to authenticated tabs for logged-in users
  console.log("Redirecting to authenticated home");
  return <Redirect href="/(tabs)/home" />;
}
