# Quick Start Deployment Scripts

## 🚀 One-Click Deployment Scripts

### Railway Deployment Script

```bash
#!/bin/bash
# railway-deploy.sh

echo "🚀 Deploying PawfectFriends to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
railway login

# Deploy Backend
echo "📦 Deploying Backend..."
cd backend
railway deploy --service backend
cd ..

# Deploy AI Service
echo "🤖 Deploying AI Service..."
cd ai-service
railway deploy --service ai-service
cd ..

echo "✅ Backend and AI Service deployed to Railway!"
echo "🌐 Frontend and Communication App should be deployed to Vercel separately"
```

### Vercel Deployment Script

```bash
#!/bin/bash
# vercel-deploy.sh

echo "🚀 Deploying Frontend Apps to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel
vercel login

# Deploy Frontend
echo "📦 Deploying Frontend..."
cd frontend
vercel --prod
cd ..

# Deploy Communication App
echo "💬 Deploying Communication App..."
cd comm
vercel --prod
cd ..

echo "✅ Frontend and Communication App deployed to Vercel!"
```

### Complete Deployment Script

```bash
#!/bin/bash
# complete-deploy.sh

echo "🚀 Complete PawfectFriends Deployment"
echo "======================================"

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    echo "❌ Git working directory is not clean. Please commit your changes first."
    exit 1
fi

# Check if all .env files exist
echo "🔍 Checking environment files..."
for dir in backend frontend comm ai-service mobile; do
    if [[ ! -f "$dir/.env" ]]; then
        echo "⚠️  $dir/.env not found. Please create it from $dir/env.example"
        exit 1
    fi
done

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

# Deploy Backend and AI Service to Railway
echo "🚂 Deploying to Railway..."
./railway-deploy.sh

# Deploy Frontend Apps to Vercel
echo "▲ Deploying to Vercel..."
./vercel-deploy.sh

# Deploy Mobile App
echo "📱 Building Mobile App..."
cd mobile
expo build:android --type apk
expo build:ios --type simulator
cd ..

echo "🎉 Deployment Complete!"
echo "======================="
echo "Backend: https://your-backend.railway.app"
echo "Frontend: https://your-frontend.vercel.app"
echo "Communication: https://your-comm.vercel.app"
echo "AI Service: https://your-ai.railway.app"
```

## 🔧 Pre-deployment Checklist Script

```bash
#!/bin/bash
# pre-deploy-check.sh

echo "🔍 Pre-deployment Checklist"
echo "=========================="

# Check Node.js version
echo "📦 Checking Node.js version..."
node_version=$(node --version)
echo "Node.js: $node_version"
if [[ $node_version < "v18.0.0" ]]; then
    echo "❌ Node.js version should be 18 or higher"
    exit 1
fi

# Check Python version
echo "🐍 Checking Python version..."
python_version=$(python3 --version)
echo "Python: $python_version"

# Check if all dependencies are installed
echo "📦 Checking dependencies..."

# Backend dependencies
cd backend
if [[ ! -d "node_modules" ]]; then
    echo "❌ Backend dependencies not installed. Run: npm install"
    exit 1
fi
cd ..

# Frontend dependencies
cd frontend
if [[ ! -d "node_modules" ]]; then
    echo "❌ Frontend dependencies not installed. Run: npm install"
    exit 1
fi
cd ..

# Communication app dependencies
cd comm
if [[ ! -d "node_modules" ]]; then
    echo "❌ Communication app dependencies not installed. Run: npm install"
    exit 1
fi
cd ..

# AI service dependencies
cd ai-service
if [[ ! -f "requirements.txt" ]]; then
    echo "❌ AI service requirements.txt not found"
    exit 1
fi
cd ..

# Check environment files
echo "🔐 Checking environment files..."
for dir in backend frontend comm ai-service mobile; do
    if [[ -f "$dir/.env" ]]; then
        echo "✅ $dir/.env exists"
    else
        echo "❌ $dir/.env missing"
        exit 1
    fi
done

# Check if builds work
echo "🔨 Testing builds..."

# Test backend build
cd backend
if npm run build 2>/dev/null; then
    echo "✅ Backend builds successfully"
else
    echo "❌ Backend build failed"
    exit 1
fi
cd ..

# Test frontend build
cd frontend
if npm run build 2>/dev/null; then
    echo "✅ Frontend builds successfully"
else
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

# Test communication app build
cd comm
if npm run build 2>/dev/null; then
    echo "✅ Communication app builds successfully"
else
    echo "❌ Communication app build failed"
    exit 1
fi
cd ..

echo "✅ All checks passed! Ready for deployment."
```

