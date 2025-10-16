<script setup lang="ts">
import {
  Avatar,
  Check,
  CirclePlus,
  Close,
  Compass,
  Connection,
  Delete,
  DeleteFilled,
  Edit,
  Mic,
  Plus,
  Search,
  Star,
  VideoCamera,
} from '@element-plus/icons-vue';
import { computed, onMounted, reactive, ref } from 'vue';
import useStore, { zim } from '../store/index';
import {
  applicationStates,
  avatarOptions,
  avatarPrefix,
  callModeMap,
  callStateMap,
  callUserStateMap,
  callUserTagType,
  formatTime,
  groupAapplicationTypes,
  maincolor,
  onlineStatusType,
} from '../utils';
import ZIMFormDialog from './dialog/ZIMFormDialog.vue';
import ZIMSearchBookDialog from './dialog/ZIMSearchBookDialog.vue';
import ZIMSearchResultDialog from './dialog/ZIMSearchResultDialog.vue';

const emit = defineEmits(['submit']);

const zimStore = useStore();
const locale = computed(() => zimStore.locale);

const convInfo = zimStore.convInfo;
const groupList = computed(() => zimStore.groupList);
const groupAppList = computed(() => zimStore.groupAppList);
const roomList = computed(() => zimStore.roomList);
const callList = computed(() => zimStore.callList);
const friendList = computed(() => zimStore.friendList);
const friendAppList = computed(() => zimStore.friendAppList);
const blacklist = computed(() => zimStore.blacklist);
const userSubscriptionList = computed(() => zimStore.userSubscriptionList);

const activedTab = ref(1);

const friendAppTypes = ['None', 'Received', 'Sent', 'Both'];

onMounted(() => {
  zimStore.queryGroupList();
});

