import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { FileText, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { adoptionApi } from "@/services/api";
import { toast } from "react-toastify";
import { ContractDetails } from "@/types/contract";

interface ContractSigningProps {
  adoptionRequestId: string;
  contractDetails: ContractDetails;
  onContractSigned?: (contractData: any) => void;
  disabled?: boolean;
}

const ContractSigning: React.FC<ContractSigningProps> = ({
  adoptionRequestId,
  contractDetails,
  onContractSigned,
  disabled = false,
}) => {
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signature, setSignature] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 150;

    // Set drawing styles
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Convert canvas to data URL
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL("image/png"));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature("");
  };

  const handleSignContract = async () => {
    if (!isAgreed) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    if (!signature) {
      toast.error("Please provide your signature");
      return;
    }

    setIsSigning(true);

    try {
      const signatureDetails = {
        signature: signature,
        agreedAt: new Date().toISOString(),
        agreedToTerms: true,
      };

      console.log("🔐 Contract signing attempt:", {
        adoptionRequestId,
        signatureDetails,
        token: localStorage.getItem("token") ? "present" : "missing",
      });

      const updatedContract = await adoptionApi.signContract(
        adoptionRequestId,
        signatureDetails
      );

      toast.success("Contract signed successfully!");

      if (onContractSigned) {
        onContractSigned(updatedContract);
      }
    } catch (error: any) {
      console.error("Contract signing failed:", error);
      toast.error(error.response?.data?.message || "Failed to sign contract");
    } finally {
      setIsSigning(false);
    }
  };

  const canSign = contractDetails?.status === "sent" && !disabled;

  if (!canSign) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2 text-gray-600">
          <FileText className="h-5 w-5" />
          <p className="font-medium">Contract Signing Not Available</p>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {contractDetails?.status === "signed"
            ? "This contract has already been signed."
            : "Contract must be sent before it can be signed."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            <CardTitle>Sign Adoption Contract</CardTitle>
          </div>
          <CardDescription>
            Review and sign the adoption contract to complete the process.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Contract Preview */}
          {contractDetails?.content && (
            <div className="space-y-2">
              <Label>Contract Preview</Label>
              <div className="p-4 border rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: contractDetails.content.replace(/\n/g, "<br>"),
                  }}
                />
              </div>
            </div>
          )}

          {/* Agreement Checkbox */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agreement"
              name="agreement"
              value="agreed"
              checked={isAgreed}
              onChange={(checked) => setIsAgreed(checked)}
              label=""
              disabled={disabled}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="agreement"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the terms and conditions
              </Label>
              <p className="text-xs text-muted-foreground">
                By checking this box, I confirm that I have read, understood,
                and agree to all the terms and conditions outlined in this
                adoption contract.
              </p>
            </div>
          </div>

          {/* Signature Canvas */}
          <div className="space-y-2">
            <Label>Digital Signature</Label>
            <div className="border rounded-lg p-4 bg-white">
              <canvas
                ref={canvasRef}
                className="border border-gray-300 rounded cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                  disabled={disabled}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Clear
                </Button>
                <p className="text-xs text-muted-foreground self-center">
                  Draw your signature above
                </p>
              </div>
            </div>
          </div>

          {/* Sign Button */}
          <Button
            onClick={handleSignContract}
            disabled={!isAgreed || !signature || isSigning || disabled}
            className="w-full"
          >
            {isSigning ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Signing Contract...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Sign Contract
              </>
            )}
          </Button>

          {/* Status Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <FileText className="h-4 w-4" />
              <p className="text-sm font-medium">Contract Status</p>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Once signed, this contract will be legally binding and the
              adoption process can proceed to handover.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractSigning;
