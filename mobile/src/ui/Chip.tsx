import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  variant?: "default" | "small" | "tag";
}

export default function Chip({
  label,
  active = false,
  onPress,
  variant = "default",
}: ChipProps) {
  const { colors } = useTheme();

  const styles = createStyles();

  const Component = onPress ? TouchableOpacity : View;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: active ? "#6366F1" : "#F8F9FA",
          borderColor: active ? "#6366F1" : "#E5E7EB",
          borderRadius: variant === "small" ? 8 : variant === "tag" ? 12 : 999,
          paddingHorizontal:
            variant === "small" ? 8 : variant === "tag" ? 6 : 14,
          paddingVertical: variant === "small" ? 4 : variant === "tag" ? 3 : 8,
          marginHorizontal: variant === "tag" ? 0 : 4,
        },
      ]}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? `${label} filter` : label}
    >
      <Text
        style={[
          styles.text,
          {
            color: active ? "#fff" : "#111827",
            fontSize: variant === "small" ? 11 : variant === "tag" ? 10 : 12,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      fontWeight: "800",
      textTransform: "capitalize",
    },
  });
