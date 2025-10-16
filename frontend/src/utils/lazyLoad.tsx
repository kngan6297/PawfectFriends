import React, { lazy, Suspense } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazyLoad({ children, fallback }: LazyLoadProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>{children}</Suspense>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Something went wrong
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {this.state.error?.message || "An error occurred"}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export function withLazyLoad<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);

  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    return (
      <ErrorBoundary>
        <LazyLoad fallback={fallback}>
          <LazyComponent {...props} />
        </LazyLoad>
      </ErrorBoundary>
    );
  };
}

// Example usage:
// const LazyDashboard = withLazyLoad(() => import("@/pages/Dashboard"));
// const LazyProfile = withLazyLoad(() => import("@/pages/Profile"), <CustomLoader />);
