<template>
  <div class="group-chat-view">
    <!-- Chat Header -->
    <div class="chat-header">
      <div class="chat-info">
        <h3>{{ chat?.name || 'Loading...' }}</h3>
        <p>{{ chat?.description }}</p>
        <div class="chat-meta">
          <el-tag :type="getChatTypeColor(chat?.type)" size="small">
            {{ getChatTypeLabel(chat?.type) }}
          </el-tag>
          <span class="member-count">{{ chat?.memberCount || 0 }} members</span>
        </div>
      </div>
      
      <div class="chat-actions">
        <el-button @click="showMembers = true" size="small">
          Members
        </el-button>
        <el-button @click="leaveChat" type="danger" size="small" v-if="isMember">
          Leave
        </el-button>
      </div>
    </div>

    <!-- Messages Area -->
    <div class="messages-area">
      <div class="messages-container" ref="messagesContainer">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-item"
          :class="{ 'own-message': message.senderId === currentUserId }"
        >
          <div class="message-header">
            <span class="sender-name">{{ getUserName(message.senderId) }}</span>
            <span class="message-time">{{ formatTime(message.createdAt) }}</span>
          </div>
          
          <div class="message-content">
            {{ message.content }}
          </div>
        </div>
      </div>
    </div>

    <!-- Message Input -->
    <div class="message-input">
      <el-input
        v-model="newMessage"
        type="textarea"
        :rows="3"
        placeholder="Type your message..."
        @keydown.ctrl.enter="sendMessage"
      />
      
      <div class="input-actions">
        <el-button type="primary" @click="sendMessage" :disabled="!newMessage.trim()" :loading="sending">
          Send
        </el-button>
      </div>
    </div>

    <!-- Members Dialog -->
    <el-dialog v-model="showMembers" title="Chat Members" width="500px">
      <div class="members-list">
        <div
          v-for="member in chat?.members || []"
          :key="member.userId"
          class="member-item"
        >
          <div class="member-info">
            <el-avatar :size="40">{{ member.username.charAt(0) }}</el-avatar>
            <div class="member-details">
              <h5>{{ member.username }}</h5>
              <p>{{ getRoleLabel(member.role) }}</p>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { groupChatService, type GroupChatRoom, type GroupChatMessage, type GroupChatType, type UserRole } from '../services/group-chat.service';

// Props
interface Props {
  chatId: string;
}

const props = defineProps<Props>();

// State
const chat = ref<GroupChatRoom | null>(null);
const messages = ref<GroupChatMessage[]>([]);
const newMessage = ref('');
const sending = ref(false);
const showMembers = ref(false);

// Refs
const messagesContainer = ref<HTMLElement>();

// Mock data
const currentUserId = ref('user1');

// Computed
const isMember = computed(() => {
  return chat.value?.members.some(m => m.userId === currentUserId.value) || false;
});

// Methods
const loadChat = async () => {
  try {
    const result = await groupChatService.getGroupChat(props.chatId);
    chat.value = result;
  } catch (error) {
    console.error('Error loading chat:', error);
    ElMessage.error('Failed to load chat');
  }
};

