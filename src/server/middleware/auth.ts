import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../models/database';
import { JWT_CONFIG, ERROR_CODES } from '../../shared/constants';
import { CustomError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new CustomError('访问令牌缺失', 401, ERROR_CODES.UNAUTHORIZED);
    }

    // 验证 JWT
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET) as any;
    
    // 检查会话是否存在且有效
    const db = getDatabase();
    const session = await db.get(`
      SELECT us.*, u.id, u.username, u.email
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.token = ? AND us.expires_at > datetime('now')
    `, [token]);

    if (!session) {
      throw new CustomError('访问令牌无效或已过期', 401, ERROR_CODES.TOKEN_EXPIRED);
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: session.id,
      username: session.username,
      email: session.email
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new CustomError('访问令牌无效', 401, ERROR_CODES.INVALID_TOKEN));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new CustomError('访问令牌已过期', 401, ERROR_CODES.TOKEN_EXPIRED));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // 如果有 token，尝试验证
      await authenticateToken(req, res, next);
    } else {
      // 如果没有 token，继续处理但不设置用户信息
      next();
    }
  } catch (error) {
    // 可选认证失败时不阻止请求，但记录错误
    console.warn('可选认证失败:', error);
    next();
  }
};

export const requireRole = (roles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new CustomError('需要身份验证', 401, ERROR_CODES.UNAUTHORIZED);
      }

      // 这里可以扩展角色检查逻辑
      // 目前简单实现，所有认证用户都有权限
      next();
    } catch (error) {
      next(error);
    }
  };
};
