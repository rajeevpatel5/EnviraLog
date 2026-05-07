/**
 * HiveMQ Cloud MQTT Service
 * ──────────────────────────────────────────────────────────────────────────────
 * Connects to HiveMQ Cloud over TLS (port 8883), subscribes to all sensor
 * topics, and saves incoming readings to PostgreSQL.
 */

import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { prisma } from '../lib/prisma';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface MqttConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  topicPrefix: string;
  useTls: boolean;
  clientId: string;
}

export interface MqttStatus {
  connected: boolean;
  connecting: boolean;
  lastConnectedAt: string | null;
  lastDisconnectedAt: string | null;
  lastError: string | null;
  messagesReceived: number;
  readingsSaved: number;
  host: string | null;
}

// ─── Module state ──────────────────────────────────────────────────────────────

let client: MqttClient | null = null;
let currentConfig: MqttConfig | null = null;

const status: MqttStatus = {
  connected: false,
  connecting: false,
  lastConnectedAt: null,
  lastDisconnectedAt: null,
  lastError: null,
  messagesReceived: 0,
  readingsSaved: 0,
  host: null,
};


// ─── Public API ────────────────────────────────────────────────────────────────

export function getMqttStatus(): MqttStatus {
  return { ...status };
}

export function getMqttConfig(): Omit<MqttConfig, 'password'> | null {
  if (!currentConfig) return null;
  const { password: _omit, ...safe } = currentConfig;
  return safe;
}

// ─── Connect / Disconnect ──────────────────────────────────────────────────────

export async function connectMqtt(config: MqttConfig): Promise<void> {
  await disconnectMqtt();

  currentConfig = config;

  const protocol = config.useTls ? 'mqtts' : 'mqtt';
  const url = `${protocol}://${config.host}:${config.port}`;

  const options: IClientOptions = {
    clientId: config.clientId || `envirologapp-${Date.now()}`,
    username: String(config.username),
    password: String(config.password),
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 15000,
    keepalive: 60,
    ...(config.useTls && { rejectUnauthorized: true }),
  };

  status.connecting = true;
  status.lastError = null;
  status.host = config.host;

  client = mqtt.connect(url, options);

  client.on('connect', () => {
    status.connected = true;
    status.connecting = false;
    status.lastConnectedAt = new Date().toISOString();

    console.log(`🔗 MQTT Connected to HiveMQ Cloud:`);
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Client ID: ${options.clientId}`);
    console.log(`   Username: ${config.username}`);
    console.log(`   TLS: ${config.useTls ? 'Enabled' : 'Disabled'}`);
    console.log(`   Connected At: ${status.lastConnectedAt}`);

    // Subscribe to ALL topics on HiveMQ
    client!.subscribe('#', { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ MQTT: Subscription error:', err.message);
        status.lastError = err.message;
      } else {
        console.log(`📡 MQTT: Subscribed to ALL topics (#) on HiveMQ Cloud`);
        console.log('🎯 Ready to receive all events from HiveMQ Cloud...');
      }
    });
  });

  client.on('message', (topic, message) => {
    handleMessage(topic, message.toString(), config.topicPrefix);
  });

  client.on('error', (err) => {
    status.lastError = err.message;
    status.connecting = false;
    console.error('❌ MQTT Error:', err.message);
    console.error(`   Error occurred at: ${new Date().toISOString()}`);
    console.error(`   Connection status: ${status.connected ? 'Connected' : 'Disconnected'}`);
  });

  client.on('offline', () => {
    status.connected = false;
    status.lastDisconnectedAt = new Date().toISOString();
    console.log(`📴 MQTT Gone Offline: ${new Date().toISOString()}`);
    console.log(`   Will attempt to reconnect in 5 seconds...`);
  });

  client.on('reconnect', () => {
    status.connecting = true;
    console.log(`🔄 MQTT Reconnecting...`);
  });

  client.on('close', () => {
    status.connected = false;
    status.connecting = false;
    status.lastDisconnectedAt = new Date().toISOString();
    console.log(`🔌 MQTT Connection Closed: ${new Date().toISOString()}`);
  });
}

export async function disconnectMqtt(): Promise<void> {
  if (client) {
    await new Promise<void>((resolve) => client!.end(true, {}, () => resolve()));
    client = null;
  }
  status.connected = false;
  status.connecting = false;
  status.lastDisconnectedAt = new Date().toISOString();
}

// ─── Publish ──────────────────────────────────────────────────────────────────

export function publishMqtt(topic: string, payload: object): boolean {
  if (!client || !status.connected) return false;
  client.publish(topic, JSON.stringify(payload), { qos: 1 });
  return true;
}

// ─── Auto-connect from environment ────────────────────────────────────────────

