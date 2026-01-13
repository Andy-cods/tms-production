# 🔍 Debug Domain Issue

## Vấn đề
- ✅ PM2: online
- ✅ Nginx: running
- ❌ `curl -I http://tms.bcagency.vn` → Killed

## Kiểm tra từng bước

### 1. Test app local
```bash
curl -I http://localhost:3001
```

### 2. Test nginx proxy
```bash
curl -v http://localhost:3001 2>&1 | head -20
```

### 3. Test domain từ server
```bash
curl -v http://tms.bcagency.vn 2>&1 | head -30
```

### 4. Kiểm tra DNS
```bash
nslookup tms.bcagency.vn
dig tms.bcagency.vn
```

### 5. Kiểm tra nginx error log
```bash
tail -50 /var/log/nginx/error.log
```

### 6. Kiểm tra app logs
```bash
pm2 logs tms-2025 --lines 50 --nostream
```

### 7. Test với timeout
```bash
timeout 5 curl -I http://tms.bcagency.vn || echo "Timeout hoặc lỗi"
```

### 8. Kiểm tra firewall
```bash
iptables -L -n | grep 80
ufw status
```

