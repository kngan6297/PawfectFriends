import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Bell,
  Clock,
  Mail,
  MessageSquare,
  Settings,
  Plus,
  Edit,
  Trash2,
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
} from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { format, addMinutes, addHours, addDays } from "date-fns";

interface Reminder {
  _id: string;
  meetingId: string;
  type: "email" | "sms" | "push" | "in_app";
  time: Date;
  sent: boolean;
  message?: string;
  recipient: {
    _id: string;
    name: string;
    email: string;
  };
}

interface ReminderSystemProps {
  meetingId: string;
  meetingData: {
    scheduledDate: Date;
    type: string;
    location: string;
    participants: Array<{
      _id: string;
      name: string;
      email: string;
    }>;
  };
  onReminderCreated?: () => void;
}

const ReminderSystem: React.FC<ReminderSystemProps> = ({
  meetingId,
  meetingData,
  onReminderCreated,
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    type: "email" as const,
    timeOffset: 60,
    timeUnit: "minutes" as "minutes" | "hours" | "days",
    message: "",
    recipientId: "",
  });
  const [loading, setLoading] = useState(false);

  const reminderTypes = [
    { value: "email", label: "Email", icon: Mail },
    { value: "sms", label: "SMS", icon: MessageSquare },
    { value: "push", label: "Push Notification", icon: Bell },
    { value: "in_app", label: "In-App Notification", icon: Bell },
  ];

  const timeUnits = [
    { value: "minutes", label: "Minutes" },
    { value: "hours", label: "Hours" },
    { value: "days", label: "Days" },
  ];

  const timeOffsets = [
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 hour" },
    { value: 120, label: "2 hours" },
    { value: 1440, label: "1 day" },
    { value: 2880, label: "2 days" },
  ];

  useEffect(() => {
    fetchReminders();
  }, [meetingId]);

  const fetchReminders = async () => {
    try {
      // This would be replaced with actual API call
      // const response = await petApi.getMeetingReminders(meetingId);
      // setReminders(response.data);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    }
  };

  const calculateReminderTime = () => {
    const { timeOffset, timeUnit } = newReminder;
    const meetingTime = new Date(meetingData.scheduledDate);

    switch (timeUnit) {
      case "minutes":
        return addMinutes(meetingTime, -timeOffset);
      case "hours":
        return addHours(meetingTime, -timeOffset);
      case "days":
        return addDays(meetingTime, -timeOffset);
      default:
        return addMinutes(meetingTime, -timeOffset);
    }
  };

  const handleCreateReminder = async () => {
    if (!newReminder.recipientId) {
      toast.error("Please select a recipient");
      return;
    }

    try {
      setLoading(true);
      const reminderTime = calculateReminderTime();

      // This would be replaced with actual API call
      // await petApi.createReminder(meetingId, {
      //   ...newReminder,
      //   time: reminderTime.toISOString(),
      // });

      toast.success("Reminder created successfully");
      setShowCreateForm(false);
      setNewReminder({
        type: "email",
        timeOffset: 60,
        timeUnit: "minutes",
        message: "",
        recipientId: "",
      });
      fetchReminders();
      onReminderCreated?.();
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast.error("Failed to create reminder");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      // This would be replaced with actual API call
      // await petApi.deleteReminder(reminderId);
      toast.success("Reminder deleted successfully");
      fetchReminders();
    } catch (error) {
      console.error("Error deleting reminder:", error);
      toast.error("Failed to delete reminder");
    }
  };

  const getReminderTypeIcon = (type: string) => {
    const reminderType = reminderTypes.find((t) => t.value === type);
    return reminderType?.icon || Bell;
  };

  const getReminderTypeLabel = (type: string) => {
    const reminderType = reminderTypes.find((t) => t.value === type);
    return reminderType?.label || type;
  };

  const renderCreateForm = () => (
    <Card className="mb-4">
      <CardHeader>
        <h3 className="text-lg font-medium text-gray-900">
          Create New Reminder
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Type
              </label>
              <Select
                value={newReminder.type}
                onValueChange={(value) =>
                  setNewReminder((prev) => ({ ...prev, type: value as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reminder type" />
                </SelectTrigger>
                <SelectContent>
                  {reminderTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient
              </label>
              <Select
                value={newReminder.recipientId}
                onValueChange={(value) =>
                  setNewReminder((prev) => ({ ...prev, recipientId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {meetingData.participants.map((participant) => (
                    <SelectItem key={participant._id} value={participant._id}>
                      {participant.name} ({participant.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remind Before
              </label>
              <Select
                value={newReminder.timeOffset.toString()}
                onValueChange={(value) =>
                  setNewReminder((prev) => ({
                    ...prev,
                    timeOffset: parseInt(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time offset" />
                </SelectTrigger>
                <SelectContent>
                  {timeOffsets.map((offset) => (
                    <SelectItem
                      key={offset.value}
                      value={offset.value.toString()}
                    >
                      {offset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Unit
              </label>
              <Select
                value={newReminder.timeUnit}
                onValueChange={(value) =>
                  setNewReminder((prev) => ({
                    ...prev,
                    timeUnit: value as "minutes" | "hours" | "days",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time unit" />
                </SelectTrigger>
                <SelectContent>
                  {timeUnits.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message (Optional)
            </label>
            <Input
              type="text"
              placeholder="Enter custom reminder message"
              value={newReminder.message}
              onChange={(e) =>
                setNewReminder((prev) => ({ ...prev, message: e.target.value }))
              }
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Reminder Preview
            </h4>
            <div className="text-sm text-gray-600">
              <p>
                <strong>Meeting:</strong> {meetingData.type} at{" "}
                {format(
                  new Date(meetingData.scheduledDate),
                  "MMM d, yyyy h:mm a"
                )}
              </p>
              <p>
                <strong>Location:</strong> {meetingData.location}
              </p>
              <p>
                <strong>Reminder will be sent:</strong>{" "}
                {format(calculateReminderTime(), "dd MMM yyyy h:mm a")}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateReminder}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Reminder"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderRemindersList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Scheduled Reminders
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Reminder
        </Button>
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No reminders scheduled</p>
          <p className="text-sm mt-2">
            Create reminders to notify participants about upcoming meetings
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => {
            const Icon = getReminderTypeIcon(reminder.type);
            return (
              <Card key={reminder._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {getReminderTypeLabel(reminder.type)}
                          </span>
                          <Badge
                            variant={reminder.sent ? "success" : "warning"}
                          >
                            {reminder.sent ? "Sent" : "Pending"}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(
                                new Date(reminder.time),
                                "MMM d, yyyy h:mm a"
                              )}
                            </span>
                          </div>
                          <div className="text-gray-500">
                            To: {reminder.recipient.name}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteReminder(reminder._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {showCreateForm && renderCreateForm()}
      {renderRemindersList()}
    </div>
  );
};

export default ReminderSystem;
