import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface RowInlineProps {
  label: string;
  value?: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  hideIfEmpty?: boolean;
  size?: "small" | "medium" | "large";
}

export default function RowInline({
  label,
  value,
  icon,
  hideIfEmpty = true,
  size = "medium",
}: RowInlineProps) {
  const { colors } = useTheme();
  const styles = createStyles();

  // Hide row if value is empty and hideIfEmpty is true
  if (hideIfEmpty && (!value || value === "")) {
    return null;
  }

  return (
    <View style={styles.container}>
      {icon && (
        <View style={styles.iconContainer}>
          <Ionicons
            name={icon}
            size={styles.iconSize}
            color={colors.textSecondary}
          />
        </View>
      )}
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 6,
    },
    iconContainer: {
      marginRight: 8,
      marginTop: 2, // Align with text baseline
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: "#7F8C8D",
      marginRight: 8,
      minWidth: 60, // Ensure consistent alignment
    },
    value: {
      flex: 1,
      fontSize: 14,
      color: "#2C3E50",
      fontWeight: "400",
    },
    iconSize: 16,
  });
