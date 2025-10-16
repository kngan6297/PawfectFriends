<script setup lang="ts">
import { ZIMMessageReaction } from '../../store/index';

defineProps<{
  type: string;
  reactions: ZIMMessageReaction[];
}>();
</script>

<template>
  <dev>
    <el-tag
      v-for="item in reactions"
      :key="item.reactionType"
      :effect="item.reactionType == type ? 'dark' : 'plain'"
      round
      size="large"
      @click="$emit('fetch', item.reactionType)"
    >
      <span v-if="item.reactionType == '👌'">👌</span>
      <span v-else-if="item.reactionType == '👍'">👍</span>
      <span v-else-if="item.reactionType == '👎'">👎</span>
      <span v-else-if="item.reactionType == '✍️'">✍️</span>
      <span v-else-if="item.reactionType == '😊'">😊</span>
      <span v-else-if="item.reactionType == '😭'">😭</span>
      <span v-else-if="item.reactionType == '😓'">😓</span>
      <span v-else-if="item.reactionType == '🙂'">🙂</span>
      <span v-else-if="item.reactionType == '😎'">😎</span>
      <span v-else-if="item.reactionType == '🥰'">🥰</span>
      <span v-else-if="item.reactionType == '👻'">👻</span>
      <span v-else-if="item.reactionType == '💯'">💯</span>
      <span v-else-if="item.reactionType == '💦'">💦</span>
      <span v-else-if="item.reactionType == '🐶'">🐶</span>
      <span v-else-if="item.reactionType == '🎉'">🎉</span>
      <span v-else>{{ item.reactionType }}</span>
      <span>{{ item.totalCount }}</span>
    </el-tag>
  </dev>
</template>
