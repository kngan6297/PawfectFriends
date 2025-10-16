import React, { useState, useEffect } from "react";
import AccessibleModal from "@/components/common/AccessibleModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "react-toastify";
import axios from "axios";
import { formatDisplayDate } from "@/utils/dateUtils";

interface EditLog {
  _id: string;
  date: string;
  editor: {
    name: string;
    email: string;
  };
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

interface PetEditLogModalProps {
  open: boolean;
  onClose: () => void;
  petId: string;
}

const PetEditLogModal: React.FC<PetEditLogModalProps> = ({
  open,
  onClose,
  petId,
}) => {
  const [editLogs, setEditLogs] = useState<EditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && petId) {
      fetchEditLogs();
    }
  }, [open, petId]);

  const fetchEditLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/pets/${petId}/edit-logs`);
      setEditLogs(response.data.data || []);
    } catch (error) {
      console.error("Error fetching edit logs:", error);
      toast.error("Failed to fetch edit logs");
    } finally {
      setLoading(false);
    }
  };

  const formatFieldName = (field: string) => {
    return field
      .split(/(?=[A-Z])/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const handleClose = () => {
    setEditLogs([]);
    onClose();
  };

  return (
    <AccessibleModal
      isOpen={open}
      onClose={handleClose}
      title="Pet Edit History"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading edit history...</p>
          </div>
        ) : editLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No edit history found for this pet.
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {editLogs.map((log) => (
              <div
                key={log._id}
                className="border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="info">Edit</Badge>
                      <span className="text-sm text-gray-500">
                        {formatDisplayDate(new Date(log.createdAt))} at{" "}
                        {new Date(log.date).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Edited by: {log.editor.name} ({log.editor.email})
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {log.changes.map((change, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded p-3 space-y-1"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {formatFieldName(change.field)}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">From:</span>
                          <span className="ml-1 text-red-600">
                            {formatValue(change.oldValue)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">To:</span>
                          <span className="ml-1 text-green-600">
                            {formatValue(change.newValue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </AccessibleModal>
  );
};

export default PetEditLogModal;
