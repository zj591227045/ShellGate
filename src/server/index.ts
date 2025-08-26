import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Server as SocketIOServer } from 'socket.io';

import { SERVER_CONFIG, API_CONFIG } from '../shared/constants';
import { initializeDatabase } from './models/database';
import { setupRoutes } from './routes';
import { setupWebSocket } from './services/websocket';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';

class ShellGateServer {
  private app: express.Application;
  private server: http.Server;
  private io: SocketIOServer;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : '*',
        methods: ['GET', 'POST']
      }
    });
  }

  private async setupMiddleware(): Promise<void> {
    // 安全中间件
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' ? false : true,
      credentials: true
    }));

    // 压缩
    this.app.use(compression());

    // 请求解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 日志
    this.app.use(requestLogger);

    // 限流
    this.app.use(rateLimiter);

    // 静态文件服务
    if (process.env.NODE_ENV === 'production') {
      this.app.use(express.static(path.join(__dirname, '../public')));
    }
  }

  private async setupRoutes(): Promise<void> {
    // API 路由
    this.app.use(API_CONFIG.PREFIX, setupRoutes());

    // 健康检查
    this.app.get('/api/v1/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // SPA 路由处理
    if (process.env.NODE_ENV === 'production') {
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
      });
    }

    // 错误处理
    this.app.use(errorHandler);
  }

  private async setupWebSocket(): Promise<void> {
    setupWebSocket(this.io);
  }

  public async start(): Promise<void> {
    try {
      // 初始化数据库
      console.log('🔧 初始化数据库...');
      await initializeDatabase();

      // 设置中间件
      console.log('🔧 设置中间件...');
      await this.setupMiddleware();

      // 设置路由
      console.log('🔧 设置路由...');
      await this.setupRoutes();

      // 设置 WebSocket
      console.log('🔧 设置 WebSocket...');
      await this.setupWebSocket();

      // 启动服务器
      const port = SERVER_CONFIG.PORT;
      const host = SERVER_CONFIG.HOST;

      this.server.listen(port, () => {
        console.log(`🚀 ShellGate 服务器启动成功!`);
        console.log(`📍 地址: http://${host}:${port}`);
        console.log(`🌍 环境: ${SERVER_CONFIG.NODE_ENV}`);
        console.log(`📊 API 前缀: ${API_CONFIG.PREFIX}`);
      });

      // 优雅关闭
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));

    } catch (error) {
      console.error('❌ 服务器启动失败:', error);
      process.exit(1);
    }
  }

  private async gracefulShutdown(): Promise<void> {
    console.log('🔄 正在优雅关闭服务器...');
    
    this.server.close(() => {
      console.log('✅ HTTP 服务器已关闭');
    });

    this.io.close(() => {
      console.log('✅ WebSocket 服务器已关闭');
    });

    // 给正在处理的请求一些时间完成
    setTimeout(() => {
      console.log('✅ 服务器已完全关闭');
      process.exit(0);
    }, 5000);
  }
}

// 启动服务器
const server = new ShellGateServer();
server.start().catch((error) => {
  console.error('❌ 启动失败:', error);
  process.exit(1);
});
