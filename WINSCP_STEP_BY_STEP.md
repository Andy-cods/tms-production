# 🖱️ HƯỚNG DẪN WINSCP - TỪNG BƯỚC

## 📥 BƯỚC 1: DOWNLOAD WINSCP

1. Mở trình duyệt
2. Vào: https://winscp.net/eng/download.php
3. Click nút **"Download WinSCP"** (màu xanh)
4. Chọn **"WinSCP-5.xx.x-Setup.exe"** (Installer)
5. Lưu file về máy

---

## 🔧 BƯỚC 2: CÀI ĐẶT WINSCP

1. **Mở file vừa download** (WinSCP-5.xx.x-Setup.exe)
2. **Chọn ngôn ngữ:** English → OK
3. **Welcome screen:** Next
4. **License Agreement:** I accept → Next
5. **Installation type:** Typical → Next
6. **User interface style:** Commander (khuyến nghị) → Next
7. **Ready to Install:** Install
8. **Hoàn tất:** Finish

---

## 🔌 BƯỚC 3: KẾT NỐI ĐẾN SERVER

1. **Mở WinSCP** (icon trên desktop hoặc Start menu)

2. **Điền thông tin kết nối:**
   ```
   File protocol: SFTP
   Host name: 14.225.36.94
   Port number: 22
   User name: root
   Password: [password của bạn]
   ```

3. **Tích chọn:** ✅ Save password (nếu muốn lưu)

4. **Click nút "Login"** (màu xanh, góc dưới bên phải)

5. **Nếu có cảnh báo "Unknown server host key":**
   - Click **"Yes"** để tiếp tục
   - Tích **"Update cached key"** (nếu có)
   - Click **"OK"**

6. **Đợi kết nối...** (sẽ thấy 2 cửa sổ: Local và Remote)

---

## 📂 BƯỚC 4: ĐIỀU HƯỚNG THƯ MỤC

### Bên trái (Local - Máy của bạn):

1. Tìm thư mục project:
   - `C:\Users\Admin\projects\tms-2025`
2. Click vào thư mục để mở

### Bên phải (Remote - Server):

1. Điều hướng đến:
   - Click vào `/` (root)
   - Click vào `var`
   - Click vào `www`
   - Click vào `tms-2025`

**Hoặc gõ trực tiếp vào thanh địa chỉ:**
```
/var/www/tms-2025
```

---

## 📤 BƯỚC 5: UPLOAD FILE `lib/auth.ts`

1. **Bên trái:** Tìm file `lib/auth.ts`
   - Mở thư mục `lib` (nếu chưa thấy)
   - Tìm file `auth.ts`

2. **Bên phải:** Đảm bảo đang ở `/var/www/tms-2025/lib/`
   - Nếu chưa có thư mục `lib`, WinSCP sẽ tự tạo

3. **Kéo thả:**
   - Giữ chuột trái vào file `auth.ts` (bên trái)
   - Kéo sang bên phải vào thư mục `lib/`
   - Thả chuột

4. **Nếu có hộp thoại "Confirm overwrite":**
   - Tích **"Overwrite"**
   - Tích **"Apply to all"** (nếu có)
   - Click **"OK"**

5. **Đợi upload xong** (sẽ thấy file xuất hiện bên phải)

---

## 📤 BƯỚC 6: UPLOAD FILE `app/login/page.tsx`

1. **Bên trái:** Tìm file `app/login/page.tsx`
   - Mở thư mục `app`
   - Mở thư mục `login`
   - Tìm file `page.tsx`

2. **Bên phải:** Điều hướng đến `/var/www/tms-2025/app/login/`
   - Click vào `app` (nếu chưa mở)
   - Click vào `login` (nếu chưa mở)

3. **Kéo thả:**
   - Giữ chuột trái vào file `page.tsx` (bên trái)
   - Kéo sang bên phải vào thư mục `login/`
   - Thả chuột

4. **Nếu có hộp thoại "Confirm overwrite":**
   - Tích **"Overwrite"**
   - Tích **"Apply to all"** (nếu có)
   - Click **"OK"**

5. **Đợi upload xong**

---

## ✅ BƯỚC 7: KIỂM TRA

1. **Bên phải:** Kiểm tra files đã upload:
   - `/var/www/tms-2025/lib/auth.ts` ✅
   - `/var/www/tms-2025/app/login/page.tsx` ✅

2. **Right-click vào file** → **Properties** → Xem **"Last modification"** (phải là thời gian vừa upload)

---

## 🚀 BƯỚC 8: REBUILD APP

**Mở terminal/PowerShell và SSH vào server:**

```bash
ssh root@14.225.36.94
cd /var/www/tms-2025
pm2 stop tms-2025
rm -rf .next
pnpm run build
pm2 restart tms-2025
pm2 save
```

---

## 🎉 XONG!

**Test login:**
- http://14.225.36.94:3001/login
- Email: `TechBC@gmail.com`
- Password: `123456`

---

## ❓ GẶP VẤN ĐỀ?

### Không kết nối được:
- Kiểm tra password
- Kiểm tra IP: `14.225.36.94`
- Kiểm tra Port: `22`

### Không thấy file:
- Kiểm tra đúng thư mục chưa
- Refresh (F5)

### Upload bị lỗi:
- Kiểm tra quyền truy cập
- Thử lại

---

**Làm theo từng bước là được!** 🎯

