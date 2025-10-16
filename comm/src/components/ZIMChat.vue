<script setup lang="ts">
import {
  Back,
  ChatDotSquare,
  CircleCheck,
  CloseBold,
  Delete,
  Document,
  Expand,
  Flag,
  Headset,
  Microphone,
  MoreFilled,
  Picture,
  QuestionFilled,
  Right,
  Scissor,
  Search,
  Share,
  Star,
  VideoCamera,
  Warning
} from '@element-plus/icons-vue';
import { Delta, QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.core.css';
import { ElMessage, ElScrollbar } from 'element-plus';
import html2canvas from 'html2canvas';
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import useStore, { IMessage, SDKVersion, ZIM, ZIMMessage, ZIMMessageRepliedInfo, zim } from '../store';
import { avatarPrefix, formatTime, getTipsMsg, normalizeDisplayName } from '../utils';
import ZIMSearchBookDialog from './dialog/ZIMSearchBookDialog.vue';
import ZIMSearchMsgDialog from './dialog/ZIMSearchMsgDialog.vue';
import ZIMSearchResultDialog from './dialog/ZIMSearchResultDialog.vue';
import ZIMEmojiBody from './fragment/ZIMEmojiBody.vue';
import ZIMEmojiTag from './fragment/ZIMEmojiTag.vue';
import ZIMMember from './fragment/ZIMMember.vue';
import ZIMReactionInfo from './fragment/ZIMReactionInfo.vue';
import WaitingBanner from './WaitingBanner.vue';
import { vSafeHtml } from '../directives/safeHtml';

defineOptions({ 
  directives: { 
    safeHtml: vSafeHtml 
  } 
});

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

const props = defineProps<{
  id: string;
  type: number;
  name: string;
}>();
const cssType = (clz: string, clz2?: string) => `${clz2 || ''} ${clz} ${clz}${props.type ? 1 : 0}`;
const msgItemClz = (msg: ZIMMessage) => {
  let str = msg.direction ? 'item l' : 'item r';
  if (msgSendConf.isEditMsg && _msgitem.value.messageID == msg.messageID) str += ' active';
  return str;
};

const innerRef = ref<HTMLDivElement>();
const scrollbarRef = ref<InstanceType<typeof ElScrollbar>>();
const quillEditorRef = ref<InstanceType<typeof QuillEditor>>();

const zimStore = useStore();
const locale = computed(() => zimStore.locale);
const userMap = computed(() => zimStore.userMap);
const msgReceiptMap = computed(() => zimStore.msgReceiptMap);
const convList = computed(() => zimStore.convList);
const roomList = computed(() => zimStore.roomList);
const selectConvList = ref([] as string[]);
const combineChatRef = ref({ map: [] as any[], show: false, index: 0 });
const { self, convInfo, msgList, memberList } = zimStore;

// Conversation status and member tracking
const conversationStatus = ref<string>('ready');
const memberCount = ref<number>(0);

const loading = ref(false);
const msgTipsTime = ref({ tips: 0, expire: Date.now() });
const supportedMsgNote = ref(locale.value.cpt.chat.receipt);
const receiptMsg = ref(false);
const byteMsg = ref(false);
const userMapTick = ref(0);
let lastConvId = '';
const msgSendConf = {
  isEditMsg: false,
};

const nolabel = '';
const selectMsg = ref(false);
const forwardVisible = ref(false);

const msgMenuShow = ref(false);
const msgMenuEmojiType = ref(0);
const msgMenuOptions = reactive({
  iconFontClass: 'iconfont',
  customClass: 'class-a',
  zIndex: 100,
  minWidth: 160,
  x: 0,
  y: 0,
});

const msgAtShow = ref(false);
const msgReplyShow = ref(false);

// Conversation rename functionality
const showRenameDialog = ref(false);
const renameForm = reactive({
  name: '',
  originalName: ''
});

// Pet context state for message formatting
const petContext = ref<{
  petId: string | null;
  petName: string | null;
  petInfo: any | null;
  loading: boolean;
  error: string | null;
}>({
  petId: null,
  petName: null,
  petInfo: null,
  loading: false,
  error: null
});

// Load pet context on component mount
onMounted(async () => {
  // Listen for userMap updates to re-render names
  window.addEventListener('userMapUpdated', handleUserMapUpdate);
});

onUnmounted(() => {
  // Clean up event listener
  window.removeEventListener('userMapUpdated', handleUserMapUpdate);
});

const handleUserMapUpdate = () => {
  console.log('📡 UserMap updated, re-rendering names');
  // bump tick to force computed re-eval
  userMapTick.value++;
};

const receiptMemberInfo = reactive({
  show: false,
  readCount: 0,
  unreadCount: 0,
  readList: [] as any[],
  unreadList: [] as any[],
});

const qloption = ref({
  theme: '',
  modules: { toolbar: [] },
  placeholder: locale.value.cpt.chat.newline,
  scrollingContainer: '.qlcontainer',
});
const qlcontent = ref<Delta>(new Delta([{ insert: convInfo.draft || '' }]));
const qltempmap = new Map<string, any>();

const isOwner = computed(() => {
  const id = zimStore.self.userID;
  return zimStore.memberList.some((item: any) => item.userID == id && item.memberRole == 1);
});

const getUsername = (id: string) => {
  void userMapTick.value; // depend on tick
  const user = userMap.value[id];
  
  // Standardized fallback hierarchy: profile.displayName → profile.fullName → username → email
  if (user) {
    // Check for displayName first (highest priority)
    if (user.displayName) {
      return normalizeDisplayName(user.displayName);
    }
    
    // Check for fullName (firstName + lastName)
    if (user.firstName && user.lastName) {
      return normalizeDisplayName(`${user.firstName} ${user.lastName}`.trim());
    }
    
    // Check for firstName only
    if (user.firstName) {
      return normalizeDisplayName(user.firstName);
    }
    
    // Check for username
    if (user.userName) {
      return normalizeDisplayName(user.userName);
    }
    
    // Check for email (last resort from user data)
    if (user.email) {
      return normalizeDisplayName(user.email);
    }
  }
  
  // Clean fallback: remove sequence numbers and debug info from user ID
  return normalizeDisplayName(id);
};
const getAvatar = (id: string) => {
  const u = userMap.value[id];
  const url =
    u?.userAvatarUrl || // standard I use
    u?.userAvatar || // login data passed in
    u?.avatar || // from backend users/shelters
    u?.photo || '';
  return url ? getCustomImg(url) : undefined;
};
const isSafeUrl = (url: string) => !/^javascript:/i.test(url);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getCustomImg = (url: string) => {
  if (!url) return '';
  const full = url.startsWith('http') ? url : avatarPrefix + url;
  return isSafeUrl(full) ? full : '';
};

// Function to get group avatar with proper URL handling
const getGroupAvatar = (avatarUrl: any) => {
  if (!avatarUrl) return '';
  
  // Convert to string if it's a number or other type
  const urlString = String(avatarUrl);
  
  // If it's already a full URL, check if it's safe
  if (urlString.startsWith('http')) {
    return isSafeUrl(urlString) ? urlString : '';
  }
  
  // For numeric IDs from ZIM, we need to use ZIM's built-in methods
  // For now, return empty string to show default avatar
  if (!isNaN(Number(urlString))) {
    return ''; // This will show the default 'G' avatar
  }
  
  // If it's a relative path, add the avatar prefix and check safety
  const full = avatarPrefix + urlString;
  return isSafeUrl(full) ? full : '';
};

const fileFilterMap = {
  11: 'image/*,.heic',
  13: 'audio/*',
  14: 'video/*',
};

const sendMsg = (fileMsgObj?: any) => {
  if (fileMsgObj && !fileMsgObj.fileLocalPath) fileMsgObj = null;

  let appendText = '';
  const contents: Array<string | { image: string }> = [];
  qlcontent.value.ops.forEach((v, i) => {
    if (!v.insert) return;
    if (typeof v.insert == 'object') {
      const urlobj = qltempmap.get((v.insert as any).image);
      if (typeof urlobj == 'string' && urlobj.startsWith('[@')) {
        appendText += urlobj;
      } else {
        appendText && contents.push(appendText);
        contents.push(v.insert as { image: string });
        appendText = '';
      }
    } else {
      const str = v.insert.replaceAll('\n', '');
      if (str) appendText += str;
    }
  });
  if (appendText) contents.push(appendText);

  // Block sending empty / all-space messages
  const onlyWhitespace = contents.length === 1 && typeof contents[0] === 'string' && !contents[0].trim();
  if (!fileMsgObj && (!contents.length || onlyWhitespace)) {
    initEditEnv(); // clear editor/draft if desired
    return;
  }

  // Eidt msg
  if (msgSendConf.isEditMsg) {
    let editText = '';

    const msgObj = JSON.parse(JSON.stringify(_msgitem.value));
    if (msgObj.type == ZIM.MessageType.Text) {
      msgObj.message = appendText;
      editText = appendText;
    } else if (msgObj.type == ZIM.MessageType.Multiple) {
      // Append file
      if (fileMsgObj) {
        const url = createCanvasFileImg(fileMsgObj.fileLocalPath.name);
        qlcontent.value.ops.push({ insert: { image: url } });
        qlcontent.value.ops.push({ insert: '\n' });
        quillEditorRef.value?.setContents(qlcontent.value);
        qltempmap.set(url, fileMsgObj);
        return;
      }

      let fileIndex = 0;
      const liteInfos: any[] = [];
      contents.forEach((v) => {
        if (typeof v == 'object') {
          fileIndex++;
          const lite = qltempmap.get(v.image) || {
            type: ZIM.MessageType.Image,
            fileLocalPath: dataURLtoFile(v.image, fileIndex + '_screenshot.png'),
          };
          liteInfos.push(lite);
        } else {
          liteInfos.push({ type: ZIM.MessageType.Text, message: v });
          editText += v;
        }
      });

      if (fileIndex) {
        msgObj.messageInfoList = liteInfos;
        loading.value = true;
      } else {
        msgObj.messageInfoList = [{ type: ZIM.MessageType.Text, message: appendText }];
        editText = appendText;
      }
    }
    msgObj.isMentionAll = editText.includes('[@]');
    msgObj.mentionedUserIDs = getAtIDs(editText);

    const originalMsg = _msgitem.value as ZIMMessage;
    loading.value = true;

    zim.revokeMessage(originalMsg)
      .then(() => {
        // optional: flag "edited" for easy client debugging
        // msgObj.localExtendedData = 'edited';
        return zimStore.sendMessage(msgObj);
      })
      .catch((err: any) => {
        // If revoke expires or error, fallback: send new message + notify user
        console.error('revoke failed, send new instead:', err);
        ElMessage.warning('Unable to revoke old message (may have expired). Sending new message.');
        return zimStore.sendMessage(msgObj);
      })
      .finally(() => {
        loading.value = false;
      });

    initEditEnv();
    return;
  }

  const msgBody = contents[0];
  const replyMsg = msgReplyShow.value && _msgitem.value;

  if (typeof msgBody == 'string' && msgBody.startsWith('http') && contents.length == 1) {
    // Network image
    const msgObj = { type: ZIM.MessageType.Image, fileDownloadUrl: msgBody };
    zimStore.sendMessage(msgObj, replyMsg, receiptMsg.value);
    scrollToBottom();
  } else if (typeof msgBody == 'object' && contents.length == 1) {
    // Screenshot
    const msgObj = { type: ZIM.MessageType.Image, fileLocalPath: dataURLtoFile(msgBody.image, 'screenshot.png') };
    loading.value = true;
    zimStore.sendMessage(msgObj, replyMsg, receiptMsg.value).finally(() => (loading.value = false));
    scrollToBottom();
  } else if (fileMsgObj) {
    if (!msgBody) {
      // Select media file
      loading.value = true;
      zimStore.sendMessage(fileMsgObj, replyMsg, receiptMsg.value).finally(() => (loading.value = false));
      scrollToBottom();
    } else {
      // Append file for multiple msg
      const url = createCanvasFileImg(fileMsgObj.fileLocalPath.name);
      qlcontent.value.ops.push({ insert: { image: url } });
      qlcontent.value.ops.push({ insert: '\n' });
      quillEditorRef.value?.setContents(qlcontent.value);
      qltempmap.set(url, fileMsgObj);
      return;
    }
  } else if (msgBody) {
    let editText = '';
    let fileIndex = 0;
    const liteInfos: any[] = [];
    contents.forEach((v) => {
      if (typeof v == 'object') {
        fileIndex++;
        const lite = qltempmap.get(v.image) || {
          type: ZIM.MessageType.Image,
          fileLocalPath: dataURLtoFile(v.image, fileIndex + '_screenshot.png'),
        };
        liteInfos.push(lite);
      } else {
        liteInfos.push({ type: ZIM.MessageType.Text, message: v });
        editText += v;
      }
    });

    const msgObj: any = {};
    if (fileIndex) {
      msgObj.type = ZIM.MessageType.Multiple;
      msgObj.messageInfoList = liteInfos;
      loading.value = true;
    } else {
      msgObj.message = appendText;
      editText = appendText;
    }
    msgObj.isMentionAll = editText.includes('[@]');
    msgObj.mentionedUserIDs = getAtIDs(editText);
    zimStore.sendMessage(msgObj, replyMsg, receiptMsg.value, byteMsg.value).finally(() => (loading.value = false));
    scrollToBottom();
  }

  initEditEnv();
};

const retrySendMsg = (msg: ZIMMessage) => {
  zimStore.sendMessage(msg);
  scrollToBottom();
};

const selectMediaFile = (
  type: ZIM.MessageType.Image | ZIM.MessageType.File | ZIM.MessageType.Audio | ZIM.MessageType.Video,
) => {
  let input = document.createElement('input') as any;
  input.type = 'file';
  if (type != ZIM.MessageType.File) input.accept = fileFilterMap[type];
  input.onchange = function () {
    const file = this.files[0];
    if (!file) return;
    
    // File size limit guard (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      ElMessage.error('File too large (max 50MB).');
      return;
    }
    
    const msgObj = { type, fileLocalPath: file } as any;
    if (type == ZIM.MessageType.Audio) msgObj.audioDuration = 5;
    if (type == ZIM.MessageType.Video) msgObj.videoDuration = 5;
    sendMsg(msgObj);
    input = null;
  };
  input.click();
};

