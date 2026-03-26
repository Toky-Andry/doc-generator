import { Request, Response } from 'express';
import { getDBStatus } from '../config/db';
import { isRedisAvailable } from '../config/redis';
import { documentQueue } from '../services/batchService';

export async function healthHandler(
  _req: Request,
  res: Response
): Promise<void> {
  const dbStatus = getDBStatus();
  const redisStatus = isRedisAvailable() ? 'connected' : 'down';

  let queueStatus = 'unknown';
  try {
    await documentQueue.getJobCounts();
    queueStatus = 'connected';
  } catch {
    queueStatus = 'down';
  }

  const isHealthy =
    dbStatus === 'connected' && redisStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
      queue: queueStatus,
    },
  });
}