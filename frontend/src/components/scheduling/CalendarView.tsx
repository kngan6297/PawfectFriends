import React, { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/card";

interface CalendarEvent {
  _id: string;
  type: "interview" | "meet_pet" | "home_visit" | "final_meeting";
  scheduledDate: string;
  location: string;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  participants: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  requestData?: {
    user: {
      name: string;
      email: string;
    };
    pet?: {
      name: string;
    };
  };
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onEventClick,
  onDateClick,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter((event) =>
      isSameDay(new Date(event.scheduledDate), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "warning";
      case "completed":
        return "success";
      case "cancelled":
        return "danger";
      case "rescheduled":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "interview":
        return Users;
      case "meet_pet":
        return Calendar;
      case "home_visit":
        return MapPin;
      case "final_meeting":
        return Clock;
      default:
        return Calendar;
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick?.(event);
  };

  const renderEvent = (event: CalendarEvent) => {
    const Icon = getEventTypeIcon(event.type);
    return (
      <div
        key={event._id}
        className="text-xs p-1 mb-1 rounded cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={(e) => handleEventClick(event, e)}
      >
        <div className="flex items-center space-x-1">
          <Icon className="h-3 w-3" />
          <Badge variant={getStatusColor(event.status)} className="text-xs">
            {event.type.replace("_", " ")}
          </Badge>
        </div>
        {event.requestData?.user.name && (
          <div className="text-gray-600 truncate">
            {event.requestData.user.name}
          </div>
        )}
        {event.location && (
          <div className="text-gray-500 truncate text-xs">{event.location}</div>
        )}
      </div>
    );
  };

  const renderDay = (day: Date) => {
    const dayEvents = getEventsForDate(day);
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isToday = isSameDay(day, new Date());
    const isSelected = selectedDate && isSameDay(day, selectedDate);

    return (
      <div
        key={day.toString()}
        className={`
          min-h-[120px] p-2 border border-gray-200 cursor-pointer
          ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
          ${isToday ? "bg-blue-50 border-blue-300" : ""}
          ${isSelected ? "bg-yellow-50 border-yellow-300" : ""}
          hover:bg-gray-50 transition-colors
        `}
        onClick={() => handleDateClick(day)}
      >
        <div className="text-sm font-medium mb-1">{format(day, "d")}</div>
        <div className="space-y-1">
          {dayEvents.slice(0, 3).map(renderEvent)}
          {dayEvents.length > 3 && (
            <div className="text-xs text-gray-500">
              +{dayEvents.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">{days.map(renderDay)}</div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Event Types
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600">Interview</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600">Meet Pet</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-600">Home Visit</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-gray-600">Final Meeting</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;
