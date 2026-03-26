import { documentQueue } from '../services/batchService';
import { processPDFJob, PDFJob } from './pdfWorker';
import { logger } from '../observability/logger';
import { env } from '../config/env';
import { batchProcessingDuration } from '../observability/metrics';

export function startQueueProcessor(): void {
  documentQueue.process(
    'generate-pdf',
    env.QUEUE_CONCURRENCY,
    async (job) => {
      const data = job.data as PDFJob;
      const end = batchProcessingDuration.startTimer();

      try {
        await processPDFJob(data);
        end({ status: 'success' });
      } catch (err) {
        end({ status: 'error' });
        throw err;
      }
    }
  );

  documentQueue.on('completed', (job) => {
    logger.debug({ msg: 'Job completed', jobId: job.id });
  });

  documentQueue.on('failed', (job, err) => {
    logger.error({
      msg: 'Job failed',
      jobId: job.id,
      attempt: job.attemptsMade,
      error: err.message,
    });
  });

  documentQueue.on('stalled', (job) => {
    logger.warn({ msg: 'Job stalled', jobId: job.id });
  });

  logger.info({
    msg: 'Queue processor started',
    concurrency: env.QUEUE_CONCURRENCY,
  });
}