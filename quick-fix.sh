#!/bin/bash
set -e
cd /var/www/tms-2025

# Fix NEXTAUTH_URL
CORRECT_URL="http://14.225.36.94:3001"
if grep -q "^NEXTAUTH_URL=" .env; then
    sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=$CORRECT_URL|" .env
else
    echo "NEXTAUTH_URL=$CORRECT_URL" >> .env
fi

# Stop app
pm2 stop tms-2025 || true

# Clean cache
rm -rf .next
rm -rf node_modules/.cache

# Rebuild
pnpm run build

# Restart
pm2 restart tms-2025 --update-env
pm2 save

echo "✅ Done!"
