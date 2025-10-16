import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { pageContainer, scrollContent, GUTTER, PAGE_MAX } from "@/ui/layout";
import { petService } from "@/services/petService";
import { Pet } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { petId } from "@/utils";
import { adoptionStatusBadges } from "@/constants";

// --- Types ---
type AppStatus = "submitted" | "reviewing" | "approved" | "declined";
interface AdoptionApp {
  id: string | number;
  pet: Pet;
  status: AppStatus;
  updatedAt?: string;
}

export default function PublicAdoptionsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore?.() ?? { isAuthenticated: false };

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

  const [apps, setApps] = useState<AdoptionApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | AppStatus>("all");
  const [suggested, setSuggested] = useState<Pet[]>([]);
  const [suggLoading, setSuggLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchApps = useCallback(async () => {
    try {
      setLoading(true);
      // If you have an adoption service, replace here
      const svc: any = (petService as any).getMyAdoptionApps;
      if (svc) {
        const res = await svc();
        if (res?.success && res?.data) {
          setApps(res.data);
          return;
        }
      }
      // Fallback demo: map latest pets -> fake applications
      const latest = await petService.getLatestPets(6);
      const pool: AppStatus[] = [
        "submitted",
        "reviewing",
        "approved",
        "declined",
      ];
      const demo: AdoptionApp[] = (latest?.data ?? []).map(
        (p: Pet, i: number) => ({
          id: (p as any).id ?? i,
          pet: p,
          status: pool[i % pool.length],
          updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
        })
      );
      setApps(demo);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchApps();
  }, [isAuthenticated, fetchApps]);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchApps();
    setRefreshing(false);
  }, [fetchApps]);

  const goLogin = () => router.push("/(auth)/login");
  const goSearch = () => router.push("/(guest-tabs)/search");
  const goSearchSpecies = (s?: "dog" | "cat" | "other") =>
    router.push({
      pathname: "/(guest-tabs)/search",
      params: { species: s ?? "all" },
    } as any);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      router.push({
        pathname: "/(guest-tabs)/search",
        params: { q: searchQuery.trim() },
      } as any);
    }
  }, [router, searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  // --- Not logged in UI ---
  if (!isAuthenticated) {
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
            {/* Purple banner */}
            <View style={{ paddingHorizontal: GUTTER, marginTop: 6 }}>
              <LinearGradient
                colors={[PF.indigo, PF.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.hero, { borderRadius: 18 }]}
              >
                <Ionicons name="paw" size={22} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}
                  >
                    Track your adoptions
                  </Text>
                  <Text style={{ color: "#EEF2FF", fontSize: 13 }}>
                    Login to view and manage your applications in one place.
                  </Text>
                </View>
                <TouchableOpacity onPress={goLogin}>
                  <View style={[styles.ctaGhost, shadow]}>
                    <Text style={{ color: "#111827", fontWeight: "900" }}>
                      Login
                    </Text>
                  </View>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* How it works */}
            <View style={{ paddingHorizontal: GUTTER, marginTop: 10 }}>
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
                <Ionicons
                  name="help-circle-outline"
                  size={18}
                  color={PF.indigo}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "900" }}>
                    How it works
                  </Text>
                  <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                    Apply from a pet page → get updates here → chat with
                    shelter.
                  </Text>
                </View>
              </View>
            </View>

            {/* Search Bar */}
            <View style={{ paddingHorizontal: GUTTER, marginTop: 10 }}>
              <View
                style={[
                  styles.searchCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  shadow,
                ]}
              >
                <Ionicons name="search" size={18} color="#6B7280" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by name, breed, location..."
                  placeholderTextColor="#9CA3AF"
                  style={[styles.searchInput, { color: colors.text }]}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                  accessibilityLabel="Search input"
                />
                {!!searchQuery && (
                  <TouchableOpacity
                    onPress={clearSearch}
                    accessibilityLabel="Clear search"
                  >
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleSearch}
                  style={styles.searchGo}
                  accessibilityLabel="Run search"
                >
                  <Text style={styles.searchGoText}>Search</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Chips */}
            <View style={{ marginTop: 12 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 8 }}
              >
                {[
                  { key: "all", label: "All" },
                  { key: "dog", label: "Dogs" },
                  { key: "cat", label: "Cats" },
                  { key: "other", label: "Other" },
                ].map((c) => (
                  <Chip
                    key={c.key}
                    label={c.label}
                    active={c.key === "all"}
                    onPress={() => goSearchSpecies(c.key as any)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Suggested + CTA */}
            <View style={{ paddingHorizontal: GUTTER, marginTop: 16 }}>
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
                        style={{ height: 120, backgroundColor: "#E5E7EB" }}
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
                    <TouchableOpacity
                      key={String((p as any).id ?? Math.random())}
                      onPress={() => {
                        const id = petId(p as any);
                        router.push(`/(guest-tabs)/pet/${id}`);
                      }}
                      style={{ flex: 1 }}
                    >
                      <View
                        style={[
                          {
                            borderRadius: 16,
                            overflow: "hidden",
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                          },
                          shadow,
                        ]}
                      >
                        <Image
                          source={{
                            uri:
                              (p as any)?.photos?.[0]?.url ||
                              "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80",
                          }}
                          style={{ width: "100%", height: 120 }}
                        />
                        <View style={{ padding: 10 }}>
                          <Text
                            style={{ fontWeight: "900", color: colors.text }}
                            numberOfLines={1}
                          >
                            {(p as any).name}
                          </Text>
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 12,
                            }}
                            numberOfLines={1}
                          >
                            {[
                              (p as any).breeds?.primary ?? (p as any).breed,
                              (p as any).age,
                              (p as any).gender,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* CTA: chỉ còn Browse pets (gradient), bỏ Login thứ hai */}
              <TouchableOpacity onPress={goSearch} style={{ marginTop: 12 }}>
                <LinearGradient
                  colors={[PF.indigo, PF.violet]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loginBtnGrad}
                >
                  <Ionicons name="search" size={16} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "900" }}>
                    Browse pets
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Logged in UI ---
  const filtered =
    filter === "all" ? apps : apps.filter((a) => a.status === filter);

  return (
    <SafeAreaView
      edges={["top"]} // ensure iOS has inset
      style={[
        { flex: 1, backgroundColor: colors.background },
        Platform.OS === "web" ? { paddingTop: 8 } : null, // web adds 8px top gap
      ]}
    >
      <FlatList
        data={filtered}
        keyExtractor={(it) => String(it.id)}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <AppCard
            app={item}
            onPress={() => {
              const id = petId(item.pet as any);
              router.push(`/(guest-tabs)/pet/${id}`);
            }}
          />
        )}
        // Header/Text above, remove internal paddingHorizontal,
        // because it is already in contentContainerStyle
        ListHeaderComponent={
          <>
            {/* Title */}
            <View style={{ paddingTop: 4, paddingBottom: 6 }}>
              <Text
                style={{ fontSize: 22, fontWeight: "900", color: colors.text }}
              >
                Adoptions
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                {apps.length} application{apps.length === 1 ? "" : "s"}
              </Text>
            </View>

            {/* Filters */}
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                paddingBottom: 6,
              }}
            >
              {[
                { k: "all", label: "All" },
                { k: "submitted", label: "Submitted" },
                { k: "reviewing", label: "Reviewing" },
                { k: "approved", label: "Approved" },
                { k: "declined", label: "Declined" },
              ].map((c: any) => (
                <TouchableOpacity key={c.k} onPress={() => setFilter(c.k)}>
                  <View
                    style={[
                      styles.chip,
                      filter === c.k ? styles.chipActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filter === c.k ? styles.chipTextActive : null,
                      ]}
                    >
                      {c.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: "center" }}>
            <Ionicons name="paw" size={26} color={colors.textSecondary} />
            <Text style={{ marginTop: 8, color: colors.textSecondary }}>
              No applications yet.
            </Text>
          </View>
        }
        ListFooterComponent={
          loading && hasMore ? (
            <View style={{ padding: 16, alignItems: "center" }}>
              <Text style={{ color: colors.textSecondary }}>
                Loading more...
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PF.indigo}
          />
        }
        // gather all horizontal padding here + fix maxWidth
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: 64,
          paddingHorizontal: GUTTER,
          maxWidth: PAGE_MAX,
          width: "100%",
          alignSelf: "center",
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function AppCard({ app, onPress }: { app: AdoptionApp; onPress: () => void }) {
  const { colors } = useTheme();
  const img =
    app.pet?.photos?.[0]?.url ||
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80";
  const status = badgeFor(app.status);
  const boxShadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
    },
    android: { elevation: 2 },
    default: {},
  });
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={`Open ${(app.pet as any).name}`}
    >
      <View
        style={[
          {
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          },
          boxShadow,
        ]}
      >
        <Image
          source={{ uri: img }}
          style={{ width: "100%", height: 140 }}
          resizeMode="cover"
        />
        <View style={{ padding: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{ fontWeight: "900", color: colors.text, fontSize: 16 }}
              numberOfLines={1}
            >
              {(app.pet as any).name}
            </Text>
            <View style={[styles.badge, { backgroundColor: status.bg }]}>
              <Text style={[styles.badgeText, { color: status.fg }]}>
                {status.label}
              </Text>
            </View>
          </View>
          <Text
            style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}
            numberOfLines={1}
          >
            {[
              (app.pet as any).breeds?.primary ?? (app.pet as any).breed,
              (app.pet as any).age,
              (app.pet as any).gender,
            ]
              .filter(Boolean)
              .join(" • ")}
          </Text>
          {!!app.updatedAt && (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                marginTop: 6,
              }}
            >
              Updated {timeAgo(app.updatedAt)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function badgeFor(s: AppStatus) {
  return adoptionStatusBadges[s] || adoptionStatusBadges.submitted;
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityLabel={label}>
      <View style={[styles.chip, active ? styles.chipActive : null]}>
        <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
          {label}
        </Text>
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
    gap: 10,
    alignItems: "center",
  },
  // Search bar
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },
  searchGo: {
    backgroundColor: "#6366F1",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchGoText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  chipActive: { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  chipText: { fontWeight: "800", color: "#111827", fontSize: 12 },
  chipTextActive: { color: "#fff" },

  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "900" },

  browseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
  },
  loginBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
