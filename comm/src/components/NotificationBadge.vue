<template>
  <div class="notification-badge-wrapper">
    <el-badge 
      :value="unreadCount" 
      :hidden="unreadCount === 0" 
      :max="99"
      class="notification-badge"
    >
      <el-button 
        type="text" 
        @click="$emit('click')"
        class="notification-button"
      >
        <el-icon :size="20">
          <Bell />
        </el-icon>
      </el-button>
    </el-badge>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Bell } from '@element-plus/icons-vue';
import { adoptionNotificationService } from '../services/adoption-notification.service';

// Props
interface Props {
  userId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  userId: 'current-user-id'
});

// Emits
defineEmits<{
  click: []
}>();

// State
const unreadCount = ref(0);

// Methods
const loadUnreadCount = async () => {
  try {
    const count = await adoptionNotificationService.getUnreadCount();
    unreadCount.value = count;
  } catch (error) {
    console.log('Could not load unread count (service unavailable)');
    unreadCount.value = 0;
  }
};

const handleRealTimeNotification = () => {
  // Refresh unread count when new notification arrives
  loadUnreadCount();
};

// Lifecycle
onMounted(async () => {
  // Temporarily disable notification loading to avoid iframe network issues
  console.log('NotificationBadge mounted - notifications disabled for iframe compatibility');
  
  // TODO: Re-enable when iframe network issues are resolved
  // setTimeout(async () => {
  //   await loadUnreadCount();
  //   
  //   // Start real-time notifications
  //   adoptionNotificationService.startRealTimeNotifications(props.userId);
  //   
  //   // Register callback for real-time notifications
  //   adoptionNotificationService.onNotification(handleRealTimeNotification);
  // }, 1000);
});

onUnmounted(() => {
  adoptionNotificationService.stopRealTimeNotifications();
});
</script>

<style scoped lang="scss">
.notification-badge-wrapper {
  display: inline-block;
  
  .notification-badge {
    .notification-button {
      padding: 8px;
      border-radius: 50%;
      transition: all 0.3s ease;
      
      &:hover {
        background-color: rgba(64, 158, 255, 0.1);
        transform: scale(1.1);
      }
      
      .el-icon {
        color: #409eff;
      }
    }
  }
  
  :deep(.el-badge__content) {
    background-color: #f56c6c;
    border: 2px solid white;
    font-size: 12px;
    font-weight: 600;
    min-width: 18px;
    height: 18px;
    line-height: 14px;
  }
}
</style>
