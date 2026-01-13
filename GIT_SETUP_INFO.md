# 📋 THÔNG TIN CẦN CUNG CẤP - GIT SETUP

## ⚠️ PHÁT HIỆN: Folder chưa có Git repository

Để commit và push mượt mà, tôi cần bạn cung cấp các thông tin sau:

---

## 1️⃣ **GITHUB REPOSITORY URL** ⭐ BẮT BUỘC

### Câu hỏi:
**Repository GitHub của bạn là gì?**

### Ví dụ:
```
https://github.com/username/tms-2025.git
```

### Hoặc SSH:
```
git@github.com:username/tms-2025.git
```

### ℹ️ Hướng dẫn lấy URL:
1. Vào GitHub repository
2. Click nút **Code** (màu xanh lá)
3. Copy URL (HTTPS hoặc SSH)

**📝 VUI LÒNG CUNG CẤP:**
```
Repository URL: ___________________________________
```

---

## 2️⃣ **GIT USER CONFIG** ⭐ BẮT BUỘC

### Câu hỏi:
**Thông tin Git của bạn:**

```
Tên hiển thị: ___________________________________
Email GitHub: ___________________________________
```

### Ví dụ:
```
Tên hiển thị: Nguyen Van A
Email GitHub: nguyenvana@gmail.com
```

### ℹ️ Lưu ý:
- Email phải trùng với email GitHub account
- Tên có thể là tên thật hoặc username

---

## 3️⃣ **BRANCH NAME** (Optional)

### Câu hỏi:
**Bạn muốn push vào branch nào?**

- [ ] `main` (mặc định - khuyến nghị)
- [ ] `master`
- [ ] Branch khác: ______________

### ℹ️ Lưu ý:
- GitHub mới thường dùng `main`
- GitHub cũ thường dùng `master`
- Nếu không chắc, chọn `main`

**📝 Tôi sẽ dùng:** `main` (nếu bạn không chỉ định khác)

---

## 4️⃣ **AUTHENTICATION** (Tùy chọn)

### Câu hỏi:
**Bạn đã setup authentication cho GitHub chưa?**

### Option A: Personal Access Token (Khuyến nghị)
```
- [ ] Đã có Personal Access Token (PAT)
- [ ] Chưa có, cần hướng dẫn tạo
```

### Option B: SSH Key
```
- [ ] Đã setup SSH key
- [ ] Chưa có, cần hướng dẫn
```

### Option C: GitHub CLI
```
- [ ] Đã cài gh CLI và đăng nhập
- [ ] Chưa có
```

### ℹ️ Lưu ý:
- Nếu chưa có, tôi sẽ hướng dẫn tạo PAT
- PAT dễ dàng hơn SSH cho người mới

---

## 5️⃣ **GITIGNORE** (Optional)

### Câu hỏi:
**Bạn có muốn tôi kiểm tra/cập nhật .gitignore không?**

```
- [ ] Có, kiểm tra và cập nhật nếu cần
- [ ] Không, giữ nguyên
```

### ℹ️ Các file/folder nên ignore:
```
node_modules/
.next/
.env
.env.local
*.log
dist/
build/
coverage/
.DS_Store
```

---

## 6️⃣ **COMMIT MESSAGE STYLE** (Optional)

### Câu hỏi:
**Bạn muốn dùng commit message nào?**

### Option A: Detailed (Khuyến nghị)
```
perf: Optimize cleanup script and remove 218 trash files (36.49 MB)

Performance Improvements:
- Replace cleanup-analysis.js with async optimized version
- 100x faster: 0.01s vs ~1s (7,700 files/s)
...

(Khoảng 30 dòng, rất chi tiết)
```

### Option B: Short & Simple
```
chore: Cleanup project and optimize scripts

- Remove 218 trash files (36.49 MB)
- Optimize cleanup script (100x faster)
- Add security improvements
```

### Option C: Minimal
```
Cleanup and optimize project
```

**📝 Tôi sẽ dùng:** Option A (nếu bạn không chỉ định khác)

---

## 7️⃣ **REVIEW TRƯỚC KHI PUSH** (Optional)

### Câu hỏi:
**Bạn có muốn review trước khi push không?**

```
- [ ] Có, show cho tôi xem git diff trước
- [ ] Có, show danh sách files sẽ commit
- [ ] Không, cứ push luôn
```

**📝 Tôi sẽ:** Show danh sách files (để bạn yên tâm)

---

## 📝 TÓM TẮT - THÔNG TIN TỐI THIỂU CẦN CUNG CẤP

### ⭐ BẮT BUỘC (Không có thì không thể push):
1. **Repository URL** - Link GitHub repo
2. **Git User Name** - Tên hiển thị
3. **Git User Email** - Email GitHub

### ✅ TÙY CHỌN (Có default value):
4. Branch name → Default: `main`
5. Authentication → Sẽ hỏi khi push
6. Gitignore check → Default: Có
7. Commit style → Default: Detailed
8. Review → Default: Show files list

---

## 🚀 SẴN SÀNG? CUNG CẤP NGAY ĐÂY:

### 📋 FORM NHANH (Copy và điền):

```
REPOSITORY URL: 
(Ví dụ: https://github.com/username/tms-2025.git)

GIT USER NAME: 
(Ví dụ: Nguyen Van A)

GIT USER EMAIL: 
(Ví dụ: nguyenvana@gmail.com)

BRANCH: main
(Hoặc để trống nếu dùng main)

AUTHENTICATION: 
(Ví dụ: "Có PAT" hoặc "Chưa có, cần hướng dẫn")
```

---

## 💡 NẾU CHƯA CÓ GITHUB REPO

### Bạn cần tạo repo mới trên GitHub:

1. Vào https://github.com/new
2. Repository name: `tms-2025` (hoặc tên khác)
3. Description: `TMS - Task Management System`
4. Public hoặc Private
5. Click **Create repository**
6. Copy URL và cung cấp cho tôi

---

## ✅ SAU KHI CUNG CẤP, TÔI SẼ:

1. ✅ Init Git repository
2. ✅ Config user name & email
3. ✅ Add remote origin
4. ✅ Check và update .gitignore
5. ✅ Stage all changes
6. ✅ Commit với message chi tiết
7. ✅ Push to GitHub
8. ✅ Verify trên GitHub

**Tổng thời gian:** ~2-3 phút

---

## ❓ CÂU HỎI THƯỜNG GẶP

### Q: Tôi quên Repository URL, tìm ở đâu?
**A:** Vào GitHub → Repository của bạn → Click nút "Code" (xanh lá) → Copy URL

### Q: Tôi chưa có GitHub account?
**A:** Đăng ký tại https://github.com/signup (miễn phí)

### Q: Tôi chưa có repository?
**A:** Tạo tại https://github.com/new (2 phút)

### Q: Personal Access Token là gì?
**A:** Giống password, dùng để push code. Tôi sẽ hướng dẫn tạo nếu cần.

### Q: SSH Key là gì?
**A:** Cách xác thực an toàn hơn. Nhưng PAT dễ setup hơn cho người mới.

---

## 🎯 HÀNH ĐỘNG TIẾP THEO

**👉 VUI LÒNG CUNG CẤP 3 THÔNG TIN BẮT BUỘC:**

1. Repository URL
2. Git User Name  
3. Git User Email

**Sau đó tôi sẽ lo phần còn lại!** 🚀

---

**Prepared by:** AI Assistant  
**Date:** 13/01/2026  
**Status:** Waiting for user input... ⏳

