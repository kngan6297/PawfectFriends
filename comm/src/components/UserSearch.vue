<template>
  <div class="user-search">
    <el-card class="search-card" shadow="hover">
      <template #header>
        <div class="search-header">
          <h3>Find Users</h3>
          <p>Search for other users to start conversations</p>
        </div>
      </template>

      <div class="search-form">
        <el-input
          v-model="searchQuery"
          placeholder="Search by name or email..."
          clearable
          @input="handleSearch"
          @clear="clearSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="search-filters" v-if="showFilters">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-select v-model="roleFilter" placeholder="Filter by role" clearable>
              <el-option label="All Roles" value="" />
              <el-option label="Admin" value="admin" />
              <el-option label="Moderator" value="moderator" />
              <el-option label="User" value="user" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-select v-model="sortBy" placeholder="Sort by">
              <el-option label="Name (A-Z)" value="name" />
              <el-option label="Name (Z-A)" value="name-desc" />
              <el-option label="Recently Active" value="recent" />
              <el-option label="Role" value="role" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-button @click="applyFilters" type="primary">
              Apply Filters
            </el-button>
          </el-col>
        </el-row>
      </div>

      <div class="search-results" v-if="searchResults.length > 0">
        <h4>Search Results ({{ searchResults.length }})</h4>
        <div class="user-list">
          <div
            v-for="user in filteredResults"
            :key="user.id"
            class="user-item"
            @click="selectUser(user)"
          >
            <el-avatar
              :size="50"
              :src="user.avatar ? `${apiBaseUrl}/uploads/${user.avatar}` : '/public/assets/p1.png'"
              :alt="user.firstName"
            />
            <div class="user-info">
              <h5>{{ user.firstName }} {{ user.lastName }}</h5>
              <p class="user-email">{{ user.email }}</p>
              <el-tag :type="getRoleTagType(user.role)" size="small">
                {{ user.role }}
              </el-tag>
            </div>
            <div class="user-actions">
              <el-button type="primary" size="small" @click.stop="startChat(user)">
                <el-icon><ChatDotRound /></el-icon>
                Chat
              </el-button>
              <el-button type="info" size="small" @click.stop="viewProfile(user)">
                <el-icon><User /></el-icon>
                Profile
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="no-results" v-else-if="hasSearched && searchResults.length === 0">
        <el-empty description="No users found matching your search criteria" />
      </div>

      <div class="quick-actions" v-if="!hasSearched">
        <h4>Quick Actions</h4>
        <div class="action-buttons">
          <el-button @click="showOnlineUsers" type="success">
            <el-icon><CircleCheck /></el-icon>
            Show Online Users
          </el-button>
          <el-button @click="showRecentUsers" type="warning">
            <el-icon><Clock /></el-icon>
            Recent Users
          </el-button>
          <el-button @click="showAllUsers" type="info">
            <el-icon><UserFilled /></el-icon>
            Browse All Users
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- User Profile Dialog -->
    <el-dialog v-model="showProfileDialog" title="User Profile" width="500px">
      <UserProfile :userId="selectedUser?.id" @profileUpdated="handleProfileUpdated" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, ChatDotRound, User, CircleCheck, Clock, UserFilled } from '@element-plus/icons-vue';
import { userService, type PawfectFriendsUser } from '../services/user.service';
import { getIntegrationConfig } from '../config/integration';
import UserProfile from './UserProfile.vue';

const emit = defineEmits<{
  userSelected: [user: PawfectFriendsUser];
  startChat: [user: PawfectFriendsUser];
}>();

const apiBaseUrl = getIntegrationConfig().apiBaseUrl;

// Search state
const searchQuery = ref('');
const searchResults = ref<PawfectFriendsUser[]>([]);
const hasSearched = ref(false);
const loading = ref(false);

// Filters
const showFilters = ref(false);
const roleFilter = ref('');
const sortBy = ref('name');

// Dialog state
const showProfileDialog = ref(false);
const selectedUser = ref<PawfectFriendsUser | null>(null);

