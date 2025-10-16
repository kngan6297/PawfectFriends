<script setup lang="ts">
import { ChatRound, SwitchButton, Tools, UploadFilled, User } from '@element-plus/icons-vue';
import { computed, ref, watch } from 'vue';
import useStore, { zim } from '../store/index';
import ZIMBook from './ZIMBook.vue';
import ZIMConversation from './ZIMConversation.vue';
import ZIMCallDialog from './dialog/ZIMCallDialog.vue';
import ZIMConfigDialog from './dialog/ZIMConfigDialog.vue';

const zimStore = useStore();
const locale = computed(() => zimStore.locale);
const totalUnreadMessageCount = computed(() => zimStore.totalUnreadMessageCount);
const self = computed(() => zimStore.self);
const activedTab = ref('conv');
const showCallDialog = ref(false);
const showConfigDialog = ref(false);

const showTab = (tab: string) => {
  activedTab.value = tab;
  if (tab == 'conv') {
    zimStore.queryConversationList();
  }
};

const uploadLog = () => {
  zim.uploadLog();
};

const logout = () => {
  zimStore.logout();
  zimStore.$reset();
  // location.reload();
};

// Function to get user avatar with proper URL handling
const getUserAvatar = (avatarUrl: any) => {
  if (!avatarUrl) return '';
  
  // Convert to string if it's a number or other type
  const urlString = String(avatarUrl);
  
  // If it's already a full URL, return it
  if (urlString.startsWith('http')) {
    return urlString;
  }
  
  // If it's a relative path, add the avatar prefix
  return '/avatars/' + urlString;
};

const handleDialogAction = (type: string, payload: any) => {
  if (type == 'conv') {
    activedTab.value = type;
  } else if (type == 'callInvite' && payload.ids && payload.name) {
    zimStore.callInvite(payload.ids.split(','), +payload.name, +payload.note).then(() => {
      showCallDialog.value = true;
    });
  } else if (type == 'callJoin' && payload) {
    zimStore.callJoin(payload).then((data: any) => {
      showCallDialog.value = true;
      const map = data.callUserList.reduce(
        (s: any, i: any) => ((s[i.userID] = i.state), s),
        {} as Record<string, number>,
      );
      zimStore.setCallInfo({ callID: data.callID, userStateMap: map });
    });
  } else if (type == 'showCall') {
    showCallDialog.value = payload;
    zimStore.queryCallList();
  }
};
const onConfigDialogClose = (ev: any) => {
  showConfigDialog.value = false;
  if (!ev) return;
  zimStore.setAppGlobalConfig(ev);
};

watch(
  computed(() => zimStore.callInfo.state),
  (value) => {
    if (value == 2) showCallDialog.value = false;
  },
);
</script>

<template>
  <div class="container layout">
    <div class="sidebar">
      <el-avatar :src="getUserAvatar(self.userAvatarUrl)"></el-avatar>
      <span class="name ellipsis">{{ self.userID }}</span>
      <span class="name ellipsis">{{ self.userName }}</span>
      <!-- Biz menu -->
      <div class="menu">
        <el-badge :value="totalUnreadMessageCount" :hidden="!totalUnreadMessageCount" :max="9999">
          <el-tooltip placement="right" :content="locale.cpt.layout.conv">
            <el-button type="primary" link :icon="ChatRound" @click="showTab('conv')"></el-button>
          </el-tooltip>
        </el-badge>
        <el-tooltip placement="right" :content="locale.cpt.layout.book">
          <el-button style="margin: 6px 0" type="primary" link :icon="User" @click="showTab('book')"></el-button>
        </el-tooltip>
      </div>
      <!-- Tools -->
      <el-tooltip placement="right" :content="locale.cpt.layout.tool">
        <el-button type="primary" link :icon="Tools" @click="showConfigDialog = true"></el-button>
      </el-tooltip>
      <el-tooltip placement="right" :content="locale.cpt.layout.upload">
        <el-button type="primary" link :icon="UploadFilled" @click="uploadLog"></el-button>
      </el-tooltip>
      <el-tooltip placement="right" :content="locale.cpt.layout.logout">
        <el-button type="danger" link :icon="SwitchButton" @click="logout"></el-button>
      </el-tooltip>
    </div>
    <ZIMConversation v-show="activedTab == 'conv'" />
    <ZIMBook v-show="activedTab == 'book'" @submit="handleDialogAction" />
    <!-- Dialog -->
    <ZIMCallDialog :visible="showCallDialog" @submit="handleDialogAction" />
    <ZIMConfigDialog :visible="showConfigDialog" @close="onConfigDialogClose" />
  </div>
</template>

<style lang="scss">
.layout {
      > .sidebar {
      display: flex;
      flex-direction: column;
      width: 54px;
      background: linear-gradient(180deg, #4A90E2 0%, #357ABD 100%);
      align-items: center;
      padding: 8px;
      border-radius: 8px 0 0 8px;
      box-shadow: 2px 0 8px rgba(74, 144, 226, 0.2);

    .el-icon,
    .el-icon svg {
      width: 2em;
      height: 2em;
    }
    .el-button {
      width: 100%;
      margin-top: 6px;
    }
    .el-button + .el-button {
      margin-left: 0 !important;
    }

    .name {
      color: white;
      max-width: 100%;
      font-size: 12px;
    }

    .menu {
      flex: 1;
      width: 100%;
      padding-top: 10px;
      text-align: center;
    }
  }

  > .content {
    flex: 1;
    display: flex;
    max-width: 826px;

    > .sidebar {
      width: 260px;
      border-right: 1px solid var(--el-border-color-light);
    }

    .toolbar {
      height: 32px;
      line-height: 32px;
      padding: 8px;
      border-bottom: 1px solid var(--el-border-color-light);
      display: flex;
      align-items: center;

      .title {
        flex: 1;
        text-align: center;
      }

      .subtitle {
        flex: 1 1 0%;
        display: flex;
        flex-direction: column;
        line-height: normal;
      }

      .name {
        font-size: 16px;
        font-weight: bold;
        flex: 1;
      }

      .el-icon {
        cursor: pointer;
      }
      .el-dropdown {
        margin-left: 8px;
        cursor: pointer;
        color: var(--el-color-primary);
      }
    }
  }
}
</style>
