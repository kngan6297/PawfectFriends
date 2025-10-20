// Import console muzzle first to suppress noisy logs immediately
import "./utils/console-muzzle";

// Import environment validation first - this will fail build if env vars are invalid
import "./config/env";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";

import { NotificationProvider } from "./context/NotificationContext";
import { ToastProvider } from "./components/ui/ToastProvider";

import App from "./App";
import AppErrorBoundary from "./components/common/AppErrorBoundary";
import "./index.css";
import "./styles/responsive-grid.css";
import "react-toastify/dist/ReactToastify.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false, // Disable refetch on window focus
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const AppWithProviders = () => (
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppErrorBoundary>
              <App />
            </AppErrorBoundary>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWithProviders />
  </StrictMode>
);
