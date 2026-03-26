import app from './app';
import { connectDB, disconnectDB } from './config/db';
import { documentQueue } from './services/batchService';
import { startQueueProcessor } from './workers/queue';
import { logger } from './observability/logger';
import { env } from './config/env';

async function startServer(): Promise<void> {
  // 1. Connexion MongoDB
  await connectDB();

  // 2. Démarrer le processor de queue
  startQueueProcessor();

  // 3. Démarrer le serveur HTTP
  const server = app.listen(env.PORT, () => {
    logger.info({ msg: `Server running on port ${env.PORT}` });
    logger.info({ msg: `Swagger docs at http://localhost:${env.PORT}/api-docs` });
    logger.info({ msg: `Health check at http://localhost:${env.PORT}/health` });
    logger.info({ msg: `Metrics at http://localhost:${env.PORT}/metrics` });
  });

  // ── Graceful Shutdown ──────────────────────────────────────
  async function shutdown(signal: string): Promise<void> {
    logger.info({ msg: `${signal} received, shutting down gracefully...` });

    server.close(async () => {
      try {
        await documentQueue.close();
        await disconnectDB();
        logger.info({ msg: 'Graceful shutdown complete' });
        process.exit(0);
      } catch (err) {
        logger.error({ msg: 'Error during shutdown', error: (err as Error).message });
        process.exit(1);
      }
    });

    // Force shutdown après 30s
    setTimeout(() => {
      logger.error({ msg: 'Forced shutdown after timeout' });
      process.exit(1);
    }, 30000);
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ msg: 'Unhandled rejection', reason });
  });

  process.on('uncaughtException', (err) => {
    logger.error({ msg: 'Uncaught exception', error: err.message });
    process.exit(1);
  });
}

startServer().catch((err) => {
  logger.error({ msg: 'Server failed to start', error: (err as Error).message });
  process.exit(1);
});