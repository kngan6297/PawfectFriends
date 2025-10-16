import { cleanEnv, str, num, bool, url } from 'envalid';

/**
 * Environment variable validation schema for frontend
 * This ensures all required environment variables are present and valid at build time
 * Fails build with clear error messages if validation fails
 */
export const env = cleanEnv(import.meta.env, {
    // API Configuration
    VITE_API_URL: str({ desc: 'Backend API URL' }),




    // Logging Configuration
    VITE_LOG_LEVEL: str({
        choices: ['silent', 'error', 'warn', 'info', 'debug'],
        default: 'info',
        desc: 'Frontend logging level'
    }),

    // Push Notifications
    VITE_VAPID_PUBLIC_KEY: str({ default: '', desc: 'VAPID public key for push notifications' }),

    // App Configuration
    VITE_APP_NAME: str({ default: 'PawfectFriends', desc: 'Application name' }),
    VITE_APP_VERSION: str({ default: '1.0.0', desc: 'Application version' }),

    // Feature Flags
    VITE_ENABLE_ANALYTICS: bool({ default: false, desc: 'Enable analytics tracking' }),
    VITE_ENABLE_DEBUG_MODE: bool({ default: false, desc: 'Enable debug mode' }),
    VITE_ENABLE_PWA: bool({ default: true, desc: 'Enable Progressive Web App features' }),

    // Development Configuration
    VITE_DEV_MODE: bool({ default: false, desc: 'Development mode flag' }),
    VITE_MOCK_API: bool({ default: false, desc: 'Use mock API for development' }),

    // External Services
    VITE_GOOGLE_MAPS_API_KEY: str({ default: '', desc: 'Google Maps API key (optional)' }),
    VITE_STRIPE_PUBLISHABLE_KEY: str({ default: '', desc: 'Stripe publishable key (optional)' }),

    // Content Configuration
    VITE_MAX_FILE_SIZE: num({ default: 10 * 1024 * 1024, desc: 'Maximum file upload size in bytes' }),
    VITE_SUPPORTED_FILE_TYPES: str({
        default: 'image/jpeg,image/png,image/gif,image/webp',
        desc: 'Comma-separated list of supported file types'
    }),

    // Performance Configuration
    VITE_CACHE_TTL: num({ default: 300000, desc: 'Cache TTL in milliseconds (5 minutes)' }),
    VITE_DEBOUNCE_DELAY: num({ default: 300, desc: 'Debounce delay in milliseconds' }),

    // Accessibility Configuration
    VITE_ENABLE_SCREEN_READER: bool({ default: true, desc: 'Enable screen reader support' }),
    VITE_HIGH_CONTRAST_MODE: bool({ default: false, desc: 'Enable high contrast mode' }),

    // Internationalization
    VITE_DEFAULT_LOCALE: str({ default: 'en', desc: 'Default locale' }),
    VITE_SUPPORTED_LOCALES: str({
        default: 'en,es,fr,de',
        desc: 'Comma-separated list of supported locales'
    }),

    // Error Reporting
    VITE_SENTRY_DSN: str({ default: '', desc: 'Sentry DSN for error reporting (optional)' }),
    VITE_SENTRY_ENVIRONMENT: str({ default: 'development', desc: 'Sentry environment' }),

    // Testing Configuration
    VITE_TEST_MODE: bool({ default: false, desc: 'Test mode flag' }),

}, {
    // Validation options
    strict: true,
    // Custom error handler for build-time validation
    onValidationError: (error) => {
        console.error('❌ Frontend environment validation failed:');
        console.error('Missing or invalid environment variables:');
        error.details.forEach((detail) => {
            console.error(`  - ${detail.message}`);
        });
        console.error('\nPlease check your .env file and ensure all required variables are set.');
        console.error('For development, you can copy .env.example and fill in the values.');
        console.error('\nBuild will fail until these issues are resolved.');

        // In build-time context, we need to throw an error to fail the build
        throw new Error('Environment validation failed. Check console for details.');
    }
});

// Conditional validation for optional services
if (env.VITE_GOOGLE_MAPS_API_KEY && !env.VITE_GOOGLE_MAPS_API_KEY.startsWith('AIza')) {
    console.warn('⚠️  VITE_GOOGLE_MAPS_API_KEY format may be invalid (should start with "AIza")');
}

if (env.VITE_STRIPE_PUBLISHABLE_KEY && !env.VITE_STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
    console.warn('⚠️  VITE_STRIPE_PUBLISHABLE_KEY format may be invalid (should start with "pk_")');
}

// Validation for file size limits
if (env.VITE_MAX_FILE_SIZE > 50 * 1024 * 1024) {
    console.warn('⚠️  VITE_MAX_FILE_SIZE is very large (>50MB). Consider reducing for better user experience.');
}

// Validation for cache TTL
if (env.VITE_CACHE_TTL < 60000) {
    console.warn('⚠️  VITE_CACHE_TTL is very short (<1 minute). This may cause excessive API calls.');
}

console.log('✅ Frontend environment validation passed');
console.log(`🔧 Environment: ${env.VITE_DEV_MODE ? 'Development' : 'Production'}`);
console.log(`🌐 API URL: ${env.VITE_API_URL}`);

console.log(`📱 PWA: ${env.VITE_ENABLE_PWA ? 'Enabled' : 'Disabled'}`);
console.log(`📊 Analytics: ${env.VITE_ENABLE_ANALYTICS ? 'Enabled' : 'Disabled'}`);
console.log(`🐛 Debug Mode: ${env.VITE_ENABLE_DEBUG_MODE ? 'Enabled' : 'Disabled'}`);

export default env;
