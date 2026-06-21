const express      = require('express');
const cookieParser = require('cookie-parser');
const helmet       = require('helmet');
const pinoHttp     = require('pino-http');
const logger       = require('./config/logger');
const rateLimit    = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const promClient   = require('prom-client');
const compression  = require('compression');
const path         = require('path');
require('dotenv').config();

const { connectDB, sequelize } = require('./config/db');
const { connectRedis, redisClient } = require('./config/redis');
const requestId = require('./middleware/requestId');

const app = express();
promClient.collectDefaultMetrics({ prefix: 'complaint_' });

app.use(compression());
app.use(requestId);

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

app.use(helmet());
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  store: new RedisStore({ sendCommand: (...args) => redisClient.call(...args), prefix: 'rl:track:' }),
});

app.get('/api/v1/complaints/track/:trackingId', trackLimiter);

app.use('/api/v1/complaints',  require('./routes/complaintRoutes'));
app.use('/api/v1/categories',  require('./routes/categoryRoutes'));

app.get('/api/health', (_req, res) => res.json({ status: 'OK', service: 'complaint-service' }));
app.get('/api/health/ready', async (_req, res) => {
  try {
    await sequelize.authenticate();
    const ping = await redisClient.ping();
    if (ping !== 'PONG') throw new Error('Redis down');
    res.json({ status: 'READY', db: 'ok', redis: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'NOT_READY', error: err.message });
  }
});

app.get('/api/metrics', async (_req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.send(await promClient.register.metrics());
});

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, _req, res, _next) => {
  logger.error({ err }, 'Error');
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const startServer = async () => {
  await connectDB();
  await connectRedis();
  const PORT = process.env.PORT || 5002;
  app.listen(PORT, () => console.log(`Complaint Service running on port ${PORT}`));
};

startServer();
module.exports = app;
