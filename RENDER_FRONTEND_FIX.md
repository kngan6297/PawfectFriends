# Render.com Frontend Configuration

## 🚨 **Issue Identified**

- Empty build command
- Missing publish directory (`dist` folder)
- Build step was skipped

## ✅ **Solution: Create render.yaml**

Create a `render.yaml` file in your project root:

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
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
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

  - type: web
    name: pawfectfriends-ai
    env: python
    plan: free
    buildCommand: pip install -r requirements-minimal.txt
    startCommand: python -m uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
    envVars:
      - key: OPENAI_API_KEY
        sync: false
      - key: MODEL_PATH
        value: ./recommendation_model.joblib
      - key: ARTIFACTS_PATH
        value: ./recommendation_artifacts.joblib

  - type: web
    name: pawfectfriends-frontend
    env: static
    plan: free
    buildCommand: npm install && npm run build
    staticPublishPath: ./frontend/dist
    envVars:
      - key: VITE_API_URL
        value: https://pawfectfriends-backend.onrender.com
      - key: VITE_ZEGO_APP_ID
        sync: false
      - key: VITE_COMM_URL
        value: https://pawfectfriends-comm.onrender.com

  - type: web
    name: pawfectfriends-comm
    env: static
    plan: free
    buildCommand: npm install && npm run build
    staticPublishPath: ./comm/dist
    envVars:
      - key: VITE_ZEGO_APP_ID
        sync: false
      - key: VITE_API_URL
        value: https://pawfectfriends-backend.onrender.com
```

## 🔧 **Quick Fix Steps**

### **Step 1: Create render.yaml**

```bash
# Create render.yaml in your project root
touch render.yaml
# Copy the content above into render.yaml
```

### **Step 2: Update Render Service Settings**

1. Go to your Render dashboard
2. Click on your frontend service
3. Go to Settings
4. Update these settings:
   ```
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

### **Step 3: Redeploy**

1. Click "Manual Deploy" → "Deploy latest commit"
2. Or push a new commit to trigger redeploy

## 🚀 **Alternative: Manual Service Configuration**

If render.yaml doesn't work, configure manually:

### **Frontend Service Settings**

```
Name: pawfectfriends-frontend
Environment: Static Site
Region: Oregon (US West)
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

### **Environment Variables**

```
VITE_API_URL=https://pawfectfriends-backend.onrender.com
VITE_ZEGO_APP_ID=your-zego-app-id
VITE_COMM_URL=https://pawfectfriends-comm.onrender.com
```

## 🔍 **Common Issues & Solutions**

### **Issue 1: Build Command Empty**

**Solution**: Set build command to `npm install && npm run build`

### **Issue 2: Publish Directory Missing**

**Solution**: Set publish directory to `dist`

### **Issue 3: Root Directory Wrong**

**Solution**: Set root directory to `frontend`

### **Issue 4: Environment Variables Missing**

**Solution**: Add all required VITE\_ variables

## 🎯 **Expected Results**

After fixing:

- ✅ Build command will run
- ✅ `dist` folder will be created
- ✅ Frontend will deploy successfully
- ✅ Static site will be accessible

## 📞 **Need Help?**

1. **Check Render logs** for specific errors
2. **Verify package.json** has build script
3. **Test build locally**: `cd frontend && npm run build`
4. **Check Vite config** for output directory

The frontend deployment will work once the build command and publish directory are properly configured! 🚀
