import { getIntegrationConfig } from '../config/integration';
import { authService } from './auth.service';

export enum UserRole {
    ADMIN = 'admin',
    SHELTER_STAFF = 'shelter_staff',
    SHELTER_MANAGER = 'shelter_manager',
    ADOPTER = 'adopter',
    VOLUNTEER = 'volunteer',
    VET = 'vet',
    TRAINER = 'trainer'
}

export enum GroupChatType {
    SHELTER_GENERAL = 'shelter_general',
    ADOPTION_COORDINATION = 'adoption_coordination',
    MEDICAL_UPDATES = 'medical_updates',
    VOLUNTEER_COORDINATION = 'volunteer_coordination',
    ADOPTER_SUPPORT = 'adopter_support',
    EMERGENCY_ALERTS = 'emergency_alerts',
    ADMIN_ANNOUNCEMENTS = 'admin_announcements',
    TRAINING_RESOURCES = 'training_resources'
}

export interface GroupChatMember {
    userId: string;
    username: string;
    role: UserRole;
    joinedAt: string;
    lastActive: string;
    permissions: string[];
    isOnline: boolean;
    avatar?: string;
}

export interface GroupChatRoom {
    id: string;
    name: string;
    description: string;
    type: GroupChatType;
    avatar?: string;
    members: GroupChatMember[];
    admins: string[];
    moderators: string[];
    maxMembers: number;
    isPublic: boolean;
    isActive: boolean;
    rules: string[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
    lastMessageAt?: string;
    unreadCount: number;
    memberCount: number;
}

export interface CreateGroupChatRequest {
    name: string;
    description: string;
    type: GroupChatType;
    isPublic: boolean;
    maxMembers?: number;
    rules?: string[];
    tags?: string[];
    initialMembers?: string[];
}

export interface UpdateGroupChatRequest {
    name?: string;
    description?: string;
    avatar?: string;
    rules?: string[];
    tags?: string[];
    maxMembers?: number;
    isPublic?: boolean;
}

export interface GroupChatInvite {
    id: string;
    groupChatId: string;
    invitedUserId: string;
    invitedBy: string;
    role: UserRole;
    message?: string;
    expiresAt: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    createdAt: string;
}

export interface GroupChatMessage {
    id: string;
    groupChatId: string;
    senderId: string;
    senderRole: UserRole;
    content: string;
    messageType: 'text' | 'announcement' | 'alert' | 'file' | 'system';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    isPinned: boolean;
    replyToMessageId?: string;
    attachments?: string[];
    metadata?: {
        petId?: string;
        adoptionId?: string;
        medicalRecordId?: string;
        location?: string;
        urgency?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface GroupChatFilters {
    type?: GroupChatType;
    isPublic?: boolean;
    isActive?: boolean;
    tags?: string[];
    memberRole?: UserRole;
    hasAvailablePets?: boolean;
    location?: string;
}

class GroupChatService {
    private config = getIntegrationConfig();

    /**
     * Create a new group chat room
     */
    async createGroupChat(data: CreateGroupChatRequest): Promise<GroupChatRoom | null> {
        try {
            const token = authService.getAuthToken();
            if (!token) return null;

            const response = await fetch(`${this.config.apiBaseUrl}/group-chats`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error creating group chat:', error);
            return null;
        }
    }

    /**
     * Get all group chat rooms with optional filtering
     */
    async getGroupChats(filters: GroupChatFilters = {}): Promise<GroupChatRoom[]> {
        try {
            const token = authService.getAuthToken();
            if (!token) return [];

            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(key, v));
                    } else {
                        params.append(key, value.toString());
                    }
                }
            });

            const response = await fetch(`${this.config.apiBaseUrl}/group-chats?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error fetching group chats:', error);
            return [];
        }
    }

    /**
     * Get group chat room by ID
     */
    async getGroupChat(roomId: string): Promise<GroupChatRoom | null> {
        try {
            const token = authService.getAuthToken();
            if (!token) return null;

            const response = await fetch(`${this.config.apiBaseUrl}/group-chats/${roomId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error fetching group chat:', error);
            return null;
        }
    }

