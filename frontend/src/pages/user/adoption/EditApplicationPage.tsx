import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToastContext } from "@/components/ui/ToastProvider";
import { adoptionApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

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

interface ApplicationData {
  housingType: "house" | "apartment" | "condo" | "other";
  hasYard: boolean;
  yardDetails: {
    isFenced: boolean;
    size: string;
  };
  hasOtherPets: boolean;
  otherPetsDetails: OtherPet[];
  hasChildren: boolean;
  childrenAges: number[];
  workSchedule: string;
  experience: string;
  reasonForAdopting: string;
  plannedCareRoutine: string;
  veterinarianInfo: {
    name: string;
    contact: string;
    clinic: string;
  };
  references: Reference[];
}

export const EditApplicationPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adoptionRequest, setAdoptionRequest] = useState<any>(null);
  const [formData, setFormData] = useState<ApplicationData>({
    housingType: "house",
    hasYard: false,
    yardDetails: {
      isFenced: false,
      size: "",
    },
    hasOtherPets: false,
    otherPetsDetails: [],
    hasChildren: false,
    childrenAges: [],
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
    ],
  });

  useEffect(() => {
    if (requestId && user) {
      loadAdoptionRequest();
    }
  }, [requestId, user]);

  const loadAdoptionRequest = async () => {
    try {
      setLoading(true);
      const request = await adoptionApi.getById(requestId!);
      setAdoptionRequest(request);

      // Load existing application data
      if (request.applicationDetails) {
        setFormData(request.applicationDetails as ApplicationData);
      }
    } catch (error) {
      console.error("Error loading adoption request:", error);
      showToast({
        type: "error",
        title: "Error",
        description: "Failed to load adoption request",
      });
      navigate("/adoptions");
    } finally {
      setLoading(false);
    }
  };

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
        {
          name: "",
          relationship: "",
          phone: "",
          email: "",
          yearsKnown: 0,
        },
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

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.housingType) {
      errors.push("Housing type is required");
    }

    if (formData.hasYard && !formData.yardDetails.size) {
      errors.push("Yard size is required when you have a yard");
    }

    if (formData.hasOtherPets && formData.otherPetsDetails.length === 0) {
      errors.push("Please provide details about your other pets");
    }

    if (formData.hasChildren && formData.childrenAges.length === 0) {
      errors.push("Please provide ages of children in the household");
    }

    if (!formData.workSchedule) {
      errors.push("Work schedule is required");
    }

    if (!formData.reasonForAdopting) {
      errors.push("Reason for adopting is required");
    }

    if (!formData.plannedCareRoutine) {
      errors.push("Planned care routine is required");
    }

    // Validate veterinarian info if has other pets
    if (formData.hasOtherPets) {
      if (!formData.veterinarianInfo.name) {
        errors.push("Veterinarian name is required");
      }
      if (!formData.veterinarianInfo.contact) {
        errors.push("Veterinarian contact is required");
      }
      if (!formData.veterinarianInfo.clinic) {
        errors.push("Veterinarian clinic is required");
      }
    }

    // Validate references
    if (formData.references.length === 0) {
      errors.push("At least one reference is required");
    } else {
      formData.references.forEach((ref, index) => {
        if (!ref.name) {
          errors.push(`Reference ${index + 1} name is required`);
        }
        if (!ref.relationship) {
          errors.push(`Reference ${index + 1} relationship is required`);
        }
        if (!ref.phone && !ref.email) {
          errors.push(`Reference ${index + 1} phone or email is required`);
        }
      });
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      showToast({
        type: "error",
        title: "Validation Error",
        description: errors.join(", "),
      });
      return;
    }

    try {
      setSaving(true);

      // Update the adoption request with new application details
      await adoptionApi.updateApplication(requestId!, formData);

      showToast({
        type: "success",
        title: "Success",
        description: "Application updated successfully!",
      });
      navigate("/adoptions");
    } catch (error) {
      console.error("Error updating application:", error);
      showToast({
        type: "error",
        title: "Error",
        description: "Failed to update application",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!adoptionRequest) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Adoption request not found</p>
          <Button
            variant="primary"
            onClick={() => navigate("/adoptions")}
            className="mt-4"
          >
            Back to Tracker
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/adoptions")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Adoption Application
            </h1>
            <p className="text-gray-600">
              Update your application for{" "}
              {adoptionRequest.petDetails?.name || "this pet"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/adoptions")}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Housing Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Housing Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Housing Type
              </label>
              <Select
                value={formData.housingType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    housingType: value as any,
                  }))
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

            <div className="flex items-center">
              <input
                type="checkbox"
                name="hasYard"
                checked={formData.hasYard}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                id="hasYard"
                aria-label="I have a yard"
              />
              <label htmlFor="hasYard" className="ml-2 text-sm text-gray-700">
                I have a yard
              </label>
            </div>
          </div>

          {formData.hasYard && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yard Size
                </label>
                <Input
                  name="yardDetails.size"
                  value={formData.yardDetails.size}
                  onChange={handleInputChange}
                  placeholder="e.g., Small, Medium, Large"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="yardDetails.isFenced"
                  checked={formData.yardDetails.isFenced}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  id="yardFenced"
                  aria-label="Yard is fenced"
                />
                <label
                  htmlFor="yardFenced"
                  className="ml-2 text-sm text-gray-700"
                >
                  Yard is fenced
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Other Pets */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Other Pets
          </h2>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              name="hasOtherPets"
              checked={formData.hasOtherPets}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              id="hasOtherPets"
              aria-label="I have other pets"
            />
            <label
              htmlFor="hasOtherPets"
              className="ml-2 text-sm text-gray-700"
            >
              I have other pets
            </label>
          </div>

          {formData.hasOtherPets && (
            <div className="space-y-4">
              {formData.otherPetsDetails.map((pet, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-700">
                      Pet {index + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOtherPet(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Pet type (e.g., Dog, Cat)"
                      value={pet.type}
                      onChange={(e) =>
                        updateOtherPet(index, "type", e.target.value)
                      }
                      required
                    />
                    <Input
                      placeholder="Breed"
                      value={pet.species}
                      onChange={(e) =>
                        updateOtherPet(index, "species", e.target.value)
                      }
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Age"
                      value={pet.age}
                      onChange={(e) =>
                        updateOtherPet(index, "age", parseInt(e.target.value))
                      }
                      required
                    />
                    <Textarea
                      placeholder="Description"
                      value={pet.description}
                      onChange={(e) =>
                        updateOtherPet(index, "description", e.target.value)
                      }
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
                Add Another Pet
              </Button>
            </div>
          )}
        </div>

        {/* Children */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Children</h2>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              name="hasChildren"
              checked={formData.hasChildren}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              id="hasChildren"
              aria-label="I have children in the household"
            />
            <label htmlFor="hasChildren" className="ml-2 text-sm text-gray-700">
              I have children in the household
            </label>
          </div>

          {formData.hasChildren && (
            <div className="space-y-4">
              {formData.childrenAges.map((age, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Input
                    type="number"
                    placeholder="Child age"
                    value={age}
                    onChange={(e) =>
                      updateChildAge(index, parseInt(e.target.value))
                    }
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChildAge(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addChildAge}
                className="w-full"
              >
                Add Another Child
              </Button>
            </div>
          )}
        </div>

        {/* Work Schedule */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Work Schedule
          </h2>
          <Textarea
            name="workSchedule"
            value={formData.workSchedule}
            onChange={handleInputChange}
            placeholder="Describe your work schedule and how you'll care for the pet during work hours"
            rows={4}
            required
          />
        </div>

        {/* Experience */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Experience with Pets
          </h2>
          <Textarea
            name="experience"
            value={formData.experience}
            onChange={handleInputChange}
            placeholder="Describe your experience with pets, if any"
            rows={4}
          />
        </div>

        {/* Reason for Adopting */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Reason for Adopting
          </h2>
          <Textarea
            name="reasonForAdopting"
            value={formData.reasonForAdopting}
            onChange={handleInputChange}
            placeholder="Why do you want to adopt this pet?"
            rows={4}
            required
          />
        </div>

        {/* Planned Care Routine */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Planned Care Routine
          </h2>
          <Textarea
            name="plannedCareRoutine"
            value={formData.plannedCareRoutine}
            onChange={handleInputChange}
            placeholder="Describe your planned daily care routine for the pet"
            rows={4}
            required
          />
        </div>

        {/* Veterinarian Information */}
        {formData.hasOtherPets && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Veterinarian Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                name="veterinarianInfo.name"
                value={formData.veterinarianInfo.name}
                onChange={handleInputChange}
                placeholder="Veterinarian name"
                required
              />
              <Input
                name="veterinarianInfo.contact"
                value={formData.veterinarianInfo.contact}
                onChange={handleInputChange}
                placeholder="Contact number"
                required
              />
              <Input
                name="veterinarianInfo.clinic"
                value={formData.veterinarianInfo.clinic}
                onChange={handleInputChange}
                placeholder="Clinic name"
                required
              />
            </div>
          </div>
        )}

        {/* References */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            References
          </h2>
          <div className="space-y-4">
            {formData.references.map((ref, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Reference {index + 1}
                  </h3>
                  {formData.references.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReference(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Full name"
                    value={ref.name}
                    onChange={(e) =>
                      updateReference(index, "name", e.target.value)
                    }
                    required
                  />
                  <Input
                    placeholder="Relationship"
                    value={ref.relationship}
                    onChange={(e) =>
                      updateReference(index, "relationship", e.target.value)
                    }
                    required
                  />
                  <Input
                    placeholder="Phone number"
                    value={ref.phone}
                    onChange={(e) =>
                      updateReference(index, "phone", e.target.value)
                    }
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={ref.email}
                    onChange={(e) =>
                      updateReference(index, "email", e.target.value)
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Years known"
                    value={ref.yearsKnown}
                    onChange={(e) =>
                      updateReference(
                        index,
                        "yearsKnown",
                        parseInt(e.target.value)
                      )
                    }
                    required
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
              Add Another Reference
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
