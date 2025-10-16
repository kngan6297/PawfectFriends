import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Activity,
  Clock,
  Users,
  FileText,
  PawPrint,
  MessageSquare,
  Settings,
  Eye,
  Filter,
  Download,
  Calendar,
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
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/services/api";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";

interface ActivityLog {
  _id: string;
  action: string;
  category:
    | "pet"
    | "adoption"
    | "user"
    | "system"
    | "chat"
    | "review"
    | "shelter"
    | "admin"
    | "file";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  performedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  shelter?: string;
  metadata?: {
    petId?: string;
    petName?: string;
    adoptionId?: string;
    requestId?: string;
    targetUserId?: string;
    targetUserName?: string;
    chatId?: string;
    messageId?: string;
    reviewId?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    fileUrl?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    oldStatus?: string;
    newStatus?: string;
    fieldChanged?: string;
    oldValue?: string;
    newValue?: string;
    reason?: string;
    additionalData?: any;
  };
  timestamp: string;
}

interface ActivityHistoryProps {
  shelterId: string;
}

const ActivityHistory: React.FC<ActivityHistoryProps> = ({ shelterId }) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    category: "",
    severity: "",
    dateRange: "7d",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    fetchActivities();
  }, [shelterId, filter, currentPage]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
        ...filter,
      };

      const response = await api.get(`/api/activities/shelter`, {
        params,
      });
      setActivities(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Failed to fetch activity history");
    } finally {
      setLoading(false);
    }
  };

  const exportActivities = async () => {
    try {
      const response = await api.get(`/api/activities/export`, {
        params: filter,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `shelter-activity-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Activity history exported successfully!");
    } catch (error) {
      console.error("Error exporting activities:", error);
      toast.error("Failed to export activity history");
    }
  };

  const getActivityIcon = (category: string) => {
    switch (category) {
      case "pet":
        return <PawPrint className="h-4 w-4 text-blue-600" />;
      case "adoption":
        return <FileText className="h-4 w-4 text-green-600" />;
      case "user":
        return <Users className="h-4 w-4 text-purple-600" />;
      case "chat":
        return <MessageSquare className="h-4 w-4 text-orange-600" />;
      case "system":
        return <Settings className="h-4 w-4 text-gray-600" />;
      case "review":
        return <MessageSquare className="h-4 w-4 text-yellow-600" />;
      case "shelter":
        return <Users className="h-4 w-4 text-indigo-600" />;
      case "admin":
        return <Users className="h-4 w-4 text-pink-600" />;
      case "file":
        return <FileText className="h-4 w-4 text-teal-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "secondary";
      case "critical":
        return "danger";
      default:
        return "default";
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "pet":
        return "default";
      case "adoption":
        return "success";
      case "user":
        return "secondary";
      case "chat":
        return "primary";
      case "system":
        return "primary";
      case "review":
        return "primary";
      case "shelter":
        return "default";
      case "admin":
        return "default";
      case "file":
        return "primary";
      default:
        return "default";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return `Today at ${format(date, "HH:mm")}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, "HH:mm")}`;
    } else if (isThisWeek(date)) {
      return format(date, "EEEE at HH:mm");
    } else {
      return format(date, "dd MMM yyyy at HH:mm");
    }
  };

  const clearFilters = () => {
    setFilter({
      category: "",
      severity: "",
      dateRange: "7d",
      search: "",
    });
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Activity History</h3>
          <p className="text-sm text-gray-600">
            Track all activities and changes made to your shelter
          </p>
        </div>
        <Button
          onClick={exportActivities}
          leftIcon={Download}
          variant="outline"
        >
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <h4 className="text-md font-medium">Filters</h4>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={filter.search}
                  onChange={(e) =>
                    setFilter((prev) => ({ ...prev, search: e.target.value }))
                  }
                  placeholder="Search activities..."
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Select
                value={filter.category}
                onValueChange={(value) =>
                  setFilter((prev) => ({ ...prev, category: value }))
                }
              >
                <option value="">All Categories</option>
                <option value="pet">Pet Management</option>
                <option value="adoption">Adoption</option>
                <option value="user">User Management</option>
                <option value="chat">Chat</option>
                <option value="review">Reviews</option>
                <option value="shelter">Shelter</option>
                <option value="admin">Admin</option>
                <option value="file">File</option>
                <option value="system">System</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <Select
                value={filter.severity}
                onValueChange={(value) =>
                  setFilter((prev) => ({ ...prev, severity: value }))
                }
              >
                <option value="">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="critical">Critical</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <Select
                value={filter.dateRange}
                onValueChange={(value) =>
                  setFilter((prev) => ({ ...prev, dateRange: value }))
                }
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={clearFilters} variant="outline" leftIcon={Filter}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activities.map((activity) => (
                  <tr key={activity._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.category)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {activity.action}
                          </div>
                          <div className="text-sm text-gray-500 max-w-md truncate">
                            {activity.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={getCategoryBadgeVariant(activity.category)}
                      >
                        {activity.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={getSeverityBadgeVariant(activity.severity)}
                      >
                        {activity.severity}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {activity.performedBy.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {activity.performedBy.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="outline" size="sm" leftIcon={Eye}>
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {activities.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No activities found
            </h3>
            <p className="text-gray-500">
              No activities match your current filters. Try adjusting your
              search criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActivityHistory;
