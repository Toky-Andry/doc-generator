import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  PORT: parseInt(process.env['PORT'] ?? '3000', 10),
  API_PREFIX: process.env['API_PREFIX'] ?? '/api',

  MONGODB_URI: process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/doc-generator',
  MONGODB_DB_NAME: process.env['MONGODB_DB_NAME'] ?? 'doc-generator',

  REDIS_HOST: process.env['REDIS_HOST'] ?? 'localhost',
  REDIS_PORT: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
  REDIS_PASSWORD: process.env['REDIS_PASSWORD'] ?? '',

  QUEUE_NAME: process.env['QUEUE_NAME'] ?? 'document-generation',
  QUEUE_CONCURRENCY: parseInt(process.env['QUEUE_CONCURRENCY'] ?? '10', 10),

  PDF_TIMEOUT_MS: parseInt(process.env['PDF_TIMEOUT_MS'] ?? '5000', 10),
  PDF_WORKER_POOL_SIZE: parseInt(process.env['PDF_WORKER_POOL_SIZE'] ?? '4', 10),

  RATE_LIMIT_WINDOW_MS: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '60000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] ?? '100', 10),

  CIRCUIT_BREAKER_TIMEOUT: parseInt(process.env['CIRCUIT_BREAKER_TIMEOUT'] ?? '3000', 10),
  CIRCUIT_BREAKER_ERROR_THRESHOLD: parseInt(process.env['CIRCUIT_BREAKER_ERROR_THRESHOLD'] ?? '50', 10),
  CIRCUIT_BREAKER_RESET_TIMEOUT: parseInt(process.env['CIRCUIT_BREAKER_RESET_TIMEOUT'] ?? '30000', 10),

  LOG_LEVEL: process.env['LOG_LEVEL'] ?? 'info',
  JWT_SECRET: process.env['JWT_SECRET'] ?? 'change_me_in_production',
} as const;