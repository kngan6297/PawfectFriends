import React, { useState } from "react";
import { User, Mail, Lock, Phone, Search } from "lucide-react";
import { Input } from "./Input";

export const InputExample: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    search: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  return (
    <div className="p-8 space-y-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-8">
        Input Component Examples
      </h2>

      {/* Basic Input */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Input</h3>
        <Input
          id="name"
          label="Full Name"
          value={formData.name}
          onChange={handleChange("name")}
          leftIcon={<User size={20} className="text-gray-400" />}
          placeholder="Enter your full name"
        />
      </div>

      {/* Email Input */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Email Input</h3>
        <Input
          id="email"
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleChange("email")}
          leftIcon={<Mail size={20} className="text-gray-400" />}
          placeholder="Enter your email"
          error="Please enter a valid email address"
        />
      </div>

      {/* Password Input with Toggle */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Password Input with Toggle</h3>
        <Input
          id="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleChange("password")}
          leftIcon={<Lock size={20} className="text-gray-400" />}
          enablePasswordToggle={true}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          placeholder="Enter your password"
        />
      </div>

      {/* Password Input with Internal Toggle */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Password Input (Internal Toggle)
        </h3>
        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange("confirmPassword")}
          leftIcon={<Lock size={20} className="text-gray-400" />}
          enablePasswordToggle={true}
          placeholder="Confirm your password"
        />
      </div>

      {/* Phone Input with Right Icon */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Phone Input with Right Icon</h3>
        <Input
          id="phone"
          label="Phone Number"
          type="tel"
          value={formData.phone}
          onChange={handleChange("phone")}
          leftIcon={<Phone size={20} className="text-gray-400" />}
          rightIcon={<div className="text-green-500">✓</div>}
          placeholder="Enter your phone number"
        />
      </div>

      {/* Search Input */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Search Input</h3>
        <Input
          id="search"
          label="Search"
          value={formData.search}
          onChange={handleChange("search")}
          leftIcon={<Search size={20} className="text-gray-400" />}
          placeholder="Search for something..."
        />
      </div>

      {/* Error States */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Error States</h3>
        <Input
          id="error-example"
          label="Error Input"
          value=""
          onChange={() => {}}
          leftIcon={<User size={20} className="text-gray-400" />}
          rightIcon={<div className="text-blue-500">ℹ</div>}
          error="This field is required"
          placeholder="This will show error icon instead of right icon"
        />
      </div>

      {/* Controlled vs Uncontrolled */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Controlled Input (React Hook Form Compatible)
        </h3>
        <Input
          id="controlled"
          label="Controlled Input"
          value={formData.name}
          onChange={handleChange("name")}
          leftIcon={<User size={20} className="text-gray-400" />}
          placeholder="This input properly syncs with external value"
        />
      </div>

      {/* Floating Label Behavior */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Floating Label Behavior</h3>
        <Input
          id="floating"
          label="Floating Label"
          value=""
          onChange={() => {}}
          leftIcon={<User size={20} className="text-gray-400" />}
          placeholder="Focus this input to see smooth label animation"
        />
      </div>

      {/* Full Width Input */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Full Width Input</h3>
        <Input
          id="fullwidth"
          label="Full Width"
          value=""
          onChange={() => {}}
          fullWidth={true}
          leftIcon={<User size={20} className="text-gray-400" />}
          placeholder="This input takes full width"
        />
      </div>

      {/* Helper Text */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Input with Helper Text</h3>
        <Input
          id="helper"
          label="Helper Text Example"
          value=""
          onChange={() => {}}
          leftIcon={<User size={20} className="text-gray-400" />}
          placeholder="Enter your username"
          helperText="Username must be at least 3 characters long"
        />
      </div>
    </div>
  );
};

export default InputExample;
