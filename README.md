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
- **Backend**: 🔄 Deploying on Render (https://pawfectfriends.onrender.com)
- **Communication App**: ✅ Deployed on Render (https://pawfectfriends-81t1.onrender.com)
- **AI Service**: ✅ Deployed on Render (https://pawfectfriends-1.onrender.com)

### Production Checklist
- [x] Environment variables configured
- [x] Database connection secured
- [x] HTTPS enabled
- [x] Security headers configured
- [x] File upload limits set
- [x] Rate limiting enabled
- [x] Logging configured
- [x] Error handling implemented

### Render Deployment
The application is currently deployed on Render. See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

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