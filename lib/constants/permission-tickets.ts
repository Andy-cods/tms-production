export type PermissionTicket = {
  value: string;
  label: string;
  description: string;
  category:
    | "Requests"
    | "Tasks"
    | "Reports"
    | "Users"
    | "Admin"
    | "Catalog"
    | "Gamification"
    | "Notifications"
    | "Automation";
};

export const PERMISSION_TICKETS: PermissionTicket[] = [
  {
    value: "requests:view_all",
    label: "Xem tất cả yêu cầu",
    description: "Truy cập toàn bộ yêu cầu trong hệ thống, bao gồm các phòng ban khác.",
    category: "Requests",
  },
  {
    value: "requests:view_team",
    label: "Xem yêu cầu phòng ban",
    description: "Xem được tất cả yêu cầu thuộc phòng ban của mình.",
    category: "Requests",
  },
  {
    value: "requests:create",
    label: "Tạo yêu cầu",
    description: "Cho phép tạo yêu cầu thay mặt người khác hoặc phòng ban khác.",
    category: "Requests",
  },
  {
    value: "requests:assign",
    label: "Phân công yêu cầu",
    description: "Cho phép phân công và cập nhật tiến độ yêu cầu của người khác.",
    category: "Requests",
  },
  {
    value: "requests:approve",
    label: "Duyệt yêu cầu",
    description: "Quyền duyệt / trả lại yêu cầu sau khi hoàn thành.",
    category: "Requests",
  },
  {
    value: "tasks:assign",
    label: "Phân công task",
    description: "Tạo và phân công task cho thành viên trong team hoặc phòng ban khác.",
    category: "Tasks",
  },
  {
    value: "tasks:create",
    label: "Tạo task",
    description: "Cho phép tạo task tùy chỉnh ngoài workflow mặc định.",
    category: "Tasks",
  },
  {
    value: "tasks:delete",
    label: "Xóa task",
    description: "Gỡ bỏ task khi không còn phù hợp (cần quyền cẩn trọng).",
    category: "Tasks",
  },
  {
    value: "tasks:view_team",
    label: "Xem task phòng ban",
    description: "Xem toàn bộ task thuộc phòng ban để hỗ trợ điều phối.",
    category: "Tasks",
  },
  {
    value: "tasks:review",
    label: "Duyệt kết quả task",
    description: "Được phép duyệt / từ chối kết quả bàn giao của task.",
    category: "Tasks",
  },
  {
    value: "reports:export",
    label: "Export báo cáo",
    description: "Download và chia sẻ báo cáo dạng Excel/PDF.",
    category: "Reports",
  },
  {
    value: "reports:view",
    label: "Xem báo cáo",
    description: "Truy cập dashboard và báo cáo tổng hợp hiệu suất.",
    category: "Reports",
  },
  {
    value: "users:manage",
    label: "Quản lý người dùng",
    description: "Tạo, chỉnh sửa hoặc vô hiệu hóa tài khoản khác.",
    category: "Users",
  },
  {
    value: "users:view_team",
    label: "Xem thành viên phòng ban",
    description: "Xem danh sách và thông tin nhân sự trong phòng ban để điều phối.",
    category: "Users",
  },
  {
    value: "teams:manage",
    label: "Quản lý phòng ban",
    description: "Tạo/sửa phòng ban, cấu hình định mức và thành viên.",
    category: "Admin",
  },
  {
    value: "templates:manage",
    label: "Quản lý template",
    description: "Tạo và cập nhật catalog template dùng chung.",
    category: "Admin",
  },
  {
    value: "configuration:manage",
    label: "Quản lý cấu hình",
    description: "Điều chỉnh cài đặt chung như SLA, quy trình, automation.",
    category: "Admin",
  },
  {
    value: "catalog:sync",
    label: "Đồng bộ catalog",
    description: "Đẩy / lấy dữ liệu catalog marketing từ nguồn ngoài.",
    category: "Catalog",
  },
  {
    value: "catalog:update_deadline",
    label: "Cập nhật deadline catalog",
    description: "Chỉnh sửa quy tắc deadline tự động của từng template.",
    category: "Catalog",
  },
  {
    value: "gamification:view",
    label: "Xem dashboard gamification",
    description: "Truy cập số liệu streak, leaderboard của toàn công ty.",
    category: "Gamification",
  },
  {
    value: "gamification:manage",
    label: "Quản lý gamification",
    description: "Điều chỉnh thành tích, badge, điểm thưởng.",
    category: "Gamification",
  },
  {
    value: "notifications:send",
    label: "Gửi thông báo",
    description: "Tạo thông báo hệ thống cho cả team hoặc toàn công ty.",
    category: "Notifications",
  },
  {
    value: "notifications:manage_templates",
    label: "Quản lý mẫu thông báo",
    description: "Tùy chỉnh nội dung & lịch gửi thông báo tự động.",
    category: "Notifications",
  },
  {
    value: "automation:manage",
    label: "Quản lý automation",
    description: "Tạo và điều chỉnh rule tự động (assign, escalations, reminders).",
    category: "Automation",
  },
];
