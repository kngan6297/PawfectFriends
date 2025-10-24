import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  ArrowLeft,
  Upload,
  Users,
  Activity,
  Shield,
  Plus,
  Trash2,
  Edit,
  Eye,
  Clock,
  UserCheck,
  UserX,
  HelpCircle,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { Badge } from "@/components/ui/Badge";
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
import { api, endpoints } from "@/services/api";
import { shelterApi } from "@/services/api";
import { userApi } from "@/services/api";
import {
  vietnamProvincesApi,
  Province,
  District,
  Ward,
} from "@/services/vietnamProvincesApi";
import ActivityHistory from "@/components/shelter/ActivityHistory";
import SupportCenter from "@/components/shelter/SupportCenter";
import ImageUpload from "@/components/common/ImageUpload";

interface ShelterSettings {
  name: string;
  phone: string;
  email: string;
  website: string;
  bio: string;
  avatar?: string;
  location: {
    address: {
      street: string;
      ward: string;
      district: string;
    };
    city: string;
    state: string;
    zipCode: string;
    country: string;
    formatted?: string;
  };
  operatingHours: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  adoptionProcess: string;
  requirements: string;
  socialMedia: {
    facebook: string;
    twitter: string;
    instagram: string;
  };
  activityHistory?: ActivityLog[];
}

interface ActivityLog {
  _id: string;
  action: string;
  details: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
}

const ShelterSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ShelterSettings>({
    name: "",
    phone: "",
    email: "",
    website: "",
    bio: "",
    location: {
      address: {
        street: "",
        ward: "",
        district: "",
      },
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    operatingHours: {
      monday: { open: "", close: "" },
      tuesday: { open: "", close: "" },
      wednesday: { open: "", close: "" },
      thursday: { open: "", close: "" },
      friday: { open: "", close: "" },
      saturday: { open: "", close: "" },
      sunday: { open: "", close: "" },
    },
    adoptionProcess: "",
    requirements: "",
    socialMedia: {
      facebook: "",
      twitter: "",
      instagram: "",
    },
    activityHistory: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileViews, setProfileViews] = useState<number>(0);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [editingLocation, setEditingLocation] = useState(false);

  useEffect(() => {
    if (user) {
      loadShelterSettings();
      trackProfileView();
      loadProvinces();
    }
  }, [user]);

  // Initialize location selections after provinces are loaded
  useEffect(() => {
    if (provinces.length > 0 && settings.location) {
      initializeLocationSelections(settings.location);
    }
  }, [provinces, settings.location]);

  const loadShelterSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(endpoints.user.profile);
      const userData = response.data.data;

      if (userData) {
        setSettings({
          name: userData.name || "",
          phone: userData.phone || "",
          email: userData.email || "",
          website: userData.website || "",
          bio: userData.bio || "",
          avatar: userData.avatar || "",
          location: {
            address: {
              street:
                userData.location?.details?.street ||
                userData.location?.address?.street ||
                "",
              ward:
                userData.location?.ward?.name ||
                userData.location?.address?.ward ||
                "",
              district:
                userData.location?.district?.name ||
                userData.location?.address?.district ||
                "",
            },
            city:
              userData.location?.district?.name ||
              userData.location?.city ||
              "",
            state:
              userData.location?.province?.name ||
              userData.location?.state ||
              "",
            zipCode:
              userData.location?.postalCode || userData.location?.zipCode || "",
            country: userData.location?.country || "",
          },
          operatingHours: userData.operatingHours || {
            monday: { open: "", close: "" },
            tuesday: { open: "", close: "" },
            wednesday: { open: "", close: "" },
            thursday: { open: "", close: "" },
            friday: { open: "", close: "" },
            saturday: { open: "", close: "" },
            sunday: { open: "", close: "" },
          },
          adoptionProcess: userData.adoptionProcess || "",
          requirements: userData.requirements || "",
          socialMedia: userData.socialMedia || {
            facebook: "",
            twitter: "",
            instagram: "",
          },
          activityHistory: userData.activityHistory || [],
        });

        // Initialize province selections if location data exists
        // This will be handled after provinces are loaded
        initializeLocationSelections(userData.location);
      }
    } catch (error) {
      console.error("Error loading shelter settings:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load shelter settings";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const trackProfileView = async () => {
    if (user?._id) {
      try {
        const response = await shelterApi.incrementProfileViews(user._id);
        if (response.data?.profileViews) {
          setProfileViews(response.data.profileViews);
        }
      } catch (error) {
        console.error("Failed to track profile view:", error);
      }
    }
  };

  const loadProvinces = async () => {
    try {
      const provincesData = await vietnamProvincesApi.getProvinces();
      setProvinces(provincesData);
    } catch (error) {
      console.error("Failed to load provinces:", error);
      toast.error("Failed to load provinces data");
    }
  };

  const initializeLocationSelections = async (locationData: any) => {
    if (!locationData) return;

    const provinceName = locationData?.province?.name || locationData?.state;
    const districtName = locationData?.district?.name || locationData?.city;
    const wardName = locationData?.ward?.name || locationData?.address?.ward;

    if (provinceName && provinces.length > 0) {
      const province = provinces.find((p) => p.name === provinceName);
      if (province) {
        setSelectedProvince(province);
        // Load districts for this province
        try {
          const districtsData =
            await vietnamProvincesApi.getDistrictsByProvince(province.code);
          setDistricts(districtsData);
          if (districtName) {
            const district = districtsData.find((d) => d.name === districtName);
            if (district) {
              setSelectedDistrict(district);
              // Load wards for this district
              try {
                const wardsData = await vietnamProvincesApi.getWardsByDistrict(
                  district.code
                );
                setWards(wardsData);
                if (wardName) {
                  const ward = wardsData.find((w) => w.name === wardName);
                  if (ward) {
                    setSelectedWard(ward);
                  }
                }
              } catch (error) {
                console.error("Failed to load wards:", error);
              }
            }
          }
        } catch (error) {
          console.error("Failed to load districts:", error);
        }
      }
    }
  };

  const handleProvinceChange = async (provinceCode: string) => {
    const province = provinces.find((p) => p.code.toString() === provinceCode);
    if (province) {
      setSelectedProvince(province);
      setSelectedDistrict(null);
      setSelectedWard(null);
      setWards([]);

      // Update location state
      handleInputChange("location", province.name, "state");

      try {
        const districtsData = await vietnamProvincesApi.getDistrictsByProvince(
          province.code
        );
        setDistricts(districtsData);
      } catch (error) {
        console.error("Failed to load districts:", error);
        toast.error("Failed to load districts");
      }
    }
  };

  const handleDistrictChange = async (districtCode: string) => {
    const district = districts.find((d) => d.code.toString() === districtCode);
    if (district) {
      setSelectedDistrict(district);
      setSelectedWard(null);

      // Update location state
      handleInputChange("location", district.name, "city");

      try {
        const wardsData = await vietnamProvincesApi.getWardsByDistrict(
          district.code
        );
        setWards(wardsData);
      } catch (error) {
        console.error("Failed to load wards:", error);
        toast.error("Failed to load wards");
      }
    }
  };

  const handleWardChange = (wardCode: string) => {
    const ward = wards.find((w) => w.code.toString() === wardCode);
    if (ward) {
      setSelectedWard(ward);

      // Update location state
      handleInputChange("location", ward.name, "address", "ward");
    }
  };

  const handleInputChange = (
    field: string,
    value: string,
    subField?: string,
    subSubField?: string
  ) => {
    setSettings((prev) => {
      if (subField && subSubField) {
        const fieldValue = prev[field as keyof ShelterSettings] as any;
        return {
          ...prev,
          [field]: {
            ...fieldValue,
            [subField]: {
              ...fieldValue[subField],
              [subSubField]: value,
            },
          },
        };
      } else if (subField) {
        const fieldValue = prev[field as keyof ShelterSettings] as any;
        return {
          ...prev,
          [field]: {
            ...fieldValue,
            [subField]: value,
          },
        };
      } else {
        return {
          ...prev,
          [field]: value,
        };
      }
    });
  };

  const handleOperatingHoursChange = (
    day: string,
    type: "open" | "close",
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day as keyof typeof prev.operatingHours],
          [type]: value,
        },
      },
    }));
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const response = await userApi.uploadAvatar(file);
      setSettings((prev) => ({
        ...prev,
        avatar: response.data.avatarUrl,
      }));

      // Update user context if available
      if (updateUser) {
        updateUser(response.data.user);
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
    }
  };

  const handleAvatarDelete = async () => {
    try {
      await userApi.deleteAvatar();
      setSettings((prev) => ({
        ...prev,
        avatar: "",
      }));

      // Update user context if available
      if (updateUser) {
        const updatedUser = { ...user, avatar: "" };
        updateUser(updatedUser);
      }
    } catch (error) {
      console.error("Error deleting avatar:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await api.patch(endpoints.user.updateProfile, settings);

      if (response.data.success) {
        toast.success("Settings saved successfully!");
        if (updateUser) {
          updateUser(response.data.data);
        }
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save settings";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Profile Management Tab
  const ProfileManagementTab = () => (
    <div className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Profile Image</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-4">Shelter Avatar</h4>
            <ImageUpload
              currentImage={settings.avatar}
              onImageUpload={handleAvatarUpload}
              onImageDelete={handleAvatarDelete}
              type="avatar"
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Basic Information</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shelter Name
              </label>
              <Input
                value={settings.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter shelter name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <Input
                value={settings.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                value={settings.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
                type="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <Input
                value={settings.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="Enter website URL"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              value={settings.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="Tell us about your shelter..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Views */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Profile Analytics</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Eye className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Profile Views</p>
              <p className="text-2xl font-bold text-gray-900">{profileViews}</p>
              <p className="text-xs text-gray-500">
                Total times your profile has been viewed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Location Information</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingLocation(!editingLocation)}
            >
              {editingLocation ? "Cancel" : "Edit Location"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!editingLocation ? (
            // Display current location information
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Current Location:
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600 w-20">
                    Street:
                  </span>
                  <span className="text-sm text-gray-900">
                    {settings.location.address.street || "Not specified"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600 w-20">
                    Ward:
                  </span>
                  <span className="text-sm text-gray-900">
                    {selectedWard?.name ||
                      settings.location.address.ward ||
                      "Not specified"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600 w-20">
                    District:
                  </span>
                  <span className="text-sm text-gray-900">
                    {selectedDistrict?.name ||
                      settings.location.address.district ||
                      "Not specified"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600 w-20">
                    Province:
                  </span>
                  <span className="text-sm text-gray-900">
                    {selectedProvince?.name ||
                      settings.location.state ||
                      "Not specified"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600 w-20">
                    ZIP Code:
                  </span>
                  <span className="text-sm text-gray-900">
                    {settings.location.zipCode || "Not specified"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600 w-20">
                    Country:
                  </span>
                  <span className="text-sm text-gray-900">
                    {settings.location.country || "Vietnam"}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                <strong>Full Address:</strong>{" "}
                {settings.location.formatted ||
                  `${settings.location.address.street || ""}, ${
                    selectedWard?.name || settings.location.address.ward || ""
                  }, ${
                    selectedDistrict?.name ||
                    settings.location.address.district ||
                    ""
                  }, ${
                    selectedProvince?.name || settings.location.state || ""
                  }, ${settings.location.zipCode || ""}, ${
                    settings.location.country || "VN"
                  }`}
              </div>
            </div>
          ) : (
            // Edit location form
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <Input
                    value={settings.location.address.street}
                    onChange={(e) =>
                      handleInputChange(
                        "location",
                        e.target.value,
                        "address",
                        "street"
                      )
                    }
                    placeholder="Enter street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <Input
                    value={settings.location.zipCode}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value, "zipCode")
                    }
                    placeholder="Enter ZIP code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province/City
                  </label>
                  <Select
                    value={selectedProvince?.code.toString() || ""}
                    onValueChange={handleProvinceChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province/city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Provinces/Cities</SelectLabel>
                        {provinces.map((province) => (
                          <SelectItem
                            key={province.code}
                            value={province.code.toString()}
                          >
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <Select
                    value={selectedDistrict?.code.toString() || ""}
                    onValueChange={handleDistrictChange}
                    disabled={!selectedProvince}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Districts</SelectLabel>
                        {districts.map((district) => (
                          <SelectItem
                            key={district.code}
                            value={district.code.toString()}
                          >
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ward
                  </label>
                  <Select
                    value={selectedWard?.code.toString() || ""}
                    onValueChange={handleWardChange}
                    disabled={!selectedDistrict}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ward" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Wards</SelectLabel>
                        {wards.map((ward) => (
                          <SelectItem
                            key={ward.code}
                            value={ward.code.toString()}
                          >
                            {ward.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Operating Hours</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(settings.operatingHours).map(([day, hours]) => (
              <div key={day} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {day}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="time"
                    value={hours.open}
                    onChange={(e) =>
                      handleOperatingHoursChange(day, "open", e.target.value)
                    }
                    placeholder="Open"
                  />
                  <Input
                    type="time"
                    value={hours.close}
                    onChange={(e) =>
                      handleOperatingHoursChange(day, "close", e.target.value)
                    }
                    placeholder="Close"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Adoption Process & Requirements */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Adoption Information</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adoption Process
            </label>
            <Textarea
              value={settings.adoptionProcess}
              onChange={(e) =>
                handleInputChange("adoptionProcess", e.target.value)
              }
              placeholder="Describe your adoption process..."
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requirements
            </label>
            <Textarea
              value={settings.requirements}
              onChange={(e) =>
                handleInputChange("requirements", e.target.value)
              }
              placeholder="List adoption requirements..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Social Media</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facebook
              </label>
              <Input
                value={settings.socialMedia.facebook}
                onChange={(e) =>
                  handleInputChange("socialMedia", e.target.value, "facebook")
                }
                placeholder="Facebook URL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twitter
              </label>
              <Input
                value={settings.socialMedia.twitter}
                onChange={(e) =>
                  handleInputChange("socialMedia", e.target.value, "twitter")
                }
                placeholder="Twitter URL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram
              </label>
              <Input
                value={settings.socialMedia.instagram}
                onChange={(e) =>
                  handleInputChange("socialMedia", e.target.value, "instagram")
                }
                placeholder="Instagram URL"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const tabContent = [
    {
      id: "profile",
      label: "Profile",
      icon: Settings,
      content: <ProfileManagementTab />,
    },
    {
      id: "activity",
      label: "Activity History",
      icon: Activity,
      content: <ActivityHistory shelterId={user?._id || ""} />,
    },
    {
      id: "support",
      label: "Support & Help",
      icon: HelpCircle,
      content: <SupportCenter />,
    },
  ];

  if (!user || user.role !== "shelter") {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            This page is only accessible to registered shelters.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate("/register?role=shelter")}
          >
            Register as a Shelter
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-600">
            Error Loading Settings
          </h3>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <button
            onClick={loadShelterSettings}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            leftIcon={ArrowLeft}
            onClick={() => navigate("/shelter/dashboard")}
          >
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Shelter Settings
            </h1>
            <p className="text-gray-600">
              Manage your shelter profile and preferences
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <LoadingButton
            variant="primary"
            onClick={handleSave}
            isLoading={saving}
            disabled={saving}
          >
            Save Changes
          </LoadingButton>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">
              Profile Settings
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-3">
              {tabContent.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabContent.map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShelterSettings;
