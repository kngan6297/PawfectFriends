import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { metaOf, MiniTag, Chip } from "@/ui";
import { petService } from "@/services/petService";
import { Pet, Species } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { petId } from "@/utils";
import { petFilters } from "@/constants";

const { width } = Dimensions.get("window");

export default function PublicSearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const PF = useMemo(
    () => ({
      blue: "#3B82F6",
      indigo: "#6366F1",
      violet: "#7C3AED",
    }),
    []
  );

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

  // state
  const [query, setQuery] = useState((params.q as string) || "");
  const [species, setSpecies] = useState<Species>(
    (params.species as Species) || "all"
  );
  const [pets, setPets] = useState<Pet[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // debounce typing and race condition handling
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef<number>(0);
  const endReachedLockRef = useRef<boolean>(false);
  const startNewSearchRef = useRef<typeof startNewSearch>();
  const isInitialMountRef = useRef<boolean>(true);

  const onChangeQuery = (text: string) => {
    setQuery(text);
  };

  const fetchPage = useCallback(
    async (p: number, q = query, s = species, replace = false) => {
      if (loading) {
        if (__DEV__) {
          console.log("Already loading, skipping fetchPage");
        }
        return;
      }

      // Generate unique request ID for race condition handling
      const currentRequestId = ++requestIdRef.current;

      try {
        setLoading(true);
        setError(null);

        if (__DEV__) {
          console.log("Search params:", {
            query: q,
            species: s,
            page: p,
            requestId: currentRequestId,
          });
        }

        // Build search parameters - exclude type field when species is "all"
        const searchParams: {
          query: string;
          page: number;
          limit: number;
          type?: string;
        } = {
          query: q,
          page: p,
          limit: 10,
        };

        // Only add type field if species is not "all"
        if (s !== "all") {
          searchParams.type = s; // Direct mapping: dog -> "dog", cat -> "cat", other -> "other"
        }

        if (__DEV__) {
          console.log("API search parameters:", searchParams);
          console.log("Species value being sent:", s);
        }

        // Try search API first
        let res;
        try {
          res = await petService.searchPets?.(q, {
            page: p,
            limit: 10,
            type: s !== "all" ? s : undefined,
          });
          if (__DEV__) {
            console.log("Search API response:", res);
          }
        } catch (searchError) {
          if (__DEV__) {
            console.log("Search API failed, using fallback:", searchError);
          }
          res = { success: false };
        }

        // Check if this request is still the latest one (race condition check)
        if (currentRequestId !== requestIdRef.current) {
          if (__DEV__) {
            console.log("Request outdated, ignoring response", {
              currentRequestId,
              latestRequestId: requestIdRef.current,
            });
          }
          return;
        }

        // Fallback to getLatestPets if search fails
        let data: Pet[] = [];
        if (res?.success && res?.data) {
          // Handle response format - data should be Pet[] directly
          data = Array.isArray(res.data) ? res.data : [];
          if (__DEV__) {
            console.log("Extracted pets:", data);

            // Debug: Log the species of first few pets
            if (data.length > 0) {
              console.log(
                "First 3 pets species:",
                data.slice(0, 3).map((pet) => ({
                  name: pet.name,
                  species:
                    (pet as any).species || (pet as any).type || "unknown",
                }))
              );
            }
          }
        } else {
          if (__DEV__) {
            console.log("Using fallback - getLatestPets");
          }
          const fallbackRes = await petService.getLatestPets(10); // Reduced to 10 pets
          if (__DEV__) {
            console.log("Fallback response:", fallbackRes);
          }
          data = fallbackRes?.data || [];
        }

        // Final race condition check before updating state
        if (currentRequestId !== requestIdRef.current) {
          if (__DEV__) {
            console.log("Request outdated before state update, ignoring", {
              currentRequestId,
              latestRequestId: requestIdRef.current,
            });
          }
          return;
        }

        if (__DEV__) {
          console.log("Final data:", data);
        }
        setPets((prev) => (replace ? data : [...prev, ...data]));
        setHasMore(data.length === 10); // Check if we got exactly 10 pets (full page)
        setPage(p);
      } catch (e) {
        // Only update error state if this is still the latest request
        if (currentRequestId === requestIdRef.current) {
          setError("Failed to load results.");
          console.error("Fetch error:", e);
        }
      } finally {
        // Only update loading state if this is still the latest request
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [loading]
  );

  const startNewSearch = useCallback(
    async (q: string, s: Species) => {
      if (__DEV__) {
        console.log("Starting new search with:", { query: q, species: s });
      }
      setPage(1);
      setHasMore(true);
      setPets([]);
      setError(null);
      endReachedLockRef.current = false; // Reset lock for new search
      await fetchPage(1, q, s, true);
    },
    [fetchPage]
  );

  // Store the latest startNewSearch function in ref
  startNewSearchRef.current = startNewSearch;

  useEffect(() => {
    // initial fetch
    if (startNewSearchRef.current) {
      startNewSearchRef.current(query, species);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search when query or species changes
  useEffect(() => {
    // Skip debounce on initial mount - let the initial fetch handle it
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // Clear existing timeout
    if (typingRef.current) {
      clearTimeout(typingRef.current);
    }

    // Set new timeout for debounced search
    typingRef.current = setTimeout(() => {
      if (startNewSearchRef.current) {
        startNewSearchRef.current(query, species);
      }
    }, 200);

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (typingRef.current) {
        clearTimeout(typingRef.current);
      }
    };
  }, [query, species]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending timeout
      if (typingRef.current) {
        clearTimeout(typingRef.current);
      }
      // Invalidate any pending requests by incrementing requestId
      requestIdRef.current++;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (startNewSearchRef.current) {
      await startNewSearchRef.current(query, species);
    }
    setRefreshing(false);
  }, [query, species]);

  const onEndReached = useCallback(() => {
    if (__DEV__) {
      console.log("onEndReached called:", {
        loading,
        hasMore,
        page,
        locked: endReachedLockRef.current,
      });
    }
    if (!loading && hasMore && !endReachedLockRef.current) {
      endReachedLockRef.current = true; // Lock to prevent double calls
      if (__DEV__) {
        console.log("Loading next page:", page + 1);
      }
      fetchPage(page + 1).finally(() => {
        // Reset lock after request completes (success or error)
        endReachedLockRef.current = false;
      });
    }
  }, [loading, hasMore, page, fetchPage]);

  const runSearch = () => {
    if (startNewSearchRef.current) {
      startNewSearchRef.current(query, species);
    }
  };

  const updateUrlParams = (newSpecies: Species) => {
    router.replace({
      pathname: "/(guest-tabs)/search",
      params: { species: newSpecies },
    });
  };

  const onMomentumScrollBegin = useCallback(() => {
    // Reset end reached lock when user starts scrolling
    endReachedLockRef.current = false;
  }, []);

  // header shrink
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchTranslateY = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, -6],
    extrapolate: "clamp",
  });

  const GAP = 14;
  const COL = 2;
  const CARD_W = (width - 16 * 2 - GAP) / COL;

  const header = useMemo(
    () => (
      <>
        {/* Purple hero section */}
        <View style={{ paddingHorizontal: 16, marginTop: 6 }}>
          <LinearGradient
            colors={[PF.indigo, PF.violet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { borderRadius: 18, height: 56 }]}
          >
            <Ionicons name="search" size={22} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
                Search Pets
              </Text>
              <Text style={{ color: "#EEF2FF", fontSize: 13 }}>
                Find your perfect companion
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Search pill */}
        <Animated.View
          style={[
            styles.searchWrap,
            { transform: [{ translateY: searchTranslateY }] },
          ]}
        >
          <View
            style={[
              styles.searchCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadow,
            ]}
          >
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
              value={query}
              onChangeText={onChangeQuery}
              placeholder="Search by name, breed, location..."
              placeholderTextColor="#9CA3AF"
              style={[styles.searchInput, { color: colors.text }]}
              returnKeyType="search"
              onSubmitEditing={runSearch}
              accessibilityLabel="Search input"
            />
            {!!query && (
              <TouchableOpacity
                onPress={() => {
                  setQuery(""); // Clear the input field - debounce effect will handle the search
                }}
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={runSearch}
              style={styles.searchGo}
              accessibilityLabel="Run search"
            >
              <Text style={styles.searchGoText}>Search</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Chips */}
        <View
          style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4 }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { key: "all", label: "All" },
              ...petFilters.types.map((type) => ({
                key: type,
                label:
                  type === "dog" ? "Dogs" : type === "cat" ? "Cats" : "Other",
              })),
            ].map((item) => (
              <Chip
                key={item.key}
                label={item.label}
                active={species === item.key}
                onPress={() => {
                  setSpecies(item.key as Species);
                  updateUrlParams(item.key as Species);
                  // Let the debounce effect handle the search when species changes
                }}
              />
            ))}
          </View>
        </View>

        {/* Count / Helper */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            Results update as you type. Pull to refresh anytime.
          </Text>
        </View>
      </>
    ),
    [
      colors,
      query,
      species,
      PF.indigo,
      PF.violet,
      searchTranslateY,
      shadow,
      onChangeQuery,
      runSearch,
      startNewSearch,
      updateUrlParams,
    ]
  );

  return (
    <SafeAreaView
      edges={["top"]} // ensure iOS has inset
      style={[
        { flex: 1, backgroundColor: colors.background },
        Platform.OS === "web" ? { paddingTop: 8 } : null, // web adds 8px top gap
      ]}
    >
      <Animated.FlatList
        data={pets}
        keyExtractor={(it: any, index: number) =>
          String(petId(it) || `${it.name || "pet"}-${index}`)
        }
        renderItem={({ item }) => (
          <PetCardGrid
            pet={item}
            width={CARD_W}
            onPress={() => router.push(`/pet/${petId(item)}`)}
          />
        )}
        numColumns={COL}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? (
            <GridSkeleton width={CARD_W} />
          ) : error ? (
            <ErrorState
              error={error}
              onRetry={() => {
                if (startNewSearchRef.current) {
                  startNewSearchRef.current(query, species);
                }
              }}
            />
          ) : (
            <EmptyState />
          )
        }
        ListFooterComponent={
          pets.length > 0 ? (
            <View style={{ paddingVertical: 16 }}>
              {loading ? (
                <FooterSkeleton />
              ) : hasMore ? (
                <TouchableOpacity
                  onPress={onEndReached}
                  style={[styles.loadMore, { borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.text }}>Load more</Text>
                </TouchableOpacity>
              ) : (
                <Text
                  style={{ textAlign: "center", color: colors.textSecondary }}
                >
                  No more results
                </Text>
              )}
            </View>
          ) : null
        }
        onEndReachedThreshold={0.4}
        onEndReached={onEndReached}
        onMomentumScrollBegin={onMomentumScrollBegin}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PF.indigo}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 56 }}
      />
    </SafeAreaView>
  );
}

