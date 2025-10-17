import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/authStore";
import { useUserProfile } from "@/hooks/useUser";
import { useTheme } from "@/hooks/useTheme";
import { pageContainer, scrollContent, GUTTER } from "@/ui/layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuthStore();
  const {
    data: profile,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useUserProfile();
  const [avatarError, setAvatarError] = useState(false);
  const lastRefetchTime = useRef<number>(0);
  const refetchRef = useRef(refetch);

  // Update refetch ref when it changes
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  const PF = useMemo(() => ({ indigo: "#6366F1", violet: "#7C3AED" }), []);
  const shadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 3 },
    default: {},
  });

  const handleLogout = () => {
    if (__DEV__) {
      console.log("🚪 Logout button pressed");
    }

    // Use web-compatible confirmation for web environment
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to logout?");
      if (confirmed) {
        if (__DEV__) {
          console.log("🚪 Logout confirmed, executing logout...");
        }
        logout()
          .then(() => {
            router.replace("/(auth)/login");
          })
          .catch((error) => {
            if (__DEV__) {
              console.error("Logout error:", error);
            }
          });
      }
    } else {
      // Use native Alert for mobile
      Alert.alert("Logout", "Are you sure you want to logout?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            if (__DEV__) {
              console.log("🚪 Logout confirmed, executing logout...");
            }
            try {
              await logout();
              router.replace("/(auth)/login");
            } catch (error) {
              if (__DEV__) {
                console.error("Logout error:", error);
              }
            }
          },
        },
      ]);
    }
  };

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  // Prioritize fresh API data over cached user data
  const profileData = profile?.data || user;

  // Helper function to validate URI format
  const isValidUri = (uri: string | undefined): boolean => {
    if (!uri || typeof uri !== "string" || uri.trim() === "") {
      return false;
    }

    // Basic URI validation - must start with http/https
    return uri.startsWith("http://") || uri.startsWith("https://");
  };

  // Helper function to check if avatar is valid using allowlist approach
  const isValidAvatar = (avatarUrl: string | undefined): boolean => {
    if (!avatarUrl || !avatarUrl.trim()) return false;

    const lowerUrl = avatarUrl.toLowerCase();

    // Allowlist of trusted domains and patterns
    const allowedDomains = [
      "cdn.pawfectfriends.com", // Our CDN
      "res.cloudinary.com", // Cloudinary (specific subdomain)
      "cloudinary.com", // Cloudinary main domain
    ];

    // Check if URL starts with https:// or http://
    if (!lowerUrl.startsWith("http://") && !lowerUrl.startsWith("https://")) {
      return false;
    }

    // Check if URL matches any allowed domain exactly
    const isAllowedDomain = allowedDomains.some((domain) => {
      try {
        const url = new URL(avatarUrl);
        const hostname = url.hostname.toLowerCase();

        // Exact match or subdomain match
        return hostname === domain || hostname.endsWith(`.${domain}`);
      } catch {
        // Invalid URL
        return false;
      }
    });

    if (isAllowedDomain) {
      // Additional validation for Cloudinary URLs
      if (lowerUrl.includes("cloudinary.com")) {
        // Block URLs that contain random avatar patterns
        const randomAvatarPatterns = [
          "random", // Random in filename
          "default", // Default avatar
          "placeholder", // Placeholder avatar
          "sample", // Sample avatar
          "demo", // Demo avatar
        ];

        const hasRandomPattern = randomAvatarPatterns.some((pattern) =>
          lowerUrl.includes(pattern)
        );

        // If it has a random pattern, it's likely a random avatar
        if (hasRandomPattern) {
          return false;
        }
      }

      return true;
    }

    // Fallback: Block known random avatar services
    const blockedDomains = [
      "pravatar.cc",
      "placeholder.com",
      "via.placeholder.com",
      "ui-avatars.com",
      "dicebear.com",
      "gravatar.com",
      "robohash.org",
      "baconmockup.com",
      "placekitten.com",
      "picsum.photos",
      "randomuser.me",
      "thispersondoesnotexist.com",
      "fakeimg.pl",
      "loremflickr.com",
      "source.unsplash.com",
      "images.unsplash.com",
      "unsplash.com",
    ];

    // Use exact domain matching instead of includes() to avoid false positives
    try {
      const url = new URL(avatarUrl);
      const hostname = url.hostname.toLowerCase();

      return !blockedDomains.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
      );
    } catch {
      // Invalid URL
      return false;
    }
  };

  // Avatar state helper - returns clear states for rendering
  const avatarState = useMemo((): "initials" | "image" | "loading" => {
    // Priority 1: No profile API data → loading
    if (!profile?.data) {
      return "loading";
    }

    // Priority 2: Avatar error → initials
    if (avatarError) {
      return "initials";
    }

    // Priority 3: Invalid avatar URL → initials
    if (!isValidAvatar(profileData?.avatar)) {
      return "initials";
    }

    // Priority 4: Valid avatar → image
    return "image";
  }, [profile?.data, avatarError, profileData?.avatar]);

  // Track the last avatar URL to only reset error when URL actually changes
  const [lastAvatarUrl, setLastAvatarUrl] = useState<string | undefined>();

  useEffect(() => {
    const currentAvatarUrl = profileData?.avatar;

    // Only reset error if the URL actually changed to a different value
    if (currentAvatarUrl !== lastAvatarUrl) {
      if (__DEV__) {
        console.log(
          "🔄 Avatar URL changed from",
          lastAvatarUrl,
          "to",
          currentAvatarUrl
        );
      }

      // Reset error state when URL changes to give the new URL a chance
      if (currentAvatarUrl && avatarError) {
        if (__DEV__) {
          console.log("🔄 Resetting error state due to URL change");
        }
        setAvatarError(false);
      }

      setLastAvatarUrl(currentAvatarUrl);
    }
  }, [profileData?.avatar, avatarError, lastAvatarUrl]);

  // Debug component lifecycle
  useEffect(() => {
    if (__DEV__) {
      console.log("🔄 ProfileScreen mounted");
    }
    return () => {
      if (__DEV__) {
        console.log("🔄 ProfileScreen unmounting");
      }
    };
  }, []);

  // Refresh profile data when screen comes into focus
  // Only refetch if not already fetching and not recently refetched
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      const timeSinceLastRefetch = now - lastRefetchTime.current;

      // Only refetch if:
      // 1. Not currently fetching
      // 2. Haven't refetched in the last 5 seconds
      if (!isFetching && timeSinceLastRefetch > 5000) {
        if (__DEV__) {
          console.log("🔄 Refreshing profile data");
        }
        lastRefetchTime.current = now;
        refetchRef.current();
      }
    }, [isFetching])
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        { flex: 1, backgroundColor: colors.background },
        Platform.OS === "web" ? { paddingTop: 8 } : null,
      ]}
    >
      <ScrollView
        contentContainerStyle={scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={pageContainer}>
          {/* Banner */}
          <View style={{ paddingHorizontal: GUTTER, marginTop: 6 }}>
            <LinearGradient
              colors={[PF.indigo, PF.violet]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.hero, { borderRadius: 18 }]}
            >
              <Ionicons name="person" size={22} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}
                >
                  Your profile
                </Text>
                <Text style={{ color: "#EEF2FF", fontSize: 13 }}>
                  Manage your account, preferences and applications
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Profile header card */}
          <View style={{ paddingHorizontal: GUTTER }}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                shadow,
              ]}
            >
              {avatarState === "loading" ? (
                // Show loading placeholder while API data loads
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="person"
                    size={24}
                    color={colors.textSecondary}
                  />
                </View>
              ) : avatarState === "image" ? (
                <Image
                  source={{ uri: profileData?.avatar! }}
                  style={{ width: 56, height: 56, borderRadius: 28 }}
                  resizeMode="cover"
                  onError={() => {
                    if (__DEV__) {
                      console.log(
                        "Avatar image failed to load, falling back to initials"
                      );
                    }
                    setAvatarError(true);
                  }}
                />
              ) : (
                // avatarState === "initials"
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: PF.indigo,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 20,
                      fontWeight: "900",
                    }}
                  >
                    {profileData?.name?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "900",
                    fontSize: 16,
                  }}
                  numberOfLines={1}
                >
                  {profileData?.name || "User"}
                </Text>
                {!!profileData?.email && (
                  <Text
                    style={{ color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {profileData.email}
                  </Text>
                )}
                {profileData?.emailVerified && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 2,
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={12}
                      color={colors.success}
                    />
                    <Text
                      style={{
                        color: colors.success,
                        fontSize: 11,
                        marginLeft: 4,
                      }}
                    >
                      Verified
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/adoptions")}
                accessibilityRole="button"
                accessibilityLabel="View my adoption applications"
              >
                <View style={[styles.mini, { backgroundColor: "#EEF2FF" }]}>
                  <Ionicons name="paw" size={14} color={PF.indigo} />
                  <Text
                    style={{
                      color: PF.indigo,
                      fontWeight: "800",
                      fontSize: 12,
                    }}
                  >
                    My apps
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu groups */}
          <MenuGroup title="Account">
            <MenuItem
              icon="heart"
              label="Favorites"
              onPress={() => router.push("/(tabs)/favorites")}
              isFirst={true}
            />
            <MenuItem
              icon="paw"
              label="Adoptions"
              onPress={() => router.push("/(tabs)/adoptions")}
            />
            <MenuItem
              icon="person-circle"
              label="Edit profile"
              onPress={handleEditProfile}
            />
          </MenuGroup>

          <MenuGroup title="Preferences">
            <MenuItem
              icon="notifications"
              label="Notifications"
              onPress={() => router.push("/(tabs)/notifications")}
              isFirst={true}
            />
            <MenuItem
              icon="settings"
              label="Settings"
              onPress={() => router.push("/(tabs)/settings")}
            />
          </MenuGroup>

          <MenuGroup title="Help & Legal">
            <MenuItem
              icon="chatbubbles"
              label="Support"
              onPress={() => {
                Alert.alert(
                  "Coming Soon",
                  "Support screen will be available soon!"
                );
              }}
              isFirst={true}
            />
            <MenuItem
              icon="document-text"
              label="Terms & Privacy"
              onPress={() => {
                Alert.alert(
                  "Coming Soon",
                  "Terms & Privacy screen will be available soon!"
                );
              }}
            />
            <MenuItem
              icon="information-circle"
              label="About"
              onPress={() => {
                Alert.alert(
                  "About PawfectFriends",
                  "Version 1.0.0\n\nFind your perfect pet companion with PawfectFriends!"
                );
              }}
            />
          </MenuGroup>

          {/* Logout button */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <Pressable
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Log out"
              style={{ zIndex: 1000 }}
            >
              <LinearGradient
                colors={[PF.indigo, PF.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}
              >
                <Ionicons name="log-out" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  Log out
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          {isLoading && (
            <View style={{ paddingVertical: 20, zIndex: 1 }}>
              <LoadingSpinner />
            </View>
          )}

          {error && (
            <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
              <ErrorMessage
                message="Failed to load profile"
                onRetry={refetch}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuGroup({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      <Text
        style={{
          color: colors.text,
          fontWeight: "900",
          fontSize: 14,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  trailing,
  isFirst = false,
}: {
  icon: any;
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  isFirst?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: colors.surface,
          ...(isFirst
            ? {}
            : { borderTopWidth: 1, borderTopColor: colors.border }),
        }}
      >
        <Ionicons name={icon} size={18} color={colors.text} />
        <Text style={{ color: colors.text, fontWeight: "800", flex: 1 }}>
          {label}
        </Text>
        {trailing ?? (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  mini: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
