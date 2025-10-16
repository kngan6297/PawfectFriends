import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { useToastContext } from "../../../components/ui/ToastProvider";
import { adoptionApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface AdoptionApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
}

interface OtherPet {
  type: string;
  species: string;
  age: number;
  description: string;
}

interface Reference {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  yearsKnown: number;
}

export const AdoptionApplicationModal: React.FC<
  AdoptionApplicationModalProps
> = ({ isOpen, onClose, petId, petName }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingRequest, setHasExistingRequest] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);
  const { showToast } = useToastContext();
  const { user } = useAuth();

  // Check for existing adoption request when modal opens
  useEffect(() => {
    const checkExistingRequest = async () => {
      if (isOpen && user?._id) {
        setIsCheckingExisting(true);
        try {
          const userRequests = await adoptionApi.getUserRequests();
          const existingRequest = userRequests.data.find(
            (request: any) =>
              request.pet === petId &&
              [
                "pending",
                "approved",
                "scheduled",
                "completed",
                "rejected",
              ].includes(request.status)
          );
          setHasExistingRequest(!!existingRequest);
        } catch (error) {
          console.error("Error checking existing requests:", error);
          // Don't show error to user, just assume no existing request
          setHasExistingRequest(false);
        } finally {
          setIsCheckingExisting(false);
        }
      }
    };

    checkExistingRequest();
  }, [isOpen, petId, user?._id]);

  const [formData, setFormData] = useState({
    housingType: "" as "house" | "apartment" | "condo" | "other",
    hasYard: false,
    yardDetails: {
      isFenced: false,
      size: "",
    },
    hasOtherPets: false,
    otherPetsDetails: [] as OtherPet[],
    hasChildren: false,
    childrenAges: [] as number[],
    workSchedule: "",
    experience: "",
    reasonForAdopting: "",
    plannedCareRoutine: "",
    veterinarianInfo: {
      name: "",
      contact: "",
      clinic: "",
    },
    references: [
      {
        name: "",
        relationship: "",
        phone: "",
        email: "",
        yearsKnown: 0,
      },
    ] as Reference[],
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    const checked = isCheckbox
      ? (e.target as HTMLInputElement).checked
      : undefined;

    setFormData((prev) => {
      const keys = name.split(".");
      const newData = { ...prev };

      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      const lastKey = keys[keys.length - 1];
      current[lastKey] = isCheckbox ? checked : value;

      // Clear veterinarian info and other pets details when hasOtherPets is unchecked
      if (name === "hasOtherPets" && !checked) {
        console.log("Clearing veterinarian info and other pets details");
        newData.veterinarianInfo = {
          name: "",
          contact: "",
          clinic: "",
        };
        newData.otherPetsDetails = [];
      }

      return newData;
    });
  };

  const addOtherPet = () => {
    setFormData((prev) => ({
      ...prev,
      otherPetsDetails: [
        ...prev.otherPetsDetails,
        { type: "", species: "", age: 0, description: "" },
      ],
    }));
  };

  const removeOtherPet = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      otherPetsDetails: prev.otherPetsDetails.filter((_, i) => i !== index),
    }));
  };

  const updateOtherPet = (
    index: number,
    field: keyof OtherPet,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      otherPetsDetails: prev.otherPetsDetails.map((pet, i) =>
        i === index ? { ...pet, [field]: value } : pet
      ),
    }));
  };

  const addChildAge = () => {
    setFormData((prev) => ({
      ...prev,
      childrenAges: [...prev.childrenAges, 0],
    }));
  };

  const removeChildAge = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      childrenAges: prev.childrenAges.filter((_, i) => i !== index),
    }));
  };

  const updateChildAge = (index: number, value: number) => {
    setFormData((prev) => ({
      ...prev,
      childrenAges: prev.childrenAges.map((age, i) =>
        i === index ? value : age
      ),
    }));
  };

  const addReference = () => {
    setFormData((prev) => ({
      ...prev,
      references: [
        ...prev.references,
        { name: "", relationship: "", phone: "", email: "", yearsKnown: 0 },
      ],
    }));
  };

  const removeReference = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index),
    }));
  };

  const updateReference = (
    index: number,
    field: keyof Reference,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      references: prev.references.map((ref, i) =>
        i === index ? { ...ref, [field]: value } : ref
      ),
    }));
  };

  const validateVetInfo = () => {
    const { name, contact, clinic } = formData.veterinarianInfo;
    console.log("Validating veterinarian info:", { name, contact, clinic });
    if (!name || !contact || !clinic) {
      console.log("Veterinarian validation failed - missing fields");
      showToast({
        type: "error",
        title: "Missing Information",
        description:
          "Please provide complete veterinarian information since you have other pets.",
      });
      // Scroll to the veterinarian information section for better UX
      document
        .getElementById("vetName")
        ?.scrollIntoView({ behavior: "smooth" });
      return false;
    }
    console.log("Veterinarian validation passed");
    return true;
  };

  const validateForm = () => {
    // Basic required field validation
    if (!formData.housingType) {
      showToast({
        type: "error",
        title: "Missing Information",
        description: "Please select your housing type.",
      });
      return false;
    }

    if (!formData.workSchedule) {
      showToast({
        type: "error",
        title: "Missing Information",
        description: "Please provide your work schedule.",
      });
      return false;
    }

    if (!formData.reasonForAdopting) {
      showToast({
        type: "error",
        title: "Missing Information",
        description: "Please provide a reason for adopting.",
      });
      return false;
    }

    // Validate other pets details when hasOtherPets is true
    if (formData.hasOtherPets) {
      if (formData.otherPetsDetails.length === 0) {
        showToast({
          type: "error",
          title: "Missing Information",
          description: "Please provide details about your other pets.",
        });
        return false;
      }

      // Check if all other pets have required fields
      for (let i = 0; i < formData.otherPetsDetails.length; i++) {
        const pet = formData.otherPetsDetails[i];
        if (!pet.type || !pet.species || !pet.age || !pet.description) {
          showToast({
            type: "error",
            title: "Missing Information",
            description: `Please complete all fields for pet ${i + 1}.`,
          });
          return false;
        }
      }

      // Validate veterinarian information when hasOtherPets is true
      if (!validateVetInfo()) {
        return false;
      }
    }

    // Validate children ages when hasChildren is true
    if (formData.hasChildren && formData.childrenAges.length === 0) {
      showToast({
        type: "error",
        title: "Missing Information",
        description: "Please provide ages for your children.",
      });
      return false;
    }

    // Validate references
    if (formData.references.length === 0) {
      showToast({
        type: "error",
        title: "Missing Information",
        description: "Please provide at least one reference.",
      });
      return false;
    }

    // Check if all references have required fields
    for (let i = 0; i < formData.references.length; i++) {
      const reference = formData.references[i];
      if (!reference.name || !reference.relationship) {
        showToast({
          type: "error",
          title: "Missing Information",
          description: `Please complete name and relationship for reference ${
            i + 1
          }.`,
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for existing request before submitting
    if (hasExistingRequest) {
      showToast({
        type: "error",
        title: "Already Applied",
        description:
          "You have already submitted an adoption request for this pet. Please check your adoption requests.",
      });
      return;
    }

    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Clean up form data to match validation schema
      const cleanedFormData = {
        ...formData,
        // Remove veterinarianInfo if hasOtherPets is false
        veterinarianInfo: formData.hasOtherPets
          ? formData.veterinarianInfo
          : undefined,
        // Remove otherPetsDetails if hasOtherPets is false
        otherPetsDetails: formData.hasOtherPets
          ? formData.otherPetsDetails
          : undefined,
        // Remove childrenAges if hasChildren is false
        childrenAges: formData.hasChildren ? formData.childrenAges : undefined,
        // Remove yardDetails if hasYard is false
        yardDetails: formData.hasYard ? formData.yardDetails : undefined,
      } as any; // Use any to bypass TypeScript strictness for API call

      console.log(
        "🐾 Submitting form data:",
        JSON.stringify(cleanedFormData, null, 2)
      );
      await adoptionApi.createRequest(petId, cleanedFormData);
      showToast({
        type: "success",
        title: "Success",
        description: "Adoption request submitted successfully",
      });
      onClose();
    } catch (error: unknown) {
      console.error("🐾 Adoption request error:", error);
      console.error("🐾 Error response:", (error as any)?.response?.data);
      console.error(
        "🐾 Validation errors:",
        (error as any)?.response?.data?.errors
      );
      let errorMessage = "Failed to submit adoption request";

      if (error instanceof Error) {
        // Handle specific error cases
        if (error.message.includes("already submitted")) {
          errorMessage =
            "You have already submitted an adoption request for this pet. Please check your adoption requests.";
        } else if (error.message.includes("not available")) {
          errorMessage = "This pet is no longer available for adoption.";
        } else if (error.message.includes("not found")) {
          errorMessage = "Pet not found. Please try again.";
        } else {
          errorMessage = error.message;
        }
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
      ) {
        errorMessage = (error as any).message;
      }

      showToast({
        type: "error",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg max-w-4xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-2xl font-semibold text-gray-900">
              Adopt {petName}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Show warning if user already has an existing request */}
          {hasExistingRequest && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Already Applied
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      You have already submitted an adoption request for{" "}
                      {petName}. Please check your adoption requests to see the
                      current status.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show loading state while checking for existing requests */}
          {isCheckingExisting && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-sm text-blue-700">
                  Checking existing applications...
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Housing Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  value={formData.housingType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      housingType: value as
                        | "house"
                        | "apartment"
                        | "condo"
                        | "other",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select housing type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Yard Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasYard"
                    name="hasYard"
                    checked={formData.hasYard}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasYard" className="text-sm text-gray-700">
                    Do you have a yard?
                  </label>
                </div>

                {formData.hasYard && (
                  <>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isFenced"
                        name="yardDetails.isFenced"
                        checked={formData.yardDetails.isFenced}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isFenced"
                        className="text-sm text-gray-700"
                      >
                        Is the yard fenced?
                      </label>
                    </div>

                    <Input
                      id="yardSize"
                      name="yardDetails.size"
                      label="Yard Size"
                      value={formData.yardDetails.size}
                      onChange={handleInputChange}
                      placeholder="e.g., 500 sq ft"
                    />
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Pet Experience
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasOtherPets"
                    name="hasOtherPets"
                    checked={formData.hasOtherPets}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="hasOtherPets"
                    className="text-sm text-gray-700"
                  >
                    Do you have other pets?
                  </label>
                </div>

                {formData.hasOtherPets && (
                  <div className="space-y-4">
                    {formData.otherPetsDetails.map((pet, index) => (
                      <div key={index} className="border p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium">Pet {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeOtherPet(index)}
                            className="text-red-500 hover:text-red-700"
                            aria-label={`Remove pet ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Pet Type"
                            value={pet.type}
                            onChange={(e) =>
                              updateOtherPet(index, "type", e.target.value)
                            }
                            placeholder="e.g., Dog, Cat, Bird"
                            required
                          />
                          <Input
                            label="Species/Breed"
                            value={pet.species}
                            onChange={(e) =>
                              updateOtherPet(index, "species", e.target.value)
                            }
                            placeholder="e.g., Golden Retriever"
                            required
                          />
                          <Input
                            label="Age"
                            type="number"
                            value={pet.age}
                            onChange={(e) =>
                              updateOtherPet(
                                index,
                                "age",
                                parseInt(e.target.value)
                              )
                            }
                            placeholder="Age in years"
                            required
                          />
                          <Input
                            label="Description"
                            value={pet.description}
                            onChange={(e) =>
                              updateOtherPet(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="Brief description"
                            required
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addOtherPet}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Pet
                    </Button>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasChildren"
                    name="hasChildren"
                    checked={formData.hasChildren}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="hasChildren"
                    className="text-sm text-gray-700"
                  >
                    Do you have children?
                  </label>
                </div>

                {formData.hasChildren && (
                  <div className="space-y-4">
                    {formData.childrenAges.map((age, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          label={`Child ${index + 1} Age`}
                          type="number"
                          value={age}
                          onChange={(e) =>
                            updateChildAge(index, parseInt(e.target.value))
                          }
                          placeholder="Age in years"
                          className="flex-1"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeChildAge(index)}
                          className="text-red-500 hover:text-red-700 mt-6"
                          aria-label={`Remove child ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addChildAge}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Child
                    </Button>
                  </div>
                )}

                <Input
                  id="workSchedule"
                  name="workSchedule"
                  label="Work Schedule"
                  value={formData.workSchedule}
                  onChange={handleInputChange}
                  placeholder="e.g., 9-5, work from home, etc."
                  required
                />

                <Textarea
                  id="experience"
                  name="experience"
                  label="Pet Experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="Tell us about your experience with pets..."
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Adoption Details
              </h3>
              <div className="space-y-4">
                <Textarea
                  id="reasonForAdopting"
                  name="reasonForAdopting"
                  label="Reason for Adopting"
                  value={formData.reasonForAdopting}
                  onChange={handleInputChange}
                  placeholder="Why do you want to adopt this pet?"
                  required
                />

                <Textarea
                  id="plannedCareRoutine"
                  name="plannedCareRoutine"
                  label="Planned Care Routine"
                  value={formData.plannedCareRoutine}
                  onChange={handleInputChange}
                  placeholder="Describe how you plan to care for the pet..."
                />
              </div>
            </div>

            {formData.hasOtherPets && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Veterinarian Information
                  </h3>
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    Required
                  </span>
                </div>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Since you have other pets, we require your veterinarian
                    information to ensure proper care coordination.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="vetName"
                    name="veterinarianInfo.name"
                    label="Veterinarian Name"
                    value={formData.veterinarianInfo.name}
                    onChange={handleInputChange}
                    placeholder="Name of your veterinarian"
                    required={formData.hasOtherPets}
                  />

                  <Input
                    id="vetContact"
                    name="veterinarianInfo.contact"
                    label="Veterinarian Contact"
                    value={formData.veterinarianInfo.contact}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                    required={formData.hasOtherPets}
                  />

                  <Input
                    id="vetClinic"
                    name="veterinarianInfo.clinic"
                    label="Clinic Name"
                    value={formData.veterinarianInfo.clinic}
                    onChange={handleInputChange}
                    placeholder="Name of the clinic"
                    required={formData.hasOtherPets}
                  />
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                References
              </h3>
              {formData.references.map((reference, index) => (
                <div key={index} className="border p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Reference {index + 1}</h4>
                    {formData.references.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeReference(index)}
                        className="text-red-500 hover:text-red-700"
                        aria-label={`Remove reference ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Reference Name"
                      value={reference.name}
                      onChange={(e) =>
                        updateReference(index, "name", e.target.value)
                      }
                      placeholder="Full name"
                      required
                    />

                    <Input
                      label="Relationship"
                      value={reference.relationship}
                      onChange={(e) =>
                        updateReference(index, "relationship", e.target.value)
                      }
                      placeholder="e.g., Friend, Family, Colleague"
                      required
                    />

                    <Input
                      label="Phone Number"
                      value={reference.phone}
                      onChange={(e) =>
                        updateReference(index, "phone", e.target.value)
                      }
                      placeholder="Phone number"
                    />

                    <Input
                      label="Email"
                      value={reference.email}
                      onChange={(e) =>
                        updateReference(index, "email", e.target.value)
                      }
                      placeholder="Email address"
                    />

                    <Input
                      label="Years Known"
                      type="number"
                      value={reference.yearsKnown}
                      onChange={(e) =>
                        updateReference(
                          index,
                          "yearsKnown",
                          parseInt(e.target.value)
                        )
                      }
                      placeholder="Number of years"
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addReference}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Reference
              </Button>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={hasExistingRequest || isCheckingExisting}
              >
                {hasExistingRequest ? "Already Applied" : "Submit Application"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
};
