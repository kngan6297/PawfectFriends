import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/authStore";
import type { Pet } from "@/types";
import { petService } from "@/services/petService";
import { pageContainer, scrollContent, GUTTER } from "@/ui/layout";
import { petId } from "@/utils";

export default function PublicProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isAuthenticated, user, logout } = (useAuthStore?.() as any) ?? {
    isAuthenticated: false,
  };

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

  const goLogin = () => router.push("/(auth)/login");
  const goRegister = () => router.push("/(auth)/register");

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

  return (
    <SafeAreaView
      edges={["top"]} // ensure iOS has inset
      style={[
        { flex: 1, backgroundColor: colors.background },
        Platform.OS === "web" ? { paddingTop: 8 } : null, // web adds 8px top gap
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
                  {isAuthenticated
                    ? "Your profile"
                    : "Welcome to PawfectFriends"}
                </Text>
                <Text style={{ color: "#EEF2FF", fontSize: 13 }}>
                  {isAuthenticated
                    ? "Manage your account, preferences and applications"
                    : "Login or create an account to personalize your experience"}
                </Text>
              </View>
              {!isAuthenticated ? (
                <TouchableOpacity onPress={goLogin} accessibilityLabel="Login">
                  <View style={[styles.ctaGhost, shadow]}>
                    <Text style={{ color: "#111827", fontWeight: "900" }}>
                      Login
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : null}
            </LinearGradient>
          </View>

          {/* If logged in: profile header + menus */}
          {isAuthenticated ? (
            <>
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
                      uri: user?.avatar || "https://i.pravatar.cc/160",
                    }}
                    style={{ width: 56, height: 56, borderRadius: 28 }}
                    resizeMode="cover"
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
                      {user?.name || "Guest"}
                    </Text>
                    {!!user?.email && (
                      <Text
                        style={{ color: colors.textSecondary }}
                        numberOfLines={1}
                      >
                        {user.email}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push("/(guest-tabs)/adoptions")}
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
                  onPress={() => router.push("/(guest-tabs)/favorites")}
                />
                <MenuItem
                  icon="paw"
                  label="Adoptions"
                  onPress={() => router.push("/(guest-tabs)/adoptions")}
                />
                <MenuItem
                  icon="person-circle"
                  label="Edit profile"
                  onPress={() => router.push("/(guest-tabs)/profile/edit")}
                />
              </MenuGroup>

              <MenuGroup title="Preferences">
                <MenuItem
                  icon="notifications"
                  label="Notifications"
                  onPress={() =>
                    router.push("/(guest-tabs)/profile/notifications")
                  }
                />
              </MenuGroup>

              <MenuGroup title="Help & Legal">
                <MenuItem
                  icon="chatbubbles"
                  label="Support"
                  onPress={() => router.push("/(guest-tabs)/support")}
                />
                <MenuItem
                  icon="document-text"
                  label="Terms & Privacy"
                  onPress={() => router.push("/(guest-tabs)/legal")}
                />
              </MenuGroup>

              <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                <TouchableOpacity
                  onPress={async () =>
                    logout ? await logout() : router.push("/")
                  }
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
            </>
          ) : (
            // Not logged in: quick actions + why create account
            <>
              <View
                style={{ paddingHorizontal: GUTTER, marginTop: 16, gap: 10 }}
              >
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <QuickAction
                    label="Browse pets"
                    icon="search"
                    onPress={() => router.push("/(guest-tabs)/search")}
                  />
                  <QuickAction
                    label="Create account"
                    icon="person-add"
                    onPress={goRegister}
                  />
                </View>

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
                  <Ionicons name="star" size={18} color={PF.indigo} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: "900" }}>
                      Why create an account?
                    </Text>
                    <Text style={{ color: colors.textSecondary, marginTop: 6 }}>
                      Save favorites, track adoptions, and get updates from
                      shelters faster.
                    </Text>
                  </View>
                </View>
              </View>

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
                        <View
                          style={{ height: 110, backgroundColor: "#E5E7EB" }}
                        />
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
                        onPress={() =>
                          router.push(`/(guest-tabs)/pet/${petId(p)}`)
                        }
                      />
                    ))}
                  </View>
                )}
              </View>

              {/* Help card */}
              <View
                style={{
                  paddingHorizontal: 16,
                  marginTop: 12,
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Ionicons
                    name="help-circle-outline"
                    size={18}
                    color="#6366F1"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: "900" }}>
                      Need help?
                    </Text>
                    <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                      Visit Support to contact us or browse FAQs.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push("/(guest-tabs)/support")}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </>
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

function QuickAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: any;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const box = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 2 },
    default: {},
  });
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={label}
      style={{ flex: 1 }}
    >
      <View
        style={[
          {
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 12,
          },
          box,
        ]}
      >
        <Ionicons name={icon} size={16} color={colors.text} />
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 12 }}>
          {label}
        </Text>
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
  ctaGhost: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
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
  petCard: {
    width: 140,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  petImage: {
    width: "100%",
    height: 100,
  },
});
