import React, { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "../../../components/ui/Select";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { adoptionApi } from "@/services/api";
import {
  Plus,
  Calendar,
  AlertTriangle,
  FileText,
  User,
  Home,
  PawPrint,
  DollarSign,
  Stethoscope,
  Users,
  FolderOpen,
  Clock,
  Star,
  X,
} from "lucide-react";
import { BadgeProps } from "react-bootstrap";

interface RequiredField {
  fieldName: string;
  fieldType:
    | "text"
    | "textarea"
    | "number"
    | "email"
    | "phone"
    | "date"
    | "file"
    | "select";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

interface InformationRequestForm {
  title: string;
  description: string;
  category: string;
  dueDate: string;
  isUrgent: boolean;
  priority: "low" | "medium" | "high" | "critical";
  requiredFields: RequiredField[];
}

interface RequestAdditionalInformationProps {
  requestId: string;
  onRequestCreated?: () => void;
}

const CATEGORIES = [
  { value: "personal_information", label: "Personal Information", icon: User },
  { value: "housing_details", label: "Housing Details", icon: Home },
  { value: "pet_experience", label: "Pet Experience", icon: PawPrint },
  {
    value: "financial_information",
    label: "Financial Information",
    icon: DollarSign,
  },
  {
    value: "veterinarian_reference",
    label: "Veterinarian Reference",
    icon: Stethoscope,
  },
  { value: "personal_references", label: "Personal References", icon: Users },
  { value: "documents", label: "Documents", icon: FolderOpen },
  { value: "other", label: "Other", icon: FileText },
];

const FIELD_TYPES = [
  { value: "text", label: "Text Input" },
  { value: "textarea", label: "Text Area" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "date", label: "Date" },
  { value: "file", label: "File Upload" },
  { value: "select", label: "Dropdown" },
];

const RequestAdditionalInformation: React.FC<
  RequestAdditionalInformationProps
> = ({ requestId, onRequestCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<InformationRequestForm>({
    title: "",
    description: "",
    category: "",
    dueDate: "",
    isUrgent: false,
    priority: "medium",
    requiredFields: [],
  });

  const handleInputChange = (
    field: keyof InformationRequestForm,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addRequiredField = () => {
    const newField: RequiredField = {
      fieldName: `field_${Date.now()}`,
      fieldType: "text",
      label: "",
      placeholder: "",
      required: false,
    };

    setFormData((prev) => ({
      ...prev,
      requiredFields: [...prev.requiredFields, newField],
    }));
  };

  const updateRequiredField = (
    index: number,
    field: keyof RequiredField,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      requiredFields: prev.requiredFields.map((f, i) =>
        i === index ? { ...f, [field]: value } : f
      ),
    }));
  };

  const removeRequiredField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requiredFields: prev.requiredFields.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.dueDate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.requiredFields.length === 0) {
      toast.error("Please add at least one required field");
      return;
    }

    // Validate required fields
    for (const field of formData.requiredFields) {
      if (!field.label) {
        toast.error("All required fields must have a label");
        return;
      }
    }

    try {
      setLoading(true);
      await adoptionApi.createInformationRequest(requestId, formData);
      toast.success("Information request created successfully");
      setIsOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "",
        dueDate: "",
        isUrgent: false,
        priority: "medium",
        requiredFields: [],
      });
      onRequestCreated?.();
    } catch (error) {
      console.error("Error creating information request:", error);
      toast.error("Failed to create information request");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = CATEGORIES.find((c) => c.value === category);
    return categoryData ? (
      React.createElement(categoryData.icon, { className: "h-4 w-4" })
    ) : (
      <FileText className="h-4 w-4" />
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "danger";
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        leftIcon={Plus}
        variant="outline"
        className="w-full sm:w-auto"
      >
        Request Additional Information
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Request Additional Information
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Basic Information</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Request Title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Additional Housing Information"
                    required
                  />

                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Explain what additional information you need and why it's important..."
                  rows={3}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Due Date"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) =>
                      handleInputChange("dueDate", e.target.value)
                    }
                    required
                  />

                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      handleInputChange("priority", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="isUrgent"
                      checked={formData.isUrgent}
                      onChange={(e) =>
                        handleInputChange("isUrgent", e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="isUrgent" className="text-sm font-medium">
                      Mark as Urgent
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Required Fields */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Required Fields</h3>
                  <Button
                    onClick={addRequiredField}
                    leftIcon={Plus}
                    variant="outline"
                    size="sm"
                  >
                    Add Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {formData.requiredFields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No required fields added yet</p>
                    <p className="text-sm">
                      Click "Add Field" to start building your form
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.requiredFields.map((field, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Field {index + 1}</h4>
                          <Button
                            onClick={() => removeRequiredField(index)}
                            leftIcon={X}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Field Label"
                            value={field.label}
                            onChange={(e) =>
                              updateRequiredField(
                                index,
                                "label",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Monthly Income"
                            required
                          />

                          <Select
                            value={field.fieldType}
                            onValueChange={(value) =>
                              updateRequiredField(index, "fieldType", value)
                            }
                            required
                          >
                            {FIELD_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <Input
                            value={field.placeholder}
                            onChange={(e) =>
                              updateRequiredField(
                                index,
                                "placeholder",
                                e.target.value
                              )
                            }
                            placeholder="Optional placeholder text"
                          />

                          <div className="flex items-center space-x-2 pt-6">
                            <input
                              type="checkbox"
                              id={`required-${index}`}
                              checked={field.required}
                              onChange={(e) =>
                                updateRequiredField(
                                  index,
                                  "required",
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-300"
                            />
                            <label
                              htmlFor={`required-${index}`}
                              className="text-sm font-medium"
                            >
                              Required Field
                            </label>
                          </div>
                        </div>

                        {field.fieldType === "select" && (
                          <div className="mt-4">
                            <Textarea
                              label="Options (one per line)"
                              value={field.options?.join("\n") || ""}
                              onChange={(e) =>
                                updateRequiredField(
                                  index,
                                  "options",
                                  e.target.value.split("\n").filter(Boolean)
                                )
                              }
                              placeholder="Option 1&#10;Option 2&#10;Option 3"
                              rows={3}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview */}
            {formData.title && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium">Preview</h3>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center gap-2 mb-3">
                      {getCategoryIcon(formData.category)}
                      <h4 className="font-medium">{formData.title}</h4>
                      <Badge variant={getPriorityColor(formData.priority)}>
                        {formData.priority}
                      </Badge>
                      {formData.isUrgent && (
                        <Badge variant="danger">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Urgent
                        </Badge>
                      )}
                    </div>

                    <p className="text-gray-600 mb-4">{formData.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due:{" "}
                        {formData.dueDate
                          ? new Date(formData.dueDate).toLocaleDateString(
                              "en-GB"
                            )
                          : "Not set"}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {formData.requiredFields.length} field(s)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              leftIcon={loading ? undefined : Plus}
            >
              {loading ? "Creating..." : "Create Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RequestAdditionalInformation;
