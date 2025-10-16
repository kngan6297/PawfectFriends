// backend/src/index.js
/* ---------- 1) Crash hooks super early ---------- */
const bootStartedAt = Date.now();
const stamp = () => new Date().toISOString();

process.on('uncaughtException', (err) => {
  console.error(`[${stamp()}] 💥 uncaughtException:`, err?.stack || err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error(`[${stamp()}] 💥 unhandledRejection:`, err?.stack || err);
  process.exit(1);
});
process.on('exit', (code) => {
  console.error(
    `[${stamp()}] 🛑 process.exit code=${code} (uptime=${(Date.now() - bootStartedAt) / 1000}s)`
  );
});

/* ---------- 2) Helper load() to know which import exploded ---------- */
async function load(name, spec) {
  try {
    const mod = await import(spec);
    return mod;
  } catch (e) {
    console.error(`❌ failed to load ${name} (${spec})`, e?.stack || e);
    throw e;
  }
}

/* ---------- 3) Sequential bootstrap to catch errors at the right place ---------- */
(async function main() {
  console.log('🚀 Starting PawfectFriends Backend Server...');

  // 3.1 load env before EVERYTHING
  const { LOADED_ENV_PATH } = await load('env', './config/env.js');

  // 3.2 import core libs
  const [
    { default: express },
    { default: cors },
    { default: helmet },
    { default: compression },
    { default: cookieParser },
    { default: morgan },
    pathMod,
    { fileURLToPath },
  ] = await Promise.all([
    load('express', 'express'),
    load('cors', 'cors'),
    load('helmet', 'helmet'),
    load('compression', 'compression'),
    load('cookie-parser', 'cookie-parser'),
    load('morgan', 'morgan'),
    load('path', 'path'),
    load('fileURLToPath', 'url'),
  ]);

  const path = pathMod.default || pathMod;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // 3.3 import config/middleware early (low risk)
  const [{ default: config }, { default: logger }] = await Promise.all([
    load('config/index', './config/index.js'),
    load('logger', './utils/logger.js'),
  ]);
  const { apiLimiter } = await load(
    'rateLimiter',
    './middleware/rateLimiter.js'
  );
  const { errorHandler, notFound } = await load(
    'errorHandler',
    './middleware/errorHandler.js'
  );
  const { securityLogger, captureDeviceInfo } = await load(
    'securityLogger',
    './middleware/securityLogger.js'
  );

  // 3.4 import "explosive" services one by one to catch errors at the right place
  const { default: connectDB } = await load('database', './config/database.js');

  // Communication services are now handled by the separate communication app
  // No RTC module loading needed here

  // 3.5 Express app
  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.use(captureDeviceInfo);
  // Parse CORS origins - support both single origin and comma-separated list
  const corsOrigins = config.corsOrigin
    ? config.corsOrigin.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

  // Add Expo web development servers to allowed origins
  const expoOrigins = [
    'http://localhost:8081', // Expo web default
    'http://localhost:8082', // Expo web alternate
    'http://localhost:19006', // Expo web alternate
    'http://localhost:19000', // Expo web alternate
  ];

  const allOrigins = [...corsOrigins, ...expoOrigins];

  app.use(cors({ origin: allOrigins, credentials: true }));
  app.options('*', cors({ origin: allOrigins, credentials: true }));

  app.use(
    express.json({
      limit: '50mb',
      verify: (req, res, buf) => {
        if (!buf.length) return;
        try {
          JSON.parse(buf);
        } catch (e) {
          console.error('❌ Invalid JSON received:', e.message);
        }
      },
    })
  );
  app.use(
    express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 50000 })
  );
  app.use(morgan('dev'));
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use('/api/', apiLimiter);
  app.use(
    '/uploads',
    (await import('express')).default.static(path.join(__dirname, '../uploads'))
  );

  // Root route handler
  app.get('/', (req, res) => {
    res.json({
      message: 'PawfectFriends API Server',
      version: '1.0.0',
      status: 'running',
      timestamp: Date.now(),
      endpoints: {
        health: '/_healthz',
        apiHealth: '/api/health',
        docs: '/api/docs',
      },
    });
  });

  // health first, to know if server is alive
  app.get('/_healthz', (req, res) => {
    res.json({
      ok: true,
      ts: Date.now(),
      env: process.env.NODE_ENV || 'development',
    });
  });

  // API health endpoint for mobile app
  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      ts: Date.now(),
      env: process.env.NODE_ENV || 'development',
      status: 'healthy',
      version: '1.0.0',
    });
  });

  // 3.6 mount routes SLOWLY like "turning on lights one by one"
  const safeUse = (mountPath, rtr, name) => {
    const ok =
      rtr &&
      typeof rtr === 'function' &&
      typeof rtr.use === 'function' &&
      typeof rtr.handle === 'function';
    if (!ok) throw new Error(`Invalid router for ${name} @ ${mountPath}`);
    app.use(mountPath, rtr);
  };

  // only enable core group first, other groups turn on gradually (binary-search the explosion point)
  // Temporarily commented out to isolate the issue
  const { authRouter } = await load(
    'authRouter',
    './modules/auth/auth.route.js'
  );
  const { userRouter } = await load(
    'userRouter',
    './modules/user/user.route.js'
  );
  const { petRouter } = await load('petRouter', './modules/pet/pet.route.js');
  const { reviewRouter } = await load(
    'reviewRouter',
    './modules/review/review.route.js'
  );
  const { shelterRouter } = await load(
    'shelterRouter',
    './modules/shelter/shelter.route.js'
  );
  const { adminRouter } = await load(
    'adminRouter',
    './modules/admin/admin.route.js'
  );
  const { notificationRouter } = await load(
    'notificationRouter',
    './modules/notification/notification.route.js'
  );
  const { activityRouter } = await load(
    'activityRouter',
    './modules/activity/activity.route.js'
  );
  // const { reportRouter } = await load(
  //   'reportRouter',
  //   './modules/report/report.route.js'
  // );
  // const { contentRouter } = await load(
  //   'contentRouter',
  //   './modules/content/content.route.js'
  // );
  const { router: adoptionRouter } = await load(
    'adoptionRouter',
    './modules/adoption/adoption.route.js'
  );
  const { default: favoriteRouter } = await load(
    'favoriteRouter',
    './modules/favorite/favorite.route.js'
  );
  const { recommendationRouter } = await load(
    'recommendationRouter',
    './modules/recommendation/recommendation.route.js'
  );

  // Load conversation and message routers
  const { conversationRouter } = await load(
    'conversationRouter',
    './modules/conversation/conversation.route.js'
  );
  const { messageRouter } = await load(
    'messageRouter',
    './modules/message/message.route.js'
  );

  // Load RTC router for ZIM integration
  const { rtcRouter } = await load('rtcRouter', './modules/rtc/rtc.route.js');

  // Load static file router
  const staticRouter = await load('staticRouter', './routes/static.route.js');

  // mount the "definitely working" ones
  // Temporarily commented out to isolate the issue
  safeUse('/api/auth', authRouter, 'authRouter');
  safeUse('/api/users', userRouter, 'userRouter');
  safeUse('/api/pets', petRouter, 'petRouter');
  safeUse('/api/reviews', reviewRouter, 'reviewRouter');
  safeUse('/api/shelters', shelterRouter, 'shelterRouter');
  safeUse('/api/admin', adminRouter, 'adminRouter');
  safeUse('/api/notifications', notificationRouter, 'notificationRouter');
  safeUse('/api/activities', activityRouter, 'activityRouter');
  // safeUse('/api/reports', reportRouter, 'reportRouter');
  // safeUse('/api/content', contentRouter, 'contentRouter');
  safeUse('/api/adoptions', adoptionRouter, 'adoptionRouter');
  safeUse('/api/favorites', favoriteRouter, 'favoriteRouter');
  safeUse('/api/recommendations', recommendationRouter, 'recommendationRouter');

  // Mount conversation and message routes
  safeUse('/api/conversations', conversationRouter, 'conversationRouter');
  safeUse('/api/messages', messageRouter, 'messageRouter');

  // Mount RTC routes for ZIM integration
  safeUse('/api/rtc', rtcRouter, 'rtcRouter');

  // Mount static file routes
  safeUse('', staticRouter.default, 'staticRouter');

  // errors
  app.use(notFound);
  app.use(errorHandler);
  app.use(securityLogger);

  // 3.7 DB & server start
  try {
    console.log('📡 Connecting DB...');
    await connectDB();
    console.log('✅ DB connected');
  } catch (e) {
    console.error('⚠️ DB connect failed, continue dev mode', e?.message || e);
  }

  const { createServer } = await load('http', 'http');
  const httpServer = createServer(app);
  const PORT = (await config).port || 5000;

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server up on :${PORT}`);
  });

  // 3.8 Initialize scheduled tasks
  try {
    const { initializeScheduledTasks } = await load(
      'scheduler',
      './utils/scheduler.js'
    );
    try {
      initializeScheduledTasks();
      console.log('⏰ Scheduler initialized');
    } catch (e) {
      console.error('❌ scheduler init failed', e);
    }
  } catch (e) {
    console.error('❌ Scheduler initialization failed', e);
  }
})();
