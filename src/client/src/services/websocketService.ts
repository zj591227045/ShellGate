import { io, Socket } from 'socket.io-client';
import { EventEmitter } from '../utils/EventEmitter';

interface TerminalSize {
  cols: number;
  rows: number;
}

class WebSocketService extends EventEmitter {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  connect(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:4001';
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
      
      // 自动重连
      if (reason === 'io server disconnect') {
        // 服务器主动断开，不重连
        return;
      }
      
      this.attemptReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.emit('error', error);
      this.attemptReconnect();
    });

    // 会话相关事件
    this.socket.on('session-created', (data) => {
      console.log('✅ Session created:', data.sessionId);
      this.emit('session-created', data);
    });

    this.socket.on('session-connected', (data) => {
      console.log('✅ Session connected:', data.sessionId);
      this.emit('session-connected', data);
    });

    this.socket.on('session-disconnected', (data) => {
      console.log('🔌 Session disconnected:', data.sessionId);
      this.emit('session-disconnected', data);
    });

    this.socket.on('session-error', (data) => {
      console.error('❌ Session error:', data.error);
      this.emit('session-error', data);
    });

    this.socket.on('session-expired', (data) => {
      console.warn('⏰ Session expired:', data.sessionId);
      this.emit('session-expired', data);
    });

    // 终端相关事件
    this.socket.on('terminal-output', (data) => {
      console.log('🔄 WebSocket 收到 terminal-output:', data);
      this.emit('terminal-output', data);
    });

    this.socket.on('terminal-error', (data) => {
      console.error('❌ Terminal error:', data.error);
      this.emit('terminal-error', data);
    });

    this.socket.on('shell-ready', (data) => {
      console.log('✅ Shell ready:', data.sessionId);
      this.emit('shell-ready', data);
    });

    // 活动会话
    this.socket.on('active-sessions', (data) => {
      this.emit('active-sessions', data);
    });

    // 心跳
    this.socket.on('pong', () => {
      this.emit('pong');
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit('max-reconnect-attempts');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(() => {
      if (this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  async createSession(connectionId: string, password?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Session creation timeout'));
      }, 30000);

      const handleSessionCreated = (data: any) => {
        if (data.connectionId === connectionId) {
          clearTimeout(timeout);
          this.socket?.off('session-created', handleSessionCreated);
          this.socket?.off('session-error', handleSessionError);
          resolve(data.sessionId);
        }
      };

      const handleSessionError = (data: any) => {
        if (data.connectionId === connectionId) {
          clearTimeout(timeout);
          this.socket?.off('session-created', handleSessionCreated);
          this.socket?.off('session-error', handleSessionError);
          reject(new Error(data.error));
        }
      };

      this.socket.on('session-created', handleSessionCreated);
      this.socket.on('session-error', handleSessionError);

      this.socket.emit('create-session', { connectionId, password });
    });
  }

  sendTerminalInput(sessionId: string, input: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('❌ WebSocket 未连接，无法发送输入');
      throw new Error('WebSocket not connected');
    }

    console.log('📤 发送终端输入:', { sessionId, input: JSON.stringify(input) });
    this.socket.emit('terminal-input', { sessionId, input });
  }

  resizeTerminal(sessionId: string, size: TerminalSize): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('terminal-resize', { sessionId, size });
  }

  disconnectSession(sessionId: string): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('disconnect-session', { sessionId });
  }

  getActiveSessions(): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('get-active-sessions');
  }

  ping(): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('ping');
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const websocketService = new WebSocketService();
