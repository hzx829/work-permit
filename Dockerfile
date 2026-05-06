# 多阶段构建 - 前端构建阶段
FROM --platform=$BUILDPLATFORM node:20-alpine AS frontend-builder

WORKDIR /app/client

# 复制前端依赖文件
COPY client/package*.json ./

# 安装前端依赖
RUN npm install

# 复制前端源码
COPY client/ ./

# 构建前端
RUN npm run build

# 最终运行阶段
FROM --platform=$TARGETPLATFORM node:20-alpine

WORKDIR /app

# 复制后端依赖文件
COPY package*.json ./

# 安装生产依赖
RUN npm install --production

# 复制后端源码
COPY server.js database.js ./

# 复制 SSL 证书
COPY ssl/ ./ssl/

# 复制前端构建产物
COPY --from=frontend-builder /app/client/dist ./client/dist

# 创建数据库目录
RUN mkdir -p /app/data

# 设置时区
RUN apk add --no-cache tzdata && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

# 创建非root用户
RUN addgroup -S appuser && adduser -S appuser -G appuser && \
    chown -R appuser:appuser /app && \
    chmod 600 /app/ssl/*.key
USER appuser

# 暴露端口（80 HTTP跳转 + 443 HTTPS）
EXPOSE 80 443

# 设置环境变量
ENV NODE_ENV=production
ENV DB_PATH=/app/data/work_permits.db
ENV PORT=80
ENV HTTPS_PORT=443

# 启动应用
CMD ["node", "server.js"]
