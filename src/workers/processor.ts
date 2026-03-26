import { connectDB } from '../config/db';
import { startQueueProcessor } from './queue';
import { logger } from '../observability/logger';

async function startWorker(): Promise<void> {
  logger.info({ msg: 'Starting worker process...' });

  await connectDB();
  startQueueProcessor();

  logger.info({ msg: 'Worker process ready' });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info({ msg: 'Worker SIGTERM received, shutting down...' });
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info({ msg: 'Worker SIGINT received, shutting down...' });
  process.exit(0);
});

startWorker().catch((err) => {
  logger.error({ msg: 'Worker failed to start', error: (err as Error).message });
  process.exit(1);
});