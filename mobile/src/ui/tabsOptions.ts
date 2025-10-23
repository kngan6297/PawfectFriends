import { Platform } from "react-native";
import { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const makeTabsOptions = (colors: any): BottomTabNavigationOptions => {
    const insets = useSafeAreaInsets();
    
    return {
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary, // ← always use purple from the theme
        tabBarInactiveTintColor: colors.textSecondary,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 56 + insets.bottom,
            paddingTop: 6,
            paddingBottom: insets.bottom + 6,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            ...(Platform.OS === "android" ? { elevation: 0 } : {}),
            ...Platform.select({ web: { width: "100%" } }),
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarIconStyle: { marginTop: 2 },
        tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
            marginTop: 2
        } as any,
    } as BottomTabNavigationOptions;
};
