import { getIntegrationConfig } from '../config/integration';
import { authService } from './auth.service';

/* ===== Types ===== */
export interface Conversation {
  id: string;                // backend id (ObjectId)
  conversationId: string;    // same as id in BE, kept for compat
  type: number;              // 0: P2P, 1: Group
  name?: string;
  avatar?: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  orderKey: number;
  createdAt: string;
  updatedAt: string;
  zimGroupId?: string;       // new short ZIM group ID (≤64 chars)
  status?: 'ready' | 'pending_zim_member' | 'active' | 'archived' | 'blocked' | 'completed' | 'cancelled';
  pendingMemberZimIds?: string[];
  zim?: {
    type: string;
    groupKey: string;        // logical key (grp_<shelterId>_<petId>_<userId>)
    groupId: string;         // short ZIM group ID
  };
  customData?: {
    shelterId?: string;
    petId?: string;
    conversationType?: 'shelter' | string;
    [k: string]: any;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: number;
  content: string;
  messageSeq: number;
  orderKey: number;
  timestamp: number;
  status: number;
  replyToMessageId?: string;
  customData?: any;
  attachments?: MessageAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  fileName?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export interface CreateConversationRequest {
  type: 'p2p' | 'group';
  participants: string[];
  name?: string;
  avatar?: string;
  customData?: {
    shelterId?: string;
    petId?: string;
    conversationType?: 'shelter' | string;
    [key: string]: any;
  };
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  type: number;
  replyToMessageId?: string;
  customData?: any;
  attachments?: Omit<MessageAttachment, 'id' | 'messageId'>[];
}

/* ===== Service ===== */
class ConversationService {
  private config = getIntegrationConfig();

  // Map (ZIM conv id) -> (backend conversation id)
  // Với shelter chat, ZIM conv id đang dùng = shelterId (24-hex)
  private zimToBackend = new Map<string, string>();

  /* ---------- Utils ---------- */

  private isValidObjectId(id: string): boolean {
    return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  }

  private async authHeaders() {
    const token = authService.getAuthToken();
    if (!token) throw new Error('No auth token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    } as const;
  }

  private getShelterContext() {
    // Check URL parameters first (most current)
    const urlParams = new URLSearchParams(window.location.search);
    const urlPetId = urlParams.get('petId');
    const urlShelterId = urlParams.get('shelterId');

    // Use URL parameters if available, otherwise fall back to localStorage
    const shelterId = urlShelterId || localStorage.getItem('pawfect-shelter-context') || '';
    const petId = urlPetId || localStorage.getItem('pawfect-pet-context') || undefined;

    console.log('🔍 Getting shelter context:', {
      urlPetId,
      urlShelterId,
      localStoragePetId: localStorage.getItem('pawfect-pet-context'),
      localStorageShelterId: localStorage.getItem('pawfect-shelter-context'),
      finalPetId: petId,
      finalShelterId: shelterId,
      source: urlPetId ? 'URL' : 'localStorage'
    });

    return { shelterId, petId };
  }

  private async getCurrentUserId(): Promise<string> {
    const prof = await authService.getUserProfile();
    const userId = prof?.id || authService.getUserData()?.userId;
    if (!userId || !this.isValidObjectId(userId)) {
      throw new Error('Invalid current user id');
    }
    return userId;
  }

  // Public method to get current user ID for logging
  async getCurrentUserIdPublic(): Promise<string> {
    return this.getCurrentUserId();
  }

  /* ---------- Plain BE calls ---------- */

  async getConversationList(): Promise<Conversation[]> {
    const res = await fetch(`${this.config.apiBaseUrl}/conversations`, {
      headers: await this.authHeaders(),
    });
    if (!res.ok) return [];
    const body = await res.json();
    return body.data || body;
  }

  async getConversationByBackendId(backendId: string): Promise<Conversation | null> {
    const res = await fetch(`${this.config.apiBaseUrl}/conversations/${backendId}`, {
      headers: await this.authHeaders(),
    });
    if (res.status === 404) return null;
    if (res.status === 403) throw new Error('FORBIDDEN');
    if (!res.ok) throw new Error(`GET conv ${backendId} failed: ${res.status}`);
    const body = await res.json();
    return body.data || body;
  }

  private async createConversation(req: CreateConversationRequest): Promise<Conversation> {
    const res = await fetch(`${this.config.apiBaseUrl}/conversations`, {
      method: 'POST',
      headers: await this.authHeaders(),
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Create conversation failed ${res.status}: ${txt}`);
    }
    const body = await res.json();
    return body.data || body;
  }

  private async ensureConversation(shelterId: string, petId: string, userId?: string): Promise<Conversation> {
    const res = await fetch(`${this.config.apiBaseUrl}/conversations/ensure`, {
      method: 'POST',
      headers: await this.authHeaders(),
      body: JSON.stringify({
        shelterId,
        petId,
        userId
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Ensure conversation failed ${res.status}: ${txt}`);
    }
    const body = await res.json();
    return body.data || body;
  }

  async addParticipant(backendId: string, participantId: string): Promise<boolean> {
    const res = await fetch(`${this.config.apiBaseUrl}/conversations/${backendId}/participants`, {
      method: 'POST',
      headers: await this.authHeaders(),
      body: JSON.stringify({ participantId }),
    });
    return res.ok;
  }

  /* ---------- Public helpers ---------- */

  /**
   * Đảm bảo tồn tại 1 conversation "shelter" với participants = [userId, shelterId].
   * Idempotent: nếu đã có và thiếu shelter → tự thêm shelter; nếu 403 → tạo mới sạch.
   * @param shelterId: shelter ID from URL parameters
   */
  async ensureShelterConversation(shelterId: string): Promise<Conversation | null> {
    // Get petId from URL parameters (not localStorage)
    const urlParams = new URLSearchParams(window.location.search);
    const petId = urlParams.get('petId');

    if (!shelterId || !this.isValidObjectId(shelterId)) {
      console.error('ensureShelterConversation: invalid shelterId', { shelterId });
      return null;
    }

    if (!petId || !this.isValidObjectId(petId)) {
      console.error('ensureShelterConversation: invalid petId from URL', { petId });
      return null;
    }

    const userId = await this.getCurrentUserId();

    // 1) Nếu đã có backend id mapping → thử lấy
    const mapped = this.zimToBackend.get(shelterId);
    if (mapped) {
      try {
        const conv = await this.getConversationByBackendId(mapped);
        if (conv) {
          // Nếu thiếu shelter trong participants → cố thêm 1 lần
          const hasUser = conv.participants.includes(userId);
          const hasShelter = conv.participants.includes(shelterId);
          if (!hasShelter) {
            const ok = await this.addParticipant(conv.id, shelterId);
            if (!ok) {
              console.warn('addParticipant(shelter) failed, will recreate conversation');
            } else {
              return conv; // Conv vẫn vậy, BE đã có shelter; lần refetch sau sẽ ổn
            }
          }
          if (!hasUser) {
            console.warn('Current user is not in participants. This should not happen. Will recreate conversation.');
          } else if (hasShelter) {
            return conv; // OK
          }
          // rơi xuống recreate
        }
      } catch (e: any) {
        if (e?.message === 'FORBIDDEN') {
          console.warn('Mapped conversation returns 403. Will recreate.');
        } else {
          console.warn('Mapped conversation not accessible. Will recreate.', e);
        }
      }
      // Nếu tới đây nghĩa là mapping cũ không dùng được → bỏ mapping để tạo mới
      this.zimToBackend.delete(shelterId);
    }

    // 2) Tạo mới sạch (idempotent theo cặp [userId, shelterId, petId])
    // Validate ObjectId trước khi gọi BE
    if (!this.isValidObjectId(shelterId) || !this.isValidObjectId(petId)) {
      console.error('Cannot create conversation: shelterId or petId are not ObjectId', { shelterId, petId });
      return null;
    }

    const created = await this.ensureConversation(shelterId, petId, userId);
    this.zimToBackend.set(shelterId, created.id);
    return created;
  }

  /**
   * Entry từ ZIM: đồng bộ 1 conversation.
   * Với shelter chat, ZIM trả conversationID = shelterId → đảm bảo conv tồn tại ở BE.
   */
  async syncConversation(zimConversation: any): Promise<Conversation | null> {
    // Chỉ handle P2P (type 0). Group tách riêng nếu cần.
    if (zimConversation?.type !== 0) return null;

    const zimId = String(zimConversation.conversationID || '');
    if (!this.isValidObjectId(zimId)) {
      console.warn('ZIM conversationID is not a 24-hex id. Skip.', { zimId });
      return null;
    }
    // Ở flow của bạn, zimId == shelterId
    return this.ensureShelterConversation(zimId);
  }

  /* ---------- Messages ---------- */

  async getMessages(backendConversationId: string, opts: { limit?: number; before?: number; after?: number } = {}): Promise<Message[]> {
    const params = new URLSearchParams();
    if (opts.limit) params.set('limit', String(opts.limit));
    if (opts.before) params.set('before', String(opts.before));
    if (opts.after) params.set('after', String(opts.after));

    const res = await fetch(`${this.config.apiBaseUrl}/messages/conversation/${backendConversationId}?${params}`, {
      headers: await this.authHeaders(),
    });
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`getMessages failed: ${res.status}`);
    }
    const body = await res.json();
    return body.data || body;
  }

  async sendMessage(req: SendMessageRequest): Promise<Message | null> {
    const res = await fetch(`${this.config.apiBaseUrl}/messages`, {
      method: 'POST',
      headers: await this.authHeaders(),
      body: JSON.stringify(req),
    });
    if (!res.ok) return null;
    return await res.json();
  }

  async markConversationAsRead(backendConversationId: string): Promise<boolean> {
    const res = await fetch(`${this.config.apiBaseUrl}/conversations/${backendConversationId}/read`, {
      method: 'PUT',
      headers: await this.authHeaders(),
    });
    return res.ok;
  }

  async addMessage(message: any, conversationId: string): Promise<void> {
    // This is a client-side fallback for message persistence
    // The webhook should handle most message persistence
    try {
      const res = await fetch(`${this.config.apiBaseUrl}/conversations/add-message`, {
        method: 'POST',
        headers: await this.authHeaders(),
        body: JSON.stringify({
          message,
          conversationId
        }),
      });
      if (!res.ok) {
        console.warn('Failed to persist message via client:', res.status);
      }
    } catch (error) {
      console.warn('Client-side message persistence failed:', error);
    }
  }

  /**
   * Retry inviting pending members to a conversation
   * @param conversationId - Backend conversation ID
   */
  async retryPendingMembers(conversationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${this.config.apiBaseUrl}/conversations/${conversationId}/retry-pending`, {
        method: 'POST',
        headers: await this.authHeaders(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Retry failed ${res.status}: ${errorText}`);
      }

      const body = await res.json();
      return {
        success: true,
        message: body.message || 'Retry completed successfully'
      };
    } catch (error) {
      console.error('Failed to retry pending members:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retry pending members'
      };
    }
  }
}

export const conversationService = new ConversationService();
export default conversationService;
