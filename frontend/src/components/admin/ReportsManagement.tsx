import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
  Download,
  RefreshCw,
  Clock,
  User,
  Shield,
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
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { adminApi, ReportPeriod } from "@/services/admin.service";
import { formatDisplayDate } from "@/utils/dateUtils";

interface Report {
  _id: string;
  reason: string;
  status: string;
  description: string;
  reporter: {
    name: string;
    email: string;
  };
  reportedUser: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

interface ReportStats {
  total: number;
  byStatus: Record<string, number>;
  byReason: Record<string, number>;
}

const ReportsManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [modalData, setModalData] = useState<any>({});
  const [period, setPeriod] = useState<ReportPeriod>("30d");

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchReports = async () => {
    try {
      console.log("🔍 [ReportsManagement] Starting fetchReports...");
      console.log("🔍 [ReportsManagement] Filters:", {
        statusFilter,
        typeFilter,
        searchTerm,
      });
      setLoading(true);
      const response = await adminApi.getAllReports({
        status: statusFilter === "all" ? "" : statusFilter,
        reason: typeFilter === "all" ? "" : typeFilter,
        search: searchTerm,
      });
      console.log("📊 [ReportsManagement] fetchReports response:", response);
      console.log("📊 [ReportsManagement] fetchReports data:", response.data);
      console.log(
        "📊 [ReportsManagement] fetchReports data.data:",
        response.data.data
      );
      console.log(
        "📊 [ReportsManagement] fetchReports data length:",
        response.data?.data?.length
      );
      // Ensure we always have an array - handle wrapped response
      const reportsData = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      console.log("📊 [ReportsManagement] Final reports data:", reportsData);
      console.log(
        "📊 [ReportsManagement] First report structure:",
        reportsData[0]
      );
      console.log(
        "📊 [ReportsManagement] Report IDs:",
        reportsData.map((r) => ({ _id: r._id, id: r.id }))
      );
      setReports(reportsData);
    } catch (error) {
      console.error("❌ [ReportsManagement] Error fetching reports:", error);
      console.error("❌ [ReportsManagement] Error response:", error.response);
      console.error(
        "❌ [ReportsManagement] Error response data:",
        error.response?.data
      );
      console.error(
        "❌ [ReportsManagement] Error response status:",
        error.response?.status
      );
      console.error(
        "❌ [ReportsManagement] Error response headers:",
        error.response?.headers
      );
      toast.error("Failed to fetch reports");
      setReports([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log("📈 [ReportsManagement] Starting fetchStats...");
      console.log("📈 [ReportsManagement] Period:", period);
      const { data } = await adminApi.getReportStats(period);
      console.log("📈 [ReportsManagement] fetchStats response data:", data);
      console.log(
        "📈 [ReportsManagement] fetchStats response data.data:",
        data.data
      );
      console.log("📈 [ReportsManagement] Stats object:", {
        total: data?.data?.total,
        pending: data?.data?.pending,
        resolved: data?.data?.resolved,
        dismissed: data?.data?.dismissed,
        investigating: data?.data?.investigating,
        byStatus: data?.data?.byStatus,
        byReason: data?.data?.byReason,
      });
      setStats(data.data);
    } catch (err: any) {
      console.error("❌ [ReportsManagement] Error fetching report stats:", err);
      console.error("❌ [ReportsManagement] Error response:", err.response);
      console.error(
        "❌ [ReportsManagement] Error response data:",
        err.response?.data
      );
      console.error(
        "❌ [ReportsManagement] Error response status:",
        err.response?.status
      );
      console.error(
        "❌ [ReportsManagement] Error response headers:",
        err.response?.headers
      );
      console.error("❌ [ReportsManagement] Error config:", err.config);
      console.error("❌ [ReportsManagement] Error request:", err.request);
      toast.error(
        err?.response?.data?.message || "Failed to fetch report stats"
      );
      // Set default stats on error
      setStats({
        total: 0,
        byStatus: {},
        byReason: {},
      });
    }
  };

  const handleAction = async (action: string, reportId: string, data?: any) => {
    try {
      let response;
      switch (action) {
        case "update_status":
          response = await adminApi.updateReportStatus(reportId, data.status);
          break;
        case "apply_action":
          response = await adminApi.applyReportAction(
            reportId,
            data.action,
            data
          );
          break;
        default:
          throw new Error("Unknown action");
      }

      toast.success(response.data.message || "Action completed successfully");
      fetchReports();
      fetchStats();
      setShowModal(false);
    } catch (error) {
      console.error("Action error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to perform action";
      toast.error(errorMessage);
    }
  };

  const openModal = (type: string, report?: Report) => {
    setModalType(type);
    setSelectedReport(report || null);
    setModalData({});
    setShowModal(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "resolved":
        return "success";
      case "dismissed":
        return "danger";
      default:
        return "default";
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case "inappropriate_content":
        return <AlertTriangle className="h-4 w-4" />;
      case "spam":
        return <XCircle className="h-4 w-4" />;
      case "harassment":
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Reports
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.byStatus?.pending || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.byStatus?.resolved || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Dismissed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.byStatus?.dismissed || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="inappropriate_content">
                Inappropriate Content
              </SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
              <SelectItem value="harassment">Harassment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            leftIcon={Download}
            onClick={() => {
              // Export functionality
            }}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reports & Violations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(reports) && reports.length > 0 ? (
                  reports.map((report, index) => (
                    <tr key={report._id || report.id || `report-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            {getReasonIcon(report.reason)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {report.reason.replace(/_/g, " ")}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {report.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="default">
                          {report.reason.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(report.status)}>
                          {report.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {report.reporter.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.reporter.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {report.reportedUser.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.reportedUser.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDisplayDate(report.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openModal("view_report", report)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {report.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  openModal("resolve_report", report)
                                }
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  openModal("dismiss_report", report)
                                }
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <AlertTriangle className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-lg font-medium">No reports found</p>
                        <p className="text-sm">
                          Try adjusting your filters or search terms
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal for actions */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalType
                .replace("_", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {modalType === "view_report" && selectedReport && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Report Details</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedReport.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-sm">Reporter</h5>
                    <p className="text-sm text-gray-600">
                      {selectedReport.reporter.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedReport.reporter.email}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm">Reported User</h5>
                    <p className="text-sm text-gray-600">
                      {selectedReport.reportedUser.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedReport.reportedUser.email}
                    </p>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-sm">Admin Notes</h5>
                  <Input
                    placeholder="Add admin notes..."
                    value={modalData.notes || selectedReport.adminNotes || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, notes: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {modalType === "resolve_report" && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Resolve this report? This will mark it as resolved.
                </p>
                <Input
                  placeholder="Resolution notes..."
                  value={modalData.notes || ""}
                  onChange={(e) =>
                    setModalData({ ...modalData, notes: e.target.value })
                  }
                  fullWidth
                />
              </div>
            )}

            {modalType === "dismiss_report" && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Dismiss this report? This will mark it as dismissed.
                </p>
                <Input
                  placeholder="Dismissal reason..."
                  value={modalData.reason || ""}
                  onChange={(e) =>
                    setModalData({ ...modalData, reason: e.target.value })
                  }
                  fullWidth
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const action =
                    modalType === "resolve_report"
                      ? "update_status"
                      : modalType === "dismiss_report"
                      ? "update_status"
                      : "apply_action";
                  const data =
                    modalType === "resolve_report"
                      ? { status: "resolved", notes: modalData.notes }
                      : modalType === "dismiss_report"
                      ? { status: "dismissed", reason: modalData.reason }
                      : modalData;
                  handleAction(action, selectedReport!._id, data);
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsManagement;
