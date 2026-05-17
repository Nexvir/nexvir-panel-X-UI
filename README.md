# ⚡ Nexvir Panel

پنل مدیریت VPN با رابط کاربری فارسی — پشتیبانی از VMess، VLess، Trojan و Shadowsocks

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-18%2B-green)

---

## 🚀 نصب سریع (یک دستور)

```bash
bash <(curl -sL https://raw.githubusercontent.com/Nexvir/nexvir-panel/main/scripts/install.sh)
```

پس از نصب:
- آدرس پنل: `http://YOUR_IP:3000`
- نام کاربری: `admin`
- رمز عبور: `admin123`

> ⚠️ **مهم:** بعد از اولین ورود، رمز عبور پیش‌فرض را تغییر دهید.

---

## ✨ امکانات

- **مدیریت کاربران** — افزودن، حذف، فعال/غیرفعال با محدودیت ترافیک و زمان
- **اینباندها** — VMess / VLess / Trojan / Shadowsocks
- **سرورها** — نمایش وضعیت و بار سرورها
- **لاگ‌ها** — لاگ‌های سیستم در زمان واقعی
- **تنظیمات** — پیکربندی دامنه و لینک‌های اشتراک
- **احراز هویت JWT** — امنیت کامل
- **دیتابیس SQLite** — بدون نیاز به نصب MySQL/Postgres
- **رابط کاربری RTL فارسی** — طراحی مدرن

---

## 📁 ساختار پروژه

```
nexvir-panel/
├── backend/
│   ├── db/database.js       # SQLite + seed data
│   ├── middleware/auth.js   # JWT authentication
│   ├── routes/
│   │   ├── auth.js          # POST /api/auth/login
│   │   ├── users.js         # CRUD /api/users
│   │   ├── inbounds.js      # CRUD /api/inbounds
│   │   ├── servers.js       # CRUD /api/servers
│   │   ├── logs.js          # GET/DELETE /api/logs
│   │   └── settings.js      # GET/PUT /api/settings
│   ├── server.js            # Express entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── index.html           # پنل اصلی
│   └── login.html           # صفحه ورود
├── scripts/
│   ├── install.sh           # نصب خودکار
│   └── uninstall.sh         # حذف نصب
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | توضیح |
|--------|----------|-------|
| POST | `/api/auth/login` | ورود |
| GET | `/api/users` | لیست کاربران |
| POST | `/api/users` | کاربر جدید |
| POST | `/api/users/:id/toggle` | فعال/غیرفعال |
| GET | `/api/users/:id/config` | دریافت کانفیگ |
| DELETE | `/api/users/:id` | حذف کاربر |
| GET | `/api/inbounds` | لیست اینباندها |
| POST | `/api/inbounds` | اینباند جدید |
| GET | `/api/servers` | لیست سرورها |
| GET | `/api/logs` | لاگ‌های سیستم |
| GET | `/api/settings` | تنظیمات |
| PUT | `/api/settings` | ذخیره تنظیمات |
| GET | `/sub/:uuid` | لینک اشتراک (عمومی) |

---

## ⚙️ اجرای دستی (بدون نصب)

```bash
git clone https://github.com/YOUR_USER/nexvir-panel.git
cd nexvir-panel/backend
cp .env.example .env
# .env را ویرایش کنید
npm install
node server.js
```

---

## 🛠️ مدیریت سرویس

```bash
systemctl status nexvir    # وضعیت
systemctl restart nexvir   # ری‌استارت
systemctl stop nexvir      # توقف
journalctl -u nexvir -f    # لاگ زنده
```

---

## 📋 نیازمندی‌ها

- Linux (Ubuntu 20.04+ / Debian 11+ / CentOS 8+)
- Node.js 18+
- دسترسی root

---

## 📄 License

MIT
