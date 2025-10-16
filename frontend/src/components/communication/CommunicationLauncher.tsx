import React, { useState, useEffect } from "react";
import { Button, Modal, Badge, Tooltip } from "react-bootstrap";
import { MessageCircle, Phone, Video, X } from "lucide-react";

interface CommunicationLauncherProps {
  userId?: string;
  userName?: string;
  userAvatar?: string;
  className?: string;
}

interface CommunicationConfig {
  communicationUrl: string;
  mainAppUrl: string;
  sharedStorageKey: string;
}

const CommunicationLauncher: React.FC<CommunicationLauncherProps> = ({
  userId,
  userName,
  userAvatar,
  className = "",
}) => {
  const [showModal, setShowModal] = useState(false);
  const [communicationWindow, setCommunicationWindow] = useState<Window | null>(
    null
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Configuration for development and production
  const config: CommunicationConfig = {
    communicationUrl: import.meta.env.DEV
      ? `http://localhost:${import.meta.env.VITE_COMMUNICATION_PORT || "3000"}`
      : import.meta.env.VITE_COMMUNICATION_URL ||
        "https://yourdomain.com/communication",
    mainAppUrl: import.meta.env.DEV
      ? `http://localhost:${import.meta.env.VITE_MAIN_APP_PORT || "5173"}`
      : import.meta.env.VITE_MAIN_APP_URL || "https://yourdomain.com",
    sharedStorageKey: "pawfect-friends-auth",
  };

  // Share authentication data with communication app
  useEffect(() => {
    if (userId && userName) {
      const authData = {
        userId,
        userName,
        userAvatar,
        timestamp: Date.now(),
        mainAppUrl: config.mainAppUrl,
      };

      // Store in localStorage for communication app to access
      localStorage.setItem(config.sharedStorageKey, JSON.stringify(authData));

      // Listen for messages from communication app
      const handleMessage = (event: MessageEvent) => {
        if (event.origin === new URL(config.communicationUrl).origin) {
          handleCommunicationMessage(event.data);
        }
      };

      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }
  }, [userId, userName, userAvatar, config]);

  // Handle messages from communication app
  const handleCommunicationMessage = (data: any) => {
    switch (data.type) {
      case "UNREAD_COUNT_UPDATE":
        setUnreadCount(data.count);
        break;
      case "CONNECTION_STATUS":
        setIsConnected(data.connected);
        break;
      case "NAVIGATE_TO_MAIN_APP":
        // Handle navigation requests from communication app
        if (data.path) {
          window.location.href = data.path;
        }
        break;
      default:
        console.log("Received message from communication app:", data);
    }
  };

  // Launch communication app
  const launchCommunication = () => {
    if (communicationWindow && !communicationWindow.closed) {
      communicationWindow.focus();
      return;
    }

    const features =
      "width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no";
    const newWindow = window.open(
      config.communicationUrl,
      "pawfect-communication",
      features
    );

    if (newWindow) {
      setCommunicationWindow(newWindow);
      setShowModal(false);

      // Monitor window state
      const checkWindow = setInterval(() => {
        if (newWindow.closed) {
          setCommunicationWindow(null);
          clearInterval(checkWindow);
        }
      }, 1000);
    }
  };

  // Quick actions
  const quickActions = [
    {
      icon: <MessageCircle size={20} />,
      label: "Chat",
      action: () => launchCommunication(),
      color: "primary",
    },
    {
      icon: <Phone size={20} />,
      label: "Voice Call",
      action: () => launchCommunication(),
      color: "success",
    },
    {
      icon: <Video size={20} />,
      label: "Video Call",
      action: () => launchCommunication(),
      color: "info",
    },
  ];

  return (
    <>
      {/* Communication Launcher Button */}
      <div className={`communication-launcher ${className}`}>
        <Tooltip title="Open Communication Center">
          <Button
            variant="outline-primary"
            size="lg"
            onClick={() => setShowModal(true)}
            className="communication-launcher-btn"
          >
            <MessageCircle size={24} />
            {unreadCount > 0 && (
              <Badge
                bg="danger"
                className="position-absolute top-0 start-100 translate-middle"
                style={{ fontSize: "0.75rem" }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </Tooltip>
      </div>

      {/* Communication Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <MessageCircle size={24} className="me-2" />
            Communication Center
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <p className="text-muted">
              Connect with other users through chat, voice, and video calls
            </p>
          </div>

          {/* Quick Actions */}
          <div className="row g-3 mb-4">
            {quickActions.map((action, index) => (
              <div key={index} className="col-md-4">
                <Button
                  variant={action.color as any}
                  className="w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3"
                  onClick={action.action}
                  style={{ minHeight: "120px" }}
                >
                  <div className="mb-2">{action.icon}</div>
                  <span>{action.label}</span>
                </Button>
              </div>
            ))}
          </div>

          {/* Status Information */}
          <div className="row g-3">
            <div className="col-md-6">
              <div className="d-flex align-items-center p-3 border rounded">
                <div
                  className={`status-indicator ${
                    isConnected ? "connected" : "disconnected"
                  }`}
                />
                <div className="ms-3">
                  <small className="text-muted">Status</small>
                  <div>{isConnected ? "Connected" : "Disconnected"}</div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex align-items-center p-3 border rounded">
                <MessageCircle size={20} className="text-muted" />
                <div className="ms-3">
                  <small className="text-muted">Unread Messages</small>
                  <div>{unreadCount}</div>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={launchCommunication}>
            Open Communication Center
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Styles */}
      <style>{`
        .communication-launcher {
          position: relative;
        }

        .communication-launcher-btn {
          position: relative;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #dc3545;
        }

        .status-indicator.connected {
          background-color: #198754;
        }

        .status-indicator.disconnected {
          background-color: #dc3545;
        }
      `}</style>
    </>
  );
};

export default CommunicationLauncher;
