#!/bin/bash

# ECS部署脚本 - work-permit项目
# 用于将最新的Docker镜像部署到阿里云ECS

set -e

ECS_HOST='8.149.232.48'
IMAGE_NAME='registry.cn-hangzhou.aliyuncs.com/zionzxhuang/work-permit:1.0.0'
CONTAINER_NAME='work-permit'
APP_PORT='3000'

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
ssh root@$ECS_HOST -i deploy-0729.pem "docker run -d --name $CONTAINER_NAME -p $APP_PORT:$APP_PORT \
  -v /data/work-permit:/app/data \
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
echo "应用地址: http://$ECS_HOST:$APP_PORT"
echo "测试API: http://$ECS_HOST:$APP_PORT/api/work-permits"
echo
echo '管理命令:'
echo "查看日志: ssh root@$ECS_HOST -i deploy-0729.pem 'docker logs -f $CONTAINER_NAME'"
echo "重启应用: ssh root@$ECS_HOST -i deploy-0729.pem 'docker restart $CONTAINER_NAME'"
echo "查看状态: ssh root@$ECS_HOST -i deploy-0729.pem 'docker ps | grep $CONTAINER_NAME'"
echo
echo '💡 提示: 数据库文件保存在ECS的 /data/work-permit 目录'
