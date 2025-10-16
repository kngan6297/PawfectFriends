# PawfectFriends Chat - Communication App

This is the communication module for the PawfectFriends pet adoption platform, providing comprehensive chat, voice, and video calling capabilities.

## Features

- ✅ **Text Chat**: Instant messaging with rich text support
- ✅ **Voice Calls**: High-quality audio calls
- ✅ **Video Calls**: HD video calling with screen sharing
- ✅ **File Sharing**: Images, documents, audio, and video files
- ✅ **Group Management**: Create and manage group conversations
- ✅ **Real-time Communication**: WebSocket-based real-time messaging

## Technology Stack

- **Frontend**: Vue 3 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Element Plus
- **State Management**: Pinia
- **Communication SDK**: ZEGO ZIM Web SDK
- **Styling**: SCSS

## Integration with Main Project

This app runs independently but communicates with the main PawfectFriends application through:

1. **Shared Authentication**: JWT tokens from the main app
2. **API Integration**: Backend endpoints for user management
3. **WebSocket Connections**: Real-time communication
4. **Cross-App Navigation**: Links between main app and communication

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The app will run on http://localhost:3000
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

The app requires ZEGO ZIM configuration in `src/utils.ts`:

- `appID`: Your ZEGO application ID
- `serverSecret`: Your ZEGO server secret

## Port Configuration

- **Development**: Port 3000
- **Production**: Configurable via environment variables

## Communication with Main App

### Authentication Flow

1. User logs into main app
2. JWT token is shared with communication app
3. Communication app authenticates with ZEGO using the token
4. User can access chat and calling features

### API Integration

- User profile data from main app
- Pet and adoption information
- Shelter and user management

## File Structure

```
src/
├── components/          # Vue components
│   ├── dialog/         # Modal dialogs
│   ├── fragment/       # Reusable UI fragments
│   └── ...
├── store/              # Pinia state management
├── styles/             # SCSS stylesheets
├── utils/              # Utility functions
└── ...
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure port 3000 is available
2. **ZEGO configuration**: Verify appID and serverSecret
3. **Authentication**: Check JWT token sharing between apps

### Support

For issues related to:

- **Communication features**: Check ZEGO ZIM documentation
- **Integration**: Check main project documentation
- **Build/deployment**: Check Vite documentation
