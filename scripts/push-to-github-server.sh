#!/bin/bash

# ============================================
# Đẩy code từ Server lên GitHub - Copy Paste
# ============================================
# Repository: Andy-cods/tms-real
# Email: tienthangpt12@gmail.com

# Bước 1: Cấu hình Git
git config user.name "Andy-cods"
git config user.email "tienthangpt12@gmail.com"

# Bước 2: Khởi tạo Git (nếu chưa có)
if [ ! -d ".git" ]; then
    git init
    echo "✅ Đã khởi tạo Git repository"
fi

# Bước 3: Loại bỏ môi trường ảo khỏi Git
git rm --cached .env.local 2>/dev/null || true
git rm --cached .env 2>/dev/null || true
git rm --cached ecosystem.config.js 2>/dev/null || true
git rm -r --cached .pm2/ 2>/dev/null || true
git rm -r --cached node_modules/ 2>/dev/null || true
git rm -r --cached .next/ 2>/dev/null || true
git rm -r --cached postgres_data/ 2>/dev/null || true
echo "✅ Đã loại bỏ môi trường ảo khỏi Git"

# Bước 4: Thêm tất cả file
git add .

# Bước 5: Commit
git commit -m "Initial commit: TMS 2025 project" || echo "⚠️  Có thể đã có commit rồi"

# Bước 6: Tạo branch main (nếu chưa có)
git branch -M main 2>/dev/null || true

# Bước 7: Thêm remote GitHub
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/Andy-cods/tms-real.git

# Bước 8: Push lên GitHub
echo "🚀 Đang push lên GitHub..."
git push -u origin main

echo "✅ Hoàn thành!"

