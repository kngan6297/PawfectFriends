import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Edit,
  Lock,
  Unlock,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
// DropdownMenu component not available, using simple buttons instead
import { formatDisplayDate } from "@/utils/dateUtils";
import { adminApi } from "@/services/admin.service";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "shelter" | "admin";
  emailVerified: boolean;
  isActive: boolean;
  accountLocked: boolean;
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
  phone?: string;
}

interface UserManagementProps {
  onRefresh?: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onRefresh }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (roleFilter !== "all") {
        filters.role = roleFilter;
      }

      if (statusFilter !== "all") {
        if (statusFilter === "active") {
          filters.isActive = true;
        } else if (statusFilter === "locked") {
          filters.accountLocked = true;
        } else if (statusFilter === "inactive") {
          filters.isActive = false;
        }
      }

      const response = await adminApi.getAllUsers(filters);

      if (response.data.success) {
        setUsers(response.data.data.users || []);
        setTotalPages(
          Math.ceil((response.data.data.total || 0) / itemsPerPage)
        );
      } else {
        throw new Error(response.data.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error instanceof Error ? error.message : "Failed to load users");
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const handleViewDetails = (userId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    navigate(`/admin/users/${userId}`); // Navigate to user details page
  };

  const handleEditUser = (userId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    navigate(`/admin/users/${userId}/edit`); // Navigate to edit user page
  };

  const handleUserAction = async (
    action: string,
    userId: string,
    event?: React.MouseEvent
  ) => {
    // Prevent default form submission or page reload
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      setActionLoading(userId);

      switch (action) {
        case "lock":
          await adminApi.lockUser(userId, "Account locked by admin");
          toast.success("User account locked successfully");
          break;
        case "unlock":
          await adminApi.unlockUser(userId);
          toast.success("User account unlocked successfully");
          break;
        default:
          break;
      }

      // Refresh the users list
      await fetchUsers();
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
      toast.error(`Failed to ${action} user`);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "shelter":
        return "bg-blue-100 text-blue-800";
      case "user":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.accountLocked) {
      return <Badge className="bg-red-100 text-red-800">Locked</Badge>;
    }
    if (!user.isActive) {
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-600">
          Error Loading Users
        </h3>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <Button onClick={fetchUsers} className="mt-4" variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            User Management
          </h2>
          <p className="text-sm text-gray-600">
            Manage user accounts, permissions, and access
          </p>
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
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="shelter">Shelters</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    User
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Email Verified
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Created
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Last Login
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(user)}</td>
                    <td className="py-3 px-4">
                      <Badge
                        className={
                          user.emailVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {user.emailVerified ? "Verified" : "Pending"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatDisplayDate(user.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {user.lastLogin
                        ? formatDisplayDate(user.lastLogin)
                        : "Never"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleViewDetails(user._id, e)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleEditUser(user._id, e)}
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user.accountLocked ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleUserAction("unlock", user._id, e);
                            }}
                            disabled={actionLoading === user._id}
                            title="Unlock Account"
                            className="text-green-600 hover:text-green-700"
                          >
                            {actionLoading === user._id ? (
                              <LoadingSpinner />
                            ) : (
                              <Unlock className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleUserAction("lock", user._id, e);
                            }}
                            disabled={actionLoading === user._id}
                            title="Lock Account"
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            {actionLoading === user._id ? (
                              <LoadingSpinner />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No users found matching your criteria.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
