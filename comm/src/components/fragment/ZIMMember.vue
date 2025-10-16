<script setup lang="ts">
import {
  Check,
  Close,
  Edit,
  Hide,
  Minus,
  MoreFilled,
  MuteNotification,
  Plus,
  Search,
  Sunny,
  Sunrise,
  Switch,
} from '@element-plus/icons-vue';
import { computed, reactive, ref } from 'vue';
import useStore, { zim } from '../../store';
import {
  applicationStates,
  avatarOptions,
  avatarPrefix,
  formatTime,
  groupAapplicationTypes,
  maincolor,
} from '../../utils';

const zimStore = useStore();
const locale = computed(() => zimStore.locale);
const convInfo = zimStore.convInfo;
const self = zimStore.self;
const userMap = zimStore.userMap;
const memberList = computed(() => zimStore.memberList);
const groupAppList = computed(() => zimStore.groupAppList);
const totalMemberCount = computed(() => zimStore.totalMemberCount);
const isOwner = computed(() => zimStore.memberList.some((item) => item.userID == self.userID && item.memberRole == 1));
const isAdmin = computed(() =>
  zimStore.memberList.some((item) => item.userID == self.userID && (item.memberRole == 1 || item.memberRole == 2)),
);

const menuItems = [
  // 1 editRoom
  {
    title: locale.value.fm.member.editRoom,
    form: [{ model: 'notice', label: locale.value.fm.member.notice, type: 'input' }],
  },
  // 2 editGroup
  {
    title: locale.value.fm.member.editGroup,
    form: [
      { model: 'avatar', label: locale.value.cpt.book.form.avatar, type: 'select', options: avatarOptions },
      { model: 'name', label: locale.value.cpt.book.form.name, type: 'input' },
      { model: 'notice', label: locale.value.fm.member.notice, type: 'input' },
      {
        model: 'form',
        label: locale.value.cpt.book.form.advancedConfig,
        type: 'form',
        form: ['Join mode', 'Invite mode', 'BeInvite mode'],
      },
    ],
  },
  // 3 editMember
  {
    title: locale.value.fm.member.editMember,
    form: [
      { model: 'ids', label: locale.value.cmn.userID, type: 'input' },
      { model: 'name', label: locale.value.fm.member.nickname, type: 'input' },
      { model: 'note', label: locale.value.fm.member.role, type: 'input' },
    ],
  },
  // 4 addMember
  {
    title: locale.value.fm.member.addMember,
    form: [
      { model: 'ids', label: locale.value.cmn.userIDs, type: 'textarea' },
      {
        model: 'note',
        label: locale.value.cpt.book.form.wording,
        type: 'input',
        placeholder: locale.value.fm.member.addMemberApp,
      },
    ],
    btns: [locale.value.fm.member.addMember, locale.value.fm.member.addMemberApp],
  },
  // 5 muteGroup
  {
    title: locale.value.fm.member.muteGroup,
    form: [
      {
        model: 'note',
        label: locale.value.fm.member.muteMode,
        type: 'radio',
        options: [
          { label: 'None', value: '0' },
          { label: 'Normal', value: '1' },
          { label: 'All', value: '2' },
          { label: 'Custom', value: '3' },
        ],
      },
      {
        model: 'name',
        label: locale.value.fm.member.duration,
        type: 'input',
        placeholder: locale.value.cmn.timePlace,
      },
    ],
  },
  // 6 muteGroupMember
  {
    title: locale.value.fm.member.muteGroupMember,
    form: [
      { model: 'ids', label: locale.value.cmn.userIDs, type: 'textarea' },
      {
        model: 'name',
        label: locale.value.fm.member.duration,
        type: 'input',
        placeholder: locale.value.cmn.timePlace,
      },
    ],
  },
];

const isShowList = ref(false);
const isShowDialog = ref(false);
const dialogType = ref(1);
const dialogCheck = ref('');
const dialogForm: any = reactive({
  name: '',
  notice: '',
  avatar: '',
  note: '',
  ids: '',
  form: [],
});

const showDialogForm = (type: number) => {
  dialogType.value = type;
  isShowDialog.value = true;
  dialogForm.name = '';
  dialogForm.notice = '';
  dialogForm.avatar = '';
  dialogForm.note = '';
  dialogForm.ids = '';
  dialogForm.form.length = 0;
};
const showDialogList = (type: number) => {
  dialogType.value = type;
  isShowList.value = true;
};

const changeRoomAttributes = () => {
  if (dialogForm.notice) {
    const config = {
      isForce: true,
      isUpdateOwner: true,
      isDeleteAfterOwnerLeft: true,
    };
    zim.setRoomAttributes({ RoomNotice: dialogForm.notice }, convInfo.conversationID, config);
  }
};

const updateGroupInfo = () => {
  zimStore.updateGroupInfo(
    convInfo.conversationID,
    dialogForm.name,
    dialogForm.notice,
    dialogForm.avatar,
    dialogForm.form as string[],
  );
};

