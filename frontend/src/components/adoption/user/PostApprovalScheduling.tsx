import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { adoptionApi } from "@/services/api";
import SchedulingModal from "@/components/scheduling/SchedulingModal";
import { formatDisplayDate } from "@/utils/dateUtils";

interface AdoptionMeeting {
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
}

interface PostApprovalSchedulingProps {
  requestId: string;
  requestData: {
    user: {
      _id: string;
      name: string;
      email: string;
    };
    pet: {
      _id: string;
      name: string;
    };
  };
  onMeetingUpdate?: () => void;
  // Require approval status - component only works for approved requests
  isApproved: boolean;
  requestStatus: string;
}

const PostApprovalScheduling: React.FC<PostApprovalSchedulingProps> = ({
  requestId,
  requestData,
  onMeetingUpdate,
  isApproved,
  requestStatus,
}) => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<AdoptionMeeting[]>([]);
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);

  // Check permissions - only shelter/admin can schedule
  const canScheduleMeetings =
    user?.role === "shelter" || user?.role === "admin";

  // Debug logging
  console.log(
    "🔍 PostApprovalScheduling - isApproved:",
    isApproved,
    "requestStatus:",
    requestStatus,
    "canSchedule:",
    canScheduleMeetings
  );

  // CRITICAL: Only render if request is approved or scheduled
  if (
    !isApproved ||
    (requestStatus !== "approved" && requestStatus !== "scheduled")
  ) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Post-Approval Scheduling
            </h2>
            <p className="text-sm text-gray-500">Available after approval</p>
          </div>
        </div>

        <div className="text-center py-8 text-gray-500">
          <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-sm font-medium text-gray-900 mb-2">
            Post-approval scheduling will be available after your application is
            approved
          </p>
          <p className="text-xs text-gray-400">
            The shelter will contact you once your application has been reviewed
            and approved
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchMeetings();
  }, [requestId]);

  const fetchMeetings = async () => {
    try {
      console.log("🔍 Fetching meetings for requestId:", requestId);

      // Use user-specific API for regular users, shelter API for shelter/admin users
      let response;
      if (user?.role === "user") {
        response = await adoptionApi.getUserAdoptionRequestMeetings(requestId);
        console.log("🔍 User API response:", response);
      } else {
        response = await adoptionApi.getAdoptionRequestMeetings(requestId);
        console.log("🔍 Shelter API response:", response);
      }

      console.log("📅 Full API Response:", response);

      // Handle different response structures
      let meetingsData: AdoptionMeeting[] = [];
      const responseData = (response as any).data;

      if (responseData && typeof responseData === "object") {
        if (responseData.data && Array.isArray(responseData.data)) {
          meetingsData = responseData.data;
        } else if (
          responseData.meetings &&
          Array.isArray(responseData.meetings)
        ) {
          meetingsData = responseData.meetings;
        }
      } else if (Array.isArray(responseData)) {
        meetingsData = responseData;
      }

      console.log("📅 Final meetings data:", meetingsData);
      console.log("📅 Meetings data type:", typeof meetingsData);
      console.log("📅 Is array:", Array.isArray(meetingsData));
      console.log("📅 Meetings length:", meetingsData.length);

      setMeetings(meetingsData);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error("Failed to load meetings");
    }
  };

  const handleMeetingScheduled = () => {
    fetchMeetings();
    onMeetingUpdate?.();
    setShowSchedulingModal(false);
  };

  const getUpcomingMeetings = () => {
    const now = new Date();
    return meetings.filter(
      (meeting) =>
        meeting.status === "scheduled" && new Date(meeting.scheduledDate) > now
    );
  };

  const getPastMeetings = () => {
    const now = new Date();
    return meetings.filter(
      (meeting) =>
        new Date(meeting.scheduledDate) <= now ||
        meeting.status === "completed" ||
        meeting.status === "cancelled"
    );
  };

  const upcomingMeetings = getUpcomingMeetings();
  const pastMeetings = getPastMeetings();
  const hasInterviews = meetings.some(
    (meeting) =>
      meeting.status === "scheduled" || meeting.status === "completed"
  );

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Post-Approval Scheduling
          </h2>
          <p className="text-sm text-gray-500">
            Schedule meetings and appointments after approval
          </p>
        </div>
        {canScheduleMeetings && (
          <Button
            variant="primary"
            leftIcon={Calendar}
            onClick={() => setShowSchedulingModal(true)}
          >
            Schedule Meeting
          </Button>
        )}
      </div>

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-3">
            Upcoming Meetings
          </h3>
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <Card key={meeting._id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Badge variant="outline" className="mr-2">
                          {meeting.type.replace("_", " ").toUpperCase()}
                        </Badge>
                        <Badge variant="success">Scheduled</Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Clock className="h-4 w-4 mr-1" />
                        {format(new Date(meeting.scheduledDate), "PPP 'at' p")}
                      </div>
                      {meeting.location && (
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {meeting.location}
                        </div>
                      )}
                      {meeting.participants.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          {meeting.participants.map((p) => p.name).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-3">
            Past Meetings
          </h3>
          <div className="space-y-3">
            {pastMeetings.map((meeting) => (
              <Card
                key={meeting._id}
                className={`border-l-4 ${
                  meeting.status === "completed"
                    ? "border-l-green-500"
                    : "border-l-gray-400"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Badge variant="outline" className="mr-2">
                          {meeting.type.replace("_", " ").toUpperCase()}
                        </Badge>
                        <Badge
                          variant={
                            meeting.status === "completed"
                              ? "success"
                              : meeting.status === "cancelled"
                              ? "danger"
                              : "secondary"
                          }
                        >
                          {meeting.status.charAt(0).toUpperCase() +
                            meeting.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Clock className="h-4 w-4 mr-1" />
                        {format(new Date(meeting.scheduledDate), "PPP 'at' p")}
                      </div>
                      {meeting.location && (
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {meeting.location}
                        </div>
                      )}
                      {meeting.participants.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Users className="h-4 w-4 mr-1" />
                          {meeting.participants.map((p) => p.name).join(", ")}
                        </div>
                      )}
                      {meeting.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Notes:</strong> {meeting.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Meetings State */}
      {meetings.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-sm font-medium text-gray-900 mb-2">
            No meetings scheduled yet
          </p>
          <p className="text-xs text-gray-400">
            {canScheduleMeetings
              ? "Schedule a meeting to get started"
              : "The shelter will schedule meetings as needed"}
          </p>
        </div>
      )}

      {/* Meeting Summary */}
      {meetings.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>{upcomingMeetings.length} upcoming</span>
              <span>{pastMeetings.length} completed</span>
              <span>
                {meetings.filter((m) => m.type === "interview").length}{" "}
                interview
                {meetings.filter((m) => m.type === "interview").length !== 1
                  ? "s"
                  : ""}
              </span>
            </div>
            <span>
              Latest:{" "}
              {meetings.length > 0 &&
                formatDisplayDate(new Date(schedule.createdAt))}
            </span>
          </div>
        </div>
      )}

      {/* Scheduling Modal */}
      {showSchedulingModal && (
        <SchedulingModal
          isOpen={showSchedulingModal}
          onClose={() => setShowSchedulingModal(false)}
          requestId={requestId}
          requestData={{
            user: {
              id: requestData.user._id,
              name: requestData.user.name,
              email: requestData.user.email,
            },
            pet: {
              id: requestData.pet._id,
              name: requestData.pet.name,
            },
          }}
          onScheduled={handleMeetingScheduled}
        />
      )}
    </div>
  );
};

export default PostApprovalScheduling;
