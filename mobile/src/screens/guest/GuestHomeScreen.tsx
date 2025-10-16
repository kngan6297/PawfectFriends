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
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  TextInput,
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Pressable,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { metaOf, MiniTag, Chip } from "@/ui";
import { petService } from "@/services/petService";
import { Pet } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/hooks/useTheme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * PublicHomeScreen — Revamped layout (clean, editorial, Petfinder-esque)
 * Sections:
 *  - TopBar (logo + auth)
 *  - Hero (headline + search pill overlay)
 *  - CategoryChips (species quick filters)
 *  - FeaturedCarousel (snap)
 *  - TrendingGrid (2‑column masonry-like)
 *  - Tips / Info card
 *  - Footer CTA
 */
export default function PublicHomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { width } = Dimensions.get("window");

  // Helper function to get pet ID
  const petId = (p: any) => p?.id ?? p?._id;

  const R = useMemo(() => ({ md: 12, lg: 16, xl: 24 }), []);
  const PF = useMemo(
    () => ({
      blue: "#3B82F6",
      indigo: "#6366F1",
      violet: "#7C3AED",
      blue20: "#3B82F633",
      violet20: "#7C3AED33",
    }),
    []
  );

  const shadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 4 },
    default: {},
  });

  // state
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState<"all" | "dog" | "cat" | "other">(
    "all"
  );
  const [featured, setFeatured] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const f1 = await petService.getLatestPets(8);

      console.log("Featured response:", f1);

      if (f1.success && f1.data) setFeatured(f1.data);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (e) {
      setError("Network error while loading pets.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // actions
  const onSearch = useCallback(() => {
    router.push({
      pathname: "/(guest-tabs)/search",
      params: { q: query || undefined, species },
    } as any);
  }, [router, query, species]);

  const clearSearch = useCallback(() => {
    setQuery("");
  }, []);
  const goLogin = () => router.push("/(auth)/login");
  const goRegister = () => router.push("/(auth)/register");

  // header collapse anim
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroScale = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.96],
    extrapolate: "clamp",
  });
  const searchTranslateY = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -8],
    extrapolate: "clamp",
  });

  // grid sizes
  const GAP = 12;

  const header = (
    <>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Ionicons name="paw" size={20} color="#111827" />
          <Text style={[styles.brand, { color: colors.text }]}>
            PawfectFriends
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={goLogin}
            style={[styles.topBtn, { borderColor: colors.border }]}
            accessibilityLabel="Login"
          >
            <Ionicons name="person" size={16} color={colors.text} />
            <Text style={[styles.topBtnText, { color: colors.text }]}>
              Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goRegister} accessibilityLabel="Register">
            <LinearGradient
              colors={[PF.indigo, PF.violet]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.topCta}
            >
              <Text style={styles.topCtaText}>Sign up</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero */}
      <Animated.View style={{ transform: [{ scale: heroScale }] }}>
        <LinearGradient
          colors={[PF.blue, PF.violet]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { borderRadius: R.xl }]}
        >
          <View style={{ flex: 1, paddingRight: 12, justifyContent: "center" }}>
            <Text style={styles.headline}>
              Find a friend who fits your life
            </Text>
            <Text style={styles.subhead}>
              Browse shelters, find your perfect match, and start your adoption
              journey today.
            </Text>
          </View>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80",
            }}
            style={[styles.heroImage, { borderRadius: R.xl }]}
            resizeMode="cover"
          />
        </LinearGradient>
      </Animated.View>

      {/* Search Pill (overlay look) */}
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
            onChangeText={setQuery}
            placeholder="Search by name, breed, location..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={onSearch}
            accessibilityLabel="Search input"
          />
          {!!query && (
            <TouchableOpacity
              onPress={clearSearch}
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onSearch}
            accessibilityLabel="Run search"
            style={styles.searchGo}
          >
            <Text style={styles.searchGoText}>Search</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        style={{ marginTop: 12 }}
      >
        {(
          [
            { key: "all", label: "All" },
            { key: "dog", label: "Dogs" },
            { key: "cat", label: "Cats" },
            { key: "other", label: "Other" },
          ] as const
        ).map((c) => (
          <Chip
            key={c.key}
            label={c.label}
            active={species === c.key}
            onPress={() => setSpecies(c.key)}
          />
        ))}
      </ScrollView>

      {/* Featured */}
      <SectionHeader
        title="Featured"
        subtitle="Hand‑picked pets looking for a home"
      />
      {loading ? (
        <HorizontalSkeleton />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={fetchData}
          border={colors.border}
          text={colors.text}
        />
      ) : (
        <FlatList
          data={featured}
          keyExtractor={(it) => String(petId(it))}
          renderItem={({ item }) => (
            <PetCardLarge
              pet={item}
              onPress={() => router.push(`/(guest-tabs)/pet/${petId(item)}`)}
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={280}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        />
      )}
    </>
  );

  return (
    <SafeAreaView
      edges={["top"]} // ensure iOS has inset
      style={[
        { flex: 1, backgroundColor: colors.background },
        Platform.OS === "web" ? { paddingTop: 8 } : null, // web adds 8px top gap
      ]}
    >
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PF.indigo}
          />
        }
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 48 }}
      >
        {header}

        {/* Tips */}
        <View
          style={[
            styles.tips,
            { borderColor: colors.border, backgroundColor: colors.surface },
            shadow,
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="bulb" size={18} color={PF.indigo} />
            <Text style={[styles.tipsTitle, { color: colors.text }]}>
              Adoption tips
            </Text>
          </View>
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
            Meet before you commit. Ask shelters about temperament, health, and
            activity needs.
          </Text>
        </View>

        {/* Footer CTA */}
        <View
          style={[
            styles.footerCta,
            { backgroundColor: colors.surface, borderColor: colors.border },
            shadow,
          ]}
        >
          <Text style={[styles.footerTitle, { color: colors.text }]}>
            Ready to adopt?
          </Text>
          <Text style={[styles.footerSub, { color: colors.textSecondary }]}>
            Create an account to save favorites and start the adoption.
          </Text>
          <TouchableOpacity
            onPress={goRegister}
            accessibilityLabel="Get started"
            style={styles.footerBtn}
          >
            <LinearGradient
              colors={[PF.indigo, PF.violet]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.footerBtnGrad}
            >
              <Text style={styles.footerBtnText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// ===== UI Bits =====
function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 24, paddingHorizontal: 16, marginBottom: 8 }}>
      <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>
        {title}
      </Text>
      {!!subtitle && (
        <Text
          style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

function ErrorState({
  message,
  onRetry,
  border,
  text,
}: {
  message: string;
  onRetry: () => void;
  border: string;
  text: string;
}) {
  return (
    <View style={{ paddingVertical: 24, alignItems: "center", gap: 8 }}>
      <Ionicons name="alert-circle" size={22} color="#ef4444" />
      <Text style={{ color: text }}>{message}</Text>
      <TouchableOpacity
        onPress={onRetry}
        style={[styles.retryBtn, { borderColor: border }]}
        accessibilityRole="button"
        accessibilityLabel="Retry loading"
      >
        <Ionicons name="refresh" size={16} />
        <Text style={{ fontWeight: "700" }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

function HorizontalSkeleton() {
  return (
    <FlatList
      data={[1, 2, 3, 4]}
      keyExtractor={(i) => `s-${i}`}
      renderItem={() => (
        <View>
          <View
            style={{
              width: 260,
              height: 160,
              backgroundColor: "#E5E7EB",
              borderRadius: 16,
            }}
          />
        </View>
      )}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
      ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
    />
  );
}

function PetCardLarge({ pet, onPress }: { pet: Pet; onPress: () => void }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const img =
    pet?.photos?.[0]?.url ||
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80";

  const askLogin = () => {
    if (Platform.OS === "web") {
      return window.confirm(
        "Save to Favorites\n\nLogin to save pets to your favorites and access them anytime!"
      );
    }
    Alert.alert(
      "Save to Favorites",
      "Login to save pets to your favorites and access them anytime!",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/(auth)/login") },
      ]
    );
    return false; // native will follow Alert callback
  };

  const handleFavoritePress = (e: any) => {
    e?.stopPropagation?.(); // Prevent triggering the card press

    if (!isAuthenticated) {
      if (Platform.OS === "web") {
        const should = askLogin();
        if (should) router.push("/(auth)/login");
      } else {
        askLogin(); // Alert available onPress
      }
      return;
    }
    setIsFavorite((v) => !v);
    // TODO: call API toggle
  };

  return (
    <Pressable onPress={onPress} accessibilityLabel={`Open ${pet.name}`}>
      <View
        style={{
          width: 260,
          height: 160,
          borderRadius: 18,
          overflow: "hidden",
          ...(Platform.OS === "ios"
            ? {
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
              }
            : { elevation: 3 }),
        }}
      >
        <Image
          source={{ uri: img }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["#0000", "#0008"]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 80,
          }}
        />

        {/* Favorite Button */}
        <TouchableOpacity
          onPress={handleFavoritePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: isAuthenticated
              ? "rgba(255,255,255,0.95)"
              : "rgba(255,255,255,0.7)",
            justifyContent: "center",
            alignItems: "center",
          }}
          accessibilityLabel={
            !isAuthenticated
              ? "Login to add to favorites"
              : isFavorite
              ? "Remove from favorites"
              : "Add to favorites"
          }
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={18}
            color={
              !isAuthenticated ? "#9CA3AF" : isFavorite ? "#ef4444" : "#374151"
            }
          />
        </TouchableOpacity>

        <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
          <Text
            style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}
            numberOfLines={1}
          >
            {pet.name}
          </Text>
          <Text style={{ color: "#E5E7EB", fontSize: 12 }} numberOfLines={1}>
            {metaOf(pet)}
          </Text>
        </View>
      </View>
    </Pressable>
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
  const shadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 6 },
    default: {},
  });

  return (
    <Pressable onPress={onPress} accessibilityLabel={`Open ${pet.name}`}>
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
          shadow,
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
          <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
            {!!(pet as any).size && <MiniTag label={(pet as any).size} />}
            {!!(pet as any).vaccinated && <MiniTag label="Vaccinated" />}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Top bar
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: { fontSize: 16, fontWeight: "900", letterSpacing: 0.2 },
  topBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  topBtnText: { fontWeight: "700", fontSize: 12 },
  topCta: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  topCtaText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  // Hero
  hero: {
    flexDirection: "row",
    overflow: "hidden",
    padding: 16,
    minHeight: 160,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  heroImage: { width: 120, height: 120, resizeMode: "cover" },
  headline: { color: "#fff", fontSize: 22, fontWeight: "900", marginBottom: 6 },
  subhead: { color: "#eef2ff", fontSize: 13, lineHeight: 18 },

  // Search pill
  searchWrap: { paddingHorizontal: 16, marginTop: 10, marginBottom: 8 },
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
    backgroundColor: "#6366F1", // purple indigo
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchGoText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  // Chips
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

  // Retry
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  // Tips
  tips: {
    marginTop: 24,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  tipsTitle: { fontWeight: "900" },
  tipsText: { marginTop: 6, fontSize: 13 },

  // Footer CTA
  footerCta: {
    marginTop: 24,
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  footerTitle: { fontSize: 20, fontWeight: "900", marginBottom: 6 },
  footerSub: { fontSize: 13, marginBottom: 12 },
  footerBtn: { alignSelf: "flex-start", borderRadius: 12, overflow: "hidden" },
  footerBtnGrad: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerBtnText: { color: "#fff", fontWeight: "900" },
});
