import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, Calendar, MapPin, User } from "lucide-react";
import { adoptionApi } from "@/services/api";
import { toast } from "react-toastify";

interface CompleteHandoverProps {
  adoptionRequestId: string;
  onHandoverCompleted?: (adoptionData: any) => void;
  disabled?: boolean;
}

const CompleteHandover: React.FC<CompleteHandoverProps> = ({
  adoptionRequestId,
  onHandoverCompleted,
  disabled = false,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [handoverData, setHandoverData] = useState({
    handoverDate: "",
    handoverLocation: "",
    handoverNotes: "",
    handoverMethod: "in_person", // in_person, delivery, pickup
    witnessName: "",
    witnessContact: "",
  });

  const handleCompleteHandover = async () => {
    if (!handoverData.handoverDate || !handoverData.handoverLocation) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCompleting(true);

    try {
      const handoverDetails = {
        ...handoverData,
        completedAt: new Date().toISOString(),
        status: "completed",
      };

      const updatedAdoption = await adoptionApi.completeHandover(
        adoptionRequestId,
        handoverDetails
      );

      toast.success("Handover completed successfully!");

      if (onHandoverCompleted) {
        onHandoverCompleted(updatedAdoption);
      }
    } catch (error: any) {
      console.error("Handover completion failed:", error);
      toast.error(
        error.response?.data?.message || "Failed to complete handover"
      );
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle>Complete Handover</CardTitle>
          </div>
          <CardDescription>
            Finalize the adoption process by completing the pet handover.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Handover Date */}
          <div className="space-y-2">
            <Label htmlFor="handoverDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Handover Date *
            </Label>
            <Input
              id="handoverDate"
              type="datetime-local"
              value={handoverData.handoverDate}
              onChange={(e) =>
                setHandoverData((prev) => ({
                  ...prev,
                  handoverDate: e.target.value,
                }))
              }
              disabled={disabled}
              required
            />
          </div>

          {/* Handover Location */}
          <div className="space-y-2">
            <Label
              htmlFor="handoverLocation"
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Handover Location *
            </Label>
            <Input
              id="handoverLocation"
              placeholder="Enter handover location"
              value={handoverData.handoverLocation}
              onChange={(e) =>
                setHandoverData((prev) => ({
                  ...prev,
                  handoverLocation: e.target.value,
                }))
              }
              disabled={disabled}
              required
            />
          </div>

          {/* Handover Method */}
          <div className="space-y-2">
            <Label htmlFor="handoverMethod">Handover Method</Label>
            <select
              id="handoverMethod"
              value={handoverData.handoverMethod}
              onChange={(e) =>
                setHandoverData((prev) => ({
                  ...prev,
                  handoverMethod: e.target.value,
                }))
              }
              disabled={disabled}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Handover method"
            >
              <option value="in_person">In Person</option>
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
            </select>
          </div>

          {/* Witness Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Witness Information (Optional)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="witnessName">Witness Name</Label>
                <Input
                  id="witnessName"
                  placeholder="Enter witness name"
                  value={handoverData.witnessName}
                  onChange={(e) =>
                    setHandoverData((prev) => ({
                      ...prev,
                      witnessName: e.target.value,
                    }))
                  }
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="witnessContact">Witness Contact</Label>
                <Input
                  id="witnessContact"
                  placeholder="Phone or email"
                  value={handoverData.witnessContact}
                  onChange={(e) =>
                    setHandoverData((prev) => ({
                      ...prev,
                      witnessContact: e.target.value,
                    }))
                  }
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          {/* Handover Notes */}
          <div className="space-y-2">
            <Label htmlFor="handoverNotes">Handover Notes</Label>
            <Textarea
              id="handoverNotes"
              placeholder="Any additional notes about the handover process..."
              value={handoverData.handoverNotes}
              onChange={(e) =>
                setHandoverData((prev) => ({
                  ...prev,
                  handoverNotes: e.target.value,
                }))
              }
              disabled={disabled}
              rows={4}
            />
          </div>

          {/* Complete Button */}
          <Button
            onClick={handleCompleteHandover}
            disabled={
              !handoverData.handoverDate ||
              !handoverData.handoverLocation ||
              isCompleting ||
              disabled
            }
            className="w-full"
          >
            {isCompleting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Completing Handover...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Handover
              </>
            )}
          </Button>

          {/* Status Info */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <p className="text-sm font-medium">Ready for Handover</p>
            </div>
            <p className="text-xs text-green-600 mt-1">
              The adoption contract has been signed. You can now complete the
              handover process to finalize the adoption.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteHandover;
