import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { RedirectManager } from "@/utils/redirects";
import { useToastContext } from "@/components/ui/ToastProvider";

type ResetPasswordFormData = {
  password: string;
  confirmPassword: string;
};

export default function ResetPassword() {
  const { token: pathToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get("token");
  // Use path token first, then query token
  const token = pathToken || queryToken || "";

  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { showToast } = useToastContext();

  // Show/Hide toggles
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const pwd = watch("password");
  const confirm = watch("confirmPassword");
  const canSubmit = useMemo(
    () => !isLoading && !!pwd && !!confirm,
    [isLoading, pwd, confirm]
  );

  const onSubmit = async (data: ResetPasswordFormData) => {
    // Frontend matching check
    if (data.password !== data.confirmPassword) {
      setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }

    // Token guard
    if (!token) {
      showToast({
        type: "error",
        title: "Invalid link",
        description: "The reset link is missing or invalid. Please request a new one.",
      });
      return;
    }

    try {
      setIsLoading(true);
      // IMPORTANT: send both password + confirmPassword (backend requires both)
      await resetPassword(token, data.password, data.confirmPassword);

      showToast({
        type: "success",
        title: "Password updated",
        description: "Your password has been reset successfully. Please log in.",
      });

      RedirectManager.redirectToLogin(navigate);
    } catch (err: any) {
      // Surface backend validation (e.g., Joi) if available
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "We couldn't reset your password. Please try again.";
      showToast({
        type: "error",
        title: "Reset failed",
        description: message,
      });

      // Map common validation back to field error
      if (message?.toLowerCase()?.includes("confirm")) {
        setError("confirmPassword", { type: "manual", message });
      }
      console.error("Reset password error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Reset your password</h2>
        <p className="text-sm text-gray-500 sm:text-base">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* New Password */}
        <Input
          label="New Password"
          type={showPwd ? "text" : "password"}
          required
          fullWidth
          placeholder="Enter your new password"
          leftIcon={<Lock size={20} className="text-gray-400" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Hide password" : "Show password"}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded"
            >
              {showPwd ? (
                <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye size={20} className="text-gray-400 hover:text-gray-600" />
              )}
            </button>
          }
          error={errors.password?.message}
          {...register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "At least 8 characters" },
          })}
        />

        {/* Confirm Password */}
        <Input
          label="Confirm Password"
          type={showConfirm ? "text" : "password"}
          required
          fullWidth
          placeholder="Confirm your new password"
          leftIcon={<Lock size={20} className="text-gray-400" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded"
            >
              {showConfirm ? (
                <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye size={20} className="text-gray-400 hover:text-gray-600" />
              )}
            </button>
          }
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (v) => v === pwd || "Passwords do not match",
          })}
        />

        <LoadingButton
          type="submit"
          loading={isLoading}
          disabled={!canSubmit}
          className={`w-full text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-lg shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 ${
            canSubmit
              ? "bg-gradient-to-r from-[#6171f7] to-[#f577b7] hover:from-[#4f5fd8] hover:to-[#e065a3] focus-visible:ring-offset-[#6171f7]"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {isLoading ? "Updating..." : "Reset Password"}
        </LoadingButton>
      </form>

      <p className="text-center text-base text-gray-900 font-semibold mt-8">
        Remembered your password?{" "}
        <Link
          to="/login"
          className="text-primary-600 hover:text-primary-500 font-semibold underline transition-colors"
        >
          Login
        </Link>
      </p>
    </>
  );
}
