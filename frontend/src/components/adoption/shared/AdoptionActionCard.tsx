import React from "react";
import { Button } from "@/components/ui/Button";
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
import { Textarea } from "@/components/ui/Textarea";
import { LucideIcon } from "lucide-react";

interface AdoptionActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  buttonText: string;
  showModal: boolean;
  loading: boolean;
  onButtonClick: () => void;
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
  emptyStateIcon: React.ReactNode;
  emptyStateText: string;
  emptyStateSubtext: string;
}

const AdoptionActionCard: React.FC<AdoptionActionCardProps> = ({
  title,
  description,
  icon: Icon,
  buttonText,
  showModal,
  loading,
  onButtonClick,
  onClose,
  onSubmit,
  children,
  emptyStateIcon,
  emptyStateText,
  emptyStateSubtext,
}) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Icon className="h-5 w-5 text-blue-500" />
          <div>
            <h2 className="text-lg font-medium text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <Button onClick={onButtonClick} size="sm">
          {buttonText}
        </Button>
      </div>

      {/* Form */}
      {showModal && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          {children}
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={loading}>
              {loading ? "Processing..." : "Submit"}
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      <div className="space-y-4">
        <div className="text-center py-8 text-gray-500">
          {emptyStateIcon}
          <p className="text-sm">{emptyStateText}</p>
          <p className="text-xs text-gray-400 mt-1">{emptyStateSubtext}</p>
        </div>
      </div>
    </div>
  );
};

export default AdoptionActionCard;
