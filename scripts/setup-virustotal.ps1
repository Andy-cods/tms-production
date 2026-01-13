# VirusTotal Setup Script (PowerShell)
# Run this after completing the implementation

Write-Host "`n🔧 Setting up VirusTotal Integration...`n" -ForegroundColor Cyan

# Step 1: Generate Prisma Client (includes new enums)
Write-Host "📦 Generating Prisma Client with new enums..." -ForegroundColor Yellow
npx prisma generate

Write-Host "`n✅ Setup complete!`n" -ForegroundColor Green

Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Get your VirusTotal API key from: https://www.virustotal.com/gui/join-us"
Write-Host "2. Add to .env.local: VIRUSTOTAL_API_KEY=your_key_here"
Write-Host "3. Run database migration: npx prisma migrate dev --name add_virus_scanning"
Write-Host "4. Test the service: import { virusScanService } from '@/lib/services/virus-scan-service'"

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "- Setup Guide: VIRUSTOTAL_SETUP.md"
Write-Host "- Examples: lib/services/virus-scan-service.example.ts"
Write-Host "- Summary: VIRUSTOTAL_IMPLEMENTATION_SUMMARY.md"
Write-Host ""

