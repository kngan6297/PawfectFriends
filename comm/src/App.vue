<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import ZIMLayout from './components/ZIMLayout.vue';
import ZIMLogin from './components/ZIMLogin.vue';
import { authService } from './services/auth.service';
import { petService } from './services/pet.service';
import { conversationService } from './services/conversation.service';
import { userService } from './services/user.service';
import { getIntegrationConfig } from './config/integration';

import useStore, { zim, ZIM } from './store/index';

const zimStore = useStore();
const isLogged = ref(false);
const locale = computed(() => zimStore.locale);

// Auto-greeting lock mechanism
const greetingLocks = ref<Record<string, boolean>>({});
const isHandlingUrlParameters = ref(false);

// Function to check if greeting has already been sent for a conversation
const hasGreetingBeenSent = (conversationId: string): boolean => {
    // Check in-memory lock
    if (greetingLocks.value[conversationId]) {
        return true;
    }
    
    // Check persistent storage
    const sentGreetings = JSON.parse(localStorage.getItem('pawfect-sent-greetings') || '[]');
    return sentGreetings.includes(conversationId);
};

// Function to mark greeting as sent
const markGreetingAsSent = (conversationId: string): void => {
    // Set in-memory lock
    greetingLocks.value[conversationId] = true;
    
    // Set persistent storage
    const sentGreetings = JSON.parse(localStorage.getItem('pawfect-sent-greetings') || '[]');
    if (!sentGreetings.includes(conversationId)) {
        sentGreetings.push(conversationId);
        localStorage.setItem('pawfect-sent-greetings', JSON.stringify(sentGreetings));
    }
    
    console.log('🔒 Greeting marked as sent for conversation:', conversationId);
};

// Function to send auto-greeting message to group conversation
const sendAutoGreeting = async (conversationId: string, petData: any) => {
    try {
        // Check if greeting has already been sent for this conversation
        if (greetingLocks.value[conversationId]) {
            console.log('🚫 Auto-greeting already sent for conversation:', conversationId);
            return;
        }

        // Check localStorage prevention (same as store logic)
        const GREET_KEY = (gid: string) => `greeted_${gid}`;
        if (localStorage.getItem(GREET_KEY(conversationId))) {
            console.log('🚫 Auto-greeting already sent (localStorage check):', conversationId);
            return;
        }

        // Check if conversation has messages (same as store logic)
        try {
            const r = await zim.queryHistoryMessage(conversationId, 2, { count: 1, reverse: false });
            if ((r.messageList?.length ?? 0) > 0) {
                console.log('🚫 Auto-greeting skipped - conversation has existing messages:', conversationId);
                return;
            }
        } catch (error) {
            console.warn('⚠️ Could not check message history for greeting prevention:', error);
        }
        
        // Set lock to prevent spam
        greetingLocks.value[conversationId] = true;
        console.log('🔒 Auto-greeting lock set for conversation:', conversationId);
        
        // Get pet name for greeting
        const petName = petData?.name || 'this pet';
        
        // Create greeting message
        const greetingMessage = {
            type: 1, // Text message
            message: `Hello! I'm interested in adopting ${petName}. Could you tell me more about them?`,
            extendedData: JSON.stringify({
                petId: petData?.id || '',
                petName: petName,
                type: 'adoption_inquiry',
                timestamp: Date.now(),
                isAutoGreeting: true
            })
        };
        
        // Send message to the group conversation
        const config = { priority: 1 }; // Normal priority
        const notification = { onMessageAttached: () => {} };
        
        // DEBUG LOG 4: Log convID being used to send greeting
        console.log('When sending greeting: convID being used:', {
            conversationId,
            petId: petData?.id || 'unknown',
            petName: petData?.name || 'unknown',
            messageType: 'auto-greeting'
        });
        
        console.log('📤 Sending auto-greeting to group conversation:', conversationId);
        await zim.sendMessage(greetingMessage, conversationId, 2, config, notification); // 2 = group conversation
        
        // Mark as greeted in localStorage (same as store logic)
        localStorage.setItem(GREET_KEY(conversationId), '1');
        
        // Mark as greeted in backend
        try {
            const config = getIntegrationConfig();
            const authService = (await import('./services/auth.service')).authService;
            const token = authService.getAuthToken();
            
            if (token) {
                await fetch(`${config.apiBaseUrl}/conversations/mark-greeted`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ conversationId: conversationId })
                });
                console.log('✅ Marked as greeted in backend');
            }
        } catch (backendError) {
            console.warn('⚠️ Failed to mark as greeted in backend:', backendError);
        }
        
        console.log('✅ Auto-greeting sent successfully');
        
        // Wait a moment for the message to be processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Query conversation list again to get the updated list with the new message
        await zimStore.queryConversationList();
        
        // DEBUG LOG: Check if conversation appears after greeting
        const postGreetingResult = await zim.queryConversationList({ count: 1000 });
        const convAfterGreeting = postGreetingResult.conversationList.find((conv: any) => conv.conversationID === conversationId);
        
        console.log('After sending greeting: queryConversationList result:', {
            totalConversations: postGreetingResult.conversationList.length,
            conversationId,
            convAfterGreeting: !!convAfterGreeting,
            convDetails: convAfterGreeting ? {
                id: convAfterGreeting.conversationID,
                type: convAfterGreeting.type,
                name: convAfterGreeting.conversationName,
                hasLastMessage: !!convAfterGreeting.lastMessage
            } : null
        });
        
        console.log('✅ Conversation list updated after auto-greeting');
        
    } catch (error) {
        console.error('❌ Error sending auto-greeting:', error);
        // Reset lock on error
        greetingLocks.value[conversationId] = false;
    }
};

