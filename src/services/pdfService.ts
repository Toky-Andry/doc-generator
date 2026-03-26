import PDFDocument from 'pdfkit';
import { Writable } from 'stream';
import { env } from '../config/env';
import { logger } from '../observability/logger';
import { pdfGenerationDuration } from '../observability/metrics';

export interface PDFData {
  userId: string;
  documentId: string;
  generatedAt: Date;
}

export async function generatePDF(data: PDFData): Promise<Buffer> {
  const end = pdfGenerationDuration.startTimer();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      end({ status: 'timeout' });
      reject(new Error(`PDF generation timeout after ${env.PDF_TIMEOUT_MS}ms`));
    }, env.PDF_TIMEOUT_MS);

    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      const writable = new Writable({
        write(chunk: Buffer, _encoding, callback) {
          chunks.push(chunk);
          callback();
        },
      });

      doc.pipe(writable);

      // ── Header ──────────────────────────────────────────────
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('CERFA N° 12345*01', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(12)
        .font('Helvetica')
        .text('Document officiel généré automatiquement', { align: 'center' })
        .moveDown(1.5);

      // ── Séparateur ──────────────────────────────────────────
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor('#cccccc')
        .stroke()
        .moveDown(1);

      // ── Corps ───────────────────────────────────────────────
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Informations du document')
        .moveDown(0.5);

      doc
        .font('Helvetica')
        .fontSize(10)
        .text(`Identifiant utilisateur : ${data.userId}`)
        .text(`Identifiant document   : ${data.documentId}`)
        .text(`Date de génération     : ${data.generatedAt.toISOString()}`)
        .moveDown(1.5);

      // ── Footer ──────────────────────────────────────────────
      doc
        .fontSize(8)
        .fillColor('#888888')
        .text(
          'Document généré automatiquement — Ne pas modifier',
          50,
          750,
          { align: 'center' }
        );

      doc.end();

      writable.on('finish', () => {
        clearTimeout(timeout);
        const buffer = Buffer.concat(chunks);
        end({ status: 'success' });
        logger.debug({ msg: 'PDF generated', documentId: data.documentId, size: buffer.length });
        resolve(buffer);
      });

      writable.on('error', (err) => {
        clearTimeout(timeout);
        end({ status: 'error' });
        reject(err);
      });

    } catch (err) {
      clearTimeout(timeout);
      end({ status: 'error' });
      reject(err);
    }
  });
}