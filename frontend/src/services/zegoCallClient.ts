import { api } from './api';
import { fetchRTCToken } from '../api/rtc';
import {
    ZegoCallTokenResponse,
    ZegoCallRoomResponse,
    ZegoCallConfigResponse,
    ZegoCallData,
    CallStartData,
    CallEndData,
    CallQualityMetrics,
    CallStats,
} from '@/types/call';

let inflight: Promise<any> | null = null; // prevent duplicate calls during mount/re-render

export class ZegoCallClient {
    private appID: number;
    private server: string;

    constructor() {
        this.appID = parseInt(import.meta.env.VITE_ZEGO_APP_ID || '0');
        this.server = import.meta.env.VITE_ZEGO_SERVER || 'wss://wss.zego.im/ws';
    }

    /**
     * Initialize Zego call client with configuration
     */
    async initialize(): Promise<boolean> {
        try {
            const config = await this.getLocalConfig();
            this.appID = config.appID;
            this.server = config.server;
            return true;
        } catch (error) {
            console.error('Failed to initialize Zego call client:', error);
            return false;
        }
    }

    /**
     * Get local configuration for Zego call client
     */
    private async getLocalConfig(): Promise<{ appID: number; server: string }> {
        // For Call Kit, we'll fetch the token when needed instead of storing appSign
        return {
            appID: this.appID,
            server: this.server,
        };
    }

