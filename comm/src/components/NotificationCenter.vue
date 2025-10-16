<template>
  <div class="notification-center">
    <!-- Header -->
    <div class="notification-header">
      <div class="header-left">
        <h3>🔔 Notifications</h3>
        <div class="notification-stats">
          <span class="unread-count" v-if="unreadCount > 0">{{ unreadCount }} unread</span>
          <span class="total-count">{{ notifications.length }} total</span>
        </div>
      </div>
      
      <div class="header-actions">
        <el-button @click="markAllAsRead" size="small" :disabled="unreadCount === 0">
          Mark All Read
        </el-button>
        <el-button @click="showPreferences = true" size="small">
          Preferences
        </el-button>
        <el-button @click="refreshNotifications" size="small">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <div class="notification-filters">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="filters.type" placeholder="Type" clearable @change="applyFilters">
            <el-option
              v-for="type in notificationTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            >
              <span class="type-option">
                <span class="type-icon">{{ type.icon }}</span>
                <span class="type-label">{{ type.label }}</span>
              </span>
            </el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filters.priority" placeholder="Priority" clearable @change="applyFilters">
            <el-option label="Low" value="low" />
            <el-option label="Normal" value="normal" />
            <el-option label="High" value="high" />
            <el-option label="Urgent" value="urgent" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filters.isRead" placeholder="Status" clearable @change="applyFilters">
            <el-option label="Unread" :value="false" />
            <el-option label="Read" :value="true" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-input
            v-model="searchQuery"
            placeholder="Search notifications..."
            clearable
            @input="applyFilters"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
      </el-row>
    </div>

    <!-- Notifications List -->
    <div class="notifications-list">
      <div
        v-for="notification in filteredNotifications"
        :key="notification.id"
        class="notification-item"
        :class="{
          'unread': !notification.isRead,
          'high-priority': notification.priority === 'high',
          'urgent': notification.priority === 'urgent'
        }"
        @click="handleNotificationClick(notification)"
      >
        <!-- Notification Icon -->
        <div class="notification-icon">
          <el-avatar :size="40" :class="getPriorityClass(notification.priority)">
            {{ getNotificationIcon(notification.type) }}
          </el-avatar>
        </div>

        <!-- Notification Content -->
        <div class="notification-content">
          <div class="notification-header">
            <h4 class="notification-title">{{ notification.title }}</h4>
            <div class="notification-meta">
              <el-tag :type="getPriorityType(notification.priority)" size="small">
                {{ getPriorityLabel(notification.priority) }}
              </el-tag>
              <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
            </div>
          </div>
          
          <p class="notification-message">{{ notification.message }}</p>
          
          <div class="notification-details">
            <span class="pet-name">🐾 {{ notification.petName }}</span>
            <span class="adoption-id">📋 #{{ notification.adoptionId.slice(-8) }}</span>
          </div>

          <!-- Metadata Display -->
          <div class="notification-metadata" v-if="notification.metadata">
            <div v-if="notification.metadata.status" class="metadata-item">
              <el-tag size="small" type="info">
                Status: {{ getStatusLabel(notification.metadata.status) }}
              </el-tag>
            </div>
            <div v-if="notification.metadata.dueDate" class="metadata-item">
              <el-tag size="small" type="warning">
                📅 Due: {{ formatDate(notification.metadata.dueDate) }}
              </el-tag>
            </div>
            <div v-if="notification.metadata.meetingTime" class="metadata-item">
              <el-tag size="small" type="success">
                📅 Meeting: {{ formatDateTime(notification.metadata.meetingTime) }}
              </el-tag>
            </div>
            <div v-if="notification.metadata.location" class="metadata-item">
              <el-tag size="small" type="info">
                📍 {{ notification.metadata.location }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- Notification Actions -->
        <div class="notification-actions">
          <el-button
            v-if="!notification.isRead"
            type="text"
            size="small"
            @click.stop="markAsRead(notification)"
          >
            Mark Read
          </el-button>
          <el-button
            type="text"
            size="small"
            @click.stop="archiveNotification(notification)"
          >
            Archive
          </el-button>
          <el-button
            type="text"
            size="small"
            @click.stop="deleteNotification(notification)"
          >
            Delete
          </el-button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredNotifications.length === 0" class="empty-state">
      <el-empty description="No notifications found">
        <el-button type="primary" @click="refreshNotifications">
          Refresh
        </el-button>
      </el-empty>
    </div>

    <!-- Notification Preferences Dialog -->
    <el-dialog v-model="showPreferences" title="Notification Preferences" width="600px">
      <div v-if="preferences" class="preferences-form">
        <el-form :model="preferences" label-width="150px">
          <el-form-item label="Email Notifications">
            <el-switch v-model="preferences.emailNotifications" />
          </el-form-item>
          
          <el-form-item label="SMS Notifications">
            <el-switch v-model="preferences.smsNotifications" />
          </el-form-item>
          
          <el-form-item label="Push Notifications">
            <el-switch v-model="preferences.pushNotifications" />
          </el-form-item>
          
          <el-form-item label="In-App Notifications">
            <el-switch v-model="preferences.inAppNotifications" />
          </el-form-item>
          
          <el-divider content-position="left">Specific Notifications</el-divider>
          
          <el-form-item label="Adoption Updates">
            <el-switch v-model="preferences.adoptionUpdates" />
          </el-form-item>
          
          <el-form-item label="Medical Updates">
            <el-switch v-model="preferences.medicalUpdates" />
          </el-form-item>
          
          <el-form-item label="Meeting Reminders">
            <el-switch v-model="preferences.meetingReminders" />
          </el-form-item>
          
          <el-form-item label="Document Requests">
            <el-switch v-model="preferences.documentRequests" />
          </el-form-item>
          
          <el-divider content-position="left">Quiet Hours</el-divider>
          
          <el-form-item label="Enable Quiet Hours">
            <el-switch v-model="preferences.quietHours.enabled" />
          </el-form-item>
          
          <el-form-item label="Quiet Hours" v-if="preferences.quietHours.enabled">
            <el-time-picker
              v-model="preferences.quietHours.start"
              format="HH:mm"
              placeholder="Start Time"
              style="width: 120px; margin-right: 10px;"
            />
            <span style="margin: 0 10px;">to</span>
            <el-time-picker
              v-model="preferences.quietHours.end"
              format="HH:mm"
              placeholder="End Time"
              style="width: 120px;"
            />
          </el-form-item>
        </el-form>
        
        <div class="preferences-actions">
          <el-button @click="showPreferences = false">Cancel</el-button>
          <el-button type="primary" @click="savePreferences" :loading="savingPreferences">
            Save Preferences
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- Browser Notification Permission -->
    <div v-if="!browserNotificationPermission" class="browser-notification-banner">
      <el-alert
        title="Enable Browser Notifications"
        description="Get notified about important adoption updates even when the app is not active."
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <el-button type="primary" size="small" @click="requestBrowserPermission">
            Enable Notifications
          </el-button>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Search } from '@element-plus/icons-vue';
