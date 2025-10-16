<template>
  <div v-if="showBanner" class="waiting-banner">
    <div class="banner-content">
      <div class="banner-icon">
        <el-icon class="waiting-icon">
          <Clock />
        </el-icon>
      </div>
      <div class="banner-text">
        <div class="banner-title">⏳ Waiting for shelter to join conversation...</div>
        <div class="banner-subtitle">
          The shelter hasn't logged into the chat system yet. They'll be automatically added when they come online.
        </div>
      </div>
      <div class="banner-actions">
        <el-button 
          type="primary" 
          size="small" 
          :loading="retrying"
          @click="handleRetry"
          class="retry-button"
        >
          {{ retrying ? 'Retrying...' : 'Try to invite again' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Clock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { conversationService } from '../services/conversation.service';

interface Props {
  conversationId?: string;
  status?: string;
  memberCount?: number;
}

const props = defineProps<Props>();

const retrying = ref(false);

// Get current user info to check if this is a shelter
const currentUser = computed(() => {
  // Try to get user info from various sources
  if (typeof window !== 'undefined' && (window as any).zimappconfig?.user) {
    return (window as any).zimappconfig.user;
  }
  return null;
});

// Show banner if status is pending_zim_member or if there's only 1 member
// But don't show for shelters - they shouldn't see "waiting for shelter"
const showBanner = computed(() => {
  // Don't show banner for shelters - they shouldn't see "waiting for shelter"
  if (currentUser.value?.userRole === 'shelter') {
    return false;
  }
  
  return props.status === 'pending_zim_member' || 
         (props.memberCount !== undefined && props.memberCount === 1);
});

const handleRetry = async () => {
  if (!props.conversationId) {
    ElMessage.warning('No conversation ID available for retry');
    return;
  }

  retrying.value = true;
  
  try {
    const result = await conversationService.retryPendingMembers(props.conversationId);
    
    if (result.success) {
      ElMessage.success(result.message);
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error('Retry failed:', error);
    ElMessage.error('Failed to retry invitation. Please try again later.');
  } finally {
    retrying.value = false;
  }
};
</script>

<style scoped lang="scss">
.waiting-banner {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border: 1px solid #f39c12;
  border-radius: 8px;
  margin: 12px 16px;
  box-shadow: 0 2px 8px rgba(243, 156, 18, 0.15);
  animation: slideIn 0.3s ease-out;
}

.banner-content {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
}

.banner-icon {
  flex-shrink: 0;
  
  .waiting-icon {
    font-size: 24px;
    color: #f39c12;
    animation: pulse 2s infinite;
  }
}

.banner-text {
  flex: 1;
  min-width: 0;
}

.banner-title {
  font-weight: 600;
  color: #8b4513;
  font-size: 14px;
  margin-bottom: 4px;
}

.banner-subtitle {
  font-size: 12px;
  color: #8b4513;
  opacity: 0.8;
  line-height: 1.4;
}

.banner-actions {
  flex-shrink: 0;
}

.retry-button {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 500;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

// Responsive design
@media (max-width: 768px) {
  .waiting-banner {
    margin: 8px 12px;
  }
  
  .banner-content {
    padding: 12px;
    gap: 8px;
  }
  
  .banner-title {
    font-size: 13px;
  }
  
  .banner-subtitle {
    font-size: 11px;
  }
  
  .retry-button {
    font-size: 11px;
    padding: 5px 10px;
  }
}
</style>
