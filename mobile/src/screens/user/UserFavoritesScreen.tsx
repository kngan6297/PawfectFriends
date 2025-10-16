import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Platform,
  ScrollView,
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

export default function UserFavoritesScreen() {
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

  const goSearch = () =>
    router.push({
      pathname: "/(tabs)/search",
    } as any);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching favorites...");
      // Use real favorites data from backend
      const res = await petService.getFavorites();
      console.log("Favorites response:", res);
      if (res?.success && res?.data) {
        console.log("Favorites data:", res.data);
        setFavorites(res.data);
      } else {
        console.log("No favorites data or failed response");
        // If no favorites, set empty array
        setFavorites([]);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchFavorites();
  }, [isAuthenticated, fetchFavorites]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  }, [fetchFavorites]);

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PF.indigo}
          />
        }
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
                  Your favorites
                </Text>
                <Text style={{ color: "#EEF2FF", fontSize: 13 }}>
                  Pets you've saved and love
                </Text>
              </View>
              <TouchableOpacity onPress={() => goSearch()}>
                <View style={[styles.ctaGhost, shadow]}>
                  <Text style={{ color: "#111827", fontWeight: "900" }}>
                    Browse
                  </Text>
                </View>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Favorites Grid */}
          <View style={{ paddingHorizontal: GUTTER, marginTop: 24 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "900",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Your Favorites
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginBottom: 16,
              }}
            >
              Pets you saved for later
            </Text>

            {favorites.length === 0 ? (
              <View style={{ padding: 24, alignItems: "center" }}>
                <Ionicons name="heart" size={26} color={colors.textSecondary} />
                <Text style={{ marginTop: 8, color: colors.textSecondary }}>
                  No favorites yet.
                </Text>
              </View>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                }}
              >
                {favorites.map((pet, index) => (
                  <View
                    key={String(petId(pet))}
                    style={{
                      width: "48%",
                      marginBottom: 14,
                    }}
                  >
                    <PetCardGrid
                      pet={pet}
                      onPress={() => router.push(`/pet/${petId(pet)}`)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
