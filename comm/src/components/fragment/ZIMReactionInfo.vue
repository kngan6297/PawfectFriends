<script setup lang="ts">
import useStore from '../../store/index';

defineProps<{
  msg: any;
}>();

const zimStore = useStore();
const msgBizReg = /vote|quest/;

const renderUserIDs = (obj: any) => {
  let ids = obj.userList.map((v: any) => v.userID) as string[];
  if (obj.isSelfIncluded && ids.indexOf(zimStore.self.userID) == -1) {
    ids.unshift(zimStore.self.userID);
  }
  return `(${obj.totalCount}): ${ids.join()}`;
};
</script>

<template>
  <div v-if="msg.reactions && msg.reactions.length" class="emoji">
    <template v-for="item in msg.reactions">
      <el-tag
        v-bind:key="item.reactionType"
        v-if="!msgBizReg.test(item.reactionType)"
        :type="msg.direction ? '' : 'success'"
      >
        <span @click="$emit('delete', msg, item)">
          <template v-if="item.reactionType == '👌'">👌</template>
          <template v-else-if="item.reactionType == '👍'">👍</template>
          <template v-else-if="item.reactionType == '👎'">👎</template>
          <template v-else-if="item.reactionType == '✍️'">✍️</template>
          <template v-else-if="item.reactionType == '😊'">😊</template>
          <template v-else-if="item.reactionType == '😭'">😭</template>
          <template v-else-if="item.reactionType == '😓'">😓</template>
          <template v-else-if="item.reactionType == '🙂'">🙂</template>
          <template v-else-if="item.reactionType == '😎'">😎</template>
          <template v-else-if="item.reactionType == '🥰'">🥰</template>
          <template v-else-if="item.reactionType == '👻'">👻</template>
          <template v-else-if="item.reactionType == '💯'">💯</template>
          <template v-else-if="item.reactionType == '💦'">💦</template>
          <template v-else-if="item.reactionType == '🐶'">🐶</template>
          <template v-else-if="item.reactionType == '🎉'">🎉</template>
          <template v-else>{{ item.reactionType }}</template>
        </span>
        <span @click="$emit('fetch', msg, item)">
          {{ renderUserIDs(item) }}
        </span>
      </el-tag>
    </template>
  </div>
</template>

<style lang="scss">
.emoji > .el-tag {
  cursor: pointer;
}
</style>
