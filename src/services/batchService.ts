import { v4 as uuidv4 } from 'uuid';
import { Batch, IBatch } from '../models/batch.model';
import { DocumentModel } from '../models/document.model';
import { createQueue, addToMemoryQueue, isRedisAvailable } from '../config/redis';
import { logger } from '../observability/logger';
import { queueSize } from '../observability/metrics';
import { env } from '../config/env';

const documentQueue = createQueue(env.QUEUE_NAME);

// Mise à jour du gauge queue size toutes les 5s
setInterval(() => {
  void documentQueue.getJobCounts().then((counts) => {
    queueSize.set({ state: 'waiting' }, counts.waiting ?? 0);
    queueSize.set({ state: 'active' }, counts.active ?? 0);
    queueSize.set({ state: 'failed' }, counts.failed ?? 0);
  });
}, 5000);

export async function createBatch(userIds: string[]): Promise<IBatch> {
  const batchId = uuidv4();

  const documents = userIds.map((userId) => ({
    _id: uuidv4(),
    batchId,
    userId,
    status: 'pending' as const,
    attempts: 0,
  }));

  // Sans transaction (MongoDB standalone)
  await DocumentModel.insertMany(documents);

  const batch = await Batch.create({
    _id: batchId,
    userIds,
    status: 'pending',
    totalDocuments: userIds.length,
    processedDocuments: 0,
    failedDocuments: 0,
    documentIds: documents.map((d) => d._id),
  });

  // Enqueue les jobs
  if (isRedisAvailable()) {
    const jobs = documents.map((doc) => ({
      name: 'generate-pdf',
      data: { documentId: doc._id, userId: doc.userId, batchId },
    }));
    await documentQueue.addBulk(jobs);
    logger.info({ msg: 'Batch enqueued', batchId, total: userIds.length });
  } else {
    documents.forEach((doc) => {
      addToMemoryQueue(env.QUEUE_NAME, {
        documentId: doc._id,
        userId: doc.userId,
        batchId,
      });
    });
    logger.warn({ msg: 'Batch added to memory queue (Redis down)', batchId });
  }

  return batch;
}

export async function getBatchStatus(batchId: string): Promise<IBatch | null> {
  return Batch.findById(batchId).lean<IBatch>();
}

export { documentQueue };