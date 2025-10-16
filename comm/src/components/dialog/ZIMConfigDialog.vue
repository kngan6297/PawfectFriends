<script setup lang="ts">
import { computed, reactive } from 'vue';
import useStore from '../../store/index';

defineProps(['visible', 'init']);

const zimStore = useStore();
const locale = computed(() => zimStore.locale);

const dialogForm = reactive({
  resourcesID: '',
  badgeIncrement: -1,
  voIPConfig: { iOSVoIPHasVideo: false, iOSVoIPHandleType: 1, iOSVoIPHandleValue: '' },
  geoFence: { type: 0, areas: [] },
});
</script>

<template>
  <el-dialog
    class="app-conf-dialog"
    :model-value="visible"
    :center="true"
    :title="locale.dl.config.title"
    width="60%"
    top="50px"
    @close="$emit('close')"
  >
    <el-form :model="dialogForm" label-width="160px">
      <el-form-item label="resourcesID">
        <el-input v-model="dialogForm.resourcesID"></el-input>
      </el-form-item>
      <el-form-item label="badgeIncrement">
        <el-input-number v-model="dialogForm.badgeIncrement" />
      </el-form-item>
      <el-form-item label="iOSVoIPHasVideo">
        <el-switch v-model="dialogForm.voIPConfig.iOSVoIPHasVideo" />
      </el-form-item>
      <el-form-item label="iOSVoIPHandleType">
        <el-select v-model="dialogForm.voIPConfig.iOSVoIPHandleType">
          <el-option label="Generic" :value="1" />
          <el-option label="PhoneNumber" :value="2" />
          <el-option label="EmailAddress" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="iOSVoIPHandleValue">
        <el-input v-model="dialogForm.voIPConfig.iOSVoIPHandleValue"></el-input>
      </el-form-item>
      <template v-if="init">
        <el-divider border-style="dashed" />
        <el-form-item label="geoFenceType">
          <el-select v-model="dialogForm.geoFence.type">
            <el-option label="None" :value="0" />
            <el-option label="Include" :value="1" />
            <el-option label="Exclude" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="geoFenceAreaCode">
          <el-select multiple v-model="dialogForm.geoFence.areas">
            <el-option label="CN-2" :value="2" />
            <el-option label="NA-3" :value="3" />
            <el-option label="EU-4" :value="4" />
            <el-option label="AS-5" :value="5" />
            <el-option label="IN-6" :value="6" />
            <el-option label="NCN-7" :value="7" />
          </el-select>
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="$emit('close', dialogForm)">{{ locale.cmn.confirm }}</el-button>
    </template>
  </el-dialog>
</template>
