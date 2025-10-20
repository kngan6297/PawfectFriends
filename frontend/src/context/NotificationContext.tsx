import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "../hooks/useAuth";
import { notificationApi } from "../services/api";
import { requestDeduplication } from "../services/requestDeduplication";
import {
  Notification as NotificationType,
  UnreadCountResponse,
} from "../types/notification";
import {
  useNotificationsQuery,
  useUnreadNotificationsCount,
  useMarkNotificationReadMutation,
} from "../hooks/useApiQueries";

interface NotificationContextType {
  notifications: NotificationType[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (params?: any) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();

  // Use React Query hooks for notifications
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    error: notificationsError,
  } = useNotificationsQuery();
  const { data: unreadCountData, isLoading: unreadCountLoading } =
    useUnreadNotificationsCount();
  const markAsReadMutation = useMarkNotificationReadMutation();

  const notifications = notificationsData?.data?.notifications || [];
  const unreadCount = unreadCountData?.data?.unreadCount || 0;
  const loading = notificationsLoading || unreadCountLoading;
  const error = notificationsError?.message || null;

  // React Query handles fetching automatically, so we can remove these functions
  const fetchNotifications = useCallback(async (params: any = {}) => {
    // This function is kept for backward compatibility but React Query handles the actual fetching
    console.log("fetchNotifications called with params:", params);
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    // This function is kept for backward compatibility but React Query handles the actual fetching
    console.log("refreshUnreadCount called");
  }, []);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await markAsReadMutation.mutateAsync(notificationId);
      } catch (err: any) {
        console.error("Error marking notification as read:", err);
        throw err;
      }
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: new Date(),
        }))
      );

      // Reset unread count
      setUnreadCount(0);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to mark all notifications as read"
      );
      console.error("Error marking all notifications as read:", err);
    }
  }, []);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await notificationApi.deleteNotification(notificationId);

        // Update local state
        setNotifications((prev) =>
          prev.filter((notification) => notification._id !== notificationId)
        );

        // Refresh unread count
        await refreshUnreadCount();
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to delete notification"
        );
        console.error("Error deleting notification:", err);
      }
    },
    [refreshUnreadCount]
  );

  const archiveNotification = useCallback(
    async (notificationId: string) => {
      try {
        await notificationApi.archiveNotification(notificationId);

        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? { ...notification, isArchived: true }
              : notification
          )
        );

        // Refresh unread count
        await refreshUnreadCount();
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to archive notification"
        );
        console.error("Error archiving notification:", err);
      }
    },
    [refreshUnreadCount]
  );

  // Real-time notifications are handled by the communication service
  // Socket functionality has been moved to the communication folder

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    refreshUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
