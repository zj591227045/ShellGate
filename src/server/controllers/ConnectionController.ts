import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../models/database';
import { CustomError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, ServerConnection, PaginatedResponse } from '../../shared/types';
import { ERROR_CODES, PROTOCOL_PORTS } from '../../shared/constants';

export class ConnectionController {
  async getConnections(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const db = getDatabase();
    const connections = await db.all(`
      SELECT id, name, host, port, protocol, username, description, tags, created_at, updated_at
      FROM server_connections 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);

    const formattedConnections: ServerConnection[] = connections.map((conn: any) => ({
      id: conn.id,
      userId: req.user!.id,
      name: conn.name,
      host: conn.host,
      port: conn.port,
      protocol: conn.protocol,
      username: conn.username,
      description: conn.description,
      tags: conn.tags ? JSON.parse(conn.tags) : [],
      createdAt: new Date(conn.created_at),
      updatedAt: new Date(conn.updated_at)
    }));

    const response: ApiResponse<ServerConnection[]> = {
      success: true,
      data: formattedConnections
    };

    res.json(response);
  }

  async createConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const { name, host, port, protocol, username, password, privateKey, description, tags } = req.body;

    // 验证必填字段
    if (!name || !host || !protocol || !username) {
      throw new CustomError('名称、主机、协议和用户名不能为空', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 验证协议
    const validProtocols = ['ssh', 'telnet', 'rdp', 'vnc', 'sftp'];
    if (!validProtocols.includes(protocol)) {
      throw new CustomError('不支持的协议类型', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 设置默认端口
    const finalPort = port || PROTOCOL_PORTS[protocol as keyof typeof PROTOCOL_PORTS];

    const db = getDatabase();
    const connectionId = uuidv4();

    await db.run(`
      INSERT INTO server_connections (
        id, user_id, name, host, port, protocol, username, password, private_key, description, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      connectionId,
      req.user.id,
      name,
      host,
      finalPort,
      protocol,
      username,
      password || null,
      privateKey || null,
      description || null,
      tags ? JSON.stringify(tags) : null
    ]);

    // 获取创建的连接
    const connection = await db.get(
      'SELECT * FROM server_connections WHERE id = ?',
      [connectionId]
    );

    const formattedConnection: ServerConnection = {
      id: connection.id,
      userId: connection.user_id,
      name: connection.name,
      host: connection.host,
      port: connection.port,
      protocol: connection.protocol,
      username: connection.username,
      description: connection.description,
      tags: connection.tags ? JSON.parse(connection.tags) : [],
      createdAt: new Date(connection.created_at),
      updatedAt: new Date(connection.updated_at)
    };

    const response: ApiResponse<ServerConnection> = {
      success: true,
      data: formattedConnection,
      message: '连接创建成功'
    };

    res.status(201).json(response);
  }

  async getConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const { id } = req.params;
    const db = getDatabase();

    const connection = await db.get(`
      SELECT id, name, host, port, protocol, username, description, tags, created_at, updated_at
      FROM server_connections 
      WHERE id = ? AND user_id = ?
    `, [id, req.user.id]);

    if (!connection) {
      throw new CustomError('连接不存在', 404, ERROR_CODES.CONNECTION_NOT_FOUND);
    }

    const formattedConnection: ServerConnection = {
      id: connection.id,
      userId: req.user.id,
      name: connection.name,
      host: connection.host,
      port: connection.port,
      protocol: connection.protocol,
      username: connection.username,
      description: connection.description,
      tags: connection.tags ? JSON.parse(connection.tags) : [],
      createdAt: new Date(connection.created_at),
      updatedAt: new Date(connection.updated_at)
    };

    const response: ApiResponse<ServerConnection> = {
      success: true,
      data: formattedConnection
    };

    res.json(response);
  }

  async updateConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const { id } = req.params;
    const { name, host, port, protocol, username, password, privateKey, description, tags } = req.body;

    const db = getDatabase();

    // 检查连接是否存在
    const existingConnection = await db.get(
      'SELECT id FROM server_connections WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!existingConnection) {
      throw new CustomError('连接不存在', 404, ERROR_CODES.CONNECTION_NOT_FOUND);
    }

    // 构建更新字段
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (host !== undefined) {
      updateFields.push('host = ?');
      updateValues.push(host);
    }
    if (port !== undefined) {
      updateFields.push('port = ?');
      updateValues.push(port);
    }
    if (protocol !== undefined) {
      updateFields.push('protocol = ?');
      updateValues.push(protocol);
    }
    if (username !== undefined) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    if (password !== undefined) {
      updateFields.push('password = ?');
      updateValues.push(password);
    }
    if (privateKey !== undefined) {
      updateFields.push('private_key = ?');
      updateValues.push(privateKey);
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

    updateFields.push('updated_at = datetime("now")');
    updateValues.push(id);

    await db.run(`
      UPDATE server_connections 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    // 获取更新后的连接
    const updatedConnection = await db.get(
      'SELECT * FROM server_connections WHERE id = ?',
      [id]
    );

    const formattedConnection: ServerConnection = {
      id: updatedConnection.id,
      userId: updatedConnection.user_id,
      name: updatedConnection.name,
      host: updatedConnection.host,
      port: updatedConnection.port,
      protocol: updatedConnection.protocol,
      username: updatedConnection.username,
      description: updatedConnection.description,
      tags: updatedConnection.tags ? JSON.parse(updatedConnection.tags) : [],
      createdAt: new Date(updatedConnection.created_at),
      updatedAt: new Date(updatedConnection.updated_at)
    };

    const response: ApiResponse<ServerConnection> = {
      success: true,
      data: formattedConnection,
      message: '连接更新成功'
    };

    res.json(response);
  }

  async deleteConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const { id } = req.params;
    const db = getDatabase();

    // 检查连接是否存在
    const connection = await db.get(
      'SELECT id FROM server_connections WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!connection) {
      throw new CustomError('连接不存在', 404, ERROR_CODES.CONNECTION_NOT_FOUND);
    }

    // 删除连接（会级联删除相关的会话和日志）
    await db.run('DELETE FROM server_connections WHERE id = ?', [id]);

    const response: ApiResponse = {
      success: true,
      message: '连接删除成功'
    };

    res.json(response);
  }

  async testConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      throw new CustomError('用户信息不存在', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const { id } = req.params;
    const { password } = req.body;

    const db = getDatabase();

    // 获取连接信息
    const connection = await db.get(
      'SELECT * FROM server_connections WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!connection) {
      throw new CustomError('连接不存在', 404, ERROR_CODES.CONNECTION_NOT_FOUND);
    }

    try {
      // TODO: 实现实际的连接测试逻辑
      // 这里暂时模拟测试结果
      const testResult = await this.performConnectionTest(connection, password);

      const response: ApiResponse<{ success: boolean; message: string; latency?: number }> = {
        success: true,
        data: testResult
      };

      res.json(response);
    } catch (error) {
      throw new CustomError(
        `连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
        400,
        ERROR_CODES.CONNECTION_FAILED
      );
    }
  }

  private async performConnectionTest(connection: any, password?: string): Promise<{ success: boolean; message: string; latency?: number }> {
    // 模拟连接测试
    const startTime = Date.now();
    
    // 这里应该根据协议类型调用相应的连接测试逻辑
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const latency = Date.now() - startTime;

    return {
      success: true,
      message: '连接测试成功',
      latency
    };
  }
}
