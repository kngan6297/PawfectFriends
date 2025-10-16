import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FileText, Eye, Send, Settings, ChevronDown } from "lucide-react";
import { adoptionApi } from "@/services/api";
import { toast } from "react-toastify";
import { ContractDetails, ContractGenerationOptions } from "@/types/contract";

interface ContractGeneratorProps {
  adoptionRequestId: string;
  onContractGenerated?: (contractData: any) => void;
  existingContract?: ContractDetails;
  disabled?: boolean;
  adoptionStatus?: string;
  canGenerateContract?: boolean;
}

const ContractGenerator: React.FC<ContractGeneratorProps> = ({
  adoptionRequestId,
  onContractGenerated,
  existingContract,
  disabled = false,
  adoptionStatus,
  canGenerateContract = true,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const [contractOptions, setContractOptions] =
    useState<ContractGenerationOptions>({
      version: "1.0",
      generatePdf: true,
    });

  const handleGenerateContract = async () => {
    if (!adoptionRequestId || typeof adoptionRequestId !== "string") {
      console.error(
        "❌ Invalid adoptionRequestId for generation:",
        adoptionRequestId
      );
      toast.error("Invalid request ID for contract generation");
      return;
    }

    setIsGenerating(true);

    try {
      const contractData = await adoptionApi.generateContract(
        adoptionRequestId,
        {
          version: contractOptions.version,
          generatePdf: contractOptions.generatePdf,
        }
      );

      toast.success("Contract generated successfully!");

      if (onContractGenerated) {
        onContractGenerated(contractData);
      }
    } catch (error: any) {
      console.error("Contract generation failed:", error);
      toast.error(
        error.response?.data?.message || "Failed to generate contract"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendContract = async () => {
    if (!adoptionRequestId || typeof adoptionRequestId !== "string") {
      console.error(
        "❌ Invalid adoptionRequestId for sending:",
        adoptionRequestId
      );
      toast.error("Invalid request ID for contract sending");
      return;
    }

    setIsSending(true);

    try {
      await adoptionApi.sendContract(adoptionRequestId);
      toast.success("Contract sent successfully!");

      if (onContractGenerated) {
        // Refresh the contract data
        const updatedContract = await adoptionApi.getById(adoptionRequestId);
        onContractGenerated(updatedContract);
      }
    } catch (error: any) {
      console.error("Contract send failed:", error);
      toast.error(error.response?.data?.message || "Failed to send contract");
    } finally {
      setIsSending(false);
    }
  };

  const handlePreviewContract = () => {
    setIsPreviewOpen(true);
  };

  // Only show contract generator if adoption is approved or can generate contract
  if (!canGenerateContract && adoptionStatus !== "approved") {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-800">
          <FileText className="h-5 w-5" />
          <p className="font-medium">Contract Generation Not Available</p>
        </div>
        <p className="text-sm text-yellow-700 mt-1">
          Contract generation is only available after the adoption request has
          been approved.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons with Status */}
      <div className="bg-white border rounded-lg p-6">
        {/* Main Action Buttons */}
        <div className="flex items-center gap-4">
          {/* Generate Contract */}
          <Button
            onClick={handleGenerateContract}
            disabled={isGenerating || disabled}
            className="flex items-center gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {existingContract ? "Regenerating..." : "Generating..."}
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                {existingContract ? "Regenerate Contract" : "Generate Contract"}
              </>
            )}
          </Button>

          {/* Preview Contract (only if contract exists) */}
          {existingContract && (
            <Button
              onClick={handlePreviewContract}
              disabled={disabled}
              variant="outline"
              className="flex items-center gap-2"
              size="lg"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          )}

          {/* Send Contract (only if status = drafted) */}
          {existingContract?.status === "drafted" && (
            <Button
              onClick={handleSendContract}
              disabled={isSending || disabled}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isSending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Contract
                </>
              )}
            </Button>
          )}
        </div>

        {/* Status Display */}
        {existingContract && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  existingContract.status === "signed"
                    ? "bg-green-500"
                    : existingContract.status === "sent"
                    ? "bg-blue-500"
                    : existingContract.status === "drafted"
                    ? "bg-yellow-500"
                    : "bg-gray-400"
                }`}
              />
              <span className="text-sm font-medium text-gray-700">
                Status:{" "}
                {existingContract.status === "drafted"
                  ? "Drafted"
                  : existingContract.status === "sent"
                  ? "Sent to Adopter"
                  : existingContract.status === "signed"
                  ? "Signed & Completed"
                  : "Unknown"}
              </span>
              <span className="text-sm text-gray-500">
                {existingContract.status === "drafted"
                  ? "| Ready for Review"
                  : existingContract.status === "sent"
                  ? "| Awaiting Signature"
                  : existingContract.status === "signed"
                  ? "| Adoption Completed"
                  : ""}
              </span>
            </div>
          </div>
        )}

        {/* Advanced Options */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>
              📄 Contract v{contractOptions.version} | PDF{" "}
              {contractOptions.generatePdf ? "Enabled" : "Disabled"}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                showAdvancedOptions ? "rotate-180" : ""
              }`}
            />
          </button>

          {showAdvancedOptions && (
            <div className="mt-3 space-y-3">
              {/* PDF Generation Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Generate PDF
                  </label>
                  <p className="text-xs text-gray-500">
                    Create a downloadable PDF version
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contractOptions.generatePdf || false}
                    onChange={(e) =>
                      setContractOptions((prev) => ({
                        ...prev,
                        generatePdf: e.target.checked,
                      }))
                    }
                    disabled={disabled}
                    className="sr-only"
                    aria-label="Generate PDF"
                  />
                  <div
                    className={`w-11 h-6 rounded-full transition-colors ${
                      contractOptions.generatePdf
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        contractOptions.generatePdf
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      } mt-0.5`}
                    />
                  </div>
                </label>
              </div>

              {/* Version Info */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Contract Version
                  </label>
                  <p className="text-xs text-gray-500">
                    Template version {contractOptions.version}
                  </p>
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  v{contractOptions.version}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && existingContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Contract Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewOpen(false)}
              >
                ×
              </Button>
            </div>
            <div className="p-6">
              {existingContract.title && (
                <h4 className="text-xl font-bold mb-4">
                  {existingContract.title}
                </h4>
              )}
              {existingContract.description && (
                <p className="text-gray-600 mb-4">
                  {existingContract.description}
                </p>
              )}
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
                  {existingContract.content ||
                    existingContract.terms ||
                    "No contract content available."}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractGenerator;
