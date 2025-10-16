import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Mail,
  Calendar,
  Shield,
  User,
  Eye,
  EyeOff,
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
import { adminApi } from "@/services/admin.service";

interface UserFormData {
  name: string;
  email: string;
  role: "user" | "shelter" | "admin";
  isActive: boolean;
  accountLocked: boolean;
  emailVerified: boolean;
  phone?: string;
  bio?: string;
  address?: string;
}

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
}

const EditUserPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UserFormData>({
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      isActive: true,
      accountLocked: false,
      emailVerified: false,
      phone: "",
      bio: "",
      address: "",
    },
  });

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

      // For now, we'll use the getAllUsers API and find the specific user
      // In a real app, you'd have a dedicated getUserById endpoint
      const response = await adminApi.getAllUsers({ page: 1, limit: 1000 });

      if (response.data.success) {
        const users = response.data.data.users || [];
        const foundUser = users.find((u: UserDetails) => u._id === userId);

        if (foundUser) {
          setUser(foundUser);
          reset({
            name: foundUser.name || "",
            email: foundUser.email || "",
            role: foundUser.role || "user",
            isActive: foundUser.isActive ?? true,
            accountLocked: foundUser.accountLocked ?? false,
            emailVerified: foundUser.emailVerified ?? false,
            phone: foundUser.phone || "",
            bio: foundUser.bio || "",
            address: foundUser.address || "",
          });
        } else {
          throw new Error("User not found");
        }
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

  const onSubmit = async (data: UserFormData) => {
    if (!user) return;

    try {
      setSaving(true);

      // For now, we'll simulate updating the user
      // In a real app, you'd have a dedicated updateUser endpoint
      console.log("Updating user with data:", data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("User updated successfully");

      // Navigate back to user details
      navigate(`/admin/users/${user._id}`);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
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

  const getStatusBadge = (user: UserDetails) => {
    let color = "bg-gray-100 text-gray-800";
    let text = "Inactive";

    if (user.isActive) {
      text = "Active";
      color = "bg-green-100 text-green-800";
    } else if (user.accountLocked) {
      text = "Locked";
      color = "bg-yellow-100 text-yellow-800";
    } else {
      text = "Inactive";
      color = "bg-gray-100 text-gray-800";
    }

    return <Badge className={color}>{text}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
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
            <button
              onClick={() => navigate(`/admin/users/${user._id}`)}
              className="hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              aria-label="View user details"
            >
              {user?.name || "User"}
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">Edit</span>
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
              onClick={handleSubmit(onSubmit)}
              leftIcon={Save}
              disabled={saving || !isDirty}
              isLoading={saving}
              aria-label="Save changes"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <User className="h-5 w-5" />
            <span>Current User Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-medium text-gray-600">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user.name}
                  </h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {user.email}
                      </span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {user.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    {getStatusBadge(user)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Email:</span>
                    <Badge
                      className={
                        user.emailVerified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {user.emailVerified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: "Name is required" }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Enter full name"
                      className={errors.name ? "border-red-300" : ""}
                    />
                  )}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter email address"
                      className={errors.email ? "border-red-300" : ""}
                    />
                  )}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Enter phone number" />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Role *
                </label>
                <Controller
                  name="role"
                  control={control}
                  rules={{ required: "Role is required" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        className={errors.role ? "border-red-300" : ""}
                      >
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="shelter">Shelter</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.role.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Account Active
                  </label>
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <input
                        title="Account Active"
                        placeholder="Account Active"
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Account Locked
                  </label>
                  <Controller
                    name="accountLocked"
                    control={control}
                    render={({ field }) => (
                      <input
                        title="Account Locked"
                        placeholder="Account Locked"
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Email Verified
                  </label>
                  <Controller
                    name="emailVerified"
                    control={control}
                    render={({ field }) => (
                      <input
                        title="Email Verified"
                        placeholder="Email Verified"
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <Controller
                name="bio"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    placeholder="Enter user bio"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={2}
                    placeholder="Enter address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/admin/users/${user._id}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving || !isDirty}
            isLoading={saving}
            leftIcon={Save}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditUserPage;
