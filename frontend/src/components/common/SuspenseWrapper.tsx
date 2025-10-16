import React, { Suspense, ReactNode } from "react";
import { LoadingSpinner, FullScreenLoader, PageLoader } from "./LoadingSpinner";
import { ErrorBoundary, PageErrorBoundary } from "./ErrorBoundary";

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  loadingType?: "fullscreen" | "page" | "inline";
  loadingText?: string;
  showErrorBoundary?: boolean;
  errorBoundaryFallback?: ReactNode;
}

/**
 * Suspense wrapper with error handling and loading states
 */
export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback,
  errorFallback,
  loadingType = "page",
  loadingText,
  showErrorBoundary = true,
  errorBoundaryFallback,
}) => {
  const renderFallback = () => {
    if (fallback) return fallback;

    switch (loadingType) {
      case "fullscreen":
        return <FullScreenLoader text={loadingText} />;
      case "inline":
        return <LoadingSpinner text={loadingText} />;
      default:
        return <PageLoader text={loadingText} />;
    }
  };

  const content = <Suspense fallback={renderFallback()}>{children}</Suspense>;

  if (!showErrorBoundary) {
    return content;
  }

  return (
    <ErrorBoundary fallback={errorBoundaryFallback}>{content}</ErrorBoundary>
  );
};

/**
 * Page-specific Suspense wrapper
 */
export const PageSuspense: React.FC<{
  children: ReactNode;
  loadingText?: string;
}> = ({ children, loadingText = "Loading page..." }) => {
  return (
    <SuspenseWrapper
      loadingType="page"
      loadingText={loadingText}
      showErrorBoundary={true}
    >
      {children}
    </SuspenseWrapper>
  );
};

/**
 * Component-specific Suspense wrapper
 */
export const ComponentSuspense: React.FC<{
  children: ReactNode;
  loadingText?: string;
}> = ({ children, loadingText }) => {
  return (
    <SuspenseWrapper
      loadingType="inline"
      loadingText={loadingText}
      showErrorBoundary={false}
    >
      {children}
    </SuspenseWrapper>
  );
};

/**
 * Full-screen Suspense wrapper for critical pages
 */
export const FullScreenSuspense: React.FC<{
  children: ReactNode;
  loadingText?: string;
}> = ({ children, loadingText = "Loading..." }) => {
  return (
    <SuspenseWrapper
      loadingType="fullscreen"
      loadingText={loadingText}
      showErrorBoundary={true}
    >
      {children}
    </SuspenseWrapper>
  );
};

/**
 * Lazy component wrapper with error handling
 */
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options?: {
    loadingText?: string;
    loadingType?: "fullscreen" | "page" | "inline";
    errorFallback?: ReactNode;
  }
) => {
  const LazyComponent = React.lazy(importFunc);

  const WrappedComponent: React.FC<React.ComponentProps<T>> = (props) => (
    <SuspenseWrapper
      loadingType={options?.loadingType || "page"}
      loadingText={options?.loadingText}
      errorFallback={options?.errorFallback}
    >
      <LazyComponent {...props} />
    </SuspenseWrapper>
  );

  return WrappedComponent;
};

/**
 * Route-specific Suspense wrapper
 */
export const RouteSuspense: React.FC<{
  children: ReactNode;
  routeName?: string;
}> = ({ children, routeName }) => {
  const loadingText = routeName ? `Loading ${routeName}...` : "Loading page...";

  return (
    <PageErrorBoundary>
      <SuspenseWrapper
        loadingType="page"
        loadingText={loadingText}
        showErrorBoundary={true}
      >
        {children}
      </SuspenseWrapper>
    </PageErrorBoundary>
  );
};

/**
 * Modal Suspense wrapper
 */
export const ModalSuspense: React.FC<{
  children: ReactNode;
  loadingText?: string;
}> = ({ children, loadingText = "Loading modal..." }) => {
  return (
    <SuspenseWrapper
      loadingType="inline"
      loadingText={loadingText}
      showErrorBoundary={true}
    >
      {children}
    </SuspenseWrapper>
  );
};

/**
 * Table Suspense wrapper
 */
export const TableSuspense: React.FC<{
  children: ReactNode;
  loadingText?: string;
}> = ({ children, loadingText = "Loading data..." }) => {
  return (
    <SuspenseWrapper
      loadingType="inline"
      loadingText={loadingText}
      showErrorBoundary={false}
    >
      {children}
    </SuspenseWrapper>
  );
};
