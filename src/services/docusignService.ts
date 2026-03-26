import CircuitBreaker from 'opossum';
import { logger } from '../observability/logger';

// Simule un appel DocuSign externe
async function callDocuSign(documentId: string): Promise<{ signed: boolean; envelopeId: string }> {
  // Simule latence réseau
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 50));

  // Simule 5% d'échec
  if (Math.random() < 0.05) {
    throw new Error('DocuSign service unavailable');
  }

  return {
    signed: true,
    envelopeId: `ENV-${documentId}-${Date.now()}`,
  };
}

const breakerOptions = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  name: 'docusign',
};

const docuSignBreaker = new CircuitBreaker(callDocuSign, breakerOptions);

docuSignBreaker.on('open', () => {
  logger.warn({ msg: 'DocuSign circuit breaker OPEN — calls blocked' });
});

docuSignBreaker.on('halfOpen', () => {
  logger.info({ msg: 'DocuSign circuit breaker HALF-OPEN — testing...' });
});

docuSignBreaker.on('close', () => {
  logger.info({ msg: 'DocuSign circuit breaker CLOSED — service recovered' });
});

export async function signDocument(
  documentId: string
): Promise<{ signed: boolean; envelopeId: string } | null> {
  try {
    const result = await docuSignBreaker.fire(documentId) as { signed: boolean; envelopeId: string };
    return result;
  } catch (err) {
    logger.error({ msg: 'DocuSign call failed', documentId, error: (err as Error).message });
    return null;
  }
}