import { Request, Response, NextFunction } from 'express';
import { createBatch, getBatchStatus } from '../../services/batchService';
import { DocumentModel } from '../../models/document.model';
import { createError } from '../middlewares/errorHandler';
import { logger } from '../../observability/logger';

export async function createBatchHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userIds } = req.body as { userIds: string[] };

    logger.info({ msg: 'Creating batch', total: userIds.length });

    const batch = await createBatch(userIds);

    res.status(202).json({
      success: true,
      data: {
        batchId: batch._id,
        status: batch.status,
        totalDocuments: batch.totalDocuments,
        message: 'Batch created and queued for processing',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getBatchHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { batchId } = req.params;

    const batch = await getBatchStatus(batchId);

    if (!batch) {
      return next(createError(`Batch ${batchId} not found`, 404));
    }

    res.status(200).json({
      success: true,
      data: {
        batchId: batch._id,
        status: batch.status,
        totalDocuments: batch.totalDocuments,
        processedDocuments: batch.processedDocuments,
        failedDocuments: batch.failedDocuments,
        documentIds: batch.documentIds,
        startedAt: batch.startedAt,
        completedAt: batch.completedAt,
        createdAt: batch.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getDocumentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { documentId } = req.params;

    const document = await DocumentModel.findById(documentId).lean();

    if (!document) {
      return next(createError(`Document ${documentId} not found`, 404));
    }

    if (document.status !== 'completed') {
      res.status(202).json({
        success: true,
        data: {
          documentId: document._id,
          status: document.status,
          message: 'Document not ready yet',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        documentId: document._id,
        batchId: document.batchId,
        userId: document.userId,
        status: document.status,
        fileName: document.fileName,
        fileSize: document.fileSize,
        generatedAt: document.generatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}