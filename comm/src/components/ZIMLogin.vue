<script setup lang="ts">
import { Tools, User, Lock, Message } from '@element-plus/icons-vue';
import { computed, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import useStore from '../store/index';
import ZIMConfigDialog from './dialog/ZIMConfigDialog.vue';
import { authService, type LoginCredentials } from '../services/auth.service';

const zimStore = useStore();
const locale = computed(() => zimStore.locale);

const loading = ref(false);
const showConfigDialog = ref(false);
const showRegisterForm = ref(false);

// Check if user is already authenticated
const checkExistingAuth = () => {
  const token = authService.getAuthToken();
  if (token) {
    // User is already logged in, proceed to chat
    zimStore.isLogged = true;
  }
};

// Initialize auth check
checkExistingAuth();

const loginForm = reactive<LoginCredentials>({
  email: '',
  password: ''
});

const registerForm = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: ''
});

const onLogin = async () => {
  if (!loginForm.email || !loginForm.password) {
    ElMessage.warning('Please fill in all fields');
    return;
  }

  loading.value = true;
  try {
    const response = await authService.login(loginForm);
    
    if (response.success) {
      ElMessage.success(response.message);
      // Set ZIM store as logged in
      zimStore.isLogged = true;
      // Clear form
      loginForm.email = '';
      loginForm.password = '';
    } else {
      ElMessage.error(response.message);
    }
  } catch (error) {
    ElMessage.error('Login failed. Please try again.');
  } finally {
    loading.value = false;
  }
};

const onRegister = async () => {
  if (!registerForm.email || !registerForm.password || !registerForm.confirmPassword || !registerForm.firstName || !registerForm.lastName) {
    ElMessage.warning('Please fill in all fields');
    return;
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    ElMessage.error('Passwords do not match');
    return;
  }

  loading.value = true;
  try {
    const response = await authService.register({
      email: registerForm.email,
      password: registerForm.password,
      firstName: registerForm.firstName,
      lastName: registerForm.lastName
    });
    
    if (response.success) {
      ElMessage.success(response.message);
      // Switch back to login form
      showRegisterForm.value = false;
      // Clear form
      registerForm.email = '';
      registerForm.password = '';
      registerForm.confirmPassword = '';
      registerForm.firstName = '';
      registerForm.lastName = '';
    } else {
      ElMessage.error(response.message);
    }
  } catch (error) {
    ElMessage.error('Registration failed. Please try again.');
  } finally {
    loading.value = false;
  }
};

const onConfigDialogClose = (ev: any) => {
  showConfigDialog.value = false;
  if (!ev) return;
  zimStore.setAppGlobalConfig(ev, true);
};

const toggleForm = () => {
  showRegisterForm.value = !showRegisterForm.value;
  // Clear forms when switching
  loginForm.email = '';
  loginForm.password = '';
  registerForm.email = '';
  registerForm.password = '';
  registerForm.confirmPassword = '';
  registerForm.firstName = '';
  registerForm.lastName = '';
};
</script>

<template>
  <div class="container login-from" v-loading="loading">
    <div class="toolbar">
      <span>PawfectFriends Chat</span>
      <el-button
        style="float: right; margin-right: 12px"
        type="primary"
        link
        :icon="Tools"
        @click="showConfigDialog = true"
      />
    </div>

    <!-- Login Form -->
    <el-form v-if="!showRegisterForm" :model="loginForm" label-width="90px" class="auth-form">
      <el-form-item label="Email">
        <el-input 
          v-model="loginForm.email" 
          type="email"
          placeholder="Enter your email"
          :prefix-icon="Message"
        />
      </el-form-item>
      <el-form-item label="Password">
        <el-input 
          v-model="loginForm.password" 
          type="password"
          placeholder="Enter your password"
          :prefix-icon="Lock"
          show-password
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onLogin" class="auth-button">
          {{ locale.cmn.login }}
        </el-button>
      </el-form-item>
      <div class="form-footer">
        <span>Don't have an account?</span>
        <el-button type="text" @click="toggleForm">Register here</el-button>
      </div>
    </el-form>

    <!-- Register Form -->
    <el-form v-else :model="registerForm" label-width="90px" class="auth-form">
      <el-form-item label="First Name">
        <el-input 
          v-model="registerForm.firstName" 
          placeholder="Enter your first name"
          :prefix-icon="User"
        />
      </el-form-item>
      <el-form-item label="Last Name">
        <el-input 
          v-model="registerForm.lastName" 
          placeholder="Enter your last name"
          :prefix-icon="User"
        />
      </el-form-item>
      <el-form-item label="Email">
        <el-input 
          v-model="registerForm.email" 
          type="email"
          placeholder="Enter your email"
          :prefix-icon="Message"
        />
      </el-form-item>
      <el-form-item label="Password">
        <el-input 
          v-model="registerForm.password" 
          type="password"
          placeholder="Enter your password"
          :prefix-icon="Lock"
          show-password
        />
      </el-form-item>
      <el-form-item label="Confirm Password">
        <el-input 
          v-model="registerForm.confirmPassword" 
          type="password"
          placeholder="Confirm your password"
          :prefix-icon="Lock"
          show-password
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onRegister" class="auth-button">
          Register
        </el-button>
      </el-form-item>
      <div class="form-footer">
        <span>Already have an account?</span>
        <el-button type="text" @click="toggleForm">Login here</el-button>
      </div>
    </el-form>

    <ZIMConfigDialog :init="true" :visible="showConfigDialog" @close="onConfigDialogClose" />
  </div>
</template>

<style lang="scss">
.login-from {
  flex-direction: column;
  align-items: center;

  .toolbar {
    width: 100%;
    padding: 16px 0;
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    color: #4A90E2;
    text-shadow: 0 2px 4px rgba(74, 144, 226, 0.1);

    .el-icon,
    .el-icon svg {
      width: 2em;
      height: 2em;
      color: #4A90E2;
    }
  }

  .auth-form {
    padding-top: 16px;
    width: 320px;
    
    .el-form-item__label {
      color: #2C3E50;
      font-weight: 600;
    }
    
    .el-input__wrapper {
      border-radius: 8px;
      border: 2px solid #E8F4FD;
      transition: all 0.3s ease;
      
      &:hover, &:focus-within {
        border-color: #4A90E2;
        box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
      }
    }
    
    .auth-button {
      background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-weight: 600;
      transition: all 0.3s ease;
      width: 100%;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
      }
    }

    .form-footer {
      text-align: center;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #E8F4FD;
      
      span {
        color: #6B7280;
        margin-right: 8px;
      }
      
      .el-button--text {
        color: #4A90E2;
        font-weight: 600;
        
        &:hover {
          color: #357ABD;
        }
      }
    }
  }
}
</style>
