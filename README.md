# ShellGate

一个基于 Web 的远程控制工具，支持 SSH、Telnet、RDP、VNC、SFTP 协议。

## 功能特性

- 🔐 **多协议支持**: SSH、Telnet、RDP、VNC、SFTP
- 👥 **用户管理**: 多用户支持，数据和会话隔离
- 📝 **命令日志**: 完整的命令历史记录和搜索
- ⭐ **命令收藏**: 常用命令收藏和快速执行
- 🌐 **会话漫游**: 跨客户端访问同一会话
- 🐳 **容器化部署**: 单一 Docker 容器包含前后端和数据库

## 技术栈

### 后端
- Node.js + Express + TypeScript
- SQLite 数据库
- WebSocket 实时通信
- JWT 身份认证

### 前端
- React + TypeScript
- Ant Design UI 组件库
- xterm.js 终端模拟器
- Socket.io 客户端

## 项目结构

```
ShellGate/
├── src/
│   ├── server/           # 后端代码
│   │   ├── controllers/  # 控制器
│   │   ├── services/     # 业务逻辑
│   │   ├── models/       # 数据模型
│   │   ├── middleware/   # 中间件
│   │   ├── routes/       # 路由
│   │   ├── adapters/     # 协议适配器
│   │   └── utils/        # 工具函数
│   ├── client/           # 前端代码
│   └── shared/           # 共享类型和常量
├── docs/                 # 文档
├── tests/                # 测试文件
├── Dockerfile            # Docker 配置
└── docker-compose.yml    # Docker Compose 配置
```

## 快速开始

### 开发环境

1. 安装依赖
```bash
npm install
npm run install:client
```

2. 启动开发服务器
```bash
npm run dev
```

3. 访问 http://localhost:3000

### 生产部署

使用 Docker 一键部署：

```bash
docker build -t shellgate .
docker run -p 3000:3000 shellgate
```

## 开发计划

- [x] 项目架构设计与初始化
- [ ] 后端核心框架搭建
- [ ] 协议适配器开发
- [ ] WebSocket 实时通信
- [ ] 前端界面开发
- [ ] 会话漫游功能
- [ ] 命令日志与收藏
- [ ] Docker 容器化
- [ ] 安全性增强
- [ ] 测试与优化

## 许可证

MIT License
