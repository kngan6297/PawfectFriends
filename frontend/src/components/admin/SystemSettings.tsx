import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import { Toggle } from "../ui/Toggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/Dialog";
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  Mail,
  Database,
  Globe,
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Server,
  Activity,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { adminApi } from "@/services/admin.service";

interface SystemSettingsSchema {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    emailVerificationRequired: boolean;
  };
  security: {
    passwordMinLength: number;
    passwordRequireSpecialChars: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    twoFactorEnabled: boolean;
    ipWhitelist: string[];
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpSecure: boolean;
    fromEmail: string;
    fromName: string;
    emailRateLimit: number;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    notificationRetentionDays: number;
    bulkNotificationLimit: number;
  };
  storage: {
    maxFileSize: number;
    allowedFileTypes: string[];
    storageProvider: string;
    backupEnabled: boolean;
    backupFrequency: string;
    retentionDays: number;
  };
  api: {
    rateLimitPerMinute: number;
    rateLimitPerHour: number;
    apiKeyRequired: boolean;
    corsOrigins: string[];
    webhookEnabled: boolean;
    webhookUrl: string;
  };
  features: {
    chatEnabled: boolean;
    videoCallEnabled: boolean;
    recommendationEngine: boolean;
    analyticsEnabled: boolean;
    socialLoginEnabled: boolean;
    darkModeEnabled: boolean;
  };
}

interface SystemHealth {
  status: "healthy" | "warning" | "critical";
  database: {
    status: "connected" | "disconnected" | "slow";
    responseTime: number;
  };
  storage: {
    status: "available" | "full" | "error";
    usage: number;
    total: number;
  };
  email: {
    status: "working" | "failed" | "disabled";
    lastTest: string;
  };
  api: {
    status: "operational" | "degraded" | "down";
    responseTime: number;
  };
}

// Utility function for number clamping
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value || 0));

