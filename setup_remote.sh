#!/bin/bash
set -e

APP_DIR="/root/work-permit"
ZIP_FILE="/root/deploy.zip"
APP_NAME="work-permit-system"
APP_ENTRY="server.js"
BACKUP_DIR="/root/work-permit-backups"

echo "=== Work Permit System Setup ==="

if [ "$(id -u)" -ne 0 ]; then
  echo "请用 root 运行此脚本（sudo bash setup.sh）"
  exit 1
fi

if [ ! -f /etc/os-release ]; then
  echo "/etc/os-release 不存在，无法检测系统类型"
  exit 1
fi

# 读取 OS 信息
. /etc/os-release
ID_LOWER=$(echo "${ID}" | tr 'A-Z' 'a-z')

echo "Detected OS: ${PRETTY_NAME} (ID=${ID_LOWER})"

# 选择包管理器
PKG_MANAGER=""
if command -v dnf &> /dev/null; then
  PKG_MANAGER="dnf"
elif command -v yum &> /dev/null; then
  PKG_MANAGER="yum"
elif command -v apt-get &> /dev/null; then
  PKG_MANAGER="apt-get"
fi

if [ -z "$PKG_MANAGER" ]; then
  echo "未找到支持的包管理器（dnf / yum / apt-get），退出。"
  exit 1
fi

echo "Using package manager: $PKG_MANAGER"

install_base_tools() {
  echo "[1/5] 检查基础工具（curl / unzip）..."
  local need_install=0
  command -v curl &> /dev/null || need_install=1
  command -v unzip &> /dev/null || need_install=1

  if [ "$need_install" -eq 0 ]; then
    echo "  curl 和 unzip 已安装，跳过"
    return
  fi

  echo "  正在安装缺少的工具..."
  if [ "$PKG_MANAGER" = "apt-get" ]; then
    apt-get update
    apt-get install -y curl unzip
  else
    $PKG_MANAGER install -y curl unzip
  fi
}

install_node_18_plus() {
  # 检查是否已有 Node.js 18+
  if command -v node &> /dev/null; then
    local node_major
    node_major=$(node -e "process.stdout.write(String(process.version.match(/^v(\d+)/)[1]))" 2>/dev/null || echo "0")
    if [ "$node_major" -ge 18 ] 2>/dev/null; then
      echo "[2-4/5] Node.js $(node -v) 已满足要求（>=18），跳过安装"
      return
    fi
  fi

  echo "[2/5] 安装系统 nodejs/npm（先装一个版本以便使用 npm）..."

  if [[ "$ID_LOWER" == "openeuler" || "$ID_LOWER" == "openEuler" ]]; then
    # openEuler 环境
    $PKG_MANAGER install -y nodejs npm
  elif [[ "$ID_LOWER" == "debian" || "$ID_LOWER" == "ubuntu" ]]; then
    # Debian/Ubuntu 用 NodeSource
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
  elif [[ "$ID_LOWER" == "centos" || "$ID_LOWER" == "rhel" || "$ID_LOWER" == "rocky" || "$ID_LOWER" == "almalinux" ]]; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    $PKG_MANAGER install -y nodejs
  else
    # 兜底：直接用发行版仓库的 nodejs
    $PKG_MANAGER install -y nodejs npm
  fi

  echo "System Node Version: $(node -v || echo '未知')"
  echo "System NPM  Version: $(npm -v || echo '未知')"

  echo "[3/5] 全局安装 n（Node 版本管理器）..."
  npm install -g n

  echo "[4/5] 使用 n 安装 Node.js 18 LTS..."
  # 这里会从官方下载二进制，需要网络
  n 18

  echo "[5/5] 修正二进制软链接，让系统用新版 node/npm..."
  if [ -x /usr/local/bin/node ]; then
    ln -sf /usr/local/bin/node /usr/bin/node || true
  fi
  if [ -x /usr/local/bin/npm ]; then
    ln -sf /usr/local/bin/npm /usr/bin/npm || true
  fi
  if [ -x /usr/local/bin/npx ]; then
    ln -sf /usr/local/bin/npx /usr/bin/npx || true
  fi

  echo "Final Node Version: $(node -v)"
  echo "Final NPM  Version: $(npm -v)"
}

ensure_pm2() {
  echo "=== 检查 / 安装 PM2 ==="
  if ! command -v pm2 &> /dev/null; then
    echo "PM2 未安装，正在安装..."
    npm install -g pm2
    # 确保 pm2 在 PATH 中
    if [ -x /usr/local/bin/pm2 ]; then
      ln -sf /usr/local/bin/pm2 /usr/bin/pm2 || true
    fi
  fi
  echo "PM2 Version: $(pm2 -v)"
}

deploy_app() {
  echo "=== 部署应用 ==="

  if [ ! -f "$ZIP_FILE" ]; then
    echo "错误：找不到 $ZIP_FILE，请先上传 deploy.zip 到 /root/"
    exit 1
  fi

  mkdir -p "$APP_DIR"

  if [ -f "$APP_DIR/work_permits.db" ]; then
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/work_permits-$(date +%Y%m%d-%H%M%S).db"
    echo "部署前备份生产数据库到 $BACKUP_FILE..."
    cp -p "$APP_DIR/work_permits.db" "$BACKUP_FILE"
  else
    echo "未发现已有生产数据库，跳过备份。"
  fi

  cd "$APP_DIR"

  echo "解压 $ZIP_FILE 到 $APP_DIR..."
  set +e
  unzip -o "$ZIP_FILE" -d .
  UNZIP_RC=$?
  set -e
  if [ $UNZIP_RC -gt 1 ]; then
    echo "错误：unzip 失败（exit code $UNZIP_RC）"
    exit 1
  fi

  echo "安装 npm 依赖（production 模式）..."
  npm install --production

  echo "使用 PM2 启动 / 重启应用..."
  JWT_SECRET='e5242c8938c3be63896667a55b126d8e5ed6677b6dfc6bdb9671412a07c1f9f5b367c58f23d1be10592d482d731866b8519f75eb439dd29a43a97be01055a7d0'
  if pm2 list | grep -q "$APP_NAME"; then
    echo "检测到已有进程 $APP_NAME，就地重启并保留现有厂家平台等环境变量..."
    NODE_ENV=production JWT_SECRET="$JWT_SECRET" pm2 restart "$APP_NAME" --update-env
  else
    echo "首次启动 $APP_NAME..."
    NODE_ENV=production JWT_SECRET="$JWT_SECRET" pm2 start "$APP_ENTRY" --name "$APP_NAME"
  fi

  # 可选：让 pm2 开机自启（按需开启）
  # pm2 save
  # pm2 startup systemd -u root --hp /root
}

# ==== 执行流程 ====
install_base_tools
install_node_18_plus
ensure_pm2
deploy_app

echo "=== 部署完成！应用应已运行在端口 3000（进程名：$APP_NAME）==="
echo "使用命令查看状态： pm2 status"
