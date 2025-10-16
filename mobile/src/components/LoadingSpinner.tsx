import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  text?: string;
}

export default function LoadingSpinner({
  size = "large",
  color,
  text,
}: LoadingSpinnerProps) {
  const { colors } = useTheme();
  const spinnerColor = color || colors.primary;

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
});
