<script setup lang="ts">
import { Bell, MuteNotification, Plus, Search } from '@element-plus/icons-vue';
import ContextMenu from '@imengyu/vue3-context-menu';
import { computed, onMounted, onUnmounted, reactive, ref, watch, nextTick } from 'vue';
import useStore, { IMessage, ZIM, zim } from '../store/index';
import { formatTime, getTipsMsg, normalizeDisplayName } from '../utils';
import { petService, type PetInfo } from '../services/pet.service';
import ZIMChat from './ZIMChat.vue';
import ZIMSearchMsgDialog from './dialog/ZIMSearchMsgDialog.vue';
import ZIMSearchResultDialog from './dialog/ZIMSearchResultDialog.vue';

const zimStore = useStore();
const locale = computed(() => zimStore.locale);
const convInfo = zimStore.convInfo;
const convList = computed(() => zimStore.convList);

const nolabel = '';
const selectConvVisible = ref(false);
const selectConvList = ref([] as string[]);
const formMark = reactive({ mark: '', enable: true });

// Flag to prevent watcher loops
const isProgrammaticallyUpdating = ref(false);

// Pet context is now stored per conversation in conv.dbData or conv.groupAttributes
// No more global pet context to prevent leakage between conversations

// Function to format conversation time with proper timestamp priority
const formatConversationTime = (item: any) => {
  // Priority: DB lastMessageAt > ZIM lastMessage.timestamp > fallback
  if (item.dbData?.lastMessageAt) {
    return formatTime(new Date(item.dbData.lastMessageAt).getTime());
  }
  
  if (item.lastMessage?.timestamp) {
    return formatTime(item.lastMessage.timestamp);
  }
  
  if (item.lastMessageAt) {
    return formatTime(new Date(item.lastMessageAt).getTime());
  }
  
  // Fallback
  return '—';
};

// Computed property to format conversation names from DB as source of truth
const formatConversationName = computed(() => {
  return (conv: any) => {
    // Check for custom renamed conversation first
    const customName = localStorage.getItem(`conv_name_${conv.conversationID}`);
    if (customName) {
      return customName;
    }
    
    // Try to get conversation data from DB (source of truth)
    if (conv.dbData) {
      const { petName, shelterName } = conv.dbData;
      if (petName && shelterName) {
        // Clean any sequence numbers from the names
        const cleanPetName = petName.replace(/\(\d+\)$/, '');
        const cleanShelterName = shelterName.replace(/\(\d+\)$/, '');
        return `${cleanShelterName} – ${cleanPetName}`;
      }
    }
    
    // Try to get pet name from conversation-specific data (fallback)
    // This uses the pet data stored in the conversation itself, not global state
    
    // Try to get from ZIM group attributes (fallback)
    if (conv.groupAttributes) {
      const petName = conv.groupAttributes.petName;
      const shelterName = conv.groupAttributes.shelterName;
      if (petName && shelterName) {
        // Clean any sequence numbers from the names
        const cleanPetName = petName.replace(/\(\d+\)$/, '');
        const cleanShelterName = shelterName.replace(/\(\d+\)$/, '');
        return `${cleanShelterName} – ${cleanPetName}`;
      }
    }
    
    // Try to extract from conversation ID (last resort)
    if (conv.conversationID) {
      // Check for shelter conversations
      if (conv.conversationID.includes('shelter') || conv.conversationID.includes('adoption')) {
        return 'Adopt • Pet';
      }
      
      // For peer conversations, show a friendly name
      if (conv.type === 0) {
        return 'Adopt • Pet';
      }
      
      // For other conversations, show a shortened version
      if (conv.conversationID.length > 10) {
        return `Adopt • ${conv.conversationID.slice(-6)}`;
      }
    }
    
    // Final fallback
    return 'Adopt • Pet';
  };
});

onMounted(async () => {
  zimStore.isLogged && zimStore.queryConversationList();
  
  // Listen for userMap updates to re-render names
  window.addEventListener('userMapUpdated', handleUserMapUpdate);
});