// Unified file upload function
const openFileUpload = () => {
  let input = document.createElement('input') as any;
  input.type = 'file';
  // Accept all common file types: images, videos, audio, documents (excluding dangerous types)
  input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip';
  input.value = ''; // Reset to allow reselecting the same file
  input.onchange = function () {
    const file = this.files[0];
    if (!file) return;
    
    // File size limit guard (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      ElMessage.error('File too large (max 50MB).');
      return;
    }
    
    // Determine file type based on MIME type
    let type: ZIM.MessageType;
    let msgObj: any = { fileLocalPath: file };
    
    if (file.type.startsWith('image/')) {
      type = ZIM.MessageType.Image;
    } else if (file.type.startsWith('video/')) {
      type = ZIM.MessageType.Video;
      msgObj.videoDuration = 5;
    } else if (file.type.startsWith('audio/')) {
      type = ZIM.MessageType.Audio;
      msgObj.audioDuration = 5;
    } else {
      type = ZIM.MessageType.File;
    }
    
    msgObj.type = type;
    sendMsg(msgObj);
    input = null;
  };
  input.click();
};

const recordMediaFile = () => {
  if (!navigator.mediaDevices) return ElMessage.error('No support media devices.');

  var startTime = new Date();
  var chunks: Blob[] = [];

  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    var duration = 10;
    var mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.onstop = function () {
      var msgObj = {
        fileLocalPath: new File(chunks, `${startTime.toLocaleString()}.mp3`),
        type: 13,
        audioDuration: duration,
      };

      const replyMsg = msgReplyShow.value && _msgitem.value;
      zimStore.sendMessage(msgObj, replyMsg, receiptMsg.value).finally(() => (loading.value = false));
      scrollToBottom();

      msgReplyShow.value = false;
      chunks = [];
    };

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };

    loading.value = true;
    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), duration * 1000);
  }).catch((error) => {
    console.error('Microphone permission denied:', error);
    ElMessage.error('Microphone permission denied. Please allow microphone access to record audio.');
  });
};

const sendCustomMessage = (subType: number) => {
  const msgObj = { type: 200, subType, message: '', searchedContent: '' };

  if (subType == 1) {
    msgObj.message = JSON.stringify({
      avatar: 'card.jpeg',
      name: zimStore.self.userName || zimStore.self.userID,
    });
    msgObj.searchedContent = `${zimStore.self.userID} ${locale.value.cpt.chat.dcard}`;
  } else if (subType == 2) {
    msgObj.message = JSON.stringify({
      icon: 'cxk.jpeg',
      title: locale.value.cpt.chat.voteTitle,
      keys: ['Yes', 'No'],
    });
    msgObj.searchedContent = locale.value.cpt.chat.voteContent;
  } else if (subType == 3) {
    msgObj.message = JSON.stringify({
      icon: 'cxk.jpeg',
      title: locale.value.cpt.chat.questionTitle,
      keys: [
        { title: locale.value.cpt.chat.questionTitle1, type: 1, keys: locale.value.cpt.chat.questionKeys },
        { title: locale.value.cpt.chat.questionTitle2, type: 0, keys: ['A', 'B', 'O', 'AB'] },
      ],
    });
    msgObj.searchedContent = `${zimStore.self.userID} ${locale.value.cpt.chat.questionContent}`;
  }

  const replyMsg = msgReplyShow.value && _msgitem.value;
  zimStore.sendMessage(msgObj, replyMsg, receiptMsg.value);
  scrollToBottom();
  msgReplyShow.value = false;
};

const clearUnread = () => {
  zim.clearConversationUnreadMessageCount(convInfo.conversationID, convInfo.type);
};

const deleteAllMessage = () => {
  zim.deleteAllMessage(convInfo.conversationID, convInfo.type, { isAlsoDeleteServerMessage: true }).then(() => {
    msgList.length = 0;
  });
};

const sendConversationReceiptRead = () => {
  zim.sendConversationMessageReceiptRead(convInfo.conversationID, convInfo.type).then(() => {
    const id = msgList[msgList.length - 1]?.msg.messageID;
    if (id) zimStore.convInfo.receiptMsgID = id;
  });
};

const leaveGroup = () => zim.leaveGroup(convInfo.conversationID);
const dismissGroup = () => zim.dismissGroup(convInfo.conversationID);
const leaveRoom = () => zim.leaveRoom(convInfo.conversationID);

const msgDialogState = ref(false);
const onMsgDialogClose = (ev?: any) => {
  msgDialogState.value = false;
  if (!ev) return;

  const config: any = {
    keywords: ev.keywords ? ev.keywords.split(' ').filter((v: any) => !!v) : null,
    senderUserIDs: ev.senderUserIDs ? ev.senderUserIDs.split(',') : null,
    subMessageTypes: ev.subMessageTypes ? ev.subMessageTypes.split(',').map((v: any) => +v) : null,
    messageTypes: Array.from(ev.messageTypes),
    startTime: ev.startTime,
    endTime: ev.endTime,
    count: 100,
    order: 0,
  };
  zim.searchLocalMessages(props.id, +props.type, config).then((res: any) => {
    console.log('===search', res);
    searchResult.value.regkey = config.keywords ? new RegExp(config.keywords.map(escapeRe).join('|'), 'g') : null;
    searchResult.value.message = res.messageList;
    searchResult.value.type = 'message';
    searchResult.value.show = true;
  });
};
const bookDialogState = ref(false);
const onBookDialogClose = (ev?: any) => {
  bookDialogState.value = false;
  if (!ev || !ev.keywords) return;

  const config: any = {
    keywords: ev.keywords.split(' ').filter((v: any) => !!v),
    isAlsoMatchGroupMemberNickname: !!ev.matchNickname,
    count: 100,
  };
  zim.searchLocalGroupMembers(props.id, config).then((res: any) => {
    console.log('===search', res);
    searchResult.value.member = res.userList;
    searchResult.value.type = 'member';
    searchResult.value.show = true;
  });
};
const searchResult = ref({
  show: false,
  type: '' as 'message' | 'reply' | 'member',
  regkey: null as any,
  message: [] as any[],
  reply: [] as any,
  member: [] as any[],
});

