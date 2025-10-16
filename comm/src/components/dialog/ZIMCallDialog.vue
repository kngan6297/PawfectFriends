<script setup lang="ts">
import { CloseBold, Select } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { computed, onMounted, onUnmounted, reactive } from 'vue';
import useStore, { zim } from '../../store/index';
import { callModeMap, callUserStateMap, callUserTagType, formatTime } from '../../utils';

defineProps(['visible']);
const emit = defineEmits(['submit']);

const zimStore = useStore();
const locale = computed(() => zimStore.locale);
const self = computed(() => zimStore.self);
const callInfo = computed(() => zimStore.callInfo);

const callForm = reactive({
  userIDs: '',
});

const initEvent = () => {
  zim.on('callInvitationReceived', (zim, data) => {
    console.log('===callInvitationReceived==', JSON.stringify(data));
    const map = data.callUserList.reduce((s, i) => ((s[i.userID] = i.state), s), {} as Record<string, number>);
    zimStore.setCallInfo({
      isShow: true,
      callID: data.callID,
      caller: data.caller,
      mode: data.mode,
      state: 1,
      userStateMap: map,
      selfState: 5,
      createTime: data.createTime,
      acceptTime: 0,
      quitTime: 0,
      endTime: 0,
    });
    emit('submit', 'showCall', true);
  });
  zim.on('callInvitationCancelled', (zim, data) => {
    console.log('===callInvitationCancelled==', JSON.stringify(data));
    ElMessage.warning('call cancelled: ' + data.callID);
    zimStore.setCallInfo({ isShow: false, state: 2 });
  });
  zim.on('callInvitationTimeout', (zim, data) => {
    console.log('===callInvitationTimeout==', JSON.stringify(data));
    ElMessage.warning('call timeout: ' + data.callID);
    zimStore.setCallInfo({ isShow: false, state: 2 });
  });
  zim.on('callInvitationEnded', (zim, data) => {
    console.log('===callInvitationEnded==', JSON.stringify(data));
    ElMessage.warning('call ended: ' + data.callID);
    zimStore.setCallInfo({ isShow: false, state: 2, endTime: data.endTime });
  });
  zim.on('callUserStateChanged', (zim, data) => {
    console.log('===callUserStateChanged==', JSON.stringify(data));
    const map = data.callUserList.reduce((s, i) => ((s[i.userID] = i.state), s), {} as Record<string, number>);
    zimStore.setCallInfo({ callID: data.callID, userStateMap: map });
  });
};

const cleanupEvent = () => {
  // Remove all call-related event listeners to prevent double-fire
  zim.off('callInvitationReceived');
  zim.off('callInvitationCancelled');
  zim.off('callInvitationTimeout');
  zim.off('callInvitationEnded');
  zim.off('callUserStateChanged');
  console.log('✅ Call dialog event listeners cleaned up');
};

const callAccept = () => {
  zimStore.callAccept();
};

const callReject = () => {
  zimStore.callReject();
};

const callingInvite = () => {
  zimStore.callingInvite(callForm.userIDs.split(','));
  callForm.userIDs = '';
};

const callQuit = () => {
  zimStore.callQuit();
};

const callEnd = () => {
  zimStore.callEnd();
};

const callCancel = () => {
  zimStore.callCancel(callForm.userIDs.split(','));
};

onMounted(() => {
  initEvent();
});

onUnmounted(() => {
  cleanupEvent();
});
</script>

<template>
  <div>
    <!-- Call style -->
    <div class="call-mask" v-if="callInfo.callID && callInfo.isShow">
      <div class="call-content">
        <div class="avatar">
          <el-avatar shape="square" src="https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png" />
        </div>
        <p class="name">{{ callInfo.caller }}</p>
        <p class="text">{{ callInfo.callID }} {{ callModeMap[callInfo.mode] }}</p>
        <div class="lds-ellipsis">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div class="action">
          <el-button size="large" type="danger" :icon="CloseBold" circle @click="callReject" />
          <el-button size="large" type="success" :icon="Select" circle @click="callAccept" />
        </div>
      </div>
    </div>
    <el-dialog
      :model-value="visible"
      :center="true"
      :title="`${locale.dl.call.caller}: ${callInfo.caller}, ${locale.dl.call.mode}: ${callModeMap[callInfo.mode]}`"
      width="54%"
      top="50px"
      @close="$emit('submit', 'showCall', false)"
    >
      <div class="scroll-dialog">
        <p>
          {{ locale.dl.call.callID }}: {{ callInfo.callID }}, {{ locale.dl.call.createTime }}:
          {{ formatTime(callInfo.createTime, true) }}, {{ locale.dl.call.acceptTime }}:
          {{ formatTime(callInfo.acceptTime, true) }}, {{ locale.dl.call.quitTime }}:
          {{ formatTime(callInfo.quitTime, true) }}, {{ locale.dl.call.endTime }}:
          {{ formatTime(callInfo.endTime, true) }}
        </p>
        <el-tag
          v-for="(state, userID) in callInfo.userStateMap"
          :key="userID"
          :type="callUserTagType(state, userID == callInfo.caller)"
        >
          {{ userID }}&ensp;{{ callUserStateMap[state] || state }}
        </el-tag>
        <div style="text-align: center">
          <el-form
            v-if="
              callInfo.state != 2 && ((callInfo.mode == 1 && callInfo.selfState == 1) || callInfo.caller == self.userID)
            "
            :model="callForm"
            label-width="100px"
          >
            <el-form-item :label="locale.cmn.userIDs">
              <el-input v-model="callForm.userIDs" :placeholder="locale.cmn.splitPlace" type="textarea"></el-input>
            </el-form-item>
          </el-form>
          <template v-if="callInfo.state != 2 && callInfo.mode == 1 && callInfo.selfState == 1">
            <el-button type="primary" @click="callingInvite">{{ locale.dl.call.invite }}</el-button>
            <el-button type="primary" @click="callQuit"> {{ locale.dl.call.quit }} </el-button>
            <el-button v-if="callInfo.state != 2" type="danger" @click="callEnd">{{ locale.dl.call.end }}</el-button>
          </template>
          <el-button v-if="callInfo.caller == self.userID && callInfo.state != 2" type="danger" @click="callCancel">
            {{ locale.dl.call.cancel }}
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
$border: 1px solid var(--el-border-color-light);
.call-mask {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: rgba(74, 51, 73, 0.22);
  z-index: 99999;

  .call-content {
    display: flex;
    flex-direction: column;
    margin: 0 auto;
    margin-top: 15%;
    padding-top: 20px;
    //transform: translateY(-50%);
    width: 260px;
    height: 280px;
    background: rgba(25, 25, 25, 0.96);
    border-radius: 6px;

    .avatar {
      display: flex;
      width: 120px;
      height: 120px;
      margin: 0 auto;
      border-radius: 3px;
      background-color: #2d4156;

      & > :first-child {
        flex: 1;
        height: 100%;
      }
    }

    p {
      color: white;
      margin-top: 12px;
      text-align: center;
    }

    .text {
      margin-top: 6px;
      font-size: small;
    }

    .action {
      flex: 1;
      display: flex;
      justify-content: space-between;
      //align-items: center;
      padding: 0 36px;
    }
  }
}
</style>
