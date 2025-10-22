# Environment Variables Templates

## Backend (.env) - Production Template

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pawfectfriends?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_SECURE=false
SMTP_FROM_NAME=PawfectFriends
SMTP_FROM_EMAIL=noreply@pawfectfriends.com

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=pawfectfriends

# ZegoCloud Configuration
ZEGO_APP_ID=your-zego-app-id
ZEGO_SERVER_SECRET=your-zego-server-secret
ZEGO_CALLBACK_SECRET=your-zego-callback-secret

# Petfinder API (Optional)
PETFINDER_API_KEY=your-petfinder-api-key
PETFINDER_API_SECRET=your-petfinder-api-secret

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com,https://your-comm-domain.com

# Redis Configuration (if using)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## Frontend (.env) - Production Template

```bash
# API Configuration
VITE_API_URL=https://your-backend-domain.com
VITE_API_TIMEOUT=10000

# ZegoCloud Configuration
VITE_ZEGO_APP_ID=your-zego-app-id

# Communication App URL
VITE_COMM_URL=https://your-comm-domain.com

# App Configuration
VITE_APP_NAME=PawfectFriends
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Pet Adoption Platform

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=false

# External Services
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

## Communication App (.env) - Production Template

```bash
# API Configuration
VITE_API_URL=https://your-backend-domain.com

# ZegoCloud Configuration
VITE_ZEGO_APP_ID=your-zego-app-id

# App Configuration
VITE_APP_NAME=PawfectFriends Chat
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_FILE_UPLOAD=true
VITE_ENABLE_VIDEO_CALLS=true
VITE_ENABLE_SCREEN_SHARE=true
VITE_MAX_FILE_SIZE=10485760
```

## AI Service (.env) - Production Template

```bash
# Server Configuration
HOST=0.0.0.0
PORT=8000
WORKERS=1

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000

# Model Configuration
MODEL_PATH=./recommendation_model.joblib
ARTIFACTS_PATH=./recommendation_artifacts.joblib
MODEL_VERSION=1.0.0

# Database Configuration (if needed)
DATABASE_URL=postgresql://user:password@host:port/database

# Logging
LOG_LEVEL=info
LOG_FILE=logs/ai-service.log

# Performance
MAX_CONCURRENT_REQUESTS=10
REQUEST_TIMEOUT=30
```

## Mobile App (.env) - Production Template

```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://your-backend-domain.com
EXPO_PUBLIC_API_TIMEOUT=10000

# ZegoCloud Configuration
EXPO_PUBLIC_ZEGO_APP_ID=your-zego-app-id

# App Configuration
EXPO_PUBLIC_APP_NAME=PawfectFriends
EXPO_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_ENABLE_DEBUG=false

# Push Notifications (if using)
EXPO_PUBLIC_PUSH_NOTIFICATION_KEY=your-push-key
```

## Docker Compose (for Local Testing)

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/pawfectfriends
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - mongo
      - redis

  ai-service:
    build: ./ai-service
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=your-openai-key
    depends_on:
      - backend

  frontend:
    build: ./frontend
    ports:
      - "3001:3001"
    environment:
      - VITE_API_URL=http://localhost:3000
    depends_on:
      - backend

  comm:
    build: ./comm
    ports:
      - "3002:3002"
    environment:
      - VITE_API_URL=http://localhost:3000
    depends_on:
      - backend

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

## Health Check Endpoints

### Backend Health Check

```javascript
// Add to your backend routes
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  });
});
```

### AI Service Health Check

```python
# Add to your AI service
@app.get("/health")
async def health_check():
    return {
        "status": "OK",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "production")
    }
```