const isReceiptMsgColor = (msg: ZIMMessage) => {
  return (
    convInfo.receiptMsgID == msg.messageID ||
    (convInfo.type != 1 && msg.direction == ZIM.MessageDirection.Receive && msg.receiptStatus)
  );
};
const receiptMsgColor = (msg: ZIMMessage) => {
  return convInfo.receiptMsgID == msg.messageID
    ? '#f56c6c' // red
    : msg.receiptStatus == ZIM.MessageReceiptStatus.Processing
    ? '#909399' // gray
    : msg.receiptStatus == ZIM.MessageReceiptStatus.Done
    ? '#67c23a' // green
    : '#e6a23c'; // yellow
};
const ackMessageReceipt = (msg: ZIMMessage) => {
  // if (msg.receiptStatus != ZIM.MessageReceiptStatus.Processing) return;
  zim.sendMessageReceiptsRead([msg], msg.conversationID, msg.conversationType).then(() => {
    (msg as any).receiptStatus = ZIM.MessageReceiptStatus.Done;
  });
};

const queryMessageReceipt = (msg: ZIMMessage) => {
  if (msg.conversationType == 2) {
    const info = msgReceiptMap.value[msg.messageID || ''];

    receiptMemberInfo.readList.length = 0;
    receiptMemberInfo.unreadList.length = 0;

    const config1 = { count: 100, nextFlag: 0 };
    const config2 = { count: 100, nextFlag: 0 };

    const fetchReadPage = (): Promise<void> => {
      return zim.queryGroupMessageReceiptReadMemberList(msg, msg.conversationID, config1).then((res: any) => {
        receiptMemberInfo.readList.push(...res.userList);
        receiptMemberInfo.readCount = info?.readMemberCount || receiptMemberInfo.readList.length;
        if (res.nextFlag) {
          config1.nextFlag = res.nextFlag;
          return fetchReadPage();
        }
      });
    };

    const fetchUnreadPage = (): Promise<void> => {
      return zim.queryGroupMessageReceiptUnreadMemberList(msg, msg.conversationID, config2).then((res: any) => {
        receiptMemberInfo.unreadList.push(...res.userList);
        receiptMemberInfo.unreadCount = info?.unreadMemberCount || receiptMemberInfo.unreadList.length;
        if (res.nextFlag) {
          config2.nextFlag = res.nextFlag;
          return fetchUnreadPage();
        }
      });
    };

    fetchReadPage()
      .then(fetchUnreadPage)
      .then(() => {
        receiptMemberInfo.show = true;
        (msg as any).receiptInfo = {
          readCount: receiptMemberInfo.readCount,
          unreadCount: receiptMemberInfo.unreadCount,
        };
      });
  }
};

const receiptMsgChange = (value: any) => {
  if (value) {
    byteMsg.value = false;
  }
};

const byteMsgChange = (value: any) => {
  if (value) {
    receiptMsg.value = false;
  }
};

const _msgitem = ref(null as any);
const onContextMenu = (e: any, msgitem: any) => {
  if (!msgitem.msg.messageSeq || !msgitem.ext) return;

  msgMenuOptions.x = e.x;
  msgMenuOptions.y = e.y;
  msgMenuShow.value = true;
  msgMenuEmojiType.value = 0;
  _msgitem.value = msgitem.msg;
};

const disableSelectMsg = (msg: ZIMMessage) =>
  msg.sentStatus != ZIM.MessageSentStatus.Success ||
  msg.type == ZIM.MessageType.Command ||
  msg.type == ZIM.MessageType.Barrage;
const unselectMsg = () => {
  selectMsg.value = false;
  msgList.forEach((item: any) => {
    if (item.ext) item.ext._checked = 0;
  });
};
const editMessage = () => {
  const msg: IMessage = _msgitem.value;
  if (
    !msg ||
    msg.direction != ZIM.MessageDirection.Send ||
    (msg.type != ZIM.MessageType.Text && msg.type != ZIM.MessageType.Multiple)
  )
    return;

  msgSendConf.isEditMsg = true;
  const isAt = msg.isMentionAll || !!msg.mentionedUserIDs?.length;

  if (msg.type == ZIM.MessageType.Text) {
    splitAtText(msg.message, isAt);
    quillEditorRef.value?.setContents(qlcontent.value);
  } else if (msg.type == ZIM.MessageType.Multiple) {
    msg.messageInfoList.forEach((info, i) => {
      if (info.type >= ZIM.MessageType.Image && info.type <= ZIM.MessageType.Video) {
        const url = createCanvasFileImg(info.fileName || i + '_url');
        qlcontent.value.ops.push({ insert: { image: url } });
        qlcontent.value.ops.push({ insert: '\n' });
        qltempmap.set(url, { ...info });
      } else {
        splitAtText(info.message, isAt);
      }
    });
    quillEditorRef.value?.setContents(qlcontent.value);
  }
};
const revokeMessage = () => _msgitem.value && zim.revokeMessage(_msgitem.value);
const showReplyMsg = (msg: any) => {
  let root: any;
  const list: any[] = [];
  const config = { count: 100, nextFlag: 0 };
  const fetchPage = (): Promise<void> => {
    return zim.queryMessageRepliedList(msg, config).then((res: any) => {
      if (!root) {
        root = res.rootRepliedInfo;
        Object.assign(root, root.message);
      }
      list.push(...res.messageList);
      config.nextFlag = res.nextFlag;
      if (res.nextFlag) return fetchPage();
    });
  };

  fetchPage().then(() => {
    list.unshift(root);
    searchResult.value.reply = list;
    searchResult.value.type = 'reply';
    searchResult.value.show = true;
    console.log('replyList', list);
  });
};

const forwardMsgs = (isCombine: boolean) => {
  const replyMsg = msgReplyShow.value && _msgitem.value;
  zim.forwardMessages(selectConvList.value, isCombine, replyMsg);
  msgReplyShow.value = false;
  forwardVisible.value = false;
  selectConvList.value = [];
  unselectMsg();
};
const batchHandleMsg = (fn: 'forwardMsgs' | 'deleteMsgs') => {
  if (fn == 'forwardMsgs') {
    forwardVisible.value = true;
  } else {
    zim[fn]();
    unselectMsg();
  }
};

const handleEmoji = (key: any) => {
  const type = msgMenuEmojiType.value;

  if (type == 1) {
    // Reaction
    msgMenuEmojiType.value = 0;
    if (!_msgitem.value) return;

    const reactions: Array<any> = _msgitem.value.reactions || [];
    const reaction = reactions.find((reaction) => reaction.reactionType == key && reaction.isSelfIncluded);
    if (reaction) {
      zim.deleteMessageReaction(key, _msgitem.value).then((res: any) => {
        const index = reactions.findIndex((reaction) => reaction.reactionType == res.reaction.reactionType);
        if (index !== -1) {
          if (res.reaction.totalCount == 0) {
            reactions.splice(index, 1);
          } else {
            reactions.splice(index, 1, res.reaction);
          }
        }
        (_msgitem.value as any).reactions = reactions;
      });
    } else {
      zim.addMessageReaction(key, _msgitem.value).then((res: any) => {
        const index = reactions.findIndex((reaction) => reaction.reactionType == res.reaction.reactionType);
        if (index !== -1) {
          reactions.splice(index, 1, res.reaction);
        } else {
          reactions.push(res.reaction);
        }
        (_msgitem.value as any).reactions = reactions;
      });
    }
  } else if (type == 2) {
    // Add emoji text
    const str = qlcontent.value.ops[0]?.insert;
    if (typeof str == 'string') {
      qlcontent.value.ops[0] = { insert: str.replaceAll('\n', '') + key };
    } else {
      qlcontent.value.ops.push({ insert: key });
    }
    quillEditorRef.value?.setContents(qlcontent.value);
  }
};
const deleteEmoji = (msg: ZIMMessage, reaction: any) => {
  if (!reaction.isSelfIncluded) return;
  zim.deleteMessageReaction(reaction.reactionType, msg).then((res: any) => {
    const index = (msg as any).reactions.findIndex((item: any) => item.reactionType == res.reaction.reactionType);
    if (index !== -1) {
      if (res.reaction.totalCount == 0) {
        (msg as any).reactions.splice(index, 1);
      } else {
        (msg as any).reactions.splice(index, 1, res.reaction);
      }
    }
  });
};

const reactionUserInfo = reactive({
  show: false,
  msg: null as any,
  type: '',
  reactions: [] as any[],
  userMap: {} as Record<string, any[]>,
});
const msgBizReg = /vote|quest/;
const showReactionUsers = (msg: ZIMMessage, reaction: any) => {
  reactionUserInfo.msg = msg;
  reactionUserInfo.type = reaction.reactionType;
  reactionUserInfo.reactions = (msg as any).reactions.filter((item: any) => !msgBizReg.test(item.reactionType));
  reactionUserInfo.userMap[reaction.reactionType] = reaction.userList;
  reactionUserInfo.show = true;
};
const queryReactionUsers = (type: string) => {
  zim
    .queryMessageReactionUserList(reactionUserInfo.msg, {
      reactionType: type,
      count: 100,
      nextFlag: 0,
    })
    .then((res: any) => {
      reactionUserInfo.type = type;
      reactionUserInfo.userMap[type] = res.userList;
    });
};

