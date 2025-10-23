# PawfectFriends - Pet Adoption Platform

A comprehensive pet adoption platform built with React, Node.js, and MongoDB, featuring real-time communication, AI-powered recommendations, and mobile support.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 5.0+
- Python 3.8+ (for AI service)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/pawfectfriends.git
   cd pawfectfriends
   ```

2. **Install dependencies**

   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install

   # Communication App
   cd ../comm
   npm install

   # Mobile App
   cd ../mobile
   npm install

   # AI Service
   cd ../ai-service
   pip install -r requirements.txt
   ```

3. **Environment Setup**

   **Backend Environment** (`backend/.env`):

   ```bash
   cp backend/env.example backend/.env
   # Edit backend/.env with your configuration
   ```

   **Frontend Environment** (`frontend/.env`):

   ```bash
   cp frontend/env.example frontend/.env
   # Edit frontend/.env with your configuration
   ```

   **Communication App Environment** (`comm/.env`):

   ```bash
   cp comm/env.example comm/.env
   # Edit comm/.env with your configuration
   ```

   **Mobile App Environment** (`mobile/.env`):

   ```bash
   cp mobile/env.example mobile/.env
   # Edit mobile/.env with your configuration
   ```

   **AI Service Environment** (`ai-service/.env`):

   ```bash
   cp ai-service/env.example ai-service/.env
   # Edit ai-service/.env with your configuration
   ```

4. **Start the services**

   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev

   # Terminal 3 - Communication App
   cd comm
   npm run dev

   # Terminal 4 - AI Service
   cd ai-service
   python main.py

   # Terminal 5 - Mobile App (optional)
   cd mobile
   npm start
   ```

## 🔧 Configuration

### Required Services

#### 1. MongoDB

- Install MongoDB locally or use MongoDB Atlas
- Update `MONGODB_URI` in backend/.env

#### 2. Email Service (SMTP)

- Configure SMTP settings in backend/.env
- Gmail example:
  ```bash
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your_email@gmail.com
  SMTP_PASS=your_app_password
  SMTP_SECURE=false
  ```

#### 3. File Upload (Cloudinary)

- Create a Cloudinary account
- Update Cloudinary settings in backend/.env:
  ```bash
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```

#### 4. Real-time Communication (ZegoCloud)

- Create a ZegoCloud account
- Update ZegoCloud settings:

  ```bash
  # Backend
  ZEGO_APP_ID=your_app_id
  ZEGO_SERVER_SECRET=your_server_secret
  ZEGO_CALLBACK_SECRET=your_callback_secret

  # Frontend/Comm
  VITE_ZEGO_APP_ID=your_app_id
  ```

#### 5. Petfinder API (Optional)

- Get API credentials from Petfinder
- Update settings in backend/.env:
  ```bash
  PETFINDER_API_KEY=your_api_key
  PETFINDER_API_SECRET=your_api_secret
  ```

#### 6. OpenAI API (Optional)

- Get API key from OpenAI
- Update settings in ai-service/.env:
  ```bash
  OPENAI_API_KEY=your_api_key
  ```

## 📱 Features

### Core Features

- **User Authentication**: Registration, login, email verification
- **Pet Management**: Add, edit, search pets with advanced filtering
- **Adoption Process**: Application, review, contract generation
- **Real-time Communication**: Chat, video calls, file sharing
- **AI Recommendations**: ML-powered pet matching
- **Mobile Support**: React Native mobile app
- **Admin Dashboard**: Comprehensive admin panel

### Advanced Features

- **Multi-language Support**: i18n ready
- **File Upload**: Image/video upload with Cloudinary
- **Email Notifications**: Automated email system
- **Activity Logging**: Comprehensive audit trail
- **Rate Limiting**: API protection
- **Security**: CSRF protection, input validation

## 🏗️ Architecture

```
PawfectFriends/
├── backend/          # Node.js API server
├── frontend/         # React web application
├── comm/            # Vue.js communication app
├── mobile/          # React Native mobile app
├── ai-service/      # Python AI/ML service
└── docs/            # Documentation
```

### Technology Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React, TypeScript, Tailwind CSS
- **Communication**: Vue.js, ZegoCloud SDK
- **Mobile**: React Native, Expo
- **AI/ML**: Python, scikit-learn, TensorFlow
- **Real-time**: Socket.io, ZegoCloud
- **File Storage**: Cloudinary
- **Email**: Nodemailer

## 🔒 Security

**IMPORTANT**: This project handles sensitive user data. Please read [SECURITY.md](SECURITY.md) before deployment.

### Security Features

- Environment-based configuration
- Input validation and sanitization
- CSRF protection
- Rate limiting
- Secure file uploads
- Password hashing
- JWT authentication
- Security logging

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset

### Pet Endpoints

- `GET /api/pets` - Get all pets
- `POST /api/pets` - Create new pet
- `GET /api/pets/:id` - Get pet by ID
- `PUT /api/pets/:id` - Update pet
- `DELETE /api/pets/:id` - Delete pet

### Adoption Endpoints

- `POST /api/adoptions` - Submit adoption application
- `GET /api/adoptions` - Get adoption applications
- `PUT /api/adoptions/:id` - Update adoption status

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# AI Service tests
cd ai-service
python -m pytest
```

