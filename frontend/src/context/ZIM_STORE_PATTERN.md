# ZIM Store Pattern Implementation

## Overview

The ZIMProvider has been refactored to implement the store pattern where Maps are initialized once and mutated in place, rather than being replaced entirely. This approach provides better performance and memory efficiency.

## Key Changes

### 1. Store Structure

```typescript
type ZimStore = {
  conversations: Map<string, any>;
  messagesByRoom: Map<string, any[]>;
  typingByRoom: Map<string, any>;
};
```

### 2. Store Initialization

```typescript
// Initialize store once and mutate Maps in place
const [store] = useState<ZimStore>(() => makeStore());

// Version counter to trigger re-renders when store is mutated
const [version, setVersion] = useState(0);
```

### 3. Store Mutation Methods

```typescript
// ❌ avoid: setStore(undefined) or setStore(makeStore())
// ✅ clear Maps in place and trigger re-render
const clearStore = useCallback(() => {
  store.conversations.clear();
  store.messagesByRoom.clear();
  store.typingByRoom.clear();
  setVersion((v) => v + 1); // trigger rerender
}, [store]);

const addConversation = useCallback(
  (id: string, conversation: any) => {
    store.conversations.set(id, conversation);
    setVersion((v) => v + 1); // trigger rerender
  },
  [store]
);

const addMessage = useCallback(
  (roomId: string, message: any) => {
    if (!store.messagesByRoom.has(roomId)) {
      store.messagesByRoom.set(roomId, []);
    }
    store.messagesByRoom.get(roomId)!.push(message);
    setVersion((v) => v + 1); // trigger rerender
  },
  [store]
);

const setTyping = useCallback(
  (roomId: string, typingData: any) => {
    store.typingByRoom.set(roomId, typingData);
    setVersion((v) => v + 1); // trigger rerender
  },
  [store]
);
```

## Usage Pattern

### 1. Access the Store

```typescript
const { store, addConversation, addMessage, setTyping, clearStore } = useZIM();
```

### 2. Add Data to Store

```typescript
// Add conversation
addConversation("conv1", {
  id: "conv1",
  name: "Chat Room 1",
});

// Add message
addMessage("conv1", {
  id: "msg1",
  content: "Hello!",
  timestamp: Date.now(),
});

// Set typing indicator
setTyping("conv1", {
  userId: "user1",
  isTyping: true,
});
```

### 3. Access Data from Store

```typescript
// Get conversation
const conversation = store.conversations.get("conv1");

// Get messages for a room
const messages = store.messagesByRoom.get("conv1") || [];

// Get typing status
const typingStatus = store.typingByRoom.get("conv1");
```

### 4. Clear Store (for logout/reconnect)

```typescript
// ❌ avoid: setStore(undefined) or setStore(makeStore())
// ✅ use: clearStore() - clears Maps in place and triggers re-render
clearStore();
```

## Benefits

1. **No Object Recreation**: The store object is never replaced, only its contents are modified
2. **Efficient Memory Usage**: Maps are reused instead of being garbage collected and recreated
3. **Automatic Re-rendering**: The version counter automatically triggers re-renders when needed
4. **Clear Separation of Concerns**: Store mutations are handled through dedicated methods
5. **Easy Debugging**: Store state can be easily inspected in React DevTools

## Migration Guide

### Before (Old Pattern)

```typescript
// Old way - replacing entire store
const [conversations, setConversations] = useState(new Map());
const [messagesByRoom, setMessagesByRoom] = useState(new Map());

// Adding conversation
setConversations((prev) => new Map(prev).set(id, conversation));

// Adding message
setMessagesByRoom((prev) => {
  const newMap = new Map(prev);
  const messages = newMap.get(roomId) || [];
  newMap.set(roomId, [...messages, message]);
  return newMap;
});
```

### After (New Pattern)

```typescript
// New way - mutating Maps in place
const { store, addConversation, addMessage } = useZIM();

// Adding conversation
addConversation(id, conversation);

// Adding message
addMessage(roomId, message);
```

## Example Component

See `ZIMStoreExample.tsx` for a complete working example that demonstrates:

- Adding conversations and messages
- Setting typing indicators
- Clearing the store
- Observing automatic re-renders

## Technical Details

### Version Counter

The version counter is included in the context dependencies to ensure that when the store is mutated, all components using the ZIM context will re-render:

```typescript
const ctx = useMemo(
  () => ({
    // ... other properties
    store,
    // ... store mutation methods
  }),
  [
    // ... other dependencies
    store,
    // Include version in dependencies to trigger re-renders when store is mutated
    version,
  ]
);
```

### Store Factory

The `makeStore()` function creates a fresh store instance:

```typescript
const makeStore = (): ZimStore => ({
  conversations: new Map(),
  messagesByRoom: new Map(),
  typingByRoom: new Map(),
});
```

This function is only called once during initialization, ensuring that the Maps are created once and reused throughout the component lifecycle.

## Best Practices

1. **Always use mutation methods**: Use `addConversation`, `addMessage`, `setTyping` instead of directly manipulating the Maps
2. **Use clearStore for cleanup**: Call `clearStore()` when logging out or reconnecting, not `setStore(undefined)`
3. **Access data through store**: Read data directly from `store.conversations`, `store.messagesByRoom`, etc.
4. **Let version counter handle re-renders**: Don't manually manage state updates, the version counter will handle it automatically

## Troubleshooting

### Store not updating UI

- Ensure you're using the mutation methods (`addConversation`, `addMessage`, etc.)
- Check that the version counter is being incremented
- Verify that components are properly consuming the ZIM context

### Performance issues

- The store pattern is designed to be efficient, but if you experience issues, check for unnecessary re-renders
- Consider using `useMemo` or `useCallback` for expensive computations that depend on store data

### Memory leaks

- The store is automatically cleaned up when the ZIMProvider unmounts
- Use `clearStore()` when appropriate (logout, reconnect, etc.)
- Avoid storing large amounts of data in the Maps if not needed