const menuItems = [
  // ********** hide ********** //
  {
    width: '60px',
    title: locale.value.cpt.book.editFriend,
    disabled: true,
    form: [
      { model: 'id', label: locale.value.cmn.userID, type: 'input', readonly: true },
      { model: 'name', label: locale.value.cpt.book.form.alias, type: 'input' },
      { model: 'note', label: locale.value.cpt.book.form.area, type: 'input' },
    ],
  },
  {
    width: '60px',
    title: locale.value.cpt.book.acceptFriend,
    disabled: true,
    form: [
      { model: 'id', label: locale.value.cmn.userID, type: 'input', readonly: true },
      { model: 'name', label: locale.value.cpt.book.form.alias, type: 'input' },
      { model: 'note', label: locale.value.cpt.book.form.area, type: 'input' },
    ],
  },
  // ********** show ********** //
  {
    width: '90px',
    title: locale.value.cpt.book.editSelf,
    form: [
      { model: 'avatar', label: locale.value.cpt.book.form.avatar, type: 'select', options: avatarOptions },
      { model: 'name', label: locale.value.cpt.book.form.name, type: 'input' },
      { model: 'note', label: locale.value.cpt.book.form.extended, type: 'input' },
      // { model: 'id', label: locale.value.cpt.book.form.customStatus, type: 'input' },
    ],
  },
  {
    width: '130px',
    title: locale.value.cpt.book.createConv,
    form: [
      { model: 'id', label: 'Conversation ID', type: 'input' },
      {
        model: 'note',
        label: 'Conversation type',
        type: 'select',
        options: [
          { label: 'Peer', value: '0' },
          { label: 'Room', value: '1' },
          { label: 'Group', value: '2' },
        ],
      },
    ],
  },
  {
    divided: true,
    width: '90px',
    dialogWidth: '70%',
    title: locale.value.cpt.book.createGroup,
    form: [
      { model: 'avatar', label: locale.value.cpt.book.form.avatar, type: 'select', options: avatarOptions },
      { model: 'id', label: locale.value.cpt.book.form.groupID, type: 'input' },
      { model: 'name', label: locale.value.cpt.book.form.name, type: 'input' },
      { model: 'ids', label: locale.value.cmn.userIDs, type: 'textarea' },
      {
        model: 'form',
        label: locale.value.cpt.book.form.advancedConfig,
        type: 'form',
        form: ['Max count', 'Join mode', 'Invite mode', 'BeInvite mode'],
      },
    ],
  },
  {
    width: '60px',
    title: locale.value.cpt.book.joinGroup,
    form: [
      { model: 'id', label: locale.value.cpt.book.form.groupID, type: 'input' },
      {
        model: 'note',
        label: locale.value.cpt.book.form.wording,
        type: 'input',
        placeholder: locale.value.cpt.book.joinGroupApp,
      },
    ],
    btns: [locale.value.cpt.book.joinGroup, locale.value.cpt.book.joinGroupApp],
  },
  {
    divided: true,
    width: '100px',
    title: locale.value.cpt.book.enterRoom,
    form: [
      { model: 'id', label: locale.value.cpt.book.form.roomID, type: 'input' },
      { model: 'name', label: locale.value.cpt.book.form.name, type: 'input' },
      {
        model: 'note',
        label: locale.value.cpt.book.form.delayTime,
        type: 'input',
        placeholder: locale.value.cmn.timePlace,
      },
      {
        model: 'avatar',
        label: locale.value.cpt.book.form.fromRoomID,
        type: 'input',
        placeholder: locale.value.cpt.book.switchRoom,
      },
    ],
    btns: [
      locale.value.cpt.book.createRoom,
      locale.value.cpt.book.enterRoom,
      locale.value.cpt.book.joinRoom,
      locale.value.cpt.book.switchRoom,
    ],
  },
  {
    divided: true,
    width: '100px',
    title: locale.value.cpt.book.joinMeeting,
    form: [
      {
        model: 'name',
        label: locale.value.cpt.book.form.callMode,
        type: 'radio',
        options: [
          { label: 'Advanced', value: '1' },
          { label: 'General', value: '0' },
        ],
      },
      {
        model: 'note',
        label: locale.value.cpt.book.form.delayTime,
        type: 'input',
        placeholder: locale.value.cmn.timePlace,
      },
      { model: 'ids', label: locale.value.cmn.userIDs, type: 'textarea' },
      {
        model: 'id',
        label: locale.value.cpt.book.form.callID,
        type: 'input',
        placeholder: locale.value.cpt.book.joinMeeting,
      },
    ],
    btns: [locale.value.cpt.book.createMeeting, locale.value.cpt.book.joinMeeting],
  },
  {
    divided: true,
    width: '60px',
    title: locale.value.cpt.book.addFriend,
    form: [
      { model: 'id', label: locale.value.cmn.userID, type: 'input' },
      { model: 'name', label: locale.value.cpt.book.form.alias, type: 'input' },
      { model: 'avatar', label: locale.value.cpt.book.form.wording, type: 'input' },
      { model: 'note', label: locale.value.cpt.book.form.area, type: 'input' },
    ],
    btns: [locale.value.cpt.book.addFriend, locale.value.cpt.book.form.sendFriendApp],
  },
  {
    width: '90px',
    title: locale.value.cpt.book.blacklist,
    form: [{ model: 'ids', label: locale.value.cmn.userIDs, type: 'textarea' }],
    btns: [locale.value.cpt.book.form.add, locale.value.cpt.book.form.remove],
  },
  {
    width: '90px',
    title: locale.value.cpt.book.userSubscription,
    form: [{ model: 'ids', label: locale.value.cmn.userIDs, type: 'textarea' }],
    btns: [locale.value.cpt.book.form.add, locale.value.cpt.book.form.remove, locale.value.cpt.book.form.query],
  },
];

