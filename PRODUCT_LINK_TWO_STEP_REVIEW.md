# ✅ Luồng Review Product Link 2 Bước

## 🎯 Yêu cầu

Sau khi Leader duyệt xong, link sản phẩm mới được gửi đến người yêu cầu để duyệt. Nếu Requester từ chối, sẽ trả về cho Leader để review và phân công chỉnh sửa lại.

---

## ✅ Luồng mới

### 1. Assignee nộp link
- Status: `PENDING`
- Task status: `IN_REVIEW`

### 2. Leader duyệt (Bước 1)
- Status: `PENDING` → `LEADER_APPROVED`
- Task status: Vẫn `IN_REVIEW` (chưa DONE)
- Notification: Gửi cho Requester

### 3. Requester duyệt (Bước 2 - Cuối cùng)
- Status: `LEADER_APPROVED` → `APPROVED`
- Task status: `DONE`
- Notification: Gửi cho Assignee

### 4. Từ chối

#### Leader từ chối:
- Status: `PENDING` → `REJECTED`
- Task status: `REWORK`
- Notification: Gửi cho Assignee

#### Requester từ chối:
- Status: `LEADER_APPROVED` → `REJECTED`
- Task status: `REWORK`
- Notification: Gửi cho Leader (để review và phân công chỉnh sửa)

---

## 📋 Các thay đổi

### 1. Server Actions (`actions/task.ts`)

#### `approveProductLink`
- ✅ Phân biệt Leader vs Requester
- ✅ Leader duyệt → `LEADER_APPROVED`, task vẫn `IN_REVIEW`
- ✅ Requester duyệt → `APPROVED`, task = `DONE`
- ✅ Validation: Leader chỉ duyệt được `PENDING`, Requester chỉ duyệt được `LEADER_APPROVED`
- ✅ Notifications: Gửi đúng người (Requester khi Leader duyệt, Assignee khi Requester duyệt)

#### `rejectProductLink`
- ✅ Hỗ trợ từ chối ở cả 2 bước (`PENDING` và `LEADER_APPROVED`)
- ✅ Phân biệt ai từ chối:
  - Leader từ chối → notify Assignee
  - Requester từ chối → notify Leader (để review và phân công)
- ✅ Comment rõ ràng về ngữ cảnh từ chối

### 2. Query Tasks for Review (`app/(dashboard)/requests/[id]/page.tsx`)

- ✅ Leader thấy: `PENDING`, `REJECTED` (nếu Leader từ chối)
- ✅ Requester thấy: `LEADER_APPROVED`, `REJECTED` (nếu Requester từ chối)
- ✅ Admin thấy: Tất cả (`PENDING`, `LEADER_APPROVED`, `REJECTED`)

### 3. UI Component (`ProductLinkReviewSection`)

- ✅ Hiển thị trạng thái `LEADER_APPROVED` với badge màu xanh dương
- ✅ Badge rõ ràng:
  - `PENDING`: "Đang chờ Leader duyệt"
  - `LEADER_APPROVED`: "Leader đã duyệt - Chờ người yêu cầu duyệt"
  - `APPROVED`: "Đã duyệt hoàn toàn"
  - `REJECTED`: "Đã từ chối - Cần chỉnh sửa lại"
- ✅ Nút duyệt/từ chối chỉ hiển thị khi user có quyền:
  - Leader: Chỉ thấy nút khi status = `PENDING` hoặc `REJECTED`
  - Requester: Chỉ thấy nút khi status = `LEADER_APPROVED` hoặc `REJECTED`
  - Admin: Thấy tất cả

---

## 🎉 Kết quả

### Luồng hoạt động:
1. ✅ Assignee nộp link → `PENDING`
2. ✅ Leader duyệt → `LEADER_APPROVED`, notify Requester
3. ✅ Requester duyệt → `APPROVED`, task = `DONE`, notify Assignee
4. ✅ Nếu Requester từ chối → `REJECTED`, notify Leader để review và phân công

### Phân quyền:
- ✅ Leader chỉ thấy và duyệt được link ở trạng thái `PENDING`
- ✅ Requester chỉ thấy và duyệt được link ở trạng thái `LEADER_APPROVED`
- ✅ Admin có thể duyệt ở mọi bước

### Notifications:
- ✅ Leader duyệt → Requester nhận notification
- ✅ Requester duyệt → Assignee nhận notification
- ✅ Requester từ chối → Leader nhận notification để review

**Có thể test lại luồng review 2 bước!**

