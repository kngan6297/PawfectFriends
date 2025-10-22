# Alternative Deployment Platforms

## 🚀 Render.com Configuration

### render.yaml (Complete Configuration)

```yaml
services:
  # Backend Service
  - type: web
    name: pawfectfriends-backend
    env: node
    plan: free
    buildCommand: cd backend && npm ci --only=production
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
    buildCommand: cd ai-service && pip install -r requirements-minimal.txt
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

## 🚀 Koyeb Configuration

### koyeb.yaml

```yaml
services:
  - name: pawfectfriends-backend
    source:
      type: git
      repository: your-github-repo
      branch: main
      working_directory: backend
    ports:
      - port: 3000
        http:
          routes:
            - path: /
    env:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: MONGODB_URI
        value: mongodb+srv://username:password@cluster.mongodb.net/pawfectfriends
      - key: JWT_SECRET
        value: your-jwt-secret
      - key: SMTP_HOST
        value: smtp.gmail.com
      - key: SMTP_PORT
        value: 587
      - key: SMTP_USER
        value: your-email@gmail.com
      - key: SMTP_PASS
        value: your-app-password
      - key: CLOUDINARY_CLOUD_NAME
        value: your-cloud-name
      - key: CLOUDINARY_API_KEY
        value: your-api-key
      - key: CLOUDINARY_API_SECRET
        value: your-api-secret
      - key: ZEGO_APP_ID
        value: your-zego-app-id
      - key: ZEGO_SERVER_SECRET
        value: your-zego-server-secret

  - name: pawfectfriends-ai
    source:
      type: git
      repository: your-github-repo
      branch: main
      working_directory: ai-service
    ports:
      - port: 8000
        http:
          routes:
            - path: /
    env:
      - key: OPENAI_API_KEY
        value: your-openai-api-key
      - key: MODEL_PATH
        value: ./recommendation_model.joblib
      - key: ARTIFACTS_PATH
        value: ./recommendation_artifacts.joblib

  - name: pawfectfriends-frontend
    source:
      type: git
      repository: your-github-repo
      branch: main
      working_directory: frontend
    ports:
      - port: 3000
        http:
          routes:
            - path: /
    env:
      - key: VITE_API_URL
        value: https://pawfectfriends-backend.koyeb.app
      - key: VITE_ZEGO_APP_ID
        value: your-zego-app-id
      - key: VITE_COMM_URL
        value: https://pawfectfriends-comm.koyeb.app

  - name: pawfectfriends-comm
    source:
      type: git
      repository: your-github-repo
      branch: main
      working_directory: comm
    ports:
      - port: 3000
        http:
          routes:
            - path: /
    env:
      - key: VITE_ZEGO_APP_ID
        value: your-zego-app-id
      - key: VITE_API_URL
        value: https://pawfectfriends-backend.koyeb.app
```

## 🚀 Fly.io Configuration

### fly.toml (Backend)

```toml
app = "pawfectfriends-backend"
primary_region = "iad"

[build]

[env]
  NODE_ENV = "production"
  PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

### fly.toml (AI Service)

```toml
app = "pawfectfriends-ai"
primary_region = "iad"

[build]

[env]
  PORT = "8000"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

## 🚀 DigitalOcean App Platform

### .do/app.yaml

```yaml
name: pawfectfriends
services:
  - name: backend
    source_dir: backend
    github:
      repo: your-username/pawfectfriends
      branch: main
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "3000"
      - key: MONGODB_URI
        value: mongodb+srv://username:password@cluster.mongodb.net/pawfectfriends
      - key: JWT_SECRET
        value: your-jwt-secret
      - key: SMTP_HOST
        value: smtp.gmail.com
      - key: SMTP_PORT
        value: "587"
      - key: SMTP_USER
        value: your-email@gmail.com
      - key: SMTP_PASS
        value: your-app-password
      - key: CLOUDINARY_CLOUD_NAME
        value: your-cloud-name
      - key: CLOUDINARY_API_KEY
        value: your-api-key
      - key: CLOUDINARY_API_SECRET
        value: your-api-secret
      - key: ZEGO_APP_ID
        value: your-zego-app-id
      - key: ZEGO_SERVER_SECRET
        value: your-zego-server-secret
    http_port: 3000
    routes:
      - path: /
    health_check:
      http_path: /api/health

  - name: ai-service
    source_dir: ai-service
    github:
      repo: your-username/pawfectfriends
      branch: main
    run_command: uvicorn main:app --host 0.0.0.0 --port $PORT
    environment_slug: python
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: OPENAI_API_KEY
        value: your-openai-api-key
      - key: MODEL_PATH
        value: ./recommendation_model.joblib
      - key: ARTIFACTS_PATH
        value: ./recommendation_artifacts.joblib
    http_port: 8000
    routes:
      - path: /
    health_check:
      http_path: /health

  - name: frontend
    source_dir: frontend
    github:
      repo: your-username/pawfectfriends
      branch: main
    build_command: npm install && npm run build
    run_command: npm run preview
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: VITE_API_URL
        value: https://backend-pawfectfriends.ondigitalocean.app
      - key: VITE_ZEGO_APP_ID
        value: your-zego-app-id
      - key: VITE_COMM_URL
        value: https://comm-pawfectfriends.ondigitalocean.app
    http_port: 3000
    routes:
      - path: /
    static_sites:
      - name: frontend-static
        source_dir: frontend
        github:
          repo: your-username/pawfectfriends
          branch: main
        build_command: npm install && npm run build
        output_dir: dist
        routes:
          - path: /
        envs:
          - key: VITE_API_URL
            value: https://backend-pawfectfriends.ondigitalocean.app
          - key: VITE_ZEGO_APP_ID
            value: your-zego-app-id
          - key: VITE_COMM_URL
            value: https://comm-pawfectfriends.ondigitalocean.app

  - name: comm
    source_dir: comm
    github:
      repo: your-username/pawfectfriends
      branch: main
    build_command: npm install && npm run build
    run_command: npm run preview
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: VITE_ZEGO_APP_ID
        value: your-zego-app-id
      - key: VITE_API_URL
        value: https://backend-pawfectfriends.ondigitalocean.app
    http_port: 3000
    routes:
      - path: /
    static_sites:
      - name: comm-static
        source_dir: comm
        github:
          repo: your-username/pawfectfriends
          branch: main
        build_command: npm install && npm run build
        output_dir: dist
        routes:
          - path: /
        envs:
          - key: VITE_ZEGO_APP_ID
            value: your-zego-app-id
          - key: VITE_API_URL
            value: https://backend-pawfectfriends.ondigitalocean.app
