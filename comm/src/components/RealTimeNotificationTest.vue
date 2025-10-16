<template>
  <div class="realtime-notification-test">
    <el-card class="test-card" shadow="hover">
      <template #header>
        <div class="header">
          <h3>🔔 Real-time Notification Test</h3>
          <div class="status-indicator" :class="{ connected: isConnected, disconnected: !isConnected }">
            {{ isConnected ? 'Connected' : 'Disconnected' }}
          </div>
        </div>
      </template>

      <div class="test-content">
        <div class="connection-info">
          <p><strong>Status:</strong> {{ connectionStatus }}</p>
          <p><strong>Active Connections:</strong> {{ activeConnections }}</p>
        </div>

        <div class="test-actions">
          <el-button 
            type="primary" 
            @click="startConnection"
            :disabled="isConnected"
            :loading="connecting"
          >
            Start Real-time Connection
          </el-button>
          
          <el-button 
            type="danger" 
            @click="stopConnection"
            :disabled="!isConnected"
          >
            Stop Connection
          </el-button>
          
          <el-button 
            type="success" 
            @click="testNotification"
            :disabled="!isConnected"
            :loading="testing"
          >
            Test Notification
          </el-button>
          
          <el-button 
            type="warning" 
            @click="testBroadcast"
            :disabled="!isConnected"
            :loading="testing"
          >
            Test Broadcast
          </el-button>
        </div>

        <div class="notification-form" v-if="isConnected">
          <h4>Custom Test Notification</h4>
          <el-form :model="testForm" label-width="100px">
            <el-form-item label="Title">
              <el-input v-model="testForm.title" placeholder="Notification title" />
            </el-form-item>
            <el-form-item label="Message">
              <el-input 
                v-model="testForm.message" 
                type="textarea" 
                :rows="3"
                placeholder="Notification message" 
              />
            </el-form-item>
            <el-form-item>
              <el-checkbox v-model="testForm.broadcast">Broadcast to all users</el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="sendCustomNotification" :loading="testing">
                Send Custom Notification
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="notifications-log" v-if="notifications.length > 0">
          <h4>Received Notifications</h4>
          <div class="notifications-list">
            <div 
              v-for="(notification, index) in notifications" 
              :key="index"
              class="notification-item"
            >
              <div class="notification-header">
                <strong>{{ notification.title }}</strong>
                <span class="timestamp">{{ formatTime(notification.timestamp) }}</span>
              </div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-meta">
                <el-tag size="small" :type="getPriorityType(notification.data?.priority)">
                  {{ notification.data?.priority || 'medium' }}
                </el-tag>
                <el-tag size="small" type="info">{{ notification.type }}</el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { adoptionNotificationService } from '../services/adoption-notification.service';

// State
const isConnected = ref(false);
const connecting = ref(false);
const testing = ref(false);
const connectionStatus = ref('Not connected');
const activeConnections = ref(0);
const notifications = ref<any[]>([]);

// Test form
const testForm = ref({
  title: 'Custom Test Notification',
  message: 'This is a custom test notification sent via the real-time system',
  broadcast: false
});

// Methods
const startConnection = async () => {
  try {
    connecting.value = true;
    
    // Start real-time notifications
    adoptionNotificationService.startRealTimeNotifications('test-user');
    
    // Register callback for notifications
    const callbackId = adoptionNotificationService.onNotification((notification) => {
      notifications.value.unshift({
        ...notification,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 10 notifications
      if (notifications.value.length > 10) {
        notifications.value = notifications.value.slice(0, 10);
      }
    });
    
    isConnected.value = true;
    connectionStatus.value = 'Connected to real-time notifications';
    
    ElMessage.success('Real-time connection started');
  } catch (error) {
    console.error('Error starting connection:', error);
    ElMessage.error('Failed to start real-time connection');
  } finally {
    connecting.value = false;
  }
};

const stopConnection = () => {
  adoptionNotificationService.stopRealTimeNotifications();
  isConnected.value = false;
  connectionStatus.value = 'Disconnected';
  ElMessage.info('Real-time connection stopped');
};

const testNotification = async () => {
  try {
    testing.value = true;
    const success = await adoptionNotificationService.testRealTimeNotification();
    
    if (success) {
      ElMessage.success('Test notification sent');
    } else {
      ElMessage.error('Failed to send test notification');
    }
  } catch (error) {
    console.error('Error testing notification:', error);
    ElMessage.error('Error testing notification');
  } finally {
    testing.value = false;
  }
};

const testBroadcast = async () => {
  try {
    testing.value = true;
    const success = await adoptionNotificationService.testRealTimeNotification(
      'Broadcast Test',
      'This is a broadcast test notification sent to all connected users',
      true
    );
    
    if (success) {
      ElMessage.success('Broadcast test notification sent');
    } else {
      ElMessage.error('Failed to send broadcast test notification');
    }
  } catch (error) {
    console.error('Error testing broadcast:', error);
    ElMessage.error('Error testing broadcast');
  } finally {
    testing.value = false;
  }
};

const sendCustomNotification = async () => {
  try {
    testing.value = true;
    const success = await adoptionNotificationService.testRealTimeNotification(
      testForm.value.title,
      testForm.value.message,
      testForm.value.broadcast
    );
    
    if (success) {
      ElMessage.success('Custom notification sent');
    } else {
      ElMessage.error('Failed to send custom notification');
    }
  } catch (error) {
    console.error('Error sending custom notification:', error);
    ElMessage.error('Error sending custom notification');
  } finally {
    testing.value = false;
  }
};

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString();
};

const getPriorityType = (priority: string): string => {
  const types: Record<string, string> = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'info',
    'urgent': 'danger'
  };
  return types[priority] || 'info';
};

// Lifecycle
onMounted(() => {
  // Auto-start connection for testing
  // startConnection();
});

onUnmounted(() => {
  if (isConnected.value) {
    stopConnection();
  }
});
</script>

<style scoped lang="scss">
.realtime-notification-test {
  padding: 20px;
  
  .test-card {
    max-width: 800px;
    margin: 0 auto;
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h3 {
        margin: 0;
        color: #2c3e50;
      }
      
      .status-indicator {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
        
        &.connected {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        &.disconnected {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
      }
    }
    
    .test-content {
      .connection-info {
        background-color: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        
        p {
          margin: 5px 0;
          color: #495057;
        }
      }
      
      .test-actions {
        display: flex;
        gap: 10px;
        margin-bottom: 30px;
        flex-wrap: wrap;
      }
      
      .notification-form {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 30px;
        
        h4 {
          margin: 0 0 15px 0;
          color: #2c3e50;
        }
      }
      
      .notifications-log {
        h4 {
          margin: 0 0 15px 0;
          color: #2c3e50;
        }
        
        .notifications-list {
          max-height: 400px;
          overflow-y: auto;
          
          .notification-item {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            transition: all 0.3s ease;
            
            &:hover {
              border-color: #4a90e2;
              box-shadow: 0 2px 8px rgba(74, 144, 226, 0.1);
            }
            
            .notification-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
              
              .timestamp {
                font-size: 12px;
                color: #6c757d;
              }
            }
            
            .notification-message {
              color: #495057;
              margin-bottom: 10px;
              line-height: 1.4;
            }
            
            .notification-meta {
              display: flex;
              gap: 8px;
            }
          }
        }
      }
    }
  }
}
</style>
