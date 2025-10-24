import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Mail } from "lucide-react";
import { useToastContext } from "@/components/ui/ToastProvider";
import { handleApiError } from "@/utils/error-handler";
import { RedirectManager } from "@/utils/redirects";
import { authApi } from "@/services/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const { showToast } = useToastContext();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string>("Verifying your email...");
  const [isResending, setIsResending] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    // Prevent multiple verification attempts
    if (mounted.current) return;
    mounted.current = true;

    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing");
      return;
    }

    // Only make the API call once when the component mounts
    verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Email verified successfully! You can now log in.");
        showToast({
          type: "success",
          title: "Email verified",
          description:
            "Your email has been verified successfully. You can now log in.",
        });
        // Redirect to login after 3 seconds
        setTimeout(() => RedirectManager.redirectToLogin(navigate), 3000);
      })
      .catch((error: any) => {
        setStatus("error");
        const errorMessage = handleApiError(error, "Failed to verify email.");
        setMessage(errorMessage);
        showToast({
          type: "error",
          title: "Verification failed",
          description: errorMessage,
        });
      });
  }, []); // Empty dependency array ensures the effect runs only once on mount

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      const email = localStorage.getItem("pendingVerificationEmail");

      if (!email) {
        setMessage("No pending verification found");
        return;
      }

      // Use the authApi instead of direct fetch to ensure proper URL construction
      const data = await authApi.resendVerificationEmail(email);

      if (data.success) {
        setMessage(
          "Verification email sent successfully! Please check your inbox."
        );
        showToast({
          type: "success",
          title: "Verification email sent",
          description: "Please check your inbox for the verification link.",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to resend verification email";
      setMessage(errorMessage);
      showToast({
        type: "error",
        title: "Resend failed",
        description: errorMessage,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <div className="flex justify-center">
          <Mail className="h-12 w-12 text-primary" />
        </div>
        <h2 className="mt-6 text-xl font-bold text-gray-900 sm:text-2xl">
          Email Verification
        </h2>
        <div className="mt-4">
          {status === "loading" && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          <p
            className={`mt-2 text-sm ${
              status === "error"
                ? "text-red-600"
                : status === "success"
                ? "text-green-600"
                : "text-gray-600"
            }`}
          >
            {message}
          </p>
        </div>
      </div>
      <p className="text-center text-base text-gray-900 font-semibold mt-8">
        Back to{" "}
        <Link
          to="/login"
          className="text-primary-600 hover:text-primary-500 font-semibold underline transition-colors"
        >
          Login
        </Link>
      </p>
      <div className="mt-6">
        {status === "error" && (
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Didn't receive the email? Check your spam folder or click below to
              resend.
            </p>
            <Button
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? "Sending..." : "Resend Verification Email"}
            </Button>
            <Button
              onClick={() => RedirectManager.redirectToLogin(navigate)}
              variant="outline"
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Redirecting to login page...
            </p>
          </div>
        )}
      </div>
    </>
  );
}
