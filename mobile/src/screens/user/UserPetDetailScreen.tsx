import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { usePet, useFavorites } from "@/hooks/usePets";
import { useToggleFavorite } from "@/hooks/usePets";
import { useCreateAdoptionRequest } from "@/hooks/useAdoptions";
import { useTheme } from "@/hooks/useTheme";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { Pet } from "@/types";
import { pageContainer, scrollContent, GUTTER } from "@/ui/layout";
import { petId } from "@/utils";

const { width } = Dimensions.get("window");

export default function UserPetDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data, isLoading, error, refetch } = usePet(id!);
  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const createAdoptionRequest = useCreateAdoptionRequest();

  const PF = useMemo(() => ({ indigo: "#6366F1", violet: "#7C3AED" }), []);
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

  // Enrich pet data with favorite status
  const pet = useMemo(() => {
    if (!data?.data) return null;

    const basePet = data.data;
    const favoriteIds =
      favoritesData?.success && favoritesData?.data
        ? favoritesData.data.map((favPet: Pet) => petId(favPet))
        : [];

    return {
      ...basePet,
      isFavorite: favoriteIds.includes(petId(basePet)),
    };
  }, [data?.data, favoritesData]);

  const handleFavoritePress = async () => {
    if (pet) {
      const currentPetId = petId(pet);
      console.log("🔔 Heart button pressed for pet:", currentPetId);
      console.log("🔔 Current favorite status:", pet.isFavorite);
      try {
        const result = await toggleFavorite.mutateAsync(currentPetId);
        console.log("🔔 Toggle favorite result:", result);
      } catch (error) {
        console.error("🔔 Error toggling favorite:", error);
        Alert.alert(
          "Error",
          "Failed to update favorite status. Please try again."
        );
      }
    }
  };

  const handleAdoptPress = () => {
    console.log("🔔 Adopt Me Button pressed");

    if (!pet) {
      console.log("🔔 No pet data available");
      return;
    }

    console.log("🔔 Pet data:", {
      id: petId(pet),
      name: pet.name,
      status: pet.status,
    });
    console.log("🔔 About to navigate directly");

    // Try direct navigation first to test if router works
    try {
      console.log("🔔 Attempting direct navigation...");
      router.push({
        pathname: "/adoption-form",
        params: { petId: petId(pet), petName: pet.name },
      });
      console.log("🔔 Direct navigation call completed");
    } catch (error) {
      console.error("🔔 Direct navigation error:", error);
    }
  };

  const handleImageScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentImageIndex(index);
  };

  const getAgeText = (age: string) => {
    switch (age) {
      case "baby":
        return "Baby";
      case "young":
        return "Young";
      case "adult":
        return "Adult";
      case "senior":
        return "Senior";
      default:
        return age;
    }
  };

  const getGenderIcon = (gender: string) => {
    return gender === "male" ? "male" : gender === "female" ? "female" : "help";
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (error || !pet) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message="Pet not found" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push("/(tabs)/home");
            }
          }}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
          disabled={toggleFavorite.isPending}
          accessibilityLabel={
            pet?.isFavorite ? "Remove from favorites" : "Add to favorites"
          }
        >
          <Ionicons
            name={pet?.isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={pet?.isFavorite ? "#EF4444" : colors.text}
          />
        </TouchableOpacity>
      </View>

      {error && <ErrorMessage message={error} />}

      <ScrollView
        contentContainerStyle={scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={pageContainer}>
          {/* Image Carousel */}
          {pet?.photos && pet.photos.length > 0 && (
            <View style={[styles.imageSection, shadow]}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleImageScroll}
              >
                {pet.photos.map((photo, index) => (
                  <Image
                    key={index}
                    source={{ uri: photo.url }}
                    style={styles.petImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>

              {pet.photos.length > 1 && (
                <View style={styles.imageIndicators}>
                  {pet.photos.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        index === currentImageIndex && styles.activeIndicator,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Pet Header Card */}
          <View
            style={[
              styles.petHeaderCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadow,
            ]}
          >
            <View style={styles.petHeader}>
              <Text style={[styles.petName, { color: colors.text }]}>
                {pet?.name}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      pet?.status === "adoptable" ? "#10B981" : "#6B7280",
                  },
                ]}
              >
                <Text style={styles.statusText}>{pet?.status}</Text>
              </View>
            </View>

            <View style={styles.basicInfo}>
              <View style={styles.infoItem}>
                <Ionicons
                  name={getGenderIcon(pet?.gender)}
                  size={20}
                  color={PF.indigo}
                />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {pet?.gender}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="time" size={20} color={PF.indigo} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {getAgeText(pet?.age)}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="resize" size={20} color={PF.indigo} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {pet?.size}
                </Text>
              </View>
            </View>
          </View>

          {/* About Section */}
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadow,
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              About
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {pet?.description}
            </Text>
          </View>

          {/* Health & Care Section */}
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadow,
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Health & Care
            </Text>
            <View style={styles.healthInfo}>
              <View style={styles.healthItem}>
                <Ionicons
                  name={
                    pet?.health.vaccinated ? "checkmark-circle" : "close-circle"
                  }
                  size={20}
                  color={pet?.health.vaccinated ? "#10B981" : "#EF4444"}
                />
                <Text style={[styles.healthText, { color: colors.text }]}>
                  Vaccinated
                </Text>
              </View>

              <View style={styles.healthItem}>
                <Ionicons
                  name={
                    pet?.health.neutered ? "checkmark-circle" : "close-circle"
                  }
                  size={20}
                  color={pet?.health.neutered ? "#10B981" : "#EF4444"}
                />
                <Text style={[styles.healthText, { color: colors.text }]}>
                  Neutered/Spayed
                </Text>
              </View>

              {pet?.health.houseTrained !== undefined && (
                <View style={styles.healthItem}>
                  <Ionicons
                    name={
                      pet.health.houseTrained
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={20}
                    color={pet.health.houseTrained ? "#10B981" : "#EF4444"}
                  />
                  <Text style={[styles.healthText, { color: colors.text }]}>
                    House Trained
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Behavior Section */}
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadow,
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Behavior
            </Text>
            <View style={styles.behaviorInfo}>
              {pet?.behavior.goodWithChildren !== undefined && (
                <View style={styles.behaviorItem}>
                  <Ionicons
                    name={
                      pet.behavior.goodWithChildren
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={20}
                    color={
                      pet.behavior.goodWithChildren ? "#10B981" : "#EF4444"
                    }
                  />
                  <Text style={[styles.behaviorText, { color: colors.text }]}>
                    Good with Children
                  </Text>
                </View>
              )}

              {pet?.behavior.goodWithDogs !== undefined && (
                <View style={styles.behaviorItem}>
                  <Ionicons
                    name={
                      pet.behavior.goodWithDogs
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={20}
                    color={pet.behavior.goodWithDogs ? "#10B981" : "#EF4444"}
                  />
                  <Text style={[styles.behaviorText, { color: colors.text }]}>
                    Good with Dogs
                  </Text>
                </View>
              )}

              {pet?.behavior.goodWithCats !== undefined && (
                <View style={styles.behaviorItem}>
                  <Ionicons
                    name={
                      pet.behavior.goodWithCats
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={20}
                    color={pet.behavior.goodWithCats ? "#10B981" : "#EF4444"}
                  />
                  <Text style={[styles.behaviorText, { color: colors.text }]}>
                    Good with Cats
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Shelter Information */}
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadow,
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Shelter Information
            </Text>
            <View style={styles.shelterInfo}>
              <Text style={[styles.shelterName, { color: colors.text }]}>
                {pet?.shelter.name}
              </Text>
              {pet?.shelter.location && (
                <Text
                  style={[
                    styles.shelterLocation,
                    { color: colors.textSecondary },
                  ]}
                >
                  {typeof pet.shelter.location === "string"
                    ? pet.shelter.location
                    : (pet.shelter.location as any)?.formatted ||
                      "Location not available"}
                </Text>
              )}
              {pet?.shelter.contact?.phone && (
                <Text
                  style={[
                    styles.shelterContact,
                    { color: colors.textSecondary },
                  ]}
                >
                  {pet.shelter.contact.phone}
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          onPress={handleAdoptPress}
          disabled={pet?.status !== "adoptable"}
          accessibilityRole="button"
          accessibilityLabel={
            pet?.status === "adoptable"
              ? `Adopt ${pet.name}`
              : `${pet?.name} is not available for adoption`
          }
          style={styles.adoptButtonContainer}
        >
          <LinearGradient
            colors={
              pet?.status === "adoptable"
                ? [PF.indigo, PF.violet]
                : ["#6B7280", "#6B7280"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.adoptButton}
          >
            <Ionicons name="heart" size={20} color="#fff" />
            <Text style={styles.adoptButtonText}>
              {pet?.status === "adoptable" ? "Adopt Me" : "Not Available"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: GUTTER,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  favoriteButton: {
    padding: 4,
  },
  imageSection: {
    height: 300,
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: GUTTER,
    marginTop: 16,
  },
  petImage: {
    width: width - GUTTER * 2,
    height: 300,
  },
  imageIndicators: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: "#6366F1",
  },
  petHeaderCard: {
    marginHorizontal: GUTTER,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  petHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  petName: {
    fontSize: 28,
    fontWeight: "900",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  basicInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionCard: {
    marginHorizontal: GUTTER,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  healthInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  healthItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: "45%",
    gap: 8,
  },
  healthText: {
    fontSize: 16,
    fontWeight: "600",
  },
  behaviorInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  behaviorItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: "45%",
    gap: 8,
  },
  behaviorText: {
    fontSize: 16,
    fontWeight: "600",
  },
  shelterInfo: {
    gap: 8,
  },
  shelterName: {
    fontSize: 18,
    fontWeight: "800",
  },
  shelterLocation: {
    fontSize: 16,
  },
  shelterContact: {
    fontSize: 16,
  },
  bottomBar: {
    flexDirection: "row",
    paddingHorizontal: GUTTER,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  adoptButtonContainer: {
    flex: 1,
  },
  adoptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  adoptButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
});
