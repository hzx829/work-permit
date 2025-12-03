# 作业票管理系统 - 开发环境启动脚本 (PowerShell)

Write-Host "🚀 启动作业票管理系统..."
Write-Host ""

# 检查 node 是否安装
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 错误：未找到 Node.js，请先安装 Node.js (https://nodejs.org/)"
    exit 1
}

# 检查 root 的依赖是否已安装 (express, sqlite3)
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 正在安装后端依赖..."
    npm install
    Write-Host "✅ 后端依赖安装完成"
    Write-Host ""
}

# 检查 client 目录是否存在
if (-not (Test-Path "client")) {
    Write-Host "❌ 错误：未找到 client 目录"
    exit 1
}

# 检查 client 的依赖是否已安装
if (-not (Test-Path "client\node_modules")) {
    Write-Host "📦 正在安装前端依赖..."
    Push-Location client
    npm install
    Pop-Location
    Write-Host "✅ 前端依赖安装完成"
    Write-Host ""
}

# 启动后端服务器
Write-Host "🔧 启动后端服务器 (http://localhost:3000)..."
# 使用 Start-Process 启动并在后台运行，但这里为了方便查看日志，我们可能希望保留在当前窗口
# 但由于是两个进程，我们最好分别启动
# 方案：启动一个新的 PowerShell 窗口运行后端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node server.js"

Write-Host "✅ 后端服务器已在新窗口启动"
Write-Host ""

# 等待后端启动
Start-Sleep -Seconds 2

# 启动前端开发服务器
Write-Host "⚛️  启动前端开发服务器..."
Push-Location client
# 同样启动新窗口运行前端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
Pop-Location

Write-Host "✅ 前端开发服务器已在新窗口启动"
Write-Host ""

Write-Host "════════════════════════════════════════"
Write-Host "✨ 系统启动发起完成！请检查弹出的两个窗口。"
Write-Host "════════════════════════════════════════"
Write-Host ""
Write-Host "📍 访问地址："
Write-Host "   前端: http://localhost:5173"
Write-Host "   后端: http://localhost:3000"
Write-Host ""
Write-Host "👤 测试账号："
Write-Host "   作业员: worker / 123"
Write-Host "   安全员: safety / 123"
Write-Host ""
