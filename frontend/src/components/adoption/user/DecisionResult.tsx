import React from "react";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface DecisionResultProps {
  finalDecision?: {
    status: "approved" | "rejected";
    date: string;
    reason: string;
    decidedBy: string;
    conditions?: string[];
  };
  requestStatus: string;
}

const DecisionResult: React.FC<DecisionResultProps> = ({
  finalDecision,
  requestStatus,
}) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "approved":
        return {
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          icon: CheckCircle,
          label: "Approved",
        };
      case "rejected":
        return {
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          icon: XCircle,
          label: "Not Approved",
        };
      case "pending":
        return {
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          icon: Clock,
          label: "Under Review",
        };
      case "scheduled":
        return {
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          icon: Calendar,
          label: "Scheduled",
        };
      case "completed":
        return {
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          icon: CheckCircle,
          label: "Adoption Complete",
        };
      default:
        return {
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          icon: Clock,
          label: "Pending",
        };
    }
  };

  const statusInfo = getStatusInfo(requestStatus);
  const Icon = statusInfo.icon;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Decision Result</h2>
          <p className="text-sm text-gray-500">
            {finalDecision ? "Decision has been made" : "Awaiting decision"}
          </p>
        </div>
        <Badge
          variant={
            requestStatus === "approved" || requestStatus === "completed"
              ? "success"
              : requestStatus === "rejected"
              ? "danger"
              : "warning"
          }
        >
          {statusInfo.label}
        </Badge>
      </div>

      {finalDecision ? (
        <Card
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
                  <h3 className={`text-lg font-semibold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </h3>
                  <span className="text-sm text-gray-500">
                    on{" "}
                    {format(
                      new Date(finalDecision.date),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </span>
                </div>

                {finalDecision.reason && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      Reason
                    </h4>
                    <p className="text-sm text-gray-600">
                      {finalDecision.reason}
                    </p>
                  </div>
                )}

                {finalDecision.conditions &&
                  finalDecision.conditions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Conditions
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {finalDecision.conditions.map((condition, index) => (
                          <li key={index} className="text-sm text-gray-600">
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                <div className="text-xs text-gray-500">
                  Decided by: {finalDecision.decidedBy}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-50 border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 p-3 rounded-full bg-gray-100">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Awaiting Decision
                </h3>
                <p className="text-sm text-gray-600">
                  The shelter is currently reviewing your application. You will
                  be notified once a decision has been made.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {requestStatus === "approved" && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-800 mb-1">
                Next Steps
              </h4>
              <p className="text-sm text-green-700">
                Congratulations! Your application has been approved. The shelter
                will contact you to schedule a meeting and complete the adoption
                process.
              </p>
            </div>
          </div>
        </div>
      )}

      {requestStatus === "rejected" && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-1">
                What's Next?
              </h4>
              <p className="text-sm text-red-700">
                While this particular application wasn't approved, you can still
                apply for other pets or contact the shelter for more
                information.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecisionResult;
