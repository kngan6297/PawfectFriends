// src/services/zimAdapter.ts
export type ZIMAdapter = {
    on: (ev: string, cb: (...args: any[]) => void) => void;
    off: (ev: string, cb?: (...args: any[]) => void) => void;
    login: (userID: string, userName: string, token: string) => Promise<void>;
    logout: () => Promise<void>;
    renewToken?: (token: string) => Promise<void>;
    sendText: (conversationID: string, conversationType: 'peer' | 'group', text: string) => Promise<any>;
    queryHistory: (conversationID: string, conversationType: 'peer' | 'group', count: number, nextMsg?: string) => Promise<{ messageList: any[] }>;
    markAsRead: (conversationID: string, conversationType: 'peer' | 'group', messageIDs?: string[]) => Promise<void>;
    typing: (conversationID: string, conversationType: 'peer' | 'group', isTyping: boolean) => Promise<void>;
    createGroup: (groupName: string, userIDs: string[]) => Promise<any>;
    joinGroup: (groupID: string) => Promise<any>;
    destroy?: () => void;
    simulateTokenExpiration?: () => void; // For testing purposes
};

export async function createZIMAdapter(): Promise<ZIMAdapter> {
    let realZIM: any = null;
    try {
        const { ZIM } = await import('zego-zim-web');
        const appID = Number(import.meta.env.VITE_ZEGO_APP_ID || 0);
        if (!appID) throw new Error('Missing VITE_ZEGO_APP_ID');
        realZIM = ZIM.create({ appID });
    } catch {
        // fallback mock – reuse your MockZIMSDK 
        const { MockZIMSDK } = await import('@/mocks/MockZIMSDK'); // separate the Mock class into a separate file 
        const m = new MockZIMSDK();
        return {
            on: m.on.bind(m),
            off: m.off.bind(m),
            login: async (uid, name, token) => { await m.login(uid, { userName: name, token }); },
            logout: m.logout.bind(m),
            sendText: async (cid, ctype, text) => m.sendMessage({ message: text, toConversationID: cid, messageType: 1 }),
            queryHistory: async (cid, ctype, count, next) => m.queryHistoryMessage({ conversationID: cid, count, nextMessage: next }),
            markAsRead: async (cid, ctype, ids) => m.markConversationMessageAsRead({ conversationID: cid, messageIDList: ids }),
            typing: async (cid, ctype, isTyping) => m.sendTypingStatus({ conversationID: cid, isTyping }),
            createGroup: async (groupName, userIDs) => m.createGroup({ groupName, userIDs }),
            joinGroup: async (groupID) => m.joinGroup(groupID),
            destroy: () => { /* Mock destroy - no cleanup needed */ },
            simulateTokenExpiration: () => m.simulateTokenExpiration(),
        };
    }

    // Adapter for real ZIM (correct signature) 
    return {
        on: realZIM.on.bind(realZIM),
        off: realZIM.off?.bind(realZIM) ?? (() => { }),
        login: async (uid, name, token) => {
            await realZIM.login(uid, { token, userName: name, isOfflineLogin: false });
        },
        logout: async () => { await realZIM.logout(); },
        renewToken: async (token: string) => { await realZIM.renewToken(token); },
        sendText: async (cid, ctype, text) => {
            const message = { type: 1, message: text }; // 1: text 
            const convType = ctype === 'group' ? 2 : 0; // 2: group, 0: peer (ZIM) 
            const config = { priority: 2 };
            return realZIM.sendMessage(message, cid, convType, config);
        },
        queryHistory: async (cid, ctype, count, next) => {
            const convType = ctype === 'group' ? 2 : 0;
            return realZIM.queryHistoryMessage({ conversationID: cid, conversationType: convType, count, nextMessage: next });
        },
        markAsRead: async (cid, ctype, ids) => {
            const convType = ctype === 'group' ? 2 : 0;
            await realZIM.markConversationMessageAsRead({ conversationID: cid, conversationType: convType, messageIDList: ids });
        },
        typing: async (cid, ctype, isTyping) => {
            const convType = ctype === 'group' ? 2 : 0;
            await realZIM.sendTypingStatus({ conversationID: cid, conversationType: convType, isTyping });
        },
        createGroup: async (groupName, userIDs) => {
            return realZIM.createGroup({ groupName, userIDs });
        },
        joinGroup: async (groupID) => {
            return realZIM.joinGroup({ groupID });
        },
        destroy: () => {
            // Check if ZIM has a destroy method (ZIM.destroy)
            if (typeof realZIM.destroy === 'function') {
                realZIM.destroy();
            } else if (typeof (realZIM as any).ZIM?.destroy === 'function') {
                (realZIM as any).ZIM.destroy();
            }
            // If no destroy method exists, just log it
            console.log("ℹ️ ZIM SDK destroy method not found - cleanup handled by logout");
        },
        simulateTokenExpiration: () => {
            // Real ZIM doesn't need simulation - it handles token expiration automatically
            console.log("ℹ️ Real ZIM SDK handles token expiration automatically");
        },
    };
}
