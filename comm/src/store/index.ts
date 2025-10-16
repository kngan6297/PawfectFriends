import { ElMessage, ElNotification } from 'element-plus';
import Long from 'long';
import { defineStore } from 'pinia';
import { getIntegrationConfig } from '../config/integration';
import {
    ZIM,
    ZIMCallInfo,
    ZIMCallInvitationListQueriedResult,
    ZIMConversation,
    ZIMEventOfConversationChangedResult,
    ZIMFriendApplicationInfo,
    ZIMFriendInfo,
    ZIMGroupApplicationInfo,
    ZIMGroupFullInfo,
    ZIMGroupInfo,
    ZIMMessage,
    ZIMMessageReceiptInfo,
    ZIMUserInfo,
    ZIMUserStatusSubscription,
} from 'zego-zim-web';
import { useZIM } from '~/useHook';
import { appConfig, avatarPrefix, generateToken } from '../utils';
import { EN } from './i18n';
import { userService } from '../services/user.service';
import { conversationService } from '../services/conversation.service';

// Chỉ export phần cần dùng
export { ZIM, ZIMMessage, ZIMMessageRepliedInfo, ZIMMessageReaction } from 'zego-zim-web';

export interface IMessage extends ZIMMessage {
    c2cSeq: string;
    message: string;
    isMentionAll: boolean;
    mentionedUserIDs: string[];
    messageInfoList: IMessage[];
    fileLocalPath: File;
    fileDownloadUrl: string;
    fileName: string;
    fileSize: number;
    thumbnailDownloadUrl: string;
    videoFirstFrameDownloadUrl: string;
    revokeStatus: ZIM.MessageRevokeStatus;
    revokeTimestamp: number;
    operatedUserID: string;
    revokeExtendedData: string;
    originalMessageType: number;
    originalTextMessageContent: string;
    subType: number;
    searchedContent: string;
    title: string;
    summary: string;
    messageList: ZIMMessage[];
}

export interface IUser {
    userID: string;
    userName: string;
    userAvatarUrl?: string;
    userAvatar?: string; // login data passed in
    avatar?: string; // from backend users/shelters
    photo?: string; // alternative avatar field
    memberNickname?: string; // Only affects display name in group, not user avatar
    memberRole?: number;
    muteExpiredTime?: number;
    // Additional user profile fields for standardized display
    displayName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
}
export interface IGroupApply extends ZIMGroupApplicationInfo {
    isMyJoin: boolean;
}

// ========= ZIM instance (singleton guard) =========
useZIM();

// Singleton pattern to ensure ZIM only initializes once
let zimCreated = false;
let zimInstance: any = null;

if (!appConfig?.appID || !appConfig?.serverSecret) {
    console.error('❌ Invalid Zego configuration', {
        appID: appConfig.appID,
        serverSecret: appConfig.serverSecret ? '***' : 'NOT_SET',
    });
    console.warn('⚠️ Fallback mode – features limited');
} else {
    // Check if ZIM instance already exists
    zimInstance = ZIM.getInstance();
    if (!zimInstance) {
        ZIM.create(appConfig);
        zimCreated = true;
        zimInstance = ZIM.getInstance();
        console.log('✅ ZIM instance created');
    } else {
        console.log('✅ ZIM instance already exists, reusing');
    }
}

export const SDKVersion = `ZIM-${ZIM.getVersion?.() ?? 'unknown'}-${appConfig.appID}`;
export const zim = zimInstance;
console.log('✅ ZIM store initialized', { created: zimCreated });

