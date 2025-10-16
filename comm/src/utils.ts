import CryptoJS from 'crypto-js';

// Debug environment variables
console.log('🔍 Environment variables:', {
    VITE_ZEGO_APP_ID: import.meta.env.VITE_ZEGO_APP_ID,
    VITE_ZEGO_SERVER_SECRET: import.meta.env.VITE_ZEGO_SERVER_SECRET ? '***' : 'NOT_SET',
    VITE_ZEGO_APP_ID_TYPE: typeof import.meta.env.VITE_ZEGO_APP_ID,
    VITE_ZEGO_SERVER_SECRET_TYPE: typeof import.meta.env.VITE_ZEGO_SERVER_SECRET,
    ALL_ENV_VARS: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
});

// More robust environment variable handling
const appIDFromEnv = import.meta.env.VITE_ZEGO_APP_ID;
const serverSecretFromEnv = import.meta.env.VITE_ZEGO_SERVER_SECRET;

// Fallback: try to get from localStorage if env vars are not available
const fallbackAppID = localStorage.getItem('VITE_ZEGO_APP_ID');
const fallbackServerSecret = localStorage.getItem('VITE_ZEGO_SERVER_SECRET');

export const appConfig = {
    appID: appIDFromEnv ? parseInt(appIDFromEnv, 10) : (fallbackAppID ? parseInt(fallbackAppID, 10) : 0), // AppID from environment variable or fallback
    serverSecret: serverSecretFromEnv || fallbackServerSecret || '', // ServerSecret from environment variable or fallback
};

// Debug final config
console.log('🔍 Final appConfig:', {
    appID: appConfig.appID,
    serverSecret: appConfig.serverSecret ? '***' : 'NOT_SET',
    appIDFromEnv,
    serverSecretFromEnv: serverSecretFromEnv ? '***' : 'NOT_SET',
    windowZimConfig: (window as any).zimappconfig ? 'AVAILABLE' : 'NOT_AVAILABLE'
});

// Final validation
if (appConfig.appID === 0 || !appConfig.serverSecret) {
    console.error('❌ Zego configuration is still invalid after all fallbacks!');
    console.error('Please check your .env file or use the HTML fallback configuration.');
} else {
    console.log('✅ Zego configuration is valid and ready to use!');
    console.log('🔍 AppID:', appConfig.appID, 'Type:', typeof appConfig.appID);
    console.log('🔍 ServerSecret length:', appConfig.serverSecret.length);

    // Test if AppID is a valid number
    if (isNaN(appConfig.appID) || appConfig.appID <= 0) {
        console.error('❌ AppID is not a valid positive number!');
    } else {
        console.log('✅ AppID format is valid');
    }
}

// @ts-ignore Only for develop test
if ((window as any).zimappconfig) {
    console.log('🔧 Using Zego config from window.zimappconfig');
    Object.assign(appConfig, (window as any).zimappconfig);
}

// URL parameter override (for testing)
if (window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const urlAppID = params.get('a');
    const urlServerSecret = params.get('s');
    if (urlAppID) {
        appConfig.appID = Number(urlAppID);
        console.log('🔧 AppID overridden from URL parameter:', appConfig.appID);
    }
    if (urlServerSecret) {
        appConfig.serverSecret = urlServerSecret;
        console.log('🔧 ServerSecret overridden from URL parameter');
    }
}

export function generateToken(userID: string, seconds: number): string {
    if (!userID) throw new Error('generateToken error: params invalid.');

    const time = (Date.now() / 1000) | 0;
    const body = {
        user_id: String(userID),
        expire: time + Number(seconds || 7200),
        ctime: time,
        app_id: Number(appConfig.appID),
        nonce: (Math.random() * 2147483647) | 0,
    };

    const key = CryptoJS.enc.Utf8.parse(appConfig.serverSecret);
    let iv = Math.random().toString().substring(2, 18);
    if (iv.length < 16) iv += iv.substring(0, 16 - iv.length);

    const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(body), key, { iv: CryptoJS.enc.Utf8.parse(iv) }).toString();
    const ciphert = new Uint8Array(Array.from(atob(ciphertext)).map((val) => val.charCodeAt(0)));
    const len_ciphert = ciphert.length;

    const uint8 = new Uint8Array(8 + 2 + 16 + 2 + len_ciphert);
    // expire: 8
    uint8.set([0, 0, 0, 0]);
    uint8.set(new Uint8Array(new Int32Array([body.expire]).buffer).reverse(), 4);
    // iv length: 2
    uint8[8] = iv.length >> 8;
    uint8[9] = iv.length - (uint8[8] << 8);
    // iv: 16
    uint8.set(new Uint8Array(Array.from(iv).map((val) => val.charCodeAt(0))), 10);
    // ciphertext length: 2
    uint8[26] = len_ciphert >> 8;
    uint8[27] = len_ciphert - (uint8[26] << 8);
    // ciphertext
    uint8.set(ciphert, 28);

    const token = `04${btoa(String.fromCharCode(...Array.from(uint8)))}`;

    // @ts-ignore
    window.zimtoken = token;
    console.log('generateToken', token, body);

    return token;
}

