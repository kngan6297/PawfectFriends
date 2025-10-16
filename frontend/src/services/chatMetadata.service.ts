import { api } from './api';
import { ChatConversationMetadata } from '../types/chat';

/**
 * Chat Metadata Service
 * 
 * NOTE: This service is deprecated. Use ZIM SDK directly for conversation metadata.
 * The backend endpoints for chat metadata do not exist.
 * 
 * All methods have been removed as they were calling non-existent endpoints.
 */
export class ChatMetadataService {
    private static instance: ChatMetadataService;

    private constructor() { }

    public static getInstance(): ChatMetadataService {
        if (!ChatMetadataService.instance) {
            ChatMetadataService.instance = new ChatMetadataService();
        }
        return ChatMetadataService.instance;
    }

    // All methods removed - use ZIM SDK directly for conversation metadata
}

/**
 * React hook for chat metadata service
 * @deprecated Use ZIM SDK directly for conversation metadata
 */
export const useChatMetadata = () => {
    console.warn('⚠️ useChatMetadata: This hook is deprecated. Use ZIM SDK directly for conversation metadata.');

    // Return empty object since all methods are deprecated
    return {};
};

export default ChatMetadataService;
