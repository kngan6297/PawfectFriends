import { Pet } from "@/types/pet";

interface RecommendationSession {
    id: string;
    timestamp: number;
    preferences: any;
    pets: Pet[];
    name?: string;
    feedback?: {
        petId: string;
        reason: string;
        details?: string;
    }[];
}

const STORAGE_KEY = 'pawfect_recommendation_history';
const MAX_SESSIONS = 10; // Keep last 10 sessions

export class RecommendationHistoryService {
    private static getStoredSessions(): RecommendationSession[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error reading recommendation history:', error);
            return [];
        }
    }

    private static saveSessions(sessions: RecommendationSession[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        } catch (error) {
            console.error('Error saving recommendation history:', error);
        }
    }

    static saveSession(preferences: any, pets: Pet[], name?: string): string {
        const sessions = this.getStoredSessions();
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const newSession: RecommendationSession = {
            id: sessionId,
            timestamp: Date.now(),
            preferences,
            pets,
            name,
        };

        // Add new session to the beginning
        sessions.unshift(newSession);

        // Keep only the last MAX_SESSIONS
        if (sessions.length > MAX_SESSIONS) {
            sessions.splice(MAX_SESSIONS);
        }

        this.saveSessions(sessions);
        return sessionId;
    }

    static getSessions(): RecommendationSession[] {
        return this.getStoredSessions();
    }

    static getSession(sessionId: string): RecommendationSession | null {
        const sessions = this.getStoredSessions();
        return sessions.find(session => session.id === sessionId) || null;
    }

    static addFeedback(sessionId: string, petId: string, reason: string, details?: string): void {
        const sessions = this.getStoredSessions();
        const sessionIndex = sessions.findIndex(session => session.id === sessionId);

        if (sessionIndex !== -1) {
            if (!sessions[sessionIndex].feedback) {
                sessions[sessionIndex].feedback = [];
            }

            sessions[sessionIndex].feedback!.push({
                petId,
                reason,
                details,
            });

            this.saveSessions(sessions);
        }
    }

    static clearHistory(): void {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing recommendation history:', error);
        }
    }

    static hasHistory(): boolean {
        const sessions = this.getStoredSessions();
        return sessions.length > 0;
    }

    static formatTimestamp(timestamp: number): string {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            const hours = Math.floor(diffInHours);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInHours / 24);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    }
} 