<template>
  <div class="conversation-manager">
    <el-card class="manager-card" shadow="hover">
      <template #header>
        <div class="manager-header">
          <h3>Conversation Manager</h3>
          <div class="header-actions">
            <el-button type="primary" @click="syncAllConversations" :loading="syncing">
              <el-icon><Refresh /></el-icon>
              Sync with Backend
            </el-button>
            <el-button type="success" @click="createNewConversation">
              <el-icon><Plus /></el-icon>
              New Conversation
            </el-button>
          </div>
        </div>
      </template>

      <div class="conversation-list">
        <div v-if="conversations.length === 0" class="no-conversations">
          <el-empty description="No conversations found">
            <el-button type="primary" @click="createNewConversation">Start a Conversation</el-button>
          </el-empty>
        </div>

        <div v-else class="conversation-items">
          <div
            v-for="conversation in conversations"
            :key="conversation.id"
            class="conversation-item"
            :class="{ active: selectedConversation?.id === conversation.id }"
            @click="selectConversation(conversation)"
          >
            <el-avatar
              :size="50"
              :src="conversation.avatar || '/public/assets/p1.png'"
              :alt="conversation.name || 'Conversation'"
            />
            <div class="conversation-info">
              <h4>{{ getConversationDisplayName(conversation) }}</h4>
              <p class="conversation-meta">
                {{ getConversationTypeLabel(conversation.type) }} • 
                {{ conversation.participants.length }} participants
              </p>
              <p v-if="conversation.lastMessage" class="last-message">
                {{ conversation.lastMessage.content }}
              </p>
              <p class="conversation-date">
                {{ formatDate(conversation.updatedAt) }}
              </p>
            </div>
            <div class="conversation-actions">
              <el-badge :value="conversation.unreadCount" :hidden="conversation.unreadCount === 0">
                <el-button type="info" size="small" @click.stop="viewConversation(conversation)">
                  <el-icon><View /></el-icon>
                  View
                </el-button>
              </el-badge>
              <el-button type="warning" size="small" @click.stop="syncConversation(conversation)">
                <el-icon><Refresh /></el-icon>
                Sync
              </el-button>
              <el-button type="danger" size="small" @click.stop="deleteConversation(conversation)">
                <el-icon><Delete /></el-icon>
                Delete
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Create New Conversation Dialog -->
    <el-dialog v-model="showCreateDialog" title="Create New Conversation" width="500px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="120px">
        <el-form-item label="Conversation Type" prop="type">
          <el-select v-model="createForm.type" placeholder="Select type">
            <el-option label="Direct Message (P2P)" :value="0" />
            <el-option label="Group Chat" :value="1" />
            <el-option label="Room Chat" :value="2" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Name" prop="name" v-if="createForm.type !== 0">
          <el-input v-model="createForm.name" placeholder="Enter conversation name" />
        </el-form-item>
        
        <el-form-item label="Participants" prop="participants">
          <el-select
            v-model="createForm.participants"
            multiple
            filterable
            placeholder="Select participants"
            :loading="loadingUsers"
          >
            <el-option
              v-for="user in availableUsers"
              :key="user.id"
              :label="`${user.firstName} ${user.lastName}`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Avatar" v-if="createForm.type !== 0">
          <el-input v-model="createForm.avatar" placeholder="Avatar URL (optional)" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">Cancel</el-button>
        <el-button type="primary" @click="handleCreateConversation" :loading="creating">
          Create Conversation
        </el-button>
      </template>
    </el-dialog>

    <!-- Conversation Details Dialog -->
    <el-dialog v-model="showDetailsDialog" title="Conversation Details" width="600px">
      <div v-if="selectedConversation" class="conversation-details">
        <div class="detail-header">
          <el-avatar
            :size="80"
            :src="selectedConversation.avatar || '/public/assets/p1.png'"
            :alt="selectedConversation.name || 'Conversation'"
          />
          <div class="detail-info">
            <h3>{{ getConversationDisplayName(selectedConversation) }}</h3>
            <p class="conversation-type">{{ getConversationTypeLabel(selectedConversation.type) }}</p>
            <p class="conversation-date">Created: {{ formatDate(selectedConversation.createdAt) }}</p>
          </div>
        </div>

        <el-divider />

        <div class="detail-section">
          <h4>Participants ({{ selectedConversation.participants.length }})</h4>
          <div class="participants-list">
            <el-tag
              v-for="participantId in selectedConversation.participants"
              :key="participantId"
              class="participant-tag"
            >
              {{ getUserDisplayName(participantId) }}
            </el-tag>
          </div>
        </div>

        <div class="detail-section">
          <h4>Recent Messages</h4>
          <div v-if="recentMessages.length === 0" class="no-messages">
            <el-empty description="No messages yet" />
          </div>
          <div v-else class="messages-preview">
            <div
              v-for="message in recentMessages.slice(0, 5)"
              :key="message.id"
              class="message-preview"
            >
              <span class="message-sender">{{ getUserDisplayName(message.senderId) }}:</span>
              <span class="message-content">{{ message.content }}</span>
              <span class="message-time">{{ formatDate(message.createdAt) }}</span>
            </div>
          </div>
        </div>

        <div class="detail-actions">
          <el-button type="primary" @click="openConversation(selectedConversation)">
            <el-icon><ChatDotRound /></el-icon>
            Open Conversation
          </el-button>
          <el-button type="warning" @click="syncConversation(selectedConversation)">
            <el-icon><Refresh /></el-icon>
            Sync Messages
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Refresh, 
  Plus, 
  View, 
  Delete, 
  ChatDotRound 
} from '@element-plus/icons-vue';
import { conversationService, type Conversation, type Message } from '../services/conversation.service';
import { normalizeDisplayName } from '../utils';
import { userService, type PawfectFriendsUser } from '../services/user.service';
import { useZimStore } from '../store';