## 🐳 Docker Deployment Scripts

### Docker Compose for Production

```bash
#!/bin/bash
# docker-deploy.sh

echo "🐳 Deploying with Docker..."

# Build all images
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Check health
echo "🔍 Checking service health..."
sleep 30

# Check backend health
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
fi

# Check AI service health
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ AI Service is healthy"
else
    echo "❌ AI Service health check failed"
fi

echo "🎉 Docker deployment complete!"
```

## 📊 Post-deployment Monitoring Script

```bash
#!/bin/bash
# monitor-deployment.sh

echo "📊 Monitoring Deployment"
echo "======================="

# Check service status
echo "🔍 Checking service status..."

# Backend health
echo "Backend Health:"
curl -s http://localhost:3000/api/health | jq '.' || echo "Backend not responding"

# AI Service health
echo "AI Service Health:"
curl -s http://localhost:8000/health | jq '.' || echo "AI Service not responding"

# Check logs
echo "📋 Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20

# Check resource usage
echo "💻 Resource usage:"
docker stats --no-stream

echo "✅ Monitoring complete!"
```

## 🔄 Rollback Script

```bash
#!/bin/bash
# rollback.sh

echo "🔄 Rolling back deployment..."

# Get previous commit
PREVIOUS_COMMIT=$(git log --oneline -2 | tail -1 | cut -d' ' -f1)

echo "Rolling back to commit: $PREVIOUS_COMMIT"

# Reset to previous commit
git reset --hard $PREVIOUS_COMMIT

# Force push to trigger redeployment
git push --force origin main

echo "✅ Rollback complete!"
```

## 📱 Mobile App Deployment Script

```bash
#!/bin/bash
# mobile-deploy.sh

echo "📱 Deploying Mobile App..."

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "Installing Expo CLI..."
    npm install -g @expo/cli
fi

# Login to Expo
expo login

# Build for Android
echo "🤖 Building Android APK..."
expo build:android --type apk

# Build for iOS (requires Apple Developer account)
echo "🍎 Building iOS App..."
expo build:ios --type simulator

echo "✅ Mobile app builds initiated!"
echo "Check your Expo dashboard for build progress."
```

## 🎯 Usage Instructions

1. **Make scripts executable:**

   ```bash
   chmod +x *.sh
   ```

2. **Run pre-deployment check:**

   ```bash
   ./pre-deploy-check.sh
   ```

3. **Deploy everything:**

   ```bash
   ./complete-deploy.sh
   ```

4. **Monitor deployment:**

   ```bash
   ./monitor-deployment.sh
   ```

5. **Rollback if needed:**
   ```bash
   ./rollback.sh
   ```

## 🚨 Troubleshooting

### Common Issues and Solutions

1. **Build Failures:**

   - Check Node.js/Python versions
   - Verify all dependencies are installed
   - Check for syntax errors in code

2. **Environment Variable Issues:**

   - Ensure all required variables are set
   - Check variable names match exactly
   - Verify no typos in values

3. **Database Connection Issues:**

   - Check MongoDB Atlas IP whitelist
   - Verify connection string format
   - Ensure database user has proper permissions

4. **CORS Issues:**

   - Update CORS settings with production URLs
   - Check frontend API URLs are correct

5. **Service Health Check Failures:**
   - Check if services are running
   - Verify health check endpoints are accessible
   - Check logs for errors
