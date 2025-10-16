import React, { useState, createContext, useContext } from "react";
import clsx from "clsx";

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs?: TabItem[];
  defaultTabId?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
  children: React.ReactNode;
  defaultValue?: string;
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const TabsContext = createContext<{
  activeTabId: string;
  setActiveTabId: (id: string) => void;
} | null>(null);

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTabId,
  defaultValue,
  className,
  onTabChange,
  children,
}) => {
  const [activeTabId, setActiveTabId] = useState(
    defaultTabId || defaultValue || (tabs && tabs[0]?.id) || ""
  );

  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
    onTabChange?.(tabId);
  };

  return (
    <TabsContext.Provider
      value={{ activeTabId, setActiveTabId: handleTabChange }}
    >
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<TabsListProps> = ({ className, children }) => {
  return (
    <div className={clsx("border-b border-gray-200", className)}>
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        {children}
      </nav>
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className,
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabsTrigger must be used within a Tabs component");
  }

  const isActive = context.activeTabId === value;

  return (
    <button
      onClick={() => context.setActiveTabId(value)}
      className={clsx(
        "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200",
        isActive
          ? "border-primary-500 text-primary-600"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
        className
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className,
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabsContent must be used within a Tabs component");
  }

  if (context.activeTabId !== value) {
    return null;
  }

  return <div className={clsx("py-4", className)}>{children}</div>;
};

// Legacy Tabs component for backward compatibility
export const LegacyTabs: React.FC<{
  tabs: TabItem[];
  defaultTabId?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
}> = ({ tabs, defaultTabId, className, onTabChange }) => {
  const [activeTabId, setActiveTabId] = useState(defaultTabId || tabs[0]?.id);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0];

  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={className}>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={clsx(
                "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200",
                activeTabId === tab.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
              aria-current={activeTabId === tab.id ? "page" : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="py-4">{activeTab.content}</div>
    </div>
  );
};
