import React, { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import FormField from "../common/FormField";
import LoadingSpinner from "../common/LoadingSpinner";
import { reportService } from "../../services/report.service";
import {
  REPORT_REASONS,
  CreateReportData,
  ReportEvidence,
} from "../../types/report";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/Select";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUser: {
    id: string;
    name: string;
    email: string;
  };
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportedUser,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: "" as keyof typeof REPORT_REASONS,
    description: "",
  });
  const [evidence, setEvidence] = useState<ReportEvidence[]>([]);
  const [newEvidence, setNewEvidence] = useState({
    type: "text" as "screenshot" | "link" | "text",
    content: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason || !formData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const reportData: CreateReportData = {
        reportedUserId: reportedUser.id,
        reason: formData.reason,
        description: formData.description.trim(),
        evidence: evidence.length > 0 ? evidence : undefined,
      };

      await reportService.createReport(reportData);
      toast.success("Report submitted successfully");
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit report");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      reason: "" as keyof typeof REPORT_REASONS,
      description: "",
    });
    setEvidence([]);
    setNewEvidence({
      type: "text",
      content: "",
      description: "",
    });
  };

  const addEvidence = () => {
    if (!newEvidence.content.trim()) {
      toast.error("Please provide evidence content");
      return;
    }

    setEvidence([...evidence, { ...newEvidence }]);
    setNewEvidence({
      type: "text",
      content: "",
      description: "",
    });
  };

  const removeEvidence = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Report User</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              ✕
            </Button>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Reporting:</h3>
            <p className="text-gray-700">{reportedUser.name}</p>
            <p className="text-sm text-gray-500">{reportedUser.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Report *
              </label>
              <Select
                value={formData.reason}
                onValueChange={(e) =>
                  setFormData({
                    ...formData,
                    reason: e as keyof typeof REPORT_REASONS,
                  })
                }
              >
                <SelectTrigger className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_REASONS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Please provide detailed information about the issue..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                maxLength={1000}
                disabled={isLoading}
              />
              <div className="text-sm text-gray-500 mt-1">
                {formData.description.length}/1000 characters
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Evidence (Optional)
              </h3>

              {/* Add Evidence Form */}
              <div className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex gap-3">
                  <Select
                    value={newEvidence.type}
                    onValueChange={(value) =>
                      setNewEvidence({
                        ...newEvidence,
                        type: value as "screenshot" | "link" | "text",
                      })
                    }
                  >
                    <SelectTrigger className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Select evidence type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="screenshot">Screenshot</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={addEvidence}
                    disabled={isLoading || !newEvidence.content.trim()}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>

                <input
                  type="text"
                  value={newEvidence.content}
                  onChange={(e) =>
                    setNewEvidence({ ...newEvidence, content: e.target.value })
                  }
                  placeholder={
                    newEvidence.type === "link" ? "Enter URL" : "Enter content"
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />

                <input
                  type="text"
                  value={newEvidence.description}
                  onChange={(e) =>
                    setNewEvidence({
                      ...newEvidence,
                      description: e.target.value,
                    })
                  }
                  placeholder="Description (optional)"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              {/* Evidence List */}
              {evidence.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Added Evidence:</h4>
                  {evidence.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{item.content}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEvidence(index)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading || !formData.reason || !formData.description.trim()
                }
              >
                {isLoading ? <LoadingSpinner /> : "Submit Report"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
