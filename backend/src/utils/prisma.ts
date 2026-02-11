import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';

// Prevent multiple instances of Prisma Client in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (config.nodeEnv !== 'production') {
  global.prisma = prisma;
}

export default prisma;