const showFormDialog = ref(false);
const menuFormDialog = ref(0);
const modelFormDialog = reactive({
  id: '',
  ids: '',
  name: '',
  avatar: '',
  note: '',
  form: [],
});
const onFormDialogClose = (model?: any, btnIndex?: any) => {
  showFormDialog.value = false;
  if (!model) return;

  if (menuFormDialog.value == 0) {
    zimStore.updateFriendAlias(model.name, model.id);
    zimStore.updateFriendAttributes({ k1: model.note }, model.id);
    return;
  }
  if (menuFormDialog.value == 1) {
    const config = {
      friendAlias: model.name,
      friendAttributes: { k1: model.note },
    };
    zim.acceptFriendApplication(model.id, config).then(() => {
      zimStore.queryFriendAppList();
    });
    return;
  }

  const startIndex = 2;
  if (menuFormDialog.value == startIndex + 0) {
    zimStore.setUserInfo(model);
  } else if (menuFormDialog.value == startIndex + 1) {
    const id = model.id;
    gotoChat(id, '', +model.name);
  } else if (menuFormDialog.value == startIndex + 2) {
    const groupInfo = {
      groupID: model.id || '',
      groupName: model.name || '',
      groupAvatarUrl: model.avatar ? avatarPrefix + model.avatar : '',
    };
    const config = {
      groupNotice: 'Notice',
      groupAttributes: { remark: 'Remark' },
      maxMemberCount: +model.form[0] || 0,
      joinMode: +model.form[1] || 0,
      inviteMode: +model.form[2] || 0,
      beInviteMode: +model.form[3] || 0,
    };
    zim.createGroup(groupInfo, model.ids.split(','), config);
  } else if (menuFormDialog.value == startIndex + 3) {
    if (btnIndex == 0) {
      zim.joinGroup(model.id);
    } else {
      zim.sendGroupJoinApplication(model.id, { wording: model.note });
    }
  } else if (menuFormDialog.value == startIndex + 4) {
    const roomInfo = { roomID: model.id, roomName: model.name };
    const config = { roomDestroyDelayTime: +model.note || 0, roomAttributes: {} };
    let task;
    switch (btnIndex) {
      case 0:
        task = zim.createRoom(roomInfo, config);
        break;
      case 1:
        task = zim.enterRoom(roomInfo, config);
        break;
      case 2:
        task = zim.joinRoom(roomInfo.roomID);
        break;
      case 3:
        task = zim.switchRoom(model.avatar, roomInfo, true, config);
        break;
    }
    if (task) task.then((res) => gotoChat(roomInfo.roomID, res.roomInfo.baseInfo.roomName, 1));
  } else if (menuFormDialog.value == startIndex + 5) {
    if (btnIndex == 0) emit('submit', 'callInvite', model);
    else emit('submit', 'callJoin', model.id);
  } else if (menuFormDialog.value == startIndex + 6) {
    const config = {
      wording: model.avatar,
      friendAlias: model.name,
      friendAttributes: { k1: model.note },
    };
    if (btnIndex == 0) zim.addFriend(model.id, config);
    else zim.sendFriendApplication(model.id, config);
  } else if (menuFormDialog.value == startIndex + 7) {
    const userIDs = model.ids.split(',');
    if (userIDs.length) {
      if (btnIndex == 0) zim.addUsersToBlacklist(userIDs);
      else zim.removeUsersFromBlacklist(userIDs);
    }
  } else if (menuFormDialog.value == startIndex + 8) {
    const userIDs = model.ids.split(',');
    if (userIDs.length) {
      if (btnIndex == 0) {
        zim.subscribeUsersStatus(userIDs, { subscriptionDuration: 10 });
      } else if (btnIndex == 1) {
        zim.unsubscribeUsersStatus(userIDs);
      } else if (btnIndex == 2) {
        zim.queryUsersStatus(userIDs).then(console.log);
      }
    }
  }
};
const handleMenuAction = (type: number, data?: any) => {
  modelFormDialog.id = '';
  modelFormDialog.ids = '';
  modelFormDialog.name = '';
  modelFormDialog.avatar = '';
  modelFormDialog.note = '';
  modelFormDialog.form.length = 0;

  if (type == 0) {
    modelFormDialog.id = data.userID;
    modelFormDialog.name = data.friendAlias;
    modelFormDialog.note = data.friendAttributes?.k1 || '';
  } else if (type == 1) {
    modelFormDialog.id = data.applyUser.userID;
  } else if (type == 2) {
    modelFormDialog.name = zimStore.self.userName;
    const avatar = zimStore.self.userAvatarUrl?.replace(avatarPrefix, '');
    if (avatar && avatar.endsWith('.jpeg')) modelFormDialog.avatar = avatar;
    modelFormDialog.note = zimStore.self.extendedData;
    // modelFormDialog.id = zimStore.self.customStatus;
  }

  menuFormDialog.value = type;
  showFormDialog.value = true;
};