onUnmounted(() => {
  // Clean up event listener
  window.removeEventListener('userMapUpdated', handleUserMapUpdate);
});

const handleUserMapUpdate = (event: Event) => {
  console.log('📡 UserMap updated in conversation list, re-rendering names');
  // Force reactivity update by triggering a re-render
  // The getCleanUsername function will automatically use the updated userMap
};

// Watch for conversation info changes and update state (NO DOM CLICKING)
watch(
  () => zimStore.convInfo.conversationID,
  async (newConversationId, oldConversationId) => {
    // Skip if we're programmatically updating or if there's no change
    if (isProgrammaticallyUpdating.value || !newConversationId || newConversationId === oldConversationId) {
      return;
    }
    
    console.log('🔄 Conversation ID changed, updating state:', newConversationId);
    
    // Pet context is now stored per conversation in conv.dbData or conv.groupAttributes
    
    // Just update the state - ZIMChat will watch convInfo and load messages
    // NO DOM clicking to prevent loops!
    console.log('✅ Conversation state updated, ZIMChat will handle message loading');
  },
  { immediate: false }
);

// Pet context is now stored per conversation in conv.dbData or conv.groupAttributes
// No more global pet context to prevent leakage between conversations

const formatMsg = (conv: any, msg?: IMessage) => {
  if (conv.draft) return `[${locale.value.cpt.conv.draft}]: ${conv.draft}`;
  if (!msg) return '';

  const tags =
    conv.type && msg.type != ZIM.MessageType.Revoke && msg.type != ZIM.MessageType.Tips
      ? [`[${getCleanUsername(msg.senderUserID || '')}]`]
      : [];
  if (msg.type != ZIM.MessageType.Text) {
    tags.push(`[${locale.value.cpt.chat.msgmap[msg.type]}]`);
  }
  if (msg.receiptStatus) {
    tags.push(`[${locale.value.cpt.chat.receipt}]`);
  }
  if (msg.repliedInfo) {
    tags.push(`[${locale.value.cpt.chat.reply}]`);
  }

  let str = msg.message || msg.title || msg.fileName || msg.fileDownloadUrl;
  if (msg.type == ZIM.MessageType.Revoke) str = locale.value.cpt.chat.revokeMsg;
  else if (msg.type == ZIM.MessageType.Tips) str = getTipsMsg(msg);
  else if (msg.type == ZIM.MessageType.Multiple)
    str = msg.messageInfoList.map((v) => locale.value.cpt.chat.msgmap[v.type]).join(',');

  // Replace pet IDs with pet names in adoption inquiry messages using conversation-specific data
  if (conv.dbData?.petName && str) {
    const petName = conv.dbData.petName;
    // Pattern to match "Pet ID: [ID]" and replace with "Pet ID: [ID] ([Pet Name])"
    const petIdPattern = /(Pet ID: \w+)(?!\s*\([^)]*\))/g;
    str = str.replace(petIdPattern, `$1 (${petName})`);
    
    // Also handle cases where the message starts with "Hello! I'm interested in adopting a pet"
    // and replace it with "Hello! I'm interested in adopting [Pet Name]"
    if (str.includes("Hello! I'm interested in adopting a pet")) {
      str = str.replace("Hello! I'm interested in adopting a pet", `Hello! I'm interested in adopting ${petName}`);
    }
    
    // Handle variations of the adoption message
    const adoptionPatterns = [
      /Hello! I'm interested in adopting a pet\. Pet ID: ([a-f0-9]{24})/g,
      /Hello! I'm interested in adopting a pet\. Pet ID: ([a-f0-9]{24})/g
    ];
    
    adoptionPatterns.forEach(pattern => {
      str = str.replace(pattern, (match, petId) => {
        return `Hello! I'm interested in adopting ${petName}. Pet ID: ${petId}`;
      });
    });
  }

  return tags.length ? `${tags.join('')}: ${str}` : str;
};

