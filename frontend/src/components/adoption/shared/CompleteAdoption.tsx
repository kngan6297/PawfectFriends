import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { adoptionApi } from "@/services/api";
import { toast } from "react-toastify";

interface CompleteAdoptionProps {
  adoptionRequestId: string;
  onAdoptionCompleted?: (adoptionData: any) => void;
  disabled?: boolean;
}

const CompleteAdoption: React.FC<CompleteAdoptionProps> = ({
  adoptionRequestId,
  onAdoptionCompleted,
  disabled = false,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleCompleteAdoption = async () => {
    setIsCompleting(true);

    try {
      const updatedAdoption = await adoptionApi.completeAdoption(
        adoptionRequestId
      );

      toast.success("Adoption completed successfully! 🎉");

      if (onAdoptionCompleted) {
        onAdoptionCompleted(updatedAdoption);
      }
    } catch (error: any) {
      console.error("Adoption completion failed:", error);
      toast.error(
        error.response?.data?.message || "Failed to complete adoption"
      );
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          Complete Adoption
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-medium">Ready to Complete</p>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Both contract signing and handover are completed. You can now
            finalize the adoption.
          </p>
        </div>

        <Button
          onClick={handleCompleteAdoption}
          disabled={isCompleting || disabled}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {isCompleting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              Completing Adoption...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Adoption
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CompleteAdoption;
