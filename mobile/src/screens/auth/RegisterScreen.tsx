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

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const PF = { indigo: "#6366F1", violet: "#7C3AED", rose: "#F43F5E" };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = errorMessages.validation.required;
    else if (
      formData.name.length < validation.nameMinLength ||
      formData.name.length > validation.nameMaxLength
    )
      errors.name = errorMessages.validation.name;

    if (!formData.email.trim())
      errors.email = errorMessages.validation.required;
    else if (!validation.email.test(formData.email))
      errors.email = errorMessages.validation.email;

    if (!formData.phone.trim())
      errors.phone = errorMessages.validation.required;
    else if (!validation.phone.test(formData.phone))
      errors.phone = errorMessages.validation.phone;

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

  const handleRegister = async () => {
    if (!validateForm()) return;
    clearError();
    const res = await register(formData);
    if (res.success) router.replace("/(guest-tabs)/home");
    else if (res.fieldErrors) setFieldErrors(res.fieldErrors);
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
            { minHeight: "100%", justifyContent: "center" },
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
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>
                Join the adoption community today
              </Text>
            </LinearGradient>
          </View>

          {/* Form card */}
          <View
            style={[
              styles.formCard,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            {/* Name */}
            <Field
              label="Full name"
              icon="person-outline"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(t) => {
                setFormData((p) => ({ ...p, name: t }));
                if (fieldErrors.name)
                  setFieldErrors((p) => ({ ...p, name: "" }));
              }}
              error={fieldErrors.name}
              colors={colors}
            />

            {/* Email */}
            <Field
              label="Email"
              icon="mail-outline"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(t) => {
                setFormData((p) => ({ ...p, email: t }));
                if (fieldErrors.email)
                  setFieldErrors((p) => ({ ...p, email: "" }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={fieldErrors.email}
              colors={colors}
            />

            {/* Phone */}
            <Field
              label="Phone number"
              icon="call-outline"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(t) => {
                setFormData((p) => ({ ...p, phone: t }));
                if (fieldErrors.phone)
                  setFieldErrors((p) => ({ ...p, phone: "" }));
              }}
              keyboardType="phone-pad"
              error={fieldErrors.phone}
              colors={colors}
            />

            {/* Password */}
            <Field
              label="Password"
              icon="lock-closed-outline"
              placeholder="Create a password"
              value={formData.password}
              onChange={(t) => {
                setFormData((p) => ({ ...p, password: t }));
                if (fieldErrors.password)
                  setFieldErrors((p) => ({ ...p, password: "" }));
              }}
              secureTextEntry={!showPassword}
              trailingIcon={showPassword ? "eye-off" : "eye"}
              onPressTrailing={() => setShowPassword((v) => !v)}
              autoCapitalize="none"
              error={fieldErrors.password}
              colors={colors}
            />

            {/* Confirm Password */}
            <Field
              label="Confirm password"
              icon="shield-checkmark-outline"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(t) => {
                setFormData((p) => ({ ...p, confirmPassword: t }));
                if (fieldErrors.confirmPassword)
                  setFieldErrors((p) => ({ ...p, confirmPassword: "" }));
              }}
              secureTextEntry={!showConfirmPassword}
              trailingIcon={showConfirmPassword ? "eye-off" : "eye"}
              onPressTrailing={() => setShowConfirmPassword((v) => !v)}
              autoCapitalize="none"
              error={fieldErrors.confirmPassword}
              colors={colors}
            />

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
              onPress={handleRegister}
              accessibilityLabel="Create account"
            >
              <LinearGradient
                colors={[PF.indigo, PF.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.primaryBtn, isLoading && { opacity: 0.6 }]}
              >
                <Text style={styles.primaryBtnText}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={{ color: colors.textSecondary }}>
              Already have an account?{" "}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.link, { color: PF.indigo }]}>Sign in</Text>
              </TouchableOpacity>
            </Link>
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
  keyboardType,
  autoCapitalize,
}: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "800",
          color: colors.text,
          marginBottom: 6,
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
          keyboardType={keyboardType}
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
        <Text style={{ color: PF.rose, fontSize: 12, marginTop: 6 }}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 24 },
  hero: { borderRadius: 18, padding: 16 },
  brand: { color: "#fff", fontWeight: "900", fontSize: 14 },
  title: { color: "#fff", fontSize: 26, fontWeight: "900", marginTop: 8 },
  subtitle: { color: "#EEF2FF", marginTop: 4 },

  formCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },

  inlineAlert: {
    marginTop: 4,
    marginBottom: 6,
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
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  link: { fontWeight: "800" },
});