## 🚀 Deployment

### Current Deployment Status

- **Frontend**: ✅ Deployed on Render (https://pawfectfriends-frontend.onrender.com)
- **Backend**: ✅ Deployed on Render (https://pawfectfriends-backend.onrender.com)
- **Communication App**: ✅ Deployed on Render (https://pawfectfriends-comm.onrender.com)
- **AI Service**: ✅ Deployed on Render (https://pawfectfriends-ai.onrender.com)

### Why Render.com?

Render.com provides excellent reliability for complex applications:

- ✅ **95% success rate** vs 80% for other platforms
- ✅ **Faster builds** (2-3 min vs 5-10 min)
- ✅ **Better Python/Node.js support**
- ✅ **More stable free tier**
- ✅ **Native static site support**

### Render Deployment Guide

#### Step 1: Deploy Backend

1. **Go to [Render.com](https://render.com)**
2. **Sign up with GitHub**
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repository**
5. **Configure Backend Service:**

   ```
   Name: pawfectfriends-backend
   Environment: Node
   Region: Oregon (US West)
   Branch: main
   Root Directory: backend
   Build Command: npm ci --only=production
   Start Command: npm start
   ```

6. **Add Environment Variables:**

   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pawfectfriends
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ZEGO_APP_ID=your-zego-app-id
   ZEGO_SERVER_SECRET=your-zego-server-secret
   ```

#### Step 2: Deploy AI Service

1. **Click "New +" → "Web Service"**
2. **Connect your GitHub repository**
3. **Configure AI Service:**

   ```
   Name: pawfectfriends-ai
   Environment: Python 3
   Region: Oregon (US West)
   Branch: main
   Root Directory: ai-service
   Build Command: pip install -r requirements-minimal.txt
   Start Command: python -m uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
   ```

4. **Add Environment Variables:**

   ```
   OPENAI_API_KEY=your-openai-api-key
   MODEL_PATH=./recommendation_model.joblib
   ARTIFACTS_PATH=./recommendation_artifacts.joblib
   ```

#### Step 3: Deploy Frontend

1. **Click "New +" → "Static Site"**
2. **Connect your GitHub repository**
3. **Configure Frontend:**

   ```
   Name: pawfectfriends-frontend
   Branch: main
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

4. **Add Environment Variables:**

   ```
   VITE_API_URL=https://pawfectfriends-backend.onrender.com
   VITE_ZEGO_APP_ID=your-zego-app-id
   VITE_COMM_URL=https://pawfectfriends-comm.onrender.com
   ```

#### Step 4: Deploy Communication App

1. **Click "New +" → "Static Site"**
2. **Connect your GitHub repository**
3. **Configure Communication App:**

   ```
   Name: pawfectfriends-comm
   Branch: main
   Root Directory: comm
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

4. **Add Environment Variables:**

   ```
   VITE_ZEGO_APP_ID=your-zego-app-id
   VITE_API_URL=https://pawfectfriends-backend.onrender.com
   ```

### Using render.yaml (Recommended)

For automated deployment, use the included `render.yaml` file:

```yaml
services:
  - type: web
    name: pawfectfriends-backend
    env: node
    plan: free
    buildCommand: npm ci --only=production
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      # ... other environment variables

  - type: web
    name: pawfectfriends-ai
    env: python
    plan: free
    buildCommand: pip install -r requirements-minimal.txt
    startCommand: python -m uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
    # ... environment variables

  - type: web
    name: pawfectfriends-frontend
    env: static
    plan: free
    buildCommand: npm install && npm run build
    staticPublishPath: ./frontend/dist
    # ... environment variables

  - type: web
    name: pawfectfriends-comm
    env: static
    plan: free
    buildCommand: npm install && npm run build
    staticPublishPath: ./comm/dist
    # ... environment variables
```

### Production Checklist

- [x] Environment variables configured
- [x] Database connection secured
- [x] HTTPS enabled
- [x] Security headers configured
- [x] File upload limits set
- [x] Rate limiting enabled
- [x] Logging configured
- [x] Error handling implemented

### Troubleshooting

#### Common Issues

1. **Build Failures**: Check Node.js/Python versions
2. **Environment Variables**: Ensure all required variables are set
3. **CORS Issues**: Update CORS settings with Render URLs

#### Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Community**: [community.render.com](https://community.render.com)

## 📱 Mobile App Deployment

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)
- Expo account (free at [expo.dev](https://expo.dev))

### Deployment Options

#### Option 1: EAS Build (Recommended)

EAS Build is Expo's cloud service for building production-ready apps.

1. **Login to EAS:**
   ```bash
   cd mobile
   eas login
   ```

2. **Configure EAS:**
   ```bash
   eas build:configure
   ```

3. **Build for Android:**
   ```bash
   # APK for testing
   eas build --platform android --profile preview
   
   # AAB for Google Play Store
   eas build --platform android --profile production
   ```

4. **Build for iOS:**
   ```bash
   # For iOS Simulator
   eas build --platform ios --profile preview
   
   # For App Store
   eas build --platform ios --profile production
   ```

5. **Submit to Stores:**
   ```bash
   # Submit to Google Play Store
   eas submit --platform android
   
   # Submit to Apple App Store
   eas submit --platform ios
   ```

#### Option 2: Local Development Build

For development and testing:

1. **Start Development Server:**
   ```bash
   cd mobile
   npm start
   ```

2. **Run on Device:**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   
   # Web
   npm run web
   ```

#### Option 3: Expo Go (Quick Testing)

1. **Install Expo Go app** on your phone
2. **Start development server:**
   ```bash
   cd mobile
   npm start
   ```
3. **Scan QR code** with Expo Go app

### Environment Configuration

Create `mobile/.env` file:

```env
EXPO_PUBLIC_API_URL=https://pawfectfriends-backend.onrender.com
EXPO_PUBLIC_APP_NAME=PawfectFriends
EXPO_PUBLIC_ZEGO_APP_ID=your-zego-app-id
```

### Build Profiles

The `eas.json` file includes three build profiles:

- **development**: For development builds with debugging
- **preview**: For internal testing (APK for Android)
- **production**: For store releases (AAB for Android, App Store for iOS)

### Store Submission

#### Google Play Store

1. Build production AAB: `eas build --platform android --profile production`
2. Submit: `eas submit --platform android`
3. Complete store listing in Google Play Console

#### Apple App Store

1. Build production iOS: `eas build --platform ios --profile production`
2. Submit: `eas submit --platform ios`
3. Complete store listing in App Store Connect

### Troubleshooting

- **Build failures**: Check `eas.json` configuration
- **Environment variables**: Ensure all `EXPO_PUBLIC_*` variables are set
- **Store submission**: Verify store credentials and app metadata

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow security guidelines in [SECURITY.md](SECURITY.md)
4. Commit your changes
5. Push to the branch
6. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `docs/` folder
- **Issues**: Create an issue on GitHub
- **Security**: Report security issues privately (see [SECURITY.md](SECURITY.md))

## 🙏 Acknowledgments

- Petfinder API for pet data
- ZegoCloud for real-time communication
- Cloudinary for file storage
- OpenAI for AI capabilities

---

**Made with ❤️ for pet lovers everywhere**
