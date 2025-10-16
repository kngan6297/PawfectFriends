import React from "react";
import { Button } from "@/components/ui/Button";
import { FileText, Download, Eye, Send, CheckCircle2 } from "lucide-react";

interface ContractDetails {
  status: "drafted" | "sent" | "signed";
  title?: string;
}

interface ContractActionsProps {
  contractDetails: ContractDetails;
  onReviewContract?: () => void;
  onOpenContract?: () => void;
  onDownloadPDF?: () => void;
  onViewSigned?: () => void;
  className?: string;
}

export const ContractActions: React.FC<ContractActionsProps> = ({
  contractDetails,
  onReviewContract,
  onOpenContract,
  onDownloadPDF,
  onViewSigned,
  className = "",
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "signed":
        return "bg-green-100 text-green-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "drafted":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "signed":
        return <Download className="h-4 w-4" />;
      case "sent":
        return <Eye className="h-4 w-4" />;
      case "drafted":
        return <Send className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionButton = () => {
    switch (contractDetails.status) {
      case "drafted":
        return (
          <Button
            onClick={onReviewContract}
            className="flex items-center gap-2"
            variant="outline"
            disabled
          >
            <Send className="h-4 w-4" />
            Contract Not Ready
          </Button>
        );
      case "sent":
        return (
          <Button
            onClick={onOpenContract}
            className="flex items-center gap-2"
            variant="primary"
          >
            <Eye className="h-4 w-4" />
            View & Sign Contract
          </Button>
        );
      case "signed":
        return (
          <Button
            onClick={onViewSigned}
            className="flex items-center gap-2"
            variant="outline"
            disabled
          >
            <CheckCircle2 className="h-4 w-4" />
            Contract Signed ✓
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`mt-6 pt-6 border-t border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            id="contract-heading"
            className="text-lg font-semibold text-gray-900 mb-2"
          >
            Contract Information
          </h2>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                contractDetails.status
              )}`}
            >
              {getStatusIcon(contractDetails.status)}
              <span className="ml-1">
                {contractDetails.status === "signed"
                  ? "Signed"
                  : contractDetails.status === "sent"
                  ? "Contract Ready"
                  : "Contract Not Ready"}
              </span>
            </span>
            {contractDetails.title && (
              <span className="text-sm text-gray-600">
                {contractDetails.title}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-start">{getActionButton()}</div>
    </div>
  );
};

export default ContractActions;
