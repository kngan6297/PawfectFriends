import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  X,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
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
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { petApi, adoptionApi, AdoptionMeeting } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { format, addDays, isAfter, isBefore, startOfDay } from "date-fns";

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId?: string;
  requestData?: {
    user: {
      id: string;
      name: string;
      email: string;
    };
    pet?: {
      id: string;
      name: string;
    };
  };
  onScheduled?: () => void;
}

interface MeetingData {
  type:
    | "phone_call"
    | "text_message"
    | "facebook_chat"
    | "zalo_chat"
    | "in_person";
  scheduledDate: Date;
  location: string;
  notes?: string;
  duration: number;
  participants: string[];
}

const SchedulingModal: React.FC<SchedulingModalProps> = ({
  isOpen,
  onClose,
  requestId,
  requestData,
  onScheduled,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"schedule" | "existing">(
    "schedule"
  );
  const [meetingData, setMeetingData] = useState<MeetingData>({
    type: "in_person",
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow at same time
    location: "",
    notes: "",
    duration: 60,
    participants: [],
  });
  const [existingMeetings, setExistingMeetings] = useState<AdoptionMeeting[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<string | null>(null);
  const [showRescheduleHistory, setShowRescheduleHistory] = useState<
    string | null
  >(null);

  const meetingTypes = [
    { value: "phone_call", label: "Phone Call", icon: Users },
    { value: "text_message", label: "Text Message", icon: Calendar },
    { value: "facebook_chat", label: "Facebook Chat", icon: MapPin },
    { value: "zalo_chat", label: "Zalo Chat", icon: FileText },
    { value: "in_person", label: "In Person Meeting", icon: Users },
  ];

  const durationOptions = [
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
  ];

  useEffect(() => {
    if (isOpen) {
      if (!requestId) {
        console.error("SchedulingModal opened without requestId");
        toast.error("No adoption request selected. Please try again.");
        onClose();
        return;
      }

      fetchExistingMeetings();
      // Reset meeting data with valid date when modal opens
      setMeetingData({
        type: "in_person",
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        location: "",
        notes: "",
        duration: 60,
        participants: [],
      });
    }
  }, [isOpen, requestId, onClose]);

  const fetchExistingMeetings = async () => {
    try {
      // Use user-specific API for regular users, shelter API for shelter/admin users
      let response;
      if (user?.role === "user") {
        response = await adoptionApi.getUserAdoptionRequestMeetings(requestId!);
      } else {
        response = await adoptionApi.getAdoptionRequestMeetings(requestId!);
      }

      // Both APIs return {status: 'success', data: Array}
      // So we need to access response.data.data for both
      setExistingMeetings(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error("Failed to fetch existing meetings");
    }
  };

  const handleInputChange = (field: keyof MeetingData, value: any) => {
    setMeetingData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateMeetingData = (): boolean => {
    if (!meetingData.location.trim()) {
      toast.error("Please enter a location");
      return false;
    }
    if (isBefore(meetingData.scheduledDate, startOfDay(new Date()))) {
      toast.error("Meeting date cannot be in the past");
      return false;
    }
    return true;
  };

  const handleScheduleMeeting = async () => {
    if (!validateMeetingData()) return;

    // Validate requestId
    if (!requestId) {
      toast.error("No adoption request selected. Please try again.");
      return;
    }

    // Validate and ensure the date is valid
    if (
      !meetingData.scheduledDate ||
      isNaN(meetingData.scheduledDate.getTime())
    ) {
      toast.error("Please select a valid date and time for the meeting");
      return;
    }

    try {
      setLoading(true);
      await petApi.scheduleMeeting(requestId, {
        ...meetingData,
        scheduledDate: meetingData.scheduledDate.toISOString(),
      });

      // Add timeline event after successfully scheduling the meeting (non-blocking)
      const addTimelineEventAsync = async () => {
        try {
          const timelineStatus = `${meetingData.type}_scheduled`;
          const timelineNote =
            meetingData.notes ||
            `Scheduled ${getMeetingTypeLabel(meetingData.type)} meeting`;

          // Validate timeline data before sending
          if (!timelineStatus || !timelineNote) {
            console.warn("Invalid timeline data, skipping timeline event");
            return;
          }

          console.log("Adding timeline event:", {
            requestId,
            timelineStatus,
            timelineNote,
            userId: user?._id || "system",
          });

          await adoptionApi.addTimelineEvent(
            requestId,
            timelineStatus,
            timelineNote,
            user?._id || "system"
          );
        } catch (timelineError) {
          console.error("Error adding timeline event:", timelineError);
          // Don't show error to user as the meeting was scheduled successfully
          // The timeline event is optional and doesn't affect the meeting functionality
        }
      };

      // Run timeline event creation in background (don't await)
      addTimelineEventAsync();

      // Update adoption request status to "scheduled" after successfully scheduling meeting
      try {
        await adoptionApi.updateStatus(requestId, "scheduled");
        console.log("Adoption request status updated to 'scheduled'");
      } catch (statusError) {
        console.error("Error updating adoption request status:", statusError);
        // Don't show error to user as the meeting was scheduled successfully
        // The status update is optional and doesn't affect the meeting functionality
      }

      toast.success("Meeting scheduled successfully");
      setMeetingData({
        type: "in_person",
        scheduledDate: new Date(),
        location: "",
        notes: "",
        duration: 60,
        participants: [],
      });
      fetchExistingMeetings();
      onScheduled?.();
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      toast.error("Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMeeting = async (
    meetingId: string,
    status: string,
    notes?: string
  ) => {
    try {
      await petApi.updateMeetingStatus(requestId!, meetingId, status, notes);

      // Add timeline event for meeting status update
      try {
        const meeting = existingMeetings.find((m) => m._id === meetingId);
        if (meeting) {
          const timelineStatus = `${meeting.type}_${status}`;
          const timelineNote = notes || `Meeting ${status}`;

          await adoptionApi.addTimelineEvent(
            requestId!,
            timelineStatus,
            timelineNote,
            user?._id || "system"
          );
        }
      } catch (timelineError) {
        console.error("Error adding timeline event:", timelineError);
        // Don't show error to user as the meeting was updated successfully
      }

      toast.success("Meeting updated successfully");
      fetchExistingMeetings();
    } catch (error) {
      console.error("Error updating meeting:", error);
      toast.error("Failed to update meeting");
    }
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

  const getMeetingTypeLabel = (type: string) => {
    return meetingTypes.find((t) => t.value === type)?.label || type;
  };

  // Helper function to safely format dates
  const safeFormatDate = (date: Date, formatString: string): string => {
    try {
      if (!date || isNaN(date.getTime())) {
        return format(new Date(), formatString);
      }
      return format(date, formatString);
    } catch (error) {
      console.error("Date formatting error:", error);
      return format(new Date(), formatString);
    }
  };

  // Helper function to render reschedule information
  const renderRescheduleInfo = (meeting: AdoptionMeeting) => {
    if (!meeting.rescheduleCount || meeting.rescheduleCount === 0) {
      return null;
    }

    return (
      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-center justify-between text-sm text-yellow-800">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">
              Rescheduled {meeting.rescheduleCount} time
              {meeting.rescheduleCount > 1 ? "s" : ""}
            </span>
          </div>
          {meeting.rescheduleHistory &&
            meeting.rescheduleHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRescheduleHistory(meeting._id)}
                className="text-xs text-yellow-700 hover:text-yellow-800"
              >
                View History
              </Button>
            )}
        </div>
        {meeting.previousDate && (
          <div className="text-xs text-yellow-700 mt-1">
            Previous:{" "}
            {safeFormatDate(
              new Date(meeting.previousDate),
              "MMM d, yyyy 'at' h:mm a"
            )}
          </div>
        )}
        {meeting.originalDate &&
          meeting.originalDate !== meeting.previousDate && (
            <div className="text-xs text-yellow-700">
              Original:{" "}
              {safeFormatDate(
                new Date(meeting.originalDate),
                "MMM d, yyyy 'at' h:mm a"
              )}
            </div>
          )}
        {meeting.rescheduleCount >= 3 && (
          <div className="text-xs text-red-600 font-medium mt-1">
            ⚠️ Maximum reschedules reached
          </div>
        )}
      </div>
    );
  };

  // Helper function to render reschedule history modal
  const renderRescheduleHistoryModal = () => {
    if (!showRescheduleHistory) return null;

    const meeting = existingMeetings.find(
      (m) => m._id === showRescheduleHistory
    );
    if (!meeting || !meeting.rescheduleHistory) return null;

    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Reschedule History
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRescheduleHistory(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {meeting.rescheduleHistory.map((entry: any, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      Reschedule #{index + 1}
                    </span>
                    <span className="text-xs text-gray-500">
                      {safeFormatDate(
                        new Date(entry.rescheduledAt),
                        "MMM d, yyyy"
                      )}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">From:</span>{" "}
                      {safeFormatDate(
                        new Date(entry.fromDate),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </div>
                    <div>
                      <span className="font-medium">To:</span>{" "}
                      {safeFormatDate(
                        new Date(entry.toDate),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </div>
                    {entry.reason && (
                      <div>
                        <span className="font-medium">Reason:</span>{" "}
                        {entry.reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderScheduleForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Schedule New Meeting
        </h3>
        {requestData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Pet:</span>{" "}
              {requestData.pet?.name || "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Applicant:</span>{" "}
              {requestData.user.name}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Type
          </label>
          <Select
            value={meetingData.type}
            onValueChange={(value) => handleInputChange("type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select meeting type" />
            </SelectTrigger>
            <SelectContent>
              {meetingTypes.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration
          </label>
          <Select
            value={meetingData.duration.toString()}
            onValueChange={(value) =>
              handleInputChange("duration", parseInt(value))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <Input
            type="date"
            value={safeFormatDate(meetingData.scheduledDate, "yyyy-MM-dd")}
            onChange={(e) => {
              const date = new Date(e.target.value);
              const currentTime = meetingData.scheduledDate;
              if (!isNaN(currentTime.getTime())) {
                date.setHours(currentTime.getHours(), currentTime.getMinutes());
              }
              handleInputChange("scheduledDate", date);
            }}
            min={safeFormatDate(new Date(), "yyyy-MM-dd")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time
          </label>
          <Input
            type="time"
            value={safeFormatDate(meetingData.scheduledDate, "HH:mm")}
            onChange={(e) => {
              const [hours, minutes] = e.target.value.split(":");
              const newDate = new Date(meetingData.scheduledDate);
              if (!isNaN(newDate.getTime())) {
                newDate.setHours(parseInt(hours), parseInt(minutes));
                handleInputChange("scheduledDate", newDate);
              }
            }}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <Input
          type="text"
          placeholder="Enter meeting location"
          value={meetingData.location}
          onChange={(e) => handleInputChange("location", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <Textarea
          placeholder="Add any additional notes for this meeting"
          value={meetingData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleScheduleMeeting}
          disabled={loading}
        >
          {loading ? "Scheduling..." : "Schedule Meeting"}
        </Button>
      </div>
    </div>
  );

  const renderExistingMeetings = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Existing Meetings</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveTab("schedule")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Schedule New
        </Button>
      </div>

      {existingMeetings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No meetings scheduled yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {existingMeetings.map((meeting) => (
            <Card key={meeting._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={getStatusColor(meeting.status)}>
                        {meeting.status}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">
                        {getMeetingTypeLabel(meeting.type)}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {safeFormatDate(
                            new Date(meeting.scheduledDate),
                            "MMM d, yyyy"
                          )}
                        </span>
                        <Clock className="h-4 w-4" />
                        <span>
                          {safeFormatDate(
                            new Date(meeting.scheduledDate),
                            "h:mm a"
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
                          <span>{meeting.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Reschedule Information */}
                    {renderRescheduleInfo(meeting)}
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {meeting.status === "scheduled" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdateMeeting(meeting._id, "completed")
                          }
                        >
                          Complete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdateMeeting(meeting._id, "cancelled")
                          }
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {meeting.status === "cancelled" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleUpdateMeeting(meeting._id, "scheduled")
                        }
                        disabled={Boolean(
                          meeting.rescheduleCount &&
                            meeting.rescheduleCount >= 3
                        )}
                        title={
                          meeting.rescheduleCount &&
                          meeting.rescheduleCount >= 3
                            ? "Maximum reschedule limit reached"
                            : "Reschedule meeting"
                        }
                      >
                        Reschedule
                        {meeting.rescheduleCount &&
                          meeting.rescheduleCount > 0 && (
                            <span className="ml-1 text-xs">
                              ({meeting.rescheduleCount}/3)
                            </span>
                          )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Meeting Scheduling
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-6">
            <div className="flex space-x-1 mb-6">
              <Button
                variant={activeTab === "schedule" ? "primary" : "outline"}
                size="sm"
                onClick={() => setActiveTab("schedule")}
              >
                Schedule Meeting
              </Button>
              <Button
                variant={activeTab === "existing" ? "primary" : "outline"}
                size="sm"
                onClick={() => setActiveTab("existing")}
              >
                View Meetings
              </Button>
            </div>

            {activeTab === "schedule"
              ? renderScheduleForm()
              : renderExistingMeetings()}
          </div>
        </div>
      </div>
      {renderRescheduleHistoryModal()}
    </Dialog>
  );
};

export default SchedulingModal;
