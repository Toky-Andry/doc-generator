import { Request, Response, NextFunction } from 'express';
import { logger } from '../../observability/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? 'Internal Server Error';

  logger.error({
    msg: 'Request error',
    statusCode,
    error: message,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
}

export function createError(message: string, statusCode: number): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
}