const updateMemberInfo = () => {
  zimStore.updateMemberInfo(convInfo.conversationID, dialogForm.ids, +dialogForm.note, dialogForm.name);
};

const inviteUsersIntoGroup = (btnIndex: number) => {
  if (dialogForm.ids) {
    const ids = dialogForm.ids.split(',');
    if (btnIndex == 0) {
      zim.inviteUsersIntoGroup(ids, convInfo.conversationID);
    } else {
      zim.sendGroupInviteApplications(ids, convInfo.conversationID, { wording: dialogForm.note });
    }
  }
};

const kickGroupMembers = () => {
  if (!dialogCheck.value) return;
  zim.kickGroupMembers([dialogCheck.value], convInfo.conversationID);
};

const transferGroupOwner = () => {
  if (!dialogCheck.value) return;
  zimStore.transferGroupOwner(convInfo.conversationID, dialogCheck.value);
};

const muteGroup = () => {
  if (dialogForm.note && dialogForm.name) {
    const mode = +dialogForm.note;
    const roles = mode == 3 ? [2, 3] : [];
    zim.muteGroup(mode != 0, convInfo.conversationID, { mode, duration: +dialogForm.name, roles });
  }
};

const muteGroupMember = () => {
  if (dialogForm.ids && dialogForm.name) {
    const duration = +dialogForm.name;
    zim.muteGroupMembers(!!duration, dialogForm.ids.split(','), convInfo.conversationID, { duration });
  }
};

const handelGroupApp = (ok: boolean, userID: string) => {
  if (ok) {
    zim.acceptGroupJoinApplication(userID, convInfo.conversationID, {});
  } else {
    zim.rejectGroupJoinApplication(userID, convInfo.conversationID, {});
  }
};

const titleMap: any = {
  100: locale.value.fm.member.deleteMember,
  101: locale.value.fm.member.transferOwner,
};
const getDialogTitle = (): string => {
  if (dialogType.value < 100) return menuItems[dialogType.value - 1].title;
  return titleMap[dialogType.value] as string;
};
const onDialogSubmit = (btnIndex?: number) => {
  if (dialogType.value == 1) {
    changeRoomAttributes();
  } else if (dialogType.value == 2) {
    updateGroupInfo();
  } else if (dialogType.value == 3) {
    updateMemberInfo();
  } else if (dialogType.value == 4) {
    inviteUsersIntoGroup(btnIndex as number);
  } else if (dialogType.value == 5) {
    muteGroup();
  } else if (dialogType.value == 6) {
    muteGroupMember();
  } else if (dialogType.value == 100) {
    kickGroupMembers();
  } else if (dialogType.value == 101) {
    transferGroupOwner();
  }

  dialogType.value = 1;
  isShowDialog.value = false;
};
</script>

