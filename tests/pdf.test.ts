import { generatePDF } from '../src/services/pdfService';

describe('generatePDF', () => {
  it('should generate a PDF buffer', async () => {
    const buffer = await generatePDF({
      userId: 'test-user',
      documentId: 'test-doc',
      generatedAt: new Date(),
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should generate PDF with correct header', async () => {
    const buffer = await generatePDF({
      userId: 'user-123',
      documentId: 'doc-456',
      generatedAt: new Date(),
    });

    // PDF files start with %PDF
    const header = buffer.slice(0, 4).toString();
    expect(header).toBe('%PDF');
  });
});