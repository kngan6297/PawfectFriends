import React from "react";
import { ToastContainer, ToastContainerProps } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./toast-styles.css";

/**
 * Optimized ToastContainer with enhanced configuration
 * - Prevents toast spam with proper limits and deduplication
 * - Light theme only
 * - Custom styling for better UX
 * - Proper positioning and animations
 */
export const OptimizedToastContainer: React.FC = () => {
  const toastConfig: ToastContainerProps = {
    // Position - centered at top for better visibility
    position: "top-center",

    // Theme - light mode only
    theme: "light",

    // Limits to prevent spam
    limit: 3, // Maximum 3 toasts at once
    newestOnTop: true, // New toasts appear on top

    // Auto-close settings
    autoClose: 5000, // 5 seconds
    closeOnClick: true,
    pauseOnHover: true,
    pauseOnFocusLoss: true,

    // Animation settings
    hideProgressBar: false,
    draggable: true,
    draggablePercent: 60,

    // Styling
    toastClassName: "custom-toast",
    progressClassName: "custom-toast-progress",

    // Accessibility
    role: "alert",

    // Custom container ID for better targeting
    containerId: "pawfect-toast-container",

    // Enable rtl support
    rtl: false,

    // Custom close button
    closeButton: true,

    // Custom styles for better integration
    style: {
      zIndex: 9999,
    },
  };

  return <ToastContainer {...toastConfig} />;
};

/**
 * Toast utility functions for consistent usage
 */
export const toastUtils = {
  /**
   * Show success toast with deduplication
   */
  success: (message: string, options?: any) => {
    const toast = require("react-toastify").toast;
    return toast.success(message, {
      toastId: `success-${message}`, // Prevents duplicate success messages
      ...options,
    });
  },

  /**
   * Show error toast with deduplication
   */
  error: (message: string, options?: any) => {
    const toast = require("react-toastify").toast;
    return toast.error(message, {
      toastId: `error-${message}`, // Prevents duplicate error messages
      autoClose: 7000, // Longer display for errors
      ...options,
    });
  },

  /**
   * Show warning toast with deduplication
   */
  warning: (message: string, options?: any) => {
    const toast = require("react-toastify").toast;
    return toast.warning(message, {
      toastId: `warning-${message}`,
      ...options,
    });
  },

  /**
   * Show info toast with deduplication
   */
  info: (message: string, options?: any) => {
    const toast = require("react-toastify").toast;
    return toast.info(message, {
      toastId: `info-${message}`,
      ...options,
    });
  },

  /**
   * Show loading toast
   */
  loading: (message: string, options?: any) => {
    const toast = require("react-toastify").toast;
    return toast.loading(message, {
      toastId: `loading-${message}`,
      autoClose: false, // Don't auto-close loading toasts
      closeButton: false, // No close button for loading
      ...options,
    });
  },

  /**
   * Update existing toast
   */
  update: (toastId: string, options: any) => {
    const toast = require("react-toastify").toast;
    return toast.update(toastId, options);
  },

  /**
   * Dismiss specific toast
   */
  dismiss: (toastId: string) => {
    const toast = require("react-toastify").toast;
    return toast.dismiss(toastId);
  },

  /**
   * Clear all toasts
   */
  clear: () => {
    const toast = require("react-toastify").toast;
    return toast.clear();
  },
};

/**
 * Custom toast hooks for better integration
 */
export const useToast = () => {
  const showSuccess = (message: string, options?: any) => {
    return toastUtils.success(message, {
      position: "top-center",
      ...options,
    });
  };

  const showError = (message: string, options?: any) => {
    return toastUtils.error(message, {
      position: "top-center",
      ...options,
    });
  };

  const showWarning = (message: string, options?: any) => {
    return toastUtils.warning(message, {
      position: "top-center",
      ...options,
    });
  };

  const showInfo = (message: string, options?: any) => {
    return toastUtils.info(message, {
      position: "top-center",
      ...options,
    });
  };

  const showLoading = (message: string, options?: any) => {
    return toastUtils.loading(message, {
      position: "top-center",
      ...options,
    });
  };

  const updateToast = (toastId: string, options: any) => {
    return toastUtils.update(toastId, options);
  };

  const dismissToast = (toastId: string) => {
    return toastUtils.dismiss(toastId);
  };

  const clearAllToasts = () => {
    return toastUtils.clear();
  };

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    loading: showLoading,
    update: updateToast,
    dismiss: dismissToast,
    clear: clearAllToasts,
  };
};

/**
 * Toast configuration constants
 */
export const TOAST_CONFIG = {
  // Default durations
  SUCCESS_DURATION: 5000,
  ERROR_DURATION: 7000,
  WARNING_DURATION: 5000,
  INFO_DURATION: 4000,

  // Toast IDs for common actions
  TOAST_IDS: {
    LOGIN_SUCCESS: "login-success",
    LOGIN_ERROR: "login-error",
    REGISTER_SUCCESS: "register-success",
    REGISTER_ERROR: "register-error",
    PET_SAVED: "pet-saved",
    PET_SAVE_ERROR: "pet-save-error",
    ADOPTION_SUBMITTED: "adoption-submitted",
    ADOPTION_ERROR: "adoption-error",
    PROFILE_UPDATED: "profile-updated",
    PROFILE_UPDATE_ERROR: "profile-update-error",
    MESSAGE_SENT: "message-sent",
    MESSAGE_ERROR: "message-error",
    FILE_UPLOAD_SUCCESS: "file-upload-success",
    FILE_UPLOAD_ERROR: "file-upload-error",
    NETWORK_ERROR: "network-error",
    VALIDATION_ERROR: "validation-error",
  },

  // Toast messages
  MESSAGES: {
    LOGIN_SUCCESS: "Successfully logged in!",
    LOGIN_ERROR: "Login failed. Please check your credentials.",
    REGISTER_SUCCESS: "Account created successfully!",
    REGISTER_ERROR: "Registration failed. Please try again.",
    PET_SAVED: "Pet information saved successfully!",
    PET_SAVE_ERROR: "Failed to save pet information.",
    ADOPTION_SUBMITTED: "Adoption request submitted successfully!",
    ADOPTION_ERROR: "Failed to submit adoption request.",
    PROFILE_UPDATED: "Profile updated successfully!",
    PROFILE_UPDATE_ERROR: "Failed to update profile.",
    MESSAGE_SENT: "Message sent successfully!",
    MESSAGE_ERROR: "Failed to send message.",
    FILE_UPLOAD_SUCCESS: "File uploaded successfully!",
    FILE_UPLOAD_ERROR: "Failed to upload file.",
    NETWORK_ERROR: "Network error. Please check your connection.",
    VALIDATION_ERROR: "Please check your input and try again.",
  },
};
