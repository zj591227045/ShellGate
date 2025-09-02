import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../models/database';
import { JWT_CONFIG, WS_CONFIG } from '../../shared/constants';
import { WSMessage, WSMessageType, TerminalSize } from '../../shared/types';
import { SessionManager } from './SessionManager';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

const sessionManager = new SessionManager();

export function setupWebSocket(io: SocketIOServer): void {
  // WebSocket 认证中间件
  io.use(async (socket: AuthenticatedSocket, next: any) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('认证令牌缺失'));
      }

      // 验证 JWT
      const decoded = jwt.verify(token, JWT_CONFIG.SECRET) as any;
      
      // 检查会话是否有效
      const db = getDatabase();
      const session = await db.get(`
        SELECT us.*, u.username
        FROM user_sessions us
        JOIN users u ON us.user_id = u.id
        WHERE us.token = ? AND us.expires_at > datetime('now')
      `, [token]);

      if (!session) {
        return next(new Error('认证令牌无效或已过期'));
      }

      socket.userId = session.user_id;
      socket.username = session.username;
      
      next();
    } catch (error) {
      next(new Error('认证失败'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 WebSocket 连接建立: ${socket.username} (${socket.id})`);

    // 加入用户房间
    socket.join(`user:${socket.userId}`);

    // 发送连接成功消息
    socket.emit('connected', {
      message: '连接成功',
      userId: socket.userId,
      username: socket.username
    });

    // 处理创建会话
    socket.on('create-session', async (data: { connectionId: string; password?: string }) => {
      try {
        if (!socket.userId) {
          throw new Error('用户未认证');
        }

        const sessionId = await sessionManager.createSession(
          socket.userId,
          data.connectionId,
          data.password
        );

        // 加入会话房间
        socket.join(`session:${sessionId}`);

        socket.emit('session-created', {
          sessionId,
          connectionId: data.connectionId,
          message: '会话创建成功'
        });

        console.log(`✅ 会话创建成功: ${sessionId} (用户: ${socket.username})`);

        // 延迟启动 shell，确保客户端已加入房间
        setTimeout(async () => {
          try {
            await sessionManager.startSessionShell(sessionId, socket.userId!);
            console.log(`✅ Shell 延迟启动成功: ${sessionId}`);
          } catch (error) {
            console.error(`❌ Shell 延迟启动失败: ${error}`);
            socket.emit('session-error', {
              sessionId,
              error: error instanceof Error ? error.message : 'Shell 启动失败'
            });
          }
        }, 100);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '会话创建失败';
        socket.emit('session-error', {
          connectionId: data.connectionId,
          error: errorMessage
        });
        console.error(`❌ 会话创建失败: ${errorMessage}`);
      }
    });

    // 处理终端数据输入
    socket.on('terminal-input', async (data: { sessionId: string; input: string }) => {
      try {
        if (!socket.userId) {
          throw new Error('用户未认证');
        }

        await sessionManager.writeToSession(data.sessionId, data.input, socket.userId);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '数据发送失败';
        socket.emit('terminal-error', {
          sessionId: data.sessionId,
          error: errorMessage
        });
        console.error(`❌ 终端输入失败: ${errorMessage}`);
      }
    });

    // 处理终端大小调整
    socket.on('terminal-resize', async (data: { sessionId: string; size: TerminalSize }) => {
      try {
        if (!socket.userId) {
          throw new Error('用户未认证');
        }

        await sessionManager.resizeSession(data.sessionId, data.size, socket.userId);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '终端大小调整失败';
        socket.emit('terminal-error', {
          sessionId: data.sessionId,
          error: errorMessage
        });
        console.error(`❌ 终端大小调整失败: ${errorMessage}`);
      }
    });

    // 处理会话断开
    socket.on('disconnect-session', async (data: { sessionId: string }) => {
      try {
        if (!socket.userId) {
          throw new Error('用户未认证');
        }

        await sessionManager.disconnectSession(data.sessionId, socket.userId);
        
        // 离开会话房间
        socket.leave(`session:${data.sessionId}`);

        socket.emit('session-disconnected', {
          sessionId: data.sessionId,
          message: '会话已断开'
        });

        console.log(`✅ 会话断开成功: ${data.sessionId} (用户: ${socket.username})`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '会话断开失败';
        socket.emit('session-error', {
          sessionId: data.sessionId,
          error: errorMessage
        });
        console.error(`❌ 会话断开失败: ${errorMessage}`);
      }
    });

    // 处理获取活动会话
    socket.on('get-active-sessions', async () => {
      try {
        if (!socket.userId) {
          throw new Error('用户未认证');
        }

        const sessions = await sessionManager.getUserActiveSessions(socket.userId);
        
        socket.emit('active-sessions', {
          sessions: sessions.map(session => ({
            sessionId: session.id,
            connectionId: session.connectionId,
            status: session.status,
            startTime: session.startTime,
            lastActivity: session.lastActivity
          }))
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '获取会话列表失败';
        socket.emit('session-error', {
          error: errorMessage
        });
        console.error(`❌ 获取活动会话失败: ${errorMessage}`);
      }
    });

    // 处理心跳
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // 处理断开连接
    socket.on('disconnect', async (reason: any) => {
      console.log(`🔌 WebSocket 连接断开: ${socket.username} (${socket.id}) - ${reason}`);
      
      // 清理用户的所有会话
      if (socket.userId) {
        try {
          await sessionManager.cleanupUserSessions(socket.userId);
        } catch (error) {
          console.error(`❌ 清理用户会话失败: ${error}`);
        }
      }
    });

    // 错误处理
    socket.on('error', (error: any) => {
      console.error(`❌ WebSocket 错误: ${socket.username} (${socket.id}) - ${error}`);
    });
  });

  // 设置会话管理器的 WebSocket 实例
  sessionManager.setSocketIO(io);

  // 定期清理过期会话
  setInterval(async () => {
    try {
      await sessionManager.cleanupExpiredSessions();
    } catch (error) {
      console.error('❌ 清理过期会话失败:', error);
    }
  }, WS_CONFIG.PING_INTERVAL);

  console.log('✅ WebSocket 服务器设置完成');
}
