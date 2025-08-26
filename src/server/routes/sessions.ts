import { Router } from 'express';
import { SessionController } from '../controllers/SessionController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const sessionController = new SessionController();

// 所有会话路由都需要认证
router.use(authenticateToken);

// 获取用户的会话列表
router.get('/', asyncHandler(sessionController.getSessions.bind(sessionController)));

// 获取单个会话详情
router.get('/:id', asyncHandler(sessionController.getSession.bind(sessionController)));

// 获取会话的命令历史
router.get('/:id/commands', asyncHandler(sessionController.getSessionCommands.bind(sessionController)));

export default router;
