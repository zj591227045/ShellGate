import { Router } from 'express';
import authRoutes from './auth';
import connectionRoutes from './connections';
import sessionRoutes from './sessions';
import commandRoutes from './commands';

export function setupRoutes(): Router {
  const router = Router();

  // 认证路由
  router.use('/auth', authRoutes);
  
  // 连接管理路由
  router.use('/connections', connectionRoutes);
  
  // 会话管理路由
  router.use('/sessions', sessionRoutes);
  
  // 命令相关路由
  router.use('/commands', commandRoutes);

  return router;
}
