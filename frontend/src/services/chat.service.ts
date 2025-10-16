// Simple stub types for chat service
interface ChatMessage {
    id: string;
    chatId: string;
    senderId: string;
    type: string;
    content: string;
    timestamp: string;
    read: boolean;
}

interface ChatConversation {
    id: string;
    participants: any[];
    type: string;
}

/**
 * CHAT SERVICE - COMMUNICATION INTEGRATION
 * 
 * This service now redirects users to the integrated communication center
 * where they can use the full ZIM SDK functionality.
 */

// Redirect to communication center
const redirectToCommunication = () => {
    window.location.href = '/communication';
};

// Stub methods that redirect to communication center
export const chatService = {
    // Create chat - redirects to communication center
    createChat: async (participantId: string, currentUserId: string, initialMessage?: string) => {
        console.log('Redirecting to communication center for chat creation');
        redirectToCommunication();
        return { id: 'redirected', participantId, currentUserId, initialMessage };
    },

    // Send message - redirects to communication center
    sendMessage: async (chatId: string, message: string, type = 'text', attachments?: any[]) => {
        console.log('Redirecting to communication center to send message');
        redirectToCommunication();
        return { id: 'redirected', chatId, message, type, attachments };
    },

    // Get chat messages - redirects to communication center
    getChatMessages: async (chatId: string, limit = 50, beforeMessageId?: string) => {
        console.log('Redirecting to communication center to view messages');
        redirectToCommunication();
        return { messages: [], hasMore: false };
    },

    // Get chat conversations - redirects to communication center
    getChatConversations: async (userId: string) => {
        console.log('Redirecting to communication center to view conversations');
        redirectToCommunication();
        return [];
    },

    // Mark message as read - redirects to communication center
    markMessageAsRead: async (chatId: string, messageIds: string[]) => {
        console.log('Redirecting to communication center to mark messages as read');
        redirectToCommunication();
        return { success: true };
    },

    // Check if ZIM is enabled - always true since we're using ZIM via iframe
    isZIMEnabled: (chat: any) => true,

    // Get pending ZIM message - not applicable with iframe approach
    getPendingZimMessage: (chatId: string) => null,

    // Open communication center
    openCommunication: () => {
        redirectToCommunication();
    }
};

export default chatService; 