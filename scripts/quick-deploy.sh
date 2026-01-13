#!/bin/bash

# Quick deploy script to production server
# Usage: bash scripts/quick-deploy.sh

set -e

SERVER_IP="14.225.36.94"
SERVER_USER="root"
SERVER_DIR="/var/www/tms-2025"

echo "🚀 Quick Deploy to Production Server"
echo "====================================="
echo ""
echo "📡 Server: $SERVER_IP"
echo "👤 User: $SERVER_USER"
echo ""

# Step 1: Upload deploy script
echo "📤 Step 1/5: Uploading deploy script..."
scp scripts/deploy-to-vps.sh $SERVER_USER@$SERVER_IP:/tmp/
echo "✅ Script uploaded"

# Step 2: Run deploy script
echo ""
echo "🔧 Step 2/5: Running deployment script..."
echo "⚠️  This will install Node.js, PostgreSQL, Nginx, PM2..."
echo ""
read -p "Continue? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Deployment cancelled"
    exit 0
fi

ssh $SERVER_USER@$SERVER_IP "cd /tmp && bash deploy-to-vps.sh"

# Step 3: Upload code
echo ""
echo "📦 Step 3/5: Uploading application code..."
read -p "Upload code to server? (y/n): " upload_code
if [ "$upload_code" = "y" ]; then
    echo "Creating archive..."
    tar -czf /tmp/tms-2025.tar.gz \
        --exclude=node_modules \
        --exclude=.next \
        --exclude=.git \
        --exclude=*.log \
        --exclude=.env* \
        .
    
    echo "Uploading..."
    scp /tmp/tms-2025.tar.gz $SERVER_USER@$SERVER_IP:/tmp/
    
    echo "Extracting on server..."
    ssh $SERVER_USER@$SERVER_IP << 'EOF'
mkdir -p /var/www/tms-2025
cd /var/www/tms-2025
tar -xzf /tmp/tms-2025.tar.gz
rm /tmp/tms-2025.tar.gz
EOF
    
    rm /tmp/tms-2025.tar.gz
    echo "✅ Code uploaded"
else
    echo "⚠️  Skipped code upload. Make sure to clone from Git on server!"
fi

# Step 4: Setup environment
echo ""
echo "⚙️  Step 4/5: Setting up environment..."
echo "You need to configure .env.production on server"
echo "Run: ssh $SERVER_USER@$SERVER_IP"
echo "Then: nano /var/www/tms-2025/.env.production"

# Step 5: Final steps
echo ""
echo "🎉 Step 5/5: Deployment script completed!"
echo ""
echo "📝 Next steps:"
echo "1. SSH to server: ssh $SERVER_USER@$SERVER_IP"
echo "2. Edit environment: nano /var/www/tms-2025/.env.production"
echo "3. Build & start: cd /var/www/tms-2025 && pnpm build && pm2 start ecosystem.config.js"
echo "4. Setup domain DNS to point to: $SERVER_IP"
echo "5. Setup SSL: sudo certbot --nginx -d your-domain.com"
echo ""
echo "🔍 Check status:"
echo "   ssh $SERVER_USER@$SERVER_IP 'pm2 status'"
echo "   ssh $SERVER_USER@$SERVER_IP 'pm2 logs tms-2025'"
echo ""

