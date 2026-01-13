#!/bin/bash
# Bash script để khởi động môi trường dev (cho Git Bash trên Windows)

echo "🚀 Starting TMS 2025 Dev Environment..."
echo ""

# Kiểm tra file .env.local
if [ ! -f .env.local ]; then
    echo "❌ File .env.local không tồn tại!"
    echo "📝 Tạo file từ env.example..."
    cp env.example .env.local
    echo "✅ Đã tạo .env.local. Vui lòng kiểm tra và điền các giá trị cần thiết."
    echo ""
    exit 1
fi

# Kiểm tra port 4000
if command -v lsof &> /dev/null; then
    PORT_PID=$(lsof -ti:4000 2>/dev/null)
    if [ ! -z "$PORT_PID" ]; then
        echo "⚠️  Port 4000 đang được sử dụng! (PID: $PORT_PID)"
        echo "   Đang kill process..."
        kill -9 $PORT_PID 2>/dev/null
        sleep 2
    fi
fi

# Generate Prisma Client
echo ""
echo "📦 Generating Prisma Client..."
pnpm run postinstall
if [ $? -ne 0 ]; then
    echo "❌ Prisma generate failed!"
    exit 1
fi

# Kiểm tra database schema
echo ""
echo "🗄️  Kiểm tra database schema..."
pnpm run db:push --accept-data-loss > /dev/null 2>&1

# Start dev server
echo ""
echo "🚀 Starting dev server on port 4000..."
echo "   URL: http://localhost:4000"
echo ""
echo "📝 Press Ctrl+C to stop"
echo ""

pnpm run dev

