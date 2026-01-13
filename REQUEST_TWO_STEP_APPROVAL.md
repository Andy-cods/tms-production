# ✅ Quy trình duyệt yêu cầu 2 bước

## 🎯 Mục đích

Khi nhân viên tạo yêu cầu cho bộ phận khác, quy trình duyệt cần 2 bước để đảm bảo chất lượng:
1. **Leader của bộ phận được giao** duyệt công việc đã hoàn thành
2. **Người tạo yêu cầu** xác nhận cuối cùng rằng yêu cầu đã đáp ứng đúng nhu cầu

---

## 📋 Quy trình

### Ví dụ thực tế:
- Nhân viên **Team IT** tạo yêu cầu: "Thiết kế banner quảng cáo"
- Yêu cầu được giao cho **Team Marketing**
- Team Marketing hoàn thành công việc

### Bước 1: Leader duyệt
**Leader Team Marketing** xem xét và duyệt:
- ✅ Click nút **"Duyệt (Leader)"**
- ✅ Request chuyển sang trạng thái **`IN_REVIEW`** (màu tím 🟣)
- ✅ Người yêu cầu nhận notification

### Bước 2: Người yêu cầu xác nhận
**Nhân viên Team IT** (người tạo yêu cầu) xem xét:
- ✅ Click nút **"Xác nhận hoàn thành"** (màu xanh dương)
- ✅ Request chuyển sang trạng thái **`DONE`** (màu xanh lá 🟢)
- ✅ Leader Team Marketing nhận notification

---

## 🔄 Flow Chart

```
┌─────────────────────────────────────────────────────────────┐
│ Nhân viên Team IT tạo yêu cầu cho Team Marketing            │
│ Status: OPEN                                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────┐
│ Team Marketing hoàn thành công việc                         │
│ Tất cả tasks đã DONE                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 1: Leader Team Marketing duyệt                         │
│ - Click "Duyệt (Leader)"                                    │
│ - Status: OPEN → IN_REVIEW                                  │
│ - Notify: Người yêu cầu (IT)                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────┐
│ 🟣 IN_REVIEW: "Chờ xác nhận cuối"                           │
│                                                              │
│ Banner hiển thị:                                             │
│ "Leader đã duyệt yêu cầu. Vui lòng xác nhận hoàn thành"     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 2: Nhân viên IT xác nhận cuối cùng                     │
│ - Click "Xác nhận hoàn thành"                               │
│ - Status: IN_REVIEW → DONE                                  │
│ - Notify: Leader Marketing                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────┐
│ 🟢 DONE: Yêu cầu hoàn thành hoàn toàn                       │
│ - completedAt: now()                                        │
│ - Audit log: REQUESTER_APPROVE_REQUEST                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Ma trận phân quyền

### Bước 1: Leader duyệt

| Người dùng | Request ở OPEN/IN_PROGRESS | Request ở IN_REVIEW | Ghi chú |
|------------|---------------------------|---------------------|---------|
| **Admin** | ✅ Duyệt → DONE | ✅ Không cần bước 2 | Duyệt thẳng |
| **Leader (team được giao)** | ✅ Duyệt → IN_REVIEW | ❌ Không thấy nút | Chuyển sang bước 2 |
| **Leader (team khác)** | ❌ Không thấy nút | ❌ Không thấy nút | Không có quyền |
| **Người yêu cầu** | ❌ Không thấy nút | - | Chờ leader duyệt |

### Bước 2: Người yêu cầu xác nhận

| Người dùng | Request ở IN_REVIEW | Ghi chú |
|------------|---------------------|---------|
| **Admin** | ✅ Duyệt → DONE | Duyệt thẳng |
| **Người yêu cầu** | ✅ Xác nhận → DONE | Xác nhận cuối |
| **Leader** | ❌ Không thấy nút | Đã duyệt rồi |
| **Người khác** | ❌ Không thấy nút | Không có quyền |

---

## 🎨 UI/UX

### Status Badge

| Status | Màu | Label | Ý nghĩa |
|--------|-----|-------|---------|
| `OPEN` | 🔵 Xanh dương | "Mở" | Chờ xử lý |
| `IN_PROGRESS` | 🟠 Cam | "Đang xử lý" | Đang làm |
| `IN_REVIEW` | 🟣 Tím | "Chờ xác nhận cuối" | Leader đã duyệt, chờ requester |
| `DONE` | 🟢 Xanh lá | "Hoàn thành" | Hoàn thành hoàn toàn |

### Nút Action

**Leader thấy (khi status ≠ IN_REVIEW, DONE, ARCHIVED):**
```tsx
<Button className="bg-green-600">
  <CheckCircle2 /> Duyệt (Leader)
</Button>
```

**Người yêu cầu thấy (khi status = IN_REVIEW):**
```tsx
<Button className="bg-blue-600">
  <CheckCircle2 /> Xác nhận hoàn thành
</Button>
```

**Admin thấy (mọi lúc):**
```tsx
<Button className="bg-green-600">
  <CheckCircle2 /> Duyệt
</Button>
```

### Banner thông báo (IN_REVIEW)

Khi request ở trạng thái `IN_REVIEW`, hiển thị banner màu tím:

**Nếu người xem là người yêu cầu:**
```
✅ Yêu cầu đã được Leader duyệt
Leader đã duyệt yêu cầu này. Vui lòng xem xét và xác nhận hoàn thành cuối cùng.
```

**Nếu người xem là người khác:**
```
✅ Yêu cầu đã được Leader duyệt
Đang chờ người yêu cầu xác nhận hoàn thành cuối cùng.
```

---

## 📝 Server Actions

### 1. `approveRequest(requestId)` - Bước 1: Leader duyệt

**Logic:**
- ✅ RBAC: Chỉ Leader của team được giao hoặc Admin
- ✅ Kiểm tra: Tất cả tasks phải DONE
- ✅ Admin: Duyệt thẳng → `DONE`
- ✅ Leader: Chuyển → `IN_REVIEW`
- ✅ Audit log: `LEADER_APPROVE_REQUEST`
- ✅ Notification: Gửi cho người yêu cầu

**Code:**
```typescript
// Leader approve
newStatus = "IN_REVIEW";