const store = defineStore('zimStore', {
    state: () => ({
        isLogged: false,
        isInitialized: false,
        isEventBound: false, // Flag to prevent multiple event bindings
        locale: EN,

        // throttles
        lastQueryTime: 0,
        queryCooldown: 1000, // Reduced from 10_000 to 1000ms
        lastUserBatchCall: 0,
        userBatchCooldown: 1000, // Reduced from 10_000 to 1000ms

        offlinePushConfig: {
            resourcesID: '',
            badgeIncrement: 0,
            enableBadge: false,
            voIPConfig: { iOSVoIPHasVideo: false, iOSVoIPHandleType: 1, iOSVoIPHandleValue: '' },
        },

        totalMemberCount: 0,
        totalUnreadMessageCount: 0,

        self: {
            userID: '',
            userName: '',
            userAvatarUrl: '',
            extendedData: '',
            customStatus: '',
        },

        userMap: {} as Record<string, IUser>,
        msgReceiptMap: {} as Record<string, ZIMMessageReceiptInfo>,

        convMap: new Map<string, ZIMConversation>(),
        convList: [] as ZIMConversation[],

        groupList: [] as ZIMGroupInfo[],
        groupAppList: [] as IGroupApply[],
        roomList: [] as string[],
        callList: [] as ZIMCallInfo[],
        friendList: [] as ZIMFriendInfo[],
        friendAppList: [] as ZIMFriendApplicationInfo[],
        blacklist: [] as ZIMUserInfo[],
        userSubscriptionList: [] as ZIMUserStatusSubscription[],

        memberList: [] as IUser[],
        msgList: [] as {
            msg: IMessage;
            ext: { _time: string | boolean; _checked: number };
            custom?: any;
        }[],

        convInfo: {
            conversationID: '',
            conversationName: '',
            conversationAvatarUrl: '',
            type: 0,
            unreadMessageCount: 0,
            orderKey: 0,
            notificationStatus: 0,
            draft: '',
            isDisabled: false,
            lastMessage: null as any,
            notice: '',
            groupTitles: [] as string[],
            receiptMsgID: '',
            maxMsgOrderkey: 0,
        },

        callInfo: {
            callID: '',
            caller: '',
            state: -1,
            mode: 0,
            userStateMap: {} as Record<string, number>,
            createTime: 0,
            acceptTime: 0,
            quitTime: 0,
            endTime: 0,
            isShow: false,
            selfState: -1,
        },
    }),

    actions: {
        /* ---------------- Events ---------------- */
        initEvent() {
            // Prevent multiple event bindings
            if (this.isEventBound) {
                console.log('🚫 Event listeners already bound, skipping...');
                return;
            }

            // chạy cleanup nhẹ, không block
            this.ensureCleanup().catch(() => { });

            const noop = () => { };
            zim.on('error', noop);
            zim.on('tokenWillExpire', noop);
            zim.on('userStatusUpdated', noop);
            zim.on('roomAttributesBatchUpdated', noop);
            zim.on('roomMemberAttributesUpdated', noop);
            zim.on('groupAliasUpdated', noop);
            zim.on('groupAttributesUpdated', noop);
            zim.on('callInvitationCreated', noop);

            zim.on('connectionStateChanged', (_: any, data: any) => {
                if (data.state == ZIM.ConnectionState.Disconnected) {
                    if (data.event == ZIM.ConnectionEvent.LoginTimeout || data.event == ZIM.ConnectionEvent.TokenExpired) {
                        const config = { token: generateToken(this.self.userID, 0), userName: this.self.userName, isOfflineLogin: false };
                        // có thể gọi zim.login lại nếu muốn
                    } else {
                        this.isLogged = false;
                    }
                } else if (data.state == ZIM.ConnectionState.Connected) {
                    this.isLogged = true;
                } else if (data.state == ZIM.ConnectionState.Reconnecting) {
                    ElMessage.error('Network error, reconnecting ...');
                }
            });

            zim.on('userInfoUpdated', (_: any, data: any) => {
                // Update self user info
                this.self.userName = data.info.baseInfo.userName;
                this.self.userAvatarUrl = data.info.baseInfo.userAvatarUrl;
                this.self.extendedData = data.info.extendedData;

                // Synchronize ZIM local cache for all users
                if (data.userList && Array.isArray(data.userList)) {
                    data.userList.forEach((u: any) => {
                        this.userMap[u.userID] = {
                            ...(this.userMap[u.userID] || {}),
                            userID: u.userID,
                            userName: u.userName,
                            userAvatarUrl: u.userAvatarUrl,
                            displayName: u.userName,
                        };
                    });
                    console.log('✅ ZIM user info synchronized for', data.userList.length, 'users');
                }
            });

            /* ---------------- Message handlers with idempotency ---------------- */
            const onMessageReceived = (messageList: ZIMMessage[], convID: string, convType: number) => {
                console.log('📨 onMessageReceived called:', {
                    messageCount: messageList.length,
                    convID,
                    convType,
                    currentConvID: this.convInfo.conversationID,
                    currentConvType: this.convInfo.type,
                    isMatching: convID == this.convInfo.conversationID && convType == this.convInfo.type
                });

                if (convID == this.convInfo.conversationID && convType == this.convInfo.type) {
                    messageList.forEach((item) => {
                        // Check for duplicate by messageID first
                        if (this.msgList.find((v) => v.msg.messageID == item.messageID)) {
                            console.log('🚫 Duplicate message detected by messageID:', item.messageID);
                            return;
                        }

                        // Check for duplicate by clientMsgId in extended data
                        try {
                            const extendedData = JSON.parse(item.extendedData || '{}');
                            if (extendedData.clientMsgId) {
                                const existingByClientId = this.msgList.find((v) => {
                                    try {
                                        const existingExtendedData = JSON.parse(v.msg.extendedData || '{}');
                                        return existingExtendedData.clientMsgId === extendedData.clientMsgId;
                                    } catch {
                                        return false;
                                    }
                                });

                                if (existingByClientId) {
                                    console.log('🚫 Duplicate message detected by clientMsgId:', extendedData.clientMsgId);
                                    return;
                                }
                            }
                        } catch (error) {
                            console.warn('Failed to parse extended data for idempotency check:', error);
                        }

                        const msg: any = { msg: { ...item }, ext: { _time: '', _checked: 0 } };
                        try {
                            if (item.type == ZIM.MessageType.Custom) {
                                msg.custom = JSON.parse((item as any).message || '{}');
                                msg.custom._values = [];
                            }
                        } catch { }
                        this.msgList.push(msg);
                        console.log('✅ New message added to store:', {
                            messageID: item.messageID,
                            clientMsgId: (() => {
                                try {
                                    const extData = JSON.parse(item.extendedData || '{}');
                                    return extData.clientMsgId || 'no-client-id';
                                } catch {
                                    return 'no-client-id';
                                }
                            })(),
                            totalMessages: this.msgList.length
                        });
                    });
                    this.convInfo.maxMsgOrderkey = this.msgList[this.msgList.length - 1].msg.orderKey || 0;
                }

                // Persist messages to database (fallback if webhook fails)
                this.persistMessagesToDatabase(messageList, convID, convType);
            };
            zim.on('peerMessageReceived', (_: any, data: any) => onMessageReceived(data.messageList, data.fromConversationID, 0));
            zim.on('groupMessageReceived', (_: any, data: any) => onMessageReceived(data.messageList, data.fromConversationID, 2));
            zim.on('roomMessageReceived', (_: any, data: any) => onMessageReceived(data.messageList, data.fromConversationID, 1));

            zim.on('messageSentStatusChanged', (_: any, data: any) => {
                data.infos.forEach(({ message }: { message: any }) => {
                    if (message.conversationID == this.convInfo.conversationID && message.conversationType == this.convInfo.type) {
                        const i = this.msgList.findIndex((v) => v.msg.localMessageID == message.localMessageID);
                        if (i != -1) {
                            // Update the message with new status
                            this.msgList[i].msg = message as IMessage;
                            // Force reactivity by replacing the array item
                            this.msgList.splice(i, 1, this.msgList[i]);

                            // Log status changes for debugging
                            if (message.sentStatus === ZIM.MessageSentStatus.Failed) {
                                console.warn('⚠️ Message marked as failed:', {
                                    localMessageID: message.localMessageID,
                                    conversationID: message.conversationID,
                                    timestamp: new Date().toISOString()
                                });
                            } else if (message.sentStatus === ZIM.MessageSentStatus.Success) {
                                console.log('✅ Message sent successfully:', {
                                    localMessageID: message.localMessageID,
                                    conversationID: message.conversationID
                                });
                            }
                        }
                    }
                });
            });

            zim.on('broadcastMessageReceived', (_: any, data: any) => {
                const message: IMessage = data.message as any;
                const str = message.message || message.fileName || message.fileDownloadUrl;
                ElNotification({ title: 'Broadcast message', message: `Type: ${message.type}, content: ${str}` });
            });

            // các event message khác giữ nguyên như cũ ...
            zim.on('messageDeleted', /* unchanged */(_: any, data: any) => {
                if (data.conversationID == this.convInfo.conversationID && data.conversationType == this.convInfo.type) {
                    if (data.isDeleteConversationAllMessage) {
                        this.msgList.length = 0;
                        this.convInfo.maxMsgOrderkey = 0;
                    } else if (data.messageList.length) {
                        data.messageList.forEach(({ messageID }: { messageID: any }) => {
                            const i = this.msgList.findIndex((v) => v.msg.messageID == messageID);
                            i != -1 && this.msgList.splice(i, 1);
                        });
                    }
                }
            });
            zim.on('messageRepliedCountChanged', /* unchanged */(_: any, data: any) => {
                data.infos.forEach((info: any) => {
                    if (info.conversationID != this.convInfo.conversationID || info.conversationType != this.convInfo.type) return;
                    for (let i = 0; i < this.msgList.length; i++) {
                        const msg = this.msgList[i];
                        if (info.messageID == msg.msg.messageID) {
                            (msg.msg as any).rootRepliedCount = info.count;
                            break;
                        }
                    }
                });
            });
            zim.on('messageRepliedInfoChanged', /* unchanged */(_: any, data: any) => {
                data.messageList.forEach((msg: any) => {
                    if (msg.conversationID == this.convInfo.conversationID && msg.conversationType == this.convInfo.type) {
                        const i = this.msgList.findIndex((v) => v.msg.messageID == msg.messageID);
                        if (i != -1) {
                            const msgitem = this.msgList[i];
                            msgitem.msg = msg as any;
                            this.msgList.splice(i, 1, msgitem);
                        }
                    }
                });
            });
            zim.on('messageReceiptChanged', (_: any, data: any) => {
                const map = { ...this.msgReceiptMap };
                data.infos.forEach((item: any) => (map[item.messageID] = item));
                this.msgReceiptMap = map;
            });
            zim.on('messageRevokeReceived', /* unchanged */(_: any, data: any) => {
                data.messageList.forEach((msg: any) => {
                    if (msg.conversationID != this.convInfo.conversationID || msg.conversationType != this.convInfo.type) return;
                    const i = this.msgList.findIndex((v) => v.msg.messageID == msg.messageID);
                    i != -1 && this.msgList.splice(i, 1, { msg: { ...msg } } as any);
                });
            });
            zim.on('messageReactionsChanged', /* unchanged */(_: any, data: any) => {
                data.reactions.forEach((item: any) => {
                    const msgObj = this.msgList.find((v) => v.msg.messageID == item.messageID);
                    if (!msgObj) return;
                    const reactions = msgObj.msg.reactions || [];
                    const index = reactions.findIndex((_r) => _r.reactionType == item.reactionType);
                    if (index !== -1) {
                        if (item.totalCount == 0) reactions.splice(index, 1);
                        else reactions.splice(index, 1, item);
                    } else reactions.push(item);
                    (msgObj.msg as any).reactions = reactions;
                });
            });

            // Conversation
            zim.on('conversationChanged', (_: any, data: any) => this.conversationChanged(data));
            zim.on('conversationsAllDeleted', () => this.conversationChanged());
            zim.on('conversationTotalUnreadMessageCountUpdated', (_: any, data: any) => {
                this.totalUnreadMessageCount = data.totalUnreadMessageCount;
                this.queryConversationList();
            });
            zim.on('conversationMessageReceiptChanged', (_: any, data: any) => {
                data.infos.some((item: any) => {
                    if (item.conversationID == this.convInfo.conversationID && item.conversationType == this.convInfo.type) {
                        this.convInfo.receiptMsgID = item.messageID;
                        return true;
                    }
                });
            });

            // Group / Room / Friend events giữ như cũ (đã rút gọn ở trên cho đỡ dài)
            // ...

            // Mark events as bound
            this.isEventBound = true;
            console.log('✅ Event listeners bound successfully');
        },

        /* ---------------- Event cleanup ---------------- */
        unbindEvents() {
            if (!this.isEventBound) {
                console.log('🚫 No events to unbind');
                return;
            }

            // Remove all event listeners
            zim.off('error');
            zim.off('tokenWillExpire');
            zim.off('userStatusUpdated');
            zim.off('roomAttributesBatchUpdated');
            zim.off('roomMemberAttributesUpdated');
            zim.off('groupAliasUpdated');
            zim.off('groupAttributesUpdated');
            zim.off('callInvitationCreated');
            zim.off('connectionStateChanged');
            zim.off('userInfoUpdated');
            zim.off('peerMessageReceived');
            zim.off('groupMessageReceived');
            zim.off('roomMessageReceived');
            zim.off('messageSentStatusChanged');
            zim.off('broadcastMessageReceived');
            zim.off('messageDeleted');
            zim.off('messageRepliedCountChanged');
            zim.off('messageRepliedInfoChanged');
            zim.off('messageReceiptChanged');
            zim.off('conversationMessageReceiptChanged');

            this.isEventBound = false;
            console.log('✅ Event listeners unbound successfully');
        },

        setAppGlobalConfig(conf: any, init = false) {
            const badge = conf.badgeIncrement;
            this.offlinePushConfig.resourcesID = conf.resourcesID;
            this.offlinePushConfig.badgeIncrement = badge;
            this.offlinePushConfig.enableBadge = badge > -1;
            this.offlinePushConfig.voIPConfig = { ...conf.voIPConfig };
            init && conf.geoFence.type && ZIM.setGeofencingConfig(conf.geoFence.areas, conf.geoFence.type);
        },

        async login(user: any) {
            try { await this.ensureCleanup(); } catch { }
            console.log('Using provided user for ZIM login:', user);

            document.title = `${SDKVersion}-${user.userID}`;
            sessionStorage.setItem('ZIMDEMOUSER', JSON.stringify(user));
            this.self = user;
            this.initEvent();

            // Set display name for ZIM consistency (UI still prioritizes DB)
            // Handle both user and shelter display names
            const displayName = user.displayName ||
                (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : null) ||
                user.firstName ||
                user.name || // shelter name field
                user.userName ||
                user.email ||
                user.userID;

            const conf = {
                userName: displayName, // Use standardized display name
                token: generateToken(user.userID, 0),
                isOfflineLogin: false,
                customStatus: ''
            };
            this.isLogged = false;

            return zim.login(user.userID, conf).then(async (res: any) => {
                this.isLogged = true;

                // Update ZIM profile after successful login
                await this.updateZIMProfile(user);

                // Load user profiles after login
                await this.loadUserProfiles();

                zim.querySelfUserInfo().then((res: any) => {
                    const info = res.selfUserInfo.userFullInfo;
                    const u = { ...info.baseInfo, extendedData: info.extendedData, customStatus: '' };
                    this.self = u;

                    // After loading current user profile
                    this.userMap[u.userID] = {
                        ...(this.userMap[u.userID] || {}),
                        displayName: u.userName,
                        userAvatarUrl: u.userAvatarUrl, // <- force to standard key
                    };
                });
                return res;
            });
        },

        logout(isSend = true) {
            this.isLogged = false;
            isSend && zim.logout();

            // Clear local caches and reset state
            this.clearLocalCaches();
        },

        /* ---------------- Group management ---------------- */
        async ensureGroupConversation(groupId: string, petData?: any, shelterData?: any, shouldGreet?: boolean) {
            try {
                if (!groupId) return false;

                console.log('🔍 Ensuring group conversation exists:', groupId);

                // 1) Try query - check if group exists
                const info = await zim.queryGroupInfo(groupId).catch(() => null);
                if (info?.groupInfo) {
                    return this.afterJoin(groupId, petData, shelterData, shouldGreet);
                }

                // 2) Try create with normalized ID
                const petName = `Adopt ${petData?.name ?? ''}`.trim();
                const shelterId = shelterData?._id || shelterData?.id;

                const created = await zim.createGroup(
                    {
                        groupID: groupId,
                        groupName: petName,
                        groupAvatarUrl: petData?.photos?.[0]?.url || '',
                        groupNotice: `Adoption conversation for ${petData?.name || 'Pet'}`
                    },
                    shelterId ? [shelterId] : []
                ).catch(() => null);

                if (created?.groupInfo?.baseInfo?.groupID) {
                    return this.afterJoin(created.groupInfo.baseInfo.groupID, petData, shelterData, shouldGreet);
                }

                // 3) Fallback: let ZIM automatically generate ID
                console.log('🔄 Fallback: Creating group with auto-generated ID...');
                const createAuto = await zim.createGroup(
                    {
                        groupName: petName,
                        groupAvatarUrl: petData?.photos?.[0]?.url || '',
                        groupNotice: `Adoption conversation for ${petData?.name || 'Pet'}`
                    },
                    shelterId ? [shelterId] : []
                );
                const realId = createAuto.groupInfo.baseInfo.groupID;

                console.log('✅ Group created with auto-generated ID:', realId);

                // Update backend with the real ZIM-generated ID
                try {
                    const config = getIntegrationConfig();
                    const authService = (await import('../services/auth.service')).authService;
                    const token = authService.getAuthToken();

                    if (token) {
                        await fetch(`${config.apiBaseUrl}/conversations/${groupId}/zim`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ zimGroupId: realId })
                        });
                        console.log('✅ Backend updated with real ZIM group ID:', realId);
                    } else {
                        console.warn('⚠️ No auth token available for backend update');
                    }
                } catch (updateError) {
                    console.warn('⚠️ Failed to update backend with real group ID:', updateError);
                }

                return this.afterJoin(realId, petData, shelterData, shouldGreet);

            } catch (error) {
                console.error('❌ Error ensuring group conversation:', error);
                return false;
            }
        },

        async afterJoin(groupId: string, petData?: any, shelterData?: any, shouldGreet?: boolean) {
            try {
                console.log('🔄 After join processing for group:', groupId);

                // First, check if we're already a member
                let isMember = false;
                try {
                    const groupInfo = await zim.queryGroupInfo(groupId);
                    console.log('🔍 Group info retrieved:', {
                        groupId,
                        memberCount: groupInfo.groupMemberList?.length || 0,
                        members: groupInfo.groupMemberList?.map((m: any) => m.userID) || [],
                        currentUser: this.self.userID,
                        groupAvatar: groupInfo.groupInfo?.baseInfo?.groupAvatarUrl || groupInfo.groupInfo?.baseInfo?.groupAvatar
                    });
                    isMember = groupInfo.groupMemberList?.some((member: any) => member.userID === this.self.userID) || false;
                    console.log('🔍 Membership check result:', { groupId, isMember });
                } catch (error) {
                    console.log('⚠️ Could not check membership, will attempt to join:', error);
                    // If we can't check membership, assume we're not a member
                    isMember = false;
                }

                // Join if not already a member
                if (!isMember) {
                    try {
                        console.log('🔄 Joining group:', groupId);
                        await zim.joinGroup(groupId);
                        console.log('✅ Successfully joined group:', groupId);
                    } catch (joinError: any) {
                        console.error('❌ Failed to join group:', joinError);

                        // Check if the error is because we're already a member
                        if (joinError.code === 6000522 || joinError.message?.includes('already belong to this group')) {
                            console.log('✅ User is already a member (detected from join error)');
                            isMember = true;
                        } else {
                            // If join fails for other reasons, try to create the group instead
                            console.log('🔄 Join failed, attempting to create group...');
                            try {
                                const petName = `Adopt ${petData?.name ?? ''}`.trim();
                                const shelterId = shelterData?._id || shelterData?.id;

                                await zim.createGroup(
                                    {
                                        groupID: groupId,
                                        groupName: petName,
                                        groupAvatarUrl: petData?.photos?.[0]?.url || '',
                                        groupNotice: `Adoption conversation for ${petData?.name || 'Pet'}`
                                    },
                                    shelterId ? [shelterId] : []
                                );
                                console.log('✅ Group created successfully:', groupId);
                                isMember = true; // User is now a member after creation

                                // Small delay to allow membership to sync
                                await new Promise(resolve => setTimeout(resolve, 100));
                            } catch (createError: any) {
                                // Check if the error is because group already exists
                                if (createError.code === 6000524 || createError.message?.includes('group already exist')) {
                                    console.log('✅ Group already exists, user should be a member');
                                    isMember = true;

                                    // Small delay to allow membership to sync
                                    await new Promise(resolve => setTimeout(resolve, 100));
                                } else {
                                    console.error('❌ Failed to create group:', createError);
                                    return false;
                                }
                            }
                        }
                    }
                } else {
                    console.log('✅ Already a member of group:', groupId);
                }

                // Final check - ensure we're actually a member before proceeding
                if (!isMember) {
                    console.error('❌ User is not a member of the group after all attempts');
                    return false;
                }

                // Ensure group attributes are set
                await this.ensureGroupAttributes(groupId, petData, shelterData);

                // Update group avatar in ZIM to synchronize both sides
                try {
                    const groupAvatar = petData?.photos?.[0]?.secure_url ||
                        petData?.photos?.[0]?.url ||
                        petData?.images?.[0]?.url;
                    if (groupAvatar && zim.updateGroupAvatarUrl) {
                        await zim.updateGroupAvatarUrl(groupId, groupAvatar);
                        console.log('✅ Group avatar updated in ZIM:', groupAvatar);
                    }
                } catch (e) {
                    console.debug('updateGroupAvatarUrl failed', e);
                }

                // Set conversation info and load messages
                await this.updateConvInfo({
                    conversationID: groupId,
                    type: 2,
                    conversationName: `Adopt ${petData?.name || 'Pet'}`,
                    conversationAvatarUrl: petData?.photos?.[0]?.url || '',
                    unreadMessageCount: 0,
                    orderKey: 0,
                    notificationStatus: 0,
                    draft: '',
                    isDisabled: false,
                    lastMessage: null,
                    notice: '',
                    groupTitles: [],
                    receiptMsgID: '',
                    maxMsgOrderkey: 0,
                });

                // Load history messages
                await this.queryHistoryMessage();

                // Check if we should send greeting
                const GREET_KEY = (gid: string) => `greeted_${gid}`;

                async function hasAnyMessage(groupId: string) {
                    const r = await zim.queryHistoryMessage(groupId, 2, { count: 1, reverse: false });
                    return (r.messageList?.length ?? 0) > 0;
                }

                // Use backend shouldGreet flag if available, otherwise fallback to localStorage + message history check
                const shouldSendGreeting = shouldGreet !== undefined
                    ? shouldGreet
                    : (!localStorage.getItem(GREET_KEY(groupId)) && !(await hasAnyMessage(groupId)));

                if (shouldSendGreeting) {
                    console.log('📤 Sending greeting (first time)...');
                    try {
                        await this.sendMessage({
                            message: `Hello! I'm interested in adopting ${petData?.name || 'this pet'}. Could you tell me more about them?`
                        });
                        localStorage.setItem(GREET_KEY(groupId), '1');

                        // Mark as greeted in backend
                        try {
                            const config = getIntegrationConfig();
                            const authService = (await import('../services/auth.service')).authService;
                            const token = authService.getAuthToken();

                            if (token) {
                                await fetch(`${config.apiBaseUrl}/conversations/mark-greeted`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ conversationId: groupId })
                                });
                                console.log('✅ Marked as greeted in backend');
                            }
                        } catch (backendError) {
                            console.warn('⚠️ Failed to mark as greeted in backend:', backendError);
                        }

                        console.log('✅ Greeting sent successfully');
                    } catch (messageError) {
                        console.error('❌ Failed to send greeting:', messageError);
                    }
                } else {
                    console.log('🚫 Skipping greeting - already sent or messages exist');
                }

                // Load group members
                await this.loadGroupMembers(groupId);

                // Refresh conversation list to get the new conversation
                await this.queryConversationList();

                // Verify conversation appears in list
                const convExists = this.convList.find(c => c.conversationID === groupId);
                if (convExists) {
                    console.log('✅ Conversation successfully added to list:', groupId);
                } else {
                    console.warn('⚠️ Conversation not found in list after join:', groupId);
                }

                console.log('✅ After join processing completed for group:', groupId);
                return true;

            } catch (error) {
                console.error('❌ Error in afterJoin:', error);
                return false;
            }
        },

        /* ---------------- Group attribute synchronization ---------------- */
        async ensureGroupAttributes(conversationId: string, petData?: any, shelterData?: any) {
            try {
                if (!conversationId) return;

                // Prepare group attributes for synchronization
                const groupAttributes = {
                    petId: petData?.id || petData?._id || '',
                    petName: petData?.name || 'Pet',
                    petThumb: petData?.photos?.[0] || '',
                    shelterId: shelterData?.id || shelterData?._id || '',
                    shelterName: shelterData?.name || 'Shelter',
                    conversationType: 'adoption'
                };

                // Update group attributes in ZIM
                await zim.updateGroupAttributes(conversationId, groupAttributes);
                console.log('✅ Group attributes synchronized:', groupAttributes);

                // Store in local conversation data for fallback
                const conv = this.convList.find(c => c.conversationID === conversationId);
                if (conv) {
                    (conv as any).groupAttributes = groupAttributes;
                }

                // Update current conversation if it matches
                if (this.convInfo.conversationID === conversationId) {
                    (this.convInfo as any).groupAttributes = groupAttributes;
                }

            } catch (error) {
                console.warn('⚠️ Failed to synchronize group attributes:', error);
            }
        },

        /* ---------------- ZIM profile management ---------------- */
        async updateZIMProfile(user: any) {
            try {
                // Set display name for ZIM consistency
                const displayName = user.displayName ||
                    (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : null) ||
                    user.firstName ||
                    user.name || // shelter name field
                    user.userName ||
                    user.email ||
                    user.userID;

                // Update user name
                if (displayName) {
                    await zim.updateUserName(displayName);
                    console.log('✅ ZIM user name updated:', displayName);
                }

                // Update user avatar (works for both users and shelters)
                const avatarUrl = user.avatar || user.userAvatar || user.userAvatarUrl;
                if (avatarUrl) {
                    await zim.updateUserAvatarUrl(avatarUrl);
                    console.log('✅ ZIM profile avatar updated:', avatarUrl);
                }
            } catch (profileError) {
                console.warn('⚠️ Failed to update ZIM profile:', profileError);
                throw profileError;
            }
        },

        /* ---------------- User profile loading ---------------- */
        async loadUserProfiles() {
            try {
                console.log('🔄 Loading user profiles...');

                // TODO: Implement actual API call to get user profiles from backend
                // This would be something like:
                // const response = await fetch('/api/users/profiles');
                // const profiles = await response.json();

                // For now, simulate the API response structure
                const profiles = [
                    {
                        zimUserId: this.self.userID,
                        displayName: (this.self as any).displayName || this.self.userName || '',
                        firstName: (this.self as any).firstName || '',
                        lastName: (this.self as any).lastName || '',
                        email: (this.self as any).email || '',
                        avatar: this.self.userAvatarUrl || '',
                    }
                ];

                // Populate userMap with standardized display names
                profiles.forEach((profile: any) => {
                    if (this.userMap[profile.zimUserId]) {
                        // Merge with existing user data
                        this.userMap[profile.zimUserId] = {
                            ...this.userMap[profile.zimUserId],
                            displayName: profile.displayName,
                            firstName: profile.firstName,
                            lastName: profile.lastName,
                            email: profile.email,
                        };
                    } else {
                        // Create new user entry
                        this.userMap[profile.zimUserId] = {
                            userID: profile.zimUserId,
                            userName: profile.displayName || 'User',
                            userAvatarUrl: profile.avatar,
                            displayName: profile.displayName,
                            firstName: profile.firstName,
                            lastName: profile.lastName,
                            email: profile.email,
                        };
                    }
                });

                console.log('✅ User profiles loaded successfully');

                // Emit event for UI to re-render names
                this.emitUserMapUpdate();

            } catch (error) {
                console.warn('⚠️ Failed to load user profiles:', error);
            }
        },

        emitUserMapUpdate() {
            // Emit custom event for components to re-render when userMap changes
            const event = new CustomEvent('userMapUpdated', {
                detail: { userMap: this.userMap }
            });
            window.dispatchEvent(event);
            console.log('📡 UserMap update event emitted');
        },

        /* ---------------- Database conversation data loading ---------------- */
        async loadConversationMetadata(conversations: any[]) {
            try {
                if (!conversations.length) return;

                console.log('🔄 Loading conversation metadata for', conversations.length, 'conversations');

                // Extract group IDs for batch API call
                const groupIds = conversations
                    .filter(conv => conv.conversationID)
                    .map(conv => conv.conversationID);

                if (groupIds.length === 0) return;

                // Call real backend API to get conversation metadata
                try {
                    const config = getIntegrationConfig();
                    const authService = (await import('../services/auth.service')).authService;
                    const token = authService.getAuthToken();

                    if (!token) {
                        console.warn('No auth token available for metadata request');
                        return;
                    }

                    const response = await fetch(`${config.apiBaseUrl}/conversations/metadata`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ groupIds })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();

                    if (!result.success) {
                        throw new Error(result.message || 'Failed to load conversation metadata');
                    }

                    const metadataList = result.data || [];

                    // Map metadata to conversations
                    conversations.forEach(conv => {
                        const metadata = metadataList.find((m: any) => m.groupId === conv.conversationID);
                        if (metadata) {
                            conv.dbData = {
                                petName: metadata.petName,
                                shelterName: metadata.shelterName,
                                shelterAvatar: metadata.shelterAvatar,
                                petThumb: metadata.petThumb,
                                lastMessageAt: metadata.lastMessageAt,
                                unreadCounts: metadata.unreadCounts,
                                status: metadata.status
                            };

                            // Set group avatar with pet image - prioritize existing SDK avatar, then pet data
                            conv.conversationAvatarUrl =
                                conv.conversationAvatarUrl || // keep if SDK already has
                                metadata.petThumb?.secure_url ||
                                metadata.petThumb?.url ||
                                metadata.petThumb || '';

                            // When merging metadata for each conversation (with shelter)
                            if (metadata.shelterId) {
                                this.userMap[metadata.shelterId] = {
                                    ...(this.userMap[metadata.shelterId] || {}),
                                    displayName: metadata.shelterName,
                                    userAvatarUrl: metadata.shelterAvatar, // <- avatar shelter
                                };
                            }

                            console.log('✅ Mapped DB data for conversation:', conv.conversationID, conv.dbData);
                        } else {
                            // Fallback for conversations not found in backend
                            conv.dbData = {
                                petName: 'Pet',
                                shelterName: 'Shelter',
                                petThumb: '',
                            };
                            console.log('⚠️ No metadata found for conversation:', conv.conversationID, 'using fallback');
                        }
                    });

                    console.log('✅ Conversation metadata loaded successfully from backend');
                } catch (apiError) {
                    console.warn('⚠️ Backend API failed, using fallback data:', apiError);

                    // Fallback to consistent mock data if API fails
                    const metadataList = groupIds.map(groupId => ({
                        groupId,
                        petName: 'Pet',
                        shelterName: 'Shelter',
                        shelterAvatar: '',
                        petThumb: '',
                    }));

                    conversations.forEach((conv: any) => {
                        const metadata = metadataList.find((m: any) => m.groupId === conv.conversationID);
                        if (metadata) {
                            conv.dbData = {
                                petName: metadata.petName,
                                shelterName: metadata.shelterName,
                                shelterAvatar: metadata.shelterAvatar,
                                petThumb: metadata.petThumb,
                            };
                        }
                    });
                }
            } catch (error) {
                console.warn('⚠️ Failed to load conversation metadata:', error);
            }
        },

        async loadConversationDbData(conversationId: string) {
            try {
                // This would typically call your backend API to get conversation data
                // For now, we'll use a placeholder that can be implemented later
                console.log('🔄 Loading conversation DB data for:', conversationId);

                // TODO: Implement actual API call to get conversation data from backend
                // const response = await fetch(`/api/conversations/${conversationId}/details`);
                // const data = await response.json();

                // For now, return null to indicate no DB data available
                return null;
            } catch (error) {
                console.warn('⚠️ Failed to load conversation DB data:', error);
                return null;
            }
        },

        async ensureConversationDbData(conversationId: string) {
            try {
                // Load DB data for the conversation
                const dbData = await this.loadConversationDbData(conversationId);

                if (dbData) {
                    // Store in conversation list
                    const conv = this.convList.find(c => c.conversationID === conversationId);
                    if (conv) {
                        (conv as any).dbData = dbData;
                    }

                    // Update current conversation if it matches
                    if (this.convInfo.conversationID === conversationId) {
                        (this.convInfo as any).dbData = dbData;
                    }

                    console.log('✅ Conversation DB data loaded:', dbData);
                }
            } catch (error) {
                console.warn('⚠️ Failed to ensure conversation DB data:', error);
            }
        },

        async mergeConversationDbData(conversations: any[]) {
            try {
                if (!conversations.length) return;

                console.log('🔄 Merging conversation DB data for', conversations.length, 'conversations');

                // TODO: Implement actual API call to get conversation data from backend
                // This would fetch complete conversation data including pet info, shelter info, etc.
                // const response = await fetch('/api/conversations/merge', {
                //   method: 'POST',
                //   headers: { 'Content-Type': 'application/json' },
                //   body: JSON.stringify({ 
                //     conversationIds: conversations.map(c => c.conversationID) 
                //   })
                // });
                // const dbConversations = await response.json();

                // For now, simulate the merge process
                conversations.forEach((conv: any) => {
                    // Merge pet and shelter data if available
                    if ((conv as any).dbData) {
                        // Set group avatar with pet image - prioritize existing SDK avatar, then pet data
                        conv.conversationAvatarUrl =
                            conv.conversationAvatarUrl || // keep if SDK already has
                            conv.dbData?.petThumb?.secure_url ||
                            conv.dbData?.petThumb?.url ||
                            conv.dbData?.pet?.photos?.[0]?.secure_url ||
                            conv.dbData?.pet?.images?.[0]?.url || '';

                        // Add last message timestamp if available
                        if (conv.dbData.lastMessageAt) {
                            conv.lastMessageAt = new Date(conv.dbData.lastMessageAt);
                        }

                        // Add unread counts if available
                        if (conv.dbData.unreadCounts) {
                            conv.unreadMessageCount = conv.dbData.unreadCounts.user || 0;
                        }

                        console.log('✅ Merged DB data for conversation:', conv.conversationID, conv.dbData);
                    }
                });

                console.log('✅ Conversation DB data merged successfully');
            } catch (error) {
                console.warn('⚠️ Failed to merge conversation DB data:', error);
            }
        },

        /* ---------------- Database persistence ---------------- */
        async persistMessagesToDatabase(messageList: ZIMMessage[], convID: string, convType: number) {
            try {
                // Only persist if we have messages and a valid conversation ID
                if (!messageList.length || !convID) return;

                console.log('💾 Persisting messages to database:', {
                    messageCount: messageList.length,
                    convID,
                    convType
                });

                // Call backend API to persist messages
                const response = await fetch('/api/messages/persist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
                    },
                    body: JSON.stringify({
                        messages: messageList,
                        conversationId: convID,
                        conversationType: convType
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to persist messages: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || 'Failed to persist messages');
                }

                console.log('✅ Messages persisted to database successfully');
            } catch (error) {
                console.warn('⚠️ Failed to persist messages to database:', error);
                // Note: This is a fallback - the webhook should handle most persistence
            }
        },

        /* ---------------- Cache clearing ---------------- */
        clearLocalCaches() {
            console.log('🧹 Clearing local caches...');

            // Clear user map
            this.userMap = {};

            // Clear message lists
            this.msgList = [];

            // Clear conversation data
            this.convList = [];
            this.convMap.clear();

            // Clear group data
            this.groupList = [];
            this.groupAppList = [];

            // Clear room data
            this.roomList = [];

            // Clear call data
            this.callList = [];

            // Clear friend data
            this.friendList = [];
            this.friendAppList = [];
            this.blacklist = [];

            // Clear member data
            this.memberList = [];

            // Clear receipt data
            this.msgReceiptMap = {};

            // Reset conversation info
            this.convInfo = {
                conversationID: '',
                conversationName: '',
                conversationAvatarUrl: '',
                orderKey: 0,
                notificationStatus: 0,
                isDisabled: false,
                lastMessage: null,
                notice: '',
                groupTitles: [],
                type: 0,
                unreadMessageCount: 0,
                draft: '',
                receiptMsgID: '',
                maxMsgOrderkey: 0,
            };

            // Reset counters
            this.totalMemberCount = 0;
            this.totalUnreadMessageCount = 0;

            // Reset flags
            this.isEventBound = false;

            // Clear ZIM local storage/IndexedDB
            try {
                // Clear ZIM SDK local storage
                if (typeof localStorage !== 'undefined') {
                    const keys = Object.keys(localStorage);
                    keys.forEach((key: string) => {
                        if (key.startsWith('zim_') || key.startsWith('ZIM_')) {
                            localStorage.removeItem(key);
                        }
                    });
                }

                // Clear session storage
                if (typeof sessionStorage !== 'undefined') {
                    const keys = Object.keys(sessionStorage);
                    keys.forEach((key: string) => {
                        if (key.startsWith('zim_') || key.startsWith('ZIM_') || key.includes('ZIMDEMO')) {
                            sessionStorage.removeItem(key);
                        }
                    });
                }

                console.log('✅ ZIM local storage cleared');
            } catch (error) {
                console.warn('⚠️ Failed to clear ZIM local storage:', error);
            }

            console.log('✅ Local caches cleared successfully');
        },

        setUserInfo(data: any) {
            const { name: userName, avatar, note: extendedData, id: customStatus } = data;
            if (userName && userName != this.self.userName) {
                zim.updateUserName(userName).then(() => (this.self.userName = userName));
            }
            const userAvatarUrl = avatar && (avatar.startsWith('http') ? avatar : avatarPrefix + avatar || '');
            if (avatar && userAvatarUrl != this.self.userAvatarUrl) {
                zim.updateUserAvatarUrl(userAvatarUrl!).then(() => {
                    this.self.userAvatarUrl = userAvatarUrl!;
                    this.userMap[this.self.userID] = { ...this.userMap[this.self.userID], userAvatarUrl: userAvatarUrl! };
                });
            }
            if (extendedData && extendedData != this.self.extendedData) {
                zim.updateUserExtendedData(extendedData).then(() => (this.self.extendedData = extendedData));
            }
            if (customStatus && customStatus != this.self.customStatus) {
                // zim.updateUserCustomStatus(customStatus).then(() => (this.self.customStatus = customStatus));
            }
        },

        /* -------- user map (decoupled, throttled) -------- */
        setUserMap(ids: string[]) {
            if (!ids?.length) return;

            const now = Date.now();
            if (now - this.lastUserBatchCall < this.userBatchCooldown) {
                console.log('🚫 User batch throttled in store, skip');
                return;
            }
            this.lastUserBatchCall = now;

            // rely on userService's own cache & circuit breaker
            userService
                .getMultipleUserProfiles(ids)
                .then((users: any) => {
                    users.forEach((u: any) => {
                        const zimUser = userService.convertToZIMUser(u);
                        this.userMap[zimUser.userID] = zimUser;
                    });
                    // Emit event for UI to re-render names
                    this.emitUserMapUpdate();
                })
                .catch((err) => {
                    console.error('User batch fallback via ZIM due to error:', err);
                    const config = { isQueryFromServer: false };
                    for (let index = 0; index < ids.length;) {
                        zim.queryUsersInfo(ids.slice(index, index + 100), config).then((res: any) => {
                            res.userList.forEach((item: any) => {
                                // Store user info with proper avatar handling
                                this.userMap[item.baseInfo.userID] = {
                                    ...item.baseInfo,
                                    // Ensure avatar URL is properly handled
                                    userAvatarUrl: item.baseInfo.userAvatarUrl || item.baseInfo.avatar || item.baseInfo.avatarUrl || ''
                                };
                            });
                            // Emit event for UI to re-render names
                            this.emitUserMapUpdate();
                        });
                        index += 100;
                    }
                });
        },

        /* ---------------- Conversation ---------------- */

        async queryGroupList() {
            try {
                const res = await zim.queryGroupList();
                // Convert ZIMGroup to ZIMGroupInfo if needed
                this.groupList = res.groupList as any;
                return res;
            } catch (error) {
                console.error('Error querying group list:', error);
                throw error;
            }
        },

        gotoGroupChat() {
            // Handle group chat navigation - can be customized based on your needs
            console.log('Navigating to group chat');
        },

        /**
         * Load group members for a conversation
         * @param {string} groupId - ZIM group ID
         */
        async loadGroupMembers(groupId: string) {
            try {
                console.log('🔄 Loading group members for:', groupId);

                // Query group members using ZIM SDK
                const res = await zim.queryGroupMemberList(groupId, { count: 100 });

                if (res.userList && res.userList.length > 0) {
                    // Update memberList with group members
                    this.memberList = res.userList.map((member: any) => ({
                        userID: member.userID,
                        userName: member.userName || member.userID,
                        userAvatarUrl: member.userAvatarUrl || '',
                        memberRole: member.memberRole || 0,
                        extendedData: member.extendedData || '',
                    }));

                    // Add members to userMap for name resolution
                    res.userList.forEach((member: any) => {
                        this.userMap[member.userID] = {
                            userID: member.userID,
                            userName: member.userName || member.userID,
                            userAvatarUrl: member.userAvatarUrl || '',
                        };
                    });

                    console.log('✅ Group members loaded:', {
                        groupId,
                        memberCount: this.memberList.length,
                        members: this.memberList.map(m => ({ id: m.userID, name: m.userName }))
                    });

                    // Emit event for UI to re-render
                    this.emitUserMapUpdate();
                } else {
                    console.log('⚠️ No group members found for:', groupId);
                    this.memberList = [];
                }
            } catch (error) {
                console.error('❌ Error loading group members:', error);
                this.memberList = [];
            }
        },

        async updateConvInfo(conv: any) {
            Object.assign(this.convInfo, conv);

            // Ensure DB data is loaded for proper display
            if (conv.conversationID) {
                await this.ensureConversationDbData(conv.conversationID);
            }

            // Load group members for group conversations
            if (conv.type === 2 && conv.conversationID) {
                await this.loadGroupMembers(conv.conversationID);
            }

            // Remove the automatic clicking logic to prevent loops
            // The component's watcher will handle UI updates when needed
        },

        async queryConversationList() {
            try {
                const now = Date.now();
                if (now - this.lastQueryTime < this.queryCooldown) {
                    console.log('🚫 Query rate limited.');
                    return this.convList.length ? { conversationList: this.convList } : { conversationList: [] };
                }
                this.lastQueryTime = now;

                if (!this.isInitialized) {
                    await this.initialize();
                    this.isInitialized = true;
                }

                // 1) Lấy từ ZIM
                const res = await zim.queryConversationList({ count: 1000 });

                // 2) Lọc những conv hợp lệ (không hardcode id)
                const valid = res.conversationList.filter((c: any) => !!c.conversationID);
                console.log('Conversations:', { total: res.conversationList.length, valid: valid.length });

                // 3) Fetch conversation metadata from backend
                await this.loadConversationMetadata(valid);

                // 4) Merge DB data with ZIM data for complete conversation info
                await this.mergeConversationDbData(valid);

                // 5) Sync backend có kiểm soát (sequential tránh bão)
                for (const item of valid) {
                    try {
                        await conversationService.syncConversation(item);
                    } catch (e) {
                        console.error('syncConversation error:', item.conversationID, e);
                    }
                }

                // 6) cập nhật state
                this.convList = valid;
                const ids: string[] = [];
                const map = new Map<string, ZIMConversation>();

                valid.forEach((item: any) => {
                    if (item.type == 0) {
                        // Peer conversations - add to userMap
                        this.userMap[item.conversationID] = {
                            ...this.userMap[item.conversationID],
                            userID: item.conversationID,
                            userName: item.conversationName || item.conversationID,
                            userAvatarUrl: item.conversationAvatarUrl,
                        };

                        // If no conversationName, add to IDs for batch user profile loading
                        if (!item.conversationName) {
                            ids.push(item.conversationID);
                        }
                    } else if (item.type == 2) {
                        // Group conversations - handle group members
                        console.log('Group conversation found:', {
                            id: item.conversationID,
                            name: item.conversationName,
                            type: item.type
                        });

                        // Load group members for group conversations
                        this.loadGroupMembers(item.conversationID).catch(err => {
                            console.warn('Failed to load group members:', err);
                        });
                    }
                    map.set(item.type + item.conversationID, item);
                });

                this.convMap = map;
                this.setUserMap(ids);

                // 7) dọn local artefacts an toàn
                this.pruneLocalArtifacts();

                // 8) xác thực mapping phía service (không xoá theo id cứng)
                // conversationService.validateMappings().catch(() => {});
                return res;
            } catch (error) {
                console.error('Error querying conversation list:', error);
                throw error;
            }
        },

        conversationChanged(data?: ZIMEventOfConversationChangedResult) {
            if (!data) {
                this.convInfo.conversationID = '';
                this.convList = [];
                this.convMap.clear();
                return;
            }

            data.infoList.forEach((item) => {
                const key = item.conversation.type + item.conversation.conversationID;
                if (item.event == 3) this.convMap.delete(key);
                else this.convMap.set(key, item.conversation);
            });
            const list: ZIMConversation[] = Array.from(this.convMap.values());
            list.sort((a, b) => b.orderKey - a.orderKey);
            this.convList = list;
        },

        /** Xoá local entries rác (không biết backend nữa) */
        pruneLocalArtifacts() {
            // remove entries có conversationID rỗng hoặc null
            const before = this.convList.length;
            this.convList = this.convList.filter((c) => !!c.conversationID);
            // rebuild convMap tương ứng
            const map = new Map<string, ZIMConversation>();
            this.convList.forEach((c) => map.set(c.type + c.conversationID, c));
            this.convMap = map;
            if (before !== this.convList.length) {
                console.log(`🧹 Pruned ${before - this.convList.length} local conv artifacts`);
            }
            // nếu convInfo trỏ vào conv không còn, reset
            if (this.convInfo.conversationID && !this.convMap.get(this.convInfo.type + this.convInfo.conversationID)) {
                this.convInfo = {
                    conversationID: '',
                    conversationName: '',
                    conversationAvatarUrl: '',
                    type: 0,
                    unreadMessageCount: 0,
                    orderKey: 0,
                    notificationStatus: 0,
                    draft: '',
                    isDisabled: false,
                    lastMessage: null,
                    notice: '',
                    groupTitles: [],
                    receiptMsgID: '',
                    maxMsgOrderkey: 0,
                };
            }
        },

        /** Initialize once */
        async initialize() {
            if (this.isInitialized) {
                console.log('🚫 ZIM store already initialized, skipping...');
                return;
            }

            try {
                console.log('🚀 Initializing ZIM store...');
                this.pruneLocalArtifacts();
                this.isInitialized = true;
                console.log('✅ ZIM store initialization complete');
            } catch (e) {
                console.error('❌ ZIM store init error:', e);
                this.isInitialized = false; // Reset on error
            }
        },

        async ensureCleanup() {
            if (!this.isInitialized) await this.initialize();
        },

        async deleteConversation(conv: any) {
            const config = { isAlsoDeleteServerConversation: true };
            try {
                await zim.deleteConversation(conv.conversationID, conv.type, config);

                // cố gắng xóa backend theo mapping đã có (service sẽ tự xử lý)
                // try {
                //   await conversationService.deleteConversation(conv.conversationID as string);
                // } catch (e) {
                //   console.error('Backend delete failed (non-fatal):', e);
                // }

                const index = this.convList.findIndex((item: any) => item == conv);
                index != -1 && this.convList.splice(index, 1);
                if (this.convList.length == 0) this.convInfo.conversationID = '';
            } catch (e) {
                console.error('Error deleting conversation:', e);
                throw e;
            }
        },

        /* ---------------- Messages ---------------- */
        async queryHistoryMessage(nextMessage?: any) {
            const convID = this.convInfo.conversationID;
            const type = this.convInfo.type;

            if (!nextMessage) {
                this.msgList.length = 0;
                if (type == 0) {
                    this.memberList.length = 0;
                    this.memberList.push(this.self as any);
                    if (convID != this.self.userID) this.memberList.push({ ...this.userMap[convID], userID: convID });
                }
            }

            try {
                const zimRes = await zim.queryHistoryMessage(convID, type, { count: 100, reverse: true, nextMessage });

                // Load từ backend (best-effort)
                // conversationService.getMessages(convID, { limit: 100 }).catch(() => {});

                if (zimRes.messageList.length) {
                    let msgs = zimRes.messageList.map((item: any) => {
                        const msg: any = { msg: { ...item }, ext: { _time: '', _checked: 0 } };
                        try {
                            if (item.type == ZIM.MessageType.Custom) {
                                msg.custom = JSON.parse((item as any).message || '{}');
                                msg.custom._values = [];
                            }
                        } catch { }
                        return msg;
                    });

                    // Always deduplicate messages, whether merging or not
                    const seenMessageIds = new Set<string>();
                    const seenClientMsgIds = new Set<string>();

                    if (this.msgList.length) {
                        // Merge with existing messages
                        const existingCount = this.msgList.length;
                        msgs = msgs.concat(this.msgList);
                        this.msgList.length = 0;
                        console.log(`🔄 Merging ${zimRes.messageList.length} new messages with ${existingCount} existing messages`);
                    }

                    // Deduplicate by messageID and clientMsgId
                    msgs = msgs.filter((msg: any) => {
                        const messageId = msg.msg.messageID;

                        // Check for duplicate by messageID
                        if (seenMessageIds.has(messageId)) {
                            console.log('🚫 Duplicate message filtered by messageID:', messageId);
                            return false;
                        }
                        seenMessageIds.add(messageId);

                        // Check for duplicate by clientMsgId in extended data
                        try {
                            const extendedData = JSON.parse(msg.msg.extendedData || '{}');
                            if (extendedData.clientMsgId) {
                                if (seenClientMsgIds.has(extendedData.clientMsgId)) {
                                    console.log('🚫 Duplicate message filtered by clientMsgId:', extendedData.clientMsgId);
                                    return false;
                                }
                                seenClientMsgIds.add(extendedData.clientMsgId);
                            }
                        } catch (error) {
                            console.warn('Failed to parse extended data for deduplication:', error);
                        }

                        return true;
                    });

                    console.log(`✅ History messages deduplicated: ${zimRes.messageList.length} loaded, ${msgs.length} after deduplication`);

                    msgs.forEach((m: any) => this.msgList.push(m));
                }
                if (this.msgList.length) this.convInfo.maxMsgOrderkey = this.msgList[this.msgList.length - 1].msg.orderKey || 0;
            } catch (e) {
                console.error('Error loading messages:', e);
            }
        },

        sendMessage(msgObj: any, replyMsg?: any, hasReceipt = false, isByte = false) {
            const convID = this.convInfo.conversationID;
            const convType = +this.convInfo.type;

            if (!msgObj.type)
                msgObj.type = isByte
                    ? ZIM.MessageType.Command
                    : convType == 1 && hasReceipt
                        ? ZIM.MessageType.Barrage
                        : ZIM.MessageType.Text;

            if (isByte) {
                msgObj.message = new Uint8Array(Array.from(unescape(encodeURIComponent(msgObj.message))).map((c) => c.charCodeAt(0)));
            }

            const isConvCmd = msgObj.type == ZIM.MessageType.Command || msgObj.type == ZIM.MessageType.Barrage;

            console.log('📤 sendMessage called:', {
                messageType: msgObj.type,
                convID,
                convType,
                isConvCmd,
                hasReceipt,
                isByte,
                hasReply: !!replyMsg
            });
            const isRetrySend = !!msgObj.localMessageID && msgObj.sentStatus == ZIM.MessageSentStatus.Failed;

            if (isRetrySend && msgObj.repliedInfo) {
                const seq = msgObj.repliedInfo.messageSeq;
                replyMsg = this.msgList.find((v: any) => v.msg.messageSeq == seq)?.msg;
            }

            // Generate unique client message ID for idempotency
            const clientMsgId = msgObj.clientMsgId || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            msgObj.clientMsgId = clientMsgId;

            console.log('🆔 Generated clientMsgId:', clientMsgId);

            const pushConfig = isConvCmd
                ? void 0
                : { title: 'Received message type ' + msgObj.type + ' from ' + convID, content: 'content', payload: 'payload', ...this.offlinePushConfig };

            const config = {
                priority: 2,
                isRetrySend,
                hasReceipt: isConvCmd ? false : hasReceipt || (isRetrySend && msgObj.receiptStatus == ZIM.MessageReceiptStatus.Processing),
                pushConfig,
            };

            const custom = msgObj.type == ZIM.MessageType.Custom ? Object.assign(JSON.parse(msgObj.message), { _values: [] }) : void 0;

            // Add clientMsgId to extended data for idempotency
            if (!msgObj.extendedData) {
                msgObj.extendedData = '{}';
            }
            try {
                const extendedData = JSON.parse(msgObj.extendedData);
                extendedData.clientMsgId = clientMsgId;
                msgObj.extendedData = JSON.stringify(extendedData);
            } catch (error) {
                console.warn('Failed to parse existing extended data, creating new:', error);
                msgObj.extendedData = JSON.stringify({ clientMsgId });
            }

            const notification = {
                onMessageAttached: async (msg: any) => {
                    if (!msg.sentStatus) {
                        msg.sentStatus = ZIM.MessageSentStatus.Sending;
                    }

                    this.msgList.push({ msg, custom, ext: { _time: '', _checked: 0 } });
                    conversationService.addMessage(msg, convID).catch(() => { });
                },
            };

            const task =
                !isConvCmd && convType != 1 && replyMsg
                    ? zim.replyMessage(msgObj, replyMsg, config, notification)
                    : zim.sendMessage(msgObj, convID, convType, config, notification);

            return task.finally(() => {
                if (isRetrySend) {
                    this.msgList.sort((v1, v2) => (v1.msg.orderKey || 0) - (v2.msg.orderKey || 0));
                } else {
                    const i = this.msgList.findIndex((v) => v.msg.localMessageID == msgObj.localMessageID);
                    if (i != -1) {
                        this.msgList.splice(i, 1, { msg: msgObj, custom, ext: { _time: '', _checked: 0 } });
                    }
                }
                this.convInfo.maxMsgOrderkey = msgObj.orderKey;
            });
        },

        async editMessage(original: ZIMMessage, patched: any) {
            // If the SDK has a real edit API, use it here (e.g. zim.updateMessage(...)).
            // If NOT, fallback revoke + resend:
            await zim.revokeMessage(original);
            // optional: patched.localExtendedData = 'edited';
            return this.sendMessage(patched);
        },

        async syncAllConversationsWithBackend() {
            try {
                const res = await conversationService.getConversationList();
                this.convList = res.map((c: any) => ({ ...c }));
                this.convMap = new Map(this.convList.map((c: any) => [c.type + c.conversationID, c]));
                return res;
            } catch (e) {
                console.error('syncAllConversationsWithBackend error:', e);
                return false;
            }
        },

        async syncConversationMessagesWithBackend(conversationId: string) {
            try {
                const zimRes = await zim.queryHistoryMessage(conversationId, this.convInfo.type, { count: 1000, reverse: false });
                // await Promise.all(
                //   zimRes.messageList.map((msg) => conversationService.syncMessage(msg, conversationId).catch(() => {})),
                // );
                return true;
            } catch (e) {
                console.error('syncConversationMessagesWithBackend error:', e);
                return false;
            }
        },

        /* ---------------- Call Management ---------------- */
        async startVideoCall(userIDs: string[]) {
            try {
                console.log('📹 Starting video call with:', userIDs);

                // Check if callInvite method is available
                if (typeof zim.callInvite !== 'function') {
                    console.warn('⚠️ Call invitation feature not available in this ZIM SDK version');
                    return false;
                }

                // Send call invitation using the correct ZIM SDK method
                const config = {
                    mode: 1, // Video call
                    extendedData: '',
                    timeout: 60 // 60 seconds timeout
                };

                const result = await zim.callInvite(userIDs, config);

                if (result.errorInvitees && result.errorInvitees.length > 0) {
                    console.warn('⚠️ Some users could not be invited:', result.errorInvitees);
                }

                // Update call info
                this.setCallInfo({
                    callID: result.callID,
                    caller: this.self.userID,
                    mode: 1, // Video call
                    state: 0, // Calling
                    userStateMap: userIDs.reduce((map, userID) => {
                        map[userID] = 0; // Inviting
                        return map;
                    }, {} as Record<string, number>),
                    selfState: 0, // Calling
                    createTime: Date.now(),
                    acceptTime: 0,
                    quitTime: 0,
                    endTime: 0,
                    isShow: true
                });

                console.log('✅ Video call invitation sent');
                return true;
            } catch (error) {
                console.error('❌ Error starting video call:', error);
                return false;
            }
        },

        async startAudioCall(userIDs: string[]) {
            try {
                console.log('🎤 Starting audio call with:', userIDs);

                // Check if callInvite method is available
                if (typeof zim.callInvite !== 'function') {
                    console.warn('⚠️ Call invitation feature not available in this ZIM SDK version');
                    return false;
                }

                // Send call invitation using the correct ZIM SDK method
                const config = {
                    mode: 0, // Audio call
                    extendedData: '',
                    timeout: 60 // 60 seconds timeout
                };

                const result = await zim.callInvite(userIDs, config);

                if (result.errorInvitees && result.errorInvitees.length > 0) {
                    console.warn('⚠️ Some users could not be invited:', result.errorInvitees);
                }

                // Update call info
                this.setCallInfo({
                    callID: result.callID,
                    caller: this.self.userID,
                    mode: 0, // Audio call
                    state: 0, // Calling
                    userStateMap: userIDs.reduce((map, userID) => {
                        map[userID] = 0; // Inviting
                        return map;
                    }, {} as Record<string, number>),
                    selfState: 0, // Calling
                    createTime: Date.now(),
                    acceptTime: 0,
                    quitTime: 0,
                    endTime: 0,
                    isShow: true
                });

                console.log('✅ Audio call invitation sent');
                return true;
            } catch (error) {
                console.error('❌ Error starting audio call:', error);
                return false;
            }
        },

        async callAccept() {
            try {
                console.log('✅ Accepting call:', this.callInfo.callID);

                // Check if acceptCallInvitation method is available
                if (typeof zim.acceptCallInvitation !== 'function') {
                    console.warn('⚠️ Call acceptance feature not available in this ZIM SDK version');
                    return false;
                }

                await zim.acceptCallInvitation(this.callInfo.callID);
                this.setCallInfo({ selfState: 1, state: 1 }); // Accepted
                return true;
            } catch (error) {
                console.error('❌ Error accepting call:', error);
                return false;
            }
        },

        async callReject() {
            try {
                console.log('❌ Rejecting call:', this.callInfo.callID);

                // Check if rejectCallInvitation method is available
                if (typeof zim.rejectCallInvitation !== 'function') {
                    console.warn('⚠️ Call rejection feature not available in this ZIM SDK version');
                    return false;
                }

                await zim.rejectCallInvitation(this.callInfo.callID);
                this.setCallInfo({ isShow: false, state: 2 }); // Rejected
                return true;
            } catch (error) {
                console.error('❌ Error rejecting call:', error);
                return false;
            }
        },

        async callingInvite(userIDs: string[]) {
            try {
                console.log('📞 Inviting additional users to call:', userIDs);

                // Check if inviteUsersIntoCall method is available
                if (typeof zim.inviteUsersIntoCall !== 'function') {
                    console.warn('⚠️ Call invitation feature not available in this ZIM SDK version');
                    return false;
                }

                await zim.inviteUsersIntoCall(this.callInfo.callID, userIDs);
                return true;
            } catch (error) {
                console.error('❌ Error inviting users to call:', error);
                return false;
            }
        },

        async callQuit() {
            try {
                console.log('🚪 Quitting call:', this.callInfo.callID);

                // Check if quitCall method is available
                if (typeof zim.quitCall !== 'function') {
                    console.warn('⚠️ Call quit feature not available in this ZIM SDK version');
                    return false;
                }

                await zim.quitCall(this.callInfo.callID);
                this.setCallInfo({ selfState: 2, quitTime: Date.now() }); // Quit
                return true;
            } catch (error) {
                console.error('❌ Error quitting call:', error);
                return false;
            }
        },

        async callEnd() {
            try {
                console.log('🔚 Ending call:', this.callInfo.callID);

                // Check if endCall method is available
                if (typeof zim.endCall !== 'function') {
                    console.warn('⚠️ Call end feature not available in this ZIM SDK version');
                    return false;
                }

                await zim.endCall(this.callInfo.callID);
                this.setCallInfo({ isShow: false, state: 2, endTime: Date.now() }); // Ended
                return true;
            } catch (error) {
                console.error('❌ Error ending call:', error);
                return false;
            }
        },

        async callCancel(userIDs: string[]) {
            try {
                console.log('❌ Cancelling call:', this.callInfo.callID);

                // Check if cancelCallInvitation method is available
                if (typeof zim.cancelCallInvitation !== 'function') {
                    console.warn('⚠️ Call cancellation feature not available in this ZIM SDK version');
                    return false;
                }

                await zim.cancelCallInvitation(this.callInfo.callID, userIDs);
                this.setCallInfo({ isShow: false, state: 2 }); // Cancelled
                return true;
            } catch (error) {
                console.error('❌ Error cancelling call:', error);
                return false;
            }
        },

        setCallInfo(callInfo: Partial<typeof this.callInfo>) {
            this.callInfo = { ...this.callInfo, ...callInfo };
        },

        /* ---------------- Conversation Management ---------------- */
        async deleteAllConversations(params?: { isAlsoDeleteServerConversation?: boolean }) {
            console.log('🗑️ Deleting all conversations...', params);

            const config = {
                isAlsoDeleteServerConversation: params?.isAlsoDeleteServerConversation ?? true
            };

            try {
                // Delete all conversations from ZIM SDK
                await zim.deleteAllConversation(config);

                // Clear local state
                this.convList = [];
                this.convMap.clear();
                this.convInfo = {
                    conversationID: '',
                    conversationName: '',
                    conversationAvatarUrl: '',
                    type: 0,
                    unreadMessageCount: 0,
                    orderKey: 0,
                    notificationStatus: 0,
                    draft: '',
                    isDisabled: false,
                    lastMessage: null,
                    notice: '',
                    groupTitles: [],
                    receiptMsgID: '',
                    maxMsgOrderkey: 0,
                };
                this.msgList = [];
                this.totalUnreadMessageCount = 0;

                console.log('✅ All conversations deleted successfully');
                return true;
            } catch (e) {
                console.error('❌ Error deleting all conversations:', e);
                throw e;
            }
        },

        async deleteAllMessages() {
            console.log('🗑️ Deleting all messages...');

            try {
                // Delete all messages from current conversation
                if (this.convInfo.conversationID) {
                    await zim.deleteAllMessage(
                        this.convInfo.conversationID,
                        this.convInfo.type,
                        { isAlsoDeleteServerMessage: true }
                    );

                    // Clear local message list
                    this.msgList = [];
                    console.log('✅ All messages deleted successfully');
                } else {
                    console.log('⚠️ No active conversation to delete messages from');
                }

                return true;
            } catch (e) {
                console.error('❌ Error deleting all messages:', e);
                throw e;
            }
        },

        async clearConversationTotalUnreadMessageCount() {
            console.log('🧹 Clearing all unread message counts...');

            try {
                await zim.clearConversationTotalUnreadMessageCount();
                this.totalUnreadMessageCount = 0;
                console.log('✅ All unread message counts cleared');
                return true;
            } catch (e) {
                console.error('❌ Error clearing unread counts:', e);
                throw e;
            }
        },

        /* ---------------- ZIM Database Management ---------------- */
        async clearZIMLocalDatabase() {
            console.log('🧹 Clearing ZIM local database completely...');

            try {
                // First, logout to disconnect from ZIM
                if (this.isLogged) {
                    await zim.logout();
                    this.isLogged = false;
                }

                // Clear all local storage related to ZIM
                this.clearLocalCaches();

                // Clear IndexedDB (ZIM uses IndexedDB for local storage)
                if (typeof window !== 'undefined' && 'indexedDB' in window) {
                    try {
                        // List all databases and delete ZIM-related ones
                        const databases = await indexedDB.databases();
                        for (const db of databases) {
                            if (db.name && (db.name.includes('ZIM') || db.name.includes('zim'))) {
                                console.log(`🗑️ Deleting database: ${db.name}`);
                                indexedDB.deleteDatabase(db.name);
                            }
                        }
                    } catch (e) {
                        console.warn('⚠️ Could not clear IndexedDB:', e);
                    }
                }

                // Clear any remaining ZIM data
                if (typeof localStorage !== 'undefined') {
                    const keys = Object.keys(localStorage);
                    keys.forEach(key => {
                        if (key.toLowerCase().includes('zim') ||
                            key.includes('conversation') ||
                            key.includes('message')) {
                            localStorage.removeItem(key);
                        }
                    });
                }

                if (typeof sessionStorage !== 'undefined') {
                    const keys = Object.keys(sessionStorage);
                    keys.forEach(key => {
                        if (key.toLowerCase().includes('zim') ||
                            key.includes('conversation') ||
                            key.includes('message')) {
                            sessionStorage.removeItem(key);
                        }
                    });
                }

                // Reset all state
                this.$reset();

                console.log('✅ ZIM local database cleared completely');
                return true;
            } catch (e) {
                console.error('❌ Error clearing ZIM local database:', e);
                throw e;
            }
        },

        async forceClearAllData() {
            console.log('💥 Force clearing all data (ZIM + Backend)...');

            try {
                // Clear ZIM local database
                await this.clearZIMLocalDatabase();

                // Optionally clear backend data (uncomment if needed)
                // try {
                //     await conversationService.deleteAllConversations();
                //     console.log('✅ Backend conversations cleared');
                // } catch (e) {
                //     console.warn('⚠️ Could not clear backend conversations:', e);
                // }

                console.log('✅ All data cleared successfully');
                return true;
            } catch (e) {
                console.error('❌ Error force clearing all data:', e);
                throw e;
            }
        },
    },
});

/* -------- window wiring & global handlers -------- */
const globalConfig = { onLine: navigator.onLine };
window.addEventListener('online', () => (globalConfig.onLine = navigator.onLine));
window.addEventListener('offline', () => (globalConfig.onLine = navigator.onLine));

window.addEventListener('unhandledrejection', (ev: any) => {
    const error = ev.reason || {};
    ElMessage.error(`code: ${error.code}, message: ${error.message}`);
    if (error.code == 6000121 || error.code == 6000111) {
        const zimStore = store();
        zimStore.logout(false);
    }
});

export default store;

// @ts-ignore
window.zim = zim;
window.Long = Long;
// @ts-ignore
window.$store = store;

// Add convenience methods for debugging and clearing data
// @ts-ignore
window.clearAllConversations = () => store().deleteAllConversations();
// @ts-ignore
window.clearZIMDatabase = () => store().clearZIMLocalDatabase();
// @ts-ignore
window.forceClearAll = () => store().forceClearAllData();
// @ts-ignore
window.clearAllMessages = () => store().deleteAllMessages();

document.title = SDKVersion;
