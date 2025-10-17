import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { authService } from "@/services/authService";
import { useTheme } from "@/hooks/useTheme";

export default function CheckEmailScreen() {
  const { colors } = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [isResending, setIsResending] = useState(false);

  const PF = {
    indigo: "#6366F1",
    violet: "#7C3AED",
    rose: "#F43F5E",
    emerald: "#10B981",
  };

  const handleResendVerification = async () => {
    if (!email) {
      Alert.alert("Error", "Email address not found");
      return;
    }

    try {
      setIsResending(true);
      const res = await authService.resendVerification(email);

      if (res?.success) {
        Alert.alert(
          "Email Sent",
          "A new verification email has been sent to your inbox. Please check your email and click the verification link."
        );
      } else {
        Alert.alert(
          "Error",
          res?.message ||
            "Failed to resend verification email. Please try again."
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message ||
          "Failed to resend verification email. Please try again."
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[PF.indigo, PF.violet]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Ionicons name="mail" size={18} color="#fff" />
          <Text style={styles.brand}>PawfectFriends</Text>
        </View>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>We've sent you a verification link</Text>
      </LinearGradient>

      {/* CONTENT */}
      <View style={{ padding: 16, flex: 1, justifyContent: "center" }}>
        <Card colors={colors}>
          <View style={styles.centerRow}>
            <Ionicons name="mail-outline" size={64} color={PF.indigo} />
            <Text
              style={[styles.stateTitle, { color: colors.text, marginTop: 12 }]}
            >
              Almost there!
            </Text>
            <Text
              style={[
                styles.helper,
                {
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: 6,
                },
              ]}
            >
              We've sent a verification email to{" "}
              <Text style={{ fontWeight: "800", color: colors.text }}>
                {email || "your email address"}
              </Text>
              . Please check your inbox and click the verification link to
              activate your account.
            </Text>

            <View style={styles.tipsContainer}>
              <Text style={[styles.tipsTitle, { color: colors.text }]}>
                Don't see the email?
              </Text>
              <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={PF.emerald}
                  />
                  <Text
                    style={[styles.tipText, { color: colors.textSecondary }]}
                  >
                    Check your spam/junk folder
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={PF.emerald}
                  />
                  <Text
                    style={[styles.tipText, { color: colors.textSecondary }]}
                  >
                    Make sure you entered the correct email address
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={PF.emerald}
                  />
                  <Text
                    style={[styles.tipText, { color: colors.textSecondary }]}
                  >
                    Wait a few minutes for the email to arrive
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ gap: 10, width: "100%", marginTop: 20 }}>
              <TouchableOpacity
                disabled={isResending}
                onPress={handleResendVerification}
                accessibilityLabel="Resend verification email"
              >
                <LinearGradient
                  colors={[PF.indigo, PF.violet]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>
                    {isResending ? "Sending..." : "Resend verification email"}
                  </Text>
                  <Ionicons name="send" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleBackToLogin}
                style={[styles.ghostBtn, { borderColor: colors.border }]}
                accessibilityLabel="Back to login"
              >
                <Ionicons name="log-in-outline" size={18} color={colors.text} />
                <Text style={[styles.ghostBtnText, { color: colors.text }]}>
                  Back to login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}

function Card({ colors, children }: any) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
      }}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 18, margin: 16, padding: 16 },
  brand: { color: "#fff", fontWeight: "900", fontSize: 14 },
  title: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 8 },
  subtitle: { color: "#EEF2FF", marginTop: 4 },

  centerRow: { alignItems: "center" },
  stateTitle: { fontSize: 20, fontWeight: "900" },
  helper: { fontSize: 14, lineHeight: 20 },

  tipsContainer: {
    marginTop: 20,
    width: "100%",
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tipText: {
    fontSize: 13,
    flex: 1,
  },

  primaryBtn: {
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
