// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // 仅在创建时使用
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// 服务器连接相关类型
export interface ServerConnection {
  id: string;
  userId: string;
  name: string;
  host: string;
  port: number;
  protocol: ProtocolType;
  username: string;
  password?: string;
  privateKey?: string;
  description?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ProtocolType = 'ssh' | 'telnet' | 'rdp' | 'vnc' | 'sftp';

// 会话相关类型
export interface Session {
  id: string;
  userId: string;
  connectionId: string;
  status: SessionStatus;
  startTime: Date;
  endTime?: Date;
  lastActivity: Date;
  data?: any; // 会话状态数据
}

export type SessionStatus = 'active' | 'inactive' | 'terminated';

// 命令日志相关类型
export interface CommandLog {
  id: string;
  sessionId: string;
  userId: string;
  command: string;
  output?: string;
  timestamp: Date;
  duration?: number; // 执行时间（毫秒）
}

export interface FavoriteCommand {
  id: string;
  userId: string;
  name: string;
  command: string;
  description?: string;
  tags?: string[];
  createdAt: Date;
}

// WebSocket 消息类型
export interface WSMessage {
  type: WSMessageType;
  sessionId?: string;
  data?: any;
  timestamp: Date;
}

export type WSMessageType = 
  | 'terminal_data'
  | 'terminal_resize'
  | 'session_start'
  | 'session_end'
  | 'session_status'
  | 'command_log'
  | 'error'
  | 'ping'
  | 'pong';

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页类型
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 终端相关类型
export interface TerminalSize {
  cols: number;
  rows: number;
}

export interface TerminalData {
  data: string;
  sessionId: string;
}
