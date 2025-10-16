<template>
  <div class="pet-chat-rooms">
    <el-card class="rooms-header" shadow="hover">
      <template #header>
        <div class="header-content">
          <div class="header-left">
            <h2>🐾 Pet Chat Rooms</h2>
            <p class="subtitle">Connect with pet lovers, discuss adoptions, and get shelter updates</p>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="showCreateDialog = true">
              <el-icon><Plus /></el-icon>
              Create Room
            </el-button>
            <el-button type="success" @click="refreshRooms">
              <el-icon><Refresh /></el-icon>
              Refresh
            </el-button>
          </div>
        </div>
      </template>

      <!-- Search and Filters -->
      <div class="search-filters">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input
              v-model="searchQuery"
              placeholder="Search pet chat rooms..."
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-select v-model="selectedCategory" placeholder="Pet Category" clearable @change="applyFilters">
              <el-option
                v-for="category in petCategories"
                :key="category.value"
                :label="category.label"
                :value="category.value"
              >
                <span class="category-option">
                  <span class="category-icon">{{ category.icon }}</span>
                  {{ category.label }}
                </span>
              </el-option>
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="selectedType" placeholder="Room Type" clearable @change="applyFilters">
              <el-option
                v-for="type in chatRoomTypes"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              >
                <span class="type-option">
                  <span class="type-icon">{{ type.icon }}</span>
                  {{ type.label }}
                </span>
              </el-option>
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="selectedTags" multiple placeholder="Tags" clearable @change="applyFilters">
              <el-option
                v-for="tag in popularTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-switch
              v-model="showPublicOnly"
              active-text="Public Only"
              @change="applyFilters"
            />
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- All Rooms -->
    <el-card class="rooms-list" shadow="hover">
      <template #header>
        <div class="list-header">
          <h3>All Pet Chat Rooms</h3>
          <div class="list-actions">
            <el-button-group>
              <el-button :type="viewMode === 'grid' ? 'primary' : ''" @click="viewMode = 'grid'">
                <el-icon><Grid /></el-icon>
              </el-button>
              <el-button :type="viewMode === 'list' ? 'primary' : ''" @click="viewMode = 'list'">
                <el-icon><List /></el-icon>
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="filteredRooms.length === 0" class="no-rooms">
        <el-empty description="No pet chat rooms found">
          <el-button type="primary" @click="showCreateDialog = true">Create First Room</el-button>
        </el-empty>
      </div>

      <div v-else class="rooms-container" :class="viewMode">
        <div
          v-for="room in filteredRooms"
          :key="room.id"
          class="room-card"
          @click="viewRoom(room)"
        >
          <div class="room-header">
            <el-avatar :size="60" :src="room.avatar || '/public/assets/p1.png'" />
            <div class="room-status">
              <el-tag v-if="room.isPublic" type="success" size="small">Public</el-tag>
              <el-tag v-else type="warning" size="small">Private</el-tag>
            </div>
          </div>

          <div class="room-content">
            <h4 class="room-name">{{ room.name }}</h4>
            <p class="room-description">{{ room.description }}</p>
            
            <div class="room-category">
              <el-tag :type="getCategoryColor(room.category)" size="small">
                {{ getCategoryIcon(room.category) }} {{ getCategoryLabel(room.category) }}
              </el-tag>
            </div>

            <div class="room-type">
              <el-tag :type="getRoomTypeColor(room.type)" size="small">
                {{ getRoomTypeIcon(room.type) }} {{ getRoomTypeLabel(room.type) }}
              </el-tag>
            </div>

            <div class="room-tags">
              <el-tag
                v-for="tag in room.tags.slice(0, 3)"
                :key="tag"
                size="small"
                class="tag"
              >
                {{ tag }}
              </el-tag>
              <el-tag v-if="room.tags.length > 3" size="small" type="info">
                +{{ room.tags.length - 3 }} more
              </el-tag>
            </div>

            <div class="room-stats">
              <span class="stat">
                <el-icon><User /></el-icon>
                {{ room.memberCount }} members
              </span>
              <span class="stat">
                <el-icon><ChatDotRound /></el-icon>
                {{ room.unreadCount }} unread
              </span>
            </div>
          </div>

          <div class="room-actions">
            <el-button type="primary" size="small" @click.stop="joinRoom(room)">
              Join Room
            </el-button>
            <el-button type="info" size="small" @click.stop="viewRoomDetails(room)">
              Details
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Create Room Dialog -->
    <el-dialog v-model="showCreateDialog" title="Create Pet Chat Room" width="600px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="120px">
        <el-form-item label="Room Name" prop="name">
          <el-input v-model="createForm.name" placeholder="Enter room name" />
        </el-form-item>
        
        <el-form-item label="Description" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="Describe what this room is about"
          />
        </el-form-item>
        
        <el-form-item label="Room Type" prop="type">
          <el-select v-model="createForm.type" placeholder="Select room type">
            <el-option
              v-for="type in chatRoomTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Pet Category" prop="category">
          <el-select v-model="createForm.category" placeholder="Select pet category">
            <el-option
              v-for="category in petCategories"
              :key="category.value"
              :label="category.label"
              :value="category.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Tags" prop="tags">
          <el-select
            v-model="createForm.tags"
            multiple
            filterable
            allow-create
            placeholder="Select or create tags"
          >
            <el-option
              v-for="tag in popularTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Room Rules" prop="rules">
          <el-input
            v-model="createForm.rules"
            type="textarea"
            :rows="3"
            placeholder="Enter room rules (one per line)"
          />
        </el-form-item>
        
        <el-form-item label="Room Settings">
          <el-checkbox v-model="createForm.isPublic">Public Room</el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">Cancel</el-button>
        <el-button type="primary" @click="handleCreateRoom" :loading="creating">
          Create Room
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Refresh, Search, Grid, List, User, ChatDotRound } from '@element-plus/icons-vue';
import { 
  petChatService, 
  type PetChatRoom, 
  type PetChatType, 
  type PetCategory,
  type CreatePetChatRoomRequest 
} from '../services/pet-chat.service';

