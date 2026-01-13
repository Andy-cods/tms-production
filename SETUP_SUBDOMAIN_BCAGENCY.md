# 🌐 HƯỚNG DẪN TẠO SUBDOMAIN CHO BCAGENCY.VN

## 📋 TỔNG QUAN

Bạn đã có domain: **bcagency.vn**

Bây giờ cần tạo **subdomain** để chạy TMS, ví dụ: **tms.bcagency.vn**

---

## 🎯 GỢI Ý TÊN SUBDOMAIN

Một số gợi ý tên subdomain cho TMS:

1. **`tms.bcagency.vn`** ⭐ (Khuyến nghị - Task Management System)
2. **`task.bcagency.vn`** (Task management)
3. **`workflow.bcagency.vn`** (Workflow management)
4. **`manage.bcagency.vn`** (Management system)
5. **`app.bcagency.vn`** (Application)
6. **`internal.bcagency.vn`** (Internal system)

**Tôi khuyến nghị dùng: `tms.bcagency.vn`**

---

## 🔧 CÁC BƯỚC TẠO SUBDOMAIN

### Bước 1: Đăng nhập vào quản lý domain

1. Truy cập website quản lý domain của **bcagency.vn**
   - Có thể là: P.A Vietnam, Matbao, Nhân Hòa, hoặc nhà cung cấp khác
   - Hoặc liên hệ người quản lý domain để được hỗ trợ

2. Đăng nhập vào tài khoản quản lý domain

---

### Bước 2: Vào phần Quản lý DNS

1. Tìm menu **"Quản lý tên miền"** hoặc **"Domain Management"**
2. Chọn domain **bcagency.vn**
3. Vào **"Quản lý DNS"** hoặc **"DNS Management"** hoặc **"DNS Records"**

---

### Bước 3: Thêm A Record cho subdomain

Thêm record mới với thông tin sau:

```
Type: A
Name: tms (hoặc tên subdomain bạn chọn)
Value: 14.225.36.94
TTL: 3600 (hoặc mặc định)
```

**Ví dụ cụ thể:**
- **Name**: `tms`
- **Type**: `A`
- **Value/Address**: `14.225.36.94`
- **TTL**: `3600`

Sau khi thêm, subdomain sẽ là: **tms.bcagency.vn**

---

### Bước 4: Lưu và đợi DNS propagate

1. **Lưu** cấu hình DNS
2. **Đợi 5-30 phút** để DNS propagate
3. Kiểm tra bằng cách:
   ```bash
   nslookup tms.bcagency.vn
   ```
   Hoặc dùng website: https://www.whatsmydns.net/

**Kết quả mong đợi:** `14.225.36.94`

---

## 🚀 BƯỚC 5: SETUP TRÊN SERVER

Sau khi DNS đã propagate, setup trên server:

### Upload scripts lên server:

```bash
# Từ máy local, upload scripts
scp setup-nginx-domain.sh root@14.225.36.94:/var/www/tms-2025/
scp add-domain.sh root@14.225.36.94:/var/www/tms-2025/
```

### SSH vào server và chạy:

```bash
# SSH vào server
ssh root@14.225.36.94
cd /var/www/tms-2025

# Setup Nginx (thay tms.bcagency.vn)
chmod +x setup-nginx-domain.sh
./setup-nginx-domain.sh tms.bcagency.vn

# Update environment variables
chmod +x add-domain.sh
./add-domain.sh tms.bcagency.vn
```

---

## 🔒 BƯỚC 6: SETUP SSL (HTTPS)

Sau khi subdomain hoạt động, setup SSL:

```bash
# Cài Certbot
sudo apt install certbot python3-certbot-nginx -y

# Lấy SSL certificate (miễn phí)
sudo certbot --nginx -d tms.bcagency.vn

# Update lại với HTTPS
cd /var/www/tms-2025
./add-domain.sh tms.bcagency.vn
```

---

## 📋 HƯỚNG DẪN CHI TIẾT THEO NHÀ CUNG CẤP

### Nếu dùng P.A Vietnam:

1. Đăng nhập: https://www.pavietnam.vn/
2. Vào **"Quản lý tên miền"** → Chọn **bcagency.vn**
3. Vào **"Quản lý DNS"**
4. Click **"Thêm bản ghi"** hoặc **"Add Record"**
5. Điền:
   - **Loại**: A
   - **Tên**: `tms`
   - **Giá trị**: `14.225.36.94`
   - **TTL**: `3600`
6. **Lưu**

---

### Nếu dùng Matbao:

1. Đăng nhập: https://www.matbao.net/
2. Vào **"Quản lý tên miền"** → Chọn **bcagency.vn**
3. Vào **"Quản lý DNS"**
4. Click **"Thêm bản ghi"**
5. Điền tương tự như trên

---

### Nếu dùng Nhân Hòa:

1. Đăng nhập: https://nhanhoa.com/
2. Vào **"Quản lý tên miền"** → Chọn **bcagency.vn**
3. Vào **"DNS"** hoặc **"Quản lý DNS"**
4. Thêm A Record tương tự

---

### Nếu không biết nhà cung cấp:

1. Kiểm tra WHOIS: https://whois.net/
2. Nhập `bcagency.vn` để xem thông tin registrar
3. Hoặc hỏi người quản lý domain/IT của công ty

---

## ✅ CHECKLIST

- [ ] Đã chọn tên subdomain (ví dụ: `tms.bcagency.vn`)
- [ ] Đã đăng nhập vào quản lý domain
- [ ] Đã thêm A Record: `tms` → `14.225.36.94`
- [ ] Đã đợi DNS propagate (5-30 phút)
- [ ] Đã kiểm tra DNS: `nslookup tms.bcagency.vn`
- [ ] Đã setup Nginx trên server
- [ ] Đã update environment variables
- [ ] Đã setup SSL (HTTPS)
- [ ] Đã test: https://tms.bcagency.vn

---

## 🆘 NẾU GẶP VẤN ĐỀ

### Không biết đăng nhập ở đâu:

- Hỏi người quản lý domain/IT của công ty
- Hoặc liên hệ nhà cung cấp domain để được hỗ trợ

### DNS chưa propagate:

- Đợi thêm 30-60 phút
- Kiểm tra lại: https://www.whatsmydns.net/

### Cần hỗ trợ thêm:

- Cho tôi biết bạn đang ở bước nào
- Tôi sẽ hướng dẫn chi tiết hơn

---

## 📞 TÓM TẮT NHANH

1. **Chọn tên subdomain**: `tms.bcagency.vn` (khuyến nghị)
2. **Vào quản lý DNS** của bcagency.vn
3. **Thêm A Record**: Name=`tms`, Value=`14.225.36.94`
4. **Đợi 5-30 phút** để DNS propagate
5. **Setup trên server** bằng scripts
6. **Setup SSL** để có HTTPS

---

**Bạn đã biết nhà cung cấp domain của bcagency.vn chưa? Nếu chưa, tôi có thể hướng dẫn cách kiểm tra!** 🚀

