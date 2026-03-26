import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../observability/logger';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info({ msg: 'MongoDB connected', uri: env.MONGODB_URI });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn({ msg: 'MongoDB disconnected' });
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ msg: 'MongoDB error', error: err });
    });

  } catch (error) {
    logger.error({ msg: 'MongoDB connection failed', error });
    throw error;
  }
}

export function getDBStatus(): 'connected' | 'disconnected' {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info({ msg: 'MongoDB disconnected gracefully' });
}