const emit = defineEmits<{
  conversationSelected: [conversation: Conversation];
  conversationOpened: [conversation: Conversation];
}>();

const store = useZimStore();

// State
const conversations = ref<Conversation[]>([]);
const selectedConversation = ref<Conversation | null>(null);
const recentMessages = ref<Message[]>([]);
const availableUsers = ref<PawfectFriendsUser[]>([]);
const loadingUsers = ref(false);
const syncing = ref(false);
const creating = ref(false);

// Dialog states
const showCreateDialog = ref(false);
const showDetailsDialog = ref(false);

// Form refs
const createFormRef = ref();

// Create form
const createForm = ref({
  type: 0,
  name: '',
  participants: [] as string[],
  avatar: ''
});

// Form validation rules
const createRules = {
  type: [{ required: true, message: 'Please select conversation type', trigger: 'change' }],
  participants: [{ required: true, message: 'Please select at least one participant', trigger: 'change' }],
  name: [
    { required: true, message: 'Please enter conversation name', trigger: 'blur' },
    { min: 2, message: 'Name must be at least 2 characters', trigger: 'blur' }
  ]
};

// Computed properties
const conversationTypeLabels = {
  0: 'Direct Message',
  1: 'Group Chat',
  2: 'Room Chat'
};

// Methods
const loadConversations = async () => {
  try {
    conversations.value = await conversationService.getConversationList();
  } catch (error) {
    ElMessage.error('Failed to load conversations');
    console.error('Error loading conversations:', error);
  }
};

const loadAvailableUsers = async () => {
  try {
    loadingUsers.value = true;
    // This would need to be implemented in your backend
    // For now, we'll use a placeholder
    availableUsers.value = [];
    ElMessage.info('User loading feature coming soon');
  } catch (error) {
    ElMessage.error('Failed to load users');
    console.error('Error loading users:', error);
  } finally {
    loadingUsers.value = false;
  }
};

const syncAllConversations = async () => {
  try {
    syncing.value = true;
    const success = await store.syncAllConversationsWithBackend();
    
    if (success) {
      ElMessage.success('All conversations synced successfully');
      await loadConversations();
    } else {
      ElMessage.error('Failed to sync conversations');
    }
  } catch (error) {
    ElMessage.error('Error syncing conversations');
    console.error('Error syncing conversations:', error);
  } finally {
    syncing.value = false;
  }
};

const syncConversation = async (conversation: Conversation) => {
  try {
    const success = await store.syncConversationMessagesWithBackend(conversation.conversationId);
    
    if (success) {
      ElMessage.success('Conversation synced successfully');
      await loadConversations();
    } else {
      ElMessage.error('Failed to sync conversation');
    }
  } catch (error) {
    ElMessage.error('Error syncing conversation');
    console.error('Error syncing conversation:', error);
  }
};

const createNewConversation = () => {
  createForm.value = {
    type: 0,
    name: '',
    participants: [],
    avatar: ''
  };
  showCreateDialog.value = true;
  loadAvailableUsers();
};

const handleCreateConversation = async () => {
  if (!createFormRef.value) return;
  
  try {
    await createFormRef.value.validate();
    creating.value = true;
    
    const conversation = await conversationService.createConversation(createForm.value);
    
    if (conversation) {
      ElMessage.success('Conversation created successfully');
      showCreateDialog.value = false;
      await loadConversations();
      emit('conversationSelected', conversation);
    } else {
      ElMessage.error('Failed to create conversation');
    }
  } catch (error) {
    console.error('Error creating conversation:', error);
  } finally {
    creating.value = false;
  }
};

const selectConversation = (conversation: Conversation) => {
  selectedConversation.value = conversation;
  emit('conversationSelected', conversation);
};

const viewConversation = async (conversation: Conversation) => {
  selectedConversation.value = conversation;
  showDetailsDialog.value = true;
  
  // Load recent messages
  try {
    recentMessages.value = await conversationService.getMessages(conversation.conversationId, { limit: 10 });
  } catch (error) {
    console.error('Error loading recent messages:', error);
  }
};