const menuItems = [
  { title: locale.value.cpt.conv.deleteAllMsg, fn: 'deleteAllMessages' },
  {
    title: locale.value.cpt.conv.deleteAllLocalConv,
    fn: 'deleteAllConversations',
    params: { isAlsoDeleteServerConversation: false },
  },
  { title: locale.value.cpt.conv.deleteAllConv, fn: 'deleteAllConversations' },
  { title: locale.value.cpt.conv.clearAllUnread, fn: 'clearConversationTotalUnreadMessageCount' },
  { title: '🧹 Clear ZIM Database', fn: 'clearZIMLocalDatabase' },
  { title: '💥 Force Clear All Data', fn: 'forceClearAllData' },
];

const handleMenuAction = (fn: string, params?: any) => {
  // @ts-ignore
  zimStore[fn](params);
};

// Clean username function with standardized fallback hierarchy
const getCleanUsername = (id: string) => {
  const user = zimStore.userMap[id];
  
  // Standardized fallback hierarchy: profile.displayName → profile.fullName → username → email
  if (user) {
    // Check for displayName first (highest priority)
    if (user.displayName) {
      return normalizeDisplayName(user.displayName);
    }
    
    // Check for fullName (firstName + lastName)
    if (user.firstName && user.lastName) {
      return normalizeDisplayName(`${user.firstName} ${user.lastName}`.trim());
    }
    
    // Check for firstName only
    if (user.firstName) {
      return normalizeDisplayName(user.firstName);
    }
    
    // Check for username
    if (user.userName) {
      return normalizeDisplayName(user.userName);
    }
    
    // Check for email (last resort from user data)
    if (user.email) {
      return normalizeDisplayName(user.email);
    }
  }
  
  // Clean fallback: remove sequence numbers and debug info from user ID
  return normalizeDisplayName(id);
};

// Function to get group avatar with proper URL handling
const getGroupAvatar = (avatarUrl: any) => {
  if (!avatarUrl) return '';
  
  // Convert to string if it's a number or other type
  const urlString = String(avatarUrl);
  
  // If it's already a full URL, return it
  if (urlString.startsWith('http')) {
    return urlString;
  }
  
  // For numeric IDs from ZIM, we need to use ZIM's built-in methods
  // For now, return empty string to show default avatar
  if (!isNaN(Number(urlString))) {
    return ''; // This will show the default 'G' avatar
  }
  
  // If it's a relative path, add the avatar prefix
  return '/avatars/' + urlString;
};

const getConvClass = (conv: any) => {
  if (conv.type + conv.conversationID === convInfo.type + convInfo.conversationID) {
    return 'item active';
  } else if (conv.isPinned) {
    return 'item pinned';
  }

  return 'item';
};

const onContextMenu = (e: any, conv: any) => {
  ContextMenu.showContextMenu({
    x: e.x,
    y: e.y,
    items: [
      {
        label: locale.value.cpt.conv.delete,
        onClick: () => zimStore.deleteConversation(conv),
      },
      {
        label: conv.isPinned ? locale.value.cpt.conv.unpin : locale.value.cpt.conv.pin,
        onClick: () => zim.updateConversationPinnedState(!conv.isPinned, conv.conversationID, conv.type),
      },
    ],
  });
};

const setConversationNotificationStatus = (conv: any) => {
  const status = conv.notificationStatus == 2 ? 1 : 2;
  zim.setConversationNotificationStatus(status, conv.conversationID, conv.type);
};

const setMark = () => {
  if (+formMark.mark && selectConvList.value.length) {
    const convs = selectConvList.value.map((v) => ({ conversationID: v.substring(1), conversationType: +v[0] }));
    zim.setConversationMark(+formMark.mark, formMark.enable, convs);
  }
  formMark.mark = '';
  formMark.enable = true;
  selectConvList.value.length = 0;
  selectConvVisible.value = false;
};