// Props and Emits
const emit = defineEmits<{
  roomSelected: [room: PetChatRoom];
  roomJoined: [room: PetChatRoom];
}>();

// State
const rooms = ref<PetChatRoom[]>([]);
const loading = ref(false);
const creating = ref(false);
const viewMode = ref<'grid' | 'list'>('grid');

// Search and filters
const searchQuery = ref('');
const selectedCategory = ref<PetCategory | ''>('');
const selectedType = ref<PetChatType | ''>('');
const selectedTags = ref<string[]>([]);
const showPublicOnly = ref(false);

// Dialogs
const showCreateDialog = ref(false);

// Form refs
const createFormRef = ref();

// Create form
const createForm = ref<CreatePetChatRoomRequest>({
  type: PetChatType.ADOPTION_DISCUSSION,
  name: '',
  description: '',
  category: PetCategory.ALL_PETS,
  tags: [],
  rules: [],
  isPublic: true,
  maxParticipants: undefined,
  avatar: ''
});

// Form validation rules
const createRules = {
  name: [
    { required: true, message: 'Please enter room name', trigger: 'blur' },
    { min: 3, max: 50, message: 'Name must be between 3 and 50 characters', trigger: 'blur' }
  ],
  description: [
    { required: true, message: 'Please enter room description', trigger: 'blur' },
    { min: 10, max: 500, message: 'Description must be between 10 and 500 characters', trigger: 'blur' }
  ],
  type: [{ required: true, message: 'Please select room type', trigger: 'change' }],
  category: [{ required: true, message: 'Please select pet category', trigger: 'change' }],
  tags: [{ required: true, message: 'Please select at least one tag', trigger: 'change' }],
  rules: [{ required: true, message: 'Please enter room rules', trigger: 'blur' }]
};

// Computed properties
const petCategories = computed(() => petChatService.getPetCategories());
const chatRoomTypes = computed(() => petChatService.getChatRoomTypes());
const popularTags = computed(() => petChatService.getPopularTags());

const filteredRooms = computed(() => {
  let filtered = rooms.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(room => 
      room.name.toLowerCase().includes(query) ||
      room.description.toLowerCase().includes(query) ||
      room.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(room => room.category === selectedCategory.value);
  }

  if (selectedType.value) {
    filtered = filtered.filter(room => room.type === selectedType.value);
  }

  if (selectedTags.value.length > 0) {
    filtered = filtered.filter(room => 
      selectedTags.value.some(tag => room.tags.includes(tag))
    );
  }

  if (showPublicOnly.value) {
    filtered = filtered.filter(room => room.isPublic);
  }

  return filtered;
});

// Methods
const loadRooms = async () => {
  try {
    loading.value = true;
    rooms.value = await petChatService.getPetChatRooms();
  } catch (error) {
    ElMessage.error('Failed to load pet chat rooms');
    console.error('Error loading rooms:', error);
  } finally {
    loading.value = false;
  }
};

const refreshRooms = () => {
  loadRooms();
};

const handleSearch = () => {
  // Search is handled by computed property
};

const applyFilters = () => {
  // Filters are applied automatically through computed property
};

const handleCreateRoom = async () => {
  if (!createFormRef.value) return;
  
  try {
    await createFormRef.value.validate();
    creating.value = true;
    
    // Parse rules from textarea
    const rules = createForm.value.rules
      .split('\n')
      .map(rule => rule.trim())
      .filter(rule => rule.length > 0);
    
    const roomData = {
      ...createForm.value,
      rules
    };
    
    const room = await petChatService.createPetChatRoom(roomData);
    
    if (room) {
      ElMessage.success('Pet chat room created successfully!');
      showCreateDialog.value = false;
      await loadRooms();
      emit('roomSelected', room);
    } else {
      ElMessage.error('Failed to create pet chat room');
    }
  } catch (error) {
    console.error('Error creating room:', error);
  } finally {
    creating.value = false;
  }
};

