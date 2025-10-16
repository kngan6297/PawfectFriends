# Security Policy

## Overview
This document outlines the security practices and guidelines for the PawfectFriends project.

## 🔒 Security Guidelines

### Environment Variables
- **NEVER** commit `.env` files or any files containing real API keys, secrets, or credentials
- Always use `.env.example` files with placeholder values
- Use environment variables for all sensitive configuration

### API Keys and Secrets
- **NEVER** hardcode API keys, secrets, or tokens in source code
- Use placeholder values like `YOUR_API_KEY_HERE` in example files
- Store all secrets in environment variables

### Logging
- **NEVER** log sensitive information (passwords, API keys, personal data)
- Use structured logging with appropriate log levels
- Regularly rotate and clean log files

### User Data
- **NEVER** commit files containing user data
- Use proper data sanitization in logs and error messages
- Implement proper data encryption for sensitive data

## 🚨 Security Checklist

Before committing any code, ensure:
- [ ] No `.env` files are included
- [ ] No hardcoded API keys or secrets
- [ ] No sensitive data in logs
- [ ] No user data in committed files
- [ ] All environment variables use placeholders

## 📋 Environment Setup

### Required Environment Variables

#### Backend (.env)
```bash
# Server Configuration
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/pawfectfriends

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
SESSION_SECRET=your_session_secret_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=false

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ZegoCloud Configuration
ZEGO_APP_ID=your_zego_app_id
ZEGO_SERVER_SECRET=your_zego_server_secret
ZEGO_CALLBACK_SECRET=your_zego_callback_secret

# Petfinder API
PETFINDER_API_KEY=your_petfinder_api_key
PETFINDER_API_SECRET=your_petfinder_api_secret

# OpenAI (Optional)
OPENAI_API_KEY=your_openai_api_key
```

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000/api
VITE_ZEGO_APP_ID=your_zego_app_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## 🔐 Production Security

### Deployment Checklist
- [ ] All environment variables properly configured
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Error handling without data exposure
- [ ] Logging configured (no sensitive data)
- [ ] Database connections secured
- [ ] File uploads validated and scanned

---

**Remember**: Security is everyone's responsibility. When in doubt, ask for help or err on the side of caution.
