#!/bin/bash

# 阿里云部署脚本 - work-permit项目
# 参考lyz-backend部署流程

set -e

# 配置变量
ALIYUN_REGISTRY='registry.cn-hangzhou.aliyuncs.com'
NAMESPACE='zionzxhuang'
IMAGE_NAME='work-permit'
VERSION='1.0.0'

echo '=== 开始构建和部署work-permit到阿里云 ==='

# 构建Docker镜像（指定目标平台为 linux/amd64）
echo '步骤1: 构建Docker镜像（目标平台: linux/amd64）...'
docker buildx build --platform linux/amd64 -t $IMAGE_NAME:$VERSION --load .

if [ $? -eq 0 ]; then
    echo '✅ Docker镜像构建成功'
else
    echo '❌ Docker镜像构建失败'
    exit 1
fi

# 登录阿里云容器镜像服务
echo '步骤2: 登录阿里云容器镜像服务...'
ACR_USERNAME='aliyun2077702462'
ACR_PASSWORD='lingyue2025'
echo "ACR用户名: $ACR_USERNAME"

# 登录ACR
echo "$ACR_PASSWORD" | docker login --username "$ACR_USERNAME" --password-stdin $ALIYUN_REGISTRY

if [ $? -eq 0 ]; then
    echo '✅ ACR登录成功'
else
    echo '❌ ACR登录失败'
    exit 1
fi

# 标记镜像
echo '步骤3: 标记镜像...'
FULL_IMAGE_NAME="$ALIYUN_REGISTRY/$NAMESPACE/$IMAGE_NAME:$VERSION"
docker tag $IMAGE_NAME:$VERSION $FULL_IMAGE_NAME

echo "✅ 镜像标记完成: $FULL_IMAGE_NAME"

# 推送镜像
echo '步骤4: 推送镜像到阿里云...'
docker push $FULL_IMAGE_NAME

if [ $? -eq 0 ]; then
    echo '✅ 镜像推送成功'
else
    echo '❌ 镜像推送失败'
    exit 1
fi

echo '=== 构建和推送完成 ==='
echo "镜像地址: $FULL_IMAGE_NAME"
echo
echo '🧪 建议本地测试:'
echo "docker run -d --name work-permit-test -p 80:80 -p 443:443 \\"
echo "  -v \$(pwd)/data:/app/data \\"
echo "  $FULL_IMAGE_NAME"
echo
echo '测试完成后清理: docker stop work-permit-test && docker rm work-permit-test'
echo
echo '📋 下一步操作:'
echo '运行部署脚本: ./deploy-to-ecs.sh'
