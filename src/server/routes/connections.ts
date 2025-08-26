import { Router } from 'express';
import { ConnectionController } from '../controllers/ConnectionController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const connectionController = new ConnectionController();

// 所有连接路由都需要认证
router.use(authenticateToken);

// 获取用户的所有连接
router.get('/', asyncHandler(connectionController.getConnections.bind(connectionController)));

// 创建新连接
router.post('/', asyncHandler(connectionController.createConnection.bind(connectionController)));

// 获取单个连接
router.get('/:id', asyncHandler(connectionController.getConnection.bind(connectionController)));

// 更新连接
router.put('/:id', asyncHandler(connectionController.updateConnection.bind(connectionController)));

// 删除连接
router.delete('/:id', asyncHandler(connectionController.deleteConnection.bind(connectionController)));

// 测试连接
router.post('/:id/test', asyncHandler(connectionController.testConnection.bind(connectionController)));

export default router;
