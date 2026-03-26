import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  base: {
    service: 'doc-generator',
    env: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Logger avec contexte (batchId, documentId)
export function createContextLogger(context: Record<string, string>): pino.Logger {
  return logger.child(context);
}