import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../shared/types';
import { ERROR_CODES } from '../../shared/constants';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = ERROR_CODES.INTERNAL_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { statusCode = 500, message, code = ERROR_CODES.INTERNAL_ERROR } = error;

  // 处理特定类型的错误
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = '请求参数验证失败';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = ERROR_CODES.INVALID_TOKEN;
    message = '无效的访问令牌';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = ERROR_CODES.TOKEN_EXPIRED;
    message = '访问令牌已过期';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = '无效的请求参数';
  }

  // 记录错误日志
  if (statusCode >= 500) {
    console.error('服务器错误:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  } else {
    console.warn('客户端错误:', {
      message: error.message,
      url: req.url,
      method: req.method,
      ip: req.ip,
      statusCode,
      timestamp: new Date().toISOString()
    });
  }

  // 构造响应
  const response: ApiResponse = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      code 
    })
  };

  res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new CustomError(
    `路径 ${req.originalUrl} 不存在`,
    404,
    ERROR_CODES.NOT_FOUND
  );
  next(error);
};
