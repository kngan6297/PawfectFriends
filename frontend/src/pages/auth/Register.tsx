import { useState, useEffect, useCallback, memo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";

import { ConfettiAnimation } from "@/components/ui/ConfettiAnimation";
import { useAuth } from "@/context/AuthContext";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { useToastContext } from "@/components/ui/ToastProvider";
import { Input } from "@/components/ui/Input";
import { AddressSelector } from "@/components/ui/AddressSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

import {
  registerSchema,
  shelterRegisterSchema,
} from "@/utils/validationSchemas";

type RegisterFormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: "user" | "shelter" | "";
};

// Memoized form field component with Controller
const FormField = memo(
  ({ id, label, type, leftIcon, control, name, rules, ...props }: any) => (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <Input
          {...field}
          id={id}
          label={label}
          type={type}
          leftIcon={leftIcon}
          error={fieldState.error?.message}
          fullWidth
          required
          {...props}
        />
      )}
    />
  )
);
FormField.displayName = "FormField";

// Memoized password field component with Controller
const PasswordField = memo(
  ({
    id,
    label,
    showPassword,
    onToggle,
    control,
    name,
    rules,
    ...props
  }: any) => (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <Input
          {...field}
          id={id}
          label={label}
          type={showPassword ? "text" : "password"}
          leftIcon={<Lock size={20} className="text-gray-400" />}
          rightIcon={
            <button
              type="button"
              onClick={onToggle}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye size={20} className="text-gray-400 hover:text-gray-600" />
              )}
            </button>
          }
          error={fieldState.error?.message}
          fullWidth
          required
          {...props}
        />
      )}
    />
  )
);
PasswordField.displayName = "PasswordField";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);

  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const { showToast } = useToastContext();
  const [searchParams] = useSearchParams();
  const [selectedAddress, setSelectedAddress] = useState({
    province: "",
    district: "",
    ward: "",
  });
  const [street, setStreet] = useState("");
  const initialRole = searchParams.get("role") === "shelter" ? "shelter" : "";
  const [selectedRole, setSelectedRole] = useState<"user" | "shelter" | "">(initialRole);

  const {
    control,
    handleSubmit,
    setError,
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: initialRole,
    },
  });

  const role = selectedRole;
  const schema = role === "shelter" ? shelterRegisterSchema : registerSchema;
  const maxStep = role === "shelter" ? 2 : 1;
  const passwordValue = watch("password");

  // Reset step when role changes
  useEffect(() => {
    setStep(1);
  }, [role]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((v) => !v);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword((v) => !v);
  }, []);

  const handleNext = useCallback(() => {
    if (step < maxStep) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step, maxStep]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Multi-step only for shelter; step 1 validates basic info then go to address
      if (role === "shelter" && step < maxStep) {
        const currentStepFields =
          step === 1
            ? ["name", "email", "phone", "password", "confirmPassword"]
            : []; // step 2 has only address fields (outside RHF)
        const currentStepData = Object.fromEntries(
          Object.entries(data).filter(([key]) => currentStepFields.includes(key))
        );

        if (step === 1) {
          if (currentStepData.password !== currentStepData.confirmPassword) {
            setError("confirmPassword", {
              type: "manual",
              message: "Passwords do not match",
            });
            return;
          }
        }

        handleNext();
        return;
      }

      await schema.parseAsync(data);

      // Validate address form for shelter registration
      if (
        role === "shelter" &&
        (!selectedAddress.province ||
          !selectedAddress.district ||
          !selectedAddress.ward ||
          !street.trim())
      ) {
        showToast({
          type: "error",
          title: "Incomplete Address",
          description:
            "Please complete the address selection including province, district, ward, and street address.",
        });
        return;
      }

      // Transform data for backend
      const cleanedData: any = {
        ...data,
        role: role,
        password: data.password.trim(),
        confirmPassword: data.confirmPassword.trim(),
        ...(role === "shelter" && {
          location: {
            version: "v1",
            province: {
              code: 79, // TODO: map real code
              name: selectedAddress.province,
              codename: selectedAddress.province.toLowerCase().replace(/\s+/g, "_"),
              division_type: "central city",
              phone_code: 28,
            },
            district: {
              code: 769, // TODO: map real code
              name: selectedAddress.district,
              codename: selectedAddress.district.toLowerCase().replace(/\s+/g, "_"),
              division_type: "district",
              province_code: 79,
            },
            ward: {
              code: 26734, // TODO: map real code
              name: selectedAddress.ward,
              codename: selectedAddress.ward.toLowerCase().replace(/\s+/g, "_"),
              division_type: "ward",
              district_code: 769,
            },
            details: {
              street: street,
              note: "",
            },
            postalCode: "700000",
            country: "VN",
            formatted: `${street}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.province}, 700000, VN`,
          },
        }),
      };

      if (cleanedData.password !== cleanedData.confirmPassword) {
        setError("confirmPassword", {
          type: "manual",
          message: "Passwords do not match",
        });
        return;
      }

      setIsLoading(true);

      const res = await registerUser(cleanedData);

      if (res.success) {
        localStorage.setItem("pendingVerificationEmail", cleanedData.email);
        setShowConfetti(true);

        showToast({
          type: "success",
          title: "Welcome to PawfectFriends! 🐾",
          description:
            "Your account has been created successfully! Please check your email to verify your account.",
        });

        setTimeout(() => setShowConfetti(false), 3000);
        setTimeout(() => navigate("/verify-email"), 1000);
      } else {
        showToast({
          type: "error",
          title: "Oops! Something went wrong",
          description:
            "We couldn't create your account right now. Please try again.",
        });
      }
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => {
          setError(err.path[0], { message: err.message });
        });
        return;
      }

      if (error.response?.data) {
        const { message, existing } = error.response.data;

        if (existing) {
          if (existing.email) {
            setError("email", { message: "This email is already registered" });
          }
          if (existing.phone) {
            setError("phone", {
              message: "This phone number is already registered",
            });
          }
          return;
        }

        showToast({
          type: "error",
          title: "Oops! Something went wrong",
          description:
            message ||
            "We couldn't create your account right now. Please try again.",
        });
        return;
      }

      showToast({
        type: "error",
        title: "Connection Issue",
        description: "Please check your internet connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ConfettiAnimation
        isVisible={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      {isLoading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-2xl pointer-events-none z-50 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-primary-600 font-medium">
              Creating your account...
            </span>
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Let's get you pawsome! ✨
        </h2>
        <p className="text-sm text-gray-500 sm:text-base">
          {role === "shelter"
            ? "🐾 Join the squad, adopt the vibe."
            : role === "user"
            ? "One click closer to your new bestie! 😻"
            : "Choose your account type to get started! ✨"}
        </p>
      </div>

      {role === "shelter" && maxStep > 1 && (
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-xs text-gray-600 sm:text-sm">
            <span>
              Step {step} of {maxStep}
            </span>
            <span className="text-primary-600 font-medium">
              {step === 1 ? "Basic Info ✨" : "Shelter Address 🏠"}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / maxStep) * 100}%` }}
            />
          </div>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {/* Role */}
        <div>
          <Select
            value={role}
            onValueChange={(value: "user" | "shelter") => {
              setSelectedRole(value);
              setValue("role", value, { shouldValidate: true });
            }}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Pet Owner</SelectItem>
              <SelectItem value="shelter">Shelter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* Step 1 (for both user and shelter) */}
          {(role === "user" || (role === "shelter" && step === 1)) && (
            <>
              <FormField
                id="name"
                label={role === "shelter" ? "Shelter Name" : "Full Name"}
                type="text"
                autoComplete="name"
                leftIcon={<User size={20} className="text-gray-400" />}
                control={control}
                name="name"
                placeholder={role === "shelter" ? "Enter shelter name" : "Enter your full name"}
              />

              <FormField
                id="email"
                label="Email address"
                type="email"
                autoComplete="email"
                leftIcon={<Mail size={20} className="text-gray-400" />}
                control={control}
                name="email"
                placeholder="Enter your email address"
              />

              <FormField
                id="phone"
                label="Phone number"
                type="tel"
                autoComplete="tel"
                leftIcon={<Phone size={20} className="text-gray-400" />}
                control={control}
                name="phone"
                placeholder="Enter your phone number"
              />

              <PasswordField
                id="password"
                label="Password"
                autoComplete="new-password"
                showPassword={showPassword}
                onToggle={togglePasswordVisibility}
                control={control}
                name="password"
                placeholder="Enter your password"
              />

              <PasswordField
                id="confirmPassword"
                label="Confirm Password"
                autoComplete="new-password"
                showPassword={showConfirmPassword}
                onToggle={toggleConfirmPasswordVisibility}
                control={control}
                name="confirmPassword"
                rules={{
                  validate: (value: string) =>
                    value === passwordValue || "Passwords do not match",
                }}
                placeholder="Re-enter your password"
              />
            </>
          )}

          {/* Step 2 (shelter address only) */}
          {role === "shelter" && step === 2 && (
            <>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Shelter Location <span className="text-red-500">*</span>
                </label>
                <AddressSelector
                  value={selectedAddress}
                  onChange={(address) => {
                    setSelectedAddress(address);
                  }}
                  error={
                    !selectedAddress.province ||
                    !selectedAddress.district ||
                    !selectedAddress.ward
                      ? "Please complete the address selection"
                      : undefined
                  }
                />
              </div>

              <div className="relative">
                <label
                  htmlFor="street"
                  className="block text-sm font-medium text-gray-700"
                >
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="street"
                  type="text"
                  value={street}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setStreet(e.target.value)
                  }
                  placeholder="Enter street address (e.g., 123 Main Street)"
                  className="mt-1 block w-full rounded-md shadow-sm sm:text-sm transition-all duration-300 pr-10 focus:shadow-lg focus:shadow-primary-200/50 bg-white text-gray-900 border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {role === "shelter" && maxStep > 1 ? (
          <div className="flex space-x-3 sm:space-x-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                Back
              </button>
            )}
            <LoadingButton
              type="submit"
              loading={isLoading}
              className={`flex-1 bg-gradient-to-r from-[#6171f7] to-[#f577b7] hover:from-[#4f5fd8] hover:to-[#e065a3] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-lg shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6171f7] ${
                step === 1 ? "w-full" : ""
              }`}
            >
              {step < maxStep ? "Next ✨" : "Register Shelter 🏠"}
            </LoadingButton>
          </div>
        ) : role ? (
          <LoadingButton
            type="submit"
            loading={isLoading}
            className="w-full bg-gradient-to-r from-[#6171f7] to-[#f577b7] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-lg shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6171f7]"
          >
            Register ✨
          </LoadingButton>
        ) : (
          <LoadingButton
            type="submit"
            loading={isLoading}
            disabled
            className="w-full bg-gray-300 text-gray-500 font-semibold py-3 px-4 rounded-lg cursor-not-allowed"
          >
            Select Account Type
          </LoadingButton>
        )}
      </form>

      <div className="mt-8 mb-2 bg-gray-50 rounded-xl px-4 py-4">
        <div className="border-t border-gray-200 mb-4"></div>
        <p className="text-center text-sm text-gray-700 font-medium">
          By signing up, you agree to our{" "}
          <Link
            to="/terms"
            className="underline hover:text-primary-500 transition-colors"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy"
            className="underline hover:text-primary-500 transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <p className="text-center text-base text-gray-900 font-semibold mt-3">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-500 font-semibold underline transition-colors"
          >
            Login
          </Link>
        </p>
      </div>
    </>
  );
}
