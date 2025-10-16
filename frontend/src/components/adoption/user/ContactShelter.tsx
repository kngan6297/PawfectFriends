import React from "react";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "../../components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Users } from "lucide-react";
import { useAdoptionAction } from "@/hooks/useAdoptionAction";
import AdoptionActionCard from "../shared/AdoptionActionCard";

interface ContactShelterProps {
  requestId: string;
  onContactComplete: () => void;
}

const ContactShelter: React.FC<ContactShelterProps> = ({
  requestId,
  onContactComplete,
}) => {
  const {
    showModal,
    formData,
    setFormData,
    loading,
    setLoading,
    openModal,
    closeModal,
    updateAdoptionStatus,
    addNote,
    addTimelineEvent,
  } = useAdoptionAction({ requestId, onComplete: onContactComplete });

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate that notes content exists
      if (!formData.notes || formData.notes.trim() === "") {
        toast.error("Please enter contact notes");
        return;
      }

      const contactNoteData = {
        content: formData.notes.trim(),
        isInternal: false,
      };

      console.log("📝 Contact note data:", contactNoteData);

      await addNote(contactNoteData);
      await addTimelineEvent(
        "contacted",
        `Contacted via ${formData.contactMethod}: ${formData.notes}`
      );

      // Update status to indicate contact has been made
      await updateAdoptionStatus("contacted");

      toast.success("Shelter contacted");
      closeModal();
      onContactComplete();
    } catch (error: any) {
      console.error("❌ Contact failed:", error);
      toast.error("Contact failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const contactIcon = (
    <svg
      className="mx-auto h-12 w-12 text-gray-300 mb-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );

  return (
    <AdoptionActionCard
      title="Contact Shelter"
      description="Get in touch with the shelter about your application"
      icon={Users}
      buttonText="Contact"
      showModal={showModal}
      loading={loading}
      onButtonClick={openModal}
      onClose={closeModal}
      onSubmit={handleSubmit}
      emptyStateIcon={contactIcon}
      emptyStateText="No contact history yet"
      emptyStateSubtext="Contact the shelter to discuss your application"
    >
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Shelter</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Contact Method
            </label>
            <Select
              value={formData.contactMethod || ""}
              onValueChange={(value) =>
                setFormData({ ...formData, contactMethod: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a contact method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="text">Text Message</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="zalo">Zalo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Textarea
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Record what was discussed, questions asked, etc..."
              rows={4}
            />
          </div>
        </div>
      </div>
    </AdoptionActionCard>
  );
};

export default ContactShelter;
