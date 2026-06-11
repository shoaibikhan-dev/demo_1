const express    = require('express');
const cookieParser = require('cookie-parser');
const helmet     = require('helmet');
const pinoHttp   = require('pino-http');
const logger     = require('./config/logger');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');

const promClient = require('prom-client');
const compression = require('compression');
require('dotenv').config();

const { connectDB, sequelize } = require('./config/db');
const { protect, adminOnly } = require('./middleware/authMiddleware');
const requestId = require('./middleware/requestId');
const { connectRedis, redisClient } = require('./config/redis');

const app = express();

// Initialize Prometheus Metrics Collection
promClient.collectDefaultMetrics({ prefix: 'msc_' });

// ── Compression & Trace Middlewares ──────────────────────────────────────────
app.use(compression());
app.use(requestId);

// ── CORS Middleware ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const allowedOrigins = ['https://mardan.local', process.env.CLIENT_URL];
  if (allowedOrigins.includes(req.headers.origin)) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// ── Security Headers (Helmet) ─────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'"],
      objectSrc:  ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// ── Streaming Logger ─────────────────────────────────────────────────────────
app.use(pinoHttp({ logger }));

// ── Tightened Body Parsers (Prevents Memory Allocation Exhaustion) ────────────
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Centralized Cluster Rate Limiters ─────────────────────────────────────────
const sharedRedisConfig = {
  sendCommand: (...args) => redisClient.call(...args),
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ ...sharedRedisConfig, prefix: 'rl:login:' }),
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many registration attempts. Please try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ ...sharedRedisConfig, prefix: 'rl:register:' }),
});

const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many tracking attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ ...sharedRedisConfig, prefix: 'rl:track:' }),
});

// ── Static Files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Pre-Route Limiter Interceptors ────────────────────────────────────────────
app.post('/api/v1/auth/login',    loginLimiter);
app.post('/api/v1/auth/register', registerLimiter);
app.get('/api/v1/complaints/track/:trackingId', trackLimiter);

// ── Core Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',          require('./routes/authRoutes'));
app.use('/api/v1/complaints',    require('./routes/complaintRoutes'));
app.use('/api/v1/users',         require('./routes/userRoutes'));
app.use('/api/v1/categories',    require('./routes/categoryRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));

// ── Kubernetes Liveness & Readiness Probes ────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:    'OK',
    project:   'Mardan Smart City Complaint Portal',
    version:   process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
  });
});

app.get('/api/health/ready', async (_req, res) => {
  try {
    await sequelize.authenticate();
    const redisPing = await redisClient.ping();
    if (redisPing !== 'PONG') throw new Error('Redis connection drop detected');
    res.json({ status: 'READY', db: 'ok', redis: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'NOT_READY', error: err.message });
  }
});

// ── Production Metrics Scrape Target ──────────────────────────────────────────
app.get('/api/metrics', async (_req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.send(await promClient.register.metrics());
});

// ── Error Management Handlers ────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  logger.error({ err }, 'Global operational failure intercepted');
  res.status(err.status || 500).json({
    success: false,
    message: err.status ? err.message : 'Internal Server Error',
  });
});

// ── Synchronized Lifecycled Boot Sequence ─────────────────────────────────────
const startServer = async () => {
  try {
    const PORT = process.env.PORT || 5000;
    
    await connectDB();
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`🏙️  Mardan Smart City API → Online on Port ${PORT}`);
      console.log(`📊 Metrics Exposed     → Base URI /api/metrics`);
    });
  } catch (criticalInitializationError) {
    logger.fatal(criticalInitializationError, 'System crash during bootstrap initialization sequence');
    process.exit(1);
  }
};

startServer();

module.exports = app;
