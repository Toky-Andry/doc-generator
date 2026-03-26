import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createBatchHandler,
  getBatchHandler,
  getDocumentHandler,
} from '../controllers/documents.controller';
import { validate } from '../middlewares/validate';

const router = Router();

/**
 * POST /api/documents/batch
 * Lance la génération d'un batch de documents
 */
router.post(
  '/batch',
  [
    body('userIds')
      .isArray({ min: 1, max: 1000 })
      .withMessage('userIds must be an array of 1 to 1000 items'),
    body('userIds.*')
      .isString()
      .notEmpty()
      .withMessage('Each userId must be a non-empty string'),
  ],
  validate,
  createBatchHandler
);

/**
 * GET /api/documents/batch/:batchId
 * Retourne le statut d'un batch
 */
router.get(
  '/batch/:batchId',
  [
    param('batchId')
      .isUUID()
      .withMessage('batchId must be a valid UUID'),
  ],
  validate,
  getBatchHandler
);

/**
 * GET /api/documents/:documentId
 * Retourne les infos d'un document
 */
router.get(
  '/:documentId',
  [
    param('documentId')
      .isUUID()
      .withMessage('documentId must be a valid UUID'),
  ],
  validate,
  getDocumentHandler
);

export default router;