import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { usePet } from "@/hooks/usePets";
import { useToggleFavorite } from "@/hooks/usePets";
import { useCreateAdoptionRequest } from "@/hooks/useAdoptions";
import { useTheme } from "@/hooks/useTheme";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { Pet } from "@/types";

const { width } = Dimensions.get("window");

export default function UserPetDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data, isLoading, error, refetch } = usePet(id!);
  const toggleFavorite = useToggleFavorite();
  const createAdoptionRequest = useCreateAdoptionRequest();

  const styles = createStyles(colors);

  const pet = data?.data;

  const handleFavoritePress = async () => {
    if (pet) {
      await toggleFavorite.mutateAsync(pet.id);
    }
  };

  const handleAdoptPress = () => {
    if (!pet) return;

    Alert.alert(
      "Adopt This Pet",
      `Are you ready to submit an adoption request for ${pet.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit Request",
          onPress: () => {
            // Navigate to adoption form
            router.push({
              pathname: "/adoption-form",
              params: { petId: pet.id, petName: pet.name },
            });
          },
        },
      ]
    );
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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            disabled={toggleFavorite.isPending}
          >
            <Ionicons
              name={pet.isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={pet.isFavorite ? colors.error : colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Image Carousel */}
        {pet.photos && pet.photos.length > 0 && (
          <View style={styles.imageSection}>
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

        {/* Pet Info */}
        <View style={styles.content}>
          <View style={styles.petHeader}>
            <Text style={styles.petName}>{pet.name}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{pet.status}</Text>
            </View>
          </View>

          <View style={styles.basicInfo}>
            <View style={styles.infoItem}>
              <Ionicons
                name={getGenderIcon(pet.gender)}
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.infoText}>{pet.gender}</Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{getAgeText(pet.age)}</Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="resize" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{pet.size}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{pet.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health & Care</Text>
            <View style={styles.healthInfo}>
              <View style={styles.healthItem}>
                <Ionicons
                  name={
                    pet.health.vaccinated ? "checkmark-circle" : "close-circle"
                  }
                  size={20}
                  color={pet.health.vaccinated ? colors.success : colors.error}
                />
                <Text style={styles.healthText}>Vaccinated</Text>
              </View>

              <View style={styles.healthItem}>
                <Ionicons
                  name={
                    pet.health.neutered ? "checkmark-circle" : "close-circle"
                  }
                  size={20}
                  color={pet.health.neutered ? colors.success : colors.error}
                />
                <Text style={styles.healthText}>Neutered/Spayed</Text>
              </View>

              {pet.health.houseTrained !== undefined && (
                <View style={styles.healthItem}>
                  <Ionicons
                    name={
                      pet.health.houseTrained
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={20}
                    color={
                      pet.health.houseTrained ? colors.success : colors.error
                    }
                  />
                  <Text style={styles.healthText}>House Trained</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Behavior</Text>
            <View style={styles.behaviorInfo}>
              {pet.behavior.goodWithChildren !== undefined && (
                <View style={styles.behaviorItem}>
                  <Ionicons
                    name={
                      pet.behavior.goodWithChildren
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={20}
                    color={
                      pet.behavior.goodWithChildren
                        ? colors.success
                        : colors.error
                    }
                  />
                  <Text style={styles.behaviorText}>Good with Children</Text>
                </View>
              )}

              {pet.behavior.goodWithDogs !== undefined && (
                <View style={styles.behaviorItem}>
                  <Ionicons
                    name={
                      pet.behavior.goodWithDogs
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={20}
                    color={
                      pet.behavior.goodWithDogs ? colors.success : colors.error
                    }
                  />
                  <Text style={styles.behaviorText}>Good with Dogs</Text>
                </View>
              )}

              {pet.behavior.goodWithCats !== undefined && (
                <View style={styles.behaviorItem}>
                  <Ionicons
                    name={
                      pet.behavior.goodWithCats
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={20}
                    color={
                      pet.behavior.goodWithCats ? colors.success : colors.error
                    }
                  />
                  <Text style={styles.behaviorText}>Good with Cats</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shelter Information</Text>
            <View style={styles.shelterInfo}>
              <Text style={styles.shelterName}>{pet.shelter.name}</Text>
              {pet.shelter.location && (
                <Text style={styles.shelterLocation}>
                  {typeof pet.shelter.location === "string"
                    ? pet.shelter.location
                    : (pet.shelter.location as any)?.formatted ||
                      "Location not available"}
                </Text>
              )}
              {pet.shelter.contact?.phone && (
                <Text style={styles.shelterContact}>
                  {pet.shelter.contact.phone}
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.adoptButton}
          onPress={handleAdoptPress}
          disabled={pet.status !== "adoptable"}
          accessibilityRole="button"
          accessibilityLabel={
            pet.status === "adoptable"
              ? `Adopt ${pet.name}`
              : `${pet.name} is not available for adoption`
          }
        >
          <Text style={styles.adoptButtonText}>
            {pet.status === "adoptable" ? "Adopt Me" : "Not Available"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    favoriteButton: {
      padding: 8,
    },
    imageSection: {
      height: 300,
      position: "relative",
    },
    petImage: {
      width: width,
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
      backgroundColor: colors.overlay,
      marginHorizontal: 4,
    },
    activeIndicator: {
      backgroundColor: colors.primary,
    },
    content: {
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    petHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    petName: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    statusBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statusText: {
      color: colors.background,
      fontSize: 12,
      fontWeight: "600",
      textTransform: "capitalize",
    },
    basicInfo: {
      flexDirection: "row",
      marginBottom: 24,
    },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 24,
    },
    infoText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginLeft: 8,
      textTransform: "capitalize",
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 12,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    healthInfo: {
      gap: 12,
    },
    healthItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    healthText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
    behaviorInfo: {
      gap: 12,
    },
    behaviorItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    behaviorText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
    shelterInfo: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
    },
    shelterName: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    shelterLocation: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    shelterContact: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    bottomBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    adoptButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 8,
      flex: 1,
    },
    adoptButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: "600",
    },
  });
