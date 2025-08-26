import { Response } from 'express';
import { getDatabase } from '../models/database';
import { CustomError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, Session, CommandLog, PaginatedResponse } from '../../shared/types';
import { ERROR_CODES, API_CONFIG } from '../../shared/constants';

export class SessionController {
  async getSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || API_CONFIG.PAGINATION.DEFAULT_LIMIT, API_CONFIG.PAGINATION.MAX_LIMIT);
    const offset = (page - 1) * limit;

    const db = getDatabase();

    // 获取总数
    const countResult = await db.get(
      'SELECT COUNT(*) as total FROM sessions WHERE user_id = ?',
      [req.user.id]
    );
    const total = countResult.total;

    // 获取会话列表
    const sessions = await db.all(`
      SELECT s.*, sc.name as connection_name, sc.host, sc.port, sc.protocol
      FROM sessions s
      JOIN server_connections sc ON s.connection_id = sc.id
      WHERE s.user_id = ?
      ORDER BY s.start_time DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, limit, offset]);

    const formattedSessions: Session[] = sessions.map((session: any) => ({
      id: session.id,
      userId: session.user_id,
      connectionId: session.connection_id,
      status: session.status,
      startTime: new Date(session.start_time),
      endTime: session.end_time ? new Date(session.end_time) : undefined,
      lastActivity: new Date(session.last_activity),
      data: session.session_data ? JSON.parse(session.session_data) : undefined
    }));

    const response: ApiResponse<PaginatedResponse<Session>> = {
      success: true,
      data: {
        items: formattedSessions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  }

  async getSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const { id } = req.params;
    const db = getDatabase();

    const session = await db.get(`
      SELECT s.*, sc.name as connection_name, sc.host, sc.port, sc.protocol
      FROM sessions s
      JOIN server_connections sc ON s.connection_id = sc.id
      WHERE s.id = ? AND s.user_id = ?
    `, [id, req.user.id]);

    if (!session) {
      throw new CustomError('会话不存在', 404, ERROR_CODES.SESSION_NOT_FOUND);
    }

    const formattedSession: Session = {
      id: session.id,
      userId: session.user_id,
      connectionId: session.connection_id,
      status: session.status,
      startTime: new Date(session.start_time),
      endTime: session.end_time ? new Date(session.end_time) : undefined,
      lastActivity: new Date(session.last_activity),
      data: session.session_data ? JSON.parse(session.session_data) : undefined
    };

    const response: ApiResponse<Session> = {
      success: true,
      data: formattedSession
    };

    res.json(response);
  }

  async getSessionCommands(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || API_CONFIG.PAGINATION.DEFAULT_LIMIT, API_CONFIG.PAGINATION.MAX_LIMIT);
    const offset = (page - 1) * limit;

    const db = getDatabase();

    // 验证会话是否属于当前用户
    const session = await db.get(
      'SELECT id FROM sessions WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!session) {
      throw new CustomError('会话不存在', 404, ERROR_CODES.SESSION_NOT_FOUND);
    }

    // 获取总数
    const countResult = await db.get(
      'SELECT COUNT(*) as total FROM command_logs WHERE session_id = ?',
      [id]
    );
    const total = countResult.total;

    // 获取命令列表
    const commands = await db.all(`
      SELECT id, command, output, timestamp, duration
      FROM command_logs
      WHERE session_id = ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `, [id, limit, offset]);

    const formattedCommands: CommandLog[] = commands.map((cmd: any) => ({
      id: cmd.id,
      sessionId: id,
      userId: req.user!.id,
      command: cmd.command,
      output: cmd.output,
      timestamp: new Date(cmd.timestamp),
      duration: cmd.duration
    }));

    const response: ApiResponse<PaginatedResponse<CommandLog>> = {
      success: true,
      data: {
        items: formattedCommands,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  }
}
