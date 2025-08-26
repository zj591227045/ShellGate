import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || '';

  // 记录请求开始
  console.log(`📥 ${method} ${url} - ${ip} - ${userAgent}`);

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    // 根据状态码选择不同的日志级别
    const logLevel = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
    
    console.log(
      `📤 ${logLevel} ${method} ${url} - ${statusCode} - ${duration}ms - ${ip}`
    );
  });

  next();
};
