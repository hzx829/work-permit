# Work Permit System - 内网服务器部署指南

## 项目概述
Work Permit System 是一个学校作业许可证管理系统，采用 Node.js + Express + React + SQLite 技术栈。

## 部署架构
- **部署目标**: 学院内网服务器 (121.48.45.133)
- **端口**: 3000
- **进程管理**: PM2
- **数据存储**: SQLite（`work_permits.db`）

> 注意：需通过 VPN 接入学院内网后方可访问服务器。

## 快速部署步骤

### 前提条件
1. 已连接学院 VPN
2. 本地已安装 Node.js、npm
3. 本地已安装 OpenSSH（`scp`、`ssh` 命令可用）

### 1. 构建并打包

在项目根目录（PowerShell）执行：

```powershell
./build_and_package.ps1
```

该脚本会：
- 构建前端（`client/dist/`）
- 将后端文件和前端构建产物打包为 `deploy.zip`

### 2. 上传并部署到服务器

```powershell
./deploy_to_remote.ps1
```

该脚本会：
- 通过 `scp` 将 `deploy.zip` 上传至服务器 `/root/`
- 通过 `ssh` 在服务器上执行 `setup_remote.sh`，完成解压、依赖安装、PM2 启动

## 访问应用

部署完成后，通过以下地址访问（需在学院内网/VPN 下）：

- **前端页面**: http://121.48.45.133:3000
- **API 接口**: http://121.48.45.133:3000/api/work-permits

## 服务器管理命令

### 连接服务器
```bash
ssh root@121.48.45.133
```

### 查看应用状态
```bash
pm2 status
```

### 重启应用
```bash
pm2 restart work-permit-system
```

### 查看日志
```bash
pm2 logs work-permit-system
```

### 备份数据库
```bash
cp /root/work-permit/work_permits.db /root/work-permit/work_permits.db.backup_$(date +%Y%m%d_%H%M%S)
```

## 技术细节

### 打包内容
- 前端：`client/dist/`（已编译的静态文件，不含源码）
- 后端：`server.js`、`database.js`、`package.json`
- 数据库：`work_permits.db`（如存在则一并打包）

### 服务器环境
- 操作系统：Linux（setup_remote.sh 支持 dnf/yum/apt-get）
- 运行时：Node.js 18+
- 进程管理：PM2


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
- 作业员: `worker` / `Schy123456#`
- 其他人员: `safety` / `Schy123456#`

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
