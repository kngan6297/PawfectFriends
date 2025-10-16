import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { userApi } from "@/services/api";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Lock,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { normalizePhoneNumber } from "@/utils/phone-formatter";
import { handleApiError } from "@/utils/error-handler";
import { useNavigate } from "react-router-dom";
import { formatDisplayDate } from "@/utils/dateUtils";
import {
  vietnamProvincesApi,
  Province,
  District,
  Ward,
} from "@/services/vietnamProvincesApi";

// Validation schemas
const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const addressSchema = z
  .object({
    street: z.string().optional(),
    ward: z
      .object({
        code: z.number(),
        name: z.string(),
      })
      .optional(),
    district: z
      .object({
        code: z.number(),
        name: z.string(),
      })
      .optional(),
    province: z
      .object({
        code: z.number(),
        name: z.string(),
      })
      .optional(),
    country: z.string().default("Vietnam"),
  })
  .refine((data) => data.province, {
    message: "Province is required",
    path: ["province"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type AddressFormData = z.infer<typeof addressSchema>;

export const ProfilePage: React.FC = () => {
  const { user, updateUser, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [hasRefreshedProfile, setHasRefreshedProfile] = useState(false);

  // Province API state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Address form
  const addressForm = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      ward: undefined,
      district: undefined,
      province: undefined,
      country: "Vietnam",
    },
  });

  // Load provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const provincesData = await vietnamProvincesApi.getProvinces();
        setProvinces(provincesData);
      } catch (error) {
        console.error("Failed to load provinces:", error);
        toast.error("Failed to load provinces data");
      } finally {
        setLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        setIsProfileLoading(true);
        // Only refresh user profile if data seems incomplete AND we haven't already tried
        if ((!user?.name || !user?.email) && !hasRefreshedProfile) {
          setHasRefreshedProfile(true);
          await refreshUserProfile();
        }

        const response = await userApi.getProfile();
        if (isMounted && response?.data) {
          const profileData = response.data?.data || response.data;

          // Update form defaults
          profileForm.reset({
            name: profileData.name || "",
            email: profileData.email || "",
            phone: profileData.phone || "",
            bio: profileData.bio || "",
          });

          // Handle address data - convert from AddressSchema format to form format
          const location = profileData.location;
          console.log("🐾 ProfilePage - Location data:", location);

          const addressData = {
            street: location?.details?.street || "",
            ward: location?.ward
              ? { code: location.ward.code, name: location.ward.name }
              : undefined,
            district: location?.district
              ? { code: location.district.code, name: location.district.name }
              : undefined,
            province: location?.province
              ? { code: location.province.code, name: location.province.name }
              : undefined,
            country: location?.country || "Vietnam",
          };

          console.log("🐾 ProfilePage - Address data for form:", addressData);

          // If user has existing address data, load the corresponding districts and wards first
          if (addressData.province) {
            console.log(
              "🐾 ProfilePage - Loading districts for province:",
              addressData.province.code
            );
            handleProvinceChange(addressData.province.code).then(() => {
              if (addressData.district) {
                console.log(
                  "🐾 ProfilePage - Loading wards for district:",
                  addressData.district.code
                );
                handleDistrictChange(addressData.district.code).then(() => {
                  // Reset the form after all data is loaded
                  console.log(
                    "🐾 ProfilePage - Resetting form with address data:",
                    addressData
                  );
                  addressForm.reset(addressData);
                });
              } else {
                // Reset the form after districts are loaded
                console.log(
                  "🐾 ProfilePage - Resetting form with address data:",
                  addressData
                );
                addressForm.reset(addressData);
              }
            });
          } else {
            // Reset the form immediately if no province data
            console.log(
              "🐾 ProfilePage - Resetting form with address data:",
              addressData
            );
            addressForm.reset(addressData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (isMounted) {
          toast.error("Failed to load profile data");
        }
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    };

    // Always fetch fresh profile data to ensure we have all fields
    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [
    user?.name,
    user?.email,
    refreshUserProfile,
    hasRefreshedProfile,
    profileForm,
    addressForm,
  ]);

  const handleProfileSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      const normalizedData = {
        ...data,
        phone: normalizePhoneNumber(data.phone),
      };

      const response = await userApi.updateProfile(normalizedData);
      if (response?.data) {
        updateUser(response.data);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      handleApiError(error, "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    try {
      setIsLoading(true);
      await userApi.changePassword(data);
      passwordForm.reset();
      toast.success("Password changed successfully");
    } catch (error) {
      handleApiError(error, "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSubmit = async (data: AddressFormData) => {
    try {
      setIsLoading(true);

      // Transform form data to match backend AddressSchema structure
      const addressPayload = {
        version: "v1",
        province: data.province
          ? {
              code: data.province.code,
              name: data.province.name,
              codename: "",
              division_type: "",
              phone_code: undefined,
            }
          : undefined,
        district: data.district
          ? {
              code: data.district.code,
              name: data.district.name,
              codename: "",
              division_type: "",
              province_code: data.province?.code,
            }
          : undefined,
        ward: data.ward
          ? {
              code: data.ward.code,
              name: data.ward.name,
              codename: "",
              division_type: "",
              district_code: data.district?.code,
            }
          : undefined,
        details: {
          street: data.street || "",
          note: "",
        },
        postalCode: "",
        country: data.country || "VN",
        formatted: "",
      };

      // Only send the payload if we have at least a province
      if (!addressPayload.province) {
        throw new Error("Province is required");
      }

      await userApi.updateAddress(addressPayload);
      toast.success("Address updated successfully");
    } catch (error) {
      handleApiError(error, "Failed to update address");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle province selection
  const handleProvinceChange = async (provinceCode: number) => {
    try {
      setLoadingDistricts(true);
      setDistricts([]);
      setWards([]);

      const provinceData = await vietnamProvincesApi.getDistrictsByProvince(
        provinceCode
      );
      // The API returns a province object with districts array
      const districtsData = (provinceData as any).districts || [];
      setDistricts(districtsData);

      // Reset district and ward selections
      addressForm.setValue("district", undefined);
      addressForm.setValue("ward", undefined);
    } catch (error) {
      console.error("Failed to load districts:", error);
      toast.error("Failed to load districts");
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Handle district selection
  const handleDistrictChange = async (districtCode: number) => {
    try {
      setLoadingWards(true);
      setWards([]);

      const districtData = await vietnamProvincesApi.getWardsByDistrict(
        districtCode
      );
      // The API returns a district object with wards array
      const wardsData = (districtData as any).wards || [];
      setWards(wardsData);

      // Reset ward selection
      addressForm.setValue("ward", undefined);
    } catch (error) {
      console.error("Failed to load wards:", error);
      toast.error("Failed to load wards");
    } finally {
      setLoadingWards(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const response = await userApi.uploadAvatar(file);
      if (response?.data?.data?.avatarUrl) {
        updateUser({ ...user, avatar: response.data.data.avatarUrl });
        toast.success("Avatar uploaded successfully");
      }
    } catch (error) {
      handleApiError(error, "Failed to upload avatar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarDelete = async () => {
    try {
      setIsLoading(true);
      await userApi.deleteAvatar();
      updateUser({ ...user, avatar: "" });
      toast.success("Avatar removed successfully");
    } catch (error) {
      handleApiError(error, "Failed to remove avatar");
    } finally {
      setIsLoading(false);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mx-auto mb-4">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <User className="h-12 w-12 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50">
                    <Camera className="h-4 w-4 text-gray-600" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      aria-label="Upload profile picture"
                      title="Upload profile picture"
                    />
                  </label>
                </div>
                {user?.avatar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAvatarDelete}
                    className="mt-2"
                  >
                    Remove Avatar
                  </Button>
                )}
              </div>

              {/* User Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Name</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {user?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {user?.email}
                  </p>
                  {user?.emailVerified ? (
                    <Badge className="bg-green-100 text-green-800 mt-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800 mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Unverified
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Member Since
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {user?.createdAt
                      ? formatDisplayDate(new Date(user.createdAt))
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Forms */}
        <div className="lg:col-span-2">
          <Tabs defaultTabId={activeTab} onTabChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <Input
                          {...profileForm.register("name")}
                          placeholder="Enter your full name"
                          leftIcon={<User className="h-4 w-4" />}
                        />
                        {profileForm.formState.errors.name && (
                          <p className="text-red-500 text-sm mt-1">
                            {profileForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <Input
                          {...profileForm.register("email")}
                          type="email"
                          placeholder="Enter your email"
                          leftIcon={<Mail className="h-4 w-4" />}
                        />
                        {profileForm.formState.errors.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {profileForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <Input
                          {...profileForm.register("phone")}
                          placeholder="Enter your phone number"
                          leftIcon={<Phone className="h-4 w-4" />}
                        />
                        {profileForm.formState.errors.phone && (
                          <p className="text-red-500 text-sm mt-1">
                            {profileForm.formState.errors.phone.message}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          {...profileForm.register("bio")}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Tell us about yourself..."
                        />
                        {profileForm.formState.errors.bio && (
                          <p className="text-red-500 text-sm mt-1">
                            {profileForm.formState.errors.bio.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Password Tab */}
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
                  >
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <Input
                            {...passwordForm.register("currentPassword")}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter current password"
                            leftIcon={<Lock className="h-4 w-4" />}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {passwordForm.formState.errors.currentPassword && (
                          <p className="text-red-500 text-sm mt-1">
                            {
                              passwordForm.formState.errors.currentPassword
                                .message
                            }
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <Input
                            {...passwordForm.register("newPassword")}
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            leftIcon={<Lock className="h-4 w-4" />}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {passwordForm.formState.errors.newPassword && (
                          <p className="text-red-500 text-sm mt-1">
                            {passwordForm.formState.errors.newPassword.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <Input
                          {...passwordForm.register("confirmPassword")}
                          type="password"
                          placeholder="Confirm new password"
                          leftIcon={<Lock className="h-4 w-4" />}
                        />
                        {passwordForm.formState.errors.confirmPassword && (
                          <p className="text-red-500 text-sm mt-1">
                            {
                              passwordForm.formState.errors.confirmPassword
                                .message
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isLoading ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Address Tab */}
            <TabsContent value="address">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Address Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    key={addressForm.watch("province")?.code || "empty"}
                    onSubmit={addressForm.handleSubmit(handleAddressSubmit)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address
                        </label>
                        <Input
                          {...addressForm.register("street")}
                          placeholder="Enter street address"
                          leftIcon={<MapPin className="h-4 w-4" />}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Province *
                        </label>
                        <select
                          value={addressForm.watch("province")?.code || ""}
                          onChange={(e) => {
                            const provinceCode = parseInt(e.target.value);
                            if (provinceCode) {
                              const selectedProvince = provinces.find(
                                (p) => p.code === provinceCode
                              );
                              if (selectedProvince) {
                                addressForm.setValue("province", {
                                  code: selectedProvince.code,
                                  name: selectedProvince.name,
                                });
                                handleProvinceChange(provinceCode);
                              }
                            } else {
                              addressForm.setValue("province", undefined);
                            }
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={loadingProvinces}
                          aria-label="Select province"
                        >
                          <option value="">
                            {loadingProvinces
                              ? "Loading provinces..."
                              : "Select province"}
                          </option>
                          {provinces.map((province) => (
                            <option key={province.code} value={province.code}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                        {addressForm.formState.errors.province && (
                          <p className="text-red-500 text-sm mt-1">
                            {addressForm.formState.errors.province.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          District
                        </label>
                        <select
                          value={addressForm.watch("district")?.code || ""}
                          onChange={(e) => {
                            const districtCode = parseInt(e.target.value);
                            if (districtCode) {
                              const selectedDistrict = districts.find(
                                (d) => d.code === districtCode
                              );
                              if (selectedDistrict) {
                                addressForm.setValue("district", {
                                  code: selectedDistrict.code,
                                  name: selectedDistrict.name,
                                });
                                handleDistrictChange(districtCode);
                              }
                            } else {
                              addressForm.setValue("district", undefined);
                            }
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={loadingDistricts || districts.length === 0}
                          aria-label="Select district"
                        >
                          <option value="">
                            {loadingDistricts
                              ? "Loading districts..."
                              : districts.length === 0
                              ? "Select province first"
                              : "Select district"}
                          </option>
                          {districts.map((district) => (
                            <option key={district.code} value={district.code}>
                              {district.name}
                            </option>
                          ))}
                        </select>
                        {addressForm.formState.errors.district && (
                          <p className="text-red-500 text-sm mt-1">
                            {addressForm.formState.errors.district.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ward
                        </label>
                        <select
                          value={addressForm.watch("ward")?.code || ""}
                          onChange={(e) => {
                            const wardCode = parseInt(e.target.value);
                            if (wardCode) {
                              const selectedWard = wards.find(
                                (w) => w.code === wardCode
                              );
                              if (selectedWard) {
                                addressForm.setValue("ward", {
                                  code: selectedWard.code,
                                  name: selectedWard.name,
                                });
                              }
                            } else {
                              addressForm.setValue("ward", undefined);
                            }
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={loadingWards || wards.length === 0}
                          aria-label="Select ward"
                        >
                          <option value="">
                            {loadingWards
                              ? "Loading wards..."
                              : wards.length === 0
                              ? "Select district first"
                              : "Select ward"}
                          </option>
                          {wards.map((ward) => (
                            <option key={ward.code} value={ward.code}>
                              {ward.name}
                            </option>
                          ))}
                        </select>
                        {addressForm.formState.errors.ward && (
                          <p className="text-red-500 text-sm mt-1">
                            {addressForm.formState.errors.ward.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <Input
                          {...addressForm.register("country")}
                          value="Việt Nam"
                          disabled
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isLoading ? "Saving..." : "Save Address"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
