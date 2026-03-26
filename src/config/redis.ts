import Bull from 'bull';
import { env } from './env';
import { logger } from '../observability/logger';

// Config de connexion Redis
export const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
  tls: env.NODE_ENV === 'production' ? {} : undefined,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number): number | null => {
    if (times > 10) {
      logger.error({ msg: 'Redis: too many retries, giving up' });
      return null;
    }
    const delay = Math.min(times * 100, 3000);
    logger.warn({ msg: `Redis retry attempt ${times}, waiting ${delay}ms` });
    return delay;
  },
};

// Fallback en mémoire si Redis est down
const inMemoryQueue: Map<string, unknown[]> = new Map();
let redisAvailable = true;

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

export function createQueue(name: string): Bull.Queue {
  const queue = new Bull(name, {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  });

  queue.on('error', (err) => {
    redisAvailable = false;
    logger.error({ msg: 'Bull queue error', error: err.message });
  });

  queue.on('ready', () => {
    redisAvailable = true;
    logger.info({ msg: `Queue "${name}" ready` });
  });

  return queue;
}

// Fallback mémoire pour Redis down
export function addToMemoryQueue(queueName: string, job: unknown): void {
  const queue = inMemoryQueue.get(queueName) ?? [];
  queue.push(job);
  inMemoryQueue.set(queueName, queue);
  logger.warn({ msg: 'Using in-memory fallback queue', queueName });
}

export function getMemoryQueue(queueName: string): unknown[] {
  return inMemoryQueue.get(queueName) ?? [];
}