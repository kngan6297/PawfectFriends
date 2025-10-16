import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, __dirname, ''); // load all keys

    // Environment validation at build time
    const requiredEnvVars = [
        'VITE_API_URL',
        'VITE_SOCKET_URL',
        'VITE_ZEGO_APP_ID'
    ];

    const missingVars = requiredEnvVars.filter(key => !env[key]);
    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(key => console.error(`  - ${key}`));
        console.error('\nBuild will fail. Please check your .env file.');
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    console.log('✅ Environment validation passed in Vite config');
    console.log('VITE_ZEGO_APP_ID from vite.config:', env.VITE_ZEGO_APP_ID);

    return {
        plugins: [
            react(),
            nodePolyfills({
                include: ['buffer', 'process', 'util', 'stream', 'url']
            })
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        define: {
            'process.env': {},
            'global': 'globalThis'
        },
        server: {
            port: 5173,
            proxy: {
                '/api': {
                    target: 'http://localhost:5000',
                    changeOrigin: true,
                    secure: false
                },
                '/socket.io': {
                    target: 'http://localhost:5000',
                    ws: true,
                    changeOrigin: true,
                    secure: false,
                    configure: (proxy, options) => {
                        proxy.on('error', (err, req, res) => {
                            console.log('proxy error', err);
                        });
                        proxy.on('proxyReq', (proxyReq, req, res) => {
                            console.log('Sending Request to the Target:', req.method, req.url);
                        });
                        proxy.on('proxyRes', (proxyRes, req, res) => {
                            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
                        });
                    },
                },
            },
            // Add WebSocket-specific server options
            hmr: {
                port: 3002, // Use different port for HMR to avoid conflicts
            },
        },
        optimizeDeps: {
            exclude: ['url'],
            esbuildOptions: {
                define: {
                    global: 'globalThis'
                }
            }
        },
        build: {
            // Ensure environment validation happens during build
            rollupOptions: {
                onwarn(warning, warn) {
                    // Suppress warnings about missing environment variables during build
                    if (warning.code === 'MISSING_EXTERNAL_IMPORT') {
                        return;
                    }
                    warn(warning);
                }
            }
        }
    };
});