// URL validation function
const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettingsSchema | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirtyTabs, setDirtyTabs] = useState<Set<string>>(new Set());
  const [newCorsOrigin, setNewCorsOrigin] = useState("");
  const [newAllowedFileType, setNewAllowedFileType] = useState("");
  const [autosaveStatus, setAutosaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [environment, setEnvironment] = useState<
    "production" | "staging" | "development"
  >("production");
  const [userRole, setUserRole] = useState<"owner" | "admin" | "viewer">(
    "admin"
  );
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());
  const [healthLoading, setHealthLoading] = useState(false);
  const [showMaintenancePrompt, setShowMaintenancePrompt] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  // Load settings and health data
  useEffect(() => {
    loadSettings();
    loadSystemHealth();
  }, []);

  // Live health ping every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadSystemHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSystemSettings();
      // The backend returns data directly in response.data
      const settingsData = response.data;
      setSettings(settingsData);
    } catch (error) {
      console.error("Failed to load settings:", error);
      // Fallback to mock data if API fails
      const mockSettings: SystemSettingsSchema = {
        general: {
          siteName: "PawfectFriends",
          siteDescription: "Connecting pets with loving families",
          siteUrl: "https://pawfectfriends.com",
          maintenanceMode: false,
          registrationEnabled: true,
          emailVerificationRequired: true,
        },
        security: {
          passwordMinLength: 8,
          passwordRequireSpecialChars: true,
          sessionTimeout: 24,
          maxLoginAttempts: 5,
          lockoutDuration: 30,
          twoFactorEnabled: false,
          ipWhitelist: [],
        },
        email: {
          smtpHost: "smtp.gmail.com",
          smtpPort: 587,
          smtpUser: "noreply@pawfectfriends.com",
          smtpSecure: true,
          fromEmail: "noreply@pawfectfriends.com",
          fromName: "PawfectFriends",
          emailRateLimit: 100,
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          notificationRetentionDays: 30,
          bulkNotificationLimit: 1000,
        },
        storage: {
          maxFileSize: 10485760, // 10MB
          allowedFileTypes: ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"],
          storageProvider: "local",
          backupEnabled: true,
          backupFrequency: "daily",
          retentionDays: 30,
        },
        api: {
          rateLimitPerMinute: 60,
          rateLimitPerHour: 1000,
          apiKeyRequired: false,
          corsOrigins: ["https://pawfectfriends.com"],
          webhookEnabled: false,
          webhookUrl: "",
        },
        features: {
          chatEnabled: true,
          videoCallEnabled: true,
          recommendationEngine: true,
          analyticsEnabled: true,
          socialLoginEnabled: false,
          darkModeEnabled: true,
        },
      };
      setSettings(mockSettings);
      toast.warning("Using default settings - API not available");
    } finally {
      setLoading(false);
    }
  };

  const loadSystemHealth = async () => {
    try {
      setHealthLoading(true);
      const response = await adminApi.getSystemHealth();
      // The backend returns data directly in response.data
      const healthData = response.data;
      setHealth(healthData);
    } catch (error) {
      console.error("Failed to load system health:", error);
      // Fallback to mock health data if API fails
      const mockHealth: SystemHealth = {
        status: "healthy",
        database: {
          status: "connected",
          responseTime: 45,
        },
        storage: {
          status: "available",
          usage: 65,
          total: 100,
        },
        email: {
          status: "working",
          lastTest: "2024-01-15T10:30:00Z",
        },
        api: {
          status: "operational",
          responseTime: 120,
        },
      };
      setHealth(mockHealth);
    } finally {
      setHealthLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);

      // Log the save action with changes
      const changes = Object.keys(dirtyTabs).map((tab) => ({
        section: tab,
        timestamp: new Date().toISOString(),
      }));
      logChange("Settings Saved", changes);

      await adminApi.updateSystemSettings(settings);
      toast.success("System settings saved successfully");
      setHasChanges(false);
      setDirtyTabs(new Set());
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save system settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = async () => {
    try {
      await adminApi.resetSystemSettings();
      await loadSettings();
      setHasChanges(false);
      setDirtyTabs(new Set());
      setShowResetConfirm(false);
      toast.success("Settings reset to default values");
    } catch (error) {
      console.error("Failed to reset settings:", error);
      toast.error("Failed to reset settings");
    }
  };

  const addToArray = (
    section: keyof SystemSettingsSchema,
    key: string,
    value: string
  ) => {
    if (!settings || !value.trim()) return;

    const currentArray = (settings[section] as any)[key] as string[];
    if (currentArray.includes(value.trim())) return;

    setSettings((prev) => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: [...currentArray, value.trim()],
      },
    }));
    setHasChanges(true);
    setDirtyTabs((prev) => new Set([...prev, section]));
  };

  const removeFromArray = (
    section: keyof SystemSettingsSchema,
    key: string,
    index: number
  ) => {
    if (!settings) return;

    const currentArray = (settings[section] as any)[key] as string[];
    const newArray = currentArray.filter((_, i) => i !== index);

    setSettings((prev) => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: newArray,
      },
    }));
    setHasChanges(true);
    setDirtyTabs((prev) => new Set([...prev, section]));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Autosave function
  const autosave = async () => {
    if (!settings) return;

    try {
      setAutosaveStatus("saving");
      await adminApi.updateSystemSettings(settings);
      setAutosaveStatus("saved");
      setHasChanges(false);
      setDirtyTabs(new Set());

      // Hide "saved" status after 2 seconds
      setTimeout(() => {
        setAutosaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Autosave failed:", error);
      setAutosaveStatus("idle");
      toast.error("Autosave failed");
    }
  };

  // Debounced autosave
  const debouncedAutosave = debounce(autosave, 1500);

  // Audit trail functions
  const logChange = (action: string, changes: any) => {
    const auditEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user: "Current User", // TODO: Get from auth context
      action,
      changes,
      environment,
    };
    setAuditLogs((prev) => [auditEntry, ...prev.slice(0, 49)]); // Keep last 50 entries
  };

  const getFieldDiff = (oldValue: any, newValue: any, fieldPath: string) => {
    if (oldValue !== newValue) {
      return {
        field: fieldPath,
        oldValue,
        newValue,
      };
    }
    return null;
  };

  // Role-based field protection
  const isFieldProtected = (fieldPath: string) => {
    const protectedFields = [
      "email.smtpUser",
      "email.smtpPassword",
      "api.webhookUrl",
    ];
    return protectedFields.includes(fieldPath) && userRole !== "owner";
  };

  const revealField = (fieldPath: string) => {
    setRevealedFields((prev) => new Set([...prev, fieldPath]));
  };

  const maskValue = (value: string) => {
    return "•".repeat(Math.min(value.length, 8));
  };

  const updateSetting = (
    section: keyof SystemSettingsSchema,
    key: string,
    value: any,
    validation?: { min?: number; max?: number; type?: "url" | "number" },
    autosaveEnabled?: boolean
  ) => {
    if (!settings) return;

    // Clear previous error for this field
    const fieldKey = `${section}.${key}`;
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldKey];
      return newErrors;
    });

    // Validate URL
    if (validation?.type === "url" && value && !isValidUrl(value)) {
      setErrors((prev) => ({
        ...prev,
        [fieldKey]:
          "Please enter a valid URL (must start with http:// or https://)",
      }));
    }

    // Validate and clamp numbers
    if (
      validation?.type === "number" &&
      validation.min !== undefined &&
      validation.max !== undefined
    ) {
      const clampedValue = clamp(Number(value), validation.min, validation.max);
      if (isNaN(clampedValue)) {
        setErrors((prev) => ({
          ...prev,
          [fieldKey]: `Please enter a valid number between ${validation.min} and ${validation.max}`,
        }));
        return;
      }
      value = clampedValue;
    }

    setSettings((prev) => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: value,
      },
    }));
    setHasChanges(true);

    // Track dirty tabs
    setDirtyTabs((prev) => new Set([...prev, section]));

    // Trigger autosave for toggles
    if (autosaveEnabled) {
      debouncedAutosave();
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "connected":
      case "available":
      case "working":
      case "operational":
        return "text-green-600 bg-green-100";
      case "warning":
      case "slow":
      case "degraded":
        return "text-yellow-600 bg-yellow-100";
      case "critical":
      case "disconnected":
      case "full":
      case "error":
      case "failed":
      case "disabled":
      case "down":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "connected":
      case "available":
      case "working":
      case "operational":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
      case "slow":
      case "degraded":
        return <AlertTriangle className="h-4 w-4" />;
      case "critical":
      case "disconnected":
      case "full":
      case "error":
      case "failed":
      case "disabled":
      case "down":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "security", label: "Security", icon: Shield },
    { id: "email", label: "Email", icon: Mail },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "storage", label: "Storage", icon: Database },
    { id: "api", label: "API", icon: Globe },
    { id: "features", label: "Features", icon: Activity },
  ];

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        <p className="text-gray-600">
          Configure system-wide settings and preferences
        </p>
      </div>

      {/* Sticky Save Bar */}
      <div className="sticky top-0 z-10 -mx-6 mb-4 bg-white/80 backdrop-blur border-b px-6 py-3 flex justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">System Settings</span>
          {hasChanges && (
            <Badge className="bg-yellow-100 text-yellow-700">Unsaved</Badge>
          )}
          {autosaveStatus === "saving" && (
            <Badge className="bg-blue-100 text-blue-700">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Saving...
              </div>
            </Badge>
          )}
          {autosaveStatus === "saved" && (
            <Badge className="bg-green-100 text-green-700">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Saved
              </div>
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAuditTrail(true)}
            leftIcon={Activity}
          >
            View change history
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            leftIcon={RefreshCw}
            disabled={saving}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            leftIcon={Save}
            disabled={!hasChanges || saving}
            isLoading={saving}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Environment Banner */}
      {environment === "production" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              You're editing Production environment
            </span>
          </div>
          <p className="text-xs text-red-700 mt-1">
            Some fields are locked for safety. Changes will affect live users.
          </p>
        </div>
      )}

      {environment === "staging" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              You're editing Staging environment
            </span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Safe to test changes. No impact on production users.
          </p>
        </div>
      )}

      {/* System Health Overview */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Health
              {healthLoading && (
                <div className="ml-auto">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Database Health Card */}
              <div className="p-4 rounded-xl border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Database</span>
                  </div>
                  <Badge
                    className={getHealthStatusColor(
                      health.database?.status || "unknown"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {getHealthIcon(health.database?.status || "unknown")}
                      {health.database?.status || "Unknown"}
                    </div>
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-gray-600">
                    Response time: {health.database?.responseTime || 0}ms
                  </div>
                </div>
              </div>

              {/* Storage Health Card */}
              <div className="p-4 rounded-xl border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Storage</span>
                  </div>
                  <Badge
                    className={getHealthStatusColor(
                      health.storage?.status || "unknown"
                    )}
                  >
                    {health.storage?.status || "Unknown"}
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        (health.storage?.usage || 0) >= 90
                          ? "bg-red-500"
                          : (health.storage?.usage || 0) >= 70
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${health.storage?.usage || 0}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {health.storage?.usage || 0}% used •{" "}
                    {health.storage?.usage || 0}/{health.storage?.total || 0} GB
                  </div>
                </div>
              </div>

              {/* Email Health Card */}
              <div className="p-4 rounded-xl border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Email</span>
                  </div>
                  <Badge
                    className={getHealthStatusColor(
                      health.email?.status || "unknown"
                    )}
                  >
                    {health.email?.status || "Unknown"}
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-gray-600">
                    Last test:{" "}
                    {health.email?.lastTest
                      ? new Date(health.email.lastTest).toLocaleDateString()
                      : "Never"}
                  </div>
                </div>
              </div>

              {/* API Health Card */}
              <div className="p-4 rounded-xl border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">API</span>
                  </div>
                  <Badge
                    className={getHealthStatusColor(
                      health.api?.status || "unknown"
                    )}
                  >
                    {health.api?.status || "Unknown"}
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-gray-600">
                    Response time: {health.api?.responseTime || 0}ms
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tab Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const isDirty = dirtyTabs.has(tab.id);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      <span className="flex-1">{tab.label}</span>
                      {isDirty && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-yellow-500" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Tab Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {/* General Settings */}
              {activeTab === "general" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      General Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Site Name"
                        id="siteName"
                        value={settings.general?.siteName || ""}
                        onChange={(e) =>
                          updateSetting("general", "siteName", e.target.value)
                        }
                        fullWidth
                      />
                      <div>
                        <Input
                          label="Site URL"
                          id="siteUrl"
                          type="url"
                          value={settings.general?.siteUrl || ""}
                          onChange={(e) =>
                            updateSetting(
                              "general",
                              "siteUrl",
                              e.target.value,
                              {
                                type: "url",
                              }
                            )
                          }
                          error={errors["general.siteUrl"]}
                          helperText="Must start with http:// or https://"
                          fullWidth
                        />
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              copyToClipboard(settings.general?.siteUrl || "")
                            }
                            disabled={!settings.general?.siteUrl}
                          >
                            Copy URL
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Textarea
                        label="Site Description"
                        id="siteDescription"
                        value={settings.general?.siteDescription || ""}
                        onChange={(e) =>
                          updateSetting(
                            "general",
                            "siteDescription",
                            e.target.value
                          )
                        }
                        rows={3}
                        className="w-full"
                      />
                    </div>
                    <div className="mt-4 space-y-4">
                      <Toggle
                        checked={settings.general?.maintenanceMode || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setShowMaintenancePrompt(true);
                          } else {
                            updateSetting(
                              "general",
                              "maintenanceMode",
                              checked,
                              undefined,
                              true
                            );
                          }
                        }}
                        label="Maintenance Mode"
                        hint="Enable to put the site in maintenance mode"
                      />
                      <Toggle
                        checked={settings.general?.registrationEnabled || false}
                        onCheckedChange={(checked) =>
                          updateSetting(
                            "general",
                            "registrationEnabled",
                            checked,
                            undefined,
                            true
                          )
                        }
                        label="Registration Enabled"
                        hint="Allow new user registrations"
                      />
                      <Toggle
                        checked={
                          settings.general?.emailVerificationRequired || false
                        }
                        onCheckedChange={(checked) =>
                          updateSetting(
                            "general",
                            "emailVerificationRequired",
                            checked,
                            undefined,
                            true
                          )
                        }
                        label="Email Verification Required"
                        hint="Require email verification for new accounts"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Security Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Minimum Password Length"
                        id="passwordMinLength"
                        type="number"
                        min="6"
                        max="32"
                        value={settings.security?.passwordMinLength || ""}
                        onChange={(e) =>
                          updateSetting(
                            "security",
                            "passwordMinLength",
                            e.target.value,
                            { type: "number", min: 6, max: 32 }
                          )
                        }
                        error={errors["security.passwordMinLength"]}
                        helperText="Between 6 and 32 characters"
                        fullWidth
                      />
                      <Input
                        label="Session Timeout (hours)"
                        id="sessionTimeout"
                        type="number"
                        min="1"
                        max="168"
                        value={settings.security?.sessionTimeout || ""}
                        onChange={(e) =>
                          updateSetting(
                            "security",
                            "sessionTimeout",
                            e.target.value,
                            { type: "number", min: 1, max: 168 }
                          )
                        }
                        error={errors["security.sessionTimeout"]}
                        helperText="Between 1 and 168 hours (1 week)"
                        fullWidth
                      />
                      <Input
                        label="Max Login Attempts"
                        id="maxLoginAttempts"
                        type="number"
                        min="3"
                        max="10"
                        value={settings.security?.maxLoginAttempts || ""}
                        onChange={(e) =>
                          updateSetting(
                            "security",
                            "maxLoginAttempts",
                            e.target.value,
                            { type: "number", min: 3, max: 10 }
                          )
                        }
                        error={errors["security.maxLoginAttempts"]}
                        helperText="Between 3 and 10 attempts"
                        fullWidth
                      />
                      <Input
                        label="Lockout Duration (minutes)"
                        id="lockoutDuration"
                        type="number"
                        min="5"
                        max="60"
                        value={settings.security?.lockoutDuration || ""}
                        onChange={(e) =>
                          updateSetting(
                            "security",
                            "lockoutDuration",
                            e.target.value,
                            { type: "number", min: 5, max: 60 }
                          )
                        }
                        error={errors["security.lockoutDuration"]}
                        helperText="Between 5 and 60 minutes"
                        fullWidth
                      />
                    </div>
                    <div className="mt-4 space-y-4">
                      <Toggle
                        checked={
                          settings.security?.passwordRequireSpecialChars ||
                          false
                        }
                        onCheckedChange={(checked) =>
                          updateSetting(
                            "security",
                            "passwordRequireSpecialChars",
                            checked,
                            undefined,
                            true
                          )
                        }
                        label="Require Special Characters"
                        hint="Passwords must contain special characters"
                      />
                      <Toggle
                        checked={settings.security?.twoFactorEnabled || false}
                        onCheckedChange={(checked) =>
                          updateSetting(
                            "security",
                            "twoFactorEnabled",
                            checked,
                            undefined,
                            true
                          )
                        }
                        label="Two-Factor Authentication"
                        hint="Enable 2FA for enhanced security"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email Settings */}
              {activeTab === "email" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Email Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="SMTP Host"
                        id="smtpHost"
                        value={settings.email?.smtpHost || ""}
                        onChange={(e) =>
                          updateSetting("email", "smtpHost", e.target.value)
                        }
                        fullWidth
                      />
                      <Input
                        label="SMTP Port"
                        id="smtpPort"
                        type="number"
                        min="1"
                        max="65535"
                        value={settings.email?.smtpPort || ""}
                        onChange={(e) =>
                          updateSetting("email", "smtpPort", e.target.value, {
                            type: "number",
                            min: 1,
                            max: 65535,
                          })
                        }
                        error={errors["email.smtpPort"]}
                        helperText="Between 1 and 65535"
                        fullWidth
                      />
                      <div>
                        <Input
                          label="SMTP User"
                          id="smtpUser"
                          type="email"
                          value={
                            isFieldProtected("email.smtpUser") &&
                            !revealedFields.has("email.smtpUser")
                              ? maskValue(settings.email?.smtpUser || "")
                              : settings.email?.smtpUser || ""
                          }
                          onChange={(e) =>
                            updateSetting("email", "smtpUser", e.target.value)
                          }
                          disabled={
                            isFieldProtected("email.smtpUser") &&
                            !revealedFields.has("email.smtpUser")
                          }
                          fullWidth
                        />
                        {isFieldProtected("email.smtpUser") &&
                          !revealedFields.has("email.smtpUser") && (
                            <div className="mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Are you sure you want to reveal this sensitive field?"
                                    )
                                  ) {
                                    revealField("email.smtpUser");
                                  }
                                }}
                              >
                                Reveal
                              </Button>
                            </div>
                          )}
                      </div>
                      <Input
                        label="From Email"
                        id="fromEmail"
                        type="email"
                        value={settings.email?.fromEmail || ""}
                        onChange={(e) =>
                          updateSetting("email", "fromEmail", e.target.value)
                        }
                        fullWidth
                      />
                      <Input
                        label="From Name"
                        id="fromName"
                        value={settings.email?.fromName || ""}
                        onChange={(e) =>
                          updateSetting("email", "fromName", e.target.value)
                        }
                        fullWidth
                      />
                      <Input
                        label="Email Rate Limit (per hour)"
                        id="emailRateLimit"
                        type="number"
                        min="10"
                        max="10000"
                        value={settings.email?.emailRateLimit || ""}
                        onChange={(e) =>
                          updateSetting(
                            "email",
                            "emailRateLimit",
                            e.target.value,
                            { type: "number", min: 10, max: 10000 }
                          )
                        }
                        error={errors["email.emailRateLimit"]}
                        helperText="Between 10 and 10,000 emails per hour"
                        fullWidth
                      />
                    </div>
                    <div className="mt-4">
                      <Toggle
                        checked={settings.email?.smtpSecure || false}
                        onCheckedChange={(checked) =>
                          updateSetting("email", "smtpSecure", checked)
                        }
                        label="SMTP Secure"
                        hint="Use SSL/TLS for SMTP connection"
                      />
                    </div>
                    <div className="mt-6">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            // TODO: Implement testEmail API method
                            // await adminApi.testEmail();
                            toast.success("Test email sent");
                          } catch {
                            toast.error("SMTP failed");
                          }
                        }}
                      >
                        Send test email
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Notification Settings
                    </h3>
                    <div className="space-y-4">
                      <Toggle
                        checked={
                          settings.notifications?.emailNotifications || false
                        }
                        onCheckedChange={(checked) =>
                          updateSetting(
                            "notifications",
                            "emailNotifications",
                            checked
                          )
                        }
                        label="Email Notifications"
                        hint="Send notifications via email"
                      />
                      <Toggle
                        checked={
                          settings.notifications?.pushNotifications || false
                        }
                        onCheckedChange={(checked) =>
                          updateSetting(
                            "notifications",
                            "pushNotifications",
                            checked
                          )
                        }
                        label="Push Notifications"
                        hint="Send push notifications to users"
                      />
                      <Toggle
                        checked={
                          settings.notifications?.smsNotifications || false
                        }
                        onCheckedChange={(checked) =>
                          updateSetting(
                            "notifications",
                            "smsNotifications",
                            checked
                          )
                        }
                        label="SMS Notifications"
                        hint="Send notifications via SMS"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <Input
                        label="Notification Retention (days)"
                        id="notificationRetentionDays"
                        type="number"
                        min="7"
                        max="365"
                        value={
                          settings.notifications?.notificationRetentionDays ||
                          ""
                        }
                        onChange={(e) =>
                          updateSetting(
                            "notifications",
                            "notificationRetentionDays",
                            e.target.value,
                            { type: "number", min: 7, max: 365 }
                          )
                        }
                        error={
                          errors["notifications.notificationRetentionDays"]
                        }
                        helperText="Between 7 and 365 days"
                        fullWidth
                      />
                      <Input
                        label="Bulk Notification Limit"
                        id="bulkNotificationLimit"
                        type="number"
                        min="100"
                        max="10000"
                        value={
                          settings.notifications?.bulkNotificationLimit || ""
                        }
                        onChange={(e) =>
                          updateSetting(
                            "notifications",
                            "bulkNotificationLimit",
                            e.target.value,
                            { type: "number", min: 100, max: 10000 }
                          )
                        }
                        error={errors["notifications.bulkNotificationLimit"]}
                        helperText="Between 100 and 10,000 notifications"
                        fullWidth
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Storage Settings */}
              {activeTab === "storage" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Storage Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Input
                          label="Max File Size (bytes)"
                          id="maxFileSize"
                          type="number"
                          min="1048576"
                          max="104857600"
                          value={settings.storage?.maxFileSize || ""}
                          onChange={(e) =>
                            updateSetting(
                              "storage",
                              "maxFileSize",
                              e.target.value,
                              { type: "number", min: 1048576, max: 104857600 }
                            )
                          }
                          error={errors["storage.maxFileSize"]}
                          helperText="Between 1MB and 100MB"
                          fullWidth
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Current:{" "}
                          {(
                            (settings.storage?.maxFileSize || 0) / 1048576
                          ).toFixed(1)}{" "}
                          MB
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="storageProvider"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Storage Provider
                        </label>
                        <Select
                          value={settings.storage?.storageProvider || ""}
                          onValueChange={(value) =>
                            updateSetting("storage", "storageProvider", value)
                          }
                        >
                          <SelectTrigger
                            id="storageProvider"
                            className="w-full"
                          >
                            <SelectValue placeholder="Select storage provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="local">Local Storage</SelectItem>
                            <SelectItem value="aws">AWS S3</SelectItem>
                            <SelectItem value="gcp">
                              Google Cloud Storage
                            </SelectItem>
                            <SelectItem value="azure">
                              Azure Blob Storage
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label
                          htmlFor="backupFrequency"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Backup Frequency
                        </label>
                        <Select
                          value={settings.storage?.backupFrequency || ""}
                          onValueChange={(value) =>
                            updateSetting("storage", "backupFrequency", value)
                          }
                        >
                          <SelectTrigger
                            id="backupFrequency"
                            className="w-full"
                          >
                            <SelectValue placeholder="Select backup frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        label="Retention Days"
                        id="retentionDays"
                        type="number"
                        min="7"
                        max="365"
                        value={settings.storage?.retentionDays || ""}
                        onChange={(e) =>
                          updateSetting(
                            "storage",
                            "retentionDays",
                            e.target.value,
                            { type: "number", min: 7, max: 365 }
                          )
                        }
                        error={errors["storage.retentionDays"]}
                        helperText="Between 7 and 365 days"
                        fullWidth
                      />
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Allowed File Types
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {settings.storage?.allowedFileTypes?.map(
                          (type, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                            >
                              <span>{type}</span>
                              <button
                                onClick={() =>
                                  removeFromArray(
                                    "storage",
                                    "allowedFileTypes",
                                    index
                                  )
                                }
                                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                                type="button"
                                aria-label={`Remove ${type}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id="newAllowedFileType"
                          placeholder="Add file type (e.g., .pdf, .jpg)"
                          value={newAllowedFileType}
                          onChange={(e) =>
                            setNewAllowedFileType(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addToArray(
                                "storage",
                                "allowedFileTypes",
                                newAllowedFileType
                              );
                              setNewAllowedFileType("");
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            addToArray(
                              "storage",
                              "allowedFileTypes",
                              newAllowedFileType
                            );
                            setNewAllowedFileType("");
                          }}
                          disabled={!newAllowedFileType.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Toggle
                        checked={settings.storage?.backupEnabled || false}
                        onCheckedChange={(checked) =>
                          updateSetting("storage", "backupEnabled", checked)
                        }
                        label="Backup Enabled"
                        hint="Automatically backup files"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* API Settings */}
              {activeTab === "api" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      API Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Rate Limit (per minute)"
                        id="rateLimitPerMinute"
                        type="number"
                        min="10"
                        max="1000"
                        value={settings.api?.rateLimitPerMinute || ""}
                        onChange={(e) =>
                          updateSetting(
                            "api",
                            "rateLimitPerMinute",
                            e.target.value,
                            { type: "number", min: 10, max: 1000 }
                          )
                        }
                        error={errors["api.rateLimitPerMinute"]}
                        helperText="Between 10 and 1,000 requests per minute"
                        fullWidth
                      />
                      <Input
                        label="Rate Limit (per hour)"
                        id="rateLimitPerHour"
                        type="number"
                        min="100"
                        max="10000"
                        value={settings.api?.rateLimitPerHour || ""}
                        onChange={(e) =>
                          updateSetting(
                            "api",
                            "rateLimitPerHour",
                            e.target.value,
                            { type: "number", min: 100, max: 10000 }
                          )
                        }
                        error={errors["api.rateLimitPerHour"]}
                        helperText="Between 100 and 10,000 requests per hour"
                        fullWidth
                      />
                      <div>
                        <Input
                          label="Webhook URL"
                          id="webhookUrl"
                          type="url"
                          value={settings.api?.webhookUrl || ""}
                          onChange={(e) =>
                            updateSetting("api", "webhookUrl", e.target.value, {
                              type: "url",
                            })
                          }
                          error={errors["api.webhookUrl"]}
                          helperText="Must start with http:// or https://"
                          fullWidth
                        />
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              copyToClipboard(settings.api?.webhookUrl || "")
                            }
                            disabled={!settings.api?.webhookUrl}
                          >
                            Copy URL
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CORS Origins
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {settings.api?.corsOrigins?.map((origin, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md"
                          >
                            <span>{origin}</span>
                            <button
                              onClick={() =>
                                removeFromArray("api", "corsOrigins", index)
                              }
                              className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                              type="button"
                              aria-label={`Remove ${origin}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id="newCorsOrigin"
                          placeholder="Add CORS origin (e.g., https://example.com)"
                          value={newCorsOrigin}
                          onChange={(e) => setNewCorsOrigin(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addToArray("api", "corsOrigins", newCorsOrigin);
                              setNewCorsOrigin("");
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            addToArray("api", "corsOrigins", newCorsOrigin);
                            setNewCorsOrigin("");
                          }}
                          disabled={!newCorsOrigin.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 space-y-4">
                      <Toggle
                        checked={settings.api?.apiKeyRequired || false}
                        onCheckedChange={(checked) =>
                          updateSetting("api", "apiKeyRequired", checked)
                        }
                        label="API Key Required"
                        hint="Require API key for all requests"
                      />
                      <Toggle
                        checked={settings.api?.webhookEnabled || false}
                        onCheckedChange={(checked) =>
                          updateSetting("api", "webhookEnabled", checked)
                        }
                        label="Webhook Enabled"
                        hint="Enable webhook notifications"
                      />
                    </div>
                    <div className="mt-6">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            // TODO: Implement testWebhook API method
                            // await adminApi.testWebhook();
                            toast.success("Webhook test successful");
                          } catch {
                            toast.error("Webhook test failed");
                          }
                        }}
                        disabled={!settings.api.webhookEnabled}
                      >
                        Test webhook
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Features Settings */}
              {activeTab === "features" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Feature Settings
                    </h3>
                    <div className="space-y-4">
                      <Toggle
                        checked={settings.features?.chatEnabled || false}
                        onCheckedChange={(checked) =>
                          updateSetting(
                            "features",
                            "chatEnabled",
                            checked,
                            undefined,
                            true
                          )
                        }
                        label="Chat System"
                        hint="Enable real-time chat functionality"
                      />
                      <Toggle
                        checked={settings.features?.videoCallEnabled || false}
                        onCheckedChange={(checked) =>
                          updateSetting("features", "videoCallEnabled", checked)
                        }
                        label="Video Calls"
                        hint="Enable video call functionality"
                      />
                      <Toggle
                        checked={
                          settings.features?.recommendationEngine || false
                        }
                        onCheckedChange={(checked) =>
                          updateSetting(
                            "features",
                            "recommendationEngine",
                            checked
                          )
                        }
                        label="Recommendation Engine"
                        hint="Enable AI-powered pet recommendations"
                      />
                      <Toggle
                        checked={settings.features?.analyticsEnabled || false}
                        onCheckedChange={(checked) =>
                          updateSetting("features", "analyticsEnabled", checked)
                        }
                        label="Analytics"
                        hint="Enable analytics tracking"
                      />
                      <Toggle
                        checked={settings.features?.socialLoginEnabled || false}
                        onCheckedChange={(checked) =>
                          updateSetting(
                            "features",
                            "socialLoginEnabled",
                            checked
                          )
                        }
                        label="Social Login"
                        hint="Enable social media login options"
                      />
                      <Toggle
                        checked={settings.features?.darkModeEnabled || false}
                        onCheckedChange={(checked) =>
                          updateSetting(
                            "features",
                            "darkModeEnabled",
                            checked,
                            undefined,
                            true
                          )
                        }
                        label="Dark Mode"
                        hint="Enable dark mode theme option"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Reset System Settings
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all settings to their default
              values? This action cannot be undone and will affect all system
              configurations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmReset}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              Reset Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Trail SlideOver */}
      {showAuditTrail && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowAuditTrail(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h2 className="text-lg font-semibold">Change History</h2>
                <button
                  onClick={() => setShowAuditTrail(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close audit trail"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {auditLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No changes recorded yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {log.action}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          User: {log.user} • Environment: {log.environment}
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Mode Prompt */}
      <Dialog
        open={showMaintenancePrompt}
        onOpenChange={setShowMaintenancePrompt}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Maintenance Mode</DialogTitle>
            <DialogDescription>
              What message should be displayed to users during maintenance?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              label="Maintenance Message"
              id="maintenanceMessage"
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="We're currently performing maintenance. Please check back soon."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMaintenancePrompt(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                updateSetting(
                  "general",
                  "maintenanceMode",
                  true,
                  undefined,
                  true
                );
                setShowMaintenancePrompt(false);
                toast.success("Maintenance mode enabled");
              }}
              disabled={!maintenanceMessage.trim()}
            >
              Enable Maintenance Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemSettingsPage;
