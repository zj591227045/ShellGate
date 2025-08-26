# 多阶段构建
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制根目录的 package.json
COPY package*.json ./
RUN npm ci --only=production

# 复制前端代码并构建
COPY src/client ./src/client
WORKDIR /app/src/client
RUN npm ci && npm run build

# 复制后端代码并构建
WORKDIR /app
COPY src/server ./src/server
COPY src/shared ./src/shared
COPY tsconfig*.json ./
RUN npm run build:server

# 生产阶段
FROM node:18-alpine AS production

# 安装必要的系统依赖
RUN apk add --no-cache \
    sqlite \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S shellgate -u 1001

# 设置工作目录
WORKDIR /app

# 复制构建产物
COPY --from=builder --chown=shellgate:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=shellgate:nodejs /app/dist ./dist
COPY --from=builder --chown=shellgate:nodejs /app/src/client/build ./public
COPY --chown=shellgate:nodejs package*.json ./

# 创建数据目录
RUN mkdir -p /app/data && chown shellgate:nodejs /app/data

# 切换到应用用户
USER shellgate

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 启动应用
CMD ["node", "dist/server/index.js"]
