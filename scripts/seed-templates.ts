import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding default templates...\n");

  // Get first admin user
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!admin) {
    console.log("❌ No admin user found. Please create an admin first.");
    return;
  }

  // Get categories
  const categories = await prisma.category.findMany();
  const defaultCategory = categories[0];

  const templates = [
    {
      name: "Onboarding Nhân Viên Mới",
      description: "Quy trình đón nhân viên mới hoàn chỉnh từ ngày đầu tiên",
      icon: "👋",
      defaultTitle: "Onboarding cho {{name}}",
      defaultDescription:
        "Đón tiếp và hướng dẫn nhân viên mới {{name}} vào team {{team}}",
      defaultPriority: "HIGH",
      estimatedDays: 7,
      isPublic: true,
      checklistItems: [
        {
          title: "Tạo tài khoản email & hệ thống",
          description: "Email, Slack, Jira, GitLab, v.v.",
          order: 0,
        },
        {
          title: "Setup máy tính & phần mềm",
          description: "Cài đặt IDE, tools cần thiết",
          order: 1,
        },
        {
          title: "Giới thiệu với team",
          description: "Meeting với team members, giới thiệu dự án",
          order: 2,
        },
        {
          title: "Training cơ bản",
          description: "Quy trình làm việc, coding standards, git workflow",
          order: 3,
        },
        {
          title: "Giao task đầu tiên",
          description: "Task đơn giản để làm quen",
          order: 4,
        },
      ],
    },
    {
      name: "Deploy Production",
      description: "Checklist deploy lên production an toàn",
      icon: "🚀",
      defaultTitle: "Deploy {{version}} lên Production",
      defaultDescription: "Deploy version {{version}} - Release date: {{date}}",
      defaultPriority: "URGENT",
      estimatedDays: 1,
      isPublic: true,
      checklistItems: [
        {
          title: "Review code changes",
          description: "Đảm bảo tất cả code đã được review",
          order: 0,
        },
        {
          title: "Run tests",
          description: "Unit tests + Integration tests pass 100%",
          order: 1,
        },
        {
          title: "Backup database",
          description: "Backup DB trước khi deploy",
          order: 2,
        },
        {
          title: "Deploy to staging",
          description: "Test trên staging environment",
          order: 3,
        },
        {
          title: "Deploy to production",
          description: "Deploy thật lên production",
          order: 4,
        },
        {
          title: "Smoke test production",
          description: "Kiểm tra các tính năng chính hoạt động",
          order: 5,
        },
        {
          title: "Monitor logs & metrics",
          description: "Theo dõi 30 phút đầu sau deploy",
          order: 6,
        },
      ],
    },
    {
      name: "Bug Fix Workflow",
      description: "Quy trình fix bug chuẩn",
      icon: "🐛",
      defaultTitle: "Fix Bug: {{bug_title}}",
      defaultDescription: "Bug reported: {{bug_title}} - Priority: {{priority}}",
      defaultPriority: "HIGH",
      estimatedDays: 2,
      isPublic: true,
      checklistItems: [
        {
          title: "Reproduce bug",
          description: "Xác nhận bug và cách tái hiện",
          order: 0,
        },
        {
          title: "Identify root cause",
          description: "Tìm nguyên nhân gốc rễ",
          order: 1,
        },
        {
          title: "Write fix",
          description: "Code fix và test locally",
          order: 2,
        },
        {
          title: "Write unit tests",
          description: "Test case để prevent regression",
          order: 3,
        },
        {
          title: "Code review",
          description: "Submit PR và xin review",
          order: 4,
        },
        {
          title: "Deploy fix",
          description: "Deploy lên production",
          order: 5,
        },
        {
          title: "Verify fix",
          description: "Xác nhận bug đã được fix",
          order: 6,
        },
      ],
    },
    {
      name: "Monthly Report",
      description: "Báo cáo định kỳ hàng tháng",
      icon: "📊",
      defaultTitle: "Báo cáo tháng {{month}}",
      defaultDescription: "Báo cáo kết quả làm việc tháng {{month}}/{{year}}",
      defaultPriority: "MEDIUM",
      estimatedDays: 3,
      isPublic: true,
      checklistItems: [
        {
          title: "Thu thập dữ liệu",
          description: "Tasks completed, KPIs, metrics",
          order: 0,
        },
        {
          title: "Phân tích kết quả",
          description: "So sánh với tháng trước, trends",
          order: 1,
        },
        {
          title: "Tạo charts & visualizations",
          description: "Biểu đồ, bảng số liệu",
          order: 2,
        },
        {
          title: "Viết báo cáo",
          description: "Summary, highlights, issues",
          order: 3,
        },
        {
          title: "Review với leader",
          description: "Xin feedback trước khi gửi",
          order: 4,
        },
        {
          title: "Gửi báo cáo",
          description: "Email tới stakeholders",
          order: 5,
        },
      ],
    },
    {
      name: "Code Review Checklist",
      description: "Checklist khi review code của đồng nghiệp",
      icon: "🔍",
      defaultTitle: "Review PR: {{pr_title}}",
      defaultDescription: "Code review cho PR {{pr_number}} - {{author}}",
      defaultPriority: "MEDIUM",
      estimatedDays: 1,
      isPublic: true,
      checklistItems: [
        {
          title: "Đọc mô tả PR",
          description: "Hiểu rõ mục đích thay đổi",
          order: 0,
        },
        {
          title: "Kiểm tra logic",
          description: "Code logic đúng, không bug",
          order: 1,
        },
        {
          title: "Kiểm tra style",
          description: "Tuân thủ coding conventions",
          order: 2,
        },
        {
          title: "Kiểm tra tests",
          description: "Có đủ test cases, coverage tốt",
          order: 3,
        },
        {
          title: "Kiểm tra performance",
          description: "Không có bottleneck, query tối ưu",
          order: 4,
        },
        {
          title: "Kiểm tra security",
          description: "Không có lỗ hổng bảo mật",
          order: 5,
        },
        {
          title: "Comment feedback",
          description: "Ghi chú suggestions và approve/request changes",
          order: 6,
        },
      ],
    },
  ];

  for (const templateData of templates) {
    const existing = await prisma.taskTemplate.findFirst({
      where: { name: templateData.name },
    });

    if (existing) {
      console.log(`  ⏭️  ${templateData.icon} ${templateData.name} (already exists)`);
      continue;
    }

    const template = await prisma.taskTemplate.create({
      data: {
        name: templateData.name,
        description: templateData.description,
        icon: templateData.icon,
        defaultTitle: templateData.defaultTitle,
        defaultDescription: templateData.defaultDescription,
        defaultPriority: templateData.defaultPriority as any,
        defaultCategoryId: defaultCategory?.id,
        estimatedDays: templateData.estimatedDays,
        isPublic: templateData.isPublic,
        createdById: admin.id,
        checklistItems: {
          create: templateData.checklistItems,
        },
      },
    });

    console.log(`  ✅ ${templateData.icon} ${templateData.name}`);
  }

  console.log(`\n✨ Done seeding templates!`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

