import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToastContext } from "@/components/ui/ToastProvider";

export const VerificationStatus: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastContext();

  const handleResendVerification = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await authApi.resendVerification();
      showToast({
        type: "success",
        title: "Success",
        description: "Verification email sent! Please check your inbox.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        description:
          "Failed to resend verification email. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.isVerified) return null;

  return (
    <Card className="p-4 mb-4 bg-yellow-50 border-yellow-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-yellow-800">
            Email Not Verified
          </h3>
          <p className="text-sm text-yellow-700">
            Please verify your email address to access all features.
          </p>
        </div>
        <Button
          onClick={handleResendVerification}
          disabled={loading}
          variant="outline"
          className="border-yellow-300 hover:bg-yellow-100"
        >
          {loading ? "Sending..." : "Resend Verification Email"}
        </Button>
      </div>
    </Card>
  );
};
