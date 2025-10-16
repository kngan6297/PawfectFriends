<script setup lang="ts">
import { computed } from 'vue';
import useStore from '../../store/index';
import { avatarPrefix } from '../../utils';

defineProps(['visible', 'model', 'menu']);

const zimStore = useStore();
const locale = computed(() => zimStore.locale);
</script>

<template>
  <el-dialog
    :model-value="visible"
    :center="true"
    :title="menu.title"
    :width="menu.dialogWidth || '50%'"
    top="50px"
    @close="$emit('close')"
  >
    <el-form :model="model" :label-width="menu.width">
      <el-form-item v-for="item in menu.form" :key="item.label" :label="item.label">
        <el-input
          v-if="item.type == 'input'"
          v-model="model[item.model]"
          :placeholder="item.placeholder"
          :readonly="item.readonly"
        />
        <el-input
          v-else-if="item.type == 'textarea'"
          v-model="model[item.model]"
          :placeholder="locale.cmn.splitPlace"
          type="textarea"
        />
        <el-select v-else-if="item.type == 'select'" v-model="model[item.model]">
          <el-option v-for="opt in item.options" :key="opt.value" :label="opt.label" :value="opt.value">
            <span>{{ opt.label }}</span>
            <el-avatar v-if="item.label == 'Avatar'" :size="32" shape="square" :src="avatarPrefix + opt.value" />
          </el-option>
        </el-select>
        <el-radio-group v-else-if="item.type == 'radio'" v-model="model[item.model]">
          <el-radio v-for="opt in item.options" :key="opt.value" :label="opt.value">{{ opt.label }}</el-radio>
        </el-radio-group>
        <el-row v-else-if="item.type == 'form' && item.form">
          <el-col :span="24 / item.form.length" v-for="(sub, i) in item.form" :key="sub">
            <el-input v-model="model[item.model][i]" :placeholder="sub" />
          </el-col>
        </el-row>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button
        v-if="menu.btns"
        v-for="(btn, i) in menu.btns"
        :key="btn"
        type="primary"
        @click="$emit('close', model, i)"
      >
        {{ btn }}
      </el-button>
      <el-button v-else type="primary" @click="$emit('close', model)">{{ locale.cmn.confirm }}</el-button>
    </template>
  </el-dialog>
</template>