<template>
  <el-scrollbar class="container-member">
    <p class="tools">
      <span class="tips">{{ locale.fm.member.notice }}</span>
      <el-button
        :disabled="convInfo.isDisabled"
        type="primary"
        link
        :icon="Edit"
        @click="showDialogForm(+convInfo.type)"
      ></el-button>
    </p>
    <p class="padding ellipsis">{{ convInfo.notice || '' }}</p>
    <p class="tools member">
      <span class="tips">{{ locale.fm.member.members }}({{ memberList.length }})</span>
      <el-dropdown v-if="convInfo.type == 2 && !convInfo.isDisabled" trigger="click" placement="bottom-end">
        <el-icon><MoreFilled /> </el-icon>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :icon="Search" @click="$emit('submit')">
              {{ locale.dl.searchBook.member }}
            </el-dropdown-item>
            <el-dropdown-item :icon="Edit" @click="showDialogForm(3)">
              {{ locale.fm.member.editMember }}
            </el-dropdown-item>
            <el-dropdown-item :icon="Plus" @click="showDialogForm(4)">
              {{ locale.fm.member.addMember }}
            </el-dropdown-item>
            <el-dropdown-item v-if="isAdmin" :icon="Minus" @click="showDialogForm(100)">
              {{ locale.fm.member.deleteMember }}
            </el-dropdown-item>
            <el-dropdown-item divided v-if="isOwner" :icon="Switch" @click="showDialogForm(101)">
              {{ locale.fm.member.transferOwner }}
            </el-dropdown-item>
            <el-dropdown-item v-if="isAdmin" :icon="MuteNotification" @click="showDialogForm(5)">
              {{ locale.fm.member.muteGroup }}
            </el-dropdown-item>
            <el-dropdown-item v-if="isAdmin" :icon="Hide" @click="showDialogForm(6)">
              {{ locale.fm.member.muteGroupMember }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </p>
    <ul class="padding">
      <li v-for="item in memberList" :key="item.userID">
        <el-avatar :size="24" :src="userMap[item.userID]?.userAvatarUrl" />
        <el-icon v-if="convInfo.type == 2 && item.memberRole == 1"><Sunny /></el-icon>
        <el-icon v-if="convInfo.type == 2 && item.memberRole == 2"><Sunrise /></el-icon>
        <el-icon v-if="convInfo.type == 2 && item.muteExpiredTime"><MuteNotification /></el-icon>
        <span class="ellipsis">{{ item.userID }}</span>
      </li>
    </ul>
    <!-- Dialog form -->
    <el-dialog v-model="isShowDialog" :center="true" :title="getDialogTitle()" width="58%" top="50px">
      <el-form v-if="dialogType < 100" :model="dialogForm" label-width="100px">
        <el-form-item v-for="item in menuItems[dialogType - 1].form" :key="item.label" :label="item.label">
          <el-input v-if="item.type == 'input'" v-model="dialogForm[item.model]" :placeholder="item.placeholder" />
          <el-input
            v-else-if="item.type == 'textarea'"
            v-model="dialogForm[item.model]"
            :placeholder="locale.cmn.splitPlace"
            type="textarea"
          />
          <el-select v-else-if="item.type == 'select'" v-model="dialogForm[item.model]">
            <el-option v-for="opt in item.options" :key="opt.value" :label="opt.label" :value="opt.value">
              <span>{{ opt.label }}</span>
              <el-avatar v-if="item.label == 'Avatar'" :size="32" shape="square" :src="avatarPrefix + opt.value" />
            </el-option>
          </el-select>
          <el-radio-group v-else-if="item.type == 'radio'" v-model="dialogForm[item.model]">
            <el-radio v-for="opt in item.options" :key="opt.value" :label="opt.value">{{ opt.label }}</el-radio>
          </el-radio-group>
          <el-row v-else-if="item.type == 'form' && item.form">
            <el-col :span="24 / item.form.length" v-for="(sub, i) in item.form" :key="sub">
              <el-input v-model="dialogForm[item.model][i]" :placeholder="sub" />
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
      <el-radio-group v-else v-model="dialogCheck" style="max-height: 260px">
        <el-radio
          v-for="item in memberList"
          :key="item.userID"
          :label="item.userID"
          :disabled="item.userID == self.userID || item.memberRole == 1"
        >
          {{ item.userID }}
        </el-radio>
      </el-radio-group>
      <template #footer>
        <el-button
          v-if="menuItems[dialogType - 1]?.btns"
          v-for="(btn, i) in menuItems[dialogType - 1].btns"
          :key="btn"
          type="primary"
          @click="onDialogSubmit(i)"
        >
          {{ btn }}
        </el-button>
        <el-button v-else type="primary" @click="onDialogSubmit()">{{ locale.cmn.confirm }}</el-button>
      </template>
    </el-dialog>
    <!-- Dialog list -->
    <el-dialog v-model="isShowList" :center="true" :title="getDialogTitle()" width="50%" top="50px">
      <div class="scroll-dialog">
        <div class="item" v-for="(item, i) in groupAppList" :key="i">
          <el-avatar :size="32" shape="square" :src="item.applyUser.userAvatarUrl" />
          <div class="fr">
            <div class="flex">
              <span class="title">{{ item.applyUser.userName || item.applyUser.userID }}</span>
              <span class="tips">
                {{ groupAapplicationTypes[item.type - 1] }}&emsp;&emsp;
                {{ applicationStates[item.state - 1] }}&emsp;&emsp;
                {{ formatTime(item.createTime) }}
              </span>
            </div>
            <div class="icon">
              <span class="tips">{{ item.wording }}</span>
              <el-icon
                v-if="item.type == 1 && item.state == 1"
                class="right"
                :color="maincolor"
                @click="handelGroupApp(false, item.applyUser.userID)"
              >
                <Close />
              </el-icon>
              <el-icon
                v-if="item.type == 1 && item.state == 1"
                class="right"
                :color="maincolor"
                @click="handelGroupApp(true, item.applyUser.userID)"
              >
                <Check />
              </el-icon>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </el-scrollbar>
</template>

<style scoped lang="scss">
$border: 1px solid var(--el-border-color-light);

.container-member {
  width: 150px;
  border-left: $border;

  .el-avatar {
    min-width: 24px;
  }

  .padding {
    padding: 6px;
  }
  .tools {
    padding-left: 6px;
    padding-right: 12px;
    line-height: 32px;
    display: flex;
    align-items: center;
    > span {
      flex: 1;
    }
    .el-dropdown {
      cursor: pointer;
      color: var(--el-color-primary);
    }
  }
  .member {
    border-top: $border;
  }
  li {
    padding-bottom: 4px;
    display: flex;
    align-items: center;
  }
}
</style>

<style>
.el-select-dropdown__item {
  display: flex;
  justify-content: space-between;
}
</style>
