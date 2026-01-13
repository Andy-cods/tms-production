// @ts-nocheck
import { PrismaClient, FieldType } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedTemplates() {
  console.log("🌱 Seeding templates...");

  // Get admin user for createdBy
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!admin) {
    console.log("❌ Admin user not found. Skipping templates seed.");
    return;
  }

  // Get categories by ID (schema-safe)
  const devBackend = await prisma.category.findUnique({
    where: { id: "cat-dev-backend" },
  }) ?? (await prisma.category.findFirst({ where: { name: { contains: "Backend", mode: "insensitive" } } })) ?? undefined;

  const devFrontend = await prisma.category.findUnique({
    where: { id: "cat-dev-frontend" },
  }) ?? (await prisma.category.findFirst({ where: { name: { contains: "Frontend", mode: "insensitive" } } })) ?? undefined;

  const mktContent = await prisma.category.findUnique({
    where: { id: "cat-mkt-content" },
  }) ?? (await prisma.category.findFirst({ where: { name: { contains: "Content", mode: "insensitive" } } })) ?? undefined;

  // ============================================
  // 1. BUG REPORT TEMPLATE
  // ============================================

  const bugReportTemplate = await prisma.requestTemplate.upsert({
    where: { id: "template-bug-report" },
    update: {},
    create: {
      id: "template-bug-report",
      name: "Bug Report",
      description:
        "Template chuẩn cho việc báo cáo lỗi. Bao gồm các thông tin cần thiết để reproduce và fix bug nhanh chóng.",
      icon: "🐛",
      categoryId: devBackend?.id,
      isActive: true,
      isDefault: true,
      usageCount: 0,
      createdBy: admin.id,
      fields: {
        create: [
          // Severity
          {
            name: "severity",
            label: "Mức độ nghiêm trọng",
            description: "Đánh giá mức độ ảnh hưởng của bug",
            type: FieldType.SELECT,
            isRequired: true,
            options: ["Low", "Medium", "High", "Critical"],
            defaultValue: "Medium",
            order: 0,
          },
          // Environment
          {
            name: "environment",
            label: "Môi trường",
            description: "Bug xảy ra ở môi trường nào",
            type: FieldType.SELECT,
            isRequired: true,
            options: ["Development", "Staging", "Production"],
            defaultValue: "Production",
            order: 1,
          },
          // Browser/Platform
          {
            name: "browser",
            label: "Trình duyệt / Platform",
            description: "Bug xuất hiện trên browser/platform nào",
            type: FieldType.MULTISELECT,
            isRequired: false,
            options: [
              "Chrome",
              "Firefox",
              "Safari",
              "Edge",
              "Mobile - iOS",
              "Mobile - Android",
            ],
            order: 2,
          },
          // Steps to Reproduce
          {
            name: "steps_to_reproduce",
            label: "Các bước tái hiện",
            description: "Mô tả chi tiết từng bước để reproduce bug",
            type: FieldType.TEXTAREA,
            isRequired: true,
            minLength: 20,
            maxLength: 2000,
            placeholder:
              "1. Truy cập trang...\n2. Click vào nút...\n3. Nhập giá trị...\n4. Quan sát kết quả...",
            order: 3,
          },
          // Expected Result
          {
            name: "expected_result",
            label: "Kết quả mong đợi",
            description: "Hệ thống nên hoạt động như thế nào",
            type: FieldType.TEXTAREA,
            isRequired: true,
            minLength: 10,
            maxLength: 500,
            placeholder: "Mô tả kết quả đúng mong muốn...",
            order: 4,
          },
          // Actual Result
          {
            name: "actual_result",
            label: "Kết quả thực tế",
            description: "Điều gì đã xảy ra (bug)",
            type: FieldType.TEXTAREA,
            isRequired: true,
            minLength: 10,
            maxLength: 500,
            placeholder: "Mô tả bug/lỗi xảy ra...",
            order: 5,
          },
          // Error Message
          {
            name: "error_message",
            label: "Thông báo lỗi",
            description: "Copy/paste thông báo lỗi từ console hoặc UI",
            type: FieldType.TEXTAREA,
            isRequired: false,
            maxLength: 1000,
            placeholder: "Error: ...\n  at ...\n  ...",
            order: 6,
          },
          // Screenshot URL
          {
            name: "screenshot_url",
            label: "Link Screenshot",
            description: "Upload screenshot lên Imgur/Google Drive và paste link",
            type: FieldType.URL,
            isRequired: false,
            placeholder: "https://imgur.com/...",
            order: 7,
          },
          // Reproducible
          {
            name: "reproducible",
            label: "Có thể tái hiện liên tục?",
            description: "Bug có xảy ra 100% thời gian hay random?",
            type: FieldType.CHECKBOX,
            isRequired: false,
            order: 8,
          },
          // Frequency
          {
            name: "frequency",
            label: "Tần suất xảy ra",
            description: "Bug xảy ra bao nhiêu % thời gian",
            type: FieldType.SELECT,
            isRequired: false,
            options: ["Always (100%)", "Often (>50%)", "Sometimes", "Rare (<10%)"],
            order: 9,
          },
          // Affected Users
          {
            name: "affected_users",
            label: "Số lượng user bị ảnh hưởng (ước tính)",
            description: "Khoảng bao nhiêu user gặp bug này",
            type: FieldType.NUMBER,
            isRequired: false,
            minValue: 0,
            placeholder: "100",
            order: 10,
          },
          // First Occurrence
          {
            name: "first_occurrence",
            label: "Lần đầu phát hiện",
            description: "Bug bắt đầu xuất hiện từ khi nào",
            type: FieldType.DATE,
            isRequired: false,
            order: 11,
          },
          // Related Ticket URL
          {
            name: "related_ticket",
            label: "Link ticket/issue liên quan",
            description: "Nếu có tickets khác liên quan",
            type: FieldType.URL,
            isRequired: false,
            placeholder: "https://github.com/...",
            order: 12,
          },
        ],
      },
    },
  });

  console.log("✅ Bug Report template created");

  // ============================================
  // 2. FEATURE REQUEST TEMPLATE
  // ============================================

  const featureTemplate = await prisma.requestTemplate.upsert({
    where: { id: "template-feature-request" },
    update: {},
    create: {
      id: "template-feature-request",
      name: "Feature Request",
      description:
        "Template cho đề xuất tính năng mới. Giúp team hiểu rõ nhu cầu và use case.",
      icon: "✨",
      categoryId: devFrontend?.id,
      isActive: true,
      isDefault: true,
      usageCount: 0,
      createdBy: admin.id,
      fields: {
        create: [
          // Feature Name
          {
            name: "feature_name",
            label: "Tên tính năng",
            description: "Tên ngắn gọn cho tính năng",
            type: FieldType.TEXT,
            isRequired: true,
            minLength: 5,
            maxLength: 100,
            placeholder: "User Profile Customization",
            order: 0,
          },
          // Problem Statement
          {
            name: "problem_statement",
            label: "Vấn đề cần giải quyết",
            description: "Mô tả vấn đề hiện tại mà tính năng này sẽ giải quyết",
            type: FieldType.TEXTAREA,
            isRequired: true,
            minLength: 20,
            maxLength: 1000,
            placeholder:
              "Hiện tại users không thể...\nĐiều này gây khó khăn vì...",
            order: 1,
          },
          // Proposed Solution
          {
            name: "proposed_solution",
            label: "Giải pháp đề xuất",
            description: "Bạn hình dung tính năng sẽ hoạt động như thế nào",
            type: FieldType.TEXTAREA,
            isRequired: true,
            minLength: 20,
            maxLength: 1000,
            placeholder: "Thêm section mới cho phép users...",
            order: 2,
          },
          // Target Users
          {
            name: "target_users",
            label: "Đối tượng users",
            description: "Ai sẽ sử dụng tính năng này",
            type: FieldType.MULTISELECT,
            isRequired: true,
            options: [
              "All Users",
              "Free Users",
              "Premium Users",
              "Admin",
              "Internal Team",
            ],
            order: 3,
          },
          // Priority Justification
          {
            name: "priority_justification",
            label: "Lý do ưu tiên cao",
            description: "Tại sao feature này quan trọng",
            type: FieldType.TEXTAREA,
            isRequired: false,
            maxLength: 500,
            placeholder: "Feature này quan trọng vì...",
            order: 4,
          },
          // Business Impact
          {
            name: "business_impact",
            label: "Tác động kinh doanh",
            description: "Feature này ảnh hưởng thế nào đến business metrics",
            type: FieldType.SELECT,
            isRequired: false,
            options: [
              "High - Tăng revenue đáng kể",
              "Medium - Cải thiện retention",
              "Low - Nice to have",
            ],
            order: 5,
          },
          // Mockup URL
          {
            name: "mockup_url",
            label: "Link Mockup/Design",
            description: "Link Figma, screenshot thiết kế (nếu có)",
            type: FieldType.URL,
            isRequired: false,
            placeholder: "https://figma.com/...",
            order: 6,
          },
          // Estimated Users Affected
          {
            name: "estimated_users",
            label: "Số lượng users hưởng lợi (ước tính)",
            type: FieldType.NUMBER,
            isRequired: false,
            minValue: 0,
            placeholder: "10000",
            order: 7,
          },
        ],
      },
    },
  });

  console.log("✅ Feature Request template created");

  // ============================================
  // 3. CONTENT REQUEST TEMPLATE (Marketing)
  // ============================================

  const contentTemplate = await prisma.requestTemplate.upsert({
    where: { id: "template-content-request" },
    update: {},
    create: {
      id: "template-content-request",
      name: "Content Request",
      description:
        "Template cho yêu cầu tạo content (blog post, video, social post, etc.)",
      icon: "📝",
      categoryId: mktContent?.id,
      isActive: true,
      isDefault: true,
      usageCount: 0,
      createdBy: admin.id,
      fields: {
        create: [
          // Content Type
          {
            name: "content_type",
            label: "Loại content",
            type: FieldType.SELECT,
            isRequired: true,
            options: [
              "Blog Post",
              "Video Script",
              "Social Media Post",
              "Email Newsletter",
              "Landing Page",
            ],
            order: 0,
          },
          // Target Audience
          {
            name: "target_audience",
            label: "Đối tượng mục tiêu",
            description: "Content hướng đến ai",
            type: FieldType.TEXT,
            isRequired: true,
            minLength: 5,
            maxLength: 200,
            placeholder: "Developers, startup founders, etc.",
            order: 1,
          },
          // Content Goal
          {
            name: "content_goal",
            label: "Mục đích content",
            type: FieldType.SELECT,
            isRequired: true,
            options: [
              "Brand Awareness",
              "Lead Generation",
              "Education",
              "Product Announcement",
              "SEO",
            ],
            order: 2,
          },
          // Key Messages
          {
            name: "key_messages",
            label: "Thông điệp chính",
            description: "3-5 điểm chính cần truyền tải",
            type: FieldType.TEXTAREA,
            isRequired: true,
            minLength: 20,
            maxLength: 1000,
            placeholder: "- Message 1\n- Message 2\n- Message 3",
            order: 3,
          },
          // Tone
          {
            name: "tone",
            label: "Tone & Style",
            type: FieldType.SELECT,
            isRequired: true,
            options: [
              "Professional",
              "Casual/Friendly",
              "Technical",
              "Inspirational",
            ],
            order: 4,
          },
          // Publish Date
          {
            name: "publish_date",
            label: "Ngày publish mong muốn",
            type: FieldType.DATE,
            isRequired: false,
            order: 5,
          },
          // SEO Keywords
          {
            name: "seo_keywords",
            label: "SEO Keywords (nếu có)",
            type: FieldType.TEXT,
            isRequired: false,
            maxLength: 200,
            placeholder: "task management, productivity, collaboration",
            order: 6,
          },
          // Reference URLs
          {
            name: "reference_urls",
            label: "Links tham khảo",
            description: "Content tương tự hoặc nguồn tham khảo",
            type: FieldType.TEXTAREA,
            isRequired: false,
            maxLength: 500,
            placeholder: "https://example.com/article1\nhttps://...",
            order: 7,
          },
        ],
      },
    },
  });

  console.log("✅ Content Request template created");

  // ============================================
  // 4. GENERAL TASK TEMPLATE (Simple)
  // ============================================

  const generalTemplate = await prisma.requestTemplate.upsert({
    where: { id: "template-general-task" },
    update: {},
    create: {
      id: "template-general-task",
      name: "General Task",
      description: "Template đơn giản cho các task thông thường không cần nhiều thông tin chi tiết.",
      icon: "📋",
      isActive: true,
      isDefault: false,
      usageCount: 0,
      createdBy: admin.id,
      fields: {
        create: [
          // Task Type
          {
            name: "task_type",
            label: "Loại công việc",
            type: FieldType.SELECT,
            isRequired: true,
            options: [
              "Research",
              "Documentation",
              "Code Review",
              "Meeting",
              "Training",
              "Other",
            ],
            order: 0,
          },
          // Notes
          {
            name: "notes",
            label: "Ghi chú thêm",
            type: FieldType.TEXTAREA,
            isRequired: false,
            maxLength: 500,
            placeholder: "Thông tin bổ sung...",
            order: 1,
          },
          // Estimated Hours
          {
            name: "estimated_hours",
            label: "Ước tính thời gian (giờ)",
            type: FieldType.NUMBER,
            isRequired: false,
            minValue: 0.5,
            maxValue: 80,
            placeholder: "4",
            order: 2,
          },
          // Requires Review
          {
            name: "requires_review",
            label: "Cần review sau khi hoàn thành",
            type: FieldType.CHECKBOX,
            isRequired: false,
            order: 3,
          },
        ],
      },
    },
  });

  console.log("✅ General Task template created");

  console.log("✅ All templates seeded successfully");
}