const setConv = (conv: any) => {
  // Set flag to prevent watcher loop
  isProgrammaticallyUpdating.value = true;
  
  zimStore.updateConvInfo(conv);
  if (conv.type == 0) {
    zimStore.setUserMap([conv.conversationID]);
    zimStore.queryHistoryMessage();
  } else if (conv.type == 2) {
    zimStore.gotoGroupChat();
  }
  
  // Reset flag after a short delay to allow the update to complete
  setTimeout(() => {
    isProgrammaticallyUpdating.value = false;
  }, 200);
};

const searchResult = ref({
  show: false,
  type: '' as 'conversation' | 'message',
  regkey: null as any,
  conversation: [] as any[],
  message: [] as any[],
});
const msgDialogState = ref(false);
const showNotificationCenter = ref(false);
const onMsgDialogClose = (ev?: any, isConv?: boolean) => {
  msgDialogState.value = false;
  if (!ev) return;

  const config: any = {
    keywords: ev.keywords ? ev.keywords.split(' ').filter((v: any) => !!v) : null,
    senderUserIDs: ev.senderUserIDs ? ev.senderUserIDs.split(',') : null,
    subMessageTypes: ev.subMessageTypes ? ev.subMessageTypes.split(',').map((v: any) => +v) : null,
    messageTypes: Array.from(ev.messageTypes),
    startTime: ev.startTime,
    endTime: ev.endTime,
  };
  if (isConv) {
    config.totalConversationCount = 10;
    config.conversationMessageCount = 3;
    zim.searchLocalConversations(config).then((res: any) => {
      console.log('===search', res);
      searchResult.value.regkey = config.keywords ? new RegExp(config.keywords.join('|'), 'g') : null;
      searchResult.value.conversation = res.conversationSearchInfoList;
      searchResult.value.type = 'conversation';
      searchResult.value.show = true;
    });
  } else {
    config.count = 100;
    config.order = 0;
    zim.searchGlobalLocalMessages(config).then((res: any) => {
      console.log('===search', res);
      searchResult.value.regkey = config.keywords ? new RegExp(config.keywords.join('|'), 'g') : null;
      searchResult.value.message = res.messageList;
      searchResult.value.type = 'message';
      searchResult.value.show = true;
    });
  }
};
</script>

