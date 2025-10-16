import React, { useState, useEffect } from "react";
import { useVietnamAddress } from "../../hooks/useVietnamAddress";
import { Province, District, Ward } from "../../services/vietnamProvincesApi";
import { ChevronDown, MapPin, Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

interface AddressSelectorProps {
  value?: {
    province?: string;
    district?: string;
    ward?: string;
  };
  onChange?: (address: {
    province: string;
    district: string;
    ward: string;
  }) => void;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  value = {},
  onChange,
  error,
  className,
  disabled = false,
}) => {
  const {
    provinces,
    districts,
    wards,
    selectedAddress,
    loadingProvinces,
    loadingDistricts,
    loadingWards,
    error: apiError,
    setProvince,
    setDistrict,
    setWard,
  } = useVietnamAddress();

  const [isProvinceOpen, setIsProvinceOpen] = useState(false);
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const [isWardOpen, setIsWardOpen] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");

  // Initialize values from props
  useEffect(() => {
    if (
      value.province &&
      !selectedAddress.province &&
      Array.isArray(provinces)
    ) {
      const province = provinces.find((p) => p.name === value.province);
      if (province) {
        setProvince(province);
        setProvinceSearch(province.name);
      }
    }
  }, [value.province, provinces, selectedAddress.province, setProvince]);

  useEffect(() => {
    if (
      value.district &&
      !selectedAddress.district &&
      Array.isArray(districts)
    ) {
      const district = districts.find((d) => d.name === value.district);
      if (district) {
        setDistrict(district);
        setDistrictSearch(district.name);
      }
    }
  }, [value.district, districts, selectedAddress.district, setDistrict]);

  useEffect(() => {
    if (value.ward && !selectedAddress.ward && Array.isArray(wards)) {
      const ward = wards.find((w) => w.name === value.ward);
      if (ward) {
        setWard(ward);
        setWardSearch(ward.name);
      }
    }
  }, [value.ward, wards, selectedAddress.ward, setWard]);

  // Show loading state while provinces are loading
  if (loadingProvinces) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
            <span className="text-gray-600">Loading address data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if API failed
  if (apiError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-red-600">
            <MapPin className="w-5 h-5" />
            <span>Failed to load address data. Please try again.</span>
          </div>
        </div>
      </div>
    );
  }

  // Filter options based on search
  const filteredProvinces = Array.isArray(provinces)
    ? provinces.filter((province) =>
        province.name.toLowerCase().includes(provinceSearch.toLowerCase())
      )
    : [];
  const filteredDistricts = Array.isArray(districts)
    ? districts.filter((district) =>
        district.name.toLowerCase().includes(districtSearch.toLowerCase())
      )
    : [];
  const filteredWards = Array.isArray(wards)
    ? wards.filter((ward) =>
        ward.name.toLowerCase().includes(wardSearch.toLowerCase())
      )
    : [];

  // Handle province selection
  const handleProvinceSelect = (province: Province) => {
    setProvince(province);
    setProvinceSearch(province.name);
    setIsProvinceOpen(false);

    if (onChange) {
      onChange({
        province: province.name,
        district: "",
        ward: "",
      });
    }
  };

  // Handle district selection
  const handleDistrictSelect = (district: District) => {
    setDistrict(district);
    setDistrictSearch(district.name);
    setIsDistrictOpen(false);

    if (onChange) {
      onChange({
        province: selectedAddress.province?.name || "",
        district: district.name,
        ward: "",
      });
    }
  };

  // Handle ward selection
  const handleWardSelect = (ward: Ward) => {
    setWard(ward);
    setWardSearch(ward.name);
    setIsWardOpen(false);

    if (onChange) {
      onChange({
        province: selectedAddress.province?.name || "",
        district: selectedAddress.district?.name || "",
        ward: ward.name,
      });
    }
  };

  const DropdownButton = ({
    isOpen,
    onClick,
    placeholder,
    value,
    loading,
    disabled: buttonDisabled,
  }: {
    isOpen: boolean;
    onClick: () => void;
    placeholder: string;
    value: string;
    loading: boolean;
    disabled: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={buttonDisabled || disabled}
      className={cn(
        "flex items-center justify-between w-full px-3 py-2 text-left bg-white border rounded-md shadow-sm transition-all duration-200",
        error
          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
          : "border-gray-300 focus:border-primary-500 focus:ring-primary-500",
        buttonDisabled || disabled
          ? "bg-gray-50 text-gray-400 cursor-not-allowed"
          : "hover:border-gray-400 focus:outline-none focus:ring-1",
        className
      )}
    >
      <span className={cn("truncate", !value && "text-gray-500")}>
        {value || placeholder}
      </span>
      <div className="flex items-center space-x-1">
        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </div>
    </button>
  );

  const Dropdown = ({
    isOpen,
    children,
    className: dropdownClassName,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
    className?: string;
  }) =>
    isOpen && (
      <div
        className={cn(
          "absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto",
          dropdownClassName
        )}
      >
        {children}
      </div>
    );

  const Option = ({
    option,
    onClick,
    isSelected,
  }: {
    option: { name: string; code: number };
    onClick: () => void;
    isSelected: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors duration-150",
        isSelected && "bg-primary-50 text-primary-700"
      )}
    >
      {option.name}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Province Selector */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Province <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <DropdownButton
            isOpen={isProvinceOpen}
            onClick={() => setIsProvinceOpen(!isProvinceOpen)}
            placeholder="Select province"
            value={provinceSearch}
            loading={loadingProvinces}
            disabled={disabled}
          />
          <Dropdown isOpen={isProvinceOpen}>
            <div className="p-2">
              <input
                type="text"
                placeholder="Search provinces..."
                value={provinceSearch}
                onChange={(e) => setProvinceSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-48 overflow-auto">
              {filteredProvinces.map((province) => (
                <Option
                  key={province.code}
                  option={province}
                  onClick={() => handleProvinceSelect(province)}
                  isSelected={selectedAddress.province?.code === province.code}
                />
              ))}
            </div>
          </Dropdown>
        </div>
      </div>

      {/* District Selector */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          District <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <DropdownButton
            isOpen={isDistrictOpen}
            onClick={() => setIsDistrictOpen(!isDistrictOpen)}
            placeholder="Select district"
            value={districtSearch}
            loading={loadingDistricts}
            disabled={!selectedAddress.province || disabled}
          />
          <Dropdown isOpen={isDistrictOpen}>
            <div className="p-2">
              <input
                type="text"
                placeholder="Search districts..."
                value={districtSearch}
                onChange={(e) => setDistrictSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-48 overflow-auto">
              {filteredDistricts.map((district) => (
                <Option
                  key={district.code}
                  option={district}
                  onClick={() => handleDistrictSelect(district)}
                  isSelected={selectedAddress.district?.code === district.code}
                />
              ))}
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Ward Selector */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ward/Commune <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <DropdownButton
            isOpen={isWardOpen}
            onClick={() => setIsWardOpen(!isWardOpen)}
            placeholder="Select ward/commune"
            value={wardSearch}
            loading={loadingWards}
            disabled={!selectedAddress.district || disabled}
          />
          <Dropdown isOpen={isWardOpen}>
            <div className="p-2">
              <input
                type="text"
                placeholder="Search wards..."
                value={wardSearch}
                onChange={(e) => setWardSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-48 overflow-auto">
              {filteredWards.map((ward) => (
                <Option
                  key={ward.code}
                  option={ward}
                  onClick={() => handleWardSelect(ward)}
                  isSelected={selectedAddress.ward?.code === ward.code}
                />
              ))}
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Error Messages */}
      {(error || apiError) && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <MapPin className="w-4 h-4" />
          <span>{error || apiError}</span>
        </div>
      )}
    </div>
  );
};
