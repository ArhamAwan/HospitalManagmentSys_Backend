import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[] | Record<string, unknown>;
  };
}

export function ok<T>(res: Response, data: T, message = 'Operation successful'): Response<SuccessResponse<T>> {
  return res.json({
    success: true,
    data,
    message
  });
}

export function created<T>(res: Response, data: T, message = 'Resource created'): Response<SuccessResponse<T>> {
  return res.status(201).json({
    success: true,
    data,
    message
  });
}

export function fail(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: string[] | Record<string, unknown>
): Response<ErrorResponse> {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  });
}

