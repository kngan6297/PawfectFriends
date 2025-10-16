# PawfectFriends Mobile App

A React Native Expo mobile application for pet adoption, built to complement the PawfectFriends web platform.

## Features

- **Public Access**: Browse pets without authentication
- **User Authentication**: Register, login, email verification, password reset
- **User Dashboard**: Manage profile, favorites, and adoption requests
- **Pet Browsing**: Advanced filters and pet detail view
- **Adoption Process**: Submit and track adoption requests
- **Modern UI/UX**: Clean, mobile-first design with React Navigation

## Tech Stack

- **React Native** with **Expo**
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Zustand** for state management
- **TanStack Query** for API data management
- **Expo Router** for file-based routing

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

3. Run on specific platforms:

```bash
npm run ios     # iOS Simulator
npm run android # Android Emulator
npm run web     # Web browser
```

## Project Structure

```
src/
├── app/                 # Expo Router pages
├── components/          # Reusable UI components
├── screens/            # Screen components
├── services/           # API services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
├── store/              # Zustand stores
└── constants/          # App constants
```

## Environment Setup

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_APP_NAME=PawfectFriends
```

## Building for Production

### Android

```bash
npm run build:android
```

### iOS

```bash
npm run build:ios
```

## Contributing

1. Follow the existing code structure
2. Use TypeScript for all new files
3. Follow React Native best practices
4. Test on both iOS and Android platforms

## License

This project is part of the PawfectFriends platform.
