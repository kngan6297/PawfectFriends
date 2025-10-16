import { ZIM } from 'zego-zim-web';

export function useZIM() {
    if (!ZIM.MessageType) {
        ZIM.MessageType = {
            Unknown: 0,
            Text: 1,
            Multiple: 10,
            Image: 11,
            File: 12,
            Audio: 13,
            Video: 14,
            Combine: 100,
            Custom: 200,
            Command: 2,
            Barrage: 20,
            System: 30,
            Revoke: 31,
            Tips: 32,
        };
        ZIM.MessageDirection = {
            Send: 0,
            Receive: 1,
        };
        ZIM.MessageSentStatus = {
            Sending: 0,
            Success: 1,
            Failed: 2,
        };
        ZIM.MessageReceiptStatus = {
            None: 0,
            Processing: 1,
            Done: 2,
            Expired: 3,
            Failed: 4,
        };
        ZIM.MessageRevokeStatus = {
            Unknown: -1,
            SelfRevoke: 0,
            SystemRevoke: 1,
            ServiceAPIRevoke: 2,
            GroupAdminRevoke: 3,
            GroupOwnerRevoke: 4,
            AuditRevoke: 5,
        };
        ZIM.ConnectionState = {
            Disconnected: 0,
            Connecting: 1,
            Connected: 2,
            Reconnecting: 3,
        };
        ZIM.ConnectionEvent = {
            Success: 0,
            ActiveLogin: 1,
            LoginTimeout: 2,
            LoginInterrupted: 3,
            KickedOut: 4,
            TokenExpired: 5,
            Unregistered: 6,
        };
        ZIM.GroupState = {
            Quit: 0,
            Enter: 1,
        };
        ZIM.GroupEvent = {
            Created: 1,
            Dismissed: 2,
            Joined: 3,
            Invited: 4,
            Left: 5,
            KickedOut: 6,
        };
        ZIM.RoomState = {
            Disconnected: 0,
            Connecting: 1,
            Connected: 2,
        };
        ZIM.CallUserState = {
            Unknown: -1,
            Inviting: 0,
            Accepted: 1,
            Rejected: 2,
            Cancelled: 3,
            Received: 5,
            Timeout: 6,
            Quit: 7,
            Ended: 8,
            NotYetReceived: 9,
            BeCancelled: 10,
        };
    }
}
