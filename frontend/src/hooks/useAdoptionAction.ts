import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adoptionApi } from "@/services/api";
import { toast } from "react-toastify";

interface UseAdoptionActionProps {
    requestId: string;
    onComplete: () => void;
}

export const useAdoptionAction = ({ requestId, onComplete }: UseAdoptionActionProps) => {
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<any>({
        decision: "",
        rejectionReason: "",
        notes: ""
    });
    const [loading, setLoading] = useState(false);

    const openModal = () => {
        setFormData({
            decision: "",
            rejectionReason: "",
            notes: ""
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({
            decision: "",
            rejectionReason: "",
            notes: ""
        });
    };

    const updateAdoptionStatus = async (newStatus: string, reason?: string) => {
        try {
            await adoptionApi.updateStatus(requestId, newStatus as any, reason);
            console.log(`✅ Status updated to: ${newStatus}`);
        } catch (error) {
            console.error(`❌ Failed to update status to ${newStatus}:`, error);
        }
    };

    const addNote = async (noteData: any) => {
        try {
            await adoptionApi.addNote(requestId, noteData);
        } catch (error) {
            throw error;
        }
    };

    const addTimelineEvent = async (status: string, note: string) => {
        try {
            await adoptionApi.addTimelineEvent(
                requestId,
                status,
                note,
                user?._id || ""
            );
        } catch (error) {
            throw error;
        }
    };

    return {
        user,
        showModal,
        setShowModal,
        formData,
        setFormData,
        loading,
        setLoading,
        openModal,
        closeModal,
        updateAdoptionStatus,
        addNote,
        addTimelineEvent,
        onComplete,
    };
}; 