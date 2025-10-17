import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { authService } from "@/services/authService";
import { useTheme } from "@/hooks/useTheme";

export default function VerifyEmailScreen() {
  const { colors } = useTheme();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string>("");

  const PF = {
    indigo: "#6366F1",
    violet: "#7C3AED",
    rose: "#F43F5E",
    emerald: "#10B981",
  };

  useEffect(() => {
    if (!token) {
      setError("Invalid verification link");
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await authService.verifyEmail(token as string);
        if (res?.success) setIsVerified(true);
        else setError(res?.message || "Email verification failed");
      } catch (e: any) {
        setError(e?.message || "An error occurred during verification");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  const handleContinue = () => router.replace("/(guest-tabs)/home");
  const handleBackLogin = () => router.replace("/(auth)/login");
  const handleResend = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await authService.resendVerification("");
      if (!res?.success)
        setError(res?.message || "Failed to resend verification email");
    } catch (e: any) {
      setError(e?.message || "Failed to resend verification email");
    } finally {
      setIsLoading(false);
    }
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
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          We're confirming your address to keep your account secure.
        </Text>
      </LinearGradient>

      {/* CONTENT */}
      <View style={{ padding: 16, flex: 1, justifyContent: "center" }}>
        {/* Loading */}
        {isLoading && (
          <Card colors={colors}>
            <View style={styles.centerRow}>
              <ActivityIndicator size="large" color={PF.indigo} />
              <Text
                style={[
                  styles.helper,
                  { color: colors.textSecondary, marginTop: 12 },
                ]}
              >
                Verifying your email…
              </Text>
            </View>
          </Card>
        )}

        {/* Success */}
        {!isLoading && isVerified && (
          <Card colors={colors}>
            <View style={styles.centerRow}>
              <Ionicons name="checkmark-circle" size={64} color={PF.emerald} />
              <Text
                style={[
                  styles.stateTitle,
                  { color: colors.text, marginTop: 12 },
                ]}
              >
                Email verified!
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
                Your email has been confirmed. You can now access all features.
              </Text>
              <TouchableOpacity
                onPress={handleContinue}
                accessibilityLabel="Continue"
              >
                <LinearGradient
                  colors={[PF.indigo, PF.violet]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Error */}
        {!isLoading && !isVerified && (
          <Card colors={colors}>
            <View style={styles.centerRow}>
              <Ionicons name="alert-circle" size={64} color={PF.rose} />
              <Text
                style={[
                  styles.stateTitle,
                  { color: colors.text, marginTop: 12 },
                ]}
              >
                Verification failed
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
                {error ||
                  "The verification link is invalid or expired. You can request a new one."}
              </Text>

              <View style={{ gap: 10, width: "100%", marginTop: 12 }}>
                <TouchableOpacity
                  disabled={isLoading}
                  onPress={handleResend}
                  accessibilityLabel="Resend verification"
                >
                  <LinearGradient
                    colors={[PF.indigo, PF.violet]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryBtnText}>
                      {isLoading ? "Sending…" : "Resend verification email"}
                    </Text>
                    <Ionicons name="send" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleBackLogin}
                  style={[styles.ghostBtn, { borderColor: colors.border }]}
                  accessibilityLabel="Back to login"
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
            </View>
          </Card>
        )}
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
        padding: 16,
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

  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
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
