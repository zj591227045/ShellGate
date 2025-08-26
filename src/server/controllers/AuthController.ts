import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../models/database';
import { JWT_CONFIG, ERROR_CODES, SECURITY_CONFIG } from '../../shared/constants';
import { CustomError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, User } from '../../shared/types';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new CustomError('用户名和密码不能为空', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const db = getDatabase();
    
    // 查找用户
    const user = await db.get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (!user) {
      throw new CustomError('用户名或密码错误', 401, ERROR_CODES.INVALID_CREDENTIALS);
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new CustomError('用户名或密码错误', 401, ERROR_CODES.INVALID_CREDENTIALS);
    }

    // 生成 JWT
    const payload = { userId: user.id, username: user.username };
    const secret = JWT_CONFIG.SECRET as string;
    const options: any = { expiresIn: JWT_CONFIG.EXPIRES_IN };
    const token = jwt.sign(payload, secret, options);

    // 计算过期时间
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + this.parseExpiresIn(JWT_CONFIG.EXPIRES_IN));

    // 保存会话
    const sessionId = uuidv4();
    await db.run(`
      INSERT INTO user_sessions (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `, [sessionId, user.id, token, expiresAt.toISOString()]);

    // 清理过期会话
    await db.run(
      'DELETE FROM user_sessions WHERE expires_at < datetime("now")'
    );

    const response: ApiResponse<{ token: string; user: Omit<User, 'password'> }> = {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at)
        }
      }
    };

    res.json(response);
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const db = getDatabase();
      await db.run('DELETE FROM user_sessions WHERE token = ?', [token]);
    }

    const response: ApiResponse = {
      success: true,
      message: '登出成功'
    };

    res.json(response);
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const { token } = req.body;

    if (!token) {
      throw new CustomError('刷新令牌不能为空', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const db = getDatabase();
    
    // 验证现有会话
    const session = await db.get(`
      SELECT us.*, u.username, u.email
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.token = ? AND us.expires_at > datetime('now')
    `, [token]);

    if (!session) {
      throw new CustomError('刷新令牌无效或已过期', 401, ERROR_CODES.TOKEN_EXPIRED);
    }

    // 生成新的 JWT
    const payload = { userId: session.user_id, username: session.username };
    const secret = JWT_CONFIG.SECRET as string;
    const options: any = { expiresIn: JWT_CONFIG.EXPIRES_IN };
    const newToken = jwt.sign(payload, secret, options);

    // 计算新的过期时间
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + this.parseExpiresIn(JWT_CONFIG.EXPIRES_IN));

    // 更新会话
    await db.run(`
      UPDATE user_sessions 
      SET token = ?, expires_at = ?
      WHERE id = ?
    `, [newToken, expiresAt.toISOString(), session.id]);

    const response: ApiResponse<{ token: string }> = {
      success: true,
      data: { token: newToken }
    };

    res.json(response);
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const db = getDatabase();
    const user = await db.get(
      'SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      throw new CustomError('用户不存在', 404, ERROR_CODES.USER_NOT_FOUND);
    }

    const response: ApiResponse<Omit<User, 'password'>> = {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at)
      }
    };

    res.json(response);
  }

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new CustomError('当前密码和新密码不能为空', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    if (newPassword.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
      throw new CustomError(
        `密码长度不能少于 ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} 位`,
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const db = getDatabase();
    
    // 获取用户当前密码
    const user = await db.get(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      throw new CustomError('用户不存在', 404, ERROR_CODES.USER_NOT_FOUND);
    }

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new CustomError('当前密码错误', 401, ERROR_CODES.INVALID_CREDENTIALS);
    }

    // 加密新密码
    const newPasswordHash = await bcrypt.hash(newPassword, SECURITY_CONFIG.BCRYPT_ROUNDS);

    // 更新密码
    await db.run(`
      UPDATE users 
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [newPasswordHash, req.user.id]);

    // 删除所有现有会话，强制重新登录
    await db.run('DELETE FROM user_sessions WHERE user_id = ?', [req.user.id]);

    const response: ApiResponse = {
      success: true,
      message: '密码修改成功，请重新登录'
    };

    res.json(response);
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // 默认 7 天

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
