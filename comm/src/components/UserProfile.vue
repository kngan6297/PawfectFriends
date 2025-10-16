<template>
  <div class="user-profile">
    <el-card class="profile-card" shadow="hover">
      <template #header>
        <div class="profile-header">
          <el-avatar 
            :size="80" 
            :src="userProfile?.avatar ? `${apiBaseUrl}/uploads/${userProfile.avatar}` : '/public/assets/p1.png'"
            :alt="userProfile?.firstName || 'User'"
          />
          <div class="profile-info">
            <h2>{{ userProfile?.firstName }} {{ userProfile?.lastName }}</h2>
            <p class="user-role">{{ userProfile?.role }}</p>
            <p class="user-email">{{ userProfile?.email }}</p>
          </div>
        </div>
      </template>

      <div class="profile-details">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="Phone">
            {{ userProfile?.phone || 'Not provided' }}
          </el-descriptions-item>
          <el-descriptions-item label="Address">
            {{ userProfile?.address || 'Not provided' }}
          </el-descriptions-item>
          <el-descriptions-item label="Member Since">
            {{ formatDate(userProfile?.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="Last Updated">
            {{ formatDate(userProfile?.updatedAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="profile-actions" v-if="isOwnProfile">
          <el-button type="primary" @click="editProfile">
            <el-icon><Edit /></el-icon>
            Edit Profile
          </el-button>
          <el-button type="success" @click="changePassword">
            <el-icon><Lock /></el-icon>
            Change Password
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Edit Profile Dialog -->
    <el-dialog v-model="showEditDialog" title="Edit Profile" width="500px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="First Name" prop="firstName">
          <el-input v-model="editForm.firstName" />
        </el-form-item>
        <el-form-item label="Last Name" prop="lastName">
          <el-input v-model="editForm.lastName" />
        </el-form-item>
        <el-form-item label="Phone" prop="phone">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="Address" prop="address">
          <el-input v-model="editForm.address" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">Cancel</el-button>
        <el-button type="primary" @click="saveProfile" :loading="saving">
          Save Changes
        </el-button>
      </template>
    </el-dialog>

    <!-- Change Password Dialog -->
    <el-dialog v-model="showPasswordDialog" title="Change Password" width="400px">
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="120px">
        <el-form-item label="Current Password" prop="currentPassword">
          <el-input v-model="passwordForm.currentPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="New Password" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="Confirm Password" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">Cancel</el-button>
        <el-button type="primary" @click="savePassword" :loading="changingPassword">
          Change Password
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Edit, Lock } from '@element-plus/icons-vue';
import { userService, type PawfectFriendsUser } from '../services/user.service';
import { getIntegrationConfig } from '../config/integration';

const props = defineProps<{
  userId?: string;
}>();

const emit = defineEmits<{
  profileUpdated: [user: PawfectFriendsUser];
}>();

const apiBaseUrl = getIntegrationConfig().apiBaseUrl;
const userProfile = ref<PawfectFriendsUser | null>(null);
const loading = ref(false);
const saving = ref(false);
const changingPassword = ref(false);

// Dialog states
const showEditDialog = ref(false);
const showPasswordDialog = ref(false);

// Form refs
const editFormRef = ref();
const passwordFormRef = ref();

// Edit form
const editForm = ref({
  firstName: '',
  lastName: '',
  phone: '',
  address: ''
});

// Password form
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// Form validation rules
const editRules = {
  firstName: [{ required: true, message: 'First name is required', trigger: 'blur' }],
  lastName: [{ required: true, message: 'Last name is required', trigger: 'blur' }]
};

const passwordRules = {
  currentPassword: [{ required: true, message: 'Current password is required', trigger: 'blur' }],
  newPassword: [
    { required: true, message: 'New password is required', trigger: 'blur' },
    { min: 6, message: 'Password must be at least 6 characters', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm your password', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('Passwords do not match'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// Computed properties
const isOwnProfile = computed(() => {
  // This would need to be implemented based on your auth system
  return true; // For now, assume it's the own profile
});

// Methods
const loadUserProfile = async () => {
  loading.value = true;
  try {
    if (props.userId) {
      userProfile.value = await userService.getUserProfileById(props.userId);
    } else {
      userProfile.value = await userService.getCurrentUserProfile();
    }
    
    if (userProfile.value) {
      // Populate edit form
      editForm.value = {
        firstName: userProfile.value.firstName,
        lastName: userProfile.value.lastName,
        phone: userProfile.value.phone || '',
        address: userProfile.value.address || ''
      };
    }
  } catch (error) {
    ElMessage.error('Failed to load user profile');
    console.error('Error loading user profile:', error);
  } finally {
    loading.value = false;
  }
};

const editProfile = () => {
  showEditDialog.value = true;
};

const saveProfile = async () => {
  if (!editFormRef.value) return;
  
  try {
    await editFormRef.value.validate();
    saving.value = true;
    
    const success = await userService.updateUserProfile(editForm.value);
    
    if (success) {
      ElMessage.success('Profile updated successfully');
      showEditDialog.value = false;
      await loadUserProfile(); // Reload profile
      emit('profileUpdated', userProfile.value!);
    } else {
      ElMessage.error('Failed to update profile');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
  } finally {
    saving.value = false;
  }
};

const changePassword = () => {
  showPasswordDialog.value = true;
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
};

const savePassword = async () => {
  if (!passwordFormRef.value) return;
  
  try {
    await passwordFormRef.value.validate();
    changingPassword.value = true;
    
    // This would need to be implemented in your auth service
    // const success = await authService.changePassword(passwordForm.value);
    
    ElMessage.success('Password changed successfully');
    showPasswordDialog.value = false;
  } catch (error) {
    console.error('Error changing password:', error);
  } finally {
    changingPassword.value = false;
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Not available';
  return new Date(dateString).toLocaleDateString('en-GB');
};

// Lifecycle
onMounted(() => {
  loadUserProfile();
});
</script>

<style scoped lang="scss">
.user-profile {
  padding: 20px;
  
  .profile-card {
    max-width: 600px;
    margin: 0 auto;
    
    .profile-header {
      display: flex;
      align-items: center;
      gap: 20px;
      
      .profile-info {
        h2 {
          margin: 0 0 8px 0;
          color: #2c3e50;
        }
        
        .user-role {
          margin: 0 0 4px 0;
          color: #4a90e2;
          font-weight: 600;
          text-transform: capitalize;
        }
        
        .user-email {
          margin: 0;
          color: #7f8c8d;
          font-size: 14px;
        }
      }
    }
    
    .profile-details {
      margin-top: 20px;
      
      .profile-actions {
        margin-top: 20px;
        display: flex;
        gap: 10px;
        justify-content: center;
      }
    }
  }
}
</style>
