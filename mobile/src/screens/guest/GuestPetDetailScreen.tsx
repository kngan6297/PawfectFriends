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
import { useTheme } from "@/hooks/useTheme";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { Pet } from "@/types";

const { width } = Dimensions.get("window");

export default function GuestPetDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data, isLoading, error, refetch } = usePet(id!);

  const styles = createStyles();

  const pet = data?.data;

  const handleFavoritePress = () => {
    Alert.alert(
      "Login Required",
      "Please log in to save pets to your favorites.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Login",
          onPress: () => router.push("/(auth)/login"),
        },
      ]
    );
  };

  const handleAdoptPress = () => {
    Alert.alert(
      "Login Required",
      "Please log in to submit adoption requests.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Login",
          onPress: () => router.push("/(auth)/login"),
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
          >
            <Ionicons
              name="heart-outline"
              size={24}
              color={colors.textSecondary}
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

          {/* Login Prompt Banner */}
          <View style={styles.loginPrompt}>
            <Ionicons name="heart" size={24} color={colors.primary} />
            <View style={styles.loginPromptText}>
              <Text style={styles.loginPromptTitle}>
                Want to save favorites and adopt?
              </Text>
              <Text style={styles.loginPromptSubtitle}>
                Create an account to save pets and submit adoption requests
              </Text>
            </View>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push("/(auth)/register")}
            >
              <Text style={styles.loginButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.adoptButton}
          onPress={handleAdoptPress}
          accessibilityRole="button"
          accessibilityLabel="Login to adopt this pet"
        >
          <Text style={styles.adoptButtonText}>Login to Adopt</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FFFFFF",
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
      backgroundColor: "#F8F9FA",
      borderBottomWidth: 1,
      borderBottomColor: "#E1E8ED",
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
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      marginHorizontal: 4,
    },
    activeIndicator: {
      backgroundColor: "#7C3AED",
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
      color: "#2C3E50",
      flex: 1,
    },
    statusBadge: {
      backgroundColor: "#7C3AED",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statusText: {
      color: "#FFFFFF",
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
      color: "#7F8C8D",
      marginLeft: 8,
      textTransform: "capitalize",
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: "#2C3E50",
      marginBottom: 12,
    },
    description: {
      fontSize: 16,
      color: "#7F8C8D",
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
      color: "#2C3E50",
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
      color: "#2C3E50",
      marginLeft: 12,
    },
    shelterInfo: {
      backgroundColor: "#F8F9FA",
      padding: 16,
      borderRadius: 12,
    },
    shelterName: {
      fontSize: 18,
      fontWeight: "600",
      color: "#2C3E50",
      marginBottom: 4,
    },
    shelterLocation: {
      fontSize: 16,
      color: "#7F8C8D",
      marginBottom: 4,
    },
    shelterContact: {
      fontSize: 16,
      color: "#7F8C8D",
    },
    loginPrompt: {
      backgroundColor: "#F8F9FA",
      padding: 16,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      marginTop: 16,
      borderWidth: 1,
      borderColor: "#E1E8ED",
    },
    loginPromptText: {
      flex: 1,
      marginLeft: 12,
    },
    loginPromptTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#2C3E50",
      marginBottom: 4,
    },
    loginPromptSubtitle: {
      fontSize: 14,
      color: "#7F8C8D",
    },
    loginButton: {
      backgroundColor: "#7C3AED",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    loginButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },
    bottomBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: "#F8F9FA",
      borderTopWidth: 1,
      borderTopColor: "#E1E8ED",
    },
    adoptButton: {
      backgroundColor: "#7F8C8D",
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 8,
      flex: 1,
    },
    adoptButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });
