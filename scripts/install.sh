#!/bin/bash
# ══════════════════════════════════════════════════════════
#  Nexvir Panel — نصب خودکار
#  دستور نصب:
#  bash <(curl -sL https://raw.githubusercontent.com/YOUR_USER/nexvir-panel/main/scripts/install.sh)
# ══════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

PANEL_DIR="/opt/nexvir-panel"
SERVICE_NAME="nexvir"
DEFAULT_PORT=3000

echo -e "${CYAN}"
echo "  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗██╗██████╗ "
echo "  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██║██╔══██╗"
echo "  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║██║██████╔╝"
echo "  ██║╚██╗██║██╔══╝   ██╔██╗ ╚██╗ ██╔╝██║██╔══██╗"
echo "  ██║ ╚████║███████╗██╔╝ ██╗ ╚████╔╝ ██║██║  ██║"
echo "  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚═╝  ╚═╝"
echo -e "${NC}"
echo -e "${GREEN}Nexvir Panel Installer v1.0.0${NC}"
echo ""

# ── Check root ──────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  echo -e "${RED}خطا: این اسکریپت باید با دسترسی root اجرا شود${NC}"
  echo "  sudo bash install.sh"
  exit 1
fi

# ── Detect OS ───────────────────────────────────────────
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
else
  echo -e "${RED}سیستم‌عامل شناخته نشد${NC}"
  exit 1
fi

echo -e "${CYAN}[1/6] نصب وابستگی‌ها...${NC}"
if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
  apt-get update -qq
  apt-get install -y -qq curl git nodejs npm
elif [[ "$OS" == "centos" || "$OS" == "fedora" || "$OS" == "rhel" ]]; then
  yum install -y curl git nodejs npm
else
  echo -e "${YELLOW}سیستم‌عامل: $OS — سعی می‌کنیم ادامه دهیم${NC}"
fi

# Check Node.js version
NODE_VER=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [[ -z "$NODE_VER" || "$NODE_VER" -lt 18 ]]; then
  echo -e "${CYAN}نصب Node.js 20 LTS...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 
  apt-get install -y -qq nodejs
fi

echo -e "${GREEN}✓ Node.js $(node -v) نصب شد${NC}"

# ── Clone / update ──────────────────────────────────────
echo -e "${CYAN}[2/6] دانلود Nexvir Panel...${NC}"
if [ -d "$PANEL_DIR" ]; then
  echo "پوشه موجود است، به‌روز‌رسانی..."
  cd "$PANEL_DIR"
  git pull --quiet
else
  git clone --quiet https://github.com/YOUR_USER/nexvir-panel.git "$PANEL_DIR"
  cd "$PANEL_DIR"
fi
echo -e "${GREEN}✓ سورس کد دانلود شد${NC}"

# ── Install dependencies ─────────────────────────────────
echo -e "${CYAN}[3/6] نصب پکیج‌های Node...${NC}"
cd "$PANEL_DIR/backend"
npm install --quiet --omit=dev
echo -e "${GREEN}✓ پکیج‌ها نصب شدند${NC}"

# ── Configure ────────────────────────────────────────────
echo -e "${CYAN}[4/6] پیکربندی...${NC}"
if [ ! -f "$PANEL_DIR/backend/.env" ]; then
  cp "$PANEL_DIR/backend/.env.example" "$PANEL_DIR/backend/.env"
  
  # Generate random JWT secret
  JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
  sed -i "s/change_this_to_a_secure_random_string_in_production/$JWT_SECRET/" "$PANEL_DIR/backend/.env"
  sed -i "s/PORT=3000/PORT=$DEFAULT_PORT/" "$PANEL_DIR/backend/.env"
  
  echo -e "${GREEN}✓ فایل .env ساخته شد${NC}"
else
  echo -e "${YELLOW}⚠ فایل .env از قبل موجود است، تغییری داده نشد${NC}"
fi

mkdir -p "$PANEL_DIR/backend/data"

# ── Systemd service ──────────────────────────────────────
echo -e "${CYAN}[5/6] راه‌اندازی سرویس systemd...${NC}"
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=Nexvir Panel
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${PANEL_DIR}/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=nexvir
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME" --quiet
systemctl restart "$SERVICE_NAME"

sleep 2

if systemctl is-active --quiet "$SERVICE_NAME"; then
  echo -e "${GREEN}✓ سرویس فعال شد${NC}"
else
  echo -e "${RED}خطا در راه‌اندازی سرویس. لاگ:${NC}"
  journalctl -u "$SERVICE_NAME" -n 20 --no-pager
  exit 1
fi

# ── Firewall ─────────────────────────────────────────────
echo -e "${CYAN}[6/6] تنظیم فایروال...${NC}"
if command -v ufw &>/dev/null; then
  ufw allow "$DEFAULT_PORT/tcp" >/dev/null 2>&1
  echo -e "${GREEN}✓ پورت $DEFAULT_PORT در UFW باز شد${NC}"
elif command -v firewall-cmd &>/dev/null; then
  firewall-cmd --permanent --add-port="$DEFAULT_PORT/tcp" >/dev/null 2>&1
  firewall-cmd --reload >/dev/null 2>&1
  echo -e "${GREEN}✓ پورت $DEFAULT_PORT در firewalld باز شد${NC}"
fi

# ── Done ──────────────────────────────────────────────────
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Nexvir Panel با موفقیت نصب شد!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 آدرس پنل:   ${CYAN}http://${SERVER_IP}:${DEFAULT_PORT}${NC}"
echo -e "  👤 نام کاربری: ${CYAN}admin${NC}"
echo -e "  🔑 رمز عبور:   ${CYAN}admin123${NC}"
echo ""
echo -e "${YELLOW}  ⚠️  مهم: بعد از ورود رمز عبور پیش‌فرض را تغییر دهید!${NC}"
echo ""
echo -e "  دستورات مدیریت سرویس:"
echo -e "  ${CYAN}systemctl status $SERVICE_NAME${NC}   — وضعیت"
echo -e "  ${CYAN}systemctl restart $SERVICE_NAME${NC}  — ری‌استارت"
echo -e "  ${CYAN}journalctl -u $SERVICE_NAME -f${NC}   — لاگ زنده"
echo ""