```

## 🚀 Netlify Configuration

### netlify.toml (Frontend)

```toml
[build]
  base = "frontend"
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  VITE_API_URL = "https://your-backend-url.com"
  VITE_ZEGO_APP_ID = "your-zego-app-id"
  VITE_COMM_URL = "https://your-comm-url.com"
```

### netlify.toml (Communication App)

```toml
[build]
  base = "comm"
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  VITE_ZEGO_APP_ID = "your-zego-app-id"
  VITE_API_URL = "https://your-backend-url.com"
```

## 🚀 Vercel Configuration

### vercel.json (Frontend)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "@vite_api_url",
    "VITE_ZEGO_APP_ID": "@vite_zego_app_id",
    "VITE_COMM_URL": "@vite_comm_url"
  }
}
```

### vercel.json (Communication App)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "comm/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_ZEGO_APP_ID": "@vite_zego_app_id",
    "VITE_API_URL": "@vite_api_url"
  }
}
```

## 🚀 Railway Alternative Configuration

### railway.json (Backend - Alternative)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "backend/Dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

### railway.json (AI Service - Alternative)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "ai-service/Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

## 🚀 Quick Deployment Commands

### Render.com

```bash
# Install Render CLI
npm install -g @render/cli

# Login to Render
render login

# Deploy backend
render service create --name pawfectfriends-backend --type web --env node --build-command "cd backend && npm ci --only=production" --start-command "cd backend && npm start"

# Deploy AI service
render service create --name pawfectfriends-ai --type web --env python --build-command "cd ai-service && pip install -r requirements-minimal.txt" --start-command "cd ai-service && uvicorn main:app --host 0.0.0.0 --port $PORT"
```

### Koyeb

```bash
# Install Koyeb CLI
curl -fsSL https://koyeb.com/install.sh | sh

# Login to Koyeb
koyeb auth login

# Deploy backend
koyeb service create --name pawfectfriends-backend --git your-github-repo --git-branch main --git-working-directory backend

# Deploy AI service
koyeb service create --name pawfectfriends-ai --git your-github-repo --git-branch main --git-working-directory ai-service
```

### Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly
fly auth login

# Deploy backend
fly launch --name pawfectfriends-backend --path backend

# Deploy AI service
fly launch --name pawfectfriends-ai --path ai-service
```

## 🎯 Platform Comparison

| Platform     | Free Tier        | Build Time | Ease of Use | Best For             |
| ------------ | ---------------- | ---------- | ----------- | -------------------- |
| Railway      | $5 credit/month  | Medium     | Easy        | Full-stack apps      |
| Render       | 100GB bandwidth  | Fast       | Easy        | Static sites + APIs  |
| Koyeb        | 2GB RAM          | Fast       | Easy        | Serverless functions |
| Fly.io       | 3 shared-cpu VMs | Fast       | Medium      | Docker apps          |
| DigitalOcean | $5 credit/month  | Medium     | Medium      | Production apps      |
| Vercel       | Unlimited        | Very Fast  | Easy        | Frontend apps        |
| Netlify      | 100GB bandwidth  | Very Fast  | Easy        | Static sites         |

## 🚀 Recommended Alternative Strategy

**If Railway continues to timeout, try this order:**

1. **Render.com** - Most reliable for Node.js/Python
2. **Koyeb** - Good for serverless functions
3. **Fly.io** - Best for Docker-based deployments
4. **DigitalOcean** - Most production-ready

**Frontend deployment:**

- **Vercel** - Best for React/Vue apps
- **Netlify** - Good alternative for static sites

This gives you multiple options to get your PawfectFriends app deployed successfully! 🚀
