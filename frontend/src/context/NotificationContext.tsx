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

  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(
    async (params: any = {}) => {
      if (!user) return;

      const key = requestDeduplication.generateKey('GET', '/api/notifications', params);
      
      return requestDeduplication.execute(key, async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await notificationApi.getNotifications(params);
          setNotifications(response.data.notifications);
        } catch (err: any) {
          setError(
            err.response?.data?.message || "Failed to fetch notifications"
          );
          console.error("Error fetching notifications:", err);
        } finally {
          setLoading(false);
        }
      });
    },
    [user]
  );

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;

    const key = requestDeduplication.generateKey('GET', '/api/notifications/unread-count');
    
    return requestDeduplication.execute(key, async () => {
      try {
        const response = await notificationApi.getUnreadCount();
        setUnreadCount(response.data.unreadCount);
      } catch (err: any) {
        console.error("Error fetching unread count:", err);
      }
    });
  }, [user]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await notificationApi.markAsRead(notificationId);

        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? { ...notification, isRead: true, readAt: new Date() }
              : notification
          )
        );

        // Refresh unread count
        await refreshUnreadCount();
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to mark notification as read"
        );
        console.error("Error marking notification as read:", err);
      }
    },
    [refreshUnreadCount]
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

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchNotifications();
      refreshUnreadCount();
    }
  }, [user, fetchNotifications, refreshUnreadCount]);

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