const showTab = (tab: number) => {
  activedTab.value = tab;
  switch (tab) {
    case 1:
      zimStore.queryGroupList();
      break;
    case 2:
      zimStore.queryGroupAppList();
      break;
    case 4:
      zimStore.queryCallList();
      break;
    case 5:
      zimStore.queryFriendList();
      break;
    case 6:
      zimStore.queryFriendAppList();
      break;
    case 7:
      zimStore.queryBlacklist();
      break;
    case 8:
      zimStore.querySubscribedUserStatusList();
      break;
  }
};
const getTabTitle = () => {
  switch (activedTab.value) {
    case 1:
      return `${locale.value.cpt.book.groupList}(${groupList.value.length})`;
    case 2:
      return `${locale.value.cpt.book.groupAppList}(${groupAppList.value.length})`;
    case 3:
      return `${locale.value.cpt.book.roomList}(${roomList.value.length})`;
    case 4:
      return `${locale.value.cpt.book.callList}(${callList.value.length})`;
    case 5:
      return `${locale.value.cpt.book.friendList}(${friendList.value.length})`;
    case 6:
      return `${locale.value.cpt.book.friendAppList}(${friendAppList.value.length})`;
    case 7:
      return `${locale.value.cpt.book.blacklist}(${blacklist.value.length})`;
    case 8:
      return `${locale.value.cpt.book.userSubscriptionList}(${userSubscriptionList.value.length})`;
  }
};
const getMenuClass = (i: number) => (activedTab.value == i ? 'item active' : 'item');

const gotoChat = (id: string, name: string, type: number) => {
  const conv = {} as any;
  if (name) conv.conversationName = name;
  conv.conversationID = id;
  conv.type = type;
  zimStore.updateConvInfo(conv);

  emit('submit', 'conv');
  if (type == 0 || type == 1) {
    conv.isDisabled = false;
    zimStore.queryHistoryMessage();
    if (type == 1) {
      zimStore.queryRoomMember();
      zim.queryRoomAllAttributes(id).then((res) => {
        convInfo.notice = res.roomAttributes.RoomNotice || '';
      });
    }
  } else if (type == 2) {
    zimStore.gotoGroupChat();
  }
};

const renderGroupApplyTitle = (item: any): string => {
  if (item.type == 3) return `Inviter: ${item.applyUser.userID}`;
  if (item.type == 2 || !item.isMyJoin) return `GroupID: ${item.groupInfo.groupID}`;
  return '';
};
const handelGroupApply = (ok: boolean, type: number, groupID: string, userID: string) => {
  if (ok) {
    if (type == 1) zim.acceptGroupJoinApplication(userID, groupID, {});
    else zim.acceptGroupInviteApplication(userID, groupID, {});
  } else {
    if (type == 1) zim.rejectGroupJoinApplication(userID, groupID, {});
    else zim.rejectGroupInviteApplication(userID, groupID, {});
  }
};
const removeFriend = (id: string, type?: number) => {
  zim.deleteFriends([id], { type: type || 0 });
};
const rejectFriendApp = (id: string) => {
  zim.rejectFriendApplication(id, {}).then(() => zimStore.queryFriendAppList());
};

