import client from 'prom-client';

// Registry global
const register = new client.Registry();

// Métriques par défaut (CPU, mémoire, etc.)
client.collectDefaultMetrics({ register });

// ─── Métriques métier ──────────────────────────────────────

export const documentsGeneratedTotal = new client.Counter({
  name: 'documents_generated_total',
  help: 'Total number of documents generated',
  labelNames: ['status'],
  registers: [register],
});

export const batchProcessingDuration = new client.Histogram({
  name: 'batch_processing_duration_seconds',
  help: 'Duration of batch processing in seconds',
  labelNames: ['status'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [register],
});

export const queueSize = new client.Gauge({
  name: 'queue_size',
  help: 'Current number of jobs in the queue',
  labelNames: ['state'],
  registers: [register],
});

export const pdfGenerationDuration = new client.Histogram({
  name: 'pdf_generation_duration_seconds',
  help: 'Duration of single PDF generation in seconds',
  labelNames: ['status'],
  buckets: [0.1, 0.5, 1, 2, 3, 5],
  registers: [register],
});

export const activeWorkers = new client.Gauge({
  name: 'active_workers',
  help: 'Number of active PDF worker threads',
  registers: [register],
});

export { register };
