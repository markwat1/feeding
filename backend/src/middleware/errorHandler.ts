import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: any;
  };
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  const errorResponse: ErrorResponse = {
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  };

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json(errorResponse);
};