# 🌱 SEED TEAMS & ADMIN USER

## ✅ ĐÃ TẠO

1. **File seed mới:** `prisma/seeds/teams-and-admin.ts`
   - Tạo 6 phòng ban
   - Tạo admin user: TechBC@gmail.com / 123456

2. **Updated:** `prisma/seed.ts` - Thêm call seed teams và admin

3. **Script:** `seed-teams-admin.sh` - Script chạy seed

---

## 🚀 CHẠY NGAY (Trên Server)

```bash
cd /var/www/tms-2025

# Chạy seed
pnpm run db:seed
```

Hoặc dùng script:

```bash
cd /var/www/tms-2025
chmod +x seed-teams-admin.sh
./seed-teams-admin.sh
```

---

## 📋 6 PHÒNG BAN SẼ ĐƯỢC TẠO

1. **Phòng Marketing**
   - Thiết kế, Content, Ads và Planning

2. **Phòng Chăm sóc khách hàng**
   - Quản lý nền tảng, vận hành và phát triển sản phẩm, dịch vụ

3. **Phòng HR**
   - Tuyển dụng, đào tạo và quản lý nhân sự

4. **Phòng Tài chính**
   - Quản lý tài chính, ngân sách và báo cáo tài chính

5. **Phòng Kế toán**
   - Kế toán, thuế và báo cáo kế toán

6. **Phòng IT**
   - Phát triển phần mềm, bảo trì hệ thống và hỗ trợ kỹ thuật

---

## 👤 ADMIN USER

```
Email: TechBC@gmail.com
Password: 123456
Role: ADMIN
```

---

## ✅ VERIFY SAU KHI SEED

### Check teams:

```bash
export PGPASSWORD='tms_secure_2024'
psql -U tmsuser -d tms2025 -h localhost -c "SELECT name FROM teams ORDER BY name;"
```

**Expected output:**
```
                    name                    
--------------------------------------------
 Phòng Chăm sóc khách hàng
 Phòng HR
 Phòng IT
 Phòng Kế toán
 Phòng Marketing
 Phòng Tài chính
(6 rows)
```

### Check admin user:

```bash
psql -U tmsuser -d tms2025 -h localhost -c "SELECT email, name, role FROM users WHERE role='ADMIN';"
```

**Expected output:**
```
       email        |     name      | role  
--------------------+---------------+-------
 TechBC@gmail.com   | TechBC Admin  | ADMIN
(1 row)
```

---

## 🔍 NẾU CẦN CHẠY LẠI

Seed script sử dụng `upsert`, nên có thể chạy lại an toàn:

```bash
pnpm run db:seed
```

Nó sẽ:
- ✅ Update teams nếu đã tồn tại
- ✅ Update admin user nếu đã tồn tại
- ✅ Tạo mới nếu chưa có

---

## 📝 LOGIN VỚI ADMIN

1. Go to: http://14.225.36.94:3001
2. Login:
   - Email: `TechBC@gmail.com`
   - Password: `123456`
3. Bạn sẽ có quyền ADMIN để quản lý toàn bộ hệ thống

---

## 🎯 NEXT STEPS

Sau khi seed xong:

1. **Login với admin:**
   - TechBC@gmail.com / 123456

2. **Check phòng ban:**
   - Vào Admin → Teams
   - Sẽ thấy 6 phòng ban

3. **Tạo users cho từng phòng ban:**
   - Có thể tạo qua Admin panel
   - Hoặc dùng script `create-user.js`

---

**Chạy seed ngay để có đủ 6 phòng ban và admin user!** 🚀

