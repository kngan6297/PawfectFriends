/**
 * ZIM Helpers - Communication Integration
 * 
 * These utilities now redirect users to the integrated communication center
 * where they can use the full ZIM SDK functionality.
 */

// Redirect to communication center
const redirectToCommunication = () => {
  window.location.href = '/communication';
};

/**
 * Hook to open a ZIM conversation from metadata
 * This should be used in components that need to open conversations
 */
export const useOpenZIMConversation = () => {
  const openConversation = async (zegoMeta: {
    conversationType: 'peer' | 'group';
    peerId?: string;
    groupId?: string;
    name?: string;
  }) => {
    console.log('Redirecting to communication center to open conversation:', zegoMeta);
    redirectToCommunication();
    return { success: true, redirected: true };
  };

  return { openConversation };
};

/**
 * Utility function to open a ZIM conversation from metadata
 * This can be used outside of React components
 */
export const openZIMConversation = async (
  zimInstance: any,
  zegoMeta: {
    conversationType: 'peer' | 'group';
    peerId?: string;
    groupId?: string;
    name?: string;
  }
) => {
  console.log('Redirecting to communication center to open conversation:', zegoMeta);
  redirectToCommunication();
  return { success: true, redirected: true };
};
