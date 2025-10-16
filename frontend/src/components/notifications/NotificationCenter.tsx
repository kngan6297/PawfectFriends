import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import { Notification as NotificationType } from "../../types/notification";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Bell, Check, Trash2, Archive, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const NotificationItem: React.FC<{
  notification: NotificationType;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  const { markAsRead, deleteNotification, archiveNotification } =
    useNotifications();
  const navigate = useNavigate();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "adoption_request":
        return "🐾";
      case "adoption_status_change":
        return "📋";
      case "new_message":
        return "💬";
      case "pet_status_change":
        return "🐕";
      case "review_received":
        return "⭐";
      case "system_alert":
        return "⚠️";
      case "reminder":
        return "⏰";
      case "meeting_scheduled":
        return "📅";
      default:
        return "🔔";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleAction = () => {
    if (notification.data.actionUrl) {
      let actionUrl = notification.data.actionUrl; // Extract to ensure it's not undefined

      // Convert old URLs to new format if needed
      if (
        actionUrl.startsWith("/adoption-requests/") &&
        !actionUrl.startsWith("/shelter/")
      ) {
        actionUrl = actionUrl.replace("/adoption-requests/", "/adoptions/");
        console.log(
          "🔄 Converting old URL format:",
          notification.data.actionUrl,
          "→",
          actionUrl
        );
      }

      // Convert old my-adoption-requests URLs to new format
      if (actionUrl.startsWith("/my-adoption-requests/")) {
        actionUrl = actionUrl.replace("/my-adoption-requests/", "/adoptions/");
        console.log(
          "🔄 Converting my-adoption-requests URL:",
          notification.data.actionUrl,
          "→",
          actionUrl
        );
      }

      // Store debugging info in localStorage so we can see it even after redirect
      const debugInfo = {
        timestamp: new Date().toISOString(),
        originalActionUrl: notification.data.actionUrl,
        convertedActionUrl: actionUrl,
        notificationType: notification.type,
        notificationId: notification._id,
        currentPath: window.location.pathname,
        hasAuthToken:
          !!localStorage.getItem("token") ||
          !!localStorage.getItem("authToken"),
        userAgent: navigator.userAgent,
      };

      localStorage.setItem("notificationDebug", JSON.stringify(debugInfo));
      console.log("🔔 Notification action debug stored:", debugInfo);

      // Close the dropdown immediately to prevent interference
      onClose();

      // Small delay to ensure dropdown closes before navigation
      setTimeout(() => {
        try {
          // Use React Router navigation instead of window.location.href
          // This prevents full page reload and maintains authentication state
          console.log("🧪 Navigating to:", actionUrl);
          navigate(actionUrl);
        } catch (error) {
          console.error("❌ Navigation error:", error);
          // Store error in localStorage too
          localStorage.setItem(
            "navigationError",
            JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString(),
              actionUrl: actionUrl,
            })
          );
          // Fallback to window.location if navigate fails
          window.location.href = actionUrl;
        }
      }, 100);
    }
  };

  return (
    <div
      className={`p-4 border-b border-gray-100 last:border-b-0 transition-all duration-200 ${
        notification.isRead ? "bg-gray-50" : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="text-2xl">
            {getNotificationIcon(notification.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4
                className={`font-medium text-sm ${
                  notification.isRead ? "text-gray-600" : "text-gray-900"
                }`}
              >
                {notification.title}
              </h4>
              <Badge
                variant="default"
                className={`text-xs ${getPriorityColor(
                  notification.data.priority
                )}`}
              >
                {notification.data.priority}
              </Badge>
            </div>

            <p
              className={`text-sm mb-2 ${
                notification.isRead ? "text-gray-500" : "text-gray-700"
              }`}
            >
              {notification.message}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </span>

              {notification.data.actionUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAction}
                  className="text-xs"
                >
                  {notification.data.actionText || "View"}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 ml-2">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAsRead(notification._id)}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => archiveNotification(notification._id)}
            className="h-8 w-8 p-0"
          >
            <Archive className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteNotification(notification._id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAllAsRead,
    fetchNotifications,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleRefresh = () => {
    fetchNotifications();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={toggleDropdown}
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="danger"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-semibold bg-red-500 text-white border-2 border-white shadow-sm"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Arrow pointer */}
          <div className="absolute right-4 top-0 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-200 animate-in slide-in-from-top-2 duration-200"></div>
          <div className="absolute right-4 top-0 w-0 h-0 border-l-3 border-r-3 border-b-3 border-transparent border-b-white animate-in slide-in-from-top-2 duration-200"></div>

          <div className="absolute right-0 mt-2 w-80 max-h-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
              </div>
            </div>

            {/* Action buttons header */}
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-25 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                </span>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs h-7 px-2"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No notifications yet</p>
                  <p className="text-sm">
                    We'll notify you when something important happens
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification._id}
                      notification={notification}
                      onClose={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
