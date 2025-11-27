#!/bin/bash

# 作业票管理系统 - 开发环境启动脚本

echo "🚀 启动作业票管理系统..."
echo ""

# 检查 node 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 client 目录是否存在
if [ ! -d "client" ]; then
    echo "❌ 错误：未找到 client 目录"
    exit 1
fi

# 检查 client 的依赖是否已安装
if [ ! -d "client/node_modules" ]; then
    echo "📦 正在安装前端依赖..."
    cd client && npm install && cd ..
    echo "✅ 前端依赖安装完成"
    echo ""
fi

# 启动后端服务器
echo "🔧 启动后端服务器 (http://localhost:3000)..."
node server.js &
BACKEND_PID=$!
echo "✅ 后端服务器已启动 (PID: $BACKEND_PID)"
echo ""

# 等待后端启动
sleep 2

# 启动前端开发服务器
echo "⚛️  启动前端开发服务器..."
cd client
npm run dev &
FRONTEND_PID=$!
cd ..
echo "✅ 前端开发服务器已启动 (PID: $FRONTEND_PID)"
echo ""

echo "════════════════════════════════════════"
echo "✨ 系统启动完成！"
echo "════════════════════════════════════════"
echo ""
echo "📍 访问地址："
echo "   前端: http://localhost:5173 或 http://localhost:5174"
echo "   后端: http://localhost:3000"
echo ""
echo "👤 测试账号："
echo "   作业员: worker / 123"
echo "   安全员: safety / 123"
echo ""
echo "💡 提示："
echo "   - 按 Ctrl+C 停止所有服务"
echo "   - 后端 PID: $BACKEND_PID"
echo "   - 前端 PID: $FRONTEND_PID"
echo ""

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ 所有服务已停止'; exit 0" INT

# 保持脚本运行
wait
