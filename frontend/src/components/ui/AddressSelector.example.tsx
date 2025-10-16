import React, { useState } from "react";
import { AddressSelector } from "./AddressSelector";

// Example usage of AddressSelector component
export const AddressSelectorExample: React.FC = () => {
  const [address, setAddress] = useState({
    province: "",
    district: "",
    ward: "",
  });

  const handleAddressChange = (newAddress: {
    province: string;
    district: string;
    ward: string;
  }) => {
    setAddress(newAddress);
    console.log("Address changed:", newAddress);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Address Selector Example</h2>

      <AddressSelector
        value={address}
        onChange={handleAddressChange}
        className="mb-4"
      />

      <div className="mt-4 p-4 bg-gray-100 rounded-md">
        <h3 className="font-medium mb-2">Selected Address:</h3>
        <p>
          <strong>Province:</strong> {address.province || "Not selected"}
        </p>
        <p>
          <strong>District:</strong> {address.district || "Not selected"}
        </p>
        <p>
          <strong>Ward:</strong> {address.ward || "Not selected"}
        </p>
      </div>
    </div>
  );
};
