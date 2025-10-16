import React, { useState, useEffect } from 'react';
import { requestDeduplication } from '../../services/requestDeduplication';

/**
 * Debug component to show request deduplication status
 * Only visible in development mode
 */
export const RequestDeduplicationDebug: React.FC = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (import.meta.env.DEV) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setPendingCount(requestDeduplication.getPendingCount());
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg z-50 text-sm">
      <div className="font-semibold mb-1">🔄 Request Deduplication</div>
      <div>Pending: {pendingCount}</div>
      <button
        onClick={() => requestDeduplication.clear()}
        className="mt-2 px-2 py-1 bg-blue-700 hover:bg-blue-800 rounded text-xs"
      >
        Clear All
      </button>
    </div>
  );
};
