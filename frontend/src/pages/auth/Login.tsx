import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { useToastContext } from "@/components/ui/ToastProvider";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { RedirectManager, UserRole } from "@/utils/redirects";

const Login: React.FC = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    emailOrPhone?: string;
    password?: string;
  }>({});
  const { login } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const togglePasswordVisibility = () => setShowPassword((v) => !v);

  /**
   * Handle form submission
   * Clean 2-channel error display:
   * - Validation errors (400): Only inline field errors, no toast/banner
   * - System errors (401, 500): Only toast, no inline errors
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!emailOrPhone || !password) {
      // Client-side validation: show inline errors, no toast
      setFieldErrors({
        emailOrPhone: !emailOrPhone
          ? "Email or phone number is required"
          : undefined,
        password: !password ? "Password is required" : undefined,
      });
      return;
    }

    try {
      setIsLoading(true);
      const result = await login(emailOrPhone, password);

      if (!result?.success) {
        // ALL errors (400 validation + 401 auth) show as inline field errors
        // No toast notifications - only inline errors

        if (
          result?.status === 400 &&
          result?.fieldErrors &&
          Object.keys(result.fieldErrors).length > 0
        ) {
          // VALIDATION ERROR: Show inline field errors
          const fieldErrors = result.fieldErrors;
          setFieldErrors({
            emailOrPhone: fieldErrors.emailOrPhone,
            password: fieldErrors.password,
          });
        } else {
          // SYSTEM ERROR (401, 500, etc.): Show as inline error under password field
          setFieldErrors({
            emailOrPhone: undefined,
            password: result?.userMessage || "Login failed. Please try again.",
          });
        }
        return; // Exit early - no toast, no other error display
      }

      // Login successful - redirect without toast
      const userRole = result.userRole || result.data?.user?.role;
      RedirectManager.redirectAfterLogin(navigate, userRole as UserRole);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Welcome back! 👋
        </h2>
        <p className="text-sm text-gray-500 sm:text-base">
          Sign in to your account to continue
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <Input
          id="emailOrPhone"
          label="Email or Phone"
          type="text"
          required
          fullWidth
          leftIcon={<Mail size={20} className="text-gray-400" />}
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
          placeholder="Enter your email or phone number"
          autoFocus
          error={fieldErrors.emailOrPhone}
          helperText={fieldErrors.emailOrPhone}
        />

        <Input
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          required
          fullWidth
          leftIcon={<Lock size={20} className="text-gray-400" />}
          rightIcon={
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff
                  size={20}
                  className="text-gray-400 hover:text-gray-600"
                />
              ) : (
                <Eye size={20} className="text-gray-400 hover:text-gray-600" />
              )}
            </button>
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          error={fieldErrors.password}
          helperText={fieldErrors.password}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-gray-900"
            >
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <LoadingButton
          type="submit"
          loading={isLoading}
          disabled={isLoading}
          className="w-full"
        >
          Sign in
        </LoadingButton>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </>
  );
};

export default Login;
