import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Prisma client with optimized settings for high-frequency MQTT messages
// Connection pool is configured via DATABASE_URL parameters:
// ?connection_limit=20&pool_timeout=30
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;