function decodeToken(token: string, secret: string): string {
    const key = CryptoJS.enc.Utf8.parse(secret || appConfig.serverSecret);

    const uint8 = Array.from(atob(token.substring(2))).map((val) => val.charCodeAt(0));
    const iv = u82Word(uint8.slice(10, 26));
    const ciphertext = btoa(String.fromCharCode(...uint8.slice(28)));
    const body = CryptoJS.AES.decrypt(ciphertext, key, { iv }).toString(CryptoJS.enc.Utf8);

    console.log('decodeToken', body);

    function u82Word(u8arr: number[]): CryptoJS.lib.WordArray {
        const sigBytes = u8arr.length;
        const words: number[] = [];
        for (let i = 0; i < sigBytes; i++) {
            words[i >>> 2] |= (u8arr[i] & 0xff) << (24 - (i % 4) * 8);
        }

        return CryptoJS.lib.WordArray.create(words, sigBytes);
    }

    return JSON.parse(body);
}

// @ts-ignore
window.generateToken = generateToken;
// @ts-ignore
window.decodeToken = decodeToken;

// Function to manually set Zego configuration (for debugging)
export function setZegoConfig(appID: number, serverSecret: string) {
    appConfig.appID = appID;
    appConfig.serverSecret = serverSecret;

    // Also save to localStorage as fallback
    localStorage.setItem('VITE_ZEGO_APP_ID', appID.toString());
    localStorage.setItem('VITE_ZEGO_SERVER_SECRET', serverSecret);

    console.log('✅ Zego configuration manually set:', { appID, serverSecret: '***' });
}

// @ts-ignore
window.setZegoConfig = setZegoConfig;

// Utils
export const maincolor = '#409eff';
export const avatarPrefix = '/avatars/';
export const avatarOptions = [
    { label: 'mario.jpg', value: 'mario.jpg' },
    // { label: '2.jpeg', value: '2.jpeg' },
    // { label: '3.jpeg', value: '3.jpeg' },
    // { label: '4.jpeg', value: '4.jpeg' },
    // { label: '5.jpeg', value: '5.jpeg' },
];
export function formatTime(time: number, isSecond?: boolean) {
    if (!time) return 0;
    return isSecond ? new Date(time).toLocaleString().slice(-8) : new Date(time).toLocaleString().slice(5, -3);
}

/**
 * Normalize display name by removing sequence numbers and debug info
 * Removes patterns like "(5)", "(123)", etc. from the end of names
 */
export function normalizeDisplayName(name: string): string {
    if (!name) return 'User';

    // Remove sequence numbers like (5), (123), etc. from the end
    const cleaned = name.replace(/\(\d+\)$/, '');

    // If it's a valid ObjectId (24 hex chars), show as "User"
    if (/^[0-9a-fA-F]{24}$/.test(cleaned)) {
        return 'User';
    }

    // Return cleaned name or fallback
    return cleaned || 'User';
}
export const onlineStatusType = ['Online', 'Offline', 'Logout'];

// Call
export const callModeMap = ['General', 'Advanced'];
export const callStateMap = ['', 'Started', 'Ended'];
export const callUserStateMap: any = {
    '-1': 'Unknown',
    0: 'Inviting',
    1: 'Accepted',
    2: 'Rejected',
    3: 'Cancelled',
    5: 'Received',
    6: 'Timeout',
    7: 'Quit',
    8: 'Ended',
    9: 'NoReceived',
    10: 'BeCancelled',
};
export function callUserTagType(state: number, caller: boolean): any {
    return caller ? 'success' : state == 2 || state == 3 || state == 6 ? 'danger' : '';
}

// Conv
const tipsMsgEvent: any = {
    1: 'Created',
    2: 'Dismissed',
    3: 'Joined',
    4: 'Invited',
    5: 'Left',
    6: 'KickedOut',
    7: 'GroupInfo',
    8: 'MemberInfo',
};
const tipsMsgChangeType: any = {
    1: 'GroupData',
    2: 'GroupNotice',
    3: 'GroupName',
    4: 'GroupAvatarUrl',
    5: 'GroupMute',
    10: 'GroupOwnerTransferred',
    11: 'MemberRole',
    12: 'MemberMute',
};
export const getTipsMsg = (msg: any) => {
    const event = msg.changeInfo ? tipsMsgChangeType[msg.changeInfo.type] : tipsMsgEvent[msg.event];
    return `${event}, ${msg.operatedUser?.userID || ''}`;
};

// Application
export const groupAapplicationTypes = ['Join', 'Invite', 'BeInvite'];
export const applicationStates = ['Waiting', 'Accepted', 'Rejected', 'Expired', 'Disabled'];
