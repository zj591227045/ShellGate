import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../models/database';
import { SSHAdapter } from '../adapters/SSHAdapter';
import { Session, ServerConnection, TerminalSize } from '../../shared/types';
import { SESSION_CONFIG } from '../../shared/constants';

interface ActiveSession {
  id: string;
  userId: string;
  connectionId: string;
  adapter: SSHAdapter;
  status: 'active' | 'inactive' | 'terminated';
  startTime: Date;
  lastActivity: Date;
}

export class SessionManager {
  private activeSessions: Map<string, ActiveSession> = new Map();
  private io: SocketIOServer | null = null;

  setSocketIO(io: SocketIOServer): void {
    this.io = io;
  }

  async createSession(userId: string, connectionId: string, password?: string): Promise<string> {
    const db = getDatabase();
    
    // 获取连接信息
    const connection = await db.get(
      'SELECT * FROM server_connections WHERE id = ? AND user_id = ?',
      [connectionId, userId]
    );

    if (!connection) {
      throw new Error('连接不存在或无权限访问');
    }

    // 检查用户活动会话数量
    const userActiveSessions = Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId && session.status === 'active');

    if (userActiveSessions.length >= SESSION_CONFIG.MAX_SESSIONS_PER_USER) {
      throw new Error(`最多只能同时创建 ${SESSION_CONFIG.MAX_SESSIONS_PER_USER} 个会话`);
    }

    const sessionId = uuidv4();
    
    // 创建数据库会话记录
    await db.run(`
      INSERT INTO sessions (id, user_id, connection_id, status, session_data)
      VALUES (?, ?, ?, 'active', ?)
    `, [sessionId, userId, connectionId, JSON.stringify({ created: new Date().toISOString() })]);

    // 创建协议适配器
    let adapter: SSHAdapter;
    
    if (connection.protocol === 'ssh') {
      adapter = new SSHAdapter(sessionId);
    } else {
      throw new Error(`暂不支持 ${connection.protocol} 协议`);
    }

    // 设置适配器事件监听
    this.setupAdapterEvents(adapter, sessionId);

    // 创建活动会话
    const activeSession: ActiveSession = {
      id: sessionId,
      userId,
      connectionId,
      adapter,
      status: 'active',
      startTime: new Date(),
      lastActivity: new Date()
    };

    this.activeSessions.set(sessionId, activeSession);