import { 
  adoptionNotificationService, 
  type AdoptionNotification, 
  type NotificationType, 
  type NotificationPriority,
  type AdoptionStatus,
  type NotificationPreferences
} from '../services/adoption-notification.service';

// State
const notifications = ref<AdoptionNotification[]>([]);
const preferences = ref<NotificationPreferences | null>(null);
const unreadCount = ref(0);
const showPreferences = ref(false);
const savingPreferences = ref(false);
const browserNotificationPermission = ref(false);

// Filters
const searchQuery = ref('');
const filters = ref({
  type: undefined as NotificationType | undefined,
  priority: undefined as NotificationPriority | undefined,
  isRead: undefined as boolean | undefined
});

// Computed
const notificationTypes = computed(() => adoptionNotificationService.getNotificationTypeInfo());

const filteredNotifications = computed(() => {
  let filtered = notifications.value;
  
  if (searchQuery.value) {
    filtered = filtered.filter(notification => 
      notification.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      notification.petName.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  
  if (filters.value.type) {
    filtered = filtered.filter(notification => notification.type === filters.value.type);
  }
  
  if (filters.value.priority) {
    filtered = filtered.filter(notification => notification.priority === filters.value.priority);
  }
  
  if (filters.value.isRead !== undefined) {
    filtered = filtered.filter(notification => notification.isRead === filters.value.isRead);
  }
  
  // Sort by priority and creation time
  return filtered.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
    const aPriority = priorityOrder[a.priority] || 1;
    const bPriority = priorityOrder[b.priority] || 1;
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
});

// Methods
const loadNotifications = async () => {
  try {
    const result = await adoptionNotificationService.getNotifications();
    notifications.value = result;
  } catch (error) {
    console.error('Error loading notifications:', error);
    ElMessage.error('Failed to load notifications');
  }
};

const loadUnreadCount = async () => {
  try {
    const count = await adoptionNotificationService.getUnreadCount();
    unreadCount.value = count;
  } catch (error) {
    console.error('Error loading unread count:', error);
  }
};

const loadPreferences = async () => {
  try {
    const result = await adoptionNotificationService.getNotificationPreferences();
    preferences.value = result;
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
};

const refreshNotifications = () => {
  loadNotifications();
  loadUnreadCount();
};

const applyFilters = () => {
  // Filters are applied automatically via computed property
};

const handleNotificationClick = (notification: AdoptionNotification) => {
  if (!notification.isRead) {
    markAsRead(notification);
  }
  
  // Navigate to relevant page based on notification type
  navigateToNotificationTarget(notification);
};

const markAsRead = async (notification: AdoptionNotification) => {
  try {
    const success = await adoptionNotificationService.markAsRead(notification.id);
    if (success) {
      notification.isRead = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  } catch (error) {
    ElMessage.error('Failed to mark notification as read');
  }
};

const markAllAsRead = async () => {
  try {
    const unreadNotifications = notifications.value.filter(n => !n.isRead);
    const notificationIds = unreadNotifications.map(n => n.id);
    
    const success = await adoptionNotificationService.markMultipleAsRead(notificationIds);
    if (success) {
      unreadNotifications.forEach(n => n.isRead = true);
      unreadCount.value = 0;
      ElMessage.success('All notifications marked as read');
    }
  } catch (error) {
    ElMessage.error('Failed to mark all notifications as read');
  }
};

const archiveNotification = async (notification: AdoptionNotification) => {
  try {
    const success = await adoptionNotificationService.archiveNotification(notification.id);
    if (success) {
      notification.isArchived = true;
      ElMessage.success('Notification archived');
    }
  } catch (error) {
    ElMessage.error('Failed to archive notification');
  }
};

const deleteNotification = async (notification: AdoptionNotification) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this notification?',
      'Delete Notification',
      { type: 'warning' }
    );
    
    const success = await adoptionNotificationService.deleteNotification(notification.id);
    if (success) {
      const index = notifications.value.findIndex(n => n.id === notification.id);
      if (index > -1) {
        notifications.value.splice(index, 1);
        if (!notification.isRead) {
          unreadCount.value = Math.max(0, unreadCount.value - 1);
        }
        ElMessage.success('Notification deleted');
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Failed to delete notification');
    }
  }
};

const savePreferences = async () => {
  if (!preferences.value) return;
  
  try {
    savingPreferences.value = true;
    const success = await adoptionNotificationService.updateNotificationPreferences(preferences.value);
    if (success) {
      ElMessage.success('Preferences saved successfully');
      showPreferences.value = false;
    }
  } catch (error) {
    ElMessage.error('Failed to save preferences');
  } finally {
    savingPreferences.value = false;
  }
};

const requestBrowserPermission = async () => {
  try {
    const granted = await adoptionNotificationService.requestNotificationPermission();
    if (granted) {
      browserNotificationPermission.value = true;
      ElMessage.success('Browser notifications enabled');
    } else {
      ElMessage.warning('Browser notifications permission denied');
    }
  } catch (error) {
    ElMessage.error('Failed to request notification permission');
  }
};

const navigateToNotificationTarget = (notification: AdoptionNotification) => {
  // Navigate based on notification type
  switch (notification.type) {
    case 'adoption_submitted':
    case 'adoption_approved':
    case 'adoption_rejected':
    case 'adoption_in_progress':
    case 'adoption_completed':
      // Navigate to adoption details
      ElMessage.info(`Navigate to adoption: ${notification.adoptionId}`);
      break;
    case 'document_requested':
      // Navigate to document upload
      ElMessage.info(`Navigate to document upload for: ${notification.petName}`);
      break;
    case 'meeting_scheduled':
      // Navigate to meeting details
      ElMessage.info(`Navigate to meeting details for: ${notification.petName}`);
      break;
    default:
      // Navigate to pet profile
      ElMessage.info(`Navigate to pet profile: ${notification.petName}`);
  }
};

// Utility methods
const getNotificationIcon = (type: NotificationType): string => {
  const typeInfo = notificationTypes.value.find(t => t.value === type);
  return typeInfo ? typeInfo.icon : '🔔';
};

const getPriorityClass = (priority: NotificationPriority): string => {
  const classes = {
    low: 'priority-low',
    normal: 'priority-normal',
    high: 'priority-high',
    urgent: 'priority-urgent'
  };
  return classes[priority] || 'priority-normal';
};

const getPriorityType = (priority: NotificationPriority): string => {
  const types = {
    low: 'info',
    normal: 'success',
    high: 'warning',
    urgent: 'danger'
  };
  return types[priority] || 'success';
};

const getPriorityLabel = (priority: NotificationPriority): string => {
  const labels = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent'
  };
  return labels[priority] || 'Normal';
};

const getStatusLabel = (status: AdoptionStatus): string => {
  const statusInfo = adoptionNotificationService.getAdoptionStatusInfo();
  const statusData = statusInfo.find(s => s.value === status);
  return statusData ? statusData.label : status;
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-GB');
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-GB');
};

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

// Real-time notification handling
const handleRealTimeNotification = (notification: AdoptionNotification) => {
  // Add new notification to the top of the list
  notifications.value.unshift(notification);
  
  // Update unread count
  if (!notification.isRead) {
    unreadCount.value++;
  }
  
  // Show toast message
  ElMessage({
    message: notification.message,
    type: notification.priority === 'urgent' ? 'error' : 'success',
    duration: 5000
  });
};

// Lifecycle
onMounted(async () => {
  await loadNotifications();
  await loadUnreadCount();
  await loadPreferences();
  
  // Check browser notification permission
  browserNotificationPermission.value = Notification.permission === 'granted';
  
  // Start real-time notifications
  const userId = 'current-user-id'; // Get from auth service
  adoptionNotificationService.startRealTimeNotifications(userId);
  
  // Register callback for real-time notifications
  adoptionNotificationService.onNotification(handleRealTimeNotification);
});

onUnmounted(() => {
  adoptionNotificationService.stopRealTimeNotifications();
});
</script>

<style scoped lang="scss">
.notification-center {
  padding: 20px;

  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-left {
      h3 {
        margin: 0 0 8px 0;
        color: #2c3e50;
      }

      .notification-stats {
        display: flex;
        gap: 15px;
        font-size: 14px;
        color: #7f8c8d;

        .unread-count {
          color: #e74c3c;
          font-weight: 600;
        }
      }
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .notification-filters {
    margin-bottom: 20px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;

    .type-option {
      display: flex;
      align-items: center;
      gap: 10px;

      .type-icon {
        font-size: 16px;
      }
    }
  }

  .notifications-list {
    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 20px;
      border: 1px solid #e9ecef;
      border-radius: 12px;
      margin-bottom: 15px;
      background: white;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        border-color: #4a90e2;
        box-shadow: 0 4px 12px rgba(74, 144, 226, 0.15);
        transform: translateY(-2px);
      }

      &.unread {
        border-left: 4px solid #4a90e2;
        background: #f8f9ff;
      }

      &.high-priority {
        border-left: 4px solid #ffc107;
        background: #fffbf0;
      }

      &.urgent {
        border-left: 4px solid #dc3545;
        background: #fef0f0;
      }

      .notification-icon {
        margin-right: 15px;

        .priority-low {
          background: #17a2b8;
        }

        .priority-normal {
          background: #28a745;
        }

        .priority-high {
          background: #ffc107;
        }

        .priority-urgent {
          background: #dc3545;
        }
      }

      .notification-content {
        flex: 1;
        margin-right: 15px;

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;

          .notification-title {
            margin: 0;
            color: #2c3e50;
            font-size: 16px;
            font-weight: 600;
          }

          .notification-meta {
            display: flex;
            align-items: center;
            gap: 10px;

            .notification-time {
              color: #7f8c8d;
              font-size: 12px;
            }
          }
        }

        .notification-message {
          margin: 0 0 10px 0;
          color: #2c3e50;
          line-height: 1.5;
        }

        .notification-details {
          display: flex;
          gap: 15px;
          margin-bottom: 10px;
          font-size: 14px;
          color: #7f8c8d;

          .pet-name {
            font-weight: 600;
          }
        }

        .notification-metadata {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;

          .metadata-item {
            margin-bottom: 5px;
          }
        }
      }

      .notification-actions {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }

  .browser-notification-banner {
    margin-top: 20px;
  }
}

.preferences-form {
  .preferences-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e9ecef;
  }
}

@media (max-width: 768px) {
  .notification-center {
    padding: 15px;

    .notification-header {
      flex-direction: column;
      gap: 15px;
      align-items: flex-start;
    }

    .notification-filters {
      .el-row {
        .el-col {
          margin-bottom: 15px;
        }
      }
    }

    .notifications-list {
      .notification-item {
        flex-direction: column;
        gap: 15px;

        .notification-content {
          margin-right: 0;
          margin-bottom: 15px;
        }

        .notification-actions {
          flex-direction: row;
          justify-content: flex-end;
        }
      }
    }
  }
}
</style>