// Computed properties
const filteredResults = computed(() => {
  let results = [...searchResults.value];

  // Apply role filter
  if (roleFilter.value) {
    results = results.filter(user => user.role.toLowerCase() === roleFilter.value.toLowerCase());
  }

  // Apply sorting
  switch (sortBy.value) {
    case 'name':
      results.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
      break;
    case 'name-desc':
      results.sort((a, b) => `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`));
      break;
    case 'role':
      results.sort((a, b) => a.role.localeCompare(b.role));
      break;
    case 'recent':
      // Sort by updatedAt if available
      results.sort((a, b) => {
        if (!a.updatedAt || !b.updatedAt) return 0;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      break;
  }

  return results;
});

// Methods
const handleSearch = async () => {
  if (searchQuery.value.trim().length < 2) {
    clearSearch();
    return;
  }

  await performSearch();
};

const performSearch = async () => {
  if (!searchQuery.value.trim()) return;

  loading.value = true;
  try {
    const results = await userService.searchUsers(searchQuery.value.trim());
    searchResults.value = results;
    hasSearched.value = true;
  } catch (error) {
    ElMessage.error('Search failed. Please try again.');
    console.error('Search error:', error);
  } finally {
    loading.value = false;
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  hasSearched.value = false;
  roleFilter.value = '';
  sortBy.value = 'name';
};

const applyFilters = () => {
  // Filters are applied automatically through computed property
  ElMessage.success('Filters applied');
};

const selectUser = (user: PawfectFriendsUser) => {
  emit('userSelected', user);
};

const startChat = (user: PawfectFriendsUser) => {
  emit('startChat', user);
};

const viewProfile = (user: PawfectFriendsUser) => {
  selectedUser.value = user;
  showProfileDialog.value = true;
};

const handleProfileUpdated = (user: PawfectFriendsUser) => {
  // Update the user in search results
  const index = searchResults.value.findIndex(u => u.id === user.id);
  if (index !== -1) {
    searchResults.value[index] = user;
  }
  ElMessage.success('Profile updated successfully');
};

const showOnlineUsers = async () => {
  loading.value = true;
  try {
    const results = await userService.getOnlineUsers();
    searchResults.value = results;
    hasSearched.value = true;
    ElMessage.success(`Found ${results.length} online users`);
  } catch (error) {
    ElMessage.error('Failed to fetch online users');
    console.error('Error fetching online users:', error);
  } finally {
    loading.value = false;
  }
};

const showRecentUsers = async () => {
  loading.value = true;
  try {
    // This would need to be implemented in your backend
    // For now, we'll just show a message
    ElMessage.info('Recent users feature coming soon');
  } catch (error) {
    ElMessage.error('Failed to fetch recent users');
    console.error('Error fetching recent users:', error);
  } finally {
    loading.value = false;
  }
};

const showAllUsers = async () => {
  loading.value = true;
  try {
    // This would need to be implemented in your backend
    // For now, we'll just show a message
    ElMessage.info('Browse all users feature coming soon');
  } catch (error) {
    ElMessage.error('Failed to fetch all users');
    console.error('Error fetching all users:', error);
  } finally {
    loading.value = false;
  }
};

const getRoleTagType = (role: string): string => {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'danger';
    case 'moderator':
      return 'warning';
    case 'user':
    default:
      return 'info';
  }
};

// Lifecycle
onMounted(() => {
  // Initialize component
});
</script>

<style scoped lang="scss">
.user-search {
  padding: 20px;
  
  .search-card {
    max-width: 800px;
    margin: 0 auto;
    
    .search-header {
      h3 {
        margin: 0 0 8px 0;
        color: #2c3e50;
      }
      
      p {
        margin: 0;
        color: #7f8c8d;
        font-size: 14px;
      }
    }
    
    .search-form {
      margin-bottom: 20px;
    }
    
    .search-filters {
      margin-bottom: 20px;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }
    
    .search-results {
      h4 {
        margin: 0 0 16px 0;
        color: #2c3e50;
      }
      
      .user-list {
        .user-item {
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
          
          .user-info {
            flex: 1;
            margin-left: 16px;
            
            h5 {
              margin: 0 0 4px 0;
              color: #2c3e50;
            }
            
            .user-email {
              margin: 0 0 8px 0;
              color: #7f8c8d;
              font-size: 14px;
            }
          }
          
          .user-actions {
            display: flex;
            gap: 8px;
          }
        }
      }
    }
    
    .no-results {
      text-align: center;
      padding: 40px 20px;
    }
    
    .quick-actions {
      h4 {
        margin: 0 0 16px 0;
        color: #2c3e50;
      }
      
      .action-buttons {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
    }
  }
}
</style>
