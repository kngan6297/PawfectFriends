import React, { useState, useMemo, useDeferredValue } from "react";
import { toast } from "react-toastify";
import {
  Building2,
  Search,
  Eye,
  Trash2,
  Ban,
  RotateCcw,
  Star,
  PawPrint,
  BarChart3,
  Download,
  MessageSquare,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/Tooltip";
import { SlideOver } from "@/components/ui/SlideOver";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import { formatDisplayDate } from "@/utils/dateUtils";

interface Shelter {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    city?: string;
    state?: string;
  };
  website?: string;
  description?: string;
  isApproved: boolean;
  isBanned: boolean;
  status: string;
  rating?: number | { average: number; count: number };
  reviewCount?: number | { count: number };
  petCount?: number | { count: number };
  createdAt: string;
  approvedAt?: string;
}

interface ShelterManagementProps {
  shelters: Shelter[];
  onShelterAction: (
    action: string,
    shelterId: string,
    data?: any
  ) => Promise<void>;
  onRefresh?: () => Promise<void>;
  onExport?: (shelters: Shelter[]) => Promise<void>;
  loading?: boolean;
}

/**
 * ShelterManagement Component
 */
const ShelterManagement: React.FC<ShelterManagementProps> = ({
  shelters,
  onShelterAction,
  onRefresh,
  onExport,
  loading = false,
}) => {
  // Address standardization helpers
  const joinClean = (...parts: Array<string | undefined>) =>
    parts
      .filter((x) => typeof x === "string" && x.trim().length > 0)
      .join(", ");

  const getAddressDisplay = (s: any) => {
    // Prioritize VN structure if available
    const loc = s.location?.address ?? s.location ?? {};
    const vnDistrict = loc?.district?.name;
    const vnProvince = loc?.province?.name;

    const street =
      s.address?.street ??
      loc?.street ??
      s.streetAddress ??
      s.addressLine1 ??
      undefined;

    const city =
      s.address?.city ?? loc?.city ?? vnDistrict ?? s.city ?? undefined;

    const state =
      s.address?.state ?? loc?.state ?? vnProvince ?? s.state ?? undefined;

    // For VN data, prioritize district and province for better localization
    const out = joinClean(street, vnDistrict || city, vnProvince || state);
    return out.trim() || "No address";
  };

  // Stats standardization helpers
  const firstNumber = (...candidates: any[]) => {
    for (const v of candidates) {
      if (typeof v === "number" && !Number.isNaN(v)) return v;
    }
    return 0;
  };

  const getShelterStats = (s: any) => {
    const ratingAvg = firstNumber(
      typeof s.rating === "object" ? s.rating?.average : s.rating,
      s.stats?.rating?.average,
      s.metrics?.ratingAvg,
      s.averageRating
    );

    const petCount = firstNumber(
      typeof s.petCount === "object" ? s.petCount?.count : s.petCount,
      s.stats?.pets?.count,
      s.metrics?.petCount,
      s.petsCount,
      Array.isArray(s.pets) ? s.pets.length : undefined
    );

    const reviewCount = firstNumber(
      typeof s.reviewCount === "object" ? s.reviewCount?.count : s.reviewCount,
      s.stats?.reviews?.count,
      s.metrics?.reviewsCount,
      s.reviewsCount,
      Array.isArray(s.reviews) ? s.reviews.length : undefined
    );

    return { ratingAvg, petCount, reviewCount };
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [modalData, setModalData] = useState<any>({});
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Ensure shelters is always an array for filtering
  const sheltersArray = Array.isArray(shelters) ? shelters : [];

  const openModal = (type: string, shelter: Shelter) => {
    if (type === "activity_report") {
      setSelectedShelter(shelter);
      setShowAnalytics(true);
    } else {
      setModalType(type);
      setSelectedShelter(shelter);
      setModalData({});
      setShowModal(true);
    }
  };

  const handleExport = async () => {
    if (filteredShelters.length === 0) {
      toast.warning("No shelters to export");
      return;
    }

    try {
      setIsExporting(true);

      if (onExport) {
        await onExport(filteredShelters);
      } else {
        // Generate CSV locally
        const csvContent = generateCSV(filteredShelters);
        downloadCSV(csvContent, "shelters.csv");
      }

      toast.success(
        `Exported ${filteredShelters.length} shelters successfully`
      );
    } catch (error) {
      toast.error("Failed to export shelters");
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (shelters: Shelter[]) => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Address",
      "Status",
      "Approval Status",
      "Rating",
      "Pet Count",
      "Review Count",
      "Created At",
    ];

    const rows = shelters.map((s) => {
      const { ratingAvg, petCount, reviewCount } = getShelterStats(s);
      return [
        s.name,
        s.email,
        s.phone || "",
        getAddressDisplay(s),
        s.status,
        s.isBanned ? "Banned" : s.isApproved ? "Approved" : "Pending",
        ratingAvg,
        petCount,
        reviewCount,
        formatDisplayDate($1),
      ];
    });

    return [headers, ...rows]
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "pending":
        return "warning";
      case "banned":
        return "danger";
      case "inactive":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getApprovalBadgeVariant = (shelter: Shelter) => {
    if (shelter.isBanned) return "danger";
    if (shelter.isApproved) return "success";
    return "warning";
  };

  const getApprovalText = (shelter: Shelter) => {
    if (shelter.isBanned) return "Banned";
    if (shelter.isApproved) return "Approved";
    return "Pending";
  };

  const handleAction = async () => {
    if (!selectedShelter) return;

    try {
      await onShelterAction(modalType, selectedShelter._id, modalData);
      setShowModal(false);
      setSelectedShelter(null);
    } catch (error) {
      // Error handling without console logging
    }
  };

  // Defer search term to avoid heavy re-rendering when typing
  const deferredSearch = useDeferredValue(searchTerm);

  // Memoize filtered results for better performance
  const filteredShelters = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();

    return sheltersArray.filter((s) => {
      // Search filter - optimized address handling
      const address = getAddressDisplay(s).toLowerCase();
      const hit =
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        address.includes(q);

      // Status filter
      const okStatus =
        !statusFilter || statusFilter === "all" || s.status === statusFilter;

      // Approval filter
      const okApproval =
        !approvalFilter ||
        approvalFilter === "all" ||
        (approvalFilter === "approved" && s.isApproved && !s.isBanned) ||
        (approvalFilter === "pending" && !s.isApproved && !s.isBanned) ||
        (approvalFilter === "banned" && s.isBanned);

      return hit && okStatus && okApproval;
    });
  }, [sheltersArray, deferredSearch, statusFilter, approvalFilter]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setApprovalFilter("all");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="h-10 w-full bg-gray-100 animate-pulse rounded" />

        {/* Filter Skeleton */}
        <div className="h-20 w-full bg-gray-100 animate-pulse rounded" />

        {/* Mobile Cards Skeleton */}
        <div className="md:hidden space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 bg-gray-100 animate-pulse rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-100 animate-pulse rounded mb-2" />
                  <div className="h-3 w-24 bg-gray-100 animate-pulse rounded" />
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <div className="h-6 w-16 bg-gray-100 animate-pulse rounded" />
                <div className="h-6 w-20 bg-gray-100 animate-pulse rounded" />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="h-4 w-8 bg-gray-100 animate-pulse rounded" />
                <div className="h-4 w-8 bg-gray-100 animate-pulse rounded" />
                <div className="h-4 w-8 bg-gray-100 animate-pulse rounded" />
              </div>
              <div className="flex justify-end gap-2">
                <div className="h-8 w-8 bg-gray-100 animate-pulse rounded" />
                <div className="h-8 w-8 bg-gray-100 animate-pulse rounded" />
                <div className="h-8 w-8 bg-gray-100 animate-pulse rounded" />
                <div className="h-8 w-8 bg-gray-100 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Skeleton */}
        <div className="hidden md:block">
          <div className="h-64 w-full bg-gray-100 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Shelter Management
          </h2>
          <p className="text-sm text-gray-600">
            Manage shelter accounts, approvals, and status
          </p>
        </div>
        <div className="flex space-x-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                leftIcon={Download}
                onClick={handleExport}
                disabled={isExporting || filteredShelters.length === 0}
                isLoading={isExporting}
              >
                Export Shelters
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {filteredShelters.length === 0
                ? "No data to export"
                : "Export shelters data"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search shelters by name, email, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={approvalFilter}
              onValueChange={(value) => setApprovalFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by approval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredShelters.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No shelters found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your filters or search terms to find shelters.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setApprovalFilter("all");
              }}
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          filteredShelters.map((s) => (
            <div key={s._id} className="rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 grid place-items-center">
                  <Building2 className="h-5 w-5 text-blue-600" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-sm text-gray-500 truncate">
                    {getAddressDisplay(s)}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={getStatusBadgeVariant(s.status)}>
                  {s.status}
                </Badge>
                <Badge variant={getApprovalBadgeVariant(s)}>
                  {getApprovalText(s)}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                {(() => {
                  const { ratingAvg, petCount, reviewCount } =
                    getShelterStats(s);
                  return (
                    <>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {ratingAvg.toFixed(1)}
                      </div>
                      <div className="flex items-center gap-1">
                        <PawPrint className="h-4 w-4 text-green-600" />
                        {petCount}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4 text-yellow-600" />
                        {reviewCount}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                <a
                  href={`mailto:${s.email}`}
                  className="truncate underline-offset-2 hover:underline"
                  title={s.email}
                >
                  {s.email}
                </a>
                <span>
                  {new Date(s.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="View shelter details"
                      onClick={() => openModal("view_shelter", s)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View Details</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={s.isBanned ? "Unban shelter" : "Ban shelter"}
                      onClick={() =>
                        openModal(
                          s.isBanned ? "unban_shelter" : "ban_shelter",
                          s
                        )
                      }
                    >
                      {s.isBanned ? (
                        <RotateCcw className="h-4 w-4" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {s.isBanned ? "Unban Shelter" : "Ban Shelter"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="View shelter analytics"
                      onClick={() => openModal("activity_report", s)}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View Analytics</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Delete shelter"
                      onClick={() => openModal("delete_shelter", s)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete Shelter</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Shelters Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shelters ({filteredShelters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Shelter
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Contact
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Approval
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Stats
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Created
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredShelters.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No shelters found
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Try adjusting your filters or search terms to find
                        shelters.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("");
                          setStatusFilter("all");
                          setApprovalFilter("all");
                        }}
                      >
                        Clear all filters
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredShelters.map((shelter) => (
                    <tr key={shelter._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {shelter.name}
                            </div>
                            <div
                              className="text-sm text-gray-500 truncate"
                              title={getAddressDisplay(shelter)}
                            >
                              {getAddressDisplay(shelter)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <a
                            href={`mailto:${shelter.email}`}
                            className="hover:underline truncate block"
                            title={shelter.email}
                          >
                            {shelter.email}
                          </a>
                        </div>
                        {shelter.phone && (
                          <div className="text-sm text-gray-500">
                            <a
                              href={`tel:${shelter.phone}`}
                              className="hover:underline"
                              title={shelter.phone}
                            >
                              {shelter.phone}
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(shelter.status)}>
                          {shelter.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getApprovalBadgeVariant(shelter)}>
                          {getApprovalText(shelter)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const { ratingAvg, petCount, reviewCount } =
                            getShelterStats(shelter);
                          return (
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                <span>
                                  {typeof ratingAvg === "object"
                                    ? (
                                        ratingAvg as { average: number }
                                      ).average.toFixed(1)
                                    : (ratingAvg as number).toFixed(1)}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <PawPrint className="h-4 w-4 text-green-500 mr-1" />
                                <span>
                                  {typeof petCount === "object"
                                    ? (petCount as { count: number }).count || 0
                                    : petCount || 0}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <MessageSquare className="h-4 w-4 text-yellow-500 mr-1" />
                                <span>
                                  {typeof reviewCount === "object"
                                    ? (reviewCount as { count: number })
                                        .count || 0
                                    : reviewCount || 0}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(shelter.createdAt).toLocaleDateString(
                          "vi-VN",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                aria-label="View shelter details"
                                onClick={() =>
                                  openModal("view_shelter", shelter)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>

                          {shelter.isBanned ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  aria-label="Unban shelter"
                                  onClick={() =>
                                    openModal("unban_shelter", shelter)
                                  }
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Unban Shelter</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  aria-label="Ban shelter"
                                  onClick={() =>
                                    openModal("ban_shelter", shelter)
                                  }
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ban Shelter</TooltipContent>
                            </Tooltip>
                          )}

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                aria-label="View shelter analytics"
                                onClick={() =>
                                  openModal("activity_report", shelter)
                                }
                              >
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Analytics</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                aria-label="Delete shelter"
                                onClick={() =>
                                  openModal("delete_shelter", shelter)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Shelter</TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          className="bg-white opacity-100 !opacity-100"
          style={{ opacity: 1 }}
        >
          <DialogHeader>
            <DialogTitle>
              {modalType
                .replace("_", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 opacity-100" style={{ opacity: 1 }}>
            {modalType === "view_shelter" && selectedShelter && (
              <div className="space-y-4 opacity-100" style={{ opacity: 1 }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <p
                      className="text-sm text-gray-900 opacity-100"
                      style={{ opacity: 1 }}
                    >
                      {selectedShelter?.name || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedShelter?.email || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedShelter?.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Website
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedShelter?.website ? (
                        <a
                          href={selectedShelter.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {selectedShelter.website}
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <p className="text-sm text-gray-900">
                      {getAddressDisplay(selectedShelter)}
                    </p>
                  </div>
                  {selectedShelter?.description && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedShelter.description}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedShelter?.status || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Approval Status
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedShelter?.isApproved ? "Approved" : "Pending"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Pet Count
                    </label>
                    <p className="text-sm text-gray-900">
                      {typeof selectedShelter?.petCount === "object"
                        ? selectedShelter.petCount?.count || 0
                        : selectedShelter?.petCount || 0}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Review Count
                    </label>
                    <p className="text-sm text-gray-900">
                      {typeof selectedShelter?.reviewCount === "object"
                        ? selectedShelter.reviewCount?.count || 0
                        : selectedShelter?.reviewCount || 0}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Rating
                    </label>
                    <p className="text-sm text-gray-900">
                      {typeof selectedShelter?.rating === "object"
                        ? (
                            selectedShelter.rating as { average: number }
                          ).average.toFixed(1)
                        : selectedShelter?.rating || 0}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Created At
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedShelter?.createdAt
                        ? formatDisplayDate($1)
                        : "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {modalType === "ban_shelter" && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to ban shelter "{selectedShelter?.name}
                  "?
                </p>
                <Input
                  placeholder="Reason for banning..."
                  value={modalData.reason || ""}
                  onChange={(e) =>
                    setModalData({ ...modalData, reason: e.target.value })
                  }
                  fullWidth
                />
              </div>
            )}

            {modalType === "unban_shelter" && (
              <div>
                <p className="text-sm text-gray-600">
                  Are you sure you want to unban shelter "
                  {selectedShelter?.name}"?
                </p>
              </div>
            )}

            {modalType === "delete_shelter" && (
              <div>
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="text-red-600 font-medium">
                      ⚠️ Critical Action Warning
                    </div>
                  </div>
                  <p className="text-sm text-red-700 mb-3">
                    Deleting shelter "{selectedShelter?.name}" will permanently
                    remove:
                  </p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    <li>
                      <strong>
                        {typeof selectedShelter?.petCount === "object"
                          ? selectedShelter.petCount?.count || 0
                          : selectedShelter?.petCount || 0}{" "}
                        pets
                      </strong>{" "}
                      - All pets will be orphaned
                    </li>
                    <li>
                      <strong>
                        {typeof selectedShelter?.reviewCount === "object"
                          ? selectedShelter.reviewCount?.count || 0
                          : selectedShelter?.reviewCount || 0}{" "}
                        reviews
                      </strong>{" "}
                      - All reviews will be lost
                    </li>
                    <li>
                      <strong>All adoption requests</strong> - Active and
                      pending requests
                    </li>
                    <li>
                      <strong>All conversations</strong> - Chat history with
                      users
                    </li>
                    <li>
                      <strong>All shelter data</strong> - Profile, settings,
                      statistics
                    </li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>This action cannot be undone.</strong> Consider
                  banning the shelter instead to preserve data while preventing
                  access.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setModalType("ban_shelter");
                      setModalData({ reason: "Shelter marked for deletion" });
                    }}
                    className="flex-1"
                  >
                    Ban Instead
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              {modalType === "delete_shelter" ? (
                <Button
                  variant="secondary"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={handleAction}
                >
                  Delete Permanently
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant={
                      modalType.includes("delete") || modalType.includes("ban")
                        ? "secondary"
                        : "secondary"
                    }
                    className={
                      modalType === "unban_shelter"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : modalType.includes("delete") ||
                          modalType.includes("ban")
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : ""
                    }
                    onClick={handleAction}
                    disabled={modalType === "ban_shelter" && !modalData.reason}
                  >
                    {modalType === "delete_shelter" ? "Delete" : "Confirm"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Slide-Over */}
      <SlideOver
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        title={`Analytics - ${selectedShelter?.name || "Shelter"}`}
        width="xl"
      >
        {selectedShelter && (
          <AnalyticsDashboard shelterId={selectedShelter._id} isAdmin={true} />
        )}
      </SlideOver>
    </div>
  );
};

export default ShelterManagement;
