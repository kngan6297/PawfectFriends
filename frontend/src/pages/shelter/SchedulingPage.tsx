import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Plus,
  Filter,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "../../components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { petApi } from "@/services/api";
import { format, isToday, isTomorrow, isAfter, isBefore } from "date-fns";
import SchedulingModal from "@/components/scheduling/SchedulingModal";
import CalendarView from "@/components/scheduling/CalendarView";
import ReminderSystem from "@/components/scheduling/ReminderSystem";
import { useShelterDataContext } from "@/context/ShelterDataContext";

interface Meeting {
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
    requestId: string;
  };
}

const SchedulingPage: React.FC = () => {
  const {
    meetings: allMeetings,
    requests,
    isLoading,
    error,
    refreshData,
  } = useShelterDataContext();
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    dateRange: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    applyFilters();
  }, [allMeetings, filters, searchTerm]);

  const applyFilters = () => {
    let filtered = [...(allMeetings || [])];

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(
        (meeting) => meeting.status === filters.status
      );
    }

    // Type filter
    if (filters.type !== "all") {
      filtered = filtered.filter((meeting) => meeting.type === filters.type);
    }

    // Date range filter
    const now = new Date();
    switch (filters.dateRange) {
      case "today":
        filtered = filtered.filter((meeting) =>
          isToday(new Date(meeting.scheduledDate))
        );
        break;
      case "tomorrow":
        filtered = filtered.filter((meeting) =>
          isTomorrow(new Date(meeting.scheduledDate))
        );
        break;
      case "upcoming":
        filtered = filtered.filter((meeting) =>
          isAfter(new Date(meeting.scheduledDate), now)
        );
        break;
      case "past":
        filtered = filtered.filter((meeting) =>
          isBefore(new Date(meeting.scheduledDate), now)
        );
        break;
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (meeting) =>
          meeting.requestData?.user.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          meeting.requestData?.pet?.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          meeting.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMeetings(filtered);
  };

  const handleScheduleNew = () => {
    // Find available requests for scheduling
    const availableRequests = requests.filter(
      (req: any) => req.status === "pending" || req.status === "approved"
    );

    if (availableRequests.length === 0) {
      toast.error(
        "No pending or approved adoption requests available for scheduling"
      );
      return;
    }

    if (availableRequests.length === 1) {
      // If only one request, select it directly
      setSelectedRequest(availableRequests[0]);
      setShowSchedulingModal(true);
    } else {
      // If multiple requests, show a simple selection
      // For now, select the first one, but this could be enhanced with a selection modal
      const firstRequest = availableRequests[0];
      toast.info(
        `Scheduling meeting for ${
          firstRequest.user?.name || "adoption request"
        }. To schedule for a different request, please go to the adoption requests page.`
      );
      setSelectedRequest(firstRequest);
      setShowSchedulingModal(true);
    }
  };

  const handleMeetingComplete = () => {
    refreshData();
  };

  const handleCompleteMeeting = async (meeting: Meeting) => {
    try {
      if (!meeting.requestData?.requestId) {
        toast.error("Cannot complete meeting: Missing request ID");
        return;
      }

      await petApi.updateMeetingStatus(
        meeting.requestData.requestId,
        meeting._id,
        "completed",
        "Meeting completed successfully"
      );

      toast.success("Meeting completed successfully");
      refreshData();
    } catch (error) {
      console.error("Error completing meeting:", error);
      toast.error("Failed to complete meeting");
    }
  };

  const handleRescheduleMeeting = async (meeting: Meeting) => {
    try {
      if (!meeting.requestData?.requestId) {
        toast.error("Cannot reschedule meeting: Missing request ID");
        return;
      }

      await petApi.updateMeetingStatus(
        meeting.requestData.requestId,
        meeting._id,
        "rescheduled",
        "Meeting rescheduled"
      );

      toast.success("Meeting rescheduled successfully");
      refreshData();
    } catch (error) {
      console.error("Error rescheduling meeting:", error);
      toast.error("Failed to reschedule meeting");
    }
  };

  const handleViewMeetingDetails = (meeting: Meeting) => {
    // For now, just show the meeting details in a modal or navigate to details page
    console.log("View meeting details:", meeting);
    // TODO: Implement meeting details modal or navigation
    toast.info("Meeting details feature coming soon");
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "interview":
        return Users;
      case "meet_pet":
        return Calendar;
      case "home_visit":
        return MapPin;
      case "final_meeting":
        return FileText;
      default:
        return Calendar;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderFilters = () => (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <Select
              value={filters.status}
              onValueChange={(value: any) =>
                setFilters((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <Select
              value={filters.type}
              onValueChange={(value: any) =>
                setFilters((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="meet_pet">Meet Pet</SelectItem>
                <SelectItem value="home_visit">Home Visit</SelectItem>
                <SelectItem value="final_meeting">Final Meeting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <Select
              value={filters.dateRange}
              onValueChange={(value: any) =>
                setFilters((prev) => ({ ...prev, dateRange: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <Input
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMeetingsList = () => (
    <div className="space-y-4">
      {filteredMeetings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No meetings found</p>
          <p className="text-sm mt-2">
            Try adjusting your filters or schedule a new meeting
          </p>
        </div>
      ) : (
        filteredMeetings.map((meeting) => {
          const Icon = getTypeIcon(meeting.type);
          return (
            <Card key={meeting._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {getTypeLabel(meeting.type)}
                        </h3>
                        <Badge variant={getStatusColor(meeting.status)}>
                          {meeting.status}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {meeting.requestData?.user.name || "Unknown User"}
                          </span>
                        </div>

                        {meeting.requestData?.pet && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Pet: {meeting.requestData.pet.name}</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(
                              new Date(meeting.scheduledDate),
                              "MMM d, yyyy h:mm a"
                            )}
                          </span>
                        </div>

                        {meeting.location && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{meeting.location}</span>
                          </div>
                        )}

                        {meeting.notes && (
                          <div className="flex items-start space-x-2">
                            <FileText className="h-4 w-4 mt-0.5" />
                            <span className="text-gray-500">
                              {meeting.notes}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {meeting.status === "scheduled" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompleteMeeting(meeting)}
                        >
                          Complete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRescheduleMeeting(meeting)}
                        >
                          Reschedule
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewMeetingDetails(meeting)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );

  const tabContent = [
    {
      id: "calendar",
      label: "Calendar View",
      icon: Calendar,
      content: (
        <div>
          <CalendarView
            events={filteredMeetings}
            onEventClick={(event) => console.log("Event clicked:", event)}
            onDateClick={(date) => console.log("Date clicked:", date)}
          />
        </div>
      ),
    },
    {
      id: "list",
      label: "List View",
      icon: FileText,
      content: renderMeetingsList(),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Meeting Scheduling
          </h1>
          <p className="text-gray-600">
            Manage all your adoption meetings, interviews, and home visits
          </p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <Button
            variant="outline"
            onClick={() =>
              setViewMode(viewMode === "calendar" ? "list" : "calendar")
            }
          >
            {viewMode === "calendar" ? "List View" : "Calendar View"}
          </Button>
          <Button variant="primary" leftIcon={Plus} onClick={handleScheduleNew}>
            Schedule Meeting
          </Button>
        </div>
      </div>

      {renderFilters()}

      {viewMode === "calendar" ? (
        <CalendarView
          events={filteredMeetings}
          onEventClick={(event) => console.log("Event clicked:", event)}
          onDateClick={(date) => console.log("Date clicked:", date)}
        />
      ) : (
        renderMeetingsList()
      )}

      {/* Scheduling Modal */}
      {showSchedulingModal && selectedRequest && (
        <SchedulingModal
          isOpen={showSchedulingModal}
          onClose={() => {
            setShowSchedulingModal(false);
            setSelectedRequest(null);
          }}
          requestId={selectedRequest._id}
          requestData={{
            user: {
              id: selectedRequest.user.id,
              name: selectedRequest.user.name,
              email: selectedRequest.user.email,
            },
            pet: selectedRequest.pet
              ? {
                  id: selectedRequest.pet.id,
                  name: selectedRequest.pet.name,
                }
              : undefined,
          }}
          onScheduled={handleMeetingComplete}
        />
      )}
    </div>
  );
};

export default SchedulingPage;
