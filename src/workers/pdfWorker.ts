import { generatePDF } from '../services/pdfService';
import { signDocument } from '../services/docusignService';
import { DocumentModel } from '../models/document.model';
import { Batch } from '../models/batch.model';
import { logger } from '../observability/logger';
import { documentsGeneratedTotal } from '../observability/metrics';

export interface PDFJob {
  documentId: string;
  userId: string;
  batchId: string;
}

export async function processPDFJob(job: PDFJob): Promise<void> {
  const { documentId, userId, batchId } = job;
  const jobLogger = logger.child({ documentId, userId, batchId });

  // Marquer comme "processing"
  await DocumentModel.findByIdAndUpdate(documentId, {
    status: 'processing',
    $inc: { attempts: 1 },
  });

  try {
    jobLogger.info({ msg: 'Starting PDF generation' });

    // 1. Générer le PDF
    const pdfBuffer = await generatePDF({
      userId,
      documentId,
      generatedAt: new Date(),
    });

    // 2. Appel DocuSign (circuit breaker)
    const signResult = await signDocument(documentId);

    // 3. Marquer document comme completed
    await DocumentModel.findByIdAndUpdate(documentId, {
      status: 'completed',
      fileSize: pdfBuffer.length,
      fileName: `document-${documentId}.pdf`,
      generatedAt: new Date(),
      ...(signResult && { gridfsFileId: signResult.envelopeId }),
    });

    // 4. Incrémenter le compteur batch
    await Batch.findByIdAndUpdate(batchId, {
      $inc: { processedDocuments: 1 },
    });

    // 5. Vérifier si batch est completé
    await checkBatchCompletion(batchId);

    documentsGeneratedTotal.inc({ status: 'success' });
    jobLogger.info({ msg: 'PDF generated successfully', size: pdfBuffer.length });

  } catch (err) {
    const error = err as Error;
    jobLogger.error({ msg: 'PDF generation failed', error: error.message });

    await DocumentModel.findByIdAndUpdate(documentId, {
      status: 'failed',
      error: error.message,
    });

    await Batch.findByIdAndUpdate(batchId, {
      $inc: { failedDocuments: 1 },
    });

    await checkBatchCompletion(batchId);

    documentsGeneratedTotal.inc({ status: 'error' });
    throw err; // Bull va retry
  }
}

async function checkBatchCompletion(batchId: string): Promise<void> {
  const batch = await Batch.findById(batchId);
  if (!batch) return;

  const total = batch.processedDocuments + batch.failedDocuments;

  if (total >= batch.totalDocuments) {
    const finalStatus = batch.failedDocuments === 0 ? 'completed' : 'completed';
    await Batch.findByIdAndUpdate(batchId, {
      status: finalStatus,
      completedAt: new Date(),
    });
    logger.info({
      msg: 'Batch completed',
      batchId,
      processed: batch.processedDocuments,
      failed: batch.failedDocuments,
    });
  }
}