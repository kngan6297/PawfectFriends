import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FileText,
  Search,
  Download,
  User,
  Shield,
  Activity,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SlideOver } from "@/components/ui/SlideOver";
import { adminApi } from "@/services/admin.service";
import { formatDisplayDateTime } from "@/utils/dateUtils";

interface LogEntry {
  _id: string;
  action: string;
  category: string;
  severity: string;
  description: string;
  performedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  shelter?: string;
  metadata: {
    petId?: string;
    petName?: string;
    ipAddress?: string;
    userAgent?: string;
    [key: string]: any;
  };
  timestamp: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

const AuditLogsManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [actionFilter, setActionFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [logType, setLogType] = useState("audit");
  const [openLog, setOpenLog] = useState<LogEntry | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isCompact, setIsCompact] = useState(false);
  const [sortBy, setSortBy] = useState<"timestamp" | "severity">("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [jumpToPage, setJumpToPage] = useState("");

  // Date formatter for consistent DD/MM/YYYY formatting
  const dateFormatter = (timestamp: string) => formatDisplayDateTime(timestamp);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Auto-fetch when filters change
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    logType,
    actionFilter,
    severityFilter,
    resourceFilter,
    startDate,
    endDate,
    debouncedSearch,
    page,
    limit,
    sortBy,
    sortOrder,
  ]);

  // Reset page when filters change (except page itself)
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    logType,
    actionFilter,
    severityFilter,
    resourceFilter,
    startDate,
    endDate,
    debouncedSearch,
    limit,
    sortBy,
    sortOrder,
  ]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let response;
      const filters = {
        action: actionFilter === "all" ? "" : actionFilter,
        severity: severityFilter === "all" ? "" : severityFilter,
        resource: resourceFilter === "all" ? "" : resourceFilter,
        search: debouncedSearch,
        startDate,
        endDate,
        page,
        limit,
        sortBy,
        sortOrder,
      };

      switch (logType) {
        case "audit":
          response = await adminApi.getAuditLogs(filters);
          break;
        case "activity":
          response = await adminApi.getActivityLogs(filters);
          break;
        case "security":
          response = await adminApi.getSecurityLogs(filters);
          break;
        default:
          response = await adminApi.getAuditLogs(filters);
      }

      // Handle new response structure with pagination
      const responseData = response.data?.data;
      if (responseData) {
        const logsData = Array.isArray(responseData.logs)
          ? responseData.logs
          : [];
        const paginationData = responseData.pagination || null;

        setLogs(logsData);
        setPagination(paginationData);
      } else {
        // Fallback for old response structure
        const logsData = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        setLogs(logsData);
        setPagination(null);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to fetch logs");
      setLogs([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportLogs = async () => {
    try {
      const filters = {
        action: actionFilter === "all" ? "" : actionFilter,
        severity: severityFilter === "all" ? "" : severityFilter,
        resource: resourceFilter === "all" ? "" : resourceFilter,
        search: debouncedSearch,
        startDate,
        endDate,
      };

      const response = await adminApi.exportLogs(filters);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${logType}-logs-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Logs exported successfully");
    } catch (error) {
      console.error("Error exporting logs:", error);
      toast.error("Failed to export logs");
    }
  };

  // Pagination helper functions
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && pagination && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  };

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    if (pageNum >= 1 && pagination && pageNum <= pagination.totalPages) {
      setPage(pageNum);
      setJumpToPage("");
    } else {
      toast.error(
        `Please enter a page number between 1 and ${
          pagination?.totalPages || 1
        }`
      );
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (!pagination) return [];

    const current = pagination.page;
    const total = pagination.totalPages;
    const delta = 2; // Number of pages to show on each side of current page

    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < total - 1) {
      rangeWithDots.push("...", total);
    } else {
      rangeWithDots.push(total);
    }

    return rangeWithDots;
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "login":
      case "logout":
        return <User className="h-4 w-4" />;
      case "create":
      case "update":
      case "delete":
        return <FileText className="h-4 w-4" />;
      case "security":
      case "permission":
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const actionBadge = (action: string) => {
    const map: any = {
      login: "success",
      logout: "secondary",
      create: "primary",
      update: "warning",
      delete: "danger",
      security: "danger",
      permission: "danger",
      pet_created: "primary",
      pet_updated: "warning",
      pet_deleted: "danger",
      adoption_request_created: "primary",
      adoption_request_approved: "success",
      adoption_request_rejected: "danger",
      user_registered: "primary",
      user_updated: "warning",
      user_deleted: "danger",
      file_uploaded: "primary",
      file_deleted: "danger",
      review_created: "primary",
      review_updated: "warning",
      review_deleted: "danger",
    };
    return (
      <Badge variant={map[action] ?? "default"} className="capitalize">
        {action.replace(/_/g, " ")}
      </Badge>
    );
  };

  // Active filter chips
  const activeChips = [
    actionFilter !== "all" && {
      label: `Action: ${actionFilter}`,
      onClear: () => setActionFilter("all"),
    },
    severityFilter !== "all" && {
      label: `Severity: ${severityFilter}`,
      onClear: () => setSeverityFilter("all"),
    },
    resourceFilter !== "all" && {
      label: `Category: ${resourceFilter}`,
      onClear: () => setResourceFilter("all"),
    },
    (startDate || endDate) && {
      label: `Date: ${startDate || "…"} → ${endDate || "…"}`,
      onClear: () => {
        setStartDate("");
        setEndDate("");
      },
    },
    debouncedSearch && {
      label: `Search: "${debouncedSearch}"`,
      onClear: () => setSearchTerm(""),
    },
  ].filter(Boolean) as { label: string; onClear: () => void }[];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={logType} onValueChange={setLogType}>
            <SelectTrigger className="min-w-[160px]">
              <SelectValue placeholder="Log type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="audit">Audit Logs</SelectItem>
              <SelectItem value="activity">Activity Logs</SelectItem>
              <SelectItem value="security">Security Logs</SelectItem>
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="min-w-[140px]">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="security">Security</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="min-w-[140px]">
              <SelectValue placeholder="All Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Select
            value={limit.toString()}
            onValueChange={(value) => handleLimitChange(parseInt(value))}
          >
            <SelectTrigger className="min-w-[120px]">
              <SelectValue placeholder="Items per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            leftIcon={Download}
            onClick={handleExportLogs}
            disabled={!logs?.length}
            aria-disabled={!logs?.length}
            title={!logs?.length ? "No data to export" : "Export CSV"}
          >
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsCompact(!isCompact)}
            title={
              isCompact
                ? "Switch to comfortable view"
                : "Switch to compact view"
            }
          >
            {isCompact ? "Comfortable" : "Compact"}
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="min-w-[150px]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="min-w-[150px]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="min-w-[170px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="pet">Pet</SelectItem>
              <SelectItem value="shelter">Shelter</SelectItem>
              <SelectItem value="adoption">Adoption</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="chat">Chat</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="file">File</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="recommendation">Recommendation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip, i) => (
            <Badge key={i} variant="secondary" className="gap-2">
              {chip.label}
              <button
                onClick={chip.onClear}
                className="rounded-full px-1 hover:bg-black/10"
              >
                ×
              </button>
            </Badge>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setActionFilter("all");
              setSeverityFilter("all");
              setResourceFilter("all");
              setStartDate("");
              setEndDate("");
              setPage(1);
              setJumpToPage("");
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {logType === "audit"
              ? "Audit Logs"
              : logType === "activity"
              ? "Activity Logs"
              : "Security Logs"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      if (sortBy === "severity") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("severity");
                        setSortOrder("asc");
                      }
                    }}
                  >
                    Severity{" "}
                    {sortBy === "severity" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      if (sortBy === "timestamp") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("timestamp");
                        setSortOrder("desc");
                      }
                    }}
                  >
                    Timestamp{" "}
                    {sortBy === "timestamp" &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(logs) &&
                  logs.map((log) => (
                    <tr
                      key={log._id}
                      onClick={() => setOpenLog(log)}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        isCompact ? "text-xs py-2" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            {getActionIcon(log.action)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              {actionBadge(log.action)}
                            </div>
                            <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                              {log.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {log.performedBy.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.performedBy.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {log.category}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.performedBy.role}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getSeverityBadgeVariant(log.severity)}>
                          {log.severity}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <span title={log.metadata.userAgent || ""}>
                            {log.metadata.ipAddress || "N/A"}
                          </span>
                          {log.metadata.ipAddress && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (log.metadata.ipAddress) {
                                  navigator.clipboard.writeText(
                                    log.metadata.ipAddress
                                  );
                                  toast.success("IP address copied");
                                }
                              }}
                            >
                              Copy
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {dateFormatter(log.timestamp)}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Enhanced Pagination */}
          {Array.isArray(logs) && logs.length > 0 && pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              {/* Pagination Info */}
              <div className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total.toLocaleString()} {logType} logs
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2">
                {/* First Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={!pagination.hasPrev}
                  title="First page"
                >
                  ««
                </Button>

                {/* Previous Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  title="Previous page"
                >
                  «
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((pageNum, index) => (
                    <React.Fragment key={index}>
                      {pageNum === "..." ? (
                        <span className="px-2 py-1 text-gray-400">...</span>
                      ) : (
                        <Button
                          variant={
                            pageNum === pagination.page ? "primary" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum as number)}
                          className="min-w-[32px]"
                        >
                          {pageNum}
                        </Button>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Next Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  title="Next page"
                >
                  »
                </Button>

                {/* Last Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={!pagination.hasNext}
                  title="Last page"
                >
                  »»
                </Button>
              </div>

              {/* Jump to Page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Go to:</span>
                <Input
                  type="number"
                  min="1"
                  max={pagination.totalPages}
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  className="w-16 h-8 text-center"
                  placeholder="Page"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleJumpToPage}
                  disabled={!jumpToPage}
                >
                  Go
                </Button>
              </div>
            </div>
          )}

          {/* Fallback pagination for old response structure */}
          {Array.isArray(logs) && logs.length > 0 && !pagination && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {page} • {logs.length} logs
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={logs.length < limit}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {Array.isArray(logs) && logs.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-6" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {logType} logs found
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {debouncedSearch ||
                actionFilter !== "all" ||
                severityFilter !== "all" ||
                resourceFilter !== "all" ||
                startDate ||
                endDate
                  ? "Try adjusting your filters or search terms"
                  : "No activity has been logged yet"}
              </p>
              {!debouncedSearch &&
                actionFilter === "all" &&
                severityFilter === "all" &&
                resourceFilter === "all" &&
                !startDate &&
                !endDate && (
                  <div className="text-xs text-gray-400">
                    <p className="mb-2">💡 Try changing the date range:</p>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const end = new Date();
                          const start = new Date();
                          start.setDate(start.getDate() - 7);
                          setStartDate(start.toISOString().split("T")[0]);
                          setEndDate(end.toISOString().split("T")[0]);
                        }}
                      >
                        Last 7 days
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const end = new Date();
                          const start = new Date();
                          start.setDate(start.getDate() - 30);
                          setStartDate(start.toISOString().split("T")[0]);
                          setEndDate(end.toISOString().split("T")[0]);
                        }}
                      >
                        Last 30 days
                      </Button>
                    </div>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details SlideOver */}
      <SlideOver
        isOpen={!!openLog}
        onClose={() => setOpenLog(null)}
        title="Log Details"
        width="xl"
      >
        {openLog && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-500">Action</span>
                <div className="font-medium">{actionBadge(openLog.action)}</div>
              </div>
              <div>
                <span className="text-gray-500">Severity</span>
                <div>
                  <Badge variant={getSeverityBadgeVariant(openLog.severity)}>
                    {openLog.severity}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-gray-500">User</span>
                <div>
                  {openLog.performedBy.name} · {openLog.performedBy.email}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Timestamp</span>
                <div>{dateFormatter(openLog.timestamp)}</div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Description</span>
                <div className="text-gray-800">{openLog.description}</div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Metadata</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(openLog.metadata, null, 2)
                    );
                    toast.success("Copied");
                  }}
                >
                  Copy
                </Button>
              </div>
              <pre className="mt-2 bg-gray-50 rounded-lg p-3 overflow-auto text-xs">
                {JSON.stringify(openLog.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
};

export default AuditLogsManagement;
