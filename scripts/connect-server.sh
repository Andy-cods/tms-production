#!/bin/bash

# Quick connect to production server
# Usage: bash scripts/connect-server.sh

SERVER_IP="14.225.36.94"
SERVER_USER="root"

echo "🔗 Connecting to production server..."
echo "   IP: $SERVER_IP"
echo "   User: $SERVER_USER"
echo ""

ssh $SERVER_USER@$SERVER_IP

