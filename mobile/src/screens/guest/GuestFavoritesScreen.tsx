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
import { metaOf, MiniTag } from "@/ui";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { petService } from "@/services/petService";
import { Pet } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { petId } from "@/utils";
import { pageContainer, scrollContent, GUTTER, PAGE_MAX } from "@/ui/layout";

export default function PublicFavoritesScreen() {
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

  const [favorites, setFavorites] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [suggested, setSuggested] = useState<Pet[]>([]);
  const [suggLoading, setSuggLoading] = useState(false);

  const goSearch = (species?: "dog" | "cat" | "other") =>
    router.push({
      pathname: "/(guest-tabs)/search",
      params: { species: species ?? "all" },
    } as any);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      // If your backend exposes favorites: use that; otherwise fallback
      const res = await (petService as any).getFavoritePets?.();
      if (res?.success && res?.data) {
        setFavorites(res.data);
      } else {
        // Fallback: show latest as demo
        const demo = await petService.getLatestPets(6);
        setFavorites(demo?.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchFavorites();
  }, [isAuthenticated, fetchFavorites]);

  // always fetch suggestion (whether logged in/not logged in)
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
    await fetchFavorites();
    setRefreshing(false);
  }, [fetchFavorites]);

  // Empty states
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
                <Ionicons name="heart" size={22} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}
                  >
                    Save your favorites
                  </Text>
                  <Text style={{ color: "#EEF2FF", fontSize: 13 }}>
                    Login to save pets you love and access them anytime.
                  </Text>
                </View>
                <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                  <View style={[styles.ctaGhost, shadow]}>
                    <Text style={{ color: "#111827", fontWeight: "900" }}>
                      Login
                    </Text>
                  </View>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Tip card */}
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
                <Text style={{ color: colors.text, fontWeight: "800" }}>
                  Tip
                </Text>
                <Text
                  style={{ color: colors.textSecondary, marginTop: 4, flex: 1 }}
                >
                  Tap the heart on any pet to add it here.
                </Text>
              </View>
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
                  {suggested.slice(0, 2).map((p) => {
                    const id = petId(p);
                    return (
                      <TouchableOpacity
                        key={String(id)}
                        onPress={() => router.push(`/pet/${id}`)}
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
                            resizeMode="cover"
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
                    );
                  })}
                </View>
              )}

              {/* CTA: chỉ còn Browse pets (gradient), bỏ Login thứ hai */}
              <TouchableOpacity
                onPress={() => goSearch()}
                style={{ marginTop: 12 }}
              >
                <LinearGradient
                  colors={["#6366F1", "#7C3AED"]}
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

  return (
    <SafeAreaView
      edges={["top"]} // ensure iOS has inset
      style={[
        { flex: 1, backgroundColor: colors.background },
        Platform.OS === "web" ? { paddingTop: 8 } : null, // web adds 8px top gap
      ]}
    >
      <FlatList
        data={favorites}
        keyExtractor={(it) => String(petId(it))}
        numColumns={2}
        columnWrapperStyle={{ gap: 14 }} // NO padding here anymore
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        renderItem={({ item }) => (
          <PetCardGrid
            pet={item}
            onPress={() => router.push(`/pet/${petId(item)}`)}
          />
        )}
        // Header/Text above, remove internal paddingHorizontal,
        // because it is already in contentContainerStyle
        ListHeaderComponent={
          <View style={{ paddingTop: 4, paddingBottom: 6 }}>
            <Text
              style={{ fontSize: 22, fontWeight: "900", color: colors.text }}
            >
              Favorites
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              Pets you saved for later
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: "center" }}>
            <Ionicons name="heart" size={26} color={colors.textSecondary} />
            <Text style={{ marginTop: 8, color: colors.textSecondary }}>
              No favorites yet.
            </Text>
          </View>
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
          paddingBottom: 56,
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

function PetCardGrid({ pet, onPress }: { pet: Pet; onPress: () => void }) {
  const { colors } = useTheme();
  const img =
    (pet as any)?.photos?.[0]?.url ||
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
  const W = Platform.OS === "web" ? 375 : 360; // width not used; style uses flex-basis

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={`Open ${(pet as any).name}`}
    >
      <View
        style={[
          {
            flex: 1,
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
            {(pet as any).name}
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
    paddingVertical: 10,
    borderRadius: 12,
  },
});
