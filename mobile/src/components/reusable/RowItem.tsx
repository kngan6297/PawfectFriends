import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface RowItemProps {
  label: string;
  value?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  hideIfEmpty?: boolean;
  size?: "small" | "medium" | "large";
}

export default function RowItem({
  label,
  value,
  icon,
  hideIfEmpty = true,
  size = "medium",
}: RowItemProps) {
  const { colors } = useTheme();
  const styles = createStyles();

  // Hide row if value is undefined/null and hideIfEmpty is true
  if (hideIfEmpty && value === undefined) {
    return null;
  }

  const statusIcon = value ? "checkmark-circle" : "close-circle";
  const statusColor = value ? colors.success : colors.error;
  const displayIcon = icon || statusIcon;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={displayIcon}
          size={styles.iconSize}
          color={statusColor}
        />
      </View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.statusContainer}>
        <Ionicons
          name={statusIcon}
          size={styles.statusIconSize}
          color={statusColor}
        />
      </View>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: "#F8F9FA",
      borderRadius: 8,
      marginVertical: 4,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    iconContainer: {
      marginRight: 12,
    },
    label: {
      flex: 1,
      fontSize: 16,
      color: "#2C3E50",
      fontWeight: "500",
    },
    statusContainer: {
      marginLeft: 12,
    },
    iconSize: 20,
    statusIconSize: 18,
  });
