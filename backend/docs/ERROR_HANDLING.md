# Standardized Error Handling

## Overview

This document describes the standardized error handling implementation for the PawfectFriends authentication system. All authentication endpoints now return consistent error responses with machine-readable error codes and user-friendly messages.

## Error Response Format

All error responses follow this standardized format:

```json
{
  "success": false,
  "errorCode": "MACHINE_READABLE_CODE",
  "userMessage": "User-friendly error message",
  "details": {},
  "statusCode": 400
}
```

### Response Fields

- **success**: Always `false` for error responses
- **errorCode**: Machine-readable error code for programmatic handling
- **userMessage**: Human-readable error message for display to users
- **details**: Additional error details (validation errors, etc.)
- **statusCode**: HTTP status code

## Error Codes

### Validation Errors

- `VALIDATION_FAILED` - General validation failure
- `INVALID_CREDENTIALS` - Invalid login credentials
- `INVALID_TOKEN` - Invalid or malformed token
- `INVALID_EMAIL` - Invalid email format or user not found
- `INVALID_PHONE` - Invalid phone number format

### Authentication Errors

- `UNAUTHORIZED` - Authentication required or failed
- `TOKEN_EXPIRED` - Access token has expired
- `TOKEN_INVALID` - Access token is invalid
- `REFRESH_TOKEN_MISSING` - Refresh token not provided
- `REFRESH_TOKEN_INVALID` - Refresh token is invalid or expired

### Account Errors

- `ACCOUNT_RESTRICTED` - Account is restricted or locked
- `ACCOUNT_LOCKED` - Account is temporarily locked
- `ACCOUNT_NOT_VERIFIED` - Email address not verified
- `ACCOUNT_ALREADY_EXISTS` - User already exists with this email/phone

### Password Errors

- `PASSWORD_TOO_WEAK` - Password doesn't meet strength requirements
- `PASSWORD_MISMATCH` - Current password is incorrect
- `PASSWORD_RESET_EXPIRED` - Password reset token has expired
- `PASSWORD_RESET_INVALID` - Password reset token is invalid

### Email Errors

- `EMAIL_ALREADY_EXISTS` - Email address already in use
- `EMAIL_VERIFICATION_EXPIRED` - Email verification token expired
- `EMAIL_VERIFICATION_INVALID` - Email verification token invalid
- `EMAIL_SEND_FAILED` - Failed to send email

### CSRF Errors

- `CSRF_TOKEN_MISSING` - CSRF token not provided
- `CSRF_TOKEN_INVALID` - CSRF token is invalid or expired
- `CSRF_TOKEN_MISMATCH` - CSRF token mismatch

### Rate Limiting

- `RATE_LIMIT_EXCEEDED` - Too many requests

### Server Errors

- `INTERNAL_SERVER_ERROR` - Internal server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable

## Implementation

### Helper Functions

#### createApiError()

```javascript
import { createApiError, AuthErrorCodes } from '../../utils/errors.js';

const errorResponse = createApiError(
  AuthErrorCodes.INVALID_CREDENTIALS,
  'Email/phone number or password is incorrect.',
  {},
  401
);
```

#### sendErrorResponse()

```javascript
// In auth controller
const sendErrorResponse = (
  res,
  errorCode,
  userMessage,
  details = {},
  statusCode = 400
) => {
  const errorResponse = createApiError(
    errorCode,
    userMessage,
    details,
    statusCode
  );
  return res.status(statusCode).json(errorResponse);
};

// Usage
return sendErrorResponse(
  res,
  AuthErrorCodes.INVALID_CREDENTIALS,
  'Email/phone number or password is incorrect.',
  {},
  401
);
```

## Endpoint Error Handling

### Login Endpoint

```javascript
// 401 - Invalid credentials
{
  "success": false,
  "errorCode": "INVALID_CREDENTIALS",
  "userMessage": "Email/phone number or password is incorrect.",
  "details": {},
  "statusCode": 401
}

// 403 - Account restricted
{
  "success": false,
  "errorCode": "ACCOUNT_RESTRICTED",
  "userMessage": "Your account is restricted. Please contact support.",
  "details": {},
  "statusCode": 403
}
```

### Registration Endpoint

```javascript
// 400 - Validation failed
{
  "success": false,
  "errorCode": "VALIDATION_FAILED",
  "userMessage": "Validation failed",
  "details": {
    "issues": [
      {
        "message": "Email is required",
        "path": ["email"],
        "type": "any.required"
      }
    ]
  },
  "statusCode": 400
}

// 400 - Account already exists
{
  "success": false,
  "errorCode": "ACCOUNT_ALREADY_EXISTS",
  "userMessage": "User with this email or phone already exists",
  "details": {},
  "statusCode": 400
}
```

### Refresh Token Endpoint