const joinRoom = async (room: PetChatRoom) => {
  try {
    const success = await petChatService.joinPetChatRoom(room.id);
    
    if (success) {
      ElMessage.success(`Successfully joined ${room.name}`);
      emit('roomJoined', room);
      await loadRooms();
    } else {
      ElMessage.error('Failed to join room');
    }
  } catch (error) {
    ElMessage.error('Error joining room');
    console.error('Error joining room:', error);
  }
};

const viewRoom = (room: PetChatRoom) => {
  emit('roomSelected', room);
};

const viewRoomDetails = (room: PetChatRoom) => {
  // For now, just emit the room selection
  emit('roomSelected', room);
};

// Utility methods
const getCategoryColor = (category: PetCategory): string => {
  const colors: Record<PetCategory, string> = {
    [PetCategory.DOGS]: 'primary',
    [PetCategory.CATS]: 'success',
    [PetCategory.SMALL_ANIMALS]: 'warning',
    [PetCategory.BIRDS]: 'info',
    [PetCategory.REPTILES]: 'danger',
    [PetCategory.FARM_ANIMALS]: 'warning',
    [PetCategory.EXOTIC]: 'danger',
    [PetCategory.ALL_PETS]: 'info'
  };
  return colors[category] || 'info';
};

const getCategoryIcon = (category: PetCategory): string => {
  const categoryData = petCategories.value.find(c => c.value === category);
  return categoryData?.icon || '🐾';
};

const getCategoryLabel = (category: PetCategory): string => {
  const categoryData = petCategories.value.find(c => c.value === category);
  return categoryData?.label || 'Unknown';
};

const getRoomTypeColor = (type: PetChatType): string => {
  const colors: Record<PetChatType, string> = {
    [PetChatType.ADOPTION_DISCUSSION]: 'success',
    [PetChatType.SHELTER_UPDATES]: 'primary',
    [PetChatType.PET_CARE_TIPS]: 'info',
    [PetChatType.BREED_SPECIFIC]: 'warning',
    [PetChatType.EMERGENCY_SUPPORT]: 'danger',
    [PetChatType.SUCCESS_STORIES]: 'success',
    [PetChatType.VOLUNTEER_COORDINATION]: 'primary'
  };
  return colors[type] || 'info';
};

const getRoomTypeIcon = (type: PetChatType): string => {
  const typeData = chatRoomTypes.value.find(t => t.value === type);
  return typeData?.icon || '💬';
};

const getRoomTypeLabel = (type: PetChatType): string => {
  const typeData = chatRoomTypes.value.find(t => t.value === type);
  return typeData?.label || 'Unknown';
};

// Lifecycle
onMounted(() => {
  loadRooms();
});
</script>

<style scoped lang="scss">
.pet-chat-rooms {
  padding: 20px;
  
  .rooms-header {
    margin-bottom: 20px;
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .header-left {
        h2 {
          margin: 0 0 8px 0;
          color: #2c3e50;
        }
        
        .subtitle {
          margin: 0;
          color: #7f8c8d;
          font-size: 14px;
        }
      }
      
      .header-actions {
        display: flex;
        gap: 10px;
      }
    }
    
    .search-filters {
      margin-top: 20px;
      
      .category-option,
      .type-option {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .category-icon,
        .type-icon {
          font-size: 16px;
        }
      }
    }
  }
  
  .rooms-list {
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h3 {
        margin: 0;
        color: #2c3e50;
      }
    }
    
    .loading-state {
      padding: 40px;
      text-align: center;
    }
    
    .no-rooms {
      padding: 40px;
      text-align: center;
    }
    
    .rooms-container {
      &.grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 20px;
      }
      
      .room-card {
        border: 1px solid #e9ecef;
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        background: white;
        
        &:hover {
          border-color: #4a90e2;
          box-shadow: 0 4px 12px rgba(74, 144, 226, 0.15);
          transform: translateY(-2px);
        }
        
        .room-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
          
          .room-status {
            display: flex;
            gap: 5px;
          }
        }
        
        .room-content {
          .room-name {
            margin: 0 0 8px 0;
            color: #2c3e50;
            font-size: 18px;
          }
          
          .room-description {
            margin: 0 0 12px 0;
            color: #7f8c8d;
            line-height: 1.5;
          }
          
          .room-category,
          .room-type {
            margin-bottom: 10px;
          }
          
          .room-tags {
            margin-bottom: 15px;
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            
            .tag {
              margin: 0;
            }
          }
          
          .room-stats {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
            
            .stat {
              display: flex;
              align-items: center;
              gap: 5px;
              color: #7f8c8d;
              font-size: 12px;
            }
          }
        }
        
        .room-actions {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-top: 15px;
        }
      }
    }
  }
}
</style>
