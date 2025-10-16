import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Edit,
  Lock,
  Unlock,
  Mail,
  Calendar,
  Shield,
  User,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { adminApi } from "@/services/admin.service";

interface UserDetails {
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
  address?: string;
  bio?: string;
  preferences?: any;
}

const UserDetailsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<{
    type: "lock" | "unlock";
  } | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await adminApi.getUserById(userId);

      if (response.data.success) {
        setUser(response.data.data);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch user details"
        );
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load user details"
      );
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: string) => {
    if (!user) return;

    try {
      setActionLoading(true);

      switch (action) {
        case "lock":
          await adminApi.lockUser(user._id, "Account locked by admin");
          toast.success(
            "Account locked successfully — user will not be able to log in."
          );
          break;
        case "unlock":
          await adminApi.unlockUser(user._id);
          toast.success(
            "Account unlocked successfully — user can log in normally again."
          );
          break;
        default:
          break;
      }

      // Refresh user details
      await fetchUserDetails();

      // Focus the action button after successful action for accessibility
      setTimeout(() => {
        const actionButton = document.querySelector(
          `[aria-label="${
            action === "lock" ? "Lock account" : "Unlock account"
          }"]`
        ) as HTMLButtonElement;
        if (actionButton) {
          actionButton.focus();
        }
      }, 100);
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
      toast.error(`Failed to ${action} user`);
    } finally {
      setActionLoading(false);
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

  const getStatusBadge = (u: UserDetails) => {
    if (u.accountLocked)
      return (
        <Badge className="bg-red-100 text-red-800 animate-[pulse_400ms_ease]">
          Locked
        </Badge>
      );
    if (!u.isActive)
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-full bg-gray-100 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 space-y-4">
            <div className="h-48 bg-gray-100 animate-pulse rounded" />
            <div className="h-40 bg-gray-100 animate-pulse rounded" />
          </div>
          <div className="md:col-span-4 space-y-4">
            <div className="h-56 bg-gray-100 animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-600">Error Loading User</h3>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <div className="mt-4 flex space-x-3">
          <Button onClick={fetchUserDetails} variant="primary">
            Try Again
          </Button>
          <Button
            onClick={() => navigate("/admin/dashboard?tab=users")}
            variant="outline"
          >
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-600">User Not Found</h3>
        <p className="mt-2 text-sm text-gray-500">
          The requested user could not be found.
        </p>
        <Button
          onClick={() => navigate("/admin/dashboard?tab=users")}
          variant="outline"
          className="mt-4"
        >
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="flex items-center justify-between px-2 md:px-0 py-3">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 flex items-center gap-2">
            <button
              onClick={() => navigate("/admin/dashboard?tab=users")}
              className="inline-flex items-center gap-1 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              aria-label="Return to user list"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Users
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-[180px] md:max-w-none">
              {user?.name || "User"}
            </span>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchUserDetails}
              leftIcon={RefreshCw}
              disabled={loading}
              aria-label="Refresh information"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(`/admin/users/${user._id}/edit`)}
              leftIcon={Edit}
              aria-label="Edit user"
            >
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* 12 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile (8/12) */}
        <div className="md:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" aria-hidden />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ring-1 ring-gray-200 overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`Avatar of ${user.name}`}
                        className="h-20 w-20 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-2xl font-semibold text-gray-600">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.name}
                    </h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" aria-hidden />
                        <a
                          href={`mailto:${user.email}`}
                          className="text-sm text-gray-700 underline-offset-2 hover:underline truncate max-w-[240px]"
                          title={user.email}
                        >
                          {user.email}
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-1"
                          aria-label="Copy email"
                          onClick={() => {
                            navigator.clipboard.writeText(user.email);
                            toast.success("Email copied");
                          }}
                        >
                          Copy
                        </Button>
                      </div>

                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm text-gray-600 truncate"
                            title={user.phone}
                          >
                            <a
                              href={`tel:${user.phone}`}
                              className="hover:underline"
                            >
                              {user.phone}
                            </a>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" aria-hidden />
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Status:</span>
                      {getStatusBadge(user)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Email:</span>
                      <Badge
                        className={
                          user.emailVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {user.emailVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional info */}
          {(user.bio || user.address) && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.bio && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Bio
                    </label>
                    <p className="text-sm text-gray-900 mt-1">{user.bio}</p>
                  </div>
                )}
                {user.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Address
                    </label>
                    <p
                      className="text-sm text-gray-900 mt-1 truncate"
                      title={user.address}
                    >
                      {user.address}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Status & Actions (4/12) */}
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" aria-hidden />
                <span>Account</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Created
                </span>
                <p className="text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleString("vi-VN", {
                    hour12: false,
                  })}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Last Login
                </span>
                <p className="text-sm text-gray-900">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleString("vi-VN", {
                        hour12: false,
                      })
                    : "Never"}
                </p>
              </div>

              <div className="pt-2">
                {user.accountLocked ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirm({ type: "unlock" })}
                    disabled={actionLoading}
                    leftIcon={Unlock}
                    className="w-full text-green-600 hover:text-green-700"
                    aria-label="Unlock account"
                  >
                    {actionLoading ? <LoadingSpinner /> : "Unlock Account"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirm({ type: "lock" })}
                    disabled={actionLoading}
                    leftIcon={Lock}
                    className="w-full text-yellow-700 hover:text-yellow-800"
                    aria-label="Lock account"
                  >
                    {actionLoading ? <LoadingSpinner /> : "Lock Account"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 grid place-items-center"
        >
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowConfirm(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <h3 className="text-lg font-semibold mb-2">
              {showConfirm.type === "lock"
                ? "Lock account?"
                : "Unlock account?"}
            </h3>
            <p className="text-sm text-gray-600">
              {showConfirm.type === "lock"
                ? "The user will not be able to log in until unlocked."
                : "The user will log in normally again."}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant={showConfirm.type === "lock" ? "outline" : "primary"}
                className={showConfirm.type === "lock" ? "text-yellow-700" : ""}
                onClick={async () => {
                  await handleUserAction(showConfirm.type);
                  setShowConfirm(null);
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailsPage;