```javascript
// 401 - No refresh token
{
  "success": false,
  "errorCode": "REFRESH_TOKEN_MISSING",
  "userMessage": "No refresh token provided",
  "details": {},
  "statusCode": 401
}

// 401 - Invalid refresh token
{
  "success": false,
  "errorCode": "REFRESH_TOKEN_INVALID",
  "userMessage": "Invalid or expired refresh token",
  "details": {},
  "statusCode": 401
}
```

### Email Verification Endpoint

```javascript
// 400 - No token provided
{
  "success": false,
  "errorCode": "INVALID_TOKEN",
  "userMessage": "Verification token is required",
  "details": {},
  "statusCode": 400
}

// 400 - Invalid token
{
  "success": false,
  "errorCode": "EMAIL_VERIFICATION_INVALID",
  "userMessage": "Invalid verification token",
  "details": {},
  "statusCode": 400
}
```

## Frontend Integration

### Error Handling in Frontend

```javascript
// Example error handling in React
const handleLogin = async (credentials) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!data.success) {
      // Handle specific error codes
      switch (data.errorCode) {
        case 'INVALID_CREDENTIALS':
          setError('Invalid email/phone or password');
          break;
        case 'ACCOUNT_RESTRICTED':
          setError('Account is restricted. Please contact support.');
          break;
        case 'ACCOUNT_LOCKED':
          setError('Account is temporarily locked. Please try again later.');
          break;
        default:
          setError(data.userMessage || 'An error occurred');
      }
      return;
    }

    // Handle success
    console.log('Login successful:', data.data);
  } catch (error) {
    setError('Network error. Please try again.');
  }
};
```

### Error Code Constants

```javascript
// Create constants for error codes
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_RESTRICTED: 'ACCOUNT_RESTRICTED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  // ... other error codes
};

// Use in error handling
if (data.errorCode === AUTH_ERROR_CODES.INVALID_CREDENTIALS) {
  // Handle invalid credentials
}
```

## Benefits

### 1. Consistency

- All endpoints return the same error format
- Predictable error handling for frontend developers
- Easier to maintain and debug

### 2. User Experience

- User-friendly error messages
- Specific error codes for different scenarios
- Consistent error display across the application

### 3. Developer Experience

- Machine-readable error codes for programmatic handling
- Detailed error information for debugging
- Clear separation between user and technical messages

### 4. Security

- No sensitive information leaked in error messages
- Consistent error responses prevent information disclosure
- Proper HTTP status codes for different error types

## Migration Notes

### Before (Inconsistent)

```javascript
// Different formats across endpoints
res.status(401).json({
  success: false,
  errorCode: 'INVALID_CREDENTIALS',
  userMessage: 'Invalid credentials',
});

res.status(400).json({
  success: false,
  message: 'Validation failed',
});

next(error); // Goes to error middleware
```

### After (Standardized)

```javascript
// Consistent format across all endpoints
return sendErrorResponse(
  res,
  AuthErrorCodes.INVALID_CREDENTIALS,
  'Email/phone number or password is incorrect.',
  {},
  401
);

return sendErrorResponse(
  res,
  AuthErrorCodes.VALIDATION_FAILED,
  'Validation failed',
  { issues: error.details },
  400
);
```

## Testing

### Unit Tests

```javascript
describe('Auth Error Handling', () => {
  it('should return standardized error for invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' })
      .expect(401);

    expect(response.body).toEqual({
      success: false,
      errorCode: 'INVALID_CREDENTIALS',
      userMessage: 'Email/phone number or password is incorrect.',
      details: {},
      statusCode: 401,
    });
  });
});
```

### Integration Tests

```javascript
describe('Error Response Format', () => {
  it('should return consistent error format for all auth endpoints', async () => {
    const endpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh-token',
      '/api/auth/verify-email',
    ];

    for (const endpoint of endpoints) {
      const response = await request(app).post(endpoint).send({}).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errorCode');
      expect(response.body).toHaveProperty('userMessage');
      expect(response.body).toHaveProperty('statusCode');
    }
  });
});
```

## Best Practices

1. **Always use error codes** - Never return generic error messages
2. **Provide user-friendly messages** - Messages should be clear and actionable
3. **Include relevant details** - Add validation errors or additional context
4. **Use appropriate HTTP status codes** - Match the error type to the status code
5. **Log errors appropriately** - Use security logging for authentication errors
6. **Handle edge cases** - Always have a fallback for unexpected errors
7. **Test error scenarios** - Ensure all error paths are tested

## Future Enhancements

1. **Internationalization** - Support multiple languages for error messages
2. **Error tracking** - Integration with error tracking services
3. **Rate limiting** - Specific error codes for rate limiting scenarios
4. **Audit logging** - Enhanced logging for security-related errors
5. **Error recovery** - Automatic retry mechanisms for transient errors
