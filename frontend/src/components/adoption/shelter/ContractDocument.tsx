import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { adoptionApi, API_BASE_URL } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDisplayDate } from "@/utils/dateUtils";
import {
  validateFile,
  formatFileSize,
  ALLOWED_FILE_TYPES,
} from "@/utils/fileUpload";

interface ContractDocument {
  _id?: string;
  type: "contract" | "agreement" | "other";
  url: string;
  name: string;
  status: "drafted" | "sent" | "signed";
  uploadedAt: Date;
  sentAt?: Date;
  signedAt?: Date;
  signedBy?: string;
}

interface ContractDocumentProps {
  requestId: string;
  contractDocuments: ContractDocument[];
  onContractDocumentsUpdate: (documents: ContractDocument[]) => void;
  readOnly?: boolean;
}

const CONTRACT_TYPES = [
  {
    value: "contract",
    label: "Adoption Contract",
    description: "Official adoption agreement",
  },
  {
    value: "agreement",
    label: "Care Agreement",
    description: "Pet care and responsibility agreement",
  },
  {
    value: "other",
    label: "Other",
    description: "Additional contract documents",
  },
];

const ContractDocument: React.FC<ContractDocumentProps> = ({
  requestId,
  contractDocuments,
  onContractDocumentsUpdate,
  readOnly = false,
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Only shelters and admins can manage contract documents
  const canManageContracts =
    !readOnly && (user?.role === "shelter" || user?.role === "admin");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      toast.error("Please select a file and document type");
      return;
    }

    try {
      setIsUploading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", documentType);
      formData.append("name", selectedFile.name);

      // Upload file to storage
      const uploadResponse = await fetch(
        `${API_BASE_URL}/adoptions/upload-contract`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const uploadResult = await uploadResponse.json();

      // Add contract document to adoption request
      const updatedRequest = await adoptionApi.uploadContractDocument(
        requestId,
        {
          type: documentType as ContractDocument["type"],
          url: uploadResult.data.url,
          name: selectedFile.name,
        }
      );

      if (updatedRequest.contractDocuments) {
        onContractDocumentsUpdate(updatedRequest.contractDocuments);
      }

      // Reset form
      setSelectedFile(null);
      setDocumentType("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success("Contract document uploaded successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to upload contract document";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateStatus = async (
    documentId: string,
    status: "drafted" | "sent" | "signed"
  ) => {
    try {
      setIsUpdating(documentId);
      const updatedRequest = await adoptionApi.updateContractStatus(
        requestId,
        documentId,
        status
      );

      if (updatedRequest.contractDocuments) {
        onContractDocumentsUpdate(updatedRequest.contractDocuments);
      }

      toast.success(`Contract status updated to ${status}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update contract status";
      toast.error(errorMessage);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this contract document?")) {
      return;
    }

    try {
      setIsDeleting(documentId);
      const updatedRequest = await adoptionApi.deleteContractDocument(
        requestId,
        documentId
      );

      if (updatedRequest.contractDocuments) {
        onContractDocumentsUpdate(updatedRequest.contractDocuments);
      }

      toast.success("Contract document deleted successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete contract document";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "signed":
        return "success";
      case "sent":
        return "warning";
      case "drafted":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "drafted":
        return "Drafted";
      case "sent":
        return "Sent";
      case "signed":
        return "Signed";
      default:
        return status;
    }
  };

  const getDocumentIcon = (type: string) => {
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Contract Documents
          </h2>
          <p className="text-sm text-gray-500">
            {contractDocuments.length} contract document
            {contractDocuments.length !== 1 ? "s" : ""}{" "}
            {readOnly ? "available" : "managed"}
          </p>
        </div>
      </div>

      {/* Upload Section - Only for shelters */}
      {canManageContracts && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Upload New Contract
          </h3>

          <div className="space-y-4">
            {/* Document Type Selection */}
            <div>
              <label
                htmlFor="contractType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contract Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select contract type"
              >
                <option value="">Select contract type...</option>
                {CONTRACT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label
                htmlFor="contractUpload"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="contractUpload"
                onChange={handleFileSelect}
                accept={ALLOWED_FILE_TYPES.join(",")}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select contract file to upload"
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PDF, DOC, DOCX (max 10MB)
              </p>
            </div>

            {/* Selected File Info */}
            {selectedFile && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-900">
                  <strong>Selected:</strong> {selectedFile.name} (
                  {formatFileSize(selectedFile.size)})
                </p>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !documentType || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Uploading...
                </>
              ) : (
                "Upload Contract"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Contract Documents List */}
      <div className="space-y-4">
        {contractDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm">No contract documents available</p>
            {canManageContracts && (
              <p className="text-xs text-gray-400 mt-1">
                Upload your first contract above
              </p>
            )}
          </div>
        ) : (
          contractDocuments.map((document) => (
            <div
              key={document._id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    {getDocumentIcon(document.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {document.name}
                      </h4>
                      <Badge
                        variant={getStatusColor(document.status)}
                        className="text-xs"
                      >
                        {getStatusLabel(document.status)}
                      </Badge>
                    </div>

                    <p className="text-xs text-gray-500 mb-2">
                      {CONTRACT_TYPES.find((t) => t.value === document.type)
                        ?.label || document.type}
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Uploaded: {formatDisplayDate($1)}</span>
                      {document.sentAt && (
                        <span>Sent: {formatDisplayDate($1)}</span>
                      )}
                      {document.signedAt && (
                        <span>Signed: {formatDisplayDate($1)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* View/Download Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(document.url, "_blank")}
                    className="text-xs"
                  >
                    View
                  </Button>

                  {/* Status Update Buttons (Shelter/Admin Only) */}
                  {canManageContracts && (
                    <>
                      {document.status === "drafted" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(document._id!, "sent")
                          }
                          disabled={isUpdating === document._id}
                          className="text-xs text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          {isUpdating === document._id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            "Send"
                          )}
                        </Button>
                      )}
                      {document.status === "sent" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(document._id!, "signed")
                          }
                          disabled={isUpdating === document._id}
                          className="text-xs text-green-600 border-green-600 hover:bg-green-50"
                        >
                          {isUpdating === document._id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            "Mark Signed"
                          )}
                        </Button>
                      )}
                    </>
                  )}

                  {/* Delete Button */}
                  {canManageContracts && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDocument(document._id!)}
                      disabled={isDeleting === document._id}
                      className="text-xs text-red-600 border-red-600 hover:bg-red-50"
                    >
                      {isDeleting === document._id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        "Delete"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contract Summary */}
      {contractDocuments.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>
                {contractDocuments.filter((d) => d.status === "drafted").length}{" "}
                drafted
              </span>
              <span>
                {contractDocuments.filter((d) => d.status === "sent").length}{" "}
                sent
              </span>
              <span>
                {contractDocuments.filter((d) => d.status === "signed").length}{" "}
                signed
              </span>
            </div>
            <span>
              Latest:{" "}
              {contractDocuments.length > 0 &&
                format(
                  new Date(contractDocuments[0].uploadedAt),
                  "MMM d, yyyy"
                )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractDocument;
