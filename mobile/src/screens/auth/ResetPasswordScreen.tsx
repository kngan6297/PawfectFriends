import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { authService } from "@/services/authService";
import { useTheme } from "@/hooks/useTheme";
import { validation, errorMessages, successMessages } from "@/constants";

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const PF = {
    indigo: "#6366F1",
    violet: "#7C3AED",
    rose: "#F43F5E",
    emerald: "#10B981",
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.password.trim())
      errors.password = errorMessages.validation.required;
    else if (formData.password.length < validation.passwordMinLength)
      errors.password = errorMessages.validation.password;

    if (!formData.confirmPassword.trim())
      errors.confirmPassword = errorMessages.validation.required;
    else if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = errorMessages.validation.passwordMatch;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await authService.resetPassword(
        token as string,
        formData.password,
        formData.confirmPassword
      );
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || "Failed to reset password");
      }
    } catch (e: any) {
      setError(e?.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 24,
            minHeight: "100%",
            justifyContent: "center",
          }}
        >
          {/* Hero */}
          <LinearGradient
            colors={[PF.indigo, PF.violet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Ionicons name="lock-closed" size={18} color="#fff" />
              <Text style={styles.brand}>PawfectFriends</Text>
            </View>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>Enter your new password below</Text>
          </LinearGradient>

          {/* Card */}
          <View
            style={[
              styles.card,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            {success ? (
              <View style={{ alignItems: "center" }}>
                <Ionicons
                  name="checkmark-circle"
                  size={64}
                  color={PF.emerald}
                />
                <Text
                  style={[
                    styles.stateTitle,
                    { color: colors.text, marginTop: 10 },
                  ]}
                >
                  Password changed
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    textAlign: "center",
                    marginTop: 6,
                    lineHeight: 20,
                  }}
                >
                  {successMessages?.auth?.passwordChanged ||
                    "Your password has been updated successfully."}
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace("/(auth)/login")}
                  accessibilityLabel="Back to login"
                >
                  <LinearGradient
                    colors={[PF.indigo, PF.violet]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryBtnText}>Back to login</Text>
                    <Ionicons name="log-in-outline" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {/* New password */}
                <Field
                  label="New password"
                  icon="lock-closed-outline"
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={(t: string) => {
                    setFormData((p) => ({ ...p, password: t }));
                    if (fieldErrors.password)
                      setFieldErrors((p) => ({ ...p, password: "" }));
                  }}
                  secureTextEntry={!showPassword}
                  trailingIcon={showPassword ? "eye-off" : "eye"}
                  onPressTrailing={() => setShowPassword((v) => !v)}
                  error={fieldErrors.password}
                  colors={colors}
                  autoCapitalize="none"
                />

                {/* Confirm */}
                <Field
                  label="Confirm new password"
                  icon="shield-checkmark-outline"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(t: string) => {
                    setFormData((p) => ({ ...p, confirmPassword: t }));
                    if (fieldErrors.confirmPassword)
                      setFieldErrors((p) => ({ ...p, confirmPassword: "" }));
                  }}
                  secureTextEntry={!showConfirmPassword}
                  trailingIcon={showConfirmPassword ? "eye-off" : "eye"}
                  onPressTrailing={() => setShowConfirmPassword((v) => !v)}
                  error={fieldErrors.confirmPassword}
                  colors={colors}
                  autoCapitalize="none"
                />

                {!!error && (
                  <View
                    style={[
                      styles.inlineAlert,
                      {
                        borderColor: PF.rose + "55",
                        backgroundColor: PF.rose + "10",
                      },
                    ]}
                  >
                    <Ionicons name="alert-circle" size={18} color={PF.rose} />
                    <Text style={{ color: PF.rose, fontWeight: "700" }}>
                      {error}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  disabled={isLoading}
                  onPress={handleResetPassword}
                  accessibilityLabel="Reset password"
                >
                  <LinearGradient
                    colors={[PF.indigo, PF.violet]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.primaryBtn, isLoading && { opacity: 0.6 }]}
                  >
                    <Text style={styles.primaryBtnText}>
                      {isLoading ? "Resetting…" : "Reset password"}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  icon,
  placeholder,
  value,
  onChange,
  error,
  colors,
  trailingIcon,
  onPressTrailing,
  secureTextEntry,
  autoCapitalize,
}: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "800",
          marginBottom: 6,
          color: colors.text,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
        }}
      >
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          style={[
            { flex: 1, fontSize: 15, color: colors.text, borderWidth: 0 },
            Platform.OS === "web"
              ? ({ outlineStyle: "none", outlineWidth: 0 } as any)
              : null,
          ]}
          selectionColor="#6366F1"
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
        {trailingIcon ? (
          <TouchableOpacity
            onPress={onPressTrailing}
            accessibilityLabel={label + " toggle"}
          >
            <Ionicons
              name={trailingIcon}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {!!error && (
        <Text style={{ color: "#F43F5E", fontSize: 12, marginTop: 6 }}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 18, padding: 16, marginBottom: 12 },
  brand: { color: "#fff", fontWeight: "900", fontSize: 14 },
  title: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 8 },
  subtitle: { color: "#EEF2FF", marginTop: 4 },

  card: { borderWidth: 1, borderRadius: 16, padding: 16 },

  stateTitle: { fontSize: 20, fontWeight: "900" },

  inlineAlert: {
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  primaryBtn: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
});
