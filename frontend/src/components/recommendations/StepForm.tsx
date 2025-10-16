import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

interface StepFormProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  canProceed: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const StepForm: React.FC<StepFormProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSubmit,
  canProceed,
  isLoading = false,
  children,
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-base md:text-lg font-semibold text-gray-700">
            Question {currentStep} of {totalSteps}
          </span>
          <span className="text-base md:text-lg text-gray-500">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mt-6">
          {Array.from({ length: totalSteps }, (_, index) => (
            <div
              key={index}
              className={`flex flex-col items-center ${
                index + 1 <= currentStep ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold mb-1 md:mb-2 ${
                  index + 1 <= currentStep
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {index + 1}
              </div>
              <span className="text-xs md:text-sm font-medium text-center">
                {index === 0
                  ? "Lifestyle"
                  : index === 1
                  ? "Living Space"
                  : index === 2
                  ? "Preferences"
                  : "Review"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <section className="bg-transparent px-0 py-0">
        {children}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 pt-8 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={currentStep === 1}
            className="flex items-center px-6 md:px-8 py-3 text-sm md:text-base font-medium w-full sm:w-auto"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Previous
          </Button>

          <div className="flex items-center space-x-4 w-full sm:w-auto">
            {isLastStep ? (
              <Button
                variant="primary"
                onClick={() => onSubmit()}
                disabled={!canProceed || isLoading}
                isLoading={isLoading}
                className="flex items-center px-8 md:px-10 py-3 text-sm md:text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full sm:w-auto"
              >
                🎯 Get My Results
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={onNext}
                disabled={!canProceed}
                className="flex items-center px-6 md:px-8 py-3 text-sm md:text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full sm:w-auto"
              >
                Next Question
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
