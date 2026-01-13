# PowerShell script for Windows users
Write-Host "🚀 Setting up local database for TMS-2025" -ForegroundColor Green
Write-Host ""

# Check if Docker is installed
try {
    $dockerVersion = docker --version 2>$null
    if (-not $dockerVersion) {
        throw "Docker not found"
    }
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed!" -ForegroundColor Red
    Write-Host "📥 Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    docker info 2>$null | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running!" -ForegroundColor Red
    Write-Host "🐳 Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Start PostgreSQL container
Write-Host "📦 Starting PostgreSQL container..." -ForegroundColor Cyan
docker-compose up -d

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test connection
Write-Host "🔍 Testing database connection..." -ForegroundColor Cyan
node scripts/test-db-connection.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Local database is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Create .env.local with:" -ForegroundColor White
    Write-Host '      DATABASE_URL="postgresql://tmsuser:tmspassword@localhost:5432/tms2025"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Push database schema:" -ForegroundColor White
    Write-Host "      npm run db:push" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   3. Seed data (optional):" -ForegroundColor White
    Write-Host "      npm run db:seed" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   4. Start development server:" -ForegroundColor White
    Write-Host "      npm run dev" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Failed to connect to database!" -ForegroundColor Red
    Write-Host "📋 Check logs: docker-compose logs postgres" -ForegroundColor Yellow
}

