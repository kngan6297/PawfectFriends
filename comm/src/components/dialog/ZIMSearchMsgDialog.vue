<script setup lang="ts">
import { computed, reactive } from 'vue';
import useStore from '../../store';

defineProps(['visible', 'type']);

const zimStore = useStore();
const locale = computed(() => zimStore.locale);

const dialogForm = reactive({
  keywords: '',
  senderUserIDs: '',
  subMessageTypes: '',
  messageTypes: [],
  startTime: 0,
  endTime: 0,
  time: 0,
});

const initDialogForm = () => {
  dialogForm.keywords = '';
  dialogForm.senderUserIDs = '';
  (dialogForm.subMessageTypes = ''), (dialogForm.messageTypes = []);
  dialogForm.startTime = 0;
  dialogForm.endTime = 0;
  dialogForm.time = 0;
};

const onStartTimeChange = (val: any) => {
  const now = new Date();
  now.setHours(0);
  now.setMilliseconds(0);
  now.setMilliseconds(0);
  const end = now.getTime() + 24 * 3600 * 1000;
  dialogForm.endTime = end;
  dialogForm.startTime = end - val * 24 * 3600 * 1000;
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    :center="true"
    :title="locale.dl.searchMsg.title"
    width="60%"
    top="50px"
    @open="initDialogForm"
    @close="$emit('close')"
  >
    <el-form :model="dialogForm" label-width="140px">
      <el-form-item :label="locale.dl.searchMsg.keywords">
        <el-input v-model="dialogForm.keywords" :placeholder="locale.cmn.spacePlace"></el-input>
      </el-form-item>
      <el-form-item v-if="type" :label="locale.dl.searchMsg.senderUserIDs">
        <el-input v-model="dialogForm.senderUserIDs" :placeholder="locale.cmn.splitPlace"></el-input>
      </el-form-item>
      <el-form-item :label="locale.dl.searchMsg.subMsgTypes">
        <el-input v-model="dialogForm.subMessageTypes" :placeholder="locale.cmn.splitPlace"></el-input>
      </el-form-item>
      <el-form-item :label="locale.dl.searchMsg.msgTypes">
        <el-checkbox-group v-model="dialogForm.messageTypes">
          <el-checkbox :label="1">{{ locale.cpt.chat.text }}</el-checkbox>
          <el-checkbox :label="11">{{ locale.cpt.chat.image }}</el-checkbox>
          <el-checkbox :label="13">{{ locale.cpt.chat.audio }}</el-checkbox>
          <el-checkbox :label="14">{{ locale.cpt.chat.video }}</el-checkbox>
          <el-checkbox :label="12">{{ locale.cpt.chat.file }}</el-checkbox>
          <el-checkbox :label="200">{{ locale.cpt.chat.custom }}</el-checkbox>
          <el-checkbox :label="100">{{ locale.cpt.chat.combine }}</el-checkbox>
          <el-checkbox :label="10">{{ locale.cpt.chat.multiple }}</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item :label="locale.dl.searchMsg.timeLimit">
        <el-radio-group v-model="dialogForm.time" @change="onStartTimeChange">
          <el-radio :label="1">{{ locale.dl.searchMsg.today }}</el-radio>
          <el-radio :label="7">{{ locale.dl.searchMsg.last7Days }}</el-radio>
          <el-radio :label="30">{{ locale.dl.searchMsg.last30Days }}</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button v-if="type == 1" type="primary" @click="$emit('close', dialogForm, true)">
        {{ locale.dl.searchMsg.search }}
      </el-button>
      <el-button type="primary" @click="$emit('close', dialogForm, false)">
        {{ type == 1 ? locale.dl.searchMsg.title : locale.cmn.confirm }}
      </el-button>
    </template>
  </el-dialog>
</template>
