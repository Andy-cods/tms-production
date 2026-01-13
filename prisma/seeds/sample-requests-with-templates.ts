// @ts-nocheck
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedSampleRequestsWithTemplates() {
  console.log("🌱 Seeding sample requests with templates...");

  // Get users
  const staff = await prisma.user.findFirst({
    where: { role: Role.STAFF },
  });

  if (!staff) {
    console.log("❌ Staff user not found");
    return;
  }

  // Get templates
  const bugTemplate = await prisma.requestTemplate.findUnique({
    where: { id: "template-bug-report" },
    include: { fields: true },
  });

  const featureTemplate = await prisma.requestTemplate.findUnique({
    where: { id: "template-feature-request" },
    include: { fields: true },
  });

  if (!bugTemplate || !featureTemplate) {
    console.log("❌ Templates not found. Please run template seed first.");
    return;
  }

  // Sample Bug Report 1
  const bugRequest1 = await prisma.request.create({
    data: {
      title: "Login page crashes on Safari 17",
      description:
        "Users báo cáo không thể login trên Safari 17. Trang bị crash ngay khi click nút Login.",
      priority: "HIGH",
      status: "OPEN",
      categoryId: bugTemplate.categoryId!,
      creatorId: staff.id,
      templateId: bugTemplate.id,
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 days
    },
  });

  // Create custom field values for bug report
  await prisma.customFieldValue.createMany({
    data: [
      {
        fieldId: bugTemplate.fields.find((f) => f.name === "severity")!.id,
        requestId: bugRequest1.id,
        value: "High",
      },
      {
        fieldId: bugTemplate.fields.find((f) => f.name === "environment")!
          .id,
        requestId: bugRequest1.id,
        value: "Production",
      },
      {
        fieldId: bugTemplate.fields.find((f) => f.name === "browser")!.id,
        requestId: bugRequest1.id,
        value: ["Safari"],
      },
      {
        fieldId: bugTemplate.fields.find(
          (f) => f.name === "steps_to_reproduce"
        )!.id,
        requestId: bugRequest1.id,
        value:
          "1. Mở Safari 17\n2. Truy cập /login\n3. Nhập email + password\n4. Click nút 'Đăng nhập'\n5. Trang bị crash",
      },
      {
        fieldId: bugTemplate.fields.find(
          (f) => f.name === "expected_result"
        )!.id,
        requestId: bugRequest1.id,
        value: "User được redirect đến dashboard sau khi login thành công",
      },
      {
        fieldId: bugTemplate.fields.find((f) => f.name === "actual_result")!
          .id,
        requestId: bugRequest1.id,
        value: "Trang bị crash, hiển thị 'A problem occurred with this webpage'",
      },
      {
        fieldId: bugTemplate.fields.find((f) => f.name === "reproducible")!
          .id,
        requestId: bugRequest1.id,
        value: true,
      },
      {
        fieldId: bugTemplate.fields.find((f) => f.name === "frequency")!.id,
        requestId: bugRequest1.id,
        value: "Always (100%)",
      },
      {
        fieldId: bugTemplate.fields.find(
          (f) => f.name === "affected_users"
        )!.id,
        requestId: bugRequest1.id,
        value: 50,
      },
    ],
  });

  console.log("✅ Sample bug report created");

  // Sample Feature Request 1
  const featureRequest1 = await prisma.request.create({
    data: {
      title: "Dark Mode Support",
      description:
        "Thêm chế độ dark mode cho toàn bộ app. Users đã request nhiều lần.",
      priority: "MEDIUM",
      status: "OPEN",
      categoryId: featureTemplate.categoryId!,
      creatorId: staff.id,
      templateId: featureTemplate.id,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 days
    },
  });

  await prisma.customFieldValue.createMany({
    data: [
      {
        fieldId: featureTemplate.fields.find(
          (f) => f.name === "feature_name"
        )!.id,
        requestId: featureRequest1.id,
        value: "Dark Mode UI Theme",
      },
      {
        fieldId: featureTemplate.fields.find(
          (f) => f.name === "problem_statement"
        )!.id,
        requestId: featureRequest1.id,
        value:
          "Hiện tại app chỉ có light theme. Users làm việc ban đêm hoặc trong môi trường thiếu ánh sáng gặp khó khăn do giao diện quá sáng gây mỏi mắt.",
      },
      {
        fieldId: featureTemplate.fields.find(
          (f) => f.name === "proposed_solution"
        )!.id,
        requestId: featureRequest1.id,
        value:
          "Thêm toggle switch trong Settings cho phép users chọn Light/Dark/Auto mode. Auto mode sẽ follow system preference.",
      },
      {
        fieldId: featureTemplate.fields.find(
          (f) => f.name === "target_users"
        )!.id,
        requestId: featureRequest1.id,
        value: ["All Users"],
      },
      {
        fieldId: featureTemplate.fields.find(
          (f) => f.name === "business_impact"
        )!.id,
        requestId: featureRequest1.id,
        value: "Medium - Cải thiện retention",
      },
      {
        fieldId: featureTemplate.fields.find(
          (f) => f.name === "estimated_users"
        )!.id,
        requestId: featureRequest1.id,
        value: 5000,
      },
    ],
  });

  console.log("✅ Sample feature request created");

  console.log("✅ Sample requests with templates seeded");
}

