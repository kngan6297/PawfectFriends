import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { adoptionApi } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { FileText } from "lucide-react";
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
import { useAdoptionAction } from "@/hooks/useAdoptionAction";
import AdoptionActionCard from "../shared/AdoptionActionCard";
import { formatDisplayDate } from "@/utils/dateUtils";

interface AdoptionNote {
  _id?: string;
  content: string;
  author: string;
  isInternal: boolean;
  timestamp: Date;
}

interface NotesSectionProps {
  requestId: string;
  notes?: AdoptionNote[];
  onNotesUpdate?: (notes: AdoptionNote[]) => void;
  onNotesRecorded?: () => void;
  scope?: "general" | "meeting";
  readOnly?: boolean;
}

const NotesSection: React.FC<NotesSectionProps> = ({
  requestId,
  notes = [],
  onNotesUpdate,
  onNotesRecorded,
  scope = "general",
  readOnly = false,
}) => {
  const { user } = useAuth();
  const [newNote, setNewNote] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [filter, setFilter] = useState<"all" | "internal" | "public">("all");
  const [isLoading, setIsLoading] = useState(false);

  // Meeting-specific state
  const [meetingFormData, setMeetingFormData] = useState({
    impression: "",
    observations: "",
    notes: "",
  });

  // Use adoption action hook for meeting notes
  const {
    showModal,
    formData,
    setFormData,
    loading: actionLoading,
    setLoading: setActionLoading,
    openModal,
    closeModal,
    updateAdoptionStatus,
    addNote: addNoteAction,
  } = useAdoptionAction({
    requestId,
    onComplete: onNotesRecorded || (() => {}),
  });

  // Check if user has permission to add internal notes (shelter staff or admin)
  const canAddInternalNotes =
    user?.role === "shelter" || user?.role === "admin";
  const canAddNotes =
    user?.role === "shelter" || user?.role === "admin" || user?.role === "user";

  const filteredNotes = notes.filter((note) => {
    if (filter === "all") return true;
    if (filter === "internal") return note.isInternal;
    if (filter === "public") return !note.isInternal;
    return true;
  });

  // Debug notes data
  console.log("📝 NotesSection - notes:", notes);
  console.log("📝 NotesSection - filteredNotes:", filteredNotes);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    try {
      setIsAddingNote(true);
      const updatedRequest = await adoptionApi.addNote(requestId, {
        content: newNote.trim(),
        isInternal: isInternal,
      });

      // Update the notes in the parent component
      if (updatedRequest.notes) {
        onNotesUpdate(updatedRequest.notes);
      }

      setNewNote("");
      setIsInternal(false);
      toast.success("Note added successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add note";
      toast.error(errorMessage);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleAddNote();
    }
  };

  // Meeting notes submission handler
  const handleMeetingNotesSubmit = async () => {
    try {
      setActionLoading(true);

      // Validate that notes content exists
      if (!formData.notes || formData.notes.trim() === "") {
        toast.error("Please enter meeting notes");
        return;
      }

      const meetingNoteData = {
        content: formData.notes.trim(),
        isInternal: false,
        isMilestone: true,
        timelineStatus: "meeting_notes",
      };

      console.log("📝 Adding meeting notes:", {
        requestId,
        noteData: meetingNoteData,
      });

      await addNoteAction(meetingNoteData);

      // Update status to indicate meeting notes are recorded
      await updateAdoptionStatus("meeting_notes_recorded");

      toast.success("Meeting notes recorded");
      closeModal();
      onNotesRecorded?.();
    } catch (error: any) {
      console.error("❌ Meeting notes failed:", error);
      toast.error("Meeting notes failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const getNoteIcon = (isInternal: boolean) => {
    if (isInternal) {
      return (
        <svg
          className="w-4 h-4 text-orange-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-4 h-4 text-blue-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  // Meeting scope - use AdoptionActionCard
  if (scope === "meeting") {
    const notesIcon = (
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
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );

    return (
      <AdoptionActionCard
        title="Meeting Notes"
        description="Record meeting outcomes and impressions"
        icon={FileText}
        buttonText="Add Notes"
        showModal={showModal}
        loading={actionLoading}
        onButtonClick={openModal}
        onClose={closeModal}
        onSubmit={handleMeetingNotesSubmit}
        emptyStateIcon={notesIcon}
        emptyStateText="No meeting notes yet"
        emptyStateSubtext="Add meeting notes to record outcomes and impressions"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Meeting Notes</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Overall Impression
              </label>
              <Select
                value={formData.impression || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, impression: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an impression" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="very_positive">Very Positive</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="concerned">Concerned</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Key Observations
              </label>
              <Textarea
                value={formData.observations || ""}
                onChange={(e) =>
                  setFormData({ ...formData, observations: e.target.value })
                }
                placeholder="Record key observations about the applicant..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Meeting Notes
              </label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes, feelings, impressions from the meeting..."
                rows={4}
              />
            </div>
          </div>
        </div>
      </AdoptionActionCard>
    );
  }

  // General scope - use regular notes display
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Notes</h2>
          <p className="text-sm text-gray-500">
            {notes.length} note{notes.length !== 1 ? "s" : ""} •
            {filteredNotes.length} shown
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2">
          <Select
            value={filter}
            onValueChange={(value) =>
              setFilter(value as "all" | "internal" | "public")
            }
          >
            <SelectTrigger className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <SelectValue placeholder="Filter notes by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notes</SelectItem>
              <SelectItem value="internal">Internal Only</SelectItem>
              <SelectItem value="public">Public Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Add Note Section */}
      {canAddNotes && !readOnly && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <div>
              <label
                htmlFor="newNote"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Add Note
              </label>
              <Textarea
                id="newNote"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter your note here... (Ctrl/Cmd + Enter to save)"
                className="w-full"
                rows={3}
                disabled={isAddingNote}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {canAddInternalNotes && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Internal Note</span>
                    <Badge variant="warning" className="text-xs">
                      Staff Only
                    </Badge>
                  </label>
                )}
              </div>

              <Button
                onClick={handleAddNote}
                disabled={!newNote.trim() || isAddingNote}
                className="px-4 py-2"
              >
                {isAddingNote ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Adding...
                  </>
                ) : (
                  "Add Note"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm">
              {filter === "all"
                ? "No notes yet"
                : filter === "internal"
                ? "No internal notes"
                : "No public notes"}
            </p>
            {canAddNotes && !readOnly && (
              <p className="text-xs text-gray-400 mt-1">
                Add the first note above
              </p>
            )}
          </div>
        ) : (
          filteredNotes.map((note, index) => (
            <div
              key={note._id || index}
              className={`p-4 rounded-lg border ${
                note.isInternal
                  ? "bg-orange-50 border-orange-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getNoteIcon(note.isInternal)}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {note.author || "Unknown User"}
                    </span>
                    {note.isInternal && (
                      <Badge variant="warning" className="text-xs">
                        Internal
                      </Badge>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(note.timestamp), "dd MMM yyyy h:mm a")}
                </span>
              </div>

              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {note.content}
              </div>

              {/* Author details for internal notes */}
              {note.isInternal && note.author && (
                <div className="mt-2 pt-2 border-t border-orange-200">
                  <p className="text-xs text-gray-500">
                    Added by: {note.author}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Notes Summary */}
      {notes.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>
                {notes.filter((n) => n.isInternal).length} internal note
                {notes.filter((n) => n.isInternal).length !== 1 ? "s" : ""}
              </span>
              <span>
                {notes.filter((n) => !n.isInternal).length} public note
                {notes.filter((n) => !n.isInternal).length !== 1 ? "s" : ""}
              </span>
            </div>
            <span>
              Latest:{" "}
              {notes.length > 0 && formatDisplayDate(new Date(note.createdAt))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesSection;
