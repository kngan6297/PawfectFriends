<template>
  <div class="features-showcase">
    <div class="showcase-header">
      <h1>🐾 PawfectFriends Chat Features</h1>
      <p>Explore the powerful communication tools designed specifically for pet adoption</p>
    </div>

    <div class="features-grid">
      <!-- Real-time Chat -->
      <div class="feature-card">
        <div class="feature-icon">💬</div>
        <h3>Real-time Chat</h3>
        <p>Instant messaging with ZIM SDK for seamless communication between adopters, shelters, and staff.</p>
        <div class="feature-actions">
          <el-button type="primary" @click="startChat">Start Chat</el-button>
        </div>
      </div>

      <!-- Pet Chat Rooms -->
      <div class="feature-card">
        <div class="feature-icon">🏠</div>
        <h3>Pet Chat Rooms</h3>
        <p>Join specialized chat rooms for different pet categories, breeds, and adoption discussions.</p>
        <div class="feature-actions">
          <el-button type="primary" @click="showPetChatRooms">Browse Rooms</el-button>
        </div>
      </div>

      <!-- Group Chats -->
      <div class="feature-card">
        <div class="feature-icon">👥</div>
        <h3>Group Chats</h3>
        <p>Create and manage group conversations for shelters, volunteers, and adoption coordination.</p>
        <div class="feature-actions">
          <el-button type="primary" @click="showGroupChats">Manage Groups</el-button>
        </div>
      </div>

      <!-- File Sharing -->
      <div class="feature-card">
        <div class="feature-icon">📁</div>
        <h3>File Sharing</h3>
        <p>Share pet photos, documents, medical records, and training materials with built-in organization.</p>
        <div class="feature-actions">
          <el-button type="primary" @click="showFileGallery">View Files</el-button>
        </div>
      </div>

      <!-- Notifications -->
      <div class="feature-card">
        <div class="feature-icon">🔔</div>
        <h3>Smart Notifications</h3>
        <p>Real-time alerts for adoption updates, document requests, meetings, and important milestones.</p>
        <div class="feature-actions">
          <el-button type="primary" @click="showNotifications">View Notifications</el-button>
        </div>
      </div>

      <!-- User Management -->
      <div class="feature-card">
        <div class="feature-icon">👤</div>
        <h3>User Management</h3>
        <p>Search and connect with other users, view profiles, and manage your own account settings.</p>
        <div class="feature-actions">
          <el-button type="primary" @click="showUserSearch">Search Users</el-button>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats">
      <div class="stats-header">
        <h2>📊 Quick Statistics</h2>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-number">{{ stats.totalUsers }}</div>
          <div class="stat-label">Active Users</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.totalPets }}</div>
          <div class="stat-label">Available Pets</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.activeAdoptions }}</div>
          <div class="stat-label">Active Adoptions</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.totalMessages }}</div>
          <div class="stat-label">Messages Today</div>
        </div>
      </div>
    </div>

    <!-- Getting Started -->
    <div class="getting-started">
      <div class="getting-started-header">
        <h2>🚀 Getting Started</h2>
        <p>Follow these steps to make the most of PawfectFriends Chat</p>
      </div>
      <div class="steps-list">
        <div class="step-item">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>Complete Your Profile</h4>
            <p>Add your information, preferences, and experience with pets to help others get to know you.</p>
          </div>
        </div>
        <div class="step-item">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>Join Pet Chat Rooms</h4>
            <p>Browse and join chat rooms for pets you're interested in or have experience with.</p>
          </div>
        </div>
        <div class="step-item">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>Connect with Shelters</h4>
            <p>Start conversations with shelter staff to learn about available pets and adoption processes.</p>
          </div>
        </div>
        <div class="step-item">
          <div class="step-number">4</div>
          <div class="step-content">
            <h4>Share and Learn</h4>
            <p>Share photos, ask questions, and learn from the community about pet care and adoption.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Feature Dialogs -->
    <el-dialog v-model="showPetChatRoomsDialog" title="🏠 Pet Chat Rooms" width="80%">
      <PetChatRooms />
    </el-dialog>

    <el-dialog v-model="showGroupChatsDialog" title="👥 Group Chats" width="80%">
      <GroupChatManager />
    </el-dialog>

    <el-dialog v-model="showFileGalleryDialog" title="📁 File Gallery" width="80%">
      <FileGallery />
    </el-dialog>

    <el-dialog v-model="showNotificationsDialog" title="🔔 Notifications" width="80%">
      <NotificationCenter />
    </el-dialog>

    <el-dialog v-model="showUserSearchDialog" title="👤 Search Users" width="80%">
      <UserSearch />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

