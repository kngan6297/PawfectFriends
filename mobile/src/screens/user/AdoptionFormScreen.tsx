import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { pageContainer, scrollContent, GUTTER, PAGE_MAX } from "@/ui/layout";
import { useCreateAdoptionRequest } from "@/hooks/useAdoptions";
import { usePet } from "@/hooks/usePets";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { AdoptionApplicationDetails } from "@/types";
import { petId } from "@/utils";

export default function AdoptionFormScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { petId: petIdParam, petName } = useLocalSearchParams<{
    petId: string;
    petName: string;
  }>();

  const { data: petData, isLoading: petLoading } = usePet(petIdParam || "");
  const createAdoptionRequest = useCreateAdoptionRequest();

  const [formData, setFormData] = useState<AdoptionApplicationDetails>({
    housingType: "house",
    hasYard: false,
    hasOtherPets: false,
    hasChildren: false,
    workSchedule: "",
    reasonForAdopting: "",
    plannedCareRoutine: "",
    references: [
      {
        name: "",
        relationship: "",
        phone: "",
        email: "",
        yearsKnown: 0,
      },
    ],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (
    parentField: string,
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parentField]: {
        ...prev[parentField as keyof AdoptionApplicationDetails],
        [field]: value,
      },
    }));
  };

  const handleReferenceChange = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      references: prev.references.map((ref, i) =>
        i === index ? { ...ref, [field]: value } : ref
      ),
    }));
  };

  const addReference = () => {
    setFormData((prev) => ({
      ...prev,
      references: [
        ...prev.references,
        {
          name: "",
          relationship: "",
          phone: "",
          email: "",
          yearsKnown: 0,
        },
      ],
    }));
  };

  const removeReference = (index: number) => {
    if (formData.references.length > 1) {
      setFormData((prev) => ({
        ...prev,
        references: prev.references.filter((_, i) => i !== index),
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.workSchedule.trim()) {
      Alert.alert("Validation Error", "Please describe your work schedule.");
      return false;
    }
    if (!formData.reasonForAdopting.trim()) {
      Alert.alert(
        "Validation Error",
        "Please explain why you want to adopt this pet."
      );
      return false;
    }
    if (!formData.plannedCareRoutine.trim()) {
      Alert.alert(
        "Validation Error",
        "Please describe your planned care routine."
      );
      return false;
    }

    // Validate references
    console.log("🔔 Validating references:", formData.references);

    // Filter out empty references
    const validReferences = formData.references.filter(
      (ref) => ref.name.trim() && ref.relationship.trim() && ref.phone.trim()
    );

    console.log("🔔 Valid references after filtering:", validReferences);

    if (validReferences.length === 0) {
      Alert.alert(
        "Validation Error",
        "Please provide at least one complete reference with name, relationship, and contact information."
      );
      return false;
    }

    // Update form data with only valid references
    setFormData((prev) => ({
      ...prev,
      references: validReferences,
    }));

    return true;
  };

  const handleSubmit = async () => {
    console.log("🔔 Form validation starting...");
    console.log("🔔 Current form data:", formData);
    console.log("🔔 References count:", formData.references.length);
    console.log("🔔 References data:", formData.references);

    // Validate and filter references first
    console.log("🔔 Validating references:", formData.references);

    // Filter out empty references
    const validReferences = formData.references.filter(
      (ref) => ref.name.trim() && ref.relationship.trim() && ref.phone.trim()
    );

    console.log("🔔 Valid references after filtering:", validReferences);

    if (validReferences.length === 0) {
      Alert.alert(
        "Validation Error",
        "Please provide at least one complete reference with name, relationship, and contact information."
      );
      return;
    }

    // Create submission data with filtered references
    const submissionData = {
      ...formData,
      references: validReferences,
    };

    console.log("🔔 Submission data:", JSON.stringify(submissionData, null, 2));

    setIsSubmitting(true);
    try {
      console.log("🔔 Submitting adoption request with data:", {
        petId: petIdParam!,
        applicationDetails: submissionData,
      });

      const result = await createAdoptionRequest.mutateAsync({
        petId: petIdParam!,
        applicationDetails: submissionData,
      });

      console.log("🔔 API Response:", JSON.stringify(result, null, 2));

      if (result.status === "success" || result.success) {
        console.log("🔔 Adoption request submitted successfully!");
        setIsSuccess(true);

        // Auto-navigate after 2 seconds
        setTimeout(() => {
          router.back();
          router.push("/(tabs)/adoptions");
        }, 2000);
      } else {
        Alert.alert(
          "Error",
          "Failed to submit adoption request. Please try again."
        );
      }
    } catch (error) {
      console.error("Adoption request error:", error);
      Alert.alert(
        "Error",
        "Failed to submit adoption request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          <Text style={[styles.successTitle, { color: colors.text }]}>
            Application Submitted!
          </Text>
          <Text
            style={[styles.successMessage, { color: colors.textSecondary }]}
          >
            Your adoption request for {petData?.data?.name || "this pet"} has
            been submitted successfully. The shelter will review your
            application and contact you soon.
          </Text>
          <Text
            style={[styles.successRedirect, { color: colors.textSecondary }]}
          >
            Redirecting to your adoptions...
          </Text>

          <TouchableOpacity
            onPress={() => {
              router.back();
              router.push("/(tabs)/adoptions");
            }}
            style={[
              styles.manualNavigateButton,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={styles.manualNavigateText}>View My Applications</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (petLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <LoadingSpinner text="Loading pet information..." />
      </SafeAreaView>
    );
  }

  if (!petData?.data) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ErrorMessage message="Pet not found" onRetry={() => router.back()} />
      </SafeAreaView>
    );
  }

  const pet = petData.data;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Adoption Application
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pet Info */}
        <View
          style={[
            styles.petCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.petCardTitle, { color: colors.text }]}>
            Adopting: {pet.name}
          </Text>
          <Text
            style={[styles.petCardSubtitle, { color: colors.textSecondary }]}
          >
            {pet.breeds?.primary || pet.breed} • {pet.age} • {pet.gender}
          </Text>
        </View>

        {/* Housing Information */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Housing Information
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Housing Type
            </Text>
            <View style={styles.radioGroup}>
              {["house", "apartment", "condo", "other"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.radioOption,
                    formData.housingType === type && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                  onPress={() => handleInputChange("housingType", type)}
                >
                  <Text
                    style={[
                      styles.radioText,
                      {
                        color:
                          formData.housingType === type ? "#fff" : colors.text,
                      },
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.switchGroup}>
            <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>
              Do you have a yard?
            </Text>
            <Switch
              value={formData.hasYard}
              onValueChange={(value) => handleInputChange("hasYard", value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {formData.hasYard && (
            <>
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  Yard Size
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.background, color: colors.text },
                  ]}
                  placeholder="e.g., Small, Medium, Large"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.yardDetails?.size || ""}
                  onChangeText={(value) =>
                    handleNestedInputChange("yardDetails", "size", value)
                  }
                />
              </View>

              <View style={styles.switchGroup}>
                <Text
                  style={[styles.switchLabel, { color: colors.textSecondary }]}
                >
                  Is the yard fenced?
                </Text>
                <Switch
                  value={formData.yardDetails?.isFenced || false}
                  onValueChange={(value) =>
                    handleNestedInputChange("yardDetails", "isFenced", value)
                  }
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </>
          )}
        </View>

        {/* Pet Experience */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Pet Experience
          </Text>

          <View style={styles.switchGroup}>
            <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>
              Do you have other pets?
            </Text>
            <Switch
              value={formData.hasOtherPets}
              onValueChange={(value) =>
                handleInputChange("hasOtherPets", value)
              }
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.switchGroup}>
            <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>
              Do you have children?
            </Text>
            <Switch
              value={formData.hasChildren}
              onValueChange={(value) => handleInputChange("hasChildren", value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Work Schedule
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: colors.background, color: colors.text },
              ]}
              placeholder="Describe your work schedule and how you'll care for the pet"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              value={formData.workSchedule}
              onChangeText={(value) => handleInputChange("workSchedule", value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Reason for Adopting
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: colors.background, color: colors.text },
              ]}
              placeholder="Why do you want to adopt this pet?"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              value={formData.reasonForAdopting}
              onChangeText={(value) =>
                handleInputChange("reasonForAdopting", value)
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Planned Care Routine
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: colors.background, color: colors.text },
              ]}
              placeholder="Describe how you plan to care for this pet"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              value={formData.plannedCareRoutine}
              onChangeText={(value) =>
                handleInputChange("plannedCareRoutine", value)
              }
            />
          </View>
        </View>

        {/* References */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              References
            </Text>
            <TouchableOpacity
              onPress={addReference}
              style={[styles.addButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {formData.references.map((ref, index) => (
            <View key={index} style={styles.referenceCard}>
              <View style={styles.referenceHeader}>
                <Text style={[styles.referenceTitle, { color: colors.text }]}>
                  Reference {index + 1}
                </Text>
                {formData.references.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeReference(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  Name
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.background, color: colors.text },
                  ]}
                  placeholder="Full name"
                  placeholderTextColor={colors.textSecondary}
                  value={ref.name}
                  onChangeText={(value) =>
                    handleReferenceChange(index, "name", value)
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  Relationship
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.background, color: colors.text },
                  ]}
                  placeholder="e.g., Friend, Colleague, Family"
                  placeholderTextColor={colors.textSecondary}
                  value={ref.relationship}
                  onChangeText={(value) =>
                    handleReferenceChange(index, "relationship", value)
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  Contact Information
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.background, color: colors.text },
                  ]}
                  placeholder="Phone or email"
                  placeholderTextColor={colors.textSecondary}
                  value={ref.phone}
                  onChangeText={(value) =>
                    handleReferenceChange(index, "phone", value)
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  Years Known
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.background, color: colors.text },
                  ]}
                  placeholder="Number of years"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={ref.yearsKnown.toString()}
                  onChangeText={(value) =>
                    handleReferenceChange(
                      index,
                      "yearsKnown",
                      parseInt(value) || 0
                    )
                  }
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View
        style={[
          styles.submitContainer,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.submitButton}
        >
          <LinearGradient
            colors={
              isSubmitting ? ["#6B7280", "#6B7280"] : ["#6366F1", "#7C3AED"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitGradient}
          >
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.submitText}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
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
    alignItems: "center",
    paddingHorizontal: GUTTER,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GUTTER,
    paddingBottom: 32,
  },
  petCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 3 },
    }),
  },
  petCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  petCardSubtitle: {
    fontSize: 14,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 2 },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: "top",
  },
  radioGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  radioOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  radioText: {
    fontSize: 14,
    fontWeight: "500",
  },
  switchGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  referenceCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  referenceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  referenceTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  removeButton: {
    padding: 4,
  },
  submitContainer: {
    paddingHorizontal: GUTTER,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: GUTTER,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
  },
  successRedirect: {
    fontSize: 14,
    fontStyle: "italic",
  },
  manualNavigateButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  manualNavigateText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
