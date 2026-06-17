# Work Permit System - 内网服务器部署指南

## 项目概述

作业票管理系统采用 Node.js + Express + React + SQLite 技术栈，当前以内网服务器 zip 包 + PM2 方式部署。

## 部署架构

- 部署目标：`121.48.45.133`
- 访问地址：`http://121.48.45.133/`
- 进程管理：PM2
- 进程名称：`work-permit-system`
- 数据存储：远端 `/root/work-permit/work_permits.db`

> 需连接内网/VPN 后访问服务器。

## 快速部署

在项目根目录执行：

```powershell
./build_and_package.ps1
./deploy_to_remote.ps1
```

`build_and_package.ps1` 会：

- 构建前端 `client/dist/`
- 混淆 `server.js`、`database.js`
- 生成 `deploy.zip`
- 跳过本地 `work_permits.db`，避免覆盖远端业务数据

`deploy_to_remote.ps1` 会：

- 上传 `deploy.zip` 和 `setup_remote.sh` 到 `/root/`
- 在远端解压到 `/root/work-permit`
- 安装生产依赖
- 通过 PM2 启动或重启 `work-permit-system`

## 数据保护

部署前先备份远端数据库：

```bash
cp /root/work-permit/work_permits.db /root/work-permit/work_permits.db.backup_$(date +%Y%m%d_%H%M%S)
```

当前打包脚本不会把本地测试数据库放进 `deploy.zip`。除非临时手工改包，否则部署时不需要恢复数据库。

## 服务器管理

```bash
ssh root@121.48.45.133
pm2 status
pm2 restart work-permit-system
pm2 logs work-permit-system
```

## 默认测试账号

- 作业员：`worker` / `Schy123456#`
- 安全员：`safety` / `Schy123456#`

## 注意事项

- 生产运行时默认监听 HTTP 80 端口。
- 不要将本地 `work_permits.db` 打入部署包。
- 部署后可用登录接口验证账号：

```bash
curl -X POST http://121.48.45.133/api/login \
  -H "Content-Type: application/json" \
  --data '{"username":"safety","password":"Schy123456#"}'
```
