import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { makeTabsOptions } from "@/ui/tabsOptions";

export default function GuestTabsLayout() {
  const { colors } = useTheme();

  const icon = (
    focused: boolean,
    on: keyof typeof Ionicons.glyphMap,
    off: keyof typeof Ionicons.glyphMap
  ) => (
    <Ionicons
      name={(focused ? on : off) as any}
      size={20}
      color={focused ? colors.primary : colors.textSecondary}
    />
  );

  return (
    <Tabs
      screenOptions={makeTabsOptions(colors) as any}
      initialRouteName="home"
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => icon(focused, "home", "home-outline"),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ focused }) =>
            icon(focused, "search", "search-outline"),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ focused }) => icon(focused, "heart", "heart-outline"),
        }}
      />
      <Tabs.Screen
        name="adoptions"
        options={{
          title: "Adoptions",
          tabBarIcon: ({ focused }) => icon(focused, "paw", "paw-outline"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) =>
            icon(focused, "person", "person-outline"),
        }}
      />

      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
