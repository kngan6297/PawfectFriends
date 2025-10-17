import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  notificationService,
  Notification,
} from "@/services/notificationService";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function GuestNotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (pageNum === 1) {
          setLoading(true);
        }

        const response = await notificationService.getNotifications({
          page: pageNum,
          limit: 20,
        });

        if (response.status === "success" && response.data) {
          if (pageNum === 1) {
            setNotifications(response.data.notifications);
          } else {
            setNotifications((prev) => [
              ...prev,
              ...response.data.notifications,
            ]);
          }
          setHasMore(
            response.data.pagination.page < response.data.pagination.pages
          );
          setError(null);
        } else {
          setError(response.message || "Failed to fetch notifications");
        }
      } catch (err) {
        setError("An error occurred while fetching notifications");
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.status === "success") {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.status === "success") {
        setNotifications((prev) =>
          prev.map((notif) => ({
            ...notif,
            isRead: true,
            readAt: new Date().toISOString(),
          }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, []);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const response = await notificationService.deleteNotification(
          notificationId
        );
        if (response.status === "success") {
          setNotifications((prev) =>
            prev.filter((notif) => notif._id !== notificationId)
          );
          // Update unread count if the deleted notification was unread
          const deletedNotif = notifications.find(
            (notif) => notif._id === notificationId
          );
          if (deletedNotif && !deletedNotif.isRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      } catch (err) {
        console.error("Error deleting notification:", err);
      }
    },
    [notifications]
  );

  const handleRefresh = useCallback(() => {
    setPage(1);
    fetchNotifications(1, true);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  }, [hasMore, loading, page, fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "adoption_request":
        return "paw";
      case "adoption_status_change":
        return "checkmark-circle";
      case "new_message":
        return "chatbubbles";
      case "pet_status_change":
        return "paw";
      case "review_received":
        return "star";
      case "system_alert":
        return "warning";
      case "reminder":
        return "time";
      case "meeting_scheduled":
        return "calendar";
      case "contract_sent":
        return "document-text";
      default:
        return "notifications";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "#EF4444";
      case "high":
        return "#F59E0B";
      case "medium":
        return "#3B82F6";
      case "low":
        return "#6B7280";
      default:
        return colors.textSecondary;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { backgroundColor: colors.surface, borderColor: colors.border },
        !item.isRead && { backgroundColor: colors.primary + "10" },
      ]}
      onPress={() => {
        if (!item.isRead) {
          markAsRead(item._id);
        }
        // Handle navigation based on actionUrl if available
        if (item.data?.actionUrl) {
          // You might want to implement navigation logic here
          console.log("Navigate to:", item.data.actionUrl);
        }
      }}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationTitleRow}>
            <Ionicons
              name={getNotificationIcon(item.type) as any}
              size={20}
              color={getPriorityColor(item.data?.priority)}
              style={styles.notificationIcon}
            />
            <Text
              style={[
                styles.notificationTitle,
                { color: colors.text },
                !item.isRead && styles.unreadText,
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            {!item.isRead && (
              <View
                style={[styles.unreadDot, { backgroundColor: colors.primary }]}
              />
            )}
          </View>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Delete Notification",
                "Are you sure you want to delete this notification?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteNotification(item._id),
                  },
                ]
              );
            }}
            style={styles.deleteButton}
          >
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text
          style={[styles.notificationMessage, { color: colors.textSecondary }]}
          numberOfLines={3}
        >
          {item.message}
        </Text>

        <View style={styles.notificationFooter}>
          <Text
            style={[styles.notificationTime, { color: colors.textSecondary }]}
          >
            {new Date(item.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          {item.data?.priority && (
            <View
              style={[
                styles.priorityBadge,
                {
                  backgroundColor: getPriorityColor(item.data.priority) + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  { color: getPriorityColor(item.data.priority) },
                ]}
              >
                {item.data.priority.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && notifications.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ErrorMessage message={error} onRetry={handleRefresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Notifications
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            style={styles.markAllButton}
          >
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="notifications-off"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No notifications
          </Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            You're all caught up! New notifications will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  notificationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  unreadText: {
    fontWeight: "600",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationTime: {
    fontSize: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
