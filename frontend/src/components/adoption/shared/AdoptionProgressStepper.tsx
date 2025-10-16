import React from "react";
import {
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  CheckCircle,
} from "lucide-react";

interface AdoptionStep {
  id: string;
  title: string;
  description: string;
  status: "completed" | "current" | "upcoming";
  icon: React.ComponentType<{ className?: string }>;
}

interface AdoptionProgressStepperProps {
  currentStatus: string;
  contractDetails?: {
    status?: "pending" | "sent" | "signed" | "completed";
  };
  className?: string;
}

export const AdoptionProgressStepper: React.FC<
  AdoptionProgressStepperProps
> = ({ currentStatus, contractDetails, className = "" }) => {
  // Define the adoption process steps
  const steps: AdoptionStep[] = [
    {
      id: "submitted",
      title: "Submitted",
      description: "Application received",
      status: "completed",
      icon: CheckCircle2,
    },
    {
      id: "scheduled",
      title: "Scheduled",
      description: "Interview scheduled",
      status: "upcoming",
      icon: Calendar,
    },
    {
      id: "approved",
      title: "Approved",
      description: "Application approved",
      status: "upcoming",
      icon: CheckCircle,
    },
    {
      id: "contract",
      title: "Contract",
      description: "Contract ready",
      status: "upcoming",
      icon: FileText,
    },
    {
      id: "completed",
      title: "Completed",
      description: "Adoption finalized",
      status: "upcoming",
      icon: CheckCircle2,
    },
  ];

  // Determine step statuses based on current status and contract details
  const getStepStatus = (
    stepId: string
  ): "completed" | "current" | "upcoming" => {
    const statusOrder = [
      "submitted",
      "scheduled",
      "approved",
      "contract",
      "completed",
    ];

    // Determine the effective current status based on contract details
    let effectiveStatus = currentStatus;

    // If contract is sent or signed, we're in the contract phase
    if (
      contractDetails?.status === "sent" ||
      contractDetails?.status === "signed"
    ) {
      effectiveStatus = "contract";
    }

    // If contract is signed and adoption is completed, we're done
    if (contractDetails?.status === "signed" && currentStatus === "completed") {
      effectiveStatus = "completed";
    }

    const currentIndex = statusOrder.indexOf(effectiveStatus);
    const stepIndex = statusOrder.indexOf(stepId);

    if (stepIndex < currentIndex) {
      return "completed";
    } else if (stepIndex === currentIndex) {
      return "current";
    } else {
      return "upcoming";
    }
  };

  // Update steps with current status
  const updatedSteps = steps.map((step) => ({
    ...step,
    status: getStepStatus(step.id),
  }));

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Adoption Progress
      </h3>

      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200">
          <div
            className={`h-full bg-blue-500 transition-all duration-300 ${
              updatedSteps.filter((step) => step.status === "completed")
                .length === 0
                ? "w-0"
                : updatedSteps.filter((step) => step.status === "completed")
                    .length === 1
                ? "w-1/4"
                : updatedSteps.filter((step) => step.status === "completed")
                    .length === 2
                ? "w-1/2"
                : updatedSteps.filter((step) => step.status === "completed")
                    .length === 3
                ? "w-3/4"
                : "w-full"
            }`}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {updatedSteps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === updatedSteps.length - 1;

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  isLast ? "ml-auto" : "flex-1"
                }`}
              >
                {/* Step circle */}
                <div
                  className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    step.status === "completed"
                      ? "bg-blue-500 border-blue-500 text-white"
                      : step.status === "current"
                      ? "bg-white border-blue-500 text-blue-500 shadow-lg"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {step.status === "completed" ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>

                {/* Step content */}
                <div className="mt-3 text-center max-w-24">
                  <p
                    className={`text-sm font-medium ${
                      step.status === "completed"
                        ? "text-blue-600"
                        : step.status === "current"
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current status message */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {updatedSteps.find((step) => step.status === "current")?.status ===
            "current" ? (
              <Clock className="w-5 h-5 text-blue-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-blue-900">
              {updatedSteps.find((step) => step.status === "current")
                ?.status === "current"
                ? `Currently: ${
                    updatedSteps.find((step) => step.status === "current")
                      ?.title
                  }`
                : "Process Complete"}
            </p>
            <p className="text-sm text-blue-700">
              {updatedSteps.find((step) => step.status === "current")
                ?.status === "current"
                ? updatedSteps.find((step) => step.status === "current")
                    ?.description
                : "Your adoption has been successfully completed!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdoptionProgressStepper;
