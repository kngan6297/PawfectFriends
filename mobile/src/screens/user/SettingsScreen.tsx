import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/hooks/useTheme";
import { pageContainer, scrollContent, GUTTER } from "@/ui/layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import {
  settingsService,
  SettingsData,
  NotificationSettings,
  PrivacySettings,
  AppSettings,
} from "@/services/settingsService";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuthStore();

  const [settings, setSettings] = useState<SettingsData | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PF = useMemo(() => ({ indigo: "#6366F1", violet: "#7C3AED" }), []);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const loadedSettings = await settingsService.loadSettings();
      setSettings(loadedSettings);
    } catch (err) {
      setError("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: SettingsData) => {
    try {
      setIsLoading(true);
      await settingsService.saveSettings(newSettings);
      setSettings(newSettings);
      await settingsService.syncWithBackend(newSettings);
      Alert.alert("Success", "Settings saved successfully");
    } catch (err) {
      setError("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    if (!settings) return;
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    };
    saveSettings(newSettings);
  };

  const handlePrivacyToggle = (key: keyof PrivacySettings) => {
    if (!settings) return;
    const newSettings = {
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: !settings.privacy[key],
      },
    };
    saveSettings(newSettings);
  };

  const handleAppToggle = (key: keyof AppSettings) => {
    if (!settings) return;
    const newSettings = {
      ...settings,
      app: {
        ...settings.app,
        [key]: !settings.app[key],
      },
    };
    saveSettings(newSettings);
  };

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    if (!settings) return;
    const newSettings = {
      ...settings,
      app: {
        ...settings.app,
        theme,
      },
    };
    saveSettings(newSettings);
  };

  const handleLanguageChange = (language: "en" | "vi") => {
    if (!settings) return;
    const newSettings = {
      ...settings,
      app: {
        ...settings.app,
        language,
      },
    };
    saveSettings(newSettings);
  };

  const handleProfileVisibilityChange = (visibility: "public" | "private") => {
    if (!settings) return;
    const newSettings = {
      ...settings,
      privacy: {
        ...settings.privacy,
        profileVisibility: visibility,
      },
    };
    saveSettings(newSettings);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. Are you sure you want to delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Coming Soon",
              "Account deletion will be available soon!"
            );
          },
        },
      ]
    );
  };

  if (isLoading || !settings) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Settings
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {error && <ErrorMessage message={error} />}

      <ScrollView
        contentContainerStyle={scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={pageContainer}>
          {/* Notifications Section */}
          <MenuGroup title="Notifications">
            <MenuItem
              icon="mail"
              label="Email Notifications"
              trailing={
                <Switch
                  value={settings.notifications.emailNotifications}
                  onValueChange={() =>
                    handleNotificationToggle("emailNotifications")
                  }
                  trackColor={{ false: colors.border, true: PF.indigo }}
                  thumbColor={
                    settings.notifications.emailNotifications
                      ? "#fff"
                      : colors.textSecondary
                  }
                />
              }
              isFirst={true}
            />
            <MenuItem
              icon="notifications"
              label="Push Notifications"
              trailing={
                <Switch
                  value={settings.notifications.pushNotifications}
                  onValueChange={() =>
                    handleNotificationToggle("pushNotifications")
                  }
                  trackColor={{ false: colors.border, true: PF.indigo }}
                  thumbColor={
                    settings.notifications.pushNotifications
                      ? "#fff"
                      : colors.textSecondary
                  }
                />
              }
            />
            <MenuItem
              icon="paw"
              label="Adoption Updates"
              trailing={
                <Switch
                  value={settings.notifications.adoptionUpdates}
                  onValueChange={() =>
                    handleNotificationToggle("adoptionUpdates")
                  }
                  trackColor={{ false: colors.border, true: PF.indigo }}
                  thumbColor={
                    settings.notifications.adoptionUpdates
                      ? "#fff"
                      : colors.textSecondary
                  }
                />
              }
            />
            <MenuItem
              icon="heart"
              label="New Pets"
              trailing={
                <Switch
                  value={settings.notifications.newPets}
                  onValueChange={() => handleNotificationToggle("newPets")}
                  trackColor={{ false: colors.border, true: PF.indigo }}
                  thumbColor={
                    settings.notifications.newPets
                      ? "#fff"
                      : colors.textSecondary
                  }
                />
              }
            />
            <MenuItem
              icon="time"
              label="Reminders"
              trailing={
                <Switch
                  value={settings.notifications.reminders}
                  onValueChange={() => handleNotificationToggle("reminders")}
                  trackColor={{ false: colors.border, true: PF.indigo }}
                  thumbColor={
                    settings.notifications.reminders
                      ? "#fff"
                      : colors.textSecondary
                  }
                />
              }
            />
          </MenuGroup>

          {/* Privacy Section */}
          <MenuGroup title="Privacy">
            <MenuItem
              icon="eye"
              label="Profile Visibility"
              trailing={
                <TouchableOpacity
                  onPress={() =>
                    handleProfileVisibilityChange(
                      settings.privacy.profileVisibility === "public"
                        ? "private"
                        : "public"
                    )
                  }
                  style={styles.optionButton}
                >
                  <Text style={[styles.optionText, { color: PF.indigo }]}>
                    {settings.privacy.profileVisibility === "public"
                      ? "Public"
                      : "Private"}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              }
              isFirst={true}
            />
            <MenuItem
              icon="mail"
              label="Show Email"
              trailing={
                <Switch
                  value={settings.privacy.showEmail}
                  onValueChange={() => handlePrivacyToggle("showEmail")}
                  trackColor={{ false: colors.border, true: PF.indigo }}
                  thumbColor={
                    settings.privacy.showEmail ? "#fff" : colors.textSecondary
                  }
                />
              }
            />
            <MenuItem
              icon="call"
              label="Show Phone"
              trailing={
                <Switch
                  value={settings.privacy.showPhone}
                  onValueChange={() => handlePrivacyToggle("showPhone")}
                  trackColor={{ false: colors.border, true: PF.indigo }}
                  thumbColor={
                    settings.privacy.showPhone ? "#fff" : colors.textSecondary
                  }
                />
              }
            />
            <MenuItem
              icon="chatbubbles"
              label="Allow Messages"
              trailing={
                <Switch
                  value={settings.privacy.allowMessages}
                  onValueChange={() => handlePrivacyToggle("allowMessages")}
                  trackColor={{ false: colors.border, true: PF.indigo }}
                  thumbColor={
                    settings.privacy.allowMessages
                      ? "#fff"
                      : colors.textSecondary
                  }
                />
              }
            />
          </MenuGroup>

          {/* App Preferences Section */}
          <MenuGroup title="App Preferences">
            <MenuItem
              icon="color-palette"
              label="Theme"
              trailing={
                <TouchableOpacity
                  onPress={() => {
                    const themes = ["light", "dark", "system"];
                    const currentIndex = themes.indexOf(settings.app.theme);
                    const nextTheme = themes[
                      (currentIndex + 1) % themes.length
                    ] as "light" | "dark" | "system";
                    handleThemeChange(nextTheme);
                  }}
                  style={styles.optionButton}
                >
                  <Text style={[styles.optionText, { color: PF.indigo }]}>
                    {settings.app.theme.charAt(0).toUpperCase() +
                      settings.app.theme.slice(1)}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              }
              isFirst={true}
            />
            <MenuItem
              icon="language"
              label="Language"
              trailing={
                <TouchableOpacity
                  onPress={() =>
                    handleLanguageChange(
                      settings.app.language === "en" ? "vi" : "en"
                    )
                  }
                  style={styles.optionButton}
                >
                  <Text style={[styles.optionText, { color: PF.indigo }]}>
                    {settings.app.language === "en" ? "English" : "Tiếng Việt"}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              }
            />
            <MenuItem
              icon="refresh"
              label="Auto Refresh"
              trailing={
                <Switch
                  value={settings.app.autoRefresh}
                  onValueChange={() => handleAppToggle("autoRefresh")}
                  trackColor={{ false: colors.border, true: PF.indigo }}
                  thumbColor={
                    settings.app.autoRefresh ? "#fff" : colors.textSecondary
                  }
                />
              }
            />
            <MenuItem
              icon="image"
              label="Cache Images"
              trailing={
                <Switch
                  value={settings.app.cacheImages}
                  onValueChange={() => handleAppToggle("cacheImages")}
                  trackColor={{ false: colors.border, true: PF.indigo }}
                  thumbColor={
                    settings.app.cacheImages ? "#fff" : colors.textSecondary
                  }
                />
              }
            />
          </MenuGroup>

          {/* Account Management Section */}
          <MenuGroup title="Account">
            <MenuItem
              icon="person-circle"
              label="Edit Profile"
              onPress={() => router.push("/(tabs)/profile/edit")}
              isFirst={true}
            />
            <MenuItem
              icon="lock-closed"
              label="Change Password"
              onPress={() =>
                Alert.alert(
                  "Coming Soon",
                  "Password change will be available soon!"
                )
              }
            />
            <MenuItem
              icon="shield-checkmark"
              label="Privacy Policy"
              onPress={() =>
                Alert.alert(
                  "Coming Soon",
                  "Privacy policy will be available soon!"
                )
              }
            />
            <MenuItem
              icon="document-text"
              label="Terms of Service"
              onPress={() =>
                Alert.alert(
                  "Coming Soon",
                  "Terms of service will be available soon!"
                )
              }
            />
          </MenuGroup>

          {/* Danger Zone */}
          <MenuGroup title="Danger Zone">
            <MenuItem
              icon="log-out"
              label="Logout"
              onPress={handleLogout}
              isFirst={true}
            />
            <MenuItem
              icon="trash"
              label="Delete Account"
              onPress={handleDeleteAccount}
            />
          </MenuGroup>

          {/* Logout button with gradient */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <Pressable
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Log out"
              style={{ zIndex: 1000 }}
            >
              <LinearGradient
                colors={[PF.indigo, PF.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}
              >
                <Ionicons name="log-out" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  Log out
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuGroup({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      <Text
        style={{
          color: colors.text,
          fontWeight: "900",
          fontSize: 14,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  trailing,
  isFirst = false,
}: {
  icon: any;
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  isFirst?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: colors.surface,
          ...(isFirst
            ? {}
            : { borderTopWidth: 1, borderTopColor: colors.border }),
        }}
      >
        <Ionicons name={icon} size={18} color={colors.text} />
        <Text style={{ color: colors.text, fontWeight: "800", flex: 1 }}>
          {label}
        </Text>
        {trailing ?? (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: GUTTER,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
});