/** Search **/
const searchBookDialogState = ref(false);
const searchResult = ref({
  show: false,
  type: '' as 'group' | 'friend',
  group: [] as any[],
  friend: [] as any[],
});
const onSearchBookDialogClose = (ev?: any, isGroup?: boolean) => {
  searchBookDialogState.value = false;
  if (!ev || !ev.keywords) return;

  const keywords = ev.keywords.split(' ').filter((v: any) => !!v);
  if (isGroup) {
    const config = {
      keywords,
      isAlsoMatchGroupMemberUserName: !!ev.matchName,
      isAlsoMatchGroupMemberNickname: !!ev.matchNickname,
      count: 100,
      nextFlag: 0,
    };
    zim.searchLocalGroups(config).then((res) => {
      console.log('===search', res);
      searchResult.value.type = 'group';
      searchResult.value.group = res.groupSearchInfoList;
      searchResult.value.show = true;
    });
  } else {
    const config = {
      keywords,
      isAlsoMatchFriendAlias: !!ev.matchAlias,
      count: 100,
      nextFlag: 0,
    };
    zim.searchLocalFriends(config).then((res) => {
      console.log('===search', res);
      searchResult.value.type = 'friend';
      searchResult.value.friend = res.friendInfoList;
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
        <span class="title">{{ locale.cpt.layout.book }}</span>
        <el-tooltip :content="locale.dl.searchBook.title">
          <el-icon color="#409eff" @click="searchBookDialogState = true">
            <Search />
          </el-icon>
        </el-tooltip>
        <el-dropdown trigger="click" placement="bottom-end">
          <el-icon><Plus /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <template v-for="(item, i) in menuItems">
                <el-dropdown-item v-if="!item.disabled" :key="i" :divided="item.divided" @click="handleMenuAction(i)">
                  {{ item.title }}
                </el-dropdown-item>
              </template>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="menulist">
        <span class="tabtips">{{ locale.cpt.book.tabGroup }}</span>
        <div :class="getMenuClass(1)" @click="showTab(1)">
          <el-icon><Avatar /></el-icon>
          <span>{{ locale.cpt.book.groupList }}</span>
        </div>
        <div :class="getMenuClass(2)" @click="showTab(2)">
          <el-icon><CirclePlus /></el-icon>
          <span>{{ locale.cpt.book.groupAppList }}</span>
        </div>
        <span class="tabtips">{{ locale.cpt.book.tabRoom }}</span>
        <div :class="getMenuClass(3)" @click="showTab(3)">
          <el-icon><Mic /></el-icon>
          <span>{{ locale.cpt.book.roomList }}</span>
        </div>
        <span class="tabtips">{{ locale.cpt.book.tabCall }}</span>
        <div :class="getMenuClass(4)" @click="showTab(4)">
          <el-icon><VideoCamera /></el-icon>
          <span>{{ locale.cpt.book.callList }}</span>
        </div>
        <span class="tabtips">{{ locale.cpt.book.tabFriend }}</span>
        <div :class="getMenuClass(5)" @click="showTab(5)">
          <el-icon><Connection /></el-icon>
          <span>{{ locale.cpt.book.friendList }}</span>
        </div>
        <div :class="getMenuClass(6)" @click="showTab(6)">
          <el-icon><CirclePlus /></el-icon>
          <span>{{ locale.cpt.book.friendAppList }}</span>
        </div>
        <div :class="getMenuClass(7)" @click="showTab(7)">
          <el-icon><Compass /></el-icon>
          <span>{{ locale.cpt.book.blacklist }}</span>
        </div>
        <div :class="getMenuClass(8)" @click="showTab(8)">
          <el-icon><Star /></el-icon>
          <span>{{ locale.cpt.book.userSubscriptionList }}</span>
        </div>
      </div>
    </div>
    <div class="container-book">
      <div class="toolbar">
        <span class="name">{{ getTabTitle() }}</span>
      </div>
      <el-scrollbar class="list">
        <div v-show="activedTab == 1">
          <div
            class="item pointer"
            v-for="item in groupList"
            :key="item.groupID"
            @click="gotoChat(item.groupID, item.groupName, 2)"
          >
            <el-avatar :size="26" shape="square" :src="item.groupAvatarUrl" />
            <span class="title">{{ item.groupName || item.groupID }}</span>
          </div>
        </div>
        <div v-show="activedTab == 2">
          <div class="item" v-for="(item, i) in groupAppList" :key="i">
            <el-avatar
              :size="32"
              shape="square"
              :src="item.isMyJoin || item.type == 3 ? item.groupInfo.groupAvatarUrl : item.applyUser.userAvatarUrl"
            />
            <div class="fr">
              <div class="flex">
                <span class="title">
                  {{ item.isMyJoin || item.type == 3 ? item.groupInfo.groupID : item.applyUser.userID }}&emsp;
                  {{ renderGroupApplyTitle(item) }}
                </span>
                <span class="tips">
                  {{ groupAapplicationTypes[item.type - 1] }}&emsp; {{ applicationStates[item.state - 1] }}&emsp;
                  {{ formatTime(item.createTime) }}
                </span>
              </div>
              <div class="icon">
                <span class="tips">{{ item.wording }}</span>
                <template v-if="item.state == 1 && item.type != 2 && !item.isMyJoin">
                  <el-icon
                    class="right"
                    :color="maincolor"
                    @click="handelGroupApply(false, item.type, item.groupInfo.groupID, item.applyUser.userID)"
                  >
                    <Close />
                  </el-icon>
                  <el-icon
                    class="right"
                    :color="maincolor"
                    @click="handelGroupApply(true, item.type, item.groupInfo.groupID, item.applyUser.userID)"
                  >
                    <Check />
                  </el-icon>
                </template>
              </div>
            </div>
          </div>
        </div>
        <div v-show="activedTab == 3">
          <div class="item pointer" v-for="item in roomList" :key="item" @click="gotoChat(item, '', 1)">
            <span class="title">{{ item }}</span>
          </div>
        </div>
        <div v-show="activedTab == 4">
          <div class="item col" v-for="item in callList" :key="item.callID">
            <div class="flex">
              <span>
                {{ item.caller }}: {{ item.callID }}, {{ callModeMap[item.mode] }}, {{ callStateMap[item.state] }}
              </span>
              <span>{{ formatTime(item.createTime) }} - {{ formatTime(item.endTime) }}</span>
            </div>
            <div>
              <el-tag
                v-for="user in item.callUserList"
                :key="user.userID"
                :type="callUserTagType(user.state, item.caller == user.userID)"
              >
                {{ user.userID }}, {{ callUserStateMap[user.state] || user.state }}, {{ user.extendedData }}
              </el-tag>
            </div>
          </div>
        </div>
        <div v-show="activedTab == 5">
          <div
            class="item pointer"
            v-for="item in friendList"
            :key="item.userID"
            @click="gotoChat(item.userID, item.userName, 0)"
          >
            <el-avatar :size="32" shape="square" :src="item.userAvatarUrl" />
            <div class="fr">
              <div class="flex">
                <span class="title">{{ item.userName || item.userID }}</span>
                <span class="tips">{{ formatTime(item.createTime) }}</span>
              </div>
              <div class="icon">
                <span class="tips">
                  {{ locale.cpt.book.form.alias }}: {{ item.friendAlias }}&emsp; {{ locale.cpt.book.form.area }}:
                  {{ item.friendAttributes?.k1 }}
                  {{ locale.cpt.book.form.wording }}: {{ item.wording }}
                </span>
                <el-icon title="double" class="right" color="#e63737" @click.native.stop="removeFriend(item.userID)">
                  <DeleteFilled />
                </el-icon>
                <el-icon title="single" class="right" color="#e63737" @click.native.stop="removeFriend(item.userID, 1)">
                  <Delete />
                </el-icon>
                <el-icon class="right" :color="maincolor" @click.native.stop="handleMenuAction(0, item)">
                  <Edit />
                </el-icon>
              </div>
            </div>
          </div>
        </div>
        <div v-show="activedTab == 6">
          <div class="item" v-for="item in friendAppList" :key="item.applyUser.userID">
            <el-avatar :size="32" shape="square" :src="item.applyUser.userAvatarUrl" />
            <div class="fr">
              <div class="flex">
                <span class="title">{{ item.applyUser.userName || item.applyUser.userID }}</span>
                <span class="tips">
                  {{ friendAppTypes[item.type] }}&emsp;{{ applicationStates[item.state - 1] }}&emsp;
                  {{ formatTime(item.createTime) }}
                </span>
              </div>
              <div class="icon">
                <span class="tips">{{ item.wording }}</span>
                <el-icon
                  v-if="item.type == 1 && item.state == 1"
                  class="right"
                  :color="maincolor"
                  @click="rejectFriendApp(item.applyUser.userID)"
                >
                  <Close />
                </el-icon>
                <el-icon
                  v-if="item.type == 1 && item.state == 1"
                  class="right"
                  :color="maincolor"
                  @click="handleMenuAction(1, item)"
                >
                  <Check />
                </el-icon>
              </div>
            </div>
          </div>
        </div>
        <div v-show="activedTab == 7">
          <div
            class="item pointer"
            v-for="item in blacklist"
            :key="item.userID"
            @click="gotoChat(item.userID, item.userName, 0)"
          >
            <el-avatar :size="26" shape="square" :src="item?.userAvatarUrl" />
            <span>userName - {{ item.userName }} | userID - {{ item.userID }}</span>
          </div>
        </div>
        <div v-show="activedTab == 8">
          <div class="item pointer" v-for="item in userSubscriptionList" :key="item.userStatus.userID">
            <span class="flex1">
              {{ item.userStatus.userID }} | {{ onlineStatusType[item.userStatus.onlineStatus] }} |
              {{ formatTime(item.userStatus.lastUpdateTime) }}, {{ formatTime(+(item.subscribeExpiredTime + '000')) }}
            </span>
            <div>
              <img v-for="v in item.userStatus.onlinePlatforms" :key="v" width="22" :src="'/assets/p' + v + '.png'" />
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
    <!-- Dialog -->
    <ZIMFormDialog
      :visible="showFormDialog"
      :model="modelFormDialog"
      :menu="menuItems[menuFormDialog]"
      @close="onFormDialogClose"
    />
    <ZIMSearchBookDialog :visible="searchBookDialogState" @close="onSearchBookDialogClose" />
    <ZIMSearchResultDialog
      :type="searchResult.type"
      :visible="searchResult.show"
      :list="searchResult[searchResult.type]"
      @close="searchResult.show = false"
    />
  </div>
</template>

<style scoped lang="scss">
$border: 1px solid var(--el-border-color-light);

.menulist {
  .tabtips {
    display: block;
    padding-left: 12px;
    background-color: #ebeced;
  }
  .item {
    padding: 10px;
    border-bottom: $border;
    display: flex;
    align-items: center;
    cursor: pointer;

    .el-icon,
    .el-icon svg {
      width: 2em;
      height: 2em;
      color: #409eff;
    }

    > span {
      padding-left: 8px;
      font-size: 16px;
    }
  }
}

.container-book {
  flex: 1;
  .list {
    max-height: 490px;

    .item {
      padding: 12px;
      border-bottom: $border;
      display: flex;
      align-items: center;

      .el-avatar {
        margin-right: 8px;
      }
      .el-icon,
      .el-icon svg {
        width: 16px;
        height: 16px;
      }
      .el-icon + .el-icon {
        margin-right: 12px;
      }
      .icon {
        line-height: 20px;
        .el-icon {
          margin-top: 2px;
          cursor: pointer;
        }
      }
    }

    .pointer {
      cursor: pointer;
    }
    .col {
      flex-direction: column;
      align-items: initial;
    }
  }
}
</style>
<style>
.el-select-dropdown__item {
  display: flex;
  justify-content: space-between;
}
</style>
