# 📋 PHÂN TÍCH LUỒNG NỘP LINK SẢN PHẨM

## 🎯 Mục tiêu

Cho phép assignee nộp link sản phẩm khi hoàn thành task, và leader/requester có thể duyệt (approve/reject).

---

## 🔄 LUỒNG HOẠT ĐỘNG

### **Bước 1: Assignee hoàn thành task và nộp link**

**Trigger:**
- Task status = `IN_PROGRESS` hoặc `DONE`
- Assignee click "Nộp link sản phẩm"

**Input:**
- Product URL (bắt buộc, phải là valid URL)
- Ghi chú (optional, tối thiểu 20 ký tự nếu có)

**Action:**
1. Validate URL format
2. Lưu `productLink` vào Task
3. Update task status → `IN_REVIEW`
4. Tạo comment tự động: "Đã nộp link sản phẩm: [URL]"
5. Tạo audit log
6. Gửi notification cho Leader và Requester

**Database:**
```prisma
model Task {
  // ... existing fields
  productLink      String?  // URL sản phẩm
  productLinkSubmittedAt DateTime?  // Thời gian nộp
  productLinkSubmittedBy  String?    // User ID nộp
  productLinkReviewStatus String?   // "PENDING", "APPROVED", "REJECTED"
  productLinkReviewedAt  DateTime?
  productLinkReviewedBy  String?   // Leader/Requester ID
  productLinkReviewComment String? // Ghi chú khi review
}
```

---

### **Bước 2: Leader/Requester xem và duyệt**

**Who can review:**
- ✅ Team Leader (nếu task thuộc team)
- ✅ Request Creator (người tạo yêu cầu)
- ✅ Admin (luôn có quyền)

**UI Location:**
- Task detail page (`/my-tasks/[id]` hoặc `/requests/[id]`)
- Hiển thị section "Sản phẩm đã nộp" khi `productLink` có giá trị và `productLinkReviewStatus = "PENDING"`

**Actions:**
1. **Approve:**
   - Update `productLinkReviewStatus = "APPROVED"`
   - Update task status → `DONE`
   - Set `productLinkReviewedAt`, `productLinkReviewedBy`
   - Tạo comment: "Đã duyệt link sản phẩm"
   - Gửi notification cho Assignee
   - Audit log

2. **Reject:**
   - Update `productLinkReviewStatus = "REJECTED"`
   - Update task status → `REWORK`
   - Set `productLinkReviewedAt`, `productLinkReviewedBy`, `productLinkReviewComment` (bắt buộc)
   - Tạo comment: "Link sản phẩm bị từ chối: [lý do]"
   - Gửi notification cho Assignee
   - Audit log

---

## 📍 VỊ TRÍ HIỂN THỊ

### **1. Nộp link sản phẩm (Assignee)**

**Location:** Task detail page (`/my-tasks/[id]`)

**Condition:**
- User là assignee
- Task status = `IN_PROGRESS` hoặc `DONE`
- Chưa có `productLink` hoặc đã bị reject

**UI:**
```tsx
{isAssignee && (task.status === "IN_PROGRESS" || task.status === "DONE") && 
 (!task.productLink || task.productLinkReviewStatus === "REJECTED") && (
  <SubmitProductLinkDialog taskId={task.id} />
)}
```

---

### **2. Xem và duyệt link (Leader/Requester)**

**Location:** 
- Task detail page (`/my-tasks/[id]`)
- Request detail page (`/requests/[id]`)

**Condition:**
- User là Leader, Requester, hoặc Admin
- Task có `productLink`
- `productLinkReviewStatus = "PENDING"` hoặc `"REJECTED"`

**UI:**
```tsx
{canReview && task.productLink && (
  <ProductLinkReviewSection 
    task={task}
    onApprove={handleApprove}
    onReject={handleReject}
  />
)}
```

---

## 🗄️ DATABASE SCHEMA CHANGES

### **Thêm fields vào Task model:**

```prisma
model Task {
  // ... existing fields
  
  // Product link submission
  productLink              String?   // URL sản phẩm
  productLinkSubmittedAt   DateTime? // Thời gian nộp
  productLinkSubmittedBy   String?   // User ID nộp
  productLinkReviewStatus  String?   // "PENDING", "APPROVED", "REJECTED"
  productLinkReviewedAt    DateTime?
  productLinkReviewedBy    String?   // Leader/Requester ID
  productLinkReviewComment String?   // Ghi chú khi reject
}
```

---

## 🎨 UI COMPONENTS CẦN TẠO

