import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const authController = new AuthController();

// 登录
router.post('/login', asyncHandler(authController.login.bind(authController)));

// 登出
router.post('/logout', authenticateToken, asyncHandler(authController.logout.bind(authController)));

// 刷新令牌
router.post('/refresh', asyncHandler(authController.refresh.bind(authController)));

// 获取当前用户信息
router.get('/me', authenticateToken, asyncHandler(authController.getCurrentUser.bind(authController)));

// 修改密码
router.post('/change-password', authenticateToken, asyncHandler(authController.changePassword.bind(authController)));

export default router;