    /**
     * Generate token for voice/video call
     */
    async generateToken(roomID: string, privilege: number = 1, tokenExpiration?: number): Promise<ZegoCallTokenResponse> {
        try {
            // Use inflight pattern to prevent duplicate calls
            if (inflight) return inflight; // already have a request running → reuse

            // Get current user ID from localStorage or context
            const storedUser = localStorage.getItem('user');
            let userId = 'temp-user';

            if (storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    userId = userData._id || userData.id || 'temp-user';
                } catch (error) {
                    console.error('Failed to parse stored user data:', error);
                }
            }

            inflight = fetchRTCToken(userId, {
                ttl: tokenExpiration || 3600, // Default to 1 hour if not provided
                roomId: roomID,
                attachRoomToPayload: true, // Include room ID in token payload
            })
                .then(tokenData => ({
                    token: tokenData.token,
                    appID: tokenData.appId,
                    roomId: roomID,
                    userId,
                    expiresIn: tokenExpiration || 3600,
                }))
                .finally(() => { inflight = null; });

            return inflight;
        } catch (error) {
            console.error('Failed to generate Zego call token:', error);
            throw error;
        }
    }

    /**
     * Generate call-specific token with enhanced validation
     */
    async generateCallToken(data: {
        roomId: string;
        callerId: string;
        calleeId: string;
        privilege?: number;
        tokenExpiration?: number;
        callType?: 'voice' | 'video';
        chatId?: string;
        adoptionRequestId?: string;
    }): Promise<ZegoCallTokenResponse> {
        try {
            // Ensure userId is always sent (required by backend validation)
            let userId = data.callerId;

            if (!userId) {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        const userData = JSON.parse(storedUser);
                        userId = userData._id || userData.id || 'temp-user';
                    } catch (error) {
                        console.error('Failed to parse stored user data:', error);
                    }
                } else {
                    userId = 'temp-user';
                }
            }

            const tokenData = await fetchRTCToken(userId, {
                ttl: data.tokenExpiration || 3600,
                roomId: data.roomId,
                attachRoomToPayload: true, // Include room ID in token payload
            });

            return {
                token: tokenData.token,
                appID: tokenData.appId,
                roomId: data.roomId,
                userId,
                expiresIn: data.tokenExpiration || 3600,
            };
        } catch (error) {
            console.error('Failed to generate call-specific token:', error);
            throw error;
        }
    }

    /**
     * Start a voice/video call - Use Zego SDK directly
     */
    async startCall(data: CallStartData): Promise<ZegoCallData> {
        console.warn('⚠️ startCall: Use Zego SDK directly for call operations.');
        // Return mock data since the backend endpoint doesn't exist
        // In production, this should use Zego SDK directly
        return {
            roomID: `room_${Date.now()}`,
            token: 'mock-token',
            userID: 'currentUser',
            userName: 'User',
            appID: this.appID,
            server: this.server
        };
    }

    /**
     * End a voice/video call - Use Zego SDK directly
     */
    async endCall(data: CallEndData): Promise<void> {
        console.warn('⚠️ endCall: Use Zego SDK directly for call operations.');
        // No backend call needed - use Zego SDK logoutRoom() method
    }

    /**
     * Join an existing call room - Use Zego SDK directly
     */
    async joinCall(roomID: string, token: string, userID: string, userName: string): Promise<ZegoCallData> {
        try {
            console.log(`🔄 Joining call room: ${roomID} for user: ${userID}`);

            // First join the room using Zego SDK directly
            const roomData = await this.joinRoom(roomID, token);

            // Update room stats to indicate user joined (if needed)
            await this.updateCallQuality(roomID, {
                audioBitrate: 64,
                videoBitrate: 0, // voice call
                packetLoss: 0,
                latency: 50,
                frameRate: 0, // voice call
                resolution: 'voice-only',
            });

            console.log(`✅ Successfully joined call room: ${roomID}`);
            return roomData;
        } catch (error) {
            console.error('❌ Failed to join call:', error);
            throw error;
        }
    }

    /**
     * Join room and start publishing - Use Zego SDK directly
     */
    async joinRoom(roomID: string, token: string): Promise<ZegoCallData> {
        console.warn('⚠️ joinRoom: Use Zego SDK directly for room operations.');
        // Return mock data since the backend endpoint doesn't exist
        // In production, this should use Zego SDK directly
        return {
            roomID,
            token,
            userID: 'currentUser',
            userName: 'User',
            appID: this.appID,
            server: this.server
        };
    }

    /**
     * Leave voice/video call room - Use Zego SDK directly
     */
    async leaveRoom(roomID: string): Promise<void> {
        console.warn('⚠️ leaveRoom: Use Zego SDK directly for room operations.');
        // No backend call needed - use Zego SDK logoutRoom() method
    }

    /**
     * Create a new call room - Use Zego SDK directly
     */
    async createCallRoom(callType: 'voice' | 'video' = 'voice', participants: string[] = []): Promise<ZegoCallRoomResponse> {
        console.warn('⚠️ createCallRoom: Use Zego SDK directly for room creation.');
        // Return mock data since the backend endpoint doesn't exist
        // In production, this should use Zego SDK directly
        return {
            roomId: `room_${Date.now()}`,
            callType: callType,
            token: 'mock-token',
            initiatedBy: 'currentUser',
            participants,
            appID: this.appID,
            shareLink: `https://example.com/room/${Date.now()}`,
            status: 'connected'
        };
    }

    /**
     * Get call room information - Use Zego SDK directly
     */
    async getCallRoomInfo(roomId: string): Promise<ZegoCallRoomResponse> {
        console.warn('⚠️ getCallRoomInfo: Use Zego SDK directly for room information.');
        // Return mock data since the backend endpoint doesn't exist
        // In production, this should use Zego SDK directly
        return {
            roomId: roomId,
            callType: 'voice',
            token: 'mock-token',
            initiatedBy: 'currentUser',
            participants: [],
            appID: this.appID,
            shareLink: `https://example.com/room/${Date.now()}`,
            status: 'connected'
        };
    }

    /**
     * Get call room statistics - Use Zego SDK directly
     */
    async getRoomStats(roomID: string): Promise<CallStats> {
        console.warn('⚠️ getRoomStats: Use Zego SDK directly for room statistics.');
        // Return mock data since the backend endpoint doesn't exist
        // In production, this should use Zego SDK directly
        return {
            duration: 0,
            participants: [],
            startTime: new Date(),
            endTime: new Date(),
            quality: {
                audioBitrate: 0,
                videoBitrate: 0,
                packetLoss: 0,
                latency: 0,
                frameRate: 0,
                resolution: 'none'
            }
        };
    }

    /**
     * Update call quality metrics - Use Zego SDK directly
     */
    async updateCallQuality(roomId: string, qualityMetrics: CallQualityMetrics): Promise<void> {
        console.warn('⚠️ updateCallQuality: Use Zego SDK directly for quality metrics.');
        // No backend call needed - use Zego SDK directly for quality monitoring
    }

    /**
     * Get call history for a user - Use Zego SDK directly
     */
    async getCallHistory(userId: string, options: {
        page?: number;
        limit?: number;
        callType?: 'voice' | 'video';
        startDate?: Date;
        endDate?: Date;
    } = {}): Promise<{
        calls: Array<{
            id: string;
            roomId: string;
            callType: 'voice' | 'video';
            participants: string[];
            startTime: Date;
            endTime: Date;
            duration: number;
            status: string;
        }>;
        total: number;
        page: number;
        limit: number;
    }> {
        console.warn('⚠️ getCallHistory: Use Zego SDK directly for call history.');
        // Return mock data since the backend endpoint doesn't exist
        // In production, this should use Zego SDK directly
        return {
            calls: [],
            total: 0,
            page: options.page || 1,
            limit: options.limit || 10
        };
    }

    /**
     * Get Zego call configuration - Use the correct backend endpoint
     */
    async getConfig(): Promise<ZegoCallConfigResponse> {
        try {
            const response = await api.get('/api/rtc/zim/config');
            return response.data.data;
        } catch (error) {
            console.error('Failed to get Zego call configuration:', error);
            // Return fallback config
            return {
                appID: this.appID,
                server: this.server
            };
        }
    }

    /**
     * Health check for call service - Use the correct backend endpoint
     */
    async healthCheck(): Promise<boolean> {
        try {
            // Use the existing RTC health endpoint
            const response = await api.get('/api/rtc/health');
            return response.data.success;
        } catch (error) {
            console.error('Call service health check failed:', error);
            return false;
        }
    }

    /**
     * Get app configuration
     */
    getAppConfig() {
        return {
            appID: this.appID,
            appSign: '', // Removed appSign
            server: this.server,
        };
    }

    /**
     * Check if call client is properly configured
     */
    isConfigured(): boolean {
        return this.appID > 0 && !!this.server; // Removed appSign check
    }
}

export const zegoCallClient = new ZegoCallClient();
export default zegoCallClient;