await prisma.notification.create({
  data: {
    userId: request.creator.id,
    type: "REVIEW_NEEDED",
    title: "Yêu cầu đã được Leader duyệt",
    message: "Leader đã duyệt yêu cầu. Vui lòng xác nhận hoàn thành cuối cùng.",
  },
});
```

### 2. `requesterApproveRequest(requestId)` - Bước 2: Người yêu cầu xác nhận

**Logic:**
- ✅ RBAC: Chỉ người tạo yêu cầu
- ✅ Kiểm tra: Request phải ở trạng thái `IN_REVIEW`
- ✅ Update: Status → `DONE`, completedAt = now()
- ✅ Audit log: `REQUESTER_APPROVE_REQUEST`
- ✅ Notification: Gửi cho Leader

**Code:**
```typescript
await prisma.request.update({
  where: { id: requestId },
  data: {
    status: "DONE",
    completedAt: new Date(),
  },
});

await prisma.notification.create({
  data: {
    userId: request.team.leaderId,
    type: "COMPLETED",
    title: "Yêu cầu đã hoàn thành",
    message: "Người yêu cầu đã xác nhận hoàn thành yêu cầu.",
  },
});
```

---

## 🧪 Test Cases

### TC1: Quy trình hoàn chỉnh

**Điều kiện:**
- User A (Staff Team IT) tạo request cho Team Marketing
- Team Marketing hoàn thành tasks
- User B (Leader Team Marketing)
- User A là người yêu cầu

**Bước test:**
1. User B login → Mở request detail
2. ✅ Thấy nút "Duyệt (Leader)"
3. Click "Duyệt (Leader)"
4. ✅ Request chuyển sang `IN_REVIEW`
5. ✅ User A nhận notification
6. User A login → Mở request detail
7. ✅ Thấy banner "Leader đã duyệt yêu cầu"
8. ✅ Thấy nút "Xác nhận hoàn thành"
9. Click "Xác nhận hoàn thành"
10. ✅ Request chuyển sang `DONE`
11. ✅ User B nhận notification

### TC2: Leader team khác không thấy nút duyệt

**Điều kiện:**
- Request được giao cho Team Marketing
- User C là Leader Team IT

**Kết quả:**
- ❌ User C KHÔNG thấy nút "Duyệt (Leader)"
- ❌ Nếu call API, nhận error: "Bạn chỉ có thể duyệt yêu cầu của team mình"

### TC3: Người yêu cầu không thể duyệt khi status ≠ IN_REVIEW

**Điều kiện:**
- Request ở trạng thái `OPEN`
- User A là người yêu cầu

**Kết quả:**
- ❌ User A KHÔNG thấy nút "Xác nhận hoàn thành"
- ❌ Nếu call API, nhận error: "Yêu cầu phải được Leader duyệt trước"

### TC4: Admin duyệt thẳng

**Điều kiện:**
- Request ở trạng thái `OPEN`
- User X là Admin

**Kết quả:**
- ✅ User X thấy nút "Duyệt"
- ✅ Click → Request chuyển thẳng sang `DONE`
- ✅ Không cần bước 2

---

## 📊 Database Schema

### Request Model

```prisma
model Request {
  id          String        @id @default(uuid())
  status      RequestStatus @default(OPEN)
  completedAt DateTime?     // Set when status = DONE
  creatorId   String        // Người tạo yêu cầu
  teamId      String?       // Team được giao
  // ... other fields
}

enum RequestStatus {
  OPEN
  IN_PROGRESS
  IN_REVIEW      // Leader đã duyệt, chờ requester
  DONE           // Hoàn thành hoàn toàn
  // ... other statuses
}
```

### Audit Log

```typescript
// Leader approve
{
  action: "LEADER_APPROVE_REQUEST",
  entity: "Request",
  entityId: requestId,
  newValue: { status: "IN_REVIEW" }
}

// Requester approve
{
  action: "REQUESTER_APPROVE_REQUEST",
  entity: "Request",
  entityId: requestId,
  newValue: { status: "DONE" }
}
```

---

## ✨ Lợi ích

1. **Kiểm soát chất lượng**: Người yêu cầu xác nhận công việc đáp ứng đúng nhu cầu
2. **Trách nhiệm rõ ràng**: 
   - Leader chịu trách nhiệm về kỹ thuật/chuyên môn
   - Requester chịu trách nhiệm về yêu cầu nghiệp vụ
3. **Giảm rủi ro**: Không xảy ra tình huống "làm xong nhưng không đúng yêu cầu"
4. **Audit trail đầy đủ**: Theo dõi ai duyệt, khi nào duyệt
5. **UX tốt**: Banner và nút rõ ràng, người dùng biết cần làm gì

---

## 🎉 Kết luận

Quy trình duyệt 2 bước đã được implement hoàn chỉnh:

- ✅ Leader duyệt → `IN_REVIEW`
- ✅ Người yêu cầu xác nhận → `DONE`
- ✅ Admin có thể duyệt thẳng
- ✅ Phân quyền chính xác theo team
- ✅ UI/UX rõ ràng với banner và nút
- ✅ Notification đầy đủ
- ✅ Audit log chi tiết

**Có thể test ngay!** 🎊

