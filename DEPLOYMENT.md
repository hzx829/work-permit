# Work Permit System - ECS 部署指南

## 项目概述
Work Permit System 是一个学校作业许可证管理系统，采用 Node.js + Express + React + SQLite 技术栈。

## 部署架构
- **容器镜像仓库**: 阿里云容器镜像服务 (ACR)
- **部署目标**: 阿里云 ECS (8.149.232.48)
- **端口**: 3000
- **数据持久化**: /data/work-permit (ECS主机路径)

## 快速部署步骤

### 1. 构建并推送镜像

在项目根目录执行：

```bash
./build-aliyun.sh
```

该脚本会：
- 构建 Docker 镜像（包含前端构建）
- 登录阿里云容器镜像服务
- 标记镜像
- 推送镜像到 ACR

### 2. 部署到 ECS

```bash
./deploy-to-ecs.sh
```

该脚本会：
- 通过 SSH 连接到 ECS
- 拉取最新镜像
- 停止并删除旧容器
- 启动新容器
- 挂载数据卷以持久化 SQLite 数据库

## 访问应用

部署完成后，可以通过以下地址访问：

- **前端页面**: http://8.149.232.48:3000
- **API接口**: http://8.149.232.48:3000/api/work-permits

## 管理命令

### 查看容器日志
```bash
ssh root@8.149.232.48 -i deploy-0729.pem 'docker logs -f work-permit'
```

### 重启应用
```bash
ssh root@8.149.232.48 -i deploy-0729.pem 'docker restart work-permit'
```

### 查看容器状态
```bash
ssh root@8.149.232.48 -i deploy-0729.pem 'docker ps | grep work-permit'
```

### 进入容器
```bash
ssh root@8.149.232.48 -i deploy-0729.pem 'docker exec -it work-permit sh'
```

### 备份数据库
```bash
ssh root@8.149.232.48 -i deploy-0729.pem 'cp /data/work-permit/work_permits.db /data/work-permit/work_permits.db.backup'
```

## 技术细节

### Docker 镜像构建
采用多阶段构建：
1. **前端构建阶段**: 使用 Node.js 20 Alpine 构建 React 应用
2. **运行阶段**: 
   - 安装后端生产依赖
   - 复制后端代码
   - 复制前端构建产物
   - 以非 root 用户运行

### 环境变量
- `NODE_ENV=production`: 启用生产模式
- `DB_PATH=/app/data/work_permits.db`: SQLite 数据库路径
- `PORT=3000`: 应用端口

### 数据持久化
- SQLite 数据库文件挂载到 ECS 主机的 `/data/work-permit` 目录
- 容器重启或更新不会丢失数据

## 默认账号

系统预置两个测试账号：
- 作业员: `worker` / `123`
- 安全员: `safety` / `123`

## 端口说明

当前应用使用端口 3000，与同服务器上的 lyz-backend (8080) 不冲突。

## 故障排查

### 容器无法启动
1. 检查端口是否被占用：`ssh root@8.149.232.48 -i deploy-0729.pem 'netstat -tuln | grep 3000'`
2. 查看容器日志：`ssh root@8.149.232.48 -i deploy-0729.pem 'docker logs work-permit'`

### 数据库问题
1. 确认数据目录权限：`ssh root@8.149.232.48 -i deploy-0729.pem 'ls -la /data/work-permit'`
2. 数据库文件应该在容器首次启动时自动创建

### 前端无法访问
1. 确认容器正在运行：`ssh root@8.149.232.48 -i deploy-0729.pem 'docker ps'`
2. 检查 ECS 安全组是否开放 3000 端口

## 更新部署

当代码有更新时，只需重新执行：
```bash
./build-aliyun.sh
./deploy-to-ecs.sh
```

数据库数据会被保留。

## 注意事项

1. SSH 密钥文件 `deploy-0729.pem` 权限必须是 600
2. 阿里云 ACR 凭证已配置在脚本中
3. 生产环境建议修改默认密码并配置 HTTPS
4. 建议定期备份 `/data/work-permit/work_permits.db` 文件
