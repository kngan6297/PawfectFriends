import React from "react";
import { format } from "date-fns";
import { CheckCircle, Clock, FileText, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface ContractDocument {
  _id?: string;
  type: "contract" | "agreement" | "other";
  url: string;
  name: string;
  status: "drafted" | "sent" | "signed";
  uploadedAt: string | Date;
  sentAt?: string | Date;
  signedAt?: string | Date;
  signedBy?: string;
}

interface ContractStatusProps {
  contractDocuments: ContractDocument[];
  requestStatus: string;
}

const ContractStatus: React.FC<ContractStatusProps> = ({
  contractDocuments,
  requestStatus,
}) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "signed":
        return {
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          icon: CheckCircle,
          label: "Signed",
        };
      case "sent":
        return {
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          icon: Send,
          label: "Sent for Review",
        };
      case "drafted":
        return {
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          icon: Clock,
          label: "Draft",
        };
      default:
        return {
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          icon: Clock,
          label: "Unknown",
        };
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

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "contract":
        return "Adoption Contract";
      case "agreement":
        return "Care Agreement";
      case "other":
        return "Other Document";
      default:
        return type;
    }
  };

  // Only show contract status if request is approved or later
  if (
    requestStatus !== "approved" &&
    requestStatus !== "scheduled" &&
    requestStatus !== "completed"
  ) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Contract Status
            </h2>
            <p className="text-sm text-gray-500">
              Contract documents will be available after approval
            </p>
          </div>
        </div>

        <Card className="bg-gray-50 border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 p-3 rounded-full bg-gray-100">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Awaiting Approval
                </h3>
                <p className="text-sm text-gray-600">
                  Contract documents will be prepared and shared with you once
                  your application is approved by the shelter.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Contract Status</h2>
          <p className="text-sm text-gray-500">
            {contractDocuments.length} contract document
            {contractDocuments.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>

      {contractDocuments.length === 0 ? (
        <Card className="bg-gray-50 border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 p-3 rounded-full bg-gray-100">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No Contract Documents Yet
                </h3>
                <p className="text-sm text-gray-600">
                  The shelter is preparing your contract documents. They will be
                  shared with you soon.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contractDocuments.map((document) => {
            const statusInfo = getStatusInfo(document.status);
            const Icon = statusInfo.icon;

            return (
              <Card
                key={document._id}
                className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-2`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`flex-shrink-0 p-3 rounded-full ${statusInfo.bgColor}`}
                    >
                      <Icon className={`h-6 w-6 ${statusInfo.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3
                          className={`text-lg font-semibold ${statusInfo.color}`}
                        >
                          {document.name}
                        </h3>
                        <Badge
                          variant={
                            document.status === "signed"
                              ? "success"
                              : document.status === "sent"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {getStatusLabel(document.status)}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {getDocumentTypeLabel(document.type)}
                      </p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                        <span>
                          Uploaded:{" "}
                          {format(
                            typeof document.uploadedAt === "string"
                              ? new Date(document.uploadedAt)
                              : document.uploadedAt,
                            "MMM d, yyyy"
                          )}
                        </span>
                        {document.sentAt && (
                          <span>
                            Sent:{" "}
                            {format(
                              typeof document.sentAt === "string"
                                ? new Date(document.sentAt)
                                : document.sentAt,
                              "MMM d, yyyy"
                            )}
                          </span>
                        )}
                        {document.signedAt && (
                          <span>
                            Signed:{" "}
                            {format(
                              typeof document.signedAt === "string"
                                ? new Date(document.signedAt)
                                : document.signedAt,
                              "MMM d, yyyy"
                            )}
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(document.url, "_blank")}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Document
                        </button>

                        {document.status === "sent" && (
                          <span className="text-sm text-blue-600 font-medium">
                            Please review and sign this document
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
                  typeof contractDocuments[0].uploadedAt === "string"
                    ? new Date(contractDocuments[0].uploadedAt)
                    : contractDocuments[0].uploadedAt,
                  "MMM d, yyyy"
                )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractStatus;
