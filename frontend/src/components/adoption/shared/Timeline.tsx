import React from "react";
import { formatDetailedDate } from "@/utils/dateUtils";

interface TimelineEvent {
  status: string;
  note?: string;
  date?: string;
  updatedAt?: string; // Keep for backward compatibility
}

interface TimelineProps {
  events: TimelineEvent[];
  title?: string;
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  events,
  title = "Timeline",
  className = "",
}) => {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div
      id="timeline"
      className={`mt-6 pt-6 border-t border-gray-200 ${className}`}
    >
      <h2
        id="timeline-heading"
        className="text-lg font-semibold text-gray-900 mb-4"
      >
        {title}
      </h2>
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {event.status}
              </p>
              {event.note && (
                <p className="text-sm text-gray-600">{event.note}</p>
              )}
              <p className="text-xs text-gray-500">
                {formatDetailedDate(event.date || event.updatedAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
