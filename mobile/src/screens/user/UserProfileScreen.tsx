import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/authStore";
import { useUserProfile } from "@/hooks/useUser";
import { useTheme } from "@/hooks/useTheme";
import { petService } from "@/services/petService";
import { pageContainer, scrollContent, GUTTER } from "@/ui/layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { Pet } from "@/types";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuthStore();
  const { data: profile, isLoading, error, refetch } = useUserProfile();

  const [suggested, setSuggested] = useState<Pet[]>([]);
  const [suggLoading, setSuggLoading] = useState(false);

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
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  useEffect(() => {
    (async () => {
      try {
        setSuggLoading(true);
        const res = await petService.getLatestPets(6);
        setSuggested(res?.data ?? []);
      } finally {
        setSuggLoading(false);
      }
    })();
  }, []);

  const profileData = profile?.data || user;

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
              <Image
                source={{
                  uri: profileData?.avatar || "https://i.pravatar.cc/160",
                }}
                style={{ width: 56, height: 56, borderRadius: 28 }}
              />
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
              onPress={() => {
                Alert.alert(
                  "Coming Soon",
                  "Notifications settings will be available soon!"
                );
              }}
            />
            <MenuItem
              icon="settings"
              label="Settings"
              onPress={() => {
                Alert.alert(
                  "Coming Soon",
                  "Settings screen will be available soon!"
                );
              }}
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

          {/* Suggested for you */}
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "900",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Suggested for you
            </Text>

            {suggLoading ? (
              <View style={{ flexDirection: "row", gap: 12 }}>
                {[0, 1].map((i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      borderRadius: 16,
                      overflow: "hidden",
                      backgroundColor: "#F3F4F6",
                    }}
                  >
                    <View style={{ height: 110, backgroundColor: "#E5E7EB" }} />
                    <View style={{ padding: 10, gap: 8 }}>
                      <View
                        style={{
                          width: 100,
                          height: 12,
                          backgroundColor: "#E5E7EB",
                          borderRadius: 6,
                        }}
                      />
                      <View
                        style={{
                          width: 80,
                          height: 10,
                          backgroundColor: "#E5E7EB",
                          borderRadius: 6,
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ flexDirection: "row", gap: 12 }}>
                {suggested.slice(0, 2).map((p) => (
                  <MiniPetCard
                    key={String((p as any).id ?? Math.random())}
                    pet={p}
                    onPress={() => router.push(`/pet/${(p as any).id}`)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Logout button */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <TouchableOpacity
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Log out"
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
            </TouchableOpacity>
          </View>

          {isLoading && (
            <View style={{ paddingVertical: 20 }}>
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
}: {
  icon: any;
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} accessibilityLabel={label}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: colors.surface,
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

function MiniPetCard({ pet, onPress }: { pet: Pet; onPress: () => void }) {
  const { colors } = useTheme();
  const img =
    (pet as any)?.photos?.[0]?.url ||
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80";

  return (
    <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
      <View
        style={{
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Image
          source={{ uri: img }}
          style={{ width: "100%", height: 110 }}
          resizeMode="cover"
        />
        <View style={{ padding: 10 }}>
          <Text
            style={{ fontWeight: "900", color: colors.text }}
            numberOfLines={1}
          >
            {(pet as any).name}
          </Text>
          <Text
            style={{ color: colors.textSecondary, fontSize: 12 }}
            numberOfLines={1}
          >
            {[
              (pet as any).breeds?.primary ?? (pet as any).breed,
              (pet as any).age,
              (pet as any).gender,
            ]
              .filter(Boolean)
              .join(" • ")}
          </Text>
        </View>
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
