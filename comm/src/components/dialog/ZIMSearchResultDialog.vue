<script setup lang="ts">
import { ChatDotSquare } from '@element-plus/icons-vue';
import { computed } from 'vue';
import useStore, { IMessage, ZIM } from '../../store';
import { formatTime } from '../../utils';

const zimStore = useStore();
const locale = computed(() => zimStore.locale);
const { self, userMap } = zimStore;

// type: conversation | message | reply | group | member | friend
const props = defineProps(['visible', 'regkey', 'type', 'list']);

const getUsername = (id: string) => userMap[id]?.userName || id;

const formatMsg = (msg: IMessage) => {
  let text =
    msg.type == ZIM.MessageType.Custom
      ? msg.searchedContent
      : msg.type == ZIM.MessageType.Combine
      ? msg.title + '</br>' + msg.summary.replace(/\n/g, '</br>')
      : msg.message || msg.fileName;

  // high light search key
  if (props.regkey && text) {
    text = text.replace(props.regkey, '<span class="highlight">$&</span>');
  }

  if (msg.type == ZIM.MessageType.Multiple) {
    text = msg.messageInfoList
      .map((v) => {
        let str = v.type == ZIM.MessageType.Custom ? v.searchedContent : v.message || v.fileName;
        // high light search key
        if (props.regkey && str) {
          str = str.replace(props.regkey, '<span class="highlight">$&</span>');
        }

        return v.type == ZIM.MessageType.Text ? str : `[${locale.value.cpt.chat.msgmap[v.type]}]: ${str}`;
      })
      .join('</br>');
  }

  // show @ info
  if (msg.type == ZIM.MessageType.Text || msg.type == ZIM.MessageType.Multiple) {
    if (msg.isMentionAll) {
      text = text.replace(/\[(@)\]/g, `<span class="atmsg"> $1${locale.value.cpt.chat.atAll.substring(1)} </span>`);
    }
    if (msg.mentionedUserIDs && msg.mentionedUserIDs.length) {
      const myid = self.userID;
      msg.mentionedUserIDs.forEach((id) => {
        const clz = id == myid ? 'atmsg atmsg_me' : 'atmsg';
        text = text.replaceAll(`[@${id}]`, `<span class="${clz}"> @${getUsername(id)} </span>`);
      });
    }
    if (msg.type == ZIM.MessageType.Multiple) text = '</br>' + text;
  } else if (msg.type == ZIM.MessageType.Revoke) {
    text = locale.value.cpt.chat.revokeMsg;
  }

  return msg.type == ZIM.MessageType.Text ? text : `[${locale.value.cpt.chat.msgmap[msg.type]}]: ${text}`;
};

const formatTitle = () => {
  return props.type && props.list ? `${locale.value.dl.searchResult[props.type]} (${props.list.length})` : '';
};

const showReplyMsgSeq = (msg: IMessage) => {
  const me = msg.senderUserID == self.userID ? ' Me' : '';
  // Don't display sequence numbers in UI - they're for internal debugging only
  return me ? ` (${me})` : '';
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    :center="true"
    :title="formatTitle()"
    width="50%"
    top="50px"
    @close="$emit('close')"
  >
    <ul v-if="type == 'conversation'" class="scroll-dialog scroll-dialog_column">
      <li v-for="item in list" :key="item.conversationType + item.conversationID">
        <div class="flex">
          <span>
            {{ item.conversationType == 2 ? locale.dl.searchResult.convGroup : locale.dl.searchResult.convPeer }}
            {{ item.conversationID }}
          </span>
          <span>{{ item.totalMessageCount }}</span>
        </div>
        <div v-for="msg in item.messageList" :key="msg.localMessageID">
          <div class="flex">
            <span>{{ getUsername(msg.senderUserID) }}</span>
            <span>{{ formatTime(msg.timestamp) }}</span>
          </div>
          <div v-html="formatMsg(msg)"></div>
        </div>
      </li>
    </ul>
    <ul v-else-if="type == 'message' || type == 'reply'" class="scroll-dialog scroll-dialog_column">
      <li v-for="item in list" :key="item.localMessageID">
        <div class="flex">
          <span v-if="type == 'message'">
            {{ item.conversationType == 2 ? locale.dl.searchResult.convGroup : locale.dl.searchResult.convPeer }}
            {{ item.conversationID }}
          </span>
          <span>
            {{ getUsername(item.senderUserID) }}
            {{ type == 'reply' ? showReplyMsgSeq(item) : '' }}</span
          >
          <span>{{ formatTime(item.timestamp || item.sentTime) }}</span>
        </div>
        <span v-if="type == 'reply' && !item.messageID">{{ locale.cpt.chat.delreply }}</span>
        <div v-else v-html="formatMsg(item)"></div>
        <div v-if="type == 'reply' && item.repliedCount" class="msg-reply">
          <el-icon><ChatDotSquare /></el-icon>
          <span>{{ item.repliedCount }} {{ locale.cpt.chat.reply }}</span>
        </div>
      </li>
    </ul>
    <ul v-else-if="type == 'group'" class="scroll-dialog scroll-dialog_column">
      <li v-for="item in list" :key="item.groupInfo.groupID">
        <div class="flex">
          <span>{{ item.groupInfo.groupName || item.groupInfo.groupID }}</span>
          <span>{{ item.userList.length }}</span>
        </div>
        <div>
          <el-tag v-for="user in item.userList" :key="user.userID">
            {{ user.userName || user.memberNickname }}
          </el-tag>
        </div>
      </li>
    </ul>
    <div v-else-if="type == 'member'" class="scroll-dialog">
      <el-tag v-for="item in list" :key="item.userID">
        {{ item.userName || item.memberNickname }}
      </el-tag>
    </div>
    <div v-else-if="type == 'friend'" class="scroll-dialog">
      <el-tag v-for="item in list" :key="item.userID">
        {{ item.userName || item.friendAlias }}
      </el-tag>
    </div>
  </el-dialog>
</template>
