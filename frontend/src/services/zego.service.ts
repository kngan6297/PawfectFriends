import { api } from './api';
import { ZegoCallData, ZegoTokenResponse, CallStartData, CallEndData } from '@/types/call';

export const zegoService = {
    // Generate token for voice/video call - Use unified RTC endpoint
    async generateToken(roomID: string, privilege: number = 1, userId?: string): Promise<ZegoTokenResponse> {
        try {
            if (!userId) {
                throw new Error('userId is required for token generation');
            }

            const response = await api.post('/api/rtc/token', {
                type: 'rtc',
                userId: userId,
                roomId: roomID,
                ttl: 7200, // Default 2 hours
            });
            return response.data.data;
        } catch (error) {
            console.error('Failed to generate Zego token:', error);
            throw error;
        }
    },

    // Join voice/video call room - Use Zego SDK directly instead of backend
    async joinRoom(roomID: string, token: string): Promise<any> {
        console.warn('⚠️ joinRoom: This method is deprecated. Use Zego SDK directly for room operations.');
        // Return mock data since the backend endpoint doesn't exist
        return {
            roomID,
            success: true,
            message: 'Use Zego SDK directly for room operations'
        };
    },

    // Leave voice/video call room - Use Zego SDK directly instead of backend
    async leaveRoom(roomID: string): Promise<void> {
        console.warn('⚠️ leaveRoom: This method is deprecated. Use Zego SDK directly for room operations.');
        // No backend call needed - use Zego SDK logoutRoom() method
    },

    // Get room statistics - Use Zego SDK directly instead of backend
    async getRoomStats(roomID: string): Promise<any> {
        console.warn('⚠️ getRoomStats: This method is deprecated. Use Zego SDK directly for room statistics.');
        // Return mock data since the backend endpoint doesn't exist
        return {
            roomID,
            participantCount: 0,
            messageCount: 0,
            lastActivity: new Date().toISOString()
        };
    },

    // Start voice/video call - Use Zego SDK directly instead of backend
    async startCall(data: CallStartData): Promise<ZegoCallData> {
        console.warn('⚠️ startCall: This method is deprecated. Use Zego SDK directly for call operations.');
        // Return mock data since the backend endpoint doesn't exist
        return {
            roomID: `room_${Date.now()}`,
            token: 'mock-token',
            userID: 'currentUser',
            userName: 'User',
            appID: 0,
            server: 'mock-server'
        };
    },

    // End voice/video call - Use Zego SDK directly instead of backend
    async endCall(data: CallEndData): Promise<void> {
        console.warn('⚠️ endCall: This method is deprecated. Use Zego SDK directly for call operations.');
        // No backend call needed - use Zego SDK logoutRoom() method
    },
}; 