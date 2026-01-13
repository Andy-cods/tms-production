// @ts-nocheck
import { PrismaClient, Priority } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedBusinessTemplates() {
  console.log("🌱 Seeding Business templates...");

  // Get admin user for createdBy
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!admin) {
    console.log("❌ Admin user not found. Skipping Business templates seed.");
    return;
  }

  // Get Business team (Phòng Kinh doanh)
  const businessTeam = await prisma.team.findFirst({
    where: { 
      OR: [
        { name: "Phòng Kinh doanh" },
        { name: { contains: "Kinh doanh", mode: "insensitive" } }
      ]
    },
  });

  if (!businessTeam) {
    console.log("❌ Business team (Phòng Kinh doanh) not found. Skipping Business templates seed.");
    return;
  }

  // Get or create Business category
  let businessCategory = await prisma.category.findFirst({
    where: { 
      name: { contains: "Kinh doanh", mode: "insensitive" },
      teamId: businessTeam.id
    },
  });

  if (!businessCategory) {
    businessCategory = await prisma.category.create({
      data: {
        name: "Kinh doanh - Kế hoạch kinh doanh",
        description: "Các công việc liên quan đến kế hoạch kinh doanh và quản trị hệ thống",
        teamId: businessTeam.id,
        estimatedDuration: 24,
      },
    });
  }

  // ============================================
  // 1. KẾ HOẠCH KINH DOANH
  // ============================================

  const template1 = await prisma.taskTemplate.upsert({
    where: { id: "business-template-1" },
    update: {},
    create: {
      id: "business-template-1",
      name: "Báo cáo phân tích thị trường, đối thủ",
      description: "Báo cáo phân tích thị trường, đối thủ cạnh tranh",
      icon: "📊",
      defaultTitle: "Báo cáo phân tích thị trường, đối thủ",
      defaultDescription: "Báo cáo phân tích thị trường, đối thủ cạnh tranh",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: businessCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Báo cáo phân tích thị trường, đối thủ",
            description: "Báo cáo phân tích thị trường, đối thủ cạnh tranh",
            order: 0,
            estimatedHours: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Business Template 1 created");

  const template2 = await prisma.taskTemplate.upsert({
    where: { id: "business-template-2" },
    update: {},
    create: {
      id: "business-template-2",
      name: "Lập kế hoạch kinh doanh, phân bố loại sản phẩm, khu vực",
      description: "Lập kế hoạch kinh doanh, phân bố loại sản phẩm, khu vực",
      icon: "📅",
      defaultTitle: "Lập kế hoạch kinh doanh, phân bố loại sản phẩm, khu vực",
      defaultDescription: "Lập kế hoạch kinh doanh, phân bố loại sản phẩm, khu vực",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: businessCategory?.id,
      estimatedDays: 2,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Lập kế hoạch kinh doanh, phân bố loại sản phẩm, khu vực",
            description: "Lập kế hoạch kinh doanh, phân bố loại sản phẩm, khu vực",
            order: 0,
            estimatedHours: 8,
          },
        ],
      },
    },
  });

  console.log("✅ Business Template 2 created");

  const template3 = await prisma.taskTemplate.upsert({
    where: { id: "business-template-3" },
    update: {},
    create: {
      id: "business-template-3",
      name: "Báo cáo kết quả kinh doanh theo các chỉ số",
      description: "Báo cáo kết quả kinh doanh theo các chỉ số: số khách hàng, tỷ lệ tăng trưởng, cơ cấu sản phẩm/doanh thu",
      icon: "📈",
      defaultTitle: "Báo cáo kết quả kinh doanh theo các chỉ số",
      defaultDescription: "Báo cáo kết quả kinh doanh theo các chỉ số: số khách hàng, tỷ lệ tăng trưởng, cơ cấu sản phẩm/doanh thu",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: businessCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Báo cáo kết quả kinh doanh theo các chỉ số",
            description: "Báo cáo kết quả kinh doanh theo các chỉ số: số khách hàng, tỷ lệ tăng trưởng, cơ cấu sản phẩm/doanh thu",
            order: 0,
            estimatedHours: 4,
          },
        ],
      },
    },
  });

  console.log("✅ Business Template 3 created");

  const template4 = await prisma.taskTemplate.upsert({
    where: { id: "business-template-4" },
    update: {},
    create: {
      id: "business-template-4",
      name: "Báo cáo tiến độ đạt KPI hàng tuần/tháng",
      description: "Báo cáo tiến độ đạt KPI hàng tuần/tháng",
      icon: "📊",
      defaultTitle: "Báo cáo tiến độ đạt KPI hàng tuần/tháng",
      defaultDescription: "Báo cáo tiến độ đạt KPI hàng tuần/tháng",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: businessCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Báo cáo tiến độ đạt KPI hàng tuần/tháng",
            description: "Báo cáo tiến độ đạt KPI hàng tuần/tháng",
            order: 0,
            estimatedHours: 2,
          },
        ],
      },
    },
  });

  console.log("✅ Business Template 4 created");

  const template5 = await prisma.taskTemplate.upsert({
    where: { id: "business-template-5" },
    update: {},
    create: {
      id: "business-template-5",
      name: "Đề xuất các giải pháp điều chỉnh kịp thời",
      description: "Đề xuất các giải pháp điều chỉnh kịp thời khi doanh số không đạt kế hoạch",
      icon: "💡",
      defaultTitle: "Đề xuất các giải pháp điều chỉnh kịp thời",
      defaultDescription: "Đề xuất các giải pháp điều chỉnh kịp thời khi doanh số không đạt kế hoạch",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: businessCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Đề xuất các giải pháp điều chỉnh kịp thời",
            description: "Đề xuất các giải pháp điều chỉnh kịp thời khi doanh số không đạt kế hoạch",
            order: 0,
            estimatedHours: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Business Template 5 created");

  // ============================================
  // 2. QUẢN TRỊ HỆ THỐNG KINH DOANH & VẬN HÀNH
  // ============================================

  const template6 = await prisma.taskTemplate.upsert({
    where: { id: "business-template-6" },
    update: {},
    create: {
      id: "business-template-6",
      name: "Báo cáo hoạt động vận hành kinh doanh",
      description: "Báo cáo hoạt động vận hành kinh doanh, kiểm soát chi phí bán hàng, ngân sách marketing, chính sách ưu đãi, tỷ lệ chuyển đổi khách hàng từ hoạt động MKT",
      icon: "⚙️",
      defaultTitle: "Báo cáo hoạt động vận hành kinh doanh",
      defaultDescription: "Báo cáo hoạt động vận hành kinh doanh, kiểm soát chi phí bán hàng, ngân sách marketing, chính sách ưu đãi, tỷ lệ chuyển đổi khách hàng từ hoạt động MKT",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: businessCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Báo cáo hoạt động vận hành kinh doanh",
            description: "Báo cáo hoạt động vận hành kinh doanh, kiểm soát chi phí bán hàng, ngân sách marketing, chính sách ưu đãi, tỷ lệ chuyển đổi khách hàng từ hoạt động MKT",
            order: 0,
            estimatedHours: 4,
          },
        ],
      },
    },
  });

  console.log("✅ Business Template 6 created");

  const template7 = await prisma.taskTemplate.upsert({
    where: { id: "business-template-7" },
    update: {},
    create: {
      id: "business-template-7",
      name: "Báo cáo dữ liệu tư vấn khách hàng",
      description: "Báo cáo dữ liệu tư vấn khách hàng, đảm bảo dữ liệu cập nhật, đầy đủ và chính xác",
      icon: "📋",
      defaultTitle: "Báo cáo dữ liệu tư vấn khách hàng",
      defaultDescription: "Báo cáo dữ liệu tư vấn khách hàng, đảm bảo dữ liệu cập nhật, đầy đủ và chính xác",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: businessCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Báo cáo dữ liệu tư vấn khách hàng",
            description: "Báo cáo dữ liệu tư vấn khách hàng, đảm bảo dữ liệu cập nhật, đầy đủ và chính xác",
            order: 0,
            estimatedHours: 2,
          },
        ],
      },
    },
  });

  console.log("✅ Business Template 7 created");

  console.log("✅ All Business templates seeded successfully");
}

