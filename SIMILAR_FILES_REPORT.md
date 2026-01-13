# BÁO CÁO CÁC FILE CÓ ĐỘ TƯƠNG ĐỒNG >= 80%

## 📊 TỔNG QUAN

**Tổng số file được quét:** 568 files  
**Các file có độ tương đồng >= 80%:** 1 cặp  
**Ngày phân tích:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

---

## 🔍 CHI TIẾT CÁC FILE TƯƠNG ĐỒNG

### 1. Sentry Configuration Files (88-95% tương đồng)

| File 1 | File 2 | Độ tương đồng | Số dòng | Ghi chú |
|--------|--------|---------------|---------|---------|
| `sentry.edge.config.ts` | `sentry.server.config.ts` | **88%** | 25/25 | Chỉ khác comment và message log |
| `sentry.edge.config.ts` | `sentry.client.config.ts` | **~60%** | 25/40 | Client có thêm replay config |
| `sentry.server.config.ts` | `sentry.client.config.ts` | **~60%** | 25/40 | Client có thêm replay config |

**Phân tích:**
- ✅ **Giống nhau:** Cấu trúc code, logic init Sentry, config options cơ bản
- ❌ **Khác nhau:** 
  - Edge/Server: Chỉ khác comment và log message
  - Client: Có thêm `replayIntegration`, `replaysOnErrorSampleRate`, `replaysSessionSampleRate`
- 💡 **Khuyến nghị:** 
  - Edge và Server có thể refactor thành 1 file chung với parameter
  - Client giữ riêng vì có config đặc biệt cho replay

---

## 📁 CÁC FILE CÓ TÊN TƯƠNG TỰ (CẦN KIỂM TRA)

### 2. Category Files

| File 1 | File 2 | Vị trí | Mục đích |
|--------|--------|--------|----------|
| `actions/category.ts` | `types/category.ts` | Khác thư mục | Actions vs Types - **KHÁC NHAU** ✅ |

### 3. Upload Files

| File 1 | File 2 | Vị trí | Mục đích |
|--------|--------|--------|----------|
| `actions/upload.ts` | `types/upload.ts` | Khác thư mục | Actions vs Types - **KHÁC NHAU** ✅ |

### 4. Template Files

| File 1 | File 2 | Vị trí | Mục đích |
|--------|--------|--------|----------|
| `lib/telegram/templates.ts` | `prisma/seeds/templates.ts` | Khác thư mục | Telegram templates vs Seed data - **KHÁC NHAU** ✅ |

### 5. PersonalDashboardClient (⚠️ CẢNH BÁO)

| File 1 | File 2 | Vị trí | Phân tích |
|--------|--------|--------|----------|
| `app/(dashboard)/dashboard/_components/PersonalDashboardClient.tsx` | `app/(dashboard)/personal/_components/PersonalDashboardClient.tsx` | Khác thư mục | **KHÁC NHAU HOÀN TOÀN** - Có thể gây nhầm lẫn ⚠️ |

**Chi tiết:**
- File 1: Dashboard với tasks/requests/stats
- File 2: Personal dashboard với week progress, achievements
- 💡 **Khuyến nghị:** Đổi tên một trong hai để tránh nhầm lẫn

### 6. Avatar Components

| File 1 | File 2 | Vị trí | Phân tích |
|--------|--------|--------|----------|
| `components/ui/avatar.tsx` | `components/gamification/avatar.tsx` | Khác thư mục | **KHÁC NHAU HOÀN TOÀN** ✅ |
- File 1: UI Avatar component (image-based)
- File 2: Gamification Avatar (customizable character)

### 7. KPI Card Components

| File 1 | File 2 | Vị trí | Phân tích |
|--------|--------|--------|----------|
| `components/dashboard/kpi-card.tsx` | `components/leader/kpi-card.tsx` | Khác thư mục | **KHÁC NHAU** - Interface và props khác nhau ✅ |

### 8. Test Files

| File 1 | File 2 | Vị trí | Mục đích |
|--------|--------|--------|----------|
| `actions/__tests__/task.test.ts` | `lib/validations/__tests__/task.test.ts` | Khác thư mục | Test actions vs Test validations - **KHÁC NHAU** ✅ |
| `actions/__tests__/auth.test.ts` | `lib/__tests__/auth.test.ts` | Khác thư mục | Test actions vs Test lib - **KHÁC NHAU** ✅ |

### 9. Layout Files

| File 1 | File 2 | File 3 | File 4 | Vị trí |
|--------|--------|--------|--------|--------|
| `app/layout.tsx` | `app/(dashboard)/layout.tsx` | `app/(dashboard)/admin/layout.tsx` | `app/(dashboard)/leader/layout.tsx` | Nested layouts - **KHÁC NHAU** ✅ |

### 10. Dashboard Related Files

| File | Vị trí | Mục đích |
|------|--------|----------|
| `actions/dashboard.ts` | Actions | Server actions |
| `lib/constants/dashboard.ts` | Constants | Constants |
| `lib/queries/dashboard.ts` | Queries | Database queries |
| `lib/types/dashboard.ts` | Types | CategoryData interface |
| `types/dashboard.ts` | Types | KPICard, DashboardFilters, ChartDataPoint, TeamMetrics |

**✅ Đã kiểm tra:** 2 file types/dashboard.ts **KHÁC NHAU HOÀN TOÀN**
- `lib/types/dashboard.ts`: Chỉ có `CategoryData` interface
- `types/dashboard.ts`: Có nhiều interfaces (KPICard, DashboardFilters, ChartDataPoint, TeamMetrics, etc.)

💡 **Khuyến nghị:** Giữ nguyên, không có duplicate

---

## 🎯 KẾT LUẬN VÀ KHUYẾN NGHỊ

### ✅ Files an toàn (khác nhau về mục đích)
- Category, Upload, Template files - Tên giống nhưng mục đích khác nhau
- Avatar components - UI vs Gamification
- Test files - Test các module khác nhau
- Layout files - Nested layouts hợp lý

### ⚠️ Files cần chú ý

1. **Sentry Config Files (88% tương đồng)**
   - Có thể refactor thành 1 file chung

2. **PersonalDashboardClient (2 files khác nhau)**
   - Nên đổi tên để tránh nhầm lẫn
   - File 1: `DashboardClient.tsx`
   - File 2: `PersonalDashboardClient.tsx` (giữ nguyên)

3. **Dashboard Types (2 files)**
   - Kiểm tra xem có duplicate types không
   - Nên consolidate vào 1 file

---

## 📋 BẢNG TỔNG HỢP

| STT | File 1 | File 2 | Độ tương đồng | Trạng thái | Hành động |
|-----|--------|--------|---------------|------------|-----------|
| 1 | `sentry.edge.config.ts` | `sentry.server.config.ts` | 88% | ⚠️ Tương đồng cao | Cân nhắc refactor |
| 2 | `dashboard/_components/PersonalDashboardClient.tsx` | `personal/_components/PersonalDashboardClient.tsx` | <50% | ⚠️ Tên giống, nội dung khác | Đổi tên file 1 |
| 3 | `lib/types/dashboard.ts` | `types/dashboard.ts` | <30% | ✅ Khác nhau | Không cần action |

---

**Lưu ý:** Báo cáo này chỉ phân tích các file có tên tương tự hoặc trong cùng thư mục. Các file khác có thể có nội dung tương đồng nhưng không được phát hiện nếu tên khác nhau.

