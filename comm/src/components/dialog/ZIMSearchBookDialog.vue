<script setup lang="ts">
import { computed, reactive } from 'vue';
import useStore from '../../store';

defineProps(['visible', 'member']);

const zimStore = useStore();
const locale = computed(() => zimStore.locale);

const dialogForm = reactive({
  keywords: '',
  matchAlias: false,
  matchName: false,
  matchNickname: false,
});

const initDialogForm = () => {
  dialogForm.keywords = '';
  dialogForm.matchAlias = false;
  dialogForm.matchName = false;
  dialogForm.matchNickname = false;
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    :center="true"
    :title="member ? locale.dl.searchBook.member : locale.dl.searchBook.title"
    width="50%"
    top="50px"
    @open="initDialogForm"
    @close="$emit('close')"
  >
    <el-form :model="dialogForm" label-width="80px">
      <el-form-item :label="locale.dl.searchBook.keywords">
        <el-input v-model="dialogForm.keywords" :placeholder="locale.cmn.spacePlace" type="textarea"></el-input>
      </el-form-item>
      <el-switch v-if="!member" v-model="dialogForm.matchAlias" :active-text="locale.dl.searchBook.matchAlias" /><br />
      <el-switch
        v-if="!member"
        v-model="dialogForm.matchName"
        :active-text="locale.dl.searchBook.matchName"
        style="margin-right: 32px"
      />
      <el-switch v-model="dialogForm.matchNickname" :active-text="locale.dl.searchBook.matchNickname" />
    </el-form>
    <template #footer>
      <el-button v-if="!member" type="primary" @click="$emit('close', dialogForm)">
        {{ locale.dl.searchBook.friend }}
      </el-button>
      <el-button v-if="!member" type="primary" @click="$emit('close', dialogForm, true)">
        {{ locale.dl.searchBook.group }}
      </el-button>
      <el-button v-if="member" type="primary" @click="$emit('close', dialogForm)">
        {{ locale.cmn.confirm }}
      </el-button>
    </template>
  </el-dialog>
</template>
