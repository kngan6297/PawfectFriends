import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/store/authStore";
import { useUserProfile } from "@/hooks/useUser";
import { useTheme } from "@/hooks/useTheme";
import { userService } from "@/services/userService";
import { pageContainer, scrollContent, GUTTER } from "@/ui/layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { User } from "@/types";

interface FormData {
  name: string;
  email: string;
  phone: string;
  bio: string;
}

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { user, updateUser } = useAuthStore();
  const { data: profile, refetch } = useUserProfile();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    bio: "",
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PF = useMemo(() => ({ indigo: "#6366F1", violet: "#7C3AED" }), []);

  useEffect(() => {
    const profileData = profile?.data || user;
    if (profileData) {
      setFormData({
        name: profileData.name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        bio: profileData.bio || "",
      });
      setAvatar(profileData.avatar || null);
    }
  }, [profile, user]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to update your avatar."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare update data
      const updateData: Partial<User> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        bio: formData.bio.trim(),
      };

      // Upload avatar if changed
      if (avatar && avatar !== (profile?.data?.avatar || user?.avatar)) {
        console.log("Uploading avatar:", avatar);
        const avatarResponse = await userService.uploadAvatar(avatar);
        console.log("Avatar upload response:", avatarResponse);
        if (avatarResponse.success) {
          updateData.avatar = avatarResponse.data.avatar;
          console.log(
            "Avatar uploaded successfully:",
            avatarResponse.data.avatar
          );
        } else {
          console.error("Avatar upload failed:", avatarResponse.message);
          Alert.alert(
            "Avatar Upload Failed",
            avatarResponse.message ||
              "Failed to upload avatar. Please try again."
          );
          return;
        }
      }

      // Update profile
      const response = await userService.updateProfile(updateData);

      if (response.success) {
        // Update local state
        updateUser(response.data);
        await refetch();

        Alert.alert("Success", "Your profile has been updated successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to update profile. Please try again."
        );
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    console.log("Close button pressed");

    // Check if there are any changes to warn about
    const hasChanges =
      formData.name !== (profile?.data?.name || user?.name || "") ||
      formData.email !== (profile?.data?.email || user?.email || "") ||
      formData.phone !== (profile?.data?.phone || user?.phone || "") ||
      formData.bio !== (profile?.data?.bio || user?.bio || "") ||
      avatar !== (profile?.data?.avatar || user?.avatar || null);

    console.log("Has changes:", hasChanges);

    if (hasChanges) {
      // Use web-compatible confirmation for web environment
      if (Platform.OS === "web") {
        const confirmed = window.confirm(
          "Are you sure you want to discard your changes?"
        );
        if (confirmed) {
          console.log("User confirmed discard, navigating back");
          // Use replace instead of back to avoid navigation stack issues
          router.replace("/(tabs)/profile");
        }
      } else {
        // Use native Alert for mobile
        Alert.alert(
          "Discard Changes",
          "Are you sure you want to discard your changes?",
          [
            { text: "Keep Editing", style: "cancel" },
            {
              text: "Discard",
              style: "destructive",
              onPress: () => router.replace("/(tabs)/profile"),
            },
          ]
        );
      }
    } else {
      // No changes, just go back
      console.log("No changes, navigating back");
      // Use replace instead of back to avoid navigation stack issues
      router.replace("/(tabs)/profile");
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        { flex: 1, backgroundColor: colors.background },
        Platform.OS === "web" ? { paddingTop: 8 } : null,
      ]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: GUTTER,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={handleCancel}
            style={{ padding: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Close edit profile"
            accessibilityHint="Close the edit profile screen"
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "900",
              color: colors.text,
            }}
          >
            Edit Profile
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={pageContainer}>
            {/* Avatar Section */}
            <View style={{ paddingHorizontal: GUTTER, paddingTop: 20 }}>
              <View style={{ alignItems: "center" }}>
                <TouchableOpacity onPress={handleImagePicker}>
                  <View
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      backgroundColor: colors.surface,
                      borderWidth: 2,
                      borderColor: colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {avatar ? (
                      <Image
                        source={{ uri: avatar }}
                        style={{ width: 100, height: 100 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons
                        name="person"
                        size={40}
                        color={colors.textSecondary}
                      />
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleImagePicker}
                  style={{ marginTop: 8 }}
                >
                  <Text
                    style={{
                      color: PF.indigo,
                      fontWeight: "800",
                      fontSize: 14,
                    }}
                  >
                    Change Photo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Fields */}
            <View style={{ paddingHorizontal: GUTTER, paddingTop: 20 }}>
              {/* Name Field */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  Full Name *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: errors.name ? colors.error : colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={formData.name}
                  onChangeText={(value) => handleInputChange("name", value)}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
                {errors.name && (
                  <Text
                    style={{ color: colors.error, fontSize: 12, marginTop: 4 }}
                  >
                    {errors.name}
                  </Text>
                )}
              </View>

              {/* Email Field */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  Email Address *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: errors.email ? colors.error : colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange("email", value)}
                  placeholder="Enter your email address"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && (
                  <Text
                    style={{ color: colors.error, fontSize: 12, marginTop: 4 }}
                  >
                    {errors.email}
                  </Text>
                )}
              </View>

              {/* Phone Field */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  Phone Number *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: errors.phone ? colors.error : colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange("phone", value)}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
                {errors.phone && (
                  <Text
                    style={{ color: colors.error, fontSize: 12, marginTop: 4 }}
                  >
                    {errors.phone}
                  </Text>
                )}
              </View>

              {/* Bio Field */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  Bio
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={formData.bio}
                  onChangeText={(value) => handleInputChange("bio", value)}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Submit Button */}
            <View style={{ paddingHorizontal: GUTTER, paddingTop: 20 }}>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={{ opacity: isSubmitting ? 0.5 : 1 }}
              >
                <LinearGradient
                  colors={[PF.indigo, PF.violet]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitButton}
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color="#fff" />
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "900",
                          fontSize: 16,
                        }}
                      >
                        Save Changes
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "600",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "600",
    minHeight: 100,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
  },
});