const deleteConversation = async (conversation: Conversation) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete "${getConversationDisplayName(conversation)}"? This action cannot be undone.`,
      'Delete Conversation',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    );
    
    const success = await conversationService.deleteConversation(conversation.conversationId);
    
    if (success) {
      ElMessage.success('Conversation deleted successfully');
      await loadConversations();
      
      if (selectedConversation.value?.id === conversation.id) {
        selectedConversation.value = null;
      }
    } else {
      ElMessage.error('Failed to delete conversation');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Error deleting conversation');
      console.error('Error deleting conversation:', error);
    }
  }
};

const openConversation = (conversation: Conversation) => {
  emit('conversationOpened', conversation);
  showDetailsDialog.value = false;
};

const getConversationDisplayName = (conversation: Conversation): string => {
  if (conversation.name) return conversation.name;
  if (conversation.type === 0) {
    // For P2P, show the other participant's name
    const otherParticipant = conversation.participants.find(p => p !== store.self.userID);
    return otherParticipant || 'Unknown User';
  }
  return `Conversation ${conversation.id.slice(0, 8)}`;
};

const getConversationTypeLabel = (type: number): string => {
  return conversationTypeLabels[type as keyof typeof conversationTypeLabels] || 'Unknown';
};

const getUserDisplayName = (userId: string): string => {
  if (userId === store.self.userID) return 'You';
  const user = store.userMap[userId];
  
  // Standardized fallback hierarchy: profile.displayName → profile.fullName → username → email
  if (user) {
    // Check for displayName first (highest priority)
    if (user.displayName) {
      return normalizeDisplayName(user.displayName);
    }
    
    // Check for fullName (firstName + lastName)
    if (user.firstName && user.lastName) {
      return normalizeDisplayName(`${user.firstName} ${user.lastName}`.trim());
    }
    
    // Check for firstName only
    if (user.firstName) {
      return normalizeDisplayName(user.firstName);
    }
    
    // Check for username
    if (user.userName) {
      return normalizeDisplayName(user.userName);
    }
    
    // Check for email (last resort from user data)
    if (user.email) {
      return normalizeDisplayName(user.email);
    }
  }
  
  // Clean fallback: remove sequence numbers and debug info from user ID
  return normalizeDisplayName(userId);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-GB');
};

// Lifecycle
onMounted(() => {
  loadConversations();
});
</script>

<style scoped lang="scss">
.conversation-manager {
  padding: 20px;
  
  .manager-card {
    .manager-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h3 {
        margin: 0;
        color: #2c3e50;
      }
      
      .header-actions {
        display: flex;
        gap: 10px;
      }
    }
    
    .conversation-list {
      .no-conversations {
        text-align: center;
        padding: 40px 20px;
      }
      
      .conversation-items {
        .conversation-item {
          display: flex;
          align-items: center;
          padding: 16px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          
          &:hover {
            border-color: #4a90e2;
            box-shadow: 0 2px 8px rgba(74, 144, 226, 0.1);
          }
          
          &.active {
            border-color: #4a90e2;
            background-color: #f0f8ff;
          }
          
          .conversation-info {
            flex: 1;
            margin-left: 16px;
            
            h4 {
              margin: 0 0 4px 0;
              color: #2c3e50;
            }
            
            .conversation-meta {
              margin: 0 0 4px 0;
              color: #7f8c8d;
              font-size: 12px;
            }
            
            .last-message {
              margin: 0 0 4px 0;
              color: #34495e;
              font-size: 14px;
              font-style: italic;
            }
            
            .conversation-date {
              margin: 0;
              color: #95a5a6;
              font-size: 12px;
            }
          }
          
          .conversation-actions {
            display: flex;
            gap: 8px;
          }
        }
      }
    }
  }
}

.conversation-details {
  .detail-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
    
    .detail-info {
      h3 {
        margin: 0 0 8px 0;
        color: #2c3e50;
      }
      
      .conversation-type {
        margin: 0 0 4px 0;
        color: #4a90e2;
        font-weight: 600;
      }
      
      .conversation-date {
        margin: 0;
        color: #7f8c8d;
        font-size: 14px;
      }
    }
  }
  
  .detail-section {
    margin-bottom: 20px;
    
    h4 {
      margin: 0 0 12px 0;
      color: #2c3e50;
    }
    
    .participants-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .participant-tag {
        margin: 0;
      }
    }
    
    .no-messages {
      text-align: center;
      padding: 20px;
    }
    
    .messages-preview {
      .message-preview {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .message-sender {
          font-weight: 600;
          color: #4a90e2;
          min-width: 80px;
        }
        
        .message-content {
          flex: 1;
          color: #2c3e50;
        }
        
        .message-time {
          color: #95a5a6;
          font-size: 12px;
          min-width: 80px;
          text-align: right;
        }
      }
    }
  }
  
  .detail-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 20px;
  }
}
</style>
