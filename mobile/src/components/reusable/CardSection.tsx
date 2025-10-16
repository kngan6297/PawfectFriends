import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import RowInline from "./RowInline";

interface CardSectionProps {
  title: string;
  children?: React.ReactNode;
  padding?: number;
  marginBottom?: number;
}

export default function CardSection({
  title,
  children,
  padding = 16,
  marginBottom = 24,
}: CardSectionProps) {
  const { colors } = useTheme();
  const styles = createStyles();

  return (
    <View style={[styles.container, { marginBottom }]}>
      <Text
        style={[
          styles.title,
          { paddingHorizontal: padding, paddingTop: padding },
        ]}
      >
        {title}
      </Text>
      <View
        style={[
          styles.content,
          { paddingHorizontal: padding, paddingBottom: padding },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      backgroundColor: "#F8F9FA",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#E1E8ED",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: "#2C3E50",
      paddingBottom: 8,
    },
    content: {},
  });
