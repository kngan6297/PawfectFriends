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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { pageContainer, scrollContent, GUTTER, PAGE_MAX } from "@/ui/layout";
import { petService } from "@/services/petService";
import { Pet } from "@/types";
import { useAdoptionRequests } from "@/hooks/useAdoptions";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { adoptionStatusBadges } from "@/constants";
import { useAuthStore } from "@/store/authStore";
import { petId } from "@/utils";

// --- Types ---
type AppStatus =
  | "pending"
  | "approved"
  | "scheduled"
  | "completed"
  | "rejected";
interface AdoptionApp {
  id: string | number;
  pet: Pet;
  status: AppStatus;
  updatedAt?: string;
  petDetails?: any;
  shelterDetails?: any;
  meetings?: any[];
  createdAt?: string;
}

export default function UserAdoptionsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useAdoptionRequests();
  const { user, isAuthenticated } = useAuthStore();

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

  const fetchApps = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔍 UserAdoptionsScreen - Raw hook data:", {
        data,
        isLoading,
        error,
        hasData: !!data,
        hasDataData: !!data?.data,
        isArray: Array.isArray(data),
        dataLength: Array.isArray(data) ? data.length : undefined,
        dataDataType: typeof data?.data,
        dataDataLength: Array.isArray(data?.data)
          ? data.data.length
          : undefined,
      });

      // Handle PaginatedResponse structure
      const adoptionRequests = data?.data || data;

      if (
        adoptionRequests &&
        Array.isArray(adoptionRequests) &&
        adoptionRequests.length > 0
      ) {
        console.log(
          "📊 Processing adoption requests:",
          adoptionRequests.length
        );
        console.log("📋 First request sample:", adoptionRequests[0]);

        // Transform the adoption requests data to match the expected format
        const transformedApps: AdoptionApp[] = adoptionRequests.map(
          (request: any) => {
            console.log("🔄 Processing request:", {
              id: request._id || request.id,
              pet: request.pet,
              petDetails: request.petDetails,
              status: request.status,
              petName: request.petDetails?.name || request.pet?.name,
              petPhotos:
                request.petDetails?.photos?.length ||
                request.pet?.photos?.length ||
                0,
            });

            return {
              id: request._id || request.id,
              pet: {
                id:
                  request.petDetails?._id ||
                  request.petDetails?.id ||
                  request.pet?._id ||
                  request.pet?.id ||
                  request.petId,
                name:
                  request.petDetails?.name ||
                  request.pet?.name ||
                  "Unknown Pet",
                photos:
                  request.petDetails?.photos ||
                  request.pet?.photos ||
                  request.pet?.images ||
                  [],
                breeds: request.petDetails?.breeds ||
                  request.pet?.breeds || {
                    primary: request.petDetails?.breed || request.pet?.breed,
                  },
                age: request.petDetails?.age || request.pet?.age,
                gender: request.petDetails?.gender || request.pet?.gender,
              } as Pet,
              status: request.status as AppStatus,
              updatedAt: request.updatedAt || request.updated_at,
              petDetails: request.petDetails || request.pet,
              shelterDetails: request.shelterDetails || request.shelter,
              meetings: request.meetings || [],
              createdAt: request.createdAt || request.created_at,
            };
          }
        );

        console.log("✅ Transformed apps:", transformedApps.length);
        console.log("📋 First transformed app:", transformedApps[0]);
        setApps(transformedApps);
        return;
      }

      // If no data, set empty array
      console.log("❌ No valid data found, setting empty array");
      console.log("📋 Data structure:", {
        data,
        hasData: !!data,
        hasDataData: !!data?.data,
        dataType: typeof data,
        adoptionRequests,
        adoptionRequestsType: typeof adoptionRequests,
        adoptionRequestsLength: Array.isArray(adoptionRequests)
          ? adoptionRequests.length
          : undefined,
      });
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

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
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const goSearch = () => router.push("/(tabs)/search");
  const goSearchSpecies = (s?: "dog" | "cat" | "other") =>
    router.push({
      pathname: "/(tabs)/search",
      params: { species: s ?? "all" },
    } as any);

  // --- Logged in UI ---
  const filtered =
    filter === "all" ? apps : apps.filter((a) => a.status === filter);

  if (isLoading && !data) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={[
          { flex: 1, backgroundColor: colors.background },
          Platform.OS === "web" ? { paddingTop: 8 } : null,
        ]}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <LoadingSpinner />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={[
          { flex: 1, backgroundColor: colors.background },
          Platform.OS === "web" ? { paddingTop: 8 } : null,
        ]}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <ErrorMessage
            message="Failed to load adoption requests"
            onRetry={onRefresh}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        { flex: 1, backgroundColor: colors.background },
        Platform.OS === "web" ? { paddingTop: 8 } : null,
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
              router.push(`/(tabs)/pet/${id}`);
            }}
          />
        )}
        ListHeaderComponent={
          <>
            {/* Hero Section */}
            <View style={{ marginTop: 6 }}>
              <LinearGradient
                colors={[PF.indigo, PF.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.hero, { borderRadius: 18 }]}
              >
                <Ionicons name="heart-circle" size={22} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}
                  >
                    My Adoptions
                  </Text>
                  <Text style={{ color: "#EEF2FF", fontSize: 13 }}>
                    Track your adoption journey
                  </Text>
                </View>
                <TouchableOpacity onPress={() => router.push("/(tabs)/search")}>
                  <View style={[styles.ctaGhost, shadow]}>
                    <Text style={{ color: "#111827", fontWeight: "900" }}>
                      Browse
                    </Text>
                  </View>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Filters */}
            <View style={{ marginTop: 8 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {[
                  { k: "all", label: "All" },
                  { k: "pending", label: "Pending" },
                  { k: "approved", label: "Approved" },
                  { k: "scheduled", label: "Scheduled" },
                  { k: "completed", label: "Completed" },
                  { k: "rejected", label: "Rejected" },
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
              </ScrollView>
            </View>

            {/* Section header */}
            <View
              style={{
                marginTop: 12,
                paddingBottom: 4,
              }}
            >
              <Text
                style={{ fontSize: 22, fontWeight: "900", color: colors.text }}
              >
                Your Applications
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                {apps.length} application{apps.length === 1 ? "" : "s"}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: "center" }}>
            <Ionicons name="paw" size={26} color={colors.textSecondary} />
            <Text style={{ marginTop: 8, color: colors.textSecondary }}>
              No applications yet.
            </Text>
            <TouchableOpacity onPress={goSearch} style={{ marginTop: 16 }}>
              <LinearGradient
                colors={[PF.indigo, PF.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginBtnGrad}
              >
                <Ionicons name="search" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  Browse Pets
                </Text>
              </LinearGradient>
            </TouchableOpacity>
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
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: 64,
          paddingHorizontal: GUTTER, // ✅ gives both header + item the same margin
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
  // Map UserAdoptionsScreen statuses to GuestAdoptionsScreen statuses
  const statusMap: Record<AppStatus, keyof typeof adoptionStatusBadges> = {
    pending: "submitted",
    approved: "approved",
    scheduled: "reviewing",
    completed: "approved",
    rejected: "declined",
  };

  const mappedStatus = statusMap[s];
  return adoptionStatusBadges[mappedStatus] || adoptionStatusBadges.submitted;
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },
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

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
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
