import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export default function ErrorMessage({
  message,
  onRetry,
  showRetry = true,
}: ErrorMessageProps) {
  const { colors } = useTheme();
  const styles = createStyles();

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={48} color={colors.error} />
      <Text style={styles.message}>{message}</Text>
      {showRetry && onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    message: {
      fontSize: 16,
      color: "#7F8C8D",
      textAlign: "center",
      marginTop: 12,
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: "#7C3AED",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });
