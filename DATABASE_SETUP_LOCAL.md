# 🗄️ Setup Local PostgreSQL Database

## ❌ Vấn đề hiện tại

Database cloud (Neon/Supabase) đã hết quota:
```
ERROR: Your account or project has exceeded the compute time quota.
```

## ✅ Giải pháp: Chuyển sang Local Database

### Bước 1: Cài đặt PostgreSQL

#### Windows (Khuyến nghị: Docker)

**Option A: Docker (Dễ nhất)**
```bash
# Pull PostgreSQL image
docker pull postgres:15

# Run PostgreSQL container
docker run --name tms-postgres \
  -e POSTGRES_USER=tmsuser \
  -e POSTGRES_PASSWORD=tmspassword \
  -e POSTGRES_DB=tms2025 \
  -p 5432:5432 \
  -d postgres:15
```

**Option B: PostgreSQL Windows Installer**
1. Download từ: https://www.postgresql.org/download/windows/
2. Install với default settings
3. Nhớ password của `postgres` user
4. Tạo database mới tên `tms2025`

### Bước 2: Cập nhật Environment Variables

Sửa file `.env` hoặc `.env.local`:

```env
# OLD (Cloud database - đã hết quota)
# DATABASE_URL="postgresql://user:pass@hostname.neon.tech/dbname?sslmode=require"

# NEW (Local database)
DATABASE_URL="postgresql://tmsuser:tmspassword@localhost:5432/tms2025"
```

**Hoặc nếu dùng default postgres user:**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tms2025"
```

### Bước 3: Reset Database

```bash
# Delete .next cache
rm -rf .next

# Reset Prisma client
npx prisma generate

# Push schema to local database
npx prisma db push

# Seed data (nếu cần)
npx prisma db seed
```

### Bước 4: Restart Dev Server

```bash
# Stop current server (Ctrl+C)

# Start lại
npm run dev
```

---

## 🐳 Docker Compose (Khuyến nghị nhất)

Tạo file `docker-compose.yml` ở root project:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: tms-postgres
    restart: always
    environment:
      POSTGRES_USER: tmsuser
      POSTGRES_PASSWORD: tmspassword
      POSTGRES_DB: tms2025
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Chạy:**
```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# Stop và xóa data
docker-compose down -v
```

**Cập nhật .env:**
```env
DATABASE_URL="postgresql://tmsuser:tmspassword@localhost:5432/tms2025"
```

---

## 🔄 Migration từ Cloud sang Local

### Nếu muốn copy data từ cloud database:

**Bước 1: Export data từ cloud**
```bash
# Kết nối đến cloud database
pg_dump "postgresql://user:pass@hostname.neon.tech/dbname?sslmode=require" \
  --no-owner --no-acl -F c -f backup.dump
```

**Bước 2: Import vào local**
```bash
# Restore vào local database
pg_restore -d "postgresql://tmsuser:tmspassword@localhost:5432/tms2025" \
  backup.dump
```

---

## 📊 Kiểm tra Connection

Tạo file test: `test-db-connection.js`

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function main() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Simple query
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✅ Database connected successfully!');
    console.log('Current time:', result);
    
    // Count users
    const userCount = await prisma.user.count();
    console.log(`👥 Users in database: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

**Chạy test:**
```bash
node test-db-connection.js
```

---

## 🛠️ Troubleshooting

### Lỗi: "Connection refused"
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Fix:**
- Kiểm tra PostgreSQL đã chạy chưa: `docker ps` (nếu dùng Docker)
- Hoặc check Windows Services → PostgreSQL service

### Lỗi: "Password authentication failed"
```
Error: password authentication failed for user "tmsuser"
```

**Fix:**
- Kiểm tra lại username/password trong DATABASE_URL
- Đảm bảo khớp với config khi tạo database

### Lỗi: "Database does not exist"
```
Error: database "tms2025" does not exist
```

**Fix:**
```bash
# Tạo database manually
psql -U tmsuser -h localhost

# Trong psql prompt:
CREATE DATABASE tms2025;
\q
```

---

## 🎯 Khuyến nghị

### Cho Development (Local):
- ✅ Docker Compose (dễ nhất)
- ✅ PostgreSQL local
- ✅ Không tốn tiền, không giới hạn

### Cho Production:
- ✅ Neon Pro ($19/month)
- ✅ Supabase Pro ($25/month)
- ✅ Railway ($5/month)
- ✅ Render ($7/month)

---

## 📝 Cập nhật .gitignore

Đảm bảo file `.env.local` không bị commit:

```gitignore
# Environment
.env
.env.local
.env.*.local

# Database
*.dump
*.sql
postgres_data/
```

---

## 🔐 Best Practices

### Development:
```env
# .env.local
DATABASE_URL="postgresql://tmsuser:tmspassword@localhost:5432/tms2025"
```

### Production:
```env
# .env.production (hoặc Vercel Environment Variables)
DATABASE_URL="postgresql://user:pass@production-host/db?sslmode=require"
```

**Không bao giờ commit database credentials vào Git!**

---

## 🚀 Quick Start Commands

```bash
# 1. Start local database
docker-compose up -d

# 2. Update .env
echo 'DATABASE_URL="postgresql://tmsuser:tmspassword@localhost:5432/tms2025"' > .env.local

# 3. Setup database
npx prisma db push
npx prisma db seed

# 4. Start dev server
npm run dev
```

Xong! Bây giờ bạn có database local không giới hạn! 🎉

