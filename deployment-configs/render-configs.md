# Render Configuration Files

## render.yaml (Complete Configuration)

```yaml
services:
  # Backend Service
  - type: web
    name: pawfectfriends-backend
    env: node
    plan: free
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        fromDatabase:
          name: pawfectfriends-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: SMTP_HOST
        value: smtp.gmail.com
      - key: SMTP_PORT
        value: 587
      - key: SMTP_USER
        sync: false
      - key: SMTP_PASS
        sync: false
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      - key: ZEGO_APP_ID
        sync: false
      - key: ZEGO_SERVER_SECRET
        sync: false

  # AI Service
  - type: web
    name: pawfectfriends-ai
    env: python
    plan: free
    buildCommand: cd ai-service && pip install -r requirements.txt
    startCommand: cd ai-service && uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: OPENAI_API_KEY
        sync: false
      - key: MODEL_PATH
        value: ./recommendation_model.joblib
      - key: ARTIFACTS_PATH
        value: ./recommendation_artifacts.joblib

  # Frontend Static Site
  - type: web
    name: pawfectfriends-frontend
    env: static
    plan: free
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: ./frontend/dist
    envVars:
      - key: VITE_API_URL
        value: https://pawfectfriends-backend.onrender.com
      - key: VITE_ZEGO_APP_ID
        sync: false
      - key: VITE_COMM_URL
        value: https://pawfectfriends-comm.onrender.com

  # Communication App Static Site
  - type: web
    name: pawfectfriends-comm
    env: static
    plan: free
    buildCommand: cd comm && npm install && npm run build
    staticPublishPath: ./comm/dist
    envVars:
      - key: VITE_ZEGO_APP_ID
        sync: false
      - key: VITE_API_URL
        value: https://pawfectfriends-backend.onrender.com

databases:
  - name: pawfectfriends-db
    plan: free
    databaseName: pawfectfriends
    user: pawfectfriends_user
```

## Dockerfile (for Backend)

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY backend/ .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
```

## Dockerfile (for AI Service)

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY ai-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY ai-service/ .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```
