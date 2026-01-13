# ============================================
# Setup Môi trường Local - TMS 2025
# ============================================
# Script này giúp thiết lập môi trường phát triển trên Windows

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Môi trường Local - TMS 2025" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Kiểm tra đang ở đúng thư mục
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Lỗi: Không tìm thấy package.json" -ForegroundColor Red
    Write-Host "Vui lòng chạy script này trong thư mục gốc của dự án"
    exit 1
}

$PROJECT_DIR = Get-Location
Write-Host "📁 Thư mục dự án: $PROJECT_DIR" -ForegroundColor Green
Write-Host ""

# 1. Kiểm tra Node.js
Write-Host "1. Kiểm tra Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js đã được cài đặt: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js chưa được cài đặt" -ForegroundColor Red
    Write-Host "Vui lòng tải và cài đặt từ: https://nodejs.org/"
    exit 1
}
Write-Host ""

# 2. Kiểm tra pnpm
Write-Host "2. Kiểm tra pnpm..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm đã được cài đặt: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  pnpm chưa được cài đặt. Đang cài đặt..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Host "✅ Đã cài đặt pnpm" -ForegroundColor Green
}
Write-Host ""

# 3. Cài đặt dependencies
Write-Host "3. Cài đặt dependencies..." -ForegroundColor Yellow
Write-Host "Đang chạy: pnpm install" -ForegroundColor Gray
pnpm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Đã cài đặt dependencies" -ForegroundColor Green
} else {
    Write-Host "❌ Lỗi khi cài đặt dependencies" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 4. Setup .env.local
Write-Host "4. Setup environment variables..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env.local"
        Write-Host "✅ Đã tạo .env.local từ env.example" -ForegroundColor Green
        Write-Host "⚠️  Vui lòng chỉnh sửa .env.local và điền các giá trị cần thiết" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Không tìm thấy env.example. Tạo file .env.local trống..." -ForegroundColor Yellow
        @"
# Database
DATABASE_URL="postgresql://tmsuser:tmspassword@localhost:5432/tms2025"

# Authentication
NEXTAUTH_SECRET=""
AUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Server
PORT=3000
NODE_ENV="development"
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
        Write-Host "✅ Đã tạo .env.local" -ForegroundColor Green
    }
} else {
    Write-Host "✅ .env.local đã tồn tại" -ForegroundColor Green
}

# Tạo secret nếu chưa có
$envContent = Get-Content ".env.local" -Raw
if ($envContent -notmatch "NEXTAUTH_SECRET=.*[a-zA-Z0-9]{20,}") {
    Write-Host "⚠️  NEXTAUTH_SECRET chưa được cấu hình. Đang tạo secret mới..." -ForegroundColor Yellow
    $secret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
    $envContent = $envContent -replace 'NEXTAUTH_SECRET=".*"', "NEXTAUTH_SECRET=`"$secret`""
    $envContent = $envContent -replace 'AUTH_SECRET=".*"', "AUTH_SECRET=`"$secret`""
    $envContent | Set-Content ".env.local" -Encoding UTF8
    Write-Host "✅ Đã tạo NEXTAUTH_SECRET và AUTH_SECRET" -ForegroundColor Green
}
Write-Host ""

# 5. Kiểm tra Docker
Write-Host "5. Kiểm tra Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker đã được cài đặt: $dockerVersion" -ForegroundColor Green
    
    # Kiểm tra Docker đang chạy
    docker ps | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker daemon đang chạy" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Docker daemon chưa chạy. Vui lòng khởi động Docker Desktop" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Docker chưa được cài đặt" -ForegroundColor Yellow
    Write-Host "   Tải từ: https://www.docker.com/products/docker-desktop"
    Write-Host "   Hoặc bỏ qua nếu bạn dùng database khác"
}
Write-Host ""

# 6. Setup Database (Docker)
Write-Host "6. Setup Database..." -ForegroundColor Yellow
$setupDb = Read-Host "Bạn có muốn khởi động PostgreSQL với Docker? (Y/n)"
if ($setupDb -ne "n" -and $setupDb -ne "N") {
    try {
        Write-Host "Đang khởi động PostgreSQL..." -ForegroundColor Gray
        docker-compose up -d
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ PostgreSQL đã được khởi động" -ForegroundColor Green
            Write-Host "⏳ Đợi 5 giây để database sẵn sàng..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        } else {
            Write-Host "⚠️  Không thể khởi động PostgreSQL" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Lỗi khi khởi động PostgreSQL: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Bỏ qua setup database" -ForegroundColor Yellow
}
Write-Host ""

# 7. Generate Prisma Client
Write-Host "7. Generate Prisma Client..." -ForegroundColor Yellow
Write-Host "Đang chạy: npx prisma generate" -ForegroundColor Gray
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Đã generate Prisma Client" -ForegroundColor Green
} else {
    Write-Host "⚠️  Lỗi khi generate Prisma Client" -ForegroundColor Yellow
}
Write-Host ""

# 8. Chạy migrations
Write-Host "8. Chạy database migrations..." -ForegroundColor Yellow
$runMigrations = Read-Host "Bạn có muốn chạy migrations? (Y/n)"
if ($runMigrations -ne "n" -and $runMigrations -ne "N") {
    Write-Host "Đang chạy: pnpm run db:push" -ForegroundColor Gray
    pnpm run db:push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Đã chạy migrations" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Lỗi khi chạy migrations" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Bỏ qua migrations" -ForegroundColor Yellow
}
Write-Host ""

# 9. Seed data (optional)
Write-Host "9. Seed data..." -ForegroundColor Yellow
$seedData = Read-Host "Bạn có muốn seed data? (y/N)"
if ($seedData -eq "y" -or $seedData -eq "Y") {
    Write-Host "Đang chạy: pnpm run db:seed" -ForegroundColor Gray
    pnpm run db:seed
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Đã seed data" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Lỗi khi seed data" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Bỏ qua seed data" -ForegroundColor Yellow
}
Write-Host ""

# Tóm tắt
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Hoàn thành setup môi trường local!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Các bước tiếp theo:" -ForegroundColor Yellow
Write-Host "1. Chỉnh sửa .env.local và điền các giá trị cần thiết"
Write-Host "2. Chạy ứng dụng: pnpm run dev"
Write-Host "3. Mở trình duyệt: http://localhost:3000"
Write-Host ""
Write-Host "Lưu ý:" -ForegroundColor Yellow
Write-Host "- Đảm bảo .env.local đã được cấu hình đúng"
Write-Host "- Đảm bảo database đã được khởi động (nếu dùng Docker)"
Write-Host "- Xem thêm hướng dẫn trong GIT_WORKFLOW.md"
Write-Host ""