const submitCustomMsgVote = (key: string, msg: ZIMMessage) => {
  if (key) {
    zim.addMessageReaction(key, msg).then((res: any) => {
      if ((msg as any).reactions) (msg as any).reactions.push(res.reaction);
      else (msg as any).reactions = [res.reaction];
    });
  }
};
const submitCustomMsgQuest = (keys: any, msg: ZIMMessage) => {
  const _keys = [];
  if (keys[0]) _keys.push(...keys[0]);
  if (keys[1]) _keys.push(keys[1]);
  const cb = (res: any) => {
    if ((msg as any).reactions) (msg as any).reactions.push(res.reaction);
    else (msg as any).reactions = [res.reaction];
  };
  _keys.forEach((key) => zim.addMessageReaction(key, msg).then(cb));
};

const caclMsgTipsTime = () => {
  msgTipsTime.value.expire = Date.now();
  msgTipsTime.value.tips = msgList[0] ? msgList[0].msg.timestamp || 0 : 0;
  msgList.forEach((item) => {
    if (
      item.msg.type != ZIM.MessageType.Revoke &&
      item.msg.type != ZIM.MessageType.Tips &&
      item.msg.timestamp &&
      item.msg.timestamp - msgTipsTime.value.tips > 5 * 60 * 1000
    ) {
      msgTipsTime.value.tips = item.msg.timestamp;
      if (item.ext && item.ext._time !== false) {
        item.ext._time = '---' + formatTime(item.msg.timestamp) + '---';
      }
    }
  });
};
const showMsgExpiredTime = (msgitem: any) => {
  const seq = msgitem.msg.messageSeq;
  const time = msgitem.msg.timestamp;
  if (msgTipsTime.value.expire - time > 7 * 24 * 3600 * 1000) {
    if (msgitem.ext) msgitem.ext._time = false;
    return `(${formatTime(time)})`;
  }
  // Don't display sequence numbers in UI - they're for internal debugging only
  return '';
};
const getRevokeMsg = (msg: IMessage) => {
  return msg.revokeStatus == ZIM.MessageRevokeStatus.SelfRevoke
    ? locale.value.cpt.chat.revokeMsg
    : `${(msg as any).operatedUserID} ${locale.value.cpt.chat.revokeMsg}, ${msg.revokeExtendedData}`;
};

const isMessageReceiptDone = (msg: ZIMMessage) => {
  return (
    convInfo.type == 0 ||
    msg.receiptStatus == ZIM.MessageReceiptStatus.Done ||
    msgReceiptMap.value[msg.messageID || '']?.status == ZIM.MessageReceiptStatus.Done
  );
};

const getMessageReceiptProcessingReadCount = (msg: ZIMMessage) => {
  const count = msgReceiptMap.value[msg.messageID || '']?.readMemberCount;
  return count || 0;
};

