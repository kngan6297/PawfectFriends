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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/Select";

interface AdoptionDocument {
  _id?: string;
  type:
    | "id"
    | "proof_of_residence"
    | "reference_letter"
    | "vet_records"
    | "other";
  url: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
}

interface DocumentUploadProps {
  requestId: string;
  documents: AdoptionDocument[];
  onDocumentsUpdate: (documents: AdoptionDocument[]) => void;
  readOnly?: boolean;
  showUpload?: boolean;
}

const DOCUMENT_TYPES = [
  {
    value: "id",
    label: "Government ID",
    description: "Driver's license, passport, etc.",
  },
  {
    value: "proof_of_residence",
    label: "Proof of Residence",
    description: "Utility bill, lease agreement, etc.",
  },
  {
    value: "reference_letter",
    label: "Reference Letter",
    description: "Personal or professional reference",
  },
  {
    value: "vet_records",
    label: "Veterinary Records",
    description: "Previous pet medical records",
  },
  {
    value: "other",
    label: "Other",
    description: "Additional supporting documents",
  },
];

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  requestId,
  documents,
  onDocumentsUpdate,
  readOnly = false,
  showUpload = true,
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check permissions based on user role
  const canUploadDocuments =
    !readOnly &&
    showUpload &&
    (user?.role === "user" ||
      user?.role === "shelter" ||
      user?.role === "admin");
  const canVerifyDocuments =
    !readOnly && (user?.role === "shelter" || user?.role === "admin");
  const canDeleteDocuments =
    !readOnly &&
    (user?.role === "user" ||
      user?.role === "shelter" ||
      user?.role === "admin");

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
      const uploadResponse = await fetch(`${API_BASE_URL}/adoptions/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const uploadResult = await uploadResponse.json();

      // Add document to adoption request
      const updatedRequest = await adoptionApi.uploadDocument(requestId, {
        type: documentType as AdoptionDocument["type"],
        url: uploadResult.data.url,
        name: selectedFile.name,
      });

      if (updatedRequest.documents) {
        onDocumentsUpdate(updatedRequest.documents);
      }

      // Reset form
      setSelectedFile(null);
      setDocumentType("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success("Document uploaded successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload document";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerifyDocument = async (
    documentId: string,
    status: "approved" | "rejected"
  ) => {
    try {
      setIsVerifying(documentId);
      const updatedRequest = await adoptionApi.verifyDocument(
        requestId,
        documentId,
        status
      );

      if (updatedRequest.documents) {
        onDocumentsUpdate(updatedRequest.documents);
      }

      toast.success(`Document ${status} successfully`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to verify document";
      toast.error(errorMessage);
    } finally {
      setIsVerifying(null);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      setIsDeleting(documentId);
      const updatedRequest = await adoptionApi.deleteDocument(
        requestId,
        documentId
      );

      if (updatedRequest.documents) {
        onDocumentsUpdate(updatedRequest.documents);
      }

      toast.success("Document deleted successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete document";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      default:
        return "warning";
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "id":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "proof_of_residence":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            {readOnly ? "Profile Documents" : "Documents"}
          </h2>
          <p className="text-sm text-gray-500">
            {documents.length} document{documents.length !== 1 ? "s" : ""}{" "}
            {readOnly ? "uploaded" : "uploaded"}
          </p>
        </div>
      </div>

      {/* Upload Section - Only for users and when not read-only */}
      {canUploadDocuments && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Upload New Document
          </h3>

          <div className="space-y-4">
            {/* Document Type Selection */}
            <div>
              <label
                htmlFor="documentType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Document Type
              </label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select document type..." />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-500">
                          {type.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div>
              <label
                htmlFor="fileUpload"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="fileUpload"
                onChange={handleFileSelect}
                accept={ALLOWED_FILE_TYPES.join(",")}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select file to upload"
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PDF, DOC, DOCX, JPG, PNG, GIF (max 5MB)
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
                "Upload Document"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-4">
        {documents.length === 0 ? (
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
            <p className="text-sm">No documents uploaded yet</p>
            {canUploadDocuments && (
              <p className="text-xs text-gray-400 mt-1">
                Upload your first document above
              </p>
            )}
          </div>
        ) : (
          documents.map((document) => (
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
                        {document.status.charAt(0).toUpperCase() +
                          document.status.slice(1)}
                      </Badge>
                    </div>

                    <p className="text-xs text-gray-500 mb-2">
                      {DOCUMENT_TYPES.find((t) => t.value === document.type)
                        ?.label || document.type}
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        Uploaded:{" "}
                        {formatDisplayDate(new Date(document.uploadedAt))}
                      </span>
                      {document.verifiedAt && (
                        <span>
                          Verified:{" "}
                          {formatDisplayDate(new Date(document.verifiedAt))}
                        </span>
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

                  {/* Verification Buttons (Shelter/Admin Only) */}
                  {canVerifyDocuments && document.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleVerifyDocument(document._id!, "approved")
                        }
                        disabled={isVerifying === document._id}
                        className="text-xs text-green-600 border-green-600 hover:bg-green-50"
                      >
                        {isVerifying === document._id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          "Approve"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleVerifyDocument(document._id!, "rejected")
                        }
                        disabled={isVerifying === document._id}
                        className="text-xs text-red-600 border-red-600 hover:bg-red-50"
                      >
                        {isVerifying === document._id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          "Reject"
                        )}
                      </Button>
                    </>
                  )}

                  {/* Delete Button */}
                  {canDeleteDocuments && (
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

      {/* Documents Summary */}
      {documents.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>
                {documents.filter((d) => d.status === "pending").length} pending
              </span>
              <span>
                {documents.filter((d) => d.status === "approved").length}{" "}
                approved
              </span>
              <span>
                {documents.filter((d) => d.status === "rejected").length}{" "}
                rejected
              </span>
            </div>
            <span>
              Latest:{" "}
              {documents.length > 0 &&
                formatDisplayDate(new Date(documents[0].uploadedAt))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