// State
const showPetChatRoomsDialog = ref(false);
const showGroupChatsDialog = ref(false);
const showFileGalleryDialog = ref(false);
const showNotificationsDialog = ref(false);
const showUserSearchDialog = ref(false);

const stats = ref({
  totalUsers: 0,
  totalPets: 0,
  activeAdoptions: 0,
  totalMessages: 0
});

// Methods
const startChat = () => {
  ElMessage.info('Navigate to the main chat interface to start conversations');
};

const showPetChatRooms = () => {
  showPetChatRoomsDialog.value = true;
};

const showGroupChats = () => {
  showGroupChatsDialog.value = true;
};

const showFileGallery = () => {
  showFileGalleryDialog.value = true;
};

const showNotifications = () => {
  showNotificationsDialog.value = true;
};

const showUserSearch = () => {
  showUserSearchDialog.value = true;
};

const loadStats = async () => {
  // Mock data for demo purposes
  stats.value = {
    totalUsers: 1247,
    totalPets: 89,
    activeAdoptions: 23,
    totalMessages: 156
  };
};

// Lifecycle
onMounted(() => {
  loadStats();
});
</script>

<style scoped lang="scss">
.features-showcase {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;

  .showcase-header {
    text-align: center;
    margin-bottom: 40px;

    h1 {
      font-size: 2.5rem;
      color: #2c3e50;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    p {
      font-size: 1.2rem;
      color: #7f8c8d;
      max-width: 600px;
      margin: 0 auto;
    }
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 25px;
    margin-bottom: 50px;

    .feature-card {
      background: white;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border: 1px solid #e9ecef;
      transition: all 0.3s ease;
      text-align: center;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 35px rgba(74, 144, 226, 0.2);
        border-color: #4A90E2;
      }

      .feature-icon {
        font-size: 3rem;
        margin-bottom: 20px;
      }

      h3 {
        font-size: 1.5rem;
        color: #2c3e50;
        margin-bottom: 15px;
      }

      p {
        color: #7f8c8d;
        line-height: 1.6;
        margin-bottom: 25px;
      }

      .feature-actions {
        .el-button {
          border-radius: 25px;
          padding: 12px 24px;
          font-weight: 600;
        }
      }
    }
  }

  .quick-stats {
    background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
    border-radius: 16px;
    padding: 30px;
    margin-bottom: 50px;
    color: white;

    .stats-header {
      text-align: center;
      margin-bottom: 30px;

      h2 {
        font-size: 2rem;
        margin: 0;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;

      .stat-item {
        text-align: center;

        .stat-number {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 1rem;
          opacity: 0.9;
        }
      }
    }
  }

  .getting-started {
    background: white;
    border-radius: 16px;
    padding: 30px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border: 1px solid #e9ecef;

    .getting-started-header {
      text-align: center;
      margin-bottom: 30px;

      h2 {
        font-size: 2rem;
        color: #2c3e50;
        margin-bottom: 10px;
      }

      p {
        color: #7f8c8d;
        font-size: 1.1rem;
      }
    }

    .steps-list {
      .step-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 25px;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 12px;
        border-left: 4px solid #4A90E2;

        .step-number {
          background: #4A90E2;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.2rem;
          margin-right: 20px;
          flex-shrink: 0;
        }

        .step-content {
          h4 {
            color: #2c3e50;
            margin: 0 0 10px 0;
            font-size: 1.2rem;
          }

          p {
            color: #7f8c8d;
            margin: 0;
            line-height: 1.6;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .features-showcase {
    padding: 20px;

    .showcase-header h1 {
      font-size: 2rem;
    }

    .features-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .quick-stats .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .getting-started .steps-list .step-item {
      flex-direction: column;
      text-align: center;

      .step-number {
        margin: 0 0 15px 0;
      }
    }
  }
}
</style>