const filetoURL = (msg: any) => {
  return msg.thumbnailDownloadUrl || msg.fileDownloadUrl || URL.createObjectURL(msg.fileLocalPath as any);
};
const openWindow = (url: string) => window.open(url, '_blank');
const dataURLtoFile = (dataurl: string, filename: string) => {
  var arr = dataurl.split(','),
    mime = arr[0].match(/:(.*?);/)![1],
    bstr = atob(arr[arr.length - 1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};
const createCanvasFileImg = (fileName: string) => {
  canvas.width = fileName.length * 18;
  canvas.height = 36;
  ctx.font = '18px Arial';
  ctx.fillStyle = 'blue';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(fileName, canvas.width / 2, canvas.height / 2);
  ctx.strokeStyle = 'black';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(canvas.width, 0);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.lineTo(0, 0);
  ctx.stroke();
  return canvas.toDataURL('image/png');
};
const createCanvasAtImg = (id: string) => {
  const atText = `@${id ? getUsername(id) : locale.value.cpt.chat.atAll.substring(1)}`;
  ctx.font = '13px Arial'; // set font BEFORE measure
  const metrics = ctx.measureText(atText);
  canvas.width = Math.ceil(metrics.width) + 13;
  canvas.height = 15;
  ctx.fillStyle = 'blue';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(atText, canvas.width / 2, canvas.height / 2);
  return canvas.toDataURL('image/png');
};
const msgUrlError = (msg: IMessage) => {
  // console.warn('Msg URL invalid', msg.type, msg.messageSeq, msg.thumbnailDownloadUrl || msg.fileDownloadUrl);
};

const showTextMsg = (type: number, status: number) => {
  return (
    type == ZIM.MessageType.Text ||
    type == ZIM.MessageType.Combine ||
    type == ZIM.MessageType.Custom ||
    type == ZIM.MessageType.Command ||
    type == ZIM.MessageType.Barrage ||
    status != ZIM.MessageSentStatus.Success
  );
};
const formatMsg = (msg: IMessage, _msg?: any) => {
  if (!msg) return '';

  const type = msg.type;

  // Text: show @ info
  if (type == ZIM.MessageType.Text) {
    return getMentionMsgText(msg.message, (_msg || msg).isMentionAll, (_msg || msg).mentionedUserIDs);
  }

  // Combine: line wrap
  if (type == ZIM.MessageType.Combine) {
    return msg.summary.replace(/\n/g, '</br>');
  }

  // Multiple: line wrap by item
  if (type == ZIM.MessageType.Multiple) {
    const text = msg.messageInfoList
      .map((v) =>
        v.type == ZIM.MessageType.Text
          ? getMentionMsgText(v.message, msg.isMentionAll, msg.mentionedUserIDs)
          : getMsgText(v),
      )
      .join('</br>');
    return `[${locale.value.cpt.chat.msgmap[type]}]</br>${text}`;
  }

  return getMsgText(msg);
};
const formatReplyMsg = (info: ZIMMessageRepliedInfo) => {
  if (!info) return '';

  let text = locale.value.cpt.chat.delreply;
  // @ts-ignore
  const isMsg = !!info.conversationID;
  if (isMsg || !info.state) {
    text = getReplyMsgText(isMsg ? info : (info.messageInfo as any));
  }

  return `${locale.value.cpt.chat.reply} ${getUsername(info.senderUserID)}: ${text}`;
};

const getMsgText = (msg: IMessage) => {
  const text = msg.message || msg.title || msg.fileName || msg.fileDownloadUrl;
  return `[${locale.value.cpt.chat.msgmap[msg.type]}]: ${text}`;
};
const getReplyMsgText = (msg: IMessage) => {
  if (msg.type == ZIM.MessageType.Text) return msg.message;
  if (msg.type == ZIM.MessageType.Revoke) return locale.value.cpt.chat.revokeMsg;

  const text =
    msg.type == ZIM.MessageType.Multiple && msg.messageInfoList
      ? msg.messageInfoList.map((v) => locale.value.cpt.chat.msgmap[v.type]).join(',')
      : msg.message || msg.title || msg.fileName || msg.fileDownloadUrl;
  return `[${locale.value.cpt.chat.msgmap[msg.type]}]: ${text || ''}`;
};
const getMentionMsgText = (text: string, isMentionAll: boolean, mentionedUserIDs: string[]) => {
  if (isMentionAll) {
    text = text.replace(/\[(@)\]/g, `<span class="atmsg"> $1${locale.value.cpt.chat.atAll.substring(1)} </span>`);
  }
  if (mentionedUserIDs && mentionedUserIDs.length) {
    const myid = self.userID;
    mentionedUserIDs.forEach((id) => {
      const clz = id == myid ? 'atmsg atmsg_me' : 'atmsg';
      text = text.replaceAll(`[@${id}]`, `<span class="${clz}"> @${getUsername(id)} </span>`);
    });
  }
  return text;
};

const isCustomMsgRsp = (reactions: any, type: string) => {
  return reactions && reactions.some((v: any) => v.reactionType.startsWith(type) && v.isSelfIncluded);
};
const renderVoteInfo = (reactions: any, key: string) => {
  const obj = reactions.find((v: any) => v.reactionType == key);
  if (!obj) return '0';
  let ids = obj.userList.map((v: any) => v.userID) as string[];
  if (obj.isSelfIncluded && ids.indexOf(zimStore.self.userID) == -1) {
    ids.unshift(zimStore.self.userID);
  }
  return `${obj.totalCount} ${locale.value.cpt.chat.voteInfo} ${ids.join()}`;
};
const renderQuestInfo = (reactions: any, i: number, keys: string[]) => {
  const key = `quest_${i}_`;
  reactions = reactions.filter((v: any) => v.reactionType.startsWith(key) && v.isSelfIncluded);
  return reactions.map((v: any) => keys[v.reactionType.replace(key, '')]).join();
};

const doScreenshot = () => {
  ElMessage.info('Start screenshot.');
  const dom = document.querySelector('.container.layout') as any;
  const conf = { logging: false, useCORS: true };
  html2canvas(dom, conf).then((canvas) => {
    // console.log('==========html2canvas', canvas);
    qlcontent.value.ops.push({ insert: { image: canvas.toDataURL('image/png') } });
    qlcontent.value.ops.push({ insert: '\n' });
    quillEditorRef.value?.setContents(qlcontent.value);
  }).catch((error) => {
    console.error('Screenshot failed:', error);
    ElMessage.error('Screenshot failed. Please try again.');
  });
};

// Call functionality
const startVideoCall = async () => {
  if (!convInfo.conversationID) {
    ElMessage.warning('No active conversation');
    return;
  }
  
  // Get other participants (exclude current user)
  const otherParticipants = zimStore.memberList
    .filter((member: any) => member.userID !== zimStore.self.userID)
    .map((member: any) => member.userID);
  
  if (otherParticipants.length === 0) {
    ElMessage.warning('No other participants in this conversation');
    return;
  }
  
  console.log('📹 Starting video call with:', otherParticipants);
  ElMessage.info('Starting video call...');
  
  // Call the actual video call method
  const success = await zimStore.startVideoCall(otherParticipants);
  if (success) {
    ElMessage.success('Video call invitation sent!');
  } else {
    ElMessage.error('Video call feature is not available in this version. Please use text messaging instead.');
  }
};

const startAudioCall = async () => {
  if (!convInfo.conversationID) {
    ElMessage.warning('No active conversation');
    return;
  }
  
  // Get other participants (exclude current user)
  const otherParticipants = zimStore.memberList
    .filter((member: any) => member.userID !== zimStore.self.userID)
    .map((member: any) => member.userID);
  
  if (otherParticipants.length === 0) {
    ElMessage.warning('No other participants in this conversation');
    return;
  }
  
  console.log('🎤 Starting audio call with:', otherParticipants);
  ElMessage.info('Starting audio call...');
  
  // Call the actual audio call method
  const success = await zimStore.startAudioCall(otherParticipants);
  if (success) {
    ElMessage.success('Audio call invitation sent!');
  } else {
    ElMessage.error('Audio call feature is not available in this version. Please use text messaging instead.');
  }
};

// Conversation rename methods - standardized format from DB as source of truth
const getConversationDisplayName = () => {
  const customName = localStorage.getItem(`conv_name_${convInfo.conversationID}`);
  if (customName) {
    return customName;
  }
  
  // Try to get conversation data from DB (source of truth)
  if ((convInfo as any).dbData) {
    const { petName, shelterName } = (convInfo as any).dbData;
    if (petName && shelterName) {
      // Clean any sequence numbers from the names
      const cleanPetName = petName.replace(/\(\d+\)$/, '');
      const cleanShelterName = shelterName.replace(/\(\d+\)$/, '');
      return `${cleanShelterName} – ${cleanPetName}`;
    }
  }
  
  // Try to get pet name from conversation-specific data (fallback)
  // This uses the pet data stored in the conversation itself, not global state
  
  // Try to get from ZIM group attributes (fallback)
  if ((convInfo as any).groupAttributes) {
    const petName = (convInfo as any).groupAttributes.petName;
    const shelterName = (convInfo as any).groupAttributes.shelterName;
    if (petName && shelterName) {
      // Clean any sequence numbers from the names
      const cleanPetName = petName.replace(/\(\d+\)$/, '');
      const cleanShelterName = shelterName.replace(/\(\d+\)$/, '');
      return `${cleanShelterName} – ${cleanPetName}`;
    }
  }
  
  // Try to extract from conversation ID (last resort)
  if (convInfo.conversationID) {
    // Check for shelter conversations
    if (convInfo.conversationID.includes('shelter') || convInfo.conversationID.includes('adoption')) {
      return 'Adopt • Pet';
    }
    
    // For peer conversations, show a friendly name
    if (convInfo.type === 0) {
      return 'Adopt • Pet';
    }
    
    // For other conversations, show a shortened version
    if (convInfo.conversationID.length > 10) {
      return `Adopt • ${convInfo.conversationID.slice(-6)}`;
    }
  }
  
  // Final fallback
  return 'Adopt • Pet';
};

const openRenameDialog = () => {
  renameForm.originalName = getConversationDisplayName();
  renameForm.name = renameForm.originalName;
  showRenameDialog.value = true;
};

const handleRenameConversation = () => {
  // Normalize whitespace: replace multiple spaces with single space and trim
  renameForm.name = renameForm.name.replace(/\s+/g, ' ').trim();
  
  if (!renameForm.name) {
    ElMessage.warning('Please enter a conversation name');
    return;
  }
  
  if (renameForm.name === renameForm.originalName) {
    showRenameDialog.value = false;
    return;
  }
  
  // Store the custom name in localStorage
  localStorage.setItem(`conv_name_${convInfo.conversationID}`, renameForm.name);
  
  ElMessage.success('Conversation renamed successfully');
  showRenameDialog.value = false;
  
  // Update the conversation list to reflect the new name
  zimStore.queryConversationList();
};

const resetConversationName = () => {
  localStorage.removeItem(`conv_name_${convInfo.conversationID}`);
  ElMessage.success('Conversation name reset to default');
  showRenameDialog.value = false;
  
  // Update the conversation list
  zimStore.queryConversationList();
};
const textMsgInput = (val: Delta) => {
  if (byteMsg.value) return;
  const hasAt = val.ops.some(v => typeof v.insert === 'string' && /(^|[\s])@$/.test(v.insert));
  msgAtShow.value = (convInfo.type !== 1) && hasAt;
};
const addAtText = (id: string) => {
  msgAtShow.value = false;

  qlcontent.value.ops.forEach((v) => {
    const text = v.insert;
    if (typeof text == 'string' && text.endsWith('@\n')) {
      v.insert = text.substring(0, text.length - 2);
    }
  });

  const url = createCanvasAtImg(id);
  qlcontent.value.ops.push({ insert: { image: url } });
  qltempmap.set(url, `[@${id}]`);

  quillEditorRef.value?.setContents(qlcontent.value);
};
const splitAtText = (text: string, isAt: boolean) => {
  if (isAt) {
    let i = 0;
    const iterator = text.matchAll(/\[@[a-zA-Z0-9#_\-]*\]/g);
    for (const e of iterator) {
      if (i < e.index) qlcontent.value.ops.push({ insert: text.substring(i, e.index) });
      const atText = e[0];
      const url = createCanvasAtImg(atText.substring(2, atText.length - 1));
      qlcontent.value.ops.push({ insert: { image: url } });
      qltempmap.set(url, atText);
      i = e.index + atText.length;
    }
    qlcontent.value.ops.push({ insert: text.substring(i) + '\n' });
  } else {
    qlcontent.value.ops.push({ insert: text + '\n' });
  }
};
const getAtIDs = (text: string) => {
  const arr = text.match(/\[@[a-zA-Z0-9#_\-]+\]/g);
  return arr ? Array.from(new Set(arr.map((v) => v.substring(2, v.length - 1)))) : [];
};

const initEditEnv = (str = '') => {
  qlcontent.value = new Delta([{ insert: str }]);
  qltempmap.clear();
  msgSendConf.isEditMsg = false;
  msgReplyShow.value = false;
  _msgitem.value = null;
};

const changeCombineChat = (index: number) => {
  if (index == 0) {
    combineChatRef.value.index = 0;
    combineChatRef.value.map.length = 0;
    combineChatRef.value.show = false;
  } else {
    combineChatRef.value.index = combineChatRef.value.index + index;
  }
};
const queryCombineMessageDetail = (msg: IMessage, init?: boolean) => {
  if (msg.type != ZIM.MessageType.Combine) return;

  zim.queryCombineMessageDetail(msg as any).then((res: any) => {
    const index = init ? 0 : combineChatRef.value.index + 1;
    combineChatRef.value.index = index;
    combineChatRef.value.map[index] = res.message.messageList;
    combineChatRef.value.show = true;
    // Test
    if (res.message.messageID == msg.messageID && !msg.messageList.length) {
      msg.messageList = res.message.messageList;
    }
  });
};

const scrollMsg = (value: any) => {
  if (value.scrollTop == 0 && msgList.length) {
    zimStore.queryHistoryMessage(msgList[0].msg);
  }
};

const scrollToBottom = async () => {
  await nextTick();
  requestAnimationFrame(() => {
    if (scrollbarRef.value && innerRef.value) {
      scrollbarRef.value.setScrollTop(innerRef.value.clientHeight);
    }
  });
};

watch(
  computed(() => convInfo.maxMsgOrderkey),
  () => {
    caclMsgTipsTime();
    scrollToBottom();
  },
);

watch(
  computed(() => convInfo.conversationID),
  async (id) => {
    initEditEnv(convInfo.draft || '');
    if (!id) return;
    lastConvId = id;
    await zimStore.queryHistoryMessage();
    if (lastConvId !== id) return; // user has moved, skip
    scrollToBottom();
  },
  { immediate: true },
);

// Watch for conversation type changes (separate from ID to avoid race conditions)
watch(
  computed(() => convInfo.type),
  () => {
    receiptMsg.value = false;
    byteMsg.value = false;
    supportedMsgNote.value = convInfo.type == 1 ? locale.value.cpt.chat.barrage : locale.value.cpt.chat.receipt;
  },
  { immediate: true },
);

// Watch for conversation status updates
watch(
  computed(() => (convInfo as any).dbData?.status || (convInfo as any).groupAttributes?.status),
  (status) => {
    if (status) {
      conversationStatus.value = status;
    } else {
      conversationStatus.value = 'ready';
    }
    
    // Special logic: If we have 2+ members and status is pending_zim_member, 
    // it means the shelter has joined but status wasn't updated - treat as ready
    if (memberCount.value >= 2 && conversationStatus.value === 'pending_zim_member') {
      console.log('🔄 Shelter has joined (2+ members) but status is pending - treating as ready');
      conversationStatus.value = 'ready';
    }
    
    console.log('📊 Conversation status updated:', {
      status: conversationStatus.value,
      memberCount: memberCount.value,
      conversationId: convInfo.conversationID
    });
  },
  { immediate: true },
);

// Watch for member list changes
watch(
  () => zimStore.memberList.length,
  () => {
    memberCount.value = zimStore.memberList.length;
    
    // Special logic: If we have 2+ members and status is pending_zim_member, 
    // it means the shelter has joined but status wasn't updated - treat as ready
    if (memberCount.value >= 2 && conversationStatus.value === 'pending_zim_member') {
      console.log('🔄 Shelter has joined (2+ members) but status is pending - treating as ready');
      conversationStatus.value = 'ready';
    }
    
    console.log('👥 Member count updated:', memberCount.value);
  },
  { immediate: true }
);
</script>

<template>
  <div class="container-chat">
    <!-- toolbar -->
    <div class="toolbar">
      <div class="subtitle ellipsis">
        <span class="name ellipsis" @click="showRenameDialog = true" style="cursor: pointer;" title="Click to rename">
          {{ getConversationDisplayName() }}({{ msgList.length }})
        </span>
        <span v-if="type == 2" class="tips ellipsis">{{ (convInfo as any).groupTitles.join(' ') }}</span>
      </div>
      <el-tooltip v-if="type != 1" :content="locale.dl.searchMsg.title" placement="bottom-end">
        <el-icon color="#409eff" @click="msgDialogState = true">
          <Search />
        </el-icon>
      </el-tooltip>
      <el-dropdown trigger="click" placement="bottom-end">
        <el-icon><MoreFilled /> </el-icon>
        <template #dropdown>
          <el-dropdown-menu>
            <template v-if="type == 0">
              <el-dropdown-item @click="clearUnread">{{ locale.cpt.chat.clearUnread }}</el-dropdown-item>
              <el-dropdown-item @click="deleteAllMessage">{{ locale.cpt.chat.deleteAllMsg }}</el-dropdown-item>
              <el-dropdown-item @click="sendConversationReceiptRead">
                {{ locale.cpt.chat.convReceiptRead }}
              </el-dropdown-item>
            </template>
            <template v-else-if="type == 2">
              <el-dropdown-item @click="clearUnread">{{ locale.cpt.chat.clearUnread }}</el-dropdown-item>
              <el-dropdown-item @click="deleteAllMessage">{{ locale.cpt.chat.deleteAllMsg }}</el-dropdown-item>
              <el-dropdown-item v-if="!convInfo.isDisabled" @click="leaveGroup">
                {{ locale.cpt.chat.leaveGroup }}
              </el-dropdown-item>
              <el-dropdown-item v-if="isOwner && !convInfo.isDisabled" @click="dismissGroup">
                {{ locale.cpt.chat.dismissGroup }}
              </el-dropdown-item>
            </template>
            <el-dropdown-item v-else-if="type == 1" @click="leaveRoom">
              {{ locale.cpt.chat.leaveRoom }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    
    <!-- Waiting Banner -->
    <WaitingBanner 
      :conversation-id="convInfo.conversationID"
      :status="conversationStatus"
      :member-count="memberCount"
    />
    
    <div class="content">
      <div class="chat">
        <el-scrollbar ref="scrollbarRef" class="list" v-loading="loading" @scroll="scrollMsg">
          <div ref="innerRef">
            <div
              v-for="(item, msgIndex) in msgList"
              :key="item.msg.localMessageID"
              :class="msgItemClz(item.msg)"
              :data-msgid="`${item.msg.c2cSeq || 0}-${item.msg.messageID}`"
            >
              <template v-if="item.msg.type != ZIM.MessageType.Revoke && item.msg.type != ZIM.MessageType.Tips">
                <el-checkbox
                  v-model="item.ext._checked"
                  v-show="selectMsg"
                  :label="msgIndex + 1"
                  :disabled="disableSelectMsg(item.msg)"
                >
                  {{ nolabel }}
                </el-checkbox>
                <el-avatar :size="32" :src="getAvatar(item.msg.senderUserID || '')" />
                <div class="msg-wrap">
                  <span v-if="item.ext && item.ext._time" :class="cssType('timetips')">
                    {{ item.ext._time }}
                  </span>
                  <span class="name ellipsis">
                    {{ getUsername(item.msg.senderUserID || '') }}
                    {{ showMsgExpiredTime(item) }}
                  </span>
                  <div class="msg-content" @contextmenu.prevent="onContextMenu($event, item)">
                    <!-- Receipt action -->
                    <CircleCheck
                      v-if="isReceiptMsgColor(item.msg)"
                      :color="receiptMsgColor(item.msg)"
                      @click="ackMessageReceipt(item.msg)"
                    />
                    <template
                      v-else-if="
                        convInfo.type != 1 && item.msg.direction == ZIM.MessageDirection.Send && item.msg.receiptStatus
                      "
                    >
                      <CircleCheck
                        v-if="isMessageReceiptDone(item.msg)"
                        :color="receiptMsgColor(item.msg)"
                        @click="queryMessageReceipt(item.msg)"
                        title="View read list"
                      />
                      <el-badge
                        v-else
                        :value="getMessageReceiptProcessingReadCount(item.msg)"
                        :type="item.msg.receiptStatus == ZIM.MessageReceiptStatus.Expired ? 'warning' : 'success'"
                        style="cursor: pointer; margin-top: 3px"
                        @click="queryMessageReceipt(item.msg)"
                      >
                        <span style="display:inline-block;width:16px;height:16px" title="Sending receipt..."></span>
                      </el-badge>
                    </template>
                    <!-- Send failed icon -->
                    <Warning
                      v-if="item.msg.sentStatus == ZIM.MessageSentStatus.Failed"
                      color="red"
                      @click="retrySendMsg(item.msg)"
                      style="cursor: pointer;"
                      title="Message failed to send. Click to retry."
                    />
                    <QuestionFilled v-else-if="item.msg.sentStatus == ZIM.MessageSentStatus.Sending" color="orange" title="Sending..." />

                    <!-- Message body start -->
                    <!-- Custom  1:Card 2:Vote 3:Questionnaire  -->
                    <el-card
                      v-if="
                        item.msg.type == ZIM.MessageType.Custom &&
                        item.custom &&
                        item.msg.subType >= 1 &&
                        item.msg.subType <= 3
                      "
                      shadow="always"
                    >
                      <div class="replymsg" @click="showReplyMsg(item.msg)" v-if="item.msg.repliedInfo">
                        <span :class="cssType('ellipsis')">
                          {{ formatReplyMsg(item.msg.repliedInfo) }}
                        </span>
                      </div>
                      <!-- 1:Card -->
                      <template v-if="item.msg.subType == 1">
                        <img width="60" :src="getCustomImg(item.custom.avatar)" />
                        <div>
                          <span>{{ item.custom.name }}{{ locale.cpt.chat.dcard }}</span>
                        </div>
                      </template>
                      <!-- 2:Vote -->
                      <template v-else-if="item.msg.subType == 2">
                        <div class="msg_vote_title">
                          <img width="32" v-if="item.custom.icon" :src="getCustomImg(item.custom.icon)" />
                          <span>{{ item.custom.title }}</span>
                        </div>
                        <template v-if="isCustomMsgRsp(item.msg.reactions, 'vote')">
                          <p v-for="(v, i) in item.custom.keys" :key="v">
                            {{ v }} : {{ renderVoteInfo(item.msg.reactions, 'vote' + i) }}
                          </p>
                        </template>
                        <template v-else>
                          <el-radio-group v-model="item.custom._values[0]">
                            <el-radio v-for="(v, i) in item.custom.keys" :key="v" :label="'vote' + i">{{ v }}</el-radio>
                          </el-radio-group>
                          <el-button
                            type="primary"
                            plain
                            style="margin-left: 20px"
                            @click="submitCustomMsgVote(item.custom._values[0], item.msg)"
                          >
                            {{ locale.cmn.confirm }}
                          </el-button>
                        </template>
                      </template>
                      <!-- 3:Questionnaire -->
                      <template v-if="item.msg.subType == 3">
                        <div class="msg_vote_title">
                          <img width="32" v-if="item.custom.icon" :src="getCustomImg(item.custom.icon)" />
                          <span>{{ item.custom.title }}</span>
                        </div>
                        <template v-if="isCustomMsgRsp(item.msg.reactions, 'quest')">
                          <p v-for="(v, i) in item.custom.keys" :key="i">
                            {{ v.title }} ({{ renderQuestInfo(item.msg.reactions, i, v.keys) }})
                          </p>
                        </template>
                        <el-form v-else label-position="top">
                          <el-form-item v-for="(v, i) in item.custom.keys" :key="i" :label="v.title">
                            <el-checkbox-group v-if="v.type == 1" v-model="item.custom._values[i]">
                              <el-checkbox v-for="(v1, i1) in v.keys" :key="v1" :label="`quest_${i}_${i1}`">
                                {{ v1 }}
                              </el-checkbox>
                            </el-checkbox-group>
                            <el-radio-group v-else-if="v.type == 0" v-model="item.custom._values[i]">
                              <el-radio v-for="(v1, i1) in v.keys" :key="v1" :label="`quest_${i}_${i1}`">
                                {{ v1 }}
                              </el-radio>
                            </el-radio-group>
                          </el-form-item>
                          <el-button type="primary" plain @click="submitCustomMsgQuest(item.custom._values, item.msg)">
                            {{ locale.cmn.confirm }}
                          </el-button>
                        </el-form>
                      </template>
                      <ZIMReactionInfo :msg="item.msg" @delete="deleteEmoji" @fetch="showReactionUsers" />
                    </el-card>

                    <!-- Text -->
                    <div v-else-if="showTextMsg(item.msg.type, item.msg.sentStatus || 0)" class="msg">
                      <div class="replymsg" @click="showReplyMsg(item.msg)" v-if="item.msg.repliedInfo">
                        <span :class="cssType('ellipsis')">
                          {{ formatReplyMsg(item.msg.repliedInfo) }}
                        </span>
                      </div>
                      <div
                        v-if="item.msg.type == ZIM.MessageType.Combine"
                        class="combinemsg"
                        @click="queryCombineMessageDetail(item.msg, true)"
                      >
                        <span :class="cssType('ellipsis')">{{ item.msg.title }}</span>
                        <div v-safe-html="formatMsg(item.msg)"></div>
                      </div>
                      <div v-else v-safe-html="formatMsg(item.msg)"></div>
                      <span v-if="item.msg.localExtendedData">
                        <br />----------<br />{{ item.msg.localExtendedData }}
                      </span>
                      <ZIMReactionInfo :msg="item.msg" @delete="deleteEmoji" @fetch="showReactionUsers" />
                    </div>

                    <!-- Media -->
                    <div
                      v-else-if="item.msg.type >= ZIM.MessageType.Image && item.msg.type <= ZIM.MessageType.Video"
                      :class="item.msg.type == ZIM.MessageType.File ? 'msg' : 'msg_media'"
                    >
                      <div class="replymsg" @click="showReplyMsg(item.msg)" v-if="item.msg.repliedInfo">
                        <span :class="cssType('ellipsis')">
                          {{ formatReplyMsg(item.msg.repliedInfo) }}
                        </span>
                      </div>
                      <img
                        v-if="item.msg.type == ZIM.MessageType.Image"
                        width="240"
                        class="pointer"
                        :src="item.msg.thumbnailDownloadUrl || item.msg.fileDownloadUrl"
                        @error="msgUrlError(item.msg)"
                        @click="openWindow(item.msg.thumbnailDownloadUrl || item.msg.fileDownloadUrl)"
                      />
                      <span v-else-if="item.msg.type == ZIM.MessageType.File">
                        <a target="_blank" :href="item.msg.fileDownloadUrl">{{ item.msg.fileName }}</a>
                      </span>
                      <audio
                        v-else-if="item.msg.type == ZIM.MessageType.Audio"
                        width="240"
                        controls
                        :src="item.msg.fileDownloadUrl"
                        @error="msgUrlError(item.msg)"
                      ></audio>
                      <video
                        v-else-if="item.msg.type == ZIM.MessageType.Video"
                        width="240"
                        controls
                        :poster="item.msg.videoFirstFrameDownloadUrl"
                        :src="item.msg.fileDownloadUrl"
                        @error="msgUrlError(item.msg)"
                      ></video>
                      <ZIMReactionInfo :msg="item.msg" @delete="deleteEmoji" @fetch="showReactionUsers" />
                    </div>

                    <!-- Multiple -->
                    <div v-else-if="item.msg.type == ZIM.MessageType.Multiple" class="msg msg_multiple">
                      <div class="replymsg" @click="showReplyMsg(item.msg)" v-if="item.msg.repliedInfo">
                        <span :class="cssType('ellipsis')">
                          {{ formatReplyMsg(item.msg.repliedInfo) }}
                        </span>
                      </div>
                      <template v-for="(lite, li) in item.msg.messageInfoList" :key="li">
                        <div v-if="showTextMsg(lite.type, 1)" v-safe-html="formatMsg(lite, item.msg)"></div>
                        <img
                          v-else-if="lite.type == ZIM.MessageType.Image"
                          width="240"
                          class="pointer"
                          :src="filetoURL(lite)"
                          @click="openWindow(lite.thumbnailDownloadUrl || lite.fileDownloadUrl)"
                        />
                        <span v-else-if="lite.type == ZIM.MessageType.File">
                          <a target="_blank" :href="lite.fileDownloadUrl">{{ lite.fileName }}</a>
                        </span>
                        <audio
                          v-else-if="lite.type == ZIM.MessageType.Audio"
                          width="240"
                          controls
                          :src="filetoURL(lite)"
                        ></audio>
                        <video
                          v-else-if="lite.type == ZIM.MessageType.Video"
                          width="240"
                          controls
                          :poster="lite.videoFirstFrameDownloadUrl"
                          :src="filetoURL(lite)"
                        ></video>
                      </template>
                      <ZIMReactionInfo :msg="item.msg" @delete="deleteEmoji" @fetch="showReactionUsers" />
                    </div>
                    <!-- Message body end -->
                  </div>

                  <!-- Message footer -->
                  <div class="msg-reply" v-if="item.ext && item.msg.rootRepliedCount" @click="showReplyMsg(item.msg)">
                    <el-icon><ChatDotSquare /></el-icon>
                    <span>{{ item.msg.rootRepliedCount }} {{ locale.cpt.chat.reply }}</span>
                  </div>
                </div>
              </template>

              <!-- Tips message -->
              <span v-else class="tips msg">
                {{
                  item.msg.type == ZIM.MessageType.Revoke
                    ? getRevokeMsg(item.msg)
                    : item.msg.type == ZIM.MessageType.Tips
                    ? getTipsMsg(item.msg)
                    : item.msg.message
                }}
                {{ showMsgExpiredTime(item) }}
              </span>
            </div>
          </div>
        </el-scrollbar>
        <div v-show="!selectMsg" class="msgbox" style="position: relative">
          <ul class="feature-bar" style="height: 24px">
            <li>
              <el-popover
                :disabled="convInfo.isDisabled"
                :visible="!!msgMenuEmojiType"
                placement="top-start"
                :width="170"
                trigger="click"
                popper-class="poppermsg"
              >
                <div class="title">
                  <span>{{ locale.cpt.chat.emoji }}</span>
                  <el-icon :size="16" @click="msgMenuEmojiType = 0"><CloseBold /></el-icon>
                </div>
                <ZIMEmojiBody @submit="handleEmoji" />
                <template #reference>
                  <el-button :disabled="convInfo.isDisabled" @click="msgMenuEmojiType = 2" link :icon="Star" />
                </template>
              </el-popover>
            </li>
            <li>
              <el-tooltip placement="top" content="Upload Files">
                <el-button :disabled="convInfo.isDisabled" @click="openFileUpload" link :icon="Document" />
              </el-tooltip>
            </li>
            <li>
              <el-tooltip placement="top" :content="locale.cpt.chat.record">
                <el-button :disabled="convInfo.isDisabled" @click="recordMediaFile" link :icon="Microphone" />
              </el-tooltip>
            </li>
            <li>
              <el-tooltip placement="top" :content="locale.cpt.chat.screenshot">
                <el-button :disabled="convInfo.isDisabled" @click="doScreenshot" link :icon="Scissor" />
              </el-tooltip>
            </li>
            <el-divider direction="vertical" />
            <li>
              <el-tooltip placement="top" content="Start Video Call">
                <el-button :disabled="convInfo.isDisabled" @click="startVideoCall" link :icon="VideoCamera" />
              </el-tooltip>
            </li>
            <li>
              <el-tooltip placement="top" content="Start Audio Call">
                <el-button :disabled="convInfo.isDisabled" @click="startAudioCall" link :icon="Headset" />
              </el-tooltip>
            </li>
            <el-divider direction="vertical" />
            <li>
              <el-checkbox :disabled="convInfo.isDisabled" v-model="receiptMsg" @change="receiptMsgChange">
                {{ supportedMsgNote }}
              </el-checkbox>
            </li>
            <li>
              <el-checkbox :disabled="convInfo.isDisabled" v-model="byteMsg" @change="byteMsgChange">
                {{ locale.cpt.chat.command }}
              </el-checkbox>
            </li>
            <span class="flex"></span>
            <li>
              <el-dropdown :disabled="convInfo.isDisabled" trigger="click" placement="top-end">
                <el-icon color="#409eff"><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="sendCustomMessage(1)">{{ locale.cpt.chat.card }}</el-dropdown-item>
                    <el-dropdown-item @click="sendCustomMessage(2)">{{ locale.cpt.chat.vote }}</el-dropdown-item>
                    <el-dropdown-item @click="sendCustomMessage(3)">{{ locale.cpt.chat.question }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </li>
          </ul>
          <div class="replybar" v-show="msgReplyShow">
            <el-icon @click="msgReplyShow = false"><CloseBold /></el-icon>
            <span class="ellipsis">{{ formatReplyMsg(_msgitem) }}</span>
          </div>
          <el-popover
            :visible="msgAtShow"
            :offset="1"
            placement="top-start"
            :width="400"
            trigger="click"
            popper-class="poppermsg"
          >
            <div class="title">
              <span>{{ locale.cpt.chat.at }}</span>
              <el-icon :size="16" @click="msgAtShow = false"><CloseBold /></el-icon>
            </div>
            <div style="max-height: 300px; overflow-y: auto">
              <el-tag type="success" @click="addAtText('')">{{ locale.cpt.chat.atAll }}</el-tag>
              <el-tag v-for="user in memberList" :key="user.userID" @click="addAtText(user.userID)">
                {{ user.userID }}
              </el-tag>
            </div>
            <template #reference>
              <div :class="cssType('qlcontainer')">
                <QuillEditor
                  ref="quillEditorRef"
                  v-model:content="qlcontent"
                  :options="qloption"
                  :enable="!convInfo.isDisabled"
                  @keydown.enter.exact.prevent="sendMsg"
                  @update:content="textMsgInput"
                />
              </div>
            </template>
          </el-popover>
        </div>
        <div v-show="selectMsg" class="msgbox">
          <ul class="feature-bar msgbar" style="height: 120px">
            <li @click="batchHandleMsg('forwardMsgs')">
              <el-icon><Share /></el-icon><span>{{ locale.cpt.chat.forward }}</span>
            </li>
            <li v-if="type != 1" @click="batchHandleMsg('deleteMsgs')">
              <el-icon><Delete /></el-icon><span>{{ locale.cpt.chat.delete }}</span>
            </li>
            <li @click="unselectMsg">
              <el-tooltip placement="top" :content="locale.cpt.chat.close">
                <el-icon><CloseBold /></el-icon>
              </el-tooltip>
            </li>
          </ul>
        </div>
      </div>
      <ZIMMember v-if="type" v-bind="props" @submit="bookDialogState = true" />
    </div>
    <context-menu v-model:show="msgMenuShow" :options="msgMenuOptions">
      <context-menu-item @click="selectMsg = true">
        {{ locale.cpt.chat.multiselect }}&ensp;<el-icon :size="16"><Expand /></el-icon>
      </context-menu-item>
      <template v-if="!convInfo.isDisabled && type != 1">
        <!--
          <context-menu-item @click="editMessage">
            {{ locale.cpt.chat.edit }}&ensp;<el-icon :size="16"><EditPen /></el-icon>
          </context-menu-item>
        -->
        <context-menu-item @click="msgReplyShow = true">
          {{ locale.cpt.chat.reply }}&ensp;<el-icon :size="16"><ChatDotSquare /></el-icon>
        </context-menu-item>
        <context-menu-item @click="revokeMessage">
          {{ locale.cpt.chat.revoke }}&ensp;<el-icon :size="16"><CloseBold /></el-icon>
        </context-menu-item>
        <context-menu-item @click="msgMenuEmojiType = 1">
          {{ locale.cpt.chat.reaction }}&ensp;<el-icon :size="16"><Flag /></el-icon>
        </context-menu-item>
      </template>
    </context-menu>

    <!-- Dialog -->
    <el-dialog v-model="receiptMemberInfo.show" :title="locale.cpt.chat.receiptTitle" class="receiptMemberInfo">
      <el-divider>{{ locale.cpt.chat.receiptReadList }}({{ receiptMemberInfo.readCount }})</el-divider>
      <el-tag v-for="user in receiptMemberInfo.readList" :key="user.userID"> {{ user.userID }}</el-tag>
      <el-divider>{{ locale.cpt.chat.receiptUnreadList }}({{ receiptMemberInfo.unreadCount }})</el-divider>
      <el-tag v-for="user in receiptMemberInfo.unreadList" :key="user.userID"> {{ user.userID }}</el-tag>
    </el-dialog>
    <el-dialog v-model="reactionUserInfo.show" :title="locale.cpt.chat.reactionTitle" class="reactionUserInfo">
      <ZIMEmojiTag :type="reactionUserInfo.type" :reactions="reactionUserInfo.reactions" @fetch="queryReactionUsers" />
      <div class="user">
        <el-tag
          v-if="reactionUserInfo.userMap[reactionUserInfo.type]"
          v-for="item in reactionUserInfo.userMap[reactionUserInfo.type]"
          :key="item.userID"
        >
          {{ item.userID }}
        </el-tag>
      </div>
    </el-dialog>
    <ZIMSearchMsgDialog v-if="type != 1" :visible="msgDialogState" :type="type" @close="onMsgDialogClose" />
    <ZIMSearchBookDialog v-if="type == 2" :visible="bookDialogState" :member="true" @close="onBookDialogClose" />
    <ZIMSearchResultDialog
      v-if="type != 1"
      :type="searchResult.type"
      :visible="searchResult.show"
      :regkey="searchResult.regkey"
      :list="searchResult[searchResult.type]"
      @close="searchResult.show = false"
    />
    <!-- Select forward conv -->
    <el-dialog
      v-model="forwardVisible"
      :title="locale.cpt.conv.selectConv"
      width="45%"
      top="50px"
      :center="true"
      class="convs-dialog"
    >
      <el-checkbox-group v-model="selectConvList">
        <div
          :class="item.conversationID == convInfo.conversationID && item.type == convInfo.type ? 'item active' : 'item'"
          v-for="item in convList"
          :key="item.conversationID"
        >
          <el-checkbox :label="item.type + item.conversationID">{{ nolabel }}</el-checkbox>
          <el-avatar :size="32" shape="square" :src="getGroupAvatar(item.conversationAvatarUrl)" />
          <span class="name">
            {{ item.type == 0 ? locale.dl.searchResult.convPeer : locale.dl.searchResult.convGroup }}
            {{ getUsername(item.conversationID) }}
          </span>
        </div>
        <div
          :class="item == convInfo.conversationID && convInfo.type == 1 ? 'item active' : 'item'"
          v-for="item in roomList"
          :key="item"
        >
          <el-checkbox :label="1 + item">{{ nolabel }}</el-checkbox>
          <span class="name">{{ locale.dl.searchResult.convRoom + ' ' + item }}</span>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button type="primary" @click="forwardMsgs(true)">
          {{ locale.cpt.chat.combineForward }}
        </el-button>
        <el-button type="primary" @click="forwardMsgs(false)">
          {{ locale.cpt.chat.singleForward }}
        </el-button>
      </template>
    </el-dialog>
    <!-- Show combine chat -->
    <el-dialog
      v-model="combineChatRef.show"
      width="50%"
      top="50px"
      :center="true"
      class="combine-dialog"
      @close="changeCombineChat(0)"
    >
      <template #header>
        <el-button
          link
          :icon="Back"
          :disabled="combineChatRef.map.length > 1 && combineChatRef.index ? false : true"
          @click="changeCombineChat(-1)"
        />
        <el-button
          link
          :icon="Right"
          :disabled="combineChatRef.index >= combineChatRef.map.length - 1"
          @click="changeCombineChat(1)"
        />
        <span class="el-dialog__title">{{ locale.cpt.chat.combineChat }} Level: {{ combineChatRef.index }}</span>
      </template>
      <div v-for="item in combineChatRef.map[combineChatRef.index]" :key="item.messageID" class="item">
        <el-avatar :size="32" :src="getAvatar(item.senderUserID)" />
        <div class="msg-wrap">
          <span class="name ellipsis">
            {{ getUsername(item.senderUserID) }}
          </span>
          <div class="msg">
            <div
              v-if="item.type == ZIM.MessageType.Combine"
              class="combinemsg"
              @click="queryCombineMessageDetail(item)"
            >
              <span class="ellipsis">{{ item.title }}</span>
              <div v-safe-html="formatMsg(item)"></div>
            </div>
            <div v-else v-safe-html="formatMsg(item)"></div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- Rename Conversation Dialog -->
    <el-dialog
      v-model="showRenameDialog"
      title="Rename Conversation"
      width="400px"
      :center="true"
      @close="showRenameDialog = false"
    >
      <el-form :model="renameForm" label-width="100px">
        <el-form-item label="Current Name">
          <el-input v-model="renameForm.originalName" readonly />
        </el-form-item>
        <el-form-item label="New Name">
          <el-input 
            v-model="renameForm.name" 
            placeholder="Enter a friendly name for this conversation"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <el-button type="danger" @click="resetConversationName" plain>
            Reset to Default
          </el-button>
          <div>
            <el-button @click="showRenameDialog = false">Cancel</el-button>
            <el-button type="primary" @click="handleRenameConversation">
              Rename
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
$border: 1px solid var(--el-border-color-light);

.container-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 565px;

  .content {
    flex: 1;
    display: flex;
    overflow: hidden;

    .chat {
      flex: 1;

      .list {
        flex: 1;
        padding: 6px 0;
        max-height: calc(100% - 140px);

        .item {
          padding: 0 6px 6px;
          display: flex;
          align-items: flex-start;

          > .tips {
            flex: 1;
            color: gainsboro;
            font-size: 12px;
            text-align: center;
          }

          .msg {
            padding: 4px;
            border-radius: 4px;
            word-break: break-word;
            flex: 1;
          }
          .msg_media {
            padding: 2px;
            border: $border;
          }
          .msg_multiple {
            > span,
            > img,
            > audio,
            > video {
              display: block;
              margin-bottom: 2px;
            }
          }

          .combinemsg {
            cursor: pointer;

            > span {
              display: flex;
              font-weight: bold;

              &::before {
                content: '';
                display: inline-block;
                width: 3px;
                height: 16px;
                background-color: orange;
                margin-right: 6px;
                margin-top: 2px;
              }
            }
          }

          .replymsg {
            display: flex;
            color: #bbbfc4;
            cursor: pointer;

            &::before {
              content: '';
              display: inline-block;
              width: 3px;
              height: 16px;
              background-color: #bbbfc4;
              margin-right: 6px;
              margin-top: 2px;
            }
          }
          .ellipsis0 {
            max-width: 378px;
          }
          .ellipsis1 {
            max-width: 273px;
          }

          .msg-wrap {
            max-width: 70%;
            padding: 0 6px;
            display: flex;
            flex-direction: column;
            position: relative;

            .timetips {
              text-align: center;
              color: gainsboro;
              font-size: 12px;
              position: absolute;
            }
            .timetips0 {
              width: 490px;
            }
            .timetips1 {
              width: 340px;
            }
            .name {
              color: gray;
              font-size: 12px;
              max-width: 280px;
            }

            .msg-content {
              display: flex;
              align-items: center;

              .el-form-item {
                margin-bottom: 12px;
              }
              svg {
                width: 16px;
                height: 16px;
                cursor: pointer;
              }

              .msg_vote_title {
                font-size: 16px;
                font-weight: 500;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                img {
                  margin-right: 12px;
                }
              }
            }

            .msg-reply {
              color: #1557f0;
              display: flex;
              align-items: center;
              cursor: pointer;
              > span {
                padding-left: 6px;
              }
            }
          }
        }
        .l .msg-wrap .msg {
          background-color: #ebeced;
        }
        .r .msg-wrap .msg {
          background-color: #d1e3ff;
        }
        .l .msg-wrap .timetips {
          left: 0;
        }
        .r .msg-wrap .timetips {
          right: 0;
        }
        .r,
        .l .msg-content {
          flex-direction: row-reverse;
        }
        .l .msg-wrap {
          align-items: flex-start;
        }
        .r .msg-wrap {
          align-items: flex-end;
        }
        .r > .el-checkbox {
          margin-left: 8px;
        }
      }

      .msgbox {
        border-top: $border;
      }
      .feature-bar {
        display: flex;
        align-items: center;
        padding: 0 12px;

        li {
          display: inline-block;
          text-align: center;
          cursor: pointer;
        }
        li + li {
          margin-left: 12px;
        }
        .flex {
          flex: 1;
        }
      }
      .msgbar {
        justify-content: space-evenly;
        li span {
          display: block;
          color: gray;
          font-size: 12px;
          word-break: break-word;
          max-width: 80px;
          height: 36px;
        }
        .el-icon,
        .el-icon svg {
          width: 26px;
          height: 26px;
          color: #409eff;
        }
      }

      .replybar {
        height: 24px;
        z-index: 1;
        display: flex;
        align-items: center;
        position: absolute;
        top: -26px;
        left: 0;
        right: 0;
        padding: 0 8px;
        background-color: rgba(0, 0, 0, 0.6);
        color: white;
        .el-icon {
          cursor: pointer;
          margin-right: 8px;
        }
      }
    }

    .el-textarea {
      font-size: 14px;
    }
  }
}
</style>

<style lang="scss">
$border: 1px solid var(--el-border-color-light);

.qlcontainer {
  overflow-y: auto;
  height: 100px;

  .ql-tooltip {
    display: none !important;
  }
  img {
    max-width: 200px;
    vertical-align: text-bottom;
  }
}
.qlcontainer0 {
  width: 564px;
}
.qlcontainer1 {
  width: 413px;
}

.receiptMemberInfo {
  margin-top: 70px !important;
  .el-dialog__body {
    max-height: 300px;
  }
}
.reactionUserInfo {
  margin-top: 120px !important;
  .el-dialog__body {
    padding-top: 12px;
    > span.el-tag {
      cursor: pointer;
      font-size: 16px;
    }
  }
  .user {
    border: $border;
    border-radius: 6px;
    padding: 6px;
    margin-top: 12px;
  }
}
.poppermsg {
  .el-icon,
  .el-tag {
    cursor: pointer;
  }
  .title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    padding-bottom: 12px;
  }
  .content span {
    cursor: pointer;
    margin-right: 8px;
    font-size: 20px;
  }
}
</style>