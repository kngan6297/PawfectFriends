<template>
  <div class="group-chat-manager">
    <!-- Header -->
    <div class="manager-header">
      <h3>👥 Group Chat Manager</h3>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        Create Group Chat
      </el-button>
    </div>

    <!-- Group Chats Grid -->
    <div class="chats-grid">
      <div
        v-for="chat in chats"
        :key="chat.id"
        class="chat-card"
      >
        <div class="chat-header">
          <div class="chat-avatar">
            <el-avatar :size="50">{{ getChatIcon(chat.type) }}</el-avatar>
          </div>
          <div class="chat-info">
            <h4>{{ chat.name }}</h4>
            <p>{{ chat.description }}</p>
            <div class="chat-meta">
              <el-tag :type="getChatTypeColor(chat.type)" size="small">
                {{ getChatTypeLabel(chat.type) }}
              </el-tag>
              <span class="member-count">{{ chat.memberCount }}/{{ chat.maxMembers }} members</span>
            </div>
          </div>
        </div>

        <div class="chat-actions">
          <el-button type="primary" size="small" @click="joinChat(chat)">
            Join Chat
          </el-button>
          <el-button type="info" size="small" @click="viewChat(chat)">
            View
          </el-button>
        </div>
      </div>
    </div>

    <!-- Create Group Chat Dialog -->
    <el-dialog v-model="showCreateDialog" title="Create Group Chat" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="Chat Name">
          <el-input v-model="createForm.name" placeholder="Enter chat name" />
        </el-form-item>
        
        <el-form-item label="Description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="Describe the purpose of this chat"
          />
        </el-form-item>
        
        <el-form-item label="Chat Type">
          <el-select v-model="createForm.type" placeholder="Select chat type">
            <el-option
              v-for="type in chatTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Visibility">
          <el-radio-group v-model="createForm.isPublic">
            <el-radio :label="true">Public</el-radio>
            <el-radio :label="false">Private</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="Max Members">
          <el-input-number v-model="createForm.maxMembers" :min="2" :max="1000" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">Cancel</el-button>
        <el-button type="primary" @click="createGroupChat" :loading="creating">
          Create Chat
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { groupChatService, type GroupChatRoom, type GroupChatType } from '../services/group-chat.service';

// State
const chats = ref<GroupChatRoom[]>([]);
const showCreateDialog = ref(false);
const creating = ref(false);

// Form
const createForm = ref({
  name: '',
  description: '',
  type: undefined as GroupChatType | undefined,
  isPublic: true,
  maxMembers: 100
});

// Computed
const chatTypes = computed(() => groupChatService.getGroupChatTypes());

// Methods
const loadChats = async () => {
  try {
    const result = await groupChatService.getGroupChats();
    chats.value = result;
  } catch (error) {
    console.error('Error loading chats:', error);
    ElMessage.error('Failed to load group chats');
  }
};

const getChatIcon = (type: GroupChatType): string => {
  const chatType = chatTypes.value.find(t => t.value === type);
  return chatType ? chatType.icon : '💬';
};

const getChatTypeLabel = (type: GroupChatType): string => {
  const chatType = chatTypes.value.find(t => t.value === type);
  return chatType ? chatType.label : 'Unknown';
};

const getChatTypeColor = (type: GroupChatType): string => {
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

const joinChat = async (chat: GroupChatRoom) => {
  try {
    const success = await groupChatService.joinGroupChat(chat.id);
    if (success) {
      ElMessage.success(`Joined ${chat.name}`);
      loadChats();
    }
  } catch (error) {
    ElMessage.error('Failed to join group chat');
  }
};

const viewChat = (chat: GroupChatRoom) => {
  ElMessage.info(`Navigate to chat: ${chat.name}`);
};

const createGroupChat = async () => {
  if (!createForm.value.type) {
    ElMessage.error('Please select a chat type');
    return;
  }

  try {
    creating.value = true;
    
    const data = {
      name: createForm.value.name,
      description: createForm.value.description,
      type: createForm.value.type,
      isPublic: createForm.value.isPublic,
      maxMembers: createForm.value.maxMembers
    };
    
    const result = await groupChatService.createGroupChat(data);
    if (result) {
      ElMessage.success('Group chat created successfully');
      showCreateDialog.value = false;
      loadChats();
      
      // Reset form
      createForm.value = {
        name: '',
        description: '',
        type: undefined,
        isPublic: true,
        maxMembers: 100
      };
    }
  } catch (error) {
    ElMessage.error('Failed to create group chat');
  } finally {
    creating.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadChats();
});
</script>

<style scoped lang="scss">
.group-chat-manager {
  padding: 20px;

  .manager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      color: #2c3e50;
    }
  }

  .chats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;

    .chat-card {
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 20px;
      background: white;
      transition: all 0.3s ease;

      &:hover {
        border-color: #4a90e2;
        box-shadow: 0 4px 12px rgba(74, 144, 226, 0.15);
        transform: translateY(-2px);
      }

      .chat-header {
        display: flex;
        align-items: flex-start;
        margin-bottom: 15px;

        .chat-avatar {
          margin-right: 15px;
        }

        .chat-info {
          flex: 1;

          h4 {
            margin: 0 0 8px 0;
            color: #2c3e50;
            font-size: 18px;
          }

          p {
            margin: 0 0 10px 0;
            color: #7f8c8d;
            font-size: 14px;
            line-height: 1.4;
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
      }

      .chat-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
      }
    }
  }
}

@media (max-width: 768px) {
  .group-chat-manager {
    padding: 15px;

    .manager-header {
      flex-direction: column;
      gap: 15px;
    }

    .chats-grid {
      grid-template-columns: 1fr;
      gap: 15px;
    }
  }
}
</style>
