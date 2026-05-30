#!/bin/bash

# ECS部署脚本 - work-permit项目
# 用于将最新的Docker镜像部署到阿里云ECS

set -e

ECS_HOST='8.149.232.48'
IMAGE_NAME='registry.cn-hangzhou.aliyuncs.com/zionzxhuang/work-permit:1.0.0'
CONTAINER_NAME='work-permit'
HTTP_PORT='80'
HTTPS_PORT='443'

echo '=== 开始部署work-permit到阿里云ECS ==='
echo "ECS服务器: $ECS_HOST"
echo "镜像地址: $IMAGE_NAME"
echo

echo '使用SSH密钥文件: deploy-0729.pem'
echo

read -p '是否继续部署? (y/N): ' confirm
if [[ $confirm != [yY] ]]; then
    echo '部署已取消'
    exit 0
fi

echo '步骤1: 拉取最新镜像...'
ssh root@$ECS_HOST -i deploy-0729.pem "docker pull $IMAGE_NAME"

if [ $? -eq 0 ]; then
    echo '✅ 镜像拉取成功'
else
    echo '❌ 镜像拉取失败'
    exit 1
fi

echo '步骤2: 停止并删除旧容器...'
ssh root@$ECS_HOST -i deploy-0729.pem "docker stop $CONTAINER_NAME || true"
ssh root@$ECS_HOST -i deploy-0729.pem "docker rm $CONTAINER_NAME || true"

echo '步骤3: 创建数据目录...'
ssh root@$ECS_HOST -i deploy-0729.pem "mkdir -p /data/work-permit"

echo '步骤4: 启动新容器...'
JWT_SECRET='e5242c8938c3be63896667a55b126d8e5ed6677b6dfc6bdb9671412a07c1f9f5b367c58f23d1be10592d482d731866b8519f75eb439dd29a43a97be01055a7d0'
ssh root@$ECS_HOST -i deploy-0729.pem "docker run -d --name $CONTAINER_NAME \
  -p $HTTP_PORT:80 -p $HTTPS_PORT:443 \
  -v /data/work-permit:/app/data \
  -e NODE_ENV=production \
  -e DB_PATH=/app/data/work_permits.db \
  -e PORT=80 \
  -e HTTPS_PORT=443 \
  -e JWT_SECRET='$JWT_SECRET' \
  --restart=unless-stopped \
  $IMAGE_NAME"

if [ $? -eq 0 ]; then
    echo '✅ 容器启动成功'
else
    echo '❌ 容器启动失败'
    exit 1
fi

echo '步骤5: 等待应用启动...'
sleep 10

echo '步骤6: 检查应用状态...'
ssh root@$ECS_HOST -i deploy-0729.pem "docker ps | grep $CONTAINER_NAME"
ssh root@$ECS_HOST -i deploy-0729.pem "docker logs --tail 20 $CONTAINER_NAME"

echo
echo '=== 部署完成 ==='
echo "应用地址(HTTPS): https://$ECS_HOST:$HTTPS_PORT"
echo "应用地址(HTTP跳转): http://$ECS_HOST:$HTTP_PORT"
echo "测试API: https://$ECS_HOST:$HTTPS_PORT/api/work-permits"
echo
echo '管理命令:'
echo "查看日志: ssh root@$ECS_HOST -i deploy-0729.pem 'docker logs -f $CONTAINER_NAME'"
echo "重启应用: ssh root@$ECS_HOST -i deploy-0729.pem 'docker restart $CONTAINER_NAME'"
echo "查看状态: ssh root@$ECS_HOST -i deploy-0729.pem 'docker ps | grep $CONTAINER_NAME'"
echo
echo '💡 提示: 数据库文件保存在ECS的 /data/work-permit 目录'
