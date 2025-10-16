import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface ChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | number | boolean;
  color?: string;
  backgroundColor?: string;
  size?: "small" | "medium" | "large";
  hideIfEmpty?: boolean;
}

export default function Chip({
  icon,
  label,
  value,
  color,
  backgroundColor,
  size = "medium",
  hideIfEmpty = true,
}: ChipProps) {
  const { colors } = useTheme();
  const styles = createStyles();

  // Hide chip if value is empty and hideIfEmpty is true
  if (hideIfEmpty && (value === undefined || value === null || value === "")) {
    return null;
  }

  const displayValue =
    typeof value === "boolean" ? (value ? "Yes" : "No") : value;
  const chipColor = color || colors.text;
  const chipBackgroundColor = backgroundColor || colors.surface;

  return (
    <View style={[styles.container, { backgroundColor: chipBackgroundColor }]}>
      <Ionicons name={icon} size={styles.iconSize} color={chipColor} />
      <Text style={[styles.label, { color: chipColor }]} numberOfLines={1}>
        {label}
      </Text>
      {displayValue && (
        <Text style={[styles.value, { color: chipColor }]} numberOfLines={1}>
          {displayValue}
        </Text>
      )}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: 16,
      marginHorizontal: 6,
      marginVertical: 6,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      marginLeft: 6,
      flex: 1,
    },
    value: {
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 4,
      textTransform: "capitalize",
    },
    iconSize: 16,
  });
