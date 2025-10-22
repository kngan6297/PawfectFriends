# 🚀 PawfectFriends Free Deployment Guide

This guide provides step-by-step instructions for deploying your PawfectFriends application using free hosting platforms.

## 📋 Project Overview

Your PawfectFriends project consists of:

- **Backend**: Node.js/Express API server
- **Frontend**: React/TypeScript web application
- **Communication App**: Vue.js chat application
- **Mobile App**: React Native/Expo mobile application
- **AI Service**: Python/FastAPI ML service
- **Database**: MongoDB

## 🎯 Recommended Deployment Strategy

### **Option 1: Railway + Vercel (Recommended)**

**Why this combination:**

- Railway: Excellent for full-stack apps, supports both Node.js and Python
- Vercel: Best-in-class for frontend applications
- Both have generous free tiers
- Easy GitHub integration

**Cost**: Completely FREE

---

## 🚀 Deployment Steps

### **Step 1: Prepare Your Repository**

1. **Ensure your code is on GitHub**

   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create environment files for production**
   - Copy all `.env.example` files to `.env` in each directory
   - Update with production values (see configuration section below)

### **Step 2: Deploy Backend (Railway)**

1. **Go to [Railway.app](https://railway.app)**
2. **Sign up with GitHub**
3. **Create new project**
4. **Connect your GitHub repository**
5. **Add services:**

   - Click "New Service" → "GitHub Repo"
   - Select your PawfectFriends repository
   - Choose `backend` folder as root directory
   - Railway will auto-detect Node.js

6. **Configure environment variables:**

   ```bash
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pawfectfriends
   JWT_SECRET=your-super-secret-jwt-key
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

7. **Deploy**: Railway will automatically build and deploy

### **Step 3: Deploy AI Service (Railway)**

1. **Add another service in Railway**
2. **Select `ai-service` folder as root directory**
3. **Railway will auto-detect Python**
4. **Configure environment variables:**
   ```bash
   OPENAI_API_KEY=your-openai-api-key
   MODEL_PATH=./recommendation_model.joblib
   ARTIFACTS_PATH=./recommendation_artifacts.joblib
   ```

### **Step 4: Deploy Frontend (Vercel)**

1. **Go to [Vercel.com](https://vercel.com)**
2. **Sign up with GitHub**
3. **Import your repository**
4. **Configure build settings:**

   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Add environment variables:**

   ```bash
   VITE_API_URL=https://your-backend-url.railway.app
   VITE_ZEGO_APP_ID=your-zego-app-id
   VITE_COMM_URL=https://your-comm-url.vercel.app
   ```

6. **Deploy**: Vercel will build and deploy automatically

### **Step 5: Deploy Communication App (Vercel)**

1. **Create another Vercel project**
2. **Configure build settings:**

   - Framework Preset: `Vite`
   - Root Directory: `comm`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add environment variables:**
   ```bash
   VITE_ZEGO_APP_ID=your-zego-app-id
   VITE_API_URL=https://your-backend-url.railway.app
   ```

### **Step 6: Deploy Mobile App (Expo)**

1. **Install Expo CLI:**

   ```bash
   npm install -g @expo/cli
   ```

2. **Login to Expo:**

   ```bash
   expo login
   ```

3. **Configure app.json:**

   ```json
   {
     "expo": {
       "name": "PawfectFriends",
       "slug": "pawfectfriends",
       "version": "1.0.0",
       "platforms": ["ios", "android"],
       "extra": {
         "apiUrl": "https://your-backend-url.railway.app"
       }
     }
   }
   ```

4. **Build for production:**
   ```bash
   cd mobile
   expo build:android
   expo build:ios
   ```

### **Step 7: Set Up MongoDB Atlas**

1. **Go to [MongoDB Atlas](https://www.mongodb.com/atlas)**
2. **Create free account**
3. **Create new cluster (M0 Sandbox - FREE)**
4. **Create database user**
5. **Whitelist IP addresses (0.0.0.0/0 for Railway)**
6. **Get connection string and update Railway environment variables**

---

## 🔧 Alternative Deployment Options

### **Option 2: Render + Vercel**

**Backend on Render:**

1. Go to [Render.com](https://render.com)
2. Connect GitHub repository
3. Create new Web Service
4. Select `backend` folder
5. Use Node.js environment
6. Add environment variables

**AI Service on Render:**

1. Create another Web Service
2. Select `ai-service` folder
3. Use Python environment
4. Add environment variables

### **Option 3: All-in-One Koyeb**

1. Go to [Koyeb.com](https://koyeb.com)
2. Connect GitHub repository
3. Deploy each service as separate apps
4. Configure environment variables for each

---

## 📝 Required Services Setup

### **1. MongoDB Atlas (Free)**

- 512MB storage
- Shared clusters
- Perfect for development/small production

### **2. Cloudinary (Free)**

- 25GB storage
- 25GB bandwidth
- Image/video upload service

### **3. ZegoCloud (Free)**

- Real-time communication
- Video calls and chat
- Generous free tier

### **4. Email Service**

- **Gmail SMTP** (free with app password)
- **SendGrid** (100 emails/day free)
- **Mailgun** (10,000 emails/month free)

---

## 🔒 Security Considerations

### **Environment Variables**

- Never commit `.env` files to Git
- Use strong, unique secrets for production
- Rotate API keys regularly

### **CORS Configuration**

Update your backend CORS settings:

```javascript
const corsOptions = {
  origin: ["https://your-frontend.vercel.app", "https://your-comm.vercel.app"],
  credentials: true,
};
```

### **HTTPS**

All platforms provide free SSL certificates automatically.

---

## 📊 Monitoring & Maintenance

### **Free Monitoring Tools**

- **Railway**: Built-in metrics and logs
- **Vercel**: Analytics and performance monitoring
- **MongoDB Atlas**: Database monitoring
- **UptimeRobot**: Free uptime monitoring

### **Log Management**

- Railway provides built-in logs
- Vercel provides function logs
- Consider upgrading to paid plans for advanced logging

---

## 🚨 Troubleshooting

### **Common Issues**

1. **Build Failures**

   - Check Node.js/Python versions
   - Verify all dependencies are in package.json/requirements.txt
   - Check build logs for specific errors

2. **Environment Variables**

   - Ensure all required variables are set
   - Check variable names match exactly
   - Verify no typos in values

3. **CORS Errors**

   - Update CORS settings with production URLs
   - Check frontend API URLs are correct

4. **Database Connection**
   - Verify MongoDB Atlas IP whitelist
   - Check connection string format
   - Ensure database user has proper permissions

---

## 💰 Cost Breakdown

### **Free Tier Limits**

**Railway:**

- $5 credit monthly
- Usually sufficient for small-medium apps
- Auto-scales based on usage

**Vercel:**

- Unlimited deployments
- 100GB bandwidth
- Perfect for frontend apps

**MongoDB Atlas:**

- 512MB storage
- Shared clusters
- Good for development

**Total Monthly Cost: $0** (within free tier limits)

---

## 🎯 Next Steps

1. **Start with Railway + Vercel** (recommended)
2. **Set up MongoDB Atlas**
3. **Configure all environment variables**
4. **Test each service individually**
5. **Monitor usage and performance**
6. **Scale up as needed**

---

## 📞 Support

- **Railway**: [Discord Community](https://discord.gg/railway)
- **Vercel**: [Documentation](https://vercel.com/docs)
- **MongoDB Atlas**: [Community Forums](https://community.mongodb.com)

---

**Happy Deploying! 🚀**

Your PawfectFriends app will be live and helping pets find their forever homes!
