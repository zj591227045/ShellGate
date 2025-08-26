import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../models/database';
import { CustomError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, CommandLog, FavoriteCommand, PaginatedResponse } from '../../shared/types';
import { ERROR_CODES, API_CONFIG } from '../../shared/constants';

export class CommandController {
  async getCommandHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || API_CONFIG.PAGINATION.DEFAULT_LIMIT, API_CONFIG.PAGINATION.MAX_LIMIT);
    const offset = (page - 1) * limit;

    const db = getDatabase();

    // 获取总数
    const countResult = await db.get(
      'SELECT COUNT(*) as total FROM command_logs WHERE user_id = ?',
      [req.user.id]
    );
    const total = countResult.total;

    // 获取命令历史
    const commands = await db.all(`
      SELECT cl.*, s.id as session_id, sc.name as connection_name
      FROM command_logs cl
      JOIN sessions s ON cl.session_id = s.id
      JOIN server_connections sc ON s.connection_id = sc.id
      WHERE cl.user_id = ?
      ORDER BY cl.timestamp DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, limit, offset]);

    const formattedCommands: CommandLog[] = commands.map((cmd: any) => ({
      id: cmd.id,
      sessionId: cmd.session_id,
      userId: cmd.user_id,
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

  async searchCommandHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const { q: query } = req.query;
    if (!query || typeof query !== 'string') {
      throw new CustomError('搜索关键词不能为空', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || API_CONFIG.PAGINATION.DEFAULT_LIMIT, API_CONFIG.PAGINATION.MAX_LIMIT);
    const offset = (page - 1) * limit;

    const db = getDatabase();
    const searchPattern = `%${query}%`;

    // 获取总数
    const countResult = await db.get(`
      SELECT COUNT(*) as total 
      FROM command_logs 
      WHERE user_id = ? AND command LIKE ?
    `, [req.user.id, searchPattern]);
    const total = countResult.total;

    // 搜索命令
    const commands = await db.all(`
      SELECT cl.*, s.id as session_id, sc.name as connection_name
      FROM command_logs cl
      JOIN sessions s ON cl.session_id = s.id
      JOIN server_connections sc ON s.connection_id = sc.id
      WHERE cl.user_id = ? AND cl.command LIKE ?
      ORDER BY cl.timestamp DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, searchPattern, limit, offset]);

    const formattedCommands: CommandLog[] = commands.map((cmd: any) => ({
      id: cmd.id,
      sessionId: cmd.session_id,
      userId: cmd.user_id,
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

  async getFavoriteCommands(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const db = getDatabase();
    const favorites = await db.all(`
      SELECT id, name, command, description, tags, created_at
      FROM favorite_commands
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);

    const formattedFavorites: FavoriteCommand[] = favorites.map((fav: any) => ({
      id: fav.id,
      userId: req.user!.id,
      name: fav.name,
      command: fav.command,
      description: fav.description,
      tags: fav.tags ? JSON.parse(fav.tags) : [],
      createdAt: new Date(fav.created_at)
    }));

    const response: ApiResponse<FavoriteCommand[]> = {
      success: true,
      data: formattedFavorites
    };

    res.json(response);
  }

  async addFavoriteCommand(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const { name, command, description, tags } = req.body;

    if (!name || !command) {
      throw new CustomError('名称和命令不能为空', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const db = getDatabase();
    const favoriteId = uuidv4();

    await db.run(`
      INSERT INTO favorite_commands (id, user_id, name, command, description, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      favoriteId,
      req.user.id,
      name,
      command,
      description || null,
      tags ? JSON.stringify(tags) : null
    ]);

    // 获取创建的收藏命令
    const favorite = await db.get(
      'SELECT * FROM favorite_commands WHERE id = ?',
      [favoriteId]
    );

    const formattedFavorite: FavoriteCommand = {
      id: favorite.id,
      userId: favorite.user_id,
      name: favorite.name,
      command: favorite.command,
      description: favorite.description,
      tags: favorite.tags ? JSON.parse(favorite.tags) : [],
      createdAt: new Date(favorite.created_at)
    };

    const response: ApiResponse<FavoriteCommand> = {
      success: true,
      data: formattedFavorite,
      message: '收藏命令添加成功'
    };

    res.status(201).json(response);
  }

  async updateFavoriteCommand(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const { id } = req.params;
    const { name, command, description, tags } = req.body;

    const db = getDatabase();

    // 检查收藏命令是否存在
    const existingFavorite = await db.get(
      'SELECT id FROM favorite_commands WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!existingFavorite) {
      throw new CustomError('收藏命令不存在', 404, ERROR_CODES.NOT_FOUND);
    }

    // 构建更新字段
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (command !== undefined) {
      updateFields.push('command = ?');
      updateValues.push(command);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (tags !== undefined) {
      updateFields.push('tags = ?');
      updateValues.push(tags ? JSON.stringify(tags) : null);
    }

    if (updateFields.length === 0) {
      throw new CustomError('没有提供要更新的字段', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    updateValues.push(id);

    await db.run(`
      UPDATE favorite_commands 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    // 获取更新后的收藏命令
    const updatedFavorite = await db.get(
      'SELECT * FROM favorite_commands WHERE id = ?',
      [id]
    );

    const formattedFavorite: FavoriteCommand = {
      id: updatedFavorite.id,
      userId: updatedFavorite.user_id,
      name: updatedFavorite.name,
      command: updatedFavorite.command,
      description: updatedFavorite.description,
      tags: updatedFavorite.tags ? JSON.parse(updatedFavorite.tags) : [],
      createdAt: new Date(updatedFavorite.created_at)
    };

    const response: ApiResponse<FavoriteCommand> = {
      success: true,
      data: formattedFavorite,
      message: '收藏命令更新成功'
    };

    res.json(response);
  }

  async deleteFavoriteCommand(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const { id } = req.params;
    const db = getDatabase();

    // 检查收藏命令是否存在
    const favorite = await db.get(
      'SELECT id FROM favorite_commands WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!favorite) {
      throw new CustomError('收藏命令不存在', 404, ERROR_CODES.NOT_FOUND);
    }

    // 删除收藏命令
    await db.run('DELETE FROM favorite_commands WHERE id = ?', [id]);

    const response: ApiResponse = {
      success: true,
      message: '收藏命令删除成功'
    };

    res.json(response);
  }
}