### **1. SubmitProductLinkDialog**
- Input: URL (validate format)
- Input: Ghi chú (optional)
- Button: "Nộp link"
- Server Action: `submitProductLink()`

### **2. ProductLinkReviewSection**
- Display: Link đã nộp (clickable)
- Display: Thời gian nộp, người nộp
- Display: Ghi chú (nếu có)
- Buttons: "Duyệt" (approve), "Từ chối" (reject)
- Server Actions: `approveProductLink()`, `rejectProductLink()`

### **3. ProductLinkStatusBadge**
- PENDING: Yellow badge "Đang chờ duyệt"
- APPROVED: Green badge "Đã duyệt"
- REJECTED: Red badge "Đã từ chối"

---

## 🔔 NOTIFICATIONS

### **Khi nộp link:**
```
📤 Link sản phẩm đã được nộp

📋 Task: [Task Title]
🔗 Link: [URL]
👤 Nộp bởi: [Assignee Name]

Vui lòng xem và duyệt.
🔗 [Link to task]
```

**Gửi đến:**
- Team Leader (nếu có)
- Request Creator

---

### **Khi approve:**
```
✅ Link sản phẩm đã được duyệt

📋 Task: [Task Title]
👤 Duyệt bởi: [Reviewer Name]

Task đã được đánh dấu hoàn thành.
🔗 [Link to task]
```

**Gửi đến:**
- Assignee

---

### **Khi reject:**
```
❌ Link sản phẩm bị từ chối

📋 Task: [Task Title]
👤 Từ chối bởi: [Reviewer Name]
📝 Lý do: [Review Comment]

Vui lòng kiểm tra và nộp lại.
🔗 [Link to task]
```

**Gửi đến:**
- Assignee

---

## 📝 SERVER ACTIONS

### **1. submitProductLink()**
```typescript
submitProductLink({
  taskId: string;
  productLink: string;  // Valid URL
  comment?: string;     // Optional, min 20 chars if provided
}): Promise<{
  success: boolean;
  error?: string;
}>
```

**Workflow:**
1. Validate user is assignee
2. Validate URL format
3. Validate task status (IN_PROGRESS or DONE)
4. Update Task: `productLink`, `productLinkSubmittedAt`, `productLinkSubmittedBy`, `productLinkReviewStatus = "PENDING"`
5. Update task status → `IN_REVIEW`
6. Create comment
7. Create audit log
8. Send notifications
9. Revalidate paths

---

### **2. approveProductLink()**
```typescript
approveProductLink({
  taskId: string;
}): Promise<{
  success: boolean;
  error?: string;
}>
```

**Workflow:**
1. Validate user can review (Leader/Requester/Admin)
2. Validate `productLinkReviewStatus = "PENDING"`
3. Update Task: `productLinkReviewStatus = "APPROVED"`, `productLinkReviewedAt`, `productLinkReviewedBy`
4. Update task status → `DONE`
5. Create comment
6. Create audit log
7. Send notification to assignee
8. Revalidate paths

---

### **3. rejectProductLink()**
```typescript
rejectProductLink({
  taskId: string;
  comment: string;  // Required, min 20 chars
}): Promise<{
  success: boolean;
  error?: string;
}>
```

**Workflow:**
1. Validate user can review
2. Validate `productLinkReviewStatus = "PENDING"`
3. Validate comment (min 20 chars)
4. Update Task: `productLinkReviewStatus = "REJECTED"`, `productLinkReviewedAt`, `productLinkReviewedBy`, `productLinkReviewComment`
5. Update task status → `REWORK`
6. Create comment with rejection reason
7. Create audit log
8. Send notification to assignee
9. Revalidate paths

---

## ✅ CHECKLIST IMPLEMENTATION

- [ ] Thêm fields vào Task schema
- [ ] Tạo migration
- [ ] Tạo `SubmitProductLinkDialog` component
- [ ] Tạo `ProductLinkReviewSection` component
- [ ] Tạo `ProductLinkStatusBadge` component
- [ ] Implement `submitProductLink()` action
- [ ] Implement `approveProductLink()` action
- [ ] Implement `rejectProductLink()` action
- [ ] Thêm UI vào task detail page
- [ ] Thêm UI vào request detail page
- [ ] Implement notifications
- [ ] Test flow đầy đủ

---

## 🎯 KẾT QUẢ MONG ĐỢI

1. ✅ Assignee có thể nộp link sản phẩm khi hoàn thành
2. ✅ Leader/Requester thấy notification và có thể duyệt
3. ✅ Approve → Task status = DONE
4. ✅ Reject → Task status = REWORK, assignee có thể nộp lại
5. ✅ Tất cả actions đều có audit log và notifications

