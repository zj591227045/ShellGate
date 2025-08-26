import { Request, Response, NextFunction } from 'express';
import { API_CONFIG } from '../../shared/constants';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = API_CONFIG.RATE_LIMIT.WINDOW_MS;
  const maxRequests = API_CONFIG.RATE_LIMIT.MAX_REQUESTS;

  // 清理过期的记录
  if (store[key] && now > store[key]!.resetTime) {
    delete store[key];
  }

  // 初始化或更新计数
  if (!store[key]) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs
    };
  } else {
    store[key]!.count++;
  }

  // 检查是否超过限制
  if (store[key]!.count > maxRequests) {
    const resetTime = Math.ceil((store[key]!.resetTime - now) / 1000);

    res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后再试',
      retryAfter: resetTime
    });
    return;
  }

  // 设置响应头
  res.set({
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': (maxRequests - store[key]!.count).toString(),
    'X-RateLimit-Reset': new Date(store[key]!.resetTime).toISOString()
  });

  next();
};

// 清理过期记录的定时任务
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (now > store[key].resetTime) {
      delete store[key];
    }
  });
}, 60000); // 每分钟清理一次
