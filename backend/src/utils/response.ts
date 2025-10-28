import { Response } from 'express';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    details?: any;
  };
  timestamp: string;
}

export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode: number = 200): Response => {
  const response: ApiResponse<T> = {
    data,
    message,
    timestamp: new Date().toISOString()
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response, 
  message: string, 
  code: string, 
  statusCode: number = 500, 
  details?: any
): Response => {
  const response: ApiErrorResponse = {
    error: {
      message,
      code,
      details
    },
    timestamp: new Date().toISOString()
  };
  return res.status(statusCode).json(response);
};