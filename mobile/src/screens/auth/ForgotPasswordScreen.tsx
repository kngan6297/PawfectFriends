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
import { authService } from "@/services/authService";
import { useTheme } from "@/hooks/useTheme";
import { validation, errorMessages, successMessages } from "@/constants";

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState("");

  const PF = { indigo: "#6366F1", violet: "#7C3AED", rose: "#F43F5E" };

  const validateEmail = () => {
    if (!email.trim()) {
      setError(errorMessages.validation.required);
      return false;
    }
    if (!validation.email.test(email)) {
      setError(errorMessages.validation.email);
      return false;
    }
    return true;
  };

  const handleForgotPassword = async () => {
    if (!validateEmail()) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        setIsEmailSent(true);
      } else {
        setError(response.message || "Failed to send reset email");
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
              <Ionicons name="mail" size={18} color="#fff" />
              <Text style={styles.brand}>PawfectFriends</Text>
            </View>
            <Text style={styles.title}>Forgot password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send a reset link
            </Text>
          </LinearGradient>

          {/* Card */}
          <View
            style={[
              styles.card,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            {isEmailSent ? (
              <View style={{ alignItems: "center" }}>
                <Ionicons name="mail-unread" size={64} color={colors.success} />
                <Text
                  style={[
                    styles.stateTitle,
                    { color: colors.text, marginTop: 10 },
                  ]}
                >
                  Check your email
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    textAlign: "center",
                    marginTop: 6,
                    lineHeight: 20,
                  }}
                >
                  {successMessages?.auth?.passwordReset ||
                    "We've sent a password reset link."}
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace("/(auth)/login")}
                  style={[styles.ghostBtn, { borderColor: colors.border }]}
                >
                  <Ionicons
                    name="log-in-outline"
                    size={18}
                    color={colors.text}
                  />
                  <Text style={[styles.ghostBtnText, { color: colors.text }]}>
                    Back to login
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    marginBottom: 6,
                    color: colors.text,
                  }}
                >
                  Email address
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
                  <Ionicons
                    name="at-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <TextInput
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (error) setError("");
                    }}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      {
                        flex: 1,
                        fontSize: 15,
                        color: colors.text,
                        borderWidth: 0,
                      },
                      Platform.OS === "web"
                        ? ({ outlineStyle: "none", outlineWidth: 0 } as any)
                        : null,
                    ]}
                    selectionColor="#6366F1"
                  />
                </View>
                {!!error && (
                  <Text style={{ color: PF.rose, fontSize: 12, marginTop: 6 }}>
                    {error}
                  </Text>
                )}

                <TouchableOpacity
                  disabled={isLoading}
                  onPress={handleForgotPassword}
                >
                  <LinearGradient
                    colors={[PF.indigo, PF.violet]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.primaryBtn, isLoading && { opacity: 0.6 }]}
                  >
                    <Text style={styles.primaryBtnText}>
                      {isLoading ? "Sending…" : "Send reset link"}
                    </Text>
                    <Ionicons name="send" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer */}
          {!isEmailSent && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                marginTop: 12,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                Remember your password?{" "}
              </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text
                    style={{
                      color: "#6366F1",
                      fontSize: 14,
                      fontWeight: "700",
                    }}
                  >
                    Sign in
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 18, padding: 16, marginBottom: 12 },
  brand: { color: "#fff", fontWeight: "900", fontSize: 14 },
  title: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 8 },
  subtitle: { color: "#EEF2FF", marginTop: 4 },

  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  stateTitle: { fontSize: 20, fontWeight: "900" },

  primaryBtn: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  ghostBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ghostBtnText: { fontWeight: "800" },
});
