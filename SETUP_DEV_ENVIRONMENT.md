# 🚀 Setup Môi Trường Dev Local

Hướng dẫn setup môi trường development riêng biệt với production.

## 📋 Yêu Cầu

- Node.js 18+ 
- pnpm (hoặc npm/yarn)
- PostgreSQL 15+ (hoặc Docker Desktop)

## 🎯 Môi Trường Dev

- **Port:** `4000` (khác với production port 3001)
- **Database:** `tms2025_dev` (riêng biệt với production)
- **URL:** `http://localhost:4000`

## 📦 Bước 1: Cài Đặt Dependencies

```bash
pnpm install
```

## 🗄️ Bước 2: Setup Database

### Option A: Dùng Docker (Khuyến nghị)

1. **Cài Docker Desktop cho Windows:**
   - Download: https://www.docker.com/products/docker-desktop/
   - Install và khởi động Docker Desktop

2. **Khởi động PostgreSQL container:**
   ```bash
   pnpm run docker:up
   ```

3. **Kiểm tra database đã chạy:**
   ```bash
   pnpm run docker:logs
   ```

### Option B: Cài PostgreSQL Local

1. **Download PostgreSQL:**
   - Link: https://www.postgresql.org/download/windows/
   - Hoặc dùng installer: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

2. **Cài đặt với thông tin:**
   - Port: `5432`
   - Username: `postgres` (hoặc tự tạo)
   - Password: (tự đặt, nhớ lại để dùng trong DATABASE_URL)

3. **Tạo database dev:**
   ```sql
   -- Kết nối PostgreSQL bằng pgAdmin hoặc psql
   CREATE DATABASE tms2025_dev;
   CREATE USER tmsuser WITH PASSWORD 'tmspassword';
   GRANT ALL PRIVILEGES ON DATABASE tms2025_dev TO tmsuser;
   ```

4. **Cập nhật DATABASE_URL trong `.env.local`:**
   ```
   DATABASE_URL="postgresql://tmsuser:tmspassword@localhost:5432/tms2025_dev"
   ```

## ⚙️ Bước 3: Cấu Hình Environment

File `.env.local` đã được tạo sẵn với:
- Port: `4000`
- Database URL: (cần cập nhật theo database bạn chọn)
- NEXTAUTH_SECRET: (đã generate sẵn)

**Kiểm tra file `.env.local`:**
```bash
# Windows PowerShell
cat .env.local

# Hoặc mở bằng editor
code .env.local
```

## 🗄️ Bước 4: Setup Database Schema

```bash
# Generate Prisma Client
pnpm run postinstall

# Push schema lên database
pnpm run db:push

# Seed dữ liệu ban đầu
pnpm run db:seed
```

## 🚀 Bước 5: Chạy Dev Server

```bash
# Chạy với Turbopack (nhanh hơn)
pnpm run dev

# Hoặc chạy với Webpack
pnpm run dev:webpack

# Hoặc chạy an toàn
pnpm run dev:safe
```

**App sẽ chạy tại:** `http://localhost:4000`

## ✅ Kiểm Tra

1. **Kiểm tra database connection:**
   ```bash
   pnpm run db:test
   ```

2. **Mở browser:**
   - URL: http://localhost:4000
   - Nếu thấy login page → ✅ Thành công!

3. **Kiểm tra logs:**
   - Terminal sẽ hiển thị các request và error (nếu có)

## 🔧 Troubleshooting

### Port 4000 đang được dùng
```bash
# Windows: Tìm process đang dùng port 4000
netstat -ano | findstr :4000

# Kill process (thay <PID> bằng Process ID)
taskkill /PID <PID> /F
```

### Database connection error
```bash
# Kiểm tra PostgreSQL đang chạy
# Windows Services: tìm "postgresql"

# Hoặc kiểm tra connection string trong .env.local
# DATABASE_URL phải đúng format:
# postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### Prisma errors
```bash
# Reset Prisma Client
pnpm run postinstall

# Hoặc reset database (⚠️ Xóa hết dữ liệu)
pnpm run db:reset
```

## 📝 So Sánh Dev vs Production

| | Development | Production |
|---|---|---|
| **Port** | 4000 | 3001 |
| **URL** | http://localhost:4000 | http://14.225.36.94:3001 |
| **Database** | tms2025_dev | tms2025 |
| **Environment** | development | production |
| **Hot Reload** | ✅ Có | ❌ Không |

## 🎯 Scripts Hữu Ích

```bash
# Dev
pnpm run dev              # Chạy dev server (port 4000)
pnpm run dev:webpack      # Chạy với Webpack
pnpm run dev:safe         # Chạy an toàn (không turbopack)

# Database
pnpm run db:push          # Push schema lên DB
pnpm run db:seed          # Seed dữ liệu
pnpm run db:studio        # Mở Prisma Studio (GUI)
pnpm run db:test          # Test database connection

# Docker (nếu dùng)
pnpm run docker:up        # Khởi động PostgreSQL container
pnpm run docker:down      # Dừng container
pnpm run docker:logs      # Xem logs
```

## 📚 Thêm Thông Tin

- **Prisma Studio:** Truy cập `http://localhost:5555` sau khi chạy `pnpm run db:studio`
- **Database GUI:** Có thể dùng pgAdmin, DBeaver, hoặc TablePlus
- **Logs:** Xem terminal để debug các lỗi

---

**🎉 Chúc bạn code vui vẻ!**