export function autoConnectFromEnv(): void {
  const host = process.env.HIVEMQ_HOST;
  const username = process.env.HIVEMQ_USERNAME;
  const password = process.env.HIVEMQ_PASSWORD;

  if (!host || !username || !password) {
    console.log('ℹ️  HiveMQ: No credentials in .env — MQTT auto-connect skipped.');
    return;
  }

  const config: MqttConfig = {
    host,
    port: parseInt(process.env.HIVEMQ_PORT || '8883'),
    username: String(username),
    password: String(password),
    topicPrefix: process.env.HIVEMQ_TOPIC_PREFIX || 'envirologapp',
    useTls: (process.env.HIVEMQ_USE_TLS || 'true') === 'true',
    clientId: process.env.HIVEMQ_CLIENT_ID || `envirologapp-server-${Date.now()}`,
  };

  connectMqtt(config).catch(err =>
    console.error('MQTT auto-connect failed:', err.message)
  );
}

// ─── Message handling ──────────────────────────────────────────────────────────

async function handleMessage(topic: string, raw: string, topicPrefix: string): Promise<void> {
  status.messagesReceived++;

  // Log incoming MQTT events (less verbose)
  console.log(`📨 [${status.messagesReceived}] ${topic} → ${raw.substring(0, 80)}...`);

  try {
    // Try to parse as JSON
    let payload: Record<string, any> = {};
    try {
      payload = JSON.parse(raw);
    } catch {
      console.log('⚠️  Non-JSON message, skipping');
      return;
    }

    // Get device_id from payload or topic
    const deviceId = payload.device_id || topic.split('/').pop() || 'unknown';

    // Check if it's a status message
    if (payload.status) {
      await handleStatusMessage(deviceId, raw);
      return;
    }

    // Process as sensor data - direct insert
    await persistReading(deviceId, payload);
  } catch (err: any) {
    console.error(`MQTT: Error on topic "${topic}":`, err.message);
  }
}


// ─── Status messages ──────────────────────────────────────────────────────────

async function handleStatusMessage(deviceId: string, raw: string): Promise<void> {
  let newStatus = 'OFFLINE';
  try {
    const parsed = JSON.parse(raw);
    newStatus = (parsed.status ?? raw).toString().toUpperCase();
  } catch {
    newStatus = raw.trim().toUpperCase();
  }
  if (!['ONLINE', 'OFFLINE', 'MAINTENANCE'].includes(newStatus)) return;

  const device = await findDevice(deviceId);
  if (!device) return;

  const updated = await prisma.device.update({
    where: { id: device.id },
    data: { status: newStatus as any },
    include: { user: { select: { id: true, email: true } } },
  });

  console.log(`📟 MQTT: [${device.name}] status → ${newStatus}`);
}

// ─── Persist to DB ─────────────────────────────────────────────────────────────

async function persistReading(deviceId: string, payload: Record<string, any>): Promise<void> {
  let device = await findDevice(deviceId);

  // Auto-create device if it doesn't exist
  if (!device) {
    device = await prisma.device.create({
      data: {
        name: deviceId,
        location: 'Unknown',
        type: 'ARDUINO',
        status: 'ONLINE',
        userId: await getDefaultUserId(),
      },
    });
    console.log(`✅ Created device: ${device.name}`);
  }

  const data = {
    deviceId: device.id,
    temperature: toFloat(payload.temperature),
    humidity: toFloat(payload.humidity),
    airQuality: toFloat(payload.air_quality ?? payload.airQuality),
    flame: payload.flame === true || payload.flame === 'true' || payload.flame === 1,
    rawDeviceId: payload.device_id ?? null,
  };

  await prisma.sensorData.create({ data });
  status.readingsSaved++;

  console.log(`💾 Saved [${status.readingsSaved}]: ${deviceId} temp=${data.temperature}°C humidity=${data.humidity}% airQuality=${data.airQuality}`);

  // Check thresholds
  if (data.temperature && data.temperature > 40) {
    console.log(`🚨 Critical TEMPERATURE: ${data.temperature} °C`);
  }
  if (data.humidity && data.humidity > 90) {
    console.log(`🚨 Critical HUMIDITY: ${data.humidity} %`);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getDefaultUserId(): Promise<string> {
  // Get first admin user, or create one if none exists
  let user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!user) {
    user = await prisma.user.findFirst();
  }
  if (!user) {
    // Create a default user if none exists
    user = await prisma.user.create({
      data: {
        email: 'default@envirolog.local',
        password: 'default',
        name: 'Default User',
        role: 'ADMIN',
      },
    });
    console.log('👤 Created default user for auto-created devices');
  }
  return user.id;
}

async function findDevice(identifier: string) {
  let device = await prisma.device.findUnique({ where: { id: identifier } });
  if (!device) {
    device = await prisma.device.findFirst({
      where: { name: { equals: identifier, mode: 'insensitive' } },
    });
  }
  return device;
}

function toFloat(val: unknown): number | null {
  if (val === undefined || val === null || val === '') return null;
  const n = parseFloat(String(val));
  return isNaN(n) ? null : parseFloat(n.toFixed(4));
}

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}