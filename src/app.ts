import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { rateLimiter } from './api/middlewares/rateLimiter';
import { errorHandler, notFoundHandler } from './api/middlewares/errorHandler';
import documentsRouter from './api/routes/documents.routes';
import { healthHandler } from './health/health';
import { register } from './observability/metrics';
import { env } from './config/env';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const swaggerDocument = require('../swagger.json') as Record<string, unknown>;

const app = express();

// ── Sécurité ────────────────────────────────────────────────
app.use(helmet());
app.use(rateLimiter);

// ── Parsing ─────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health & Metrics ────────────────────────────────────────
app.get('/health', healthHandler);

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ── Swagger ─────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ── Routes API ──────────────────────────────────────────────
app.use(`${env.API_PREFIX}/documents`, documentsRouter);

// ── 404 + Error handler ─────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;