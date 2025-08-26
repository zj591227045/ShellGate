import { Router } from 'express';
import { CommandController } from '../controllers/CommandController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const commandController = new CommandController();

// 所有命令路由都需要认证
router.use(authenticateToken);

// 获取命令历史
router.get('/history', asyncHandler(commandController.getCommandHistory.bind(commandController)));

// 搜索命令历史
router.get('/history/search', asyncHandler(commandController.searchCommandHistory.bind(commandController)));

// 获取收藏命令
router.get('/favorites', asyncHandler(commandController.getFavoriteCommands.bind(commandController)));

// 添加收藏命令
router.post('/favorites', asyncHandler(commandController.addFavoriteCommand.bind(commandController)));

// 更新收藏命令
router.put('/favorites/:id', asyncHandler(commandController.updateFavoriteCommand.bind(commandController)));

// 删除收藏命令
router.delete('/favorites/:id', asyncHandler(commandController.deleteFavoriteCommand.bind(commandController)));

export default router;