    try {
      // 建立连接
      const serverConnection: ServerConnection = {
        id: connection.id,
        userId: connection.user_id,
        name: connection.name,
        host: connection.host,
        port: connection.port,
        protocol: connection.protocol,
        username: connection.username,
        password: connection.password,
        privateKey: connection.private_key,
        description: connection.description,
        tags: connection.tags ? JSON.parse(connection.tags) : [],
        createdAt: new Date(connection.created_at),
        updatedAt: new Date(connection.updated_at)
      };

      await adapter.connect({
        connection: serverConnection,
        password: password || connection.password,
        privateKey: connection.private_key
      });

      // 启动 shell
      await adapter.startShell({ cols: 80, rows: 24 });

      console.log(`✅ 会话创建成功: ${sessionId}`);
      return sessionId;

    } catch (error) {
      // 连接失败，清理会话
      this.activeSessions.delete(sessionId);
      await db.run(
        'UPDATE sessions SET status = "terminated", end_time = datetime("now") WHERE id = ?',
        [sessionId]
      );
      throw error;
    }
  }

  async writeToSession(sessionId: string, data: string, userId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw new Error('会话不存在');
    }

    if (session.userId !== userId) {
      throw new Error('无权限访问此会话');
    }

    if (session.status !== 'active') {
      throw new Error('会话未激活');
    }

    try {
      session.adapter.write(data);
      session.lastActivity = new Date();

      // 记录命令日志（如果是完整命令）
      if (data.includes('\r') || data.includes('\n')) {
        await this.logCommand(sessionId, userId, data.trim());
      }

    } catch (error) {
      throw new Error(`写入会话失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async resizeSession(sessionId: string, size: TerminalSize, userId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw new Error('会话不存在');
    }

    if (session.userId !== userId) {
      throw new Error('无权限访问此会话');
    }

    try {
      session.adapter.resize(size);
      session.lastActivity = new Date();
    } catch (error) {
      throw new Error(`调整会话大小失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async disconnectSession(sessionId: string, userId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw new Error('会话不存在');
    }

    if (session.userId !== userId) {
      throw new Error('无权限访问此会话');
    }

    try {
      await session.adapter.disconnect();
      session.status = 'terminated';
      this.activeSessions.delete(sessionId);

      // 更新数据库
      const db = getDatabase();
      await db.run(
        'UPDATE sessions SET status = "terminated", end_time = datetime("now") WHERE id = ?',
        [sessionId]
      );

      console.log(`✅ 会话断开成功: ${sessionId}`);

    } catch (error) {
      console.error(`❌ 会话断开失败: ${error}`);
      throw new Error(`断开会话失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async getUserActiveSessions(userId: string): Promise<ActiveSession[]> {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId && session.status === 'active');
  }

  async cleanupUserSessions(userId: string): Promise<void> {
    const userSessions = Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId);

    for (const session of userSessions) {
      try {
        await session.adapter.disconnect();
        this.activeSessions.delete(session.id);
      } catch (error) {
        console.error(`❌ 清理用户会话失败: ${session.id} - ${error}`);
      }
    }

    // 更新数据库
    const db = getDatabase();
    await db.run(`
      UPDATE sessions 
      SET status = 'terminated', end_time = datetime('now')
      WHERE user_id = ? AND status = 'active'
    `, [userId]);
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.activeSessions) {
      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
      
      if (timeSinceLastActivity > SESSION_CONFIG.TIMEOUT) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      try {
        const session = this.activeSessions.get(sessionId);
        if (session) {
          await session.adapter.disconnect();
          this.activeSessions.delete(sessionId);
          
          // 通知客户端会话过期
          if (this.io) {
            this.io.to(`session:${sessionId}`).emit('session-expired', {
              sessionId,
              message: '会话因长时间无活动而过期'
            });
          }
        }
      } catch (error) {
        console.error(`❌ 清理过期会话失败: ${sessionId} - ${error}`);
      }
    }

    if (expiredSessions.length > 0) {
      // 更新数据库
      const db = getDatabase();
      await db.run(`
        UPDATE sessions 
        SET status = 'terminated', end_time = datetime('now')
        WHERE id IN (${expiredSessions.map(() => '?').join(',')})
      `, expiredSessions);

      console.log(`🧹 清理了 ${expiredSessions.length} 个过期会话`);
    }
  }

  private setupAdapterEvents(adapter: SSHAdapter, sessionId: string): void {
    // 监听数据输出
    adapter.on('data', (event) => {
      if (this.io) {
        this.io.to(`session:${sessionId}`).emit('terminal-output', {
          sessionId,
          data: event.data
        });
      }
    });

    // 监听连接状态
    adapter.on('connected', (event) => {
      if (this.io) {
        this.io.to(`session:${sessionId}`).emit('session-connected', {
          sessionId,
          message: event.message
        });
      }
    });

    adapter.on('disconnected', (event) => {
      if (this.io) {
        this.io.to(`session:${sessionId}`).emit('session-disconnected', {
          sessionId,
          message: event.message
        });
      }
      
      // 清理会话
      this.activeSessions.delete(sessionId);
    });

    // 监听错误
    adapter.on('error', (event) => {
      if (this.io) {
        this.io.to(`session:${sessionId}`).emit('session-error', {
          sessionId,
          error: event.error
        });
      }
    });

    // 监听 shell 就绪
    adapter.on('shell-ready', (event) => {
      if (this.io) {
        this.io.to(`session:${sessionId}`).emit('shell-ready', {
          sessionId,
          message: event.message
        });
      }
    });
  }

  private async logCommand(sessionId: string, userId: string, command: string): Promise<void> {
    try {
      const db = getDatabase();
      await db.run(`
        INSERT INTO command_logs (id, session_id, user_id, command, timestamp)
        VALUES (?, ?, ?, ?, datetime('now'))
      `, [uuidv4(), sessionId, userId, command]);
    } catch (error) {
      console.error(`❌ 记录命令日志失败: ${error}`);
    }
  }
}