function PetCardGrid({
  pet,
  onPress,
  width,
}: {
  pet: Pet;
  onPress: () => void;
  width: number;
}) {
  const { colors } = useTheme();
  const img =
    pet?.photos?.[0]?.url ||
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80";
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
    <TouchableOpacity onPress={onPress} accessibilityLabel={`Open ${pet.name}`}>
      <View
        style={[
          {
            width,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          },
          boxShadow,
        ]}
      >
        <View
          style={{ width: "100%", height: 140, backgroundColor: "#F3F4F6" }}
        >
          <Image
            source={{ uri: img }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>
        <View style={{ padding: 12 }}>
          <Text
            style={{ fontWeight: "900", color: colors.text, marginBottom: 2 }}
            numberOfLines={1}
          >
            {pet.name}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              marginBottom: 6,
            }}
            numberOfLines={1}
          >
            {metaOf(pet)}
          </Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {!!(pet as any).size && <MiniTag label={(pet as any).size} />}
            {!!(pet as any).vaccinated && <MiniTag label="Vaccinated" />}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function GridSkeleton({ width }: { width: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <View style={{ flexDirection: "row", gap: 14 }}>
        {[0, 1].map((i) => (
          <View
            key={i}
            style={{
              width,
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                width: "100%",
                height: 140,
                backgroundColor: colors.border,
                opacity: 0.3,
              }}
            />
            <View style={{ padding: 12, gap: 8 }}>
              <View
                style={{
                  width: 120,
                  height: 14,
                  backgroundColor: colors.border,
                  borderRadius: 6,
                  opacity: 0.3,
                }}
              />
              <View
                style={{
                  width: 90,
                  height: 12,
                  backgroundColor: colors.border,
                  borderRadius: 6,
                  opacity: 0.3,
                }}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function FooterSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: 100,
          height: 40,
          backgroundColor: colors.border,
          borderRadius: 10,
          opacity: 0.3,
        }}
      />
    </View>
  );
}

function EmptyState() {
  const { colors } = useTheme();
  return (
    <View style={{ padding: 24, alignItems: "center" }}>
      <Ionicons name="paw" size={26} color={colors.textSecondary} />
      <Text style={{ marginTop: 8, color: colors.textSecondary }}>
        No pets found. Try different filters.
      </Text>
    </View>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ padding: 24, alignItems: "center" }}>
      <Ionicons name="alert-circle" size={26} color="#EF4444" />
      <Text
        style={{
          marginTop: 8,
          color: colors.textSecondary,
          textAlign: "center",
        }}
      >
        {error}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        style={{
          marginTop: 12,
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: "#6366F1",
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: "900" },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  accentCard: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accentText: { color: "#fff", fontWeight: "800" },

  searchWrap: { paddingHorizontal: 16, marginTop: 10, marginBottom: 8 },
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },
  searchGo: {
    backgroundColor: "#6366F1", // purple indigo
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
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  chipText: { fontWeight: "800", color: "#111827", fontSize: 12 },
  chipTextActive: { color: "#fff" },

  loadMore: {
    alignSelf: "center",
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
});
