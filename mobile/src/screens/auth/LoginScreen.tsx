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
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/hooks/useTheme";
import { validation, errorMessages } from "@/constants";

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({ emailOrPhone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const PF = { indigo: "#6366F1", violet: "#7C3AED", rose: "#F43F5E" };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.emailOrPhone.trim())
      errors.emailOrPhone = errorMessages.validation.required;
    if (!formData.password.trim())
      errors.password = errorMessages.validation.required;
    else if (formData.password.length < validation.passwordMinLength)
      errors.password = errorMessages.validation.password;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    clearError();
    const res = await login(formData.emailOrPhone, formData.password);
    if (res.success) {
      router.replace("/(tabs)/home");
    } else if (res.fieldErrors) {
      setFieldErrors(res.fieldErrors);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { justifyContent: "center", minHeight: "100%" }, // vertical center
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={{ marginBottom: 12 }}>
            <LinearGradient
              colors={[PF.indigo, PF.violet]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Ionicons name="paw" size={20} color="#fff" />
                <Text style={styles.brand}>PawfectFriends</Text>
              </View>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Sign in to continue your adoption journey
              </Text>
            </LinearGradient>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.formCard,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            {/* Email / Phone */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.text }]}>
                Email or Phone
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <TextInput
                  value={formData.emailOrPhone}
                  onChangeText={(t) => {
                    setFormData((p) => ({ ...p, emailOrPhone: t }));
                    if (fieldErrors.emailOrPhone)
                      setFieldErrors((p) => ({ ...p, emailOrPhone: "" }));
                  }}
                  placeholder="Enter your email or phone"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.input,
                    { color: colors.text },
                    Platform.OS === "web"
                      ? ({ outlineStyle: "none", outlineWidth: 0 } as any)
                      : null,
                  ]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  selectionColor={PF.indigo}
                />
              </View>
              {!!fieldErrors.emailOrPhone && (
                <Text style={[styles.errorText, { color: PF.rose }]}>
                  {fieldErrors.emailOrPhone}
                </Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.text }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <TextInput
                  value={formData.password}
                  onChangeText={(t) => {
                    setFormData((p) => ({ ...p, password: t }));
                    if (fieldErrors.password)
                      setFieldErrors((p) => ({ ...p, password: "" }));
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.input,
                    { color: colors.text },
                    Platform.OS === "web"
                      ? ({ outlineStyle: "none", outlineWidth: 0 } as any)
                      : null,
                  ]}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={PF.indigo}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel="Toggle password visibility"
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {!!fieldErrors.password && (
                <Text style={[styles.errorText, { color: PF.rose }]}>
                  {fieldErrors.password}
                </Text>
              )}
            </View>

            {/* Global error */}
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

            {/* Submit */}
            <TouchableOpacity
              disabled={isLoading}
              onPress={handleLogin}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <LinearGradient
                colors={[PF.indigo, PF.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.primaryBtn, isLoading && { opacity: 0.6 }]}
              >
                <Text style={styles.primaryBtnText}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary links */}
            <View style={styles.linkRow}>
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity>
                  <Text style={[styles.link, { color: PF.indigo }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={{ color: colors.textSecondary }}>
              Don't have an account?{" "}
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={[styles.link, { color: PF.indigo }]}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { borderRadius: 18, padding: 16 },
  brand: { color: "#fff", fontWeight: "900", fontSize: 14 },
  title: { color: "#fff", fontSize: 26, fontWeight: "900", marginTop: 8 },
  subtitle: { color: "#EEF2FF", marginTop: 4 },

  // center content
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, paddingVertical: 24 },

  // card for form
  formCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 16,
    gap: 8,
  },

  fieldWrap: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: "800" },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  // TextInput has NO border to avoid "small frame"
  input: { flex: 1, fontSize: 15, borderWidth: 0 },
  errorText: { fontSize: 12, marginTop: 6 },

  inlineAlert: {
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  primaryBtn: {
    marginTop: 6,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  linkRow: { alignItems: "flex-start", marginTop: 10 },
  link: { fontWeight: "800" },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
