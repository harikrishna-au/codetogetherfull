import { Response } from 'express';
import { logger } from './logger.js';

// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, _details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error') {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
  }
}

// Error response helper
export const sendErrorResponse = (res: Response, error: Error | AppError, requestId?: string) => {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const code = isAppError ? error.code : 'INTERNAL_SERVER_ERROR';
  
  // Log the error
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    statusCode,
    code,
    requestId,
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: error.message,
    code,
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
  });
};

// Global error handler middleware
export const globalErrorHandler = (error: Error, req: any, res: Response, _next: any) => {
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return sendErrorResponse(res, new ValidationError(error.message), req.id);
  }
  
  if (error.name === 'CastError') {
    return sendErrorResponse(res, new ValidationError('Invalid ID format'), req.id);
  }
  
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    return sendErrorResponse(res, new DatabaseError('Database operation failed'), req.id);
  }
  
  if (error.name === 'JsonWebTokenError') {
    return sendErrorResponse(res, new AuthenticationError('Invalid token'), req.id);
  }
  
  if (error.name === 'TokenExpiredError') {
    return sendErrorResponse(res, new AuthenticationError('Token expired'), req.id);
  }

  // Handle operational errors
  if (error instanceof AppError && error.isOperational) {
    return sendErrorResponse(res, error, req.id);
  }

  // Handle unknown errors
  logger.error('Unhandled error', {
    message: error.message,
    stack: error.stack,
    requestId: req.id,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
    ...(req.id && { requestId: req.id }),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};