// Function to handle URL parameters for automatic conversation creation
const handleUrlParameters = async () => {
    // Global lock to prevent multiple simultaneous calls
    if (isHandlingUrlParameters.value) {
        console.log('🚫 URL parameters already being handled, skipping duplicate call');
        return;
    }
    
    isHandlingUrlParameters.value = true;
    
    try {
        // Get petId and shelterId from URL parameters (not localStorage)
        const urlParams = new URLSearchParams(window.location.search);
        const petId = urlParams.get('petId');
        const shelterId = urlParams.get('shelterId');
        
        if (!petId || !shelterId) {
            console.log('⚠️ Missing petId or shelterId in URL parameters, skipping URL parameter handling');
            return;
        }
        
        console.log('🚀 Auto-creating conversation with shelter:', { petId, shelterId });
        
        // Check if ZIM is properly logged in
        if (!zimStore.isLogged) {
            console.log('⏳ Waiting for ZIM login to complete...');
            // Wait for login to complete
            let attempts = 0;
            while (!zimStore.isLogged && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
            
            if (!zimStore.isLogged) {
                console.error('❌ ZIM login timeout, cannot proceed with conversation creation');
                return;
            }
        }
        
        console.log('✅ ZIM login verified, proceeding with conversation setup');
        
        try {
            // Wait a bit for the store to be fully initialized
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 1. Call backend ensure endpoint to get/create conversation
            console.log('📞 Calling backend ensure conversation endpoint...');
            
            // Get current user ID for logging
            const userId = await conversationService.getCurrentUserIdPublic();
            
            const conversation = await conversationService.ensureShelterConversation(shelterId);
            
            if (!conversation) {
                console.error('❌ Failed to ensure conversation in backend');
                return;
            }
            
            // 2. Get ZIM conversation ID from backend response (use new short zimGroupId)
            const zimConversationId = (conversation as any).zimGroupId || conversation.zim?.groupId || conversation.conversationId || conversation.id;
            const shouldGreet = (conversation as any).shouldGreet;
            
            // DEBUG LOG 1: Log ensure -> db conv details
            console.log('ensure -> db conv', { 
                userId, 
                shelterId, 
                petId, 
                zimConversationId,
                backendId: conversation.id,
                zimGroupId: (conversation as any).zimGroupId,
                oldZimGroupId: conversation.zim?.groupId
            });
            
            console.log('✅ Backend conversation ensured:', {
                id: conversation.id,
                conversationId: conversation.conversationId,
                zimGroupId: (conversation as any).zimGroupId,
                oldZimGroupId: conversation.zim?.groupId,
                participants: conversation.participants
            });
            
            // 3. For group conversations, we need to ensure the group exists in ZIM
            // The conversation should already exist as a group conversation
            console.log('🔍 Group conversation with shelter:', zimConversationId);
            
            // Get pet and shelter information for display
            let petData = null;
            let shelterData = null;
            
            try {
                petData = await petService.getPetById(petId);
                console.log('✅ Pet data fetched:', petData);
            } catch (error) {
                console.warn('⚠️ Could not fetch pet info:', error);
            }
            
            try {
                shelterData = await userService.getShelterProfile(shelterId);
                console.log('✅ Shelter data fetched:', shelterData);
            } catch (error) {
                console.warn('⚠️ Could not fetch shelter info:', error);
            }
            
            // 4. Ensure group conversation exists in ZIM
            const groupEnsured = await zimStore.ensureGroupConversation(zimConversationId, petData, shelterData, shouldGreet);
            
            if (!groupEnsured) {
                console.error('❌ Failed to ensure group conversation in ZIM');
                return;
            }
            
            console.log('✅ Group conversation ensured in ZIM');
            
            // 5. Query conversation list to get the updated list
            await zimStore.queryConversationList();
            
            // DEBUG LOG 3: Check if new conversation is in conversation list
            const conversationListResult = await zim.queryConversationList({ count: 1000 });
            const newConvInList = conversationListResult.conversationList.find((conv: any) => conv.conversationID === zimConversationId);
            
            console.log('After ensure: queryConversationList result:', {
                totalConversations: conversationListResult.conversationList.length,
                zimConversationId: zimConversationId,
                newConvInList: !!newConvInList,
                newConvDetails: newConvInList ? {
                    id: newConvInList.conversationID,
                    type: newConvInList.type,
                    name: newConvInList.conversationName
                } : null
            });
            
            console.log('🔍 Updated conversation list:');
            zimStore.convList.forEach((conv, index) => {
                console.log(`  ${index + 1}. ID: ${conv.conversationID}, Type: ${conv.type}, Name: ${conv.conversationName}`);
            });
            
            // 6. Select the correct conversation just ensured
            console.log('🎯 Selecting conversation with zimConversationId:', zimConversationId);
            
            // Set selection directly with zimConversationId and type 2 (group conversation)
            zimStore.updateConvInfo({ 
                conversationID: zimConversationId, 
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
            
            console.log('✅ Conversation selected:', { zimConversationId, type: 2 });
            
            // 7. Load messages for the selected conversation
            console.log('📨 Loading messages for group conversation...');
            await zimStore.queryHistoryMessage();
            console.log('✅ Messages loaded for group conversation');
            
            // 8. Send auto-greeting if needed (to make conversation appear in convList)
            await sendAutoGreeting(zimConversationId, petData);
            
            // 8. Clean up URL parameters
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('petId');
            newUrl.searchParams.delete('shelterId');
            window.history.replaceState({}, '', newUrl.toString());
            
            console.log('✅ URL parameters cleaned up');
            
        } catch (error) {
            console.error('❌ Error handling URL parameters:', error);
        }
    } catch (error) {
        console.error('❌ Error in handleUrlParameters:', error);
    } finally {
        // Always reset the global lock
        isHandlingUrlParameters.value = false;
        console.log('🔓 Global URL parameter handling lock released');
    }
};

// Check for existing authentication on mount
onMounted(() => {
    // Clear caches on first load after architecture change
    const architectureVersion = 'v2.0'; // Increment this when architecture changes
    const storedVersion = localStorage.getItem('pawfect-architecture-version');
    
    if (storedVersion !== architectureVersion) {
        console.log('🔄 Architecture change detected, clearing caches...');
        zimStore.clearLocalCaches();
        localStorage.setItem('pawfect-architecture-version', architectureVersion);
    }
    
    // Parse URL parameters for petId and shelterId
    const urlParams = new URLSearchParams(window.location.search);
    const petId = urlParams.get('petId');
    const shelterId = urlParams.get('shelterId');
    
    if (petId || shelterId) {
        console.log('🔍 URL parameters detected:', { petId, shelterId });
        // Store URL parameters for later use
        if (petId) localStorage.setItem('pawfect-pet-context', petId);
        if (shelterId) localStorage.setItem('pawfect-shelter-context', shelterId);
    }
    
    // Check for existing authentication
    
    // Listen for auth data from parent window
    const handleMessage = async (event: MessageEvent) => {
        // Received message from parent
        
        if (event.data && event.data.type === 'PAWFECT_AUTH_DATA') {
            // Clear any existing auth data first to prevent conflicts
            console.log('🧹 Clearing old auth data before processing new auth data');
            localStorage.removeItem('pawfect-friends-auth');
            sessionStorage.removeItem('ZIMDEMOUSER');
            
            // Clear any existing ZIM session to prevent "User has already logged in" error
            if (zimStore.isLogged) {
                console.log('🚪 Logging out existing ZIM session');
                zimStore.logout(false);
                isLogged.value = false;
            }
            
            // Store the new auth data in localStorage
            localStorage.setItem('pawfect-friends-auth', JSON.stringify(event.data.data));
            
            // Convert to ZIM user format and login
            try {
                const authData = event.data.data;
                const zimUser = {
                    userID: authData.userId,
                    userName: authData.userName,
                    userAvatar: authData.userAvatar
                };
                
                // Always perform ZIM login when we have auth data (zimStore.isLogged is just local state)
                console.log('🔐 Starting ZIM login for user:', zimUser.userName);
                await zimStore.login(zimUser);
                console.log('✅ ZIM login completed successfully');
                
                // Verify ZIM is actually ready by testing a simple API call
                try {
                    await zimStore.queryConversationList();
                    console.log('✅ ZIM API test successful, setting logged state');
                    isLogged.value = true;
                } catch (error) {
                    console.error('❌ ZIM API test failed, login not complete:', error);
                    // Don't set logged state if API test fails
                    return;
                }
                
                // Handle URL parameters after successful login
                handleUrlParameters();
            } catch (error) {
                console.error('❌ ZIM login failed:', error);
                // Don't set logged state on error - let user retry
            }
        }
    };
    
    // Add message listener
    window.addEventListener('message', handleMessage);
    
    // Check for existing auth data - but only if we're not in an iframe context
    // In iframe context, we should wait for auth data from parent window
    const isInIframe = window !== window.parent;
    
    if (!isInIframe && authService.isAuthenticated()) {
        // Found existing authentication, auto-logging in (only when not in iframe)
        
        // Get auth data and login to ZIM
        const authDataStr = localStorage.getItem('pawfect-friends-auth');
        if (authDataStr) {
            try {
                const authData = JSON.parse(authDataStr);
                const zimUser = {
                    userID: authData.userId,
                    userName: authData.userName,
                    userAvatar: authData.userAvatar
                };
                
                // Always perform ZIM login when we have auth data (zimStore.isLogged is just local state)
                console.log('🔐 Starting ZIM auto-login for user:', zimUser.userName);
                zimStore.login(zimUser).then(async () => {
                    console.log('✅ ZIM auto-login completed successfully');
                    
                    // Verify ZIM is actually ready by testing a simple API call
                    try {
                        await zimStore.queryConversationList();
                        console.log('✅ ZIM API test successful, setting logged state');
                        isLogged.value = true;
                        
                        // Handle URL parameters after successful login
                        handleUrlParameters();
                    } catch (error) {
                        console.error('❌ ZIM API test failed, auto-login not complete:', error);
                        // Don't set logged state if API test fails
                    }
                }).catch((error) => {
                    console.error('ZIM auto-login failed:', error);
                    // Don't set logged state on error
                });
            } catch (error) {
                console.error('Error parsing existing auth data:', error);
                // Don't set logged state on error
            }
        } else {
            // No existing auth data, don't set logged state
        }
    } else {
        // No existing authentication found or in iframe context, waiting for parent message
        console.log('🔄 Waiting for auth data from parent window (iframe context)');
    }
    
    // Cleanup listener on unmount
    onUnmounted(() => {
        window.removeEventListener('message', handleMessage);
    });
});




</script>

<template>
  <div class="bg" />
  <el-config-provider :locale="locale">
    <div v-if="isLogged">
      <ZIMLayout />
    </div>
    <div v-else>
      <ZIMLogin />
    </div>
  </el-config-provider>
</template>
