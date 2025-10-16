// Service Worker for Push Notifications
// Handles incoming calls and messages when user is offline or on different tabs

const CACHE_NAME = "pawfect-friends-v1";
const NOTIFICATION_TAG = "pawfect-friends-notification";

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  console.log("[SW] Service Worker installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching essential resources");
        return cache.addAll([
          "/",
          "/index.html",
          "/static/js/bundle.js",
          "/static/css/main.css",
        ]);
      })
      .catch((error) => {
        console.error("[SW] Cache installation failed:", error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Service Worker activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push notification event
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received:", event);

  if (!event.data) {
    console.log("[SW] No data received with push event");
    return;
  }

  try {
    const data = event.data.json();
    console.log("[SW] Push data:", data);

    const options = {
      body: data.body || "You have a new notification",
      icon: data.icon || "/favicon.ico",
      badge: data.badge || "/favicon.ico",
      tag: NOTIFICATION_TAG,
      data: data,
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      vibrate: data.vibrate || [200, 100, 200],
      sound: data.sound || null,
      dir: data.dir || "ltr",
      lang: data.lang || "en",
      renotify: data.renotify || true,
      image: data.image || null,
      timestamp: data.timestamp || Date.now(),
    };

    // Handle different notification types
    switch (data.type) {
      case "incoming_call":
        options.body = `Incoming ${data.callType} call from ${data.callerName}`;
        options.requireInteraction = true;
        options.actions = [
          {
            action: "accept_call",
            title: "Accept",
            icon: "/icons/accept-call.png",
          },
          {
            action: "decline_call",
            title: "Decline",
            icon: "/icons/decline-call.png",
          },
        ];
        break;

      case "new_message":
        options.body = `New message from ${data.senderName}: ${data.message}`;
        options.requireInteraction = false;
        break;

      case "call_ended":
        options.body = `Call ended with ${data.participantName}`;
        options.requireInteraction = false;
        break;

      default:
        options.body = data.body || "You have a new notification";
    }

    event.waitUntil(
      self.registration.showNotification(
        data.title || "Pawfect Friends",
        options
      )
    );
  } catch (error) {
    console.error("[SW] Error processing push notification:", error);

    // Fallback notification
    event.waitUntil(
      self.registration.showNotification("Pawfect Friends", {
        body: "You have a new notification",
        icon: "/favicon.ico",
        tag: NOTIFICATION_TAG,
      })
    );
  }
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event);

  event.notification.close();

  const data = event.notification.data;
  const action = event.action;

  // Handle notification actions
  if (action === "accept_call" && data) {
    // Send message to main thread to accept call
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "accept_call",
          data: data,
        });
      });
    });
  } else if (action === "decline_call" && data) {
    // Send message to main thread to decline call
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "decline_call",
          data: data,
        });
      });
    });
  } else {
    // Default behavior - focus on the app
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clients) => {
        // If app is already open, focus it
        if (clients.length > 0) {
          return clients[0].focus();
        }
        // If app is not open, open it
        return self.clients.openWindow("/");
      })
    );
  }
});

// Background sync for offline functionality
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event);

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle background sync tasks
      console.log("[SW] Background sync completed")
    );
  }
});

// Message event from main thread
self.addEventListener("message", (event) => {
  console.log("[SW] Message from main thread:", event.data);

  const { type, data } = event.data;

  switch (type) {
    case "UPDATE_PUSH_SUBSCRIPTION":
      // Update push subscription
      console.log("[SW] Updating push subscription");
      break;

    case "CLEAR_NOTIFICATIONS":
      // Clear all notifications
      self.registration.getNotifications().then((notifications) => {
        notifications.forEach((notification) => {
          notification.close();
        });
      });
      break;

    case "SHOW_NOTIFICATION":
      // Show a notification from main thread
      self.registration.showNotification(data.title, data.options);
      break;

    default:
      console.log("[SW] Unknown message type:", type);
  }
});

// Handle fetch events for offline functionality
self.addEventListener("fetch", (event) => {
  // Only handle API calls for offline functionality
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return cached response if available
        return caches.match(event.request);
      })
    );
  }
});

// Utility functions
function showNotification(title, options) {
  return self.registration.showNotification(title, options);
}

function clearNotifications() {
  return self.registration.getNotifications().then((notifications) => {
    notifications.forEach((notification) => {
      notification.close();
    });
  });
}

// Export utility functions for use in main thread
self.showNotification = showNotification;
self.clearNotifications = clearNotifications;
