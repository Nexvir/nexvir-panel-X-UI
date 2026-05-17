#!/bin/bash
# Nexvir Panel — حذف نصب

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${CYAN}حذف Nexvir Panel...${NC}"

systemctl stop nexvir 2>/dev/null || true
systemctl disable nexvir 2>/dev/null || true
rm -f /etc/systemd/system/nexvir.service
systemctl daemon-reload

read -p "آیا پوشه /opt/nexvir-panel (شامل دیتابیس) هم حذف شود؟ [y/N] " confirm
if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
  rm -rf /opt/nexvir-panel
  echo -e "${GREEN}✓ پوشه پنل حذف شد${NC}"
fi

echo -e "${GREEN}✅ Nexvir Panel حذف شد${NC}"
