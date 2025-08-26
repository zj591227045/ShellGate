// 应用常量
export const APP_CONFIG = {
  NAME: 'ShellGate',
  VERSION: '1.0.0',
  DESCRIPTION: 'Web-based remote control tool',
} as const;

// 服务器配置
export const SERVER_CONFIG = {
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// 数据库配置
export const DATABASE_CONFIG = {
  PATH: process.env.DB_PATH || './data/shellgate.db',
  BACKUP_PATH: process.env.DB_BACKUP_PATH || './data/backups',
} as const;

// JWT 配置
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'shellgate-secret-key-change-in-production',
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
};

// WebSocket 配置
export const WS_CONFIG = {
  PING_INTERVAL: 30000, // 30秒
  PONG_TIMEOUT: 5000,   // 5秒
  MAX_CONNECTIONS_PER_USER: 10,
} as const;

// 协议默认端口
export const PROTOCOL_PORTS = {
  ssh: 22,
  telnet: 23,
  rdp: 3389,
  vnc: 5900,
  sftp: 22,
} as const;

// 会话配置
export const SESSION_CONFIG = {
  TIMEOUT: 30 * 60 * 1000, // 30分钟无活动超时
  MAX_SESSIONS_PER_USER: 20,
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5分钟清理一次
} as const;

// 日志配置
export const LOG_CONFIG = {
  MAX_COMMAND_LENGTH: 10000,
  MAX_OUTPUT_LENGTH: 100000,
  RETENTION_DAYS: 90,
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24小时清理一次
} as const;

// 文件上传配置
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_TYPES: ['.key', '.pem', '.pub', '.txt'],
  UPLOAD_PATH: './data/uploads',
} as const;

// 安全配置
export const SECURITY_CONFIG = {
  BCRYPT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15分钟
  PASSWORD_MIN_LENGTH: 8,
} as const;

// API 配置
export const API_CONFIG = {
  PREFIX: '/api/v1',
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15分钟
    MAX_REQUESTS: 100,
  },
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
} as const;

// 错误代码
export const ERROR_CODES = {
  // 认证错误
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // 用户错误
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // 连接错误
  CONNECTION_NOT_FOUND: 'CONNECTION_NOT_FOUND',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  PROTOCOL_NOT_SUPPORTED: 'PROTOCOL_NOT_SUPPORTED',
  
  // 会话错误
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  MAX_SESSIONS_EXCEEDED: 'MAX_SESSIONS_EXCEEDED',
  
  // 通用错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
} as const;
