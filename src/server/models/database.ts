import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import type { Database } from 'sqlite';
import path from 'path';
import fs from 'fs/promises';
import { DATABASE_CONFIG } from '../../shared/constants';

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function initializeDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  try {
    // 确保数据目录存在
    const dbDir = path.dirname(DATABASE_CONFIG.PATH);
    await fs.mkdir(dbDir, { recursive: true });

    // 打开数据库连接
    db = await open({
      filename: DATABASE_CONFIG.PATH,
      driver: sqlite3.Database
    });

    // 启用外键约束
    await db.exec('PRAGMA foreign_keys = ON');

    // 创建表
    await createTables();

    console.log('✅ 数据库初始化完成');
    return db;
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

export function getDatabase(): Database<sqlite3.Database, sqlite3.Statement> {
  if (!db) {
    throw new Error('数据库未初始化');
  }
  return db;
}

async function createTables(): Promise<void> {
  if (!db) throw new Error('数据库未初始化');

  // 用户表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 用户会话表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 服务器连接表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS server_connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER NOT NULL,
      protocol TEXT NOT NULL CHECK (protocol IN ('ssh', 'telnet', 'rdp', 'vnc', 'sftp')),
      username TEXT NOT NULL,
      password TEXT,
      private_key TEXT,
      description TEXT,
      tags TEXT, -- JSON array
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 会话表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      connection_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'terminated')),
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
      session_data TEXT, -- JSON data
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (connection_id) REFERENCES server_connections (id) ON DELETE CASCADE
    )
  `);

  // 命令日志表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS command_logs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      command TEXT NOT NULL,
      output TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration INTEGER, -- 执行时间（毫秒）
      FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 收藏命令表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS favorite_commands (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      command TEXT NOT NULL,
      description TEXT,
      tags TEXT, -- JSON array
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 创建索引
  await createIndexes();

  // 创建默认管理员用户
  await createDefaultUser();
}

async function createIndexes(): Promise<void> {
  if (!db) throw new Error('数据库未初始化');

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)',
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)',
    'CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions (token)',
    'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id)',
    'CREATE INDEX IF NOT EXISTS idx_server_connections_user_id ON server_connections (user_id)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_connection_id ON sessions (connection_id)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions (status)',
    'CREATE INDEX IF NOT EXISTS idx_command_logs_session_id ON command_logs (session_id)',
    'CREATE INDEX IF NOT EXISTS idx_command_logs_user_id ON command_logs (user_id)',
    'CREATE INDEX IF NOT EXISTS idx_command_logs_timestamp ON command_logs (timestamp)',
    'CREATE INDEX IF NOT EXISTS idx_favorite_commands_user_id ON favorite_commands (user_id)',
  ];

  for (const indexSql of indexes) {
    await db.exec(indexSql);
  }
}

async function createDefaultUser(): Promise<void> {
  if (!db) throw new Error('数据库未初始化');

  const bcrypt = await import('bcryptjs');
  
  // 检查是否已存在管理员用户
  const existingUser = await db.get('SELECT id FROM users WHERE username = ?', 'admin');
  
  if (!existingUser) {
    const userId = 'admin-' + Date.now();
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    await db.run(`
      INSERT INTO users (id, username, email, password_hash)
      VALUES (?, ?, ?, ?)
    `, [userId, 'admin', 'admin@shellgate.local', passwordHash]);
    
    console.log('✅ 默认管理员用户已创建');
    console.log('   用户名: admin');
    console.log('   密码: admin123');
    console.log('   ⚠️  请在生产环境中修改默认密码!');
  }
}