<template>
  <div class="content">
    <div class="sidebar">
      <!-- toolbar -->
      <div class="toolbar">
        <span class="title">{{ locale.cpt.conv.convs }}({{ convList.length }})</span>
        <el-tooltip :content="locale.cpt.conv.search">
          <el-icon color="#409eff" @click="msgDialogState = true">
            <Search />
          </el-icon>
        </el-tooltip>
        <el-tooltip content="Notifications">
          <NotificationBadge 
            :user-id="zimStore.self?.userID" 
            @click="showNotificationCenter = true"
            style="margin-left: 8px;"
          />
        </el-tooltip>
        <el-dropdown trigger="click" placement="bottom-end">
          <el-icon><Plus /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="selectConvVisible = true">
                {{ locale.cpt.conv.setMark }}
              </el-dropdown-item>
              <el-dropdown-item v-for="(item, i) in menuItems" :key="i" @click="handleMenuAction(item.fn, item.params)">
                {{ item.title }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <!-- conv list -->
      <el-scrollbar class="list">
        <div
          :class="getConvClass(item)"
          v-for="item in convList"
          :key="item.type + item.conversationID"
          :data-id="`${item.type}-${item.conversationID}`"
          @click="setConv(item)"
          @contextmenu.prevent="onContextMenu($event, item)"
        >
          <el-badge
            :value="item.unreadMessageCount"
            :is-dot="item.notificationStatus == 2"
            :hidden="!item.unreadMessageCount"
            :max="9999"
          >
            <el-avatar :size="46" shape="square" :src="getGroupAvatar(item.conversationAvatarUrl)" />
            <sup
              class="el-badge__content el-badge__content--primary is-fixed badgeat"
              v-if="item.mentionedInfoList?.length"
            >
              {{ item.mentionedInfoList?.length || 0 }}
            </sup>
            <sup v-if="item.type" class="el-badge__content el-badge__content--info is-fixed badgetype">G</sup>
          </el-badge>
          <div class="fr">
            <div class="flex">
              <span :class="item.isDisabled ? 'title ellipsis flex1 red' : 'title ellipsis flex1'">
                {{ formatConversationName(item) }}
              </span>
              <span class="tips">{{ formatConversationTime(item) }}</span>
            </div>
            <div class="flex content">
              <span class="tips ellipsis flex1">{{ formatMsg(item, item.lastMessage as any) }}</span>
              <el-icon
                v-if="item.type == 2 || item.type == 0"
                :size="16"
                color="gray"
                @click.native.stop="setConversationNotificationStatus(item)"
              >
                <MuteNotification v-if="item.notificationStatus == 2" />
                <Bell v-else />
              </el-icon>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
    <ZIMChat
      v-if="convInfo.conversationID"
      :id="convInfo.conversationID"
      :type="convInfo.type"
                      :name="formatConversationName(convInfo)"
    />
    <div v-else class="nodata">{{ locale.cmn.nodata }}</div>
    <ZIMSearchMsgDialog :visible="msgDialogState" :type="1" @close="onMsgDialogClose" />
    <ZIMSearchResultDialog
      :type="searchResult.type"
      :visible="searchResult.show"
      :regkey="searchResult.regkey"
      :list="searchResult[searchResult.type]"
      @close="searchResult.show = false"
    />
    <!-- Select conv -->
    <el-dialog
      v-model="selectConvVisible"
      :title="locale.cpt.conv.selectConv"
      width="45%"
      top="50px"
      :center="true"
      class="convs-dialog"
    >
      <el-checkbox-group v-model="selectConvList">
        <div
          :class="item.conversationID == convInfo.conversationID && item.type == convInfo.type ? 'item active' : 'item'"
          v-for="item in convList"
          :key="item.conversationID"
        >
          <el-checkbox :label="item.type + item.conversationID">{{ nolabel }}</el-checkbox>
          <el-avatar :size="32" shape="square" :src="item.conversationAvatarUrl" />
          <span class="name">
            {{ item.type == 0 ? locale.dl.searchResult.convPeer : locale.dl.searchResult.convGroup }}
                            {{ formatConversationName(item) }}
          </span>
          <span>{{ item.marks ? item.marks.join() : '' }}</span>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-form :inline="true" :model="formMark">
          <el-input v-model="formMark.mark" placeholder="Mark value" clearable style="width: 100px" />
          <el-checkbox v-model="formMark.enable" style="padding: 0 12px">Enable</el-checkbox>
          <el-button type="primary" @click="setMark">
            {{ locale.cpt.conv.setMark }}
          </el-button>
        </el-form>
      </template>
    </el-dialog>
    
    <!-- Notification Center Dialog -->
    <el-dialog
      v-model="showNotificationCenter"
      title="🔔 Notifications"
      width="80%"
      top="50px"
      :center="false"
      class="notification-center-dialog"
    >
      <NotificationCenter />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
$border: 1px solid var(--el-border-color-light);

.list {
  max-height: 493px;

  .item {
    height: 48px;
    padding: 12px;
    border-bottom: $border;
    display: flex;
    cursor: pointer;

    .fr {
      padding-left: 12px;
    }

    .content svg.icon {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .badgeat {
      left: 16px;
      transform: translateY(-50%) translateX(-100%);
    }
    .badgetype {
      top: 37px;
      right: 21px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
    }
  }
}
</style>
<style>
.el-select-dropdown__item {
  display: flex;
  justify-content: space-between;
}

.notification-center-dialog {
  .el-dialog__body {
    padding: 0;
    max-height: 70vh;
    overflow: hidden;
  }
}
</style>
