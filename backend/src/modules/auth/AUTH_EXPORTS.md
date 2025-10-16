# Auth Module Exports

This document lists all exports from the auth module.

## Services

| Export Name             | Type     | File            | Description                         |
| ----------------------- | -------- | --------------- | ----------------------------------- |
| register                | function | auth.service.js | Register a new user                 |
| loginUser               | function | auth.service.js | Authenticate user and return tokens |
| verifyUserEmail         | function | auth.service.js | Verify user email with token        |
| resendVerificationEmail | function | auth.service.js | Resend email verification           |
| sendForgotPasswordEmail | function | auth.service.js | Send password reset email           |
| resetUserPassword       | function | auth.service.js | Reset password with token           |
| refreshAccessToken      | function | auth.service.js | Refresh access token                |
| logoutUser              | function | auth.service.js | Logout user                         |
| changePassword          | function | auth.service.js | Change user password                |
| unlockUserAccount       | function | auth.service.js | Unlock user account                 |

## Routes

| Export Name | Type   | File          | Description                         |
| ----------- | ------ | ------------- | ----------------------------------- |
| authRouter  | Router | auth.route.js | Express router with all auth routes |

## Validation Schemas

| Export Name              | Type   | File               | Description                        |
| ------------------------ | ------ | ------------------ | ---------------------------------- |
| registerSchema           | schema | auth.validation.js | Validation for user registration   |
| loginSchema              | schema | auth.validation.js | Validation for user login          |
| verifyEmailSchema        | schema | auth.validation.js | Validation for email verification  |
| resendVerificationSchema | schema | auth.validation.js | Validation for resend verification |
| forgotPasswordSchema     | schema | auth.validation.js | Validation for forgot password     |
| resetPasswordSchema      | schema | auth.validation.js | Validation for password reset      |
| changePasswordSchema     | schema | auth.validation.js | Validation for password change     |
| unlockAccountSchema      | schema | auth.validation.js | Validation for account unlock      |

## Middleware

| Export Name        | Type     | File    | Description                           |
| ------------------ | -------- | ------- | ------------------------------------- |
| authenticate       | function | auth.js | JWT authentication middleware         |
| authorize          | function | auth.js | Role-based authorization middleware   |
| verifyRefreshToken | function | auth.js | Refresh token verification middleware |

## Usage Examples

### Service Functions

```javascript
import { loginUser, register } from '../modules/auth/auth.service.js';

// Register a new user
const result = await register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  phone: '+1234567890',
  role: 'user',
});

// Login user
const loginResult = await loginUser(
  'john@example.com',
  'password123',
  userAgent,
  ipAddress
);
```

### Routes

```javascript
import { authRouter } from '../modules/auth/auth.route.js';

app.use('/api/auth', authRouter);
```

### Middleware

```javascript
import { authenticate, authorize } from '../modules/auth/auth.js';

// Protect route with authentication
router.get('/profile', authenticate, (req, res) => {
  // Access user via req.user
});

// Protect route with role-based authorization
router.get('/admin', authenticate, authorize('admin'), (req, res) => {
  // Only admins can access
});
```
