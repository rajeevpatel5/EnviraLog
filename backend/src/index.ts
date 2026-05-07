import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import authRoutes    from './routes/auth';
import deviceRoutes  from './routes/devices';
import dataRoutes    from './routes/data';
import alertRoutes   from './routes/alerts';
import adminRoutes   from './routes/admin';
import reportRoutes  from './routes/reports';
import mqttRoutes    from './routes/mqtt';
import forecastRoutes from './routes/forecast';

import { errorHandler }          from './middleware/errorHandler';
import { prisma } from './lib/prisma';
import { autoConnectFromEnv, getMqttStatus } from './services/mqtt';

const app = express();

const PORT = process.env.PORT || 3001;

// ── Security & middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/devices',  deviceRoutes);
app.use('/api/data',     dataRoutes);
app.use('/api/alerts',   alertRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/reports',  reportRoutes);
app.use('/api/mqtt',     mqttRoutes);
app.use('/api/forecast', forecastRoutes);

app.get('/', (_req, res) =>
  res.json({ status: 'EnviroLog Backend', message: 'Use /api/health or /api/docs' })
);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);
app.get('/api/docs', (_req, res) => res.json({
  openapi: '3.0.0',
  info: { title: 'EnviroLog API', version: '1.1.0' },
  paths: {
    '/api/auth/register':     { post: { summary: 'Register' } },
    '/api/auth/login':        { post: { summary: 'Login' } },
    '/api/devices':           { get: { summary: 'List devices' }, post: { summary: 'Create device' } },
    '/api/data':              { get: { summary: 'Sensor readings' } },
    '/api/alerts':            { get: { summary: 'Alerts' } },
    '/api/mqtt/status':       { get: { summary: 'MQTT connection status' } },
    '/api/mqtt/connect':      { post: { summary: 'Connect to HiveMQ Cloud' } },
    '/api/mqtt/disconnect':   { post: { summary: 'Disconnect MQTT' } },
    '/api/mqtt/publish':      { post: { summary: 'Publish a message' } },
    '/api/mqtt/test-publish': { post: { summary: 'Publish a test reading' } },
  },
}));

app.use(errorHandler);

// ── Start server ───────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🌍 EnviroLog Server  →  port ${PORT}`);
  console.log(`🔗 Client URL        →  ${process.env.CLIENT_URL || 'https://iot-frontend-wt67.vercel.app'}`);
  console.log(`🐝 HiveMQ Host       →  ${process.env.HIVEMQ_HOST || '(not configured)'}\n`);

  try {
    await prisma.$connect();
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  }

  // Auto-connect to HiveMQ Cloud if credentials are configured
  autoConnectFromEnv();

  // Log MQTT connection status after a brief delay
  setTimeout(() => {
    const mqttStatus = getMqttStatus();
    if (mqttStatus.connected) {
      console.log('✅ MQTT: Connected to HiveMQ Cloud successfully!');
    } else if (mqttStatus.connecting) {
      console.log('⏳ MQTT: Connecting to HiveMQ Cloud...');
    } else {
      console.log('❌ MQTT: Not connected to HiveMQ Cloud');
      if (mqttStatus.lastError) {
        console.log(`   Last error: ${mqttStatus.lastError}`);
      }
    }
  }, 3000);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