    /**
     * Join a group chat room
     */
    async joinGroupChat(roomId: string, role?: UserRole): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/group-chats/${roomId}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role }),
            });

            return response.ok;
        } catch (error) {
            console.error('Error joining group chat:', error);
            return false;
        }
    }

    /**
     * Leave a group chat room
     */
    async leaveGroupChat(roomId: string): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/group-chats/${roomId}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Error leaving group chat:', error);
            return false;
        }
    }

    /**
     * Invite user to group chat
     */
    async inviteUser(roomId: string, userId: string, role: UserRole, message?: string): Promise<GroupChatInvite | null> {
        try {
            const token = authService.getAuthToken();
            if (!token) return null;

            const response = await fetch(`${this.config.apiBaseUrl}/group-chats/${roomId}/invite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, role, message }),
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error inviting user:', error);
            return null;
        }
    }

    /**
     * Accept group chat invitation
     */
    async acceptInvite(inviteId: string): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/group-chat-invites/${inviteId}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Error accepting invite:', error);
            return false;
        }
    }

    /**
     * Decline group chat invitation
     */
    async declineInvite(inviteId: string): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/group-chat-invites/${inviteId}/decline`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Error declining invite:', error);
            return false;
        }
    }

    /**
     * Get pending invitations for current user
     */
    async getPendingInvites(): Promise<GroupChatInvite[]> {
        try {
            const token = authService.getAuthToken();
            if (!token) return [];

            const response = await fetch(`${this.config.apiBaseUrl}/group-chat-invites/pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error fetching pending invites:', error);
            return [];
        }
    }

    /**
     * Send message to group chat
     */
    async sendMessage(roomId: string, message: Omit<GroupChatMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<GroupChatMessage | null> {
        try {
            const token = authService.getAuthToken();
            if (!token) return null;

            const response = await fetch(`${this.config.apiBaseUrl}/group-chats/${roomId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error sending message:', error);
            return null;
        }
    }

    /**
     * Get messages from group chat
     */
    async getMessages(roomId: string, limit: number = 50, before?: string): Promise<GroupChatMessage[]> {
        try {
            const token = authService.getAuthToken();
            if (!token) return [];

            const params = new URLSearchParams();
            params.append('limit', limit.toString());
            if (before) params.append('before', before);

            const response = await fetch(`${this.config.apiBaseUrl}/group-chats/${roomId}/messages?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    }

    /**
     * Update group chat room
     */
    async updateGroupChat(roomId: string, updates: UpdateGroupChatRequest): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/group-chats/${roomId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });

            return response.ok;
        } catch (error) {
            console.error('Error updating group chat:', error);
            return false;
        }
    }

    /**
     * Delete group chat room
     */
    async deleteGroupChat(roomId: string): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/group-chats/${roomId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Error deleting group chat:', error);
            return false;
        }
    }

    /**
     * Add member to group chat
     */
    async addMember(roomId: string, userId: string, role: UserRole): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/group-chats/${roomId}/members`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, role }),
            });

            return response.ok;
        } catch (error) {
            console.error('Error adding member:', error);
            return false;
        }
    }

    /**
     * Remove member from group chat
     */
    async removeMember(roomId: string, userId: string): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/group-chats/${roomId}/members/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Error removing member:', error);
            return false;
        }
    }

    /**
     * Update member role
     */
    async updateMemberRole(roomId: string, userId: string, newRole: UserRole): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/group-chats/${roomId}/members/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
            });

            return response.ok;
        } catch (error) {
            console.error('Error updating member role:', error);
            return false;
        }
    }

    /**
     * Pin message
     */
    async pinMessage(roomId: string, messageId: string): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/group-chats/${roomId}/messages/${messageId}/pin`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Error pinning message:', error);
            return false;
        }
    }

    /**
     * Unpin message
     */
    async unpinMessage(roomId: string, messageId: string): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/group-chats/${roomId}/messages/${messageId}/unpin`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Error unpinning message:', error);
            return false;
        }
    }

    /**
     * Get available group chat types
     */
    getGroupChatTypes(): { value: GroupChatType; label: string; icon: string; description: string; allowedRoles: UserRole[] }[] {
        return [
            {
                value: GroupChatType.SHELTER_GENERAL,
                label: 'Shelter General',
                icon: '🏥',
                description: 'General communication for shelter staff',
                allowedRoles: [UserRole.SHELTER_STAFF, UserRole.SHELTER_MANAGER, UserRole.ADMIN]
            },
            {
                value: GroupChatType.ADOPTION_COORDINATION,
                label: 'Adoption Coordination',
                icon: '🏠',
                description: 'Coordinate adoption processes and updates',
                allowedRoles: [UserRole.SHELTER_STAFF, UserRole.SHELTER_MANAGER, UserRole.ADOPTER, UserRole.ADMIN]
            },
            {
                value: GroupChatType.MEDICAL_UPDATES,
                label: 'Medical Updates',
                icon: '💊',
                description: 'Share medical information and updates',
                allowedRoles: [UserRole.SHELTER_STAFF, UserRole.SHELTER_MANAGER, UserRole.VET, UserRole.ADMIN]
            },
            {
                value: GroupChatType.VOLUNTEER_COORDINATION,
                label: 'Volunteer Coordination',
                icon: '🤝',
                description: 'Coordinate volunteer activities and schedules',
                allowedRoles: [UserRole.SHELTER_STAFF, UserRole.SHELTER_MANAGER, UserRole.VOLUNTEER, UserRole.ADMIN]
            },
            {
                value: GroupChatType.ADOPTER_SUPPORT,
                label: 'Adopter Support',
                icon: '💬',
                description: 'Support and guidance for pet adopters',
                allowedRoles: [UserRole.ADOPTER, UserRole.SHELTER_STAFF, UserRole.TRAINER, UserRole.ADMIN]
            },
            {
                value: GroupChatType.EMERGENCY_ALERTS,
                label: 'Emergency Alerts',
                icon: '🚨',
                description: 'Emergency notifications and urgent updates',
                allowedRoles: [UserRole.SHELTER_STAFF, UserRole.SHELTER_MANAGER, UserRole.ADMIN]
            },
            {
                value: GroupChatType.ADMIN_ANNOUNCEMENTS,
                label: 'Admin Announcements',
                icon: '📢',
                description: 'Official announcements and policy updates',
                allowedRoles: [UserRole.ADMIN]
            },
            {
                value: GroupChatType.TRAINING_RESOURCES,
                label: 'Training Resources',
                icon: '📚',
                description: 'Share training materials and resources',
                allowedRoles: [UserRole.SHELTER_STAFF, UserRole.TRAINER, UserRole.ADOPTER, UserRole.ADMIN]
            }
        ];
    }

    /**
     * Get available user roles
     */
    getUserRoles(): { value: UserRole; label: string; icon: string; description: string; permissions: string[] }[] {
        return [
            {
                value: UserRole.ADMIN,
                label: 'Administrator',
                icon: '👑',
                description: 'Full system access and control',
                permissions: ['all']
            },
            {
                value: UserRole.SHELTER_MANAGER,
                label: 'Shelter Manager',
                icon: '👔',
                description: 'Manage shelter operations and staff',
                permissions: ['manage_shelter', 'manage_staff', 'manage_chats', 'send_announcements']
            },
            {
                value: UserRole.SHELTER_STAFF,
                label: 'Shelter Staff',
                icon: '👨‍⚕️',
                description: 'Daily shelter operations and pet care',
                permissions: ['view_pets', 'update_pet_info', 'send_messages', 'invite_users']
            },
            {
                value: UserRole.ADOPTER,
                label: 'Pet Adopter',
                icon: '👨‍👩‍👧‍👦',
                description: 'Adopt and care for pets',
                permissions: ['view_available_pets', 'send_messages', 'view_own_adoptions']
            },
            {
                value: UserRole.VOLUNTEER,
                label: 'Volunteer',
                icon: '🤝',
                description: 'Support shelter activities',
                permissions: ['view_pets', 'send_messages', 'view_schedules']
            },
            {
                value: UserRole.VET,
                label: 'Veterinarian',
                icon: '🐾',
                description: 'Provide medical care and advice',
                permissions: ['view_medical_records', 'update_medical_info', 'send_messages']
            },
            {
                value: UserRole.TRAINER,
                label: 'Trainer',
                icon: '🎓',
                description: 'Provide training and behavior support',
                permissions: ['view_behavior_records', 'update_training_info', 'send_messages']
            }
        ];
    }

    /**
     * Check if user has permission for action
     */
    hasPermission(userRole: UserRole, action: string, chatType?: GroupChatType): boolean {
        const roles = this.getUserRoles();
        const userRoleInfo = roles.find(r => r.value === userRole);

        if (!userRoleInfo) return false;

        // Admin has all permissions
        if (userRoleInfo.permissions.includes('all')) return true;

        // Check specific permissions
        if (userRoleInfo.permissions.includes(action)) return true;

        // Check chat type specific permissions
        if (chatType) {
            const chatTypes = this.getGroupChatTypes();
            const chatTypeInfo = chatTypes.find(t => t.value === chatType);

            if (chatTypeInfo && chatTypeInfo.allowedRoles.includes(userRole)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get default rules for group chat type
     */
    getDefaultRules(chatType: GroupChatType): string[] {
        const rules: Record<GroupChatType, string[]> = {
            [GroupChatType.SHELTER_GENERAL]: [
                'Be respectful and professional',
                'Keep discussions relevant to shelter operations',
                'No personal attacks or harassment',
                'Follow shelter policies and procedures'
            ],
            [GroupChatType.ADOPTION_COORDINATION]: [
                'Maintain confidentiality of adoption information',
                'Be prompt in responding to adoption inquiries',
                'Provide accurate information about pets',
                'Follow adoption protocols and requirements'
            ],
            [GroupChatType.MEDICAL_UPDATES]: [
                'Maintain medical confidentiality',
                'Use appropriate medical terminology',
                'Include relevant medical history',
                'Follow veterinary protocols'
            ],
            [GroupChatType.VOLUNTEER_COORDINATION]: [
                'Be clear about volunteer requirements',
                'Maintain accurate schedules',
                'Provide necessary training information',
                'Support volunteer development'
            ],
            [GroupChatType.ADOPTER_SUPPORT]: [
                'Provide helpful and accurate advice',
                'Be patient and understanding',
                'Share positive experiences and solutions',
                'Maintain a supportive environment'
            ],
            [GroupChatType.EMERGENCY_ALERTS]: [
                'Use only for genuine emergencies',
                'Provide clear and actionable information',
                'Include relevant contact information',
                'Follow emergency protocols'
            ],
            [GroupChatType.ADMIN_ANNOUNCEMENTS]: [
                'Keep announcements clear and concise',
                'Include relevant deadlines and actions',
                'Provide contact information for questions',
                'Follow official communication protocols'
            ],
            [GroupChatType.TRAINING_RESOURCES]: [
                'Share accurate and helpful information',
                'Include relevant context and examples',
                'Provide practical training tips',
                'Maintain a learning-focused environment'
            ]
        };

        return rules[chatType] || [];
    }
}

export const groupChatService = new GroupChatService();
export default groupChatService;
