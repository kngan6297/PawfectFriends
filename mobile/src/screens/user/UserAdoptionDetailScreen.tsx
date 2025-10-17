import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { pageContainer, scrollContent, GUTTER, PAGE_MAX } from "@/ui/layout";
import {
  useUserAdoptionRequestDetails,
  useUserAdoptionMeetings,
  useUserInformationRequests,
} from "@/hooks/useAdoptions";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { adoptionStatusBadges } from "@/constants";
import { AdoptionRequest, Pet, User } from "@/types";
import { formatDisplayDate } from "@/utils";

interface PopulatedAdoptionRequest
  extends Omit<AdoptionRequest, "user" | "pet"> {
  _id: string;
  user: User;
  pet: Pet;
  shelterDetails: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  contractDetails?: {
    status: string;
    signedAt?: string;
    fileUrl?: string;
  };
  handoverDetails?: {
    method: string;
    location: string;
    notes: string;
    completedBy: string;
    completedAt?: string;
  };
}

export default function UserAdoptionDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "timeline" | "meetings" | "documents"
  >("overview");

  // Fetch adoption request details
  const {
    data: adoptionData,
    isLoading,
    error,
    refetch,
  } = useUserAdoptionRequestDetails(id || "");

  // Fetch meetings
  const { data: meetingsData, isLoading: meetingsLoading } =
    useUserAdoptionMeetings(id || "");

  // Fetch information requests
  const { data: infoRequestsData, isLoading: infoRequestsLoading } =
    useUserInformationRequests(id || "");

  const adoptionRequest = adoptionData?.data
    ? ({
        ...adoptionData.data,
        _id: (adoptionData.data as any)._id || adoptionData.data.id || "",
        shelterDetails:
          (adoptionData.data as any).shelter ||
          (adoptionData.data as any).shelterDetails,
      } as unknown as PopulatedAdoptionRequest)
    : null;
  const meetings = meetingsData?.data || [];
  const informationRequests = infoRequestsData?.data || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, keyof typeof adoptionStatusBadges> = {
      pending: "submitted",
      approved: "approved",
      scheduled: "reviewing",
      completed: "approved",
      rejected: "declined",
    };

    const mappedStatus = statusMap[status] || "submitted";
    return adoptionStatusBadges[mappedStatus];
  };

  const handleContactShelter = () => {
    if (adoptionRequest?.shelterDetails?.email) {
      Linking.openURL(`mailto:${adoptionRequest.shelterDetails.email}`);
    } else if (adoptionRequest?.shelterDetails?.phone) {
      Linking.openURL(`tel:${adoptionRequest.shelterDetails.phone}`);
    } else {
      Alert.alert(
        "Contact Information",
        "No contact information available for this shelter."
      );
    }
  };

  const handleViewContract = () => {
    if (adoptionRequest?.contractDetails?.fileUrl) {
      Linking.openURL(adoptionRequest.contractDetails.fileUrl);
    } else {
      Alert.alert("Contract", "Contract file is not available yet.");
    }
  };

  if (isLoading && !adoptionRequest) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <LoadingSpinner text="Loading adoption details..." />
      </SafeAreaView>
    );
  }

  if (error || !adoptionRequest) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ErrorMessage
          message={
            error
              ? "Failed to load adoption details"
              : "Adoption request not found"
          }
          onRetry={onRefresh}
        />
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(adoptionRequest.status);
  const petImage =
    adoptionRequest.pet?.photos?.[0]?.url ||
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Adoption Details
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Pet Info Card */}
        <View
          style={[
            styles.petCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Image source={{ uri: petImage }} style={styles.petImage} />
          <View style={styles.petInfo}>
            <Text style={[styles.petName, { color: colors.text }]}>
              {adoptionRequest.pet?.name || "Unknown Pet"}
            </Text>
            <Text style={[styles.petDetails, { color: colors.textSecondary }]}>
              {[
                adoptionRequest.pet?.breeds?.primary ||
                  adoptionRequest.pet?.breed,
                adoptionRequest.pet?.age,
                adoptionRequest.pet?.gender,
              ]
                .filter(Boolean)
                .join(" • ")}
            </Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}
            >
              <Text style={[styles.statusText, { color: statusInfo.fg }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {[
            { key: "overview", label: "Overview", icon: "information-circle" },
            { key: "timeline", label: "Timeline", icon: "time" },
            { key: "meetings", label: "Meetings", icon: "calendar" },
            { key: "documents", label: "Documents", icon: "document-text" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { backgroundColor: colors.primary },
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? "#fff" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === tab.key ? "#fff" : colors.textSecondary,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <OverviewTab
            adoptionRequest={adoptionRequest}
            colors={colors}
            onContactShelter={handleContactShelter}
          />
        )}

        {activeTab === "timeline" && (
          <TimelineTab adoptionRequest={adoptionRequest} colors={colors} />
        )}

        {activeTab === "meetings" && (
          <MeetingsTab
            meetings={meetings}
            isLoading={meetingsLoading}
            colors={colors}
          />
        )}

        {activeTab === "documents" && (
          <DocumentsTab
            adoptionRequest={adoptionRequest}
            informationRequests={informationRequests}
            isLoading={infoRequestsLoading}
            colors={colors}
            onViewContract={handleViewContract}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Overview Tab Component
function OverviewTab({
  adoptionRequest,
  colors,
  onContactShelter,
}: {
  adoptionRequest: PopulatedAdoptionRequest;
  colors: any;
  onContactShelter: () => void;
}) {
  return (
    <View style={styles.tabContent}>
      {/* Application Details */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Application Details
        </Text>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Submitted
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {formatDisplayDate(adoptionRequest.createdAt)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Last Updated
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {formatDisplayDate(adoptionRequest.updatedAt)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Shelter
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {adoptionRequest.shelterDetails?.name || "Unknown Shelter"}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Housing Type
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {adoptionRequest.applicationDetails?.housingType || "Not specified"}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Has Yard
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {adoptionRequest.applicationDetails?.hasYard ? "Yes" : "No"}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Other Pets
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {adoptionRequest.applicationDetails?.hasOtherPets ? "Yes" : "No"}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Children
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {adoptionRequest.applicationDetails?.hasChildren ? "Yes" : "No"}
          </Text>
        </View>
      </View>

      {/* Shelter Contact */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Shelter Contact
        </Text>

        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: colors.primary }]}
          onPress={onContactShelter}
        >
          <Ionicons name="mail" size={20} color="#fff" />
          <Text style={styles.contactButtonText}>Contact Shelter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Timeline Tab Component
function TimelineTab({
  adoptionRequest,
  colors,
}: {
  adoptionRequest: PopulatedAdoptionRequest;
  colors: any;
}) {
  const timelineEvents = [
    {
      status: "submitted",
      date: adoptionRequest.createdAt,
      title: "Application Submitted",
      description:
        "Your adoption application has been submitted and is under review.",
    },
    ...(adoptionRequest.timeline || [])
      .filter((event: any) => event && typeof event === "object")
      .map((event: any) => ({
        status: event.status || "unknown",
        date: event.date || adoptionRequest.createdAt,
        title:
          event.status && event.status.trim() && event.status.trim().length > 1
            ? event.status.charAt(0).toUpperCase() + event.status.slice(1)
            : "Unknown Event",
        description:
          event.note && event.note.trim() && event.note.trim().length > 1
            ? event.note.trim()
            : "",
      }))
      .filter((event: any) => event.title && event.title.trim().length > 0),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <View style={styles.tabContent}>
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Adoption Timeline
        </Text>

        {timelineEvents
          .filter(
            (event) => event && event.title && event.title.trim().length > 0
          )
          .map((event, index) => (
            <View key={index} style={styles.timelineItem}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: colors.primary },
                ]}
              />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: colors.text }]}>
                  {event.title && event.title.trim()
                    ? event.title.trim()
                    : "Unknown Event"}
                </Text>
                <Text
                  style={[styles.timelineDate, { color: colors.textSecondary }]}
                >
                  {event.date
                    ? formatDisplayDate(event.date) || "Unknown Date"
                    : "Unknown Date"}
                </Text>
                {event.description &&
                  event.description.trim() &&
                  event.description.trim().length > 1 && (
                    <Text
                      style={[
                        styles.timelineDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {event.description.trim()}
                    </Text>
                  )}
              </View>
            </View>
          ))}
      </View>
    </View>
  );
}

// Meetings Tab Component
function MeetingsTab({
  meetings,
  isLoading,
  colors,
}: {
  meetings: any[];
  isLoading: boolean;
  colors: any;
}) {
  if (isLoading) {
    return (
      <View style={styles.tabContent}>
        <LoadingSpinner text="Loading meetings..." />
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <View
        style={[
          styles.section,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Meetings & Communication
        </Text>

        {meetings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No meetings scheduled yet
            </Text>
          </View>
        ) : (
          meetings.map((meeting, index) => (
            <View key={index} style={styles.meetingItem}>
              <View style={styles.meetingHeader}>
                <Ionicons
                  name={meeting.type === "in_person" ? "location" : "call"}
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.meetingType, { color: colors.text }]}>
                  {meeting.type.replace("_", " ").toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.meetingStatus,
                    { backgroundColor: getMeetingStatusColor(meeting.status) },
                  ]}
                >
                  <Text style={styles.meetingStatusText}>{meeting.status}</Text>
                </View>
              </View>

              <Text
                style={[styles.meetingDate, { color: colors.textSecondary }]}
              >
                {formatDisplayDate(meeting.scheduledDate)}
              </Text>

              {meeting.location && (
                <Text
                  style={[
                    styles.meetingLocation,
                    { color: colors.textSecondary },
                  ]}
                >
                  📍 {meeting.location}
                </Text>
              )}

              {meeting.notes && (
                <Text
                  style={[styles.meetingNotes, { color: colors.textSecondary }]}
                >
                  {meeting.notes}
                </Text>
              )}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

// Documents Tab Component
function DocumentsTab({
  adoptionRequest,
  informationRequests,
  isLoading,
  colors,
  onViewContract,
}: {
  adoptionRequest: PopulatedAdoptionRequest;
  informationRequests: any[];
  isLoading: boolean;
  colors: any;
  onViewContract: () => void;
}) {
  if (isLoading) {
    return (
      <View style={styles.tabContent}>
        <LoadingSpinner text="Loading documents..." />
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {/* Contract Section */}
      {adoptionRequest.contractDetails && (
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Adoption Contract
          </Text>

          <View style={styles.documentItem}>
            <Ionicons name="document-text" size={24} color={colors.primary} />
            <View style={styles.documentInfo}>
              <Text style={[styles.documentTitle, { color: colors.text }]}>
                Adoption Agreement
              </Text>
              <Text
                style={[styles.documentStatus, { color: colors.textSecondary }]}
              >
                Status: {adoptionRequest.contractDetails.status}
              </Text>
              {adoptionRequest.contractDetails.signedAt && (
                <Text
                  style={[styles.documentDate, { color: colors.textSecondary }]}
                >
                  Signed:{" "}
                  {formatDisplayDate(adoptionRequest.contractDetails.signedAt)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={onViewContract}
              style={styles.documentButton}
            >
              <Ionicons name="eye" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Information Requests Section */}
      {informationRequests.length > 0 && (
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Additional Information
          </Text>

          {informationRequests.map((request, index) => (
            <View key={index} style={styles.infoRequestItem}>
              <Text style={[styles.infoRequestTitle, { color: colors.text }]}>
                {request.title || "Information Request"}
              </Text>
              <Text
                style={[
                  styles.infoRequestDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {request.description ||
                  "Additional information requested by the shelter."}
              </Text>
              <Text
                style={[
                  styles.infoRequestDate,
                  { color: colors.textSecondary },
                ]}
              >
                Requested: {formatDisplayDate(request.createdAt)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Empty State */}
      {!adoptionRequest.contractDetails && informationRequests.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons
            name="document-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No documents available yet
          </Text>
        </View>
      )}
    </View>
  );
}

// Helper function for meeting status colors
function getMeetingStatusColor(status: string) {
  switch (status) {
    case "scheduled":
      return "#E0E7FF";
    case "completed":
      return "#DCFCE7";
    case "cancelled":
      return "#FEE2E2";
    case "rescheduled":
      return "#FEF3C7";
    default:
      return "#F3F4F6";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: GUTTER,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GUTTER,
    paddingBottom: 32,
  },
  petCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 3 },
    }),
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  petInfo: {
    flex: 1,
    justifyContent: "center",
  },
  petName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    gap: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tabContent: {
    gap: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 2 },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  meetingItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  meetingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  meetingType: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  meetingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  meetingStatusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#374151",
  },
  meetingDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  meetingLocation: {
    fontSize: 12,
    marginBottom: 4,
  },
  meetingNotes: {
    fontSize: 12,
    fontStyle: "italic",
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  documentStatus: {
    fontSize: 12,
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 12,
  },
  documentButton: {
    padding: 8,
  },
  infoRequestItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoRequestTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoRequestDescription: {
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  infoRequestDate: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
});