const loadMessages = async () => {
  try {
    const result = await groupChatService.getMessages(props.chatId);
    messages.value = result;
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('Error loading messages:', error);
    ElMessage.error('Failed to load messages');
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const getChatTypeLabel = (type?: GroupChatType): string => {
  if (!type) return 'Unknown';
  const chatTypes = groupChatService.getGroupChatTypes();
  const chatType = chatTypes.find(t => t.value === type);
  return chatType ? chatType.label : 'Unknown';
};

const getChatTypeColor = (type?: GroupChatType): string => {
  if (!type) return 'info';
  const colors: Record<GroupChatType, string> = {
    'shelter_general': 'primary',
    'adoption_coordination': 'success',
    'medical_updates': 'warning',
    'volunteer_coordination': 'info',
    'adopter_support': 'success',
    'emergency_alerts': 'danger',
    'admin_announcements': 'danger',
    'training_resources': 'info'
  };
  return colors[type] || 'info';
};

const getRoleLabel = (role: UserRole): string => {
  const roles = groupChatService.getUserRoles();
  const roleInfo = roles.find(r => r.value === role);
  return roleInfo ? roleInfo.label : 'Unknown';
};

const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString();
};

const getUserName = (userId: string): string => {
  return 'User'; // Placeholder
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || !chat.value) return;

  try {
    sending.value = true;
    
    const messageData = {
      groupChatId: chat.value.id,
      senderId: currentUserId.value,
      senderRole: UserRole.ADOPTER, // Get from current user
      content: newMessage.value,
      messageType: 'text',
      priority: 'normal',
      isPinned: false
    };
    
    const result = await groupChatService.sendMessage(chat.value.id, messageData);
    if (result) {
      messages.value.push(result);
      newMessage.value = '';
      await nextTick();
      scrollToBottom();
    }
  } catch (error) {
    ElMessage.error('Failed to send message');
  } finally {
    sending.value = false;
  }
};

const leaveChat = async () => {
  try {
    const success = await groupChatService.leaveGroupChat(chat.value!.id);
    if (success) {
      ElMessage.success(`Left ${chat.value?.name}`);
      // Navigate away or show leave confirmation
    }
  } catch (error) {
    ElMessage.error('Failed to leave chat');
  }
};

// Lifecycle
onMounted(() => {
  loadChat();
  loadMessages();
});

// Watch for chat changes
watch(() => props.chatId, () => {
  loadChat();
  loadMessages();
});
</script>

<style scoped lang="scss">
.group-chat-view {
  height: 100vh;
  display: flex;
  flex-direction: column;

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px;
    border-bottom: 1px solid #e9ecef;
    background: white;

    .chat-info {
      h3 {
        margin: 0 0 8px 0;
        color: #2c3e50;
      }

      p {
        margin: 0 0 10px 0;
        color: #7f8c8d;
        font-size: 14px;
      }

      .chat-meta {
        display: flex;
        align-items: center;
        gap: 10px;

        .member-count {
          color: #7f8c8d;
          font-size: 12px;
        }
      }
    }

    .chat-actions {
      display: flex;
      gap: 10px;
    }
  }

  .messages-area {
    flex: 1;
    overflow: hidden;
    background: #f8f9fa;

    .messages-container {
      height: 100%;
      overflow-y: auto;
      padding: 20px;

      .message-item {
        margin-bottom: 20px;
        padding: 15px;
        border-radius: 12px;
        background: white;
        border: 1px solid #e9ecef;
        transition: all 0.3s ease;

        &:hover {
          border-color: #4a90e2;
          box-shadow: 0 2px 8px rgba(74, 144, 226, 0.1);
        }

        &.own-message {
          background: #e3f2fd;
          border-color: #2196f3;
          margin-left: 20%;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;

          .sender-name {
            font-weight: 600;
            color: #2c3e50;
          }

          .message-time {
            color: #7f8c8d;
            font-size: 12px;
          }
        }

        .message-content {
          color: #2c3e50;
          line-height: 1.5;
        }
      }
    }
  }

  .message-input {
    padding: 20px;
    background: white;
    border-top: 1px solid #e9ecef;

    .input-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
    }
  }
}

.members-list {
  .member-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    margin-bottom: 10px;

    .member-details {
      h5 {
        margin: 0 0 5px 0;
        color: #2c3e50;
      }

      p {
        margin: 0;
        color: #7f8c8d;
        font-size: 14px;
      }
    }
  }
}

@media (max-width: 768px) {
  .group-chat-view {
    .chat-header {
      flex-direction: column;
      gap: 15px;
    }

    .messages-area {
      .messages-container {
        padding: 15px;

        .message-item {
          &.own-message {
            margin-left: 10%;
          }
        }
      }
    }

    .message-input {
      padding: 15px;
    }
  }
}
</style>
