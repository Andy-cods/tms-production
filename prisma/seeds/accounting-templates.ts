// @ts-nocheck
import { PrismaClient, Priority } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedAccountingTemplates() {
  console.log("🌱 Seeding Accounting templates...");

  // Get admin user for createdBy
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!admin) {
    console.log("❌ Admin user not found. Skipping Accounting templates seed.");
    return;
  }

  // Get Finance team (Accounting is part of Finance)
  // Also check for "Phòng Kế toán" as it might be separate
  let financeTeam = await prisma.team.findFirst({
    where: { 
      OR: [
        { name: "Finance" },
        { name: "Phòng Tài chính" },
        { name: { contains: "Tài chính", mode: "insensitive" } }
      ]
    },
  });
  
  // If not found, try "Phòng Kế toán"
  if (!financeTeam) {
    financeTeam = await prisma.team.findFirst({
      where: { 
        OR: [
          { name: "Phòng Kế toán" },
          { name: { contains: "Kế toán", mode: "insensitive" } }
        ]
      },
    });
  }

  // Get or create Accounting category
  let accountingCategory = await prisma.category.findFirst({
    where: { name: { contains: "Kế toán", mode: "insensitive" } },
  });

  if (!accountingCategory && financeTeam) {
    accountingCategory = await prisma.category.create({
      data: {
        name: "Kế toán",
        description: "Các công việc liên quan đến kế toán, đối soát giao dịch, tổng hợp doanh thu và chi phí",
        teamId: financeTeam.id,
        estimatedDuration: 24,
      },
    });
  }

  // ============================================
  // 1. TKQC INVOICE - Phối hợp nội bộ
  // ============================================

  const template1 = await prisma.taskTemplate.upsert({
    where: { id: "accounting-template-1" },
    update: {},
    create: {
      id: "accounting-template-1",
      name: "TKQC INVOICE - Đối soát ngân sách và cập nhật giao dịch",
      description: "Đối soát ngân sách khả dụng còn lại trong ví của công ty tại các đầu đối tác đang hợp tác. Cập nhật các giao dịch chuyển sang các đối tác trong ngày",
      icon: "💼",
      defaultTitle: "TKQC INVOICE - Đối soát ngân sách và cập nhật giao dịch",
      defaultDescription: "Đối soát ngân sách khả dụng còn lại trong ví của công ty tại các đầu đối tác đang hợp tác. Cập nhật các giao dịch chuyển sang các đối tác trong ngày. Update lên file đối tác các giao dịch chuyển tiền",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: accountingCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Đối soát ngân sách khả dụng còn lại trong ví",
            description: "Đối soát ngân sách khả dụng còn lại trong ví của công ty tại các đầu đối tác đang hợp tác",
            order: 0,
            estimatedHours: 1,
          },
          {
            title: "Cập nhật giao dịch chuyển sang đối tác",
            description: "Cập nhật các giao dịch chuyển sang các đối tác trong ngày. Update lên file đối tác các giao dịch chuyển tiền",
            order: 1,
            estimatedHours: 0.75,
          },
        ],
      },
    },
  });

  console.log("✅ Accounting Template 1 created");

  const template2 = await prisma.taskTemplate.upsert({
    where: { id: "accounting-template-2" },
    update: {},
    create: {
      id: "accounting-template-2",
      name: "TKQC INVOICE - Check số dư ví và update giao dịch",
      description: "Check số dư ví ở các tài khoản của công ty. Update toàn bộ giao dịch phát sinh theo ngày vào file kế toán",
      icon: "💰",
      defaultTitle: "TKQC INVOICE - Check số dư ví và update giao dịch",
      defaultDescription: "Check số dư ví ở các tài khoản của công ty. Update toàn bộ giao dịch phát sinh theo ngày vào file kế toán. Đối chiếu số liệu với các file lẻ từ bộ phận CSKH & Kinh Doanh",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: accountingCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Check số dư ví ở các tài khoản công ty",
            description: "Check số dư ví ở các tài khoản của công ty",
            order: 0,
            estimatedHours: 0.5,
          },
          {
            title: "Update giao dịch phát sinh theo ngày vào file kế toán",
            description: "Update toàn bộ giao dịch phát sinh theo ngày vào file kế toán. Đối chiếu số liệu với các file lẻ từ bộ phận CSKH & Kinh Doanh",
            order: 1,
            estimatedHours: 1.5,
          },
        ],
      },
    },
  });

  console.log("✅ Accounting Template 2 created");

  const template3 = await prisma.taskTemplate.upsert({
    where: { id: "accounting-template-3" },
    update: {},
    create: {
      id: "accounting-template-3",
      name: "TKQC INVOICE - Xử lý Refund và thu phí QLTK",
      description: "Check file Refund hàng ngày để xử lý đúng hạn. Check & yêu cầu thu phí QLTK với các NVKD",
      icon: "🔄",
      defaultTitle: "TKQC INVOICE - Xử lý Refund và thu phí QLTK",
      defaultDescription: "Check file Refund hàng ngày để xử lý đúng hạn nếu không có phát sinh đặc biệt. Check & yêu cầu thu phí QLTK với các NVKD",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: accountingCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Check file Refund hàng ngày",
            description: "Check file Refund hàng ngày để xử lý đúng hạn nếu không có phát sinh đặc biệt",
            order: 0,
            estimatedHours: 0.5,
          },
          {
            title: "Check & yêu cầu thu phí QLTK",
            description: "Check & yêu cầu thu phí QLTK với các NVKD",
            order: 1,
            estimatedHours: 0.5,
          },
        ],
      },
    },
  });

  console.log("✅ Accounting Template 3 created");

  // ============================================
  // 2. TKQC INVOICE - Tương tác khách hàng
  // ============================================

  const template4 = await prisma.taskTemplate.upsert({
    where: { id: "accounting-template-4" },
    update: {},
    create: {
      id: "accounting-template-4",
      name: "TKQC INVOICE - Rà soát và xác nhận giao dịch với khách hàng",
      description: "Rà soát, kiểm tra và xác nhận các khoản giao dịch phát sinh mới, refund... trong các nhóm Khách Hàng",
      icon: "👥",
      defaultTitle: "TKQC INVOICE - Rà soát và xác nhận giao dịch với khách hàng",
      defaultDescription: "Rà soát, kiểm tra và xác nhận các khoản giao dịch phát sinh mới, refund... trong các nhóm Khách Hàng. Cập nhật trạng thái xác nhận lên các file lẻ chung",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: accountingCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Rà soát và kiểm tra giao dịch phát sinh mới",
            description: "Rà soát, kiểm tra các khoản giao dịch phát sinh mới, refund... trong các nhóm Khách Hàng",
            order: 0,
            estimatedHours: 0.75,
          },
          {
            title: "Xác nhận và cập nhật trạng thái",
            description: "Xác nhận giao dịch và cập nhật trạng thái xác nhận lên các file lẻ chung",
            order: 1,
            estimatedHours: 0.25,
          },
        ],
      },
    },
  });

  console.log("✅ Accounting Template 4 created");

  // ============================================
  // 3. TKQC TK Nolimit - Phối hợp nội bộ
  // ============================================

  const template5 = await prisma.taskTemplate.upsert({
    where: { id: "accounting-template-5" },
    update: {},
    create: {
      id: "accounting-template-5",
      name: "TKQC TK Nolimit - Update giao dịch và xử lý Refund",
      description: "Update toàn bộ giao dịch phát sinh theo ngày vào file kế toán. Check file Refund hàng ngày",
      icon: "💼",
      defaultTitle: "TKQC TK Nolimit - Update giao dịch và xử lý Refund",
      defaultDescription: "Update toàn bộ giao dịch phát sinh theo ngày vào file kế toán. Đối chiếu số liệu với các file lẻ từ bộ phận CSKH & Kinh Doanh. Check file Refund hàng ngày để xử lý đúng hạn nếu không có phát sinh đặc biệt",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: accountingCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Update giao dịch phát sinh theo ngày",
            description: "Update toàn bộ giao dịch phát sinh theo ngày vào file kế toán. Đối chiếu số liệu với các file lẻ từ bộ phận CSKH & Kinh Doanh",
            order: 0,
            estimatedHours: 1.5,
          },
          {
            title: "Check file Refund hàng ngày",
            description: "Check file Refund hàng ngày để xử lý đúng hạn nếu không có phát sinh đặc biệt",
            order: 1,
            estimatedHours: 0.5,
          },
        ],
      },
    },
  });

  console.log("✅ Accounting Template 5 created");

  // ============================================
  // 4. TKQC TK Nolimit - Tương tác khách hàng
  // ============================================

  const template6 = await prisma.taskTemplate.upsert({
    where: { id: "accounting-template-6" },
    update: {},
    create: {
      id: "accounting-template-6",
      name: "TKQC TK Nolimit - Rà soát và xác nhận giao dịch với khách hàng",
      description: "Rà soát, kiểm tra và xác nhận các khoản giao dịch phát sinh mới, refund... trong các nhóm Khách Hàng",
      icon: "👥",
      defaultTitle: "TKQC TK Nolimit - Rà soát và xác nhận giao dịch với khách hàng",
      defaultDescription: "Rà soát, kiểm tra và xác nhận các khoản giao dịch phát sinh mới, refund... trong các nhóm Khách Hàng. Cập nhật trạng thái xác nhận lên các file lẻ chung",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: accountingCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Rà soát và kiểm tra giao dịch phát sinh mới",
            description: "Rà soát, kiểm tra các khoản giao dịch phát sinh mới, refund... trong các nhóm Khách Hàng",
            order: 0,
            estimatedHours: 0.75,
          },
          {
            title: "Xác nhận và cập nhật trạng thái",
            description: "Xác nhận giao dịch và cập nhật trạng thái xác nhận lên các file lẻ chung",
            order: 1,
            estimatedHours: 0.25,
          },
        ],
      },
    },
  });

  console.log("✅ Accounting Template 6 created");

  // ============================================
  // 5. Mảng Nguyên liệu ADS - Phối hợp nội bộ
  // ============================================

  const template7 = await prisma.taskTemplate.upsert({
    where: { id: "accounting-template-7" },
    update: {},
    create: {
      id: "accounting-template-7",
      name: "Mảng Nguyên liệu ADS - Kiểm tra đặt hàng và update giao dịch",
      description: "Kiểm tra và xác nhận giao dịch trên file đặt hàng chung. Update toàn bộ giao dịch phát sinh theo ngày vào file kế toán",
      icon: "📦",
      defaultTitle: "Mảng Nguyên liệu ADS - Kiểm tra đặt hàng và update giao dịch",
      defaultDescription: "Kiểm tra và xác nhận giao dịch trên file đặt hàng chung. Update toàn bộ giao dịch phát sinh theo ngày vào file kế toán. Đối chiếu số liệu với các file lẻ từ bộ phận CSKH & Kinh Doanh",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: accountingCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Kiểm tra và xác nhận giao dịch trên file đặt hàng chung",
            description: "Kiểm tra và xác nhận giao dịch trên file đặt hàng chung",
            order: 0,
            estimatedHours: 0.75,
          },
          {
            title: "Update giao dịch phát sinh theo ngày",
            description: "Update toàn bộ giao dịch phát sinh theo ngày vào file kế toán. Đối chiếu số liệu với các file lẻ từ bộ phận CSKH & Kinh Doanh",
            order: 1,
            estimatedHours: 1.5,
          },
        ],
      },
    },
  });

  console.log("✅ Accounting Template 7 created");

  const template8 = await prisma.taskTemplate.upsert({
    where: { id: "accounting-template-8" },
    update: {},
    create: {
      id: "accounting-template-8",
      name: "Mảng Nguyên liệu ADS - Xử lý Refund và theo dõi công nợ",
      description: "Check file Refund hàng ngày. Cập nhật giao dịch mua hàng nguyên liệu ADS từ các đầu đối tác, theo dõi công nợ và check thanh toán",
      icon: "📦",
      defaultTitle: "Mảng Nguyên liệu ADS - Xử lý Refund và theo dõi công nợ",
      defaultDescription: "Check file Refund hàng ngày để xử lý đúng hạn nếu không có phát sinh đặc biệt. Cập nhật giao dịch mua hàng nguyên liệu ADS từ các đầu đối tác, theo dõi công nợ và check thanh toán",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: accountingCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Check file Refund hàng ngày",
            description: "Check file Refund hàng ngày để xử lý đúng hạn nếu không có phát sinh đặc biệt",
            order: 0,
            estimatedHours: 0.5,
          },
          {
            title: "Cập nhật giao dịch mua hàng và theo dõi công nợ",
            description: "Cập nhật giao dịch mua hàng nguyên liệu ADS từ các đầu đối tác, theo dõi công nợ và check thanh toán",
            order: 1,
            estimatedHours: 1,
          },
        ],
      },
    },
  });

  console.log("✅ Accounting Template 8 created");

  // ============================================
  // 6. Đối soát giao dịch
  // ============================================

  const template9 = await prisma.taskTemplate.upsert({
    where: { id: "accounting-template-9" },
    update: {},
    create: {
      id: "accounting-template-9",
      name: "Đối soát giao dịch theo ngày",
      description: "Đối soát giao dịch theo ngày và tổng hợp báo cáo, nhập file theo dõi",
      icon: "🔍",
      defaultTitle: "Đối soát giao dịch theo ngày",
      defaultDescription: "Đối soát giao dịch theo ngày. Tổng hợp báo cáo và nhập file theo dõi",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: accountingCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Đối soát giao dịch theo ngày",
            description: "Đối soát giao dịch theo ngày",
            order: 0,
            estimatedHours: 2,
          },
          {
            title: "Tổng hợp báo cáo và nhập file theo dõi",
            description: "Tổng hợp báo cáo và nhập file theo dõi",
            order: 1,
            estimatedHours: 1.5,
          },
        ],
      },
    },
  });

  console.log("✅ Accounting Template 9 created");

  // ============================================
  // 7. Tổng hợp doanh thu
  // ============================================

  const template10 = await prisma.taskTemplate.upsert({
    where: { id: "accounting-template-10" },
    update: {},
    create: {
      id: "accounting-template-10",
      name: "Tổng hợp doanh thu - Thống kê doanh số và rebate",
      description: "Thống kê doanh số các mảng. Thống kê và đối khoản rebate dự kiến và phân bổ vào các tháng",
      icon: "📈",
      defaultTitle: "Tổng hợp doanh thu - Thống kê doanh số và rebate",
      defaultDescription: "Thống kê doanh số các mảng. Thống kê và đối khoản rebate dự kiến và phân bổ vào các tháng (Cần làm thêm file thống kê tự động)",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: accountingCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Thống kê doanh số các mảng",
            description: "Thống kê doanh số các mảng",
            order: 0,
            estimatedHours: 3,
          },
          {
            title: "Thống kê và đối khoản rebate dự kiến",
            description: "Thống kê và đối khoản rebate dự kiến và phân bổ vào các tháng (Cần làm thêm file thống kê tự động)",
            order: 1,
            estimatedHours: 4,
          },
        ],
      },
    },
  });

  console.log("✅ Accounting Template 10 created");

  // ============================================
  // 8. Tổng hợp chi phí
  // ============================================

  const template11 = await prisma.taskTemplate.upsert({
    where: { id: "accounting-template-11" },
    update: {},
    create: {
      id: "accounting-template-11",
      name: "Tổng hợp chi phí - Chi phí lớn dài hạn và marketing",
      description: "Tổng hợp và phân bố các chi phí lớn dài hạn. Tổng hợp chi phí marketing",
      icon: "💰",
      defaultTitle: "Tổng hợp chi phí - Chi phí lớn dài hạn và marketing",
      defaultDescription: "Tổng hợp và phân bố các chi phí lớn dài hạn: chuyển tiền sang nước ngoài và văn phòng đại diện, chi phí du lịch, mua máy móc thiết bị... Tổng hợp chi phí marketing (lấy số liệu từ MKT)",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: accountingCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Tổng hợp và phân bố các chi phí lớn dài hạn",
            description: "Tổng hợp và phân bố các chi phí lớn dài hạn: chuyển tiền sang nước ngoài và văn phòng đại diện, chi phí du lịch, mua máy móc thiết bị...",
            order: 0,
            estimatedHours: 3,
          },
          {
            title: "Tổng hợp chi phí marketing",
            description: "Tổng hợp chi phí marketing (lấy số liệu từ MKT)",
            order: 1,
            estimatedHours: 1.5,
          },
        ],
      },
    },
  });

  console.log("✅ Accounting Template 11 created");

  const template12 = await prisma.taskTemplate.upsert({
    where: { id: "accounting-template-12" },
    update: {},
    create: {
      id: "accounting-template-12",
      name: "Tổng hợp chi phí - Nguyên liệu và hoa hồng",
      description: "Tổng hợp chi phí nhập nguyên liệu. Check thống kê chi tiêu thực tế để trả hoa hồng",
      icon: "💰",
      defaultTitle: "Tổng hợp chi phí - Nguyên liệu và hoa hồng",
      defaultDescription: "Tổng hợp chi phí nhập nguyên liệu: BM2500, BM350... (Ms. An tạo file tự động đối chiếu chi phí NVL). Check thống kê chi tiêu thực tế từ tất cả KH để trả hoa hồng cho CTV, đại lý hoặc cashback cho KH",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: accountingCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Tổng hợp chi phí nhập nguyên liệu",
            description: "Tổng hợp chi phí nhập nguyên liệu: BM2500, BM350... (Ms. An tạo file tự động đối chiếu chi phí NVL)",
            order: 0,
            estimatedHours: 2,
          },
          {
            title: "Check thống kê chi tiêu thực tế để trả hoa hồng",
            description: "Check thống kê chi tiêu thực tế từ tất cả KH để trả hoa hồng cho CTV, đại lý hoặc cashback cho KH",
            order: 1,
            estimatedHours: 2.5,
          },
        ],
      },
    },
  });

  console.log("✅ Accounting Template 12 created");

  // ============================================
  // 9. Nội bộ - Báo cáo doanh thu
  // ============================================

  const template13 = await prisma.taskTemplate.upsert({
    where: { id: "accounting-template-13" },
    update: {},
    create: {
      id: "accounting-template-13",
      name: "Nội bộ - Báo cáo kết quả kinh doanh",
      description: "Báo cáo kết quả kinh doanh từng mảng và tổng (Chi phí, doanh thu, lỗ lãi...)",
      icon: "📊",
      defaultTitle: "Nội bộ - Báo cáo kết quả kinh doanh",
      defaultDescription: "BÁO CÁO CHUNG: KẾT QUẢ KINH DOANH TỪNG MẢNG (Chi phí, doanh thu, lỗ lãi...). KẾT QUẢ KINH DOANH TỔNG",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: accountingCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Báo cáo kết quả kinh doanh từng mảng",
            description: "KẾT QUẢ KINH DOANH TỪNG MẢNG (Chi phí, doanh thu, lỗ lãi...)",
            order: 0,
            estimatedHours: 4,
          },
          {
            title: "Báo cáo kết quả kinh doanh tổng",
            description: "KẾT QUẢ KINH DOANH TỔNG",
            order: 1,
            estimatedHours: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Accounting Template 13 created");

  // ============================================
  // 10. Nội bộ - Tổng hợp số liệu tính lương
  // ============================================

  const template14 = await prisma.taskTemplate.upsert({
    where: { id: "accounting-template-14" },
    update: {},
    create: {
      id: "accounting-template-14",
      name: "Nội bộ - Tổng hợp số liệu tính lương",
      description: "Tổng hợp số liệu tính lương",
      icon: "💵",
      defaultTitle: "Nội bộ - Tổng hợp số liệu tính lương",
      defaultDescription: "Tổng hợp số liệu tính lương",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: accountingCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Tổng hợp số liệu tính lương",
            description: "Tổng hợp số liệu tính lương",
            order: 0,
            estimatedHours: 5,
          },
        ],
      },
    },
  });

  console.log("✅ Accounting Template 14 created");

  // ============================================
  // 11. Nội bộ - Thuế
  // ============================================

  const template15 = await prisma.taskTemplate.upsert({
    where: { id: "accounting-template-15" },
    update: {},
    create: {
      id: "accounting-template-15",
      name: "Nội bộ - Tập hợp hồ sơ và nộp báo cáo thuế",
      description: "Tập hợp hồ sơ chứng từ thuế (hoá đơn chứng từ đi kèm). Lập và nộp báo cáo thuế",
      icon: "📋",
      defaultTitle: "Nội bộ - Tập hợp hồ sơ và nộp báo cáo thuế",
      defaultDescription: "Tập hợp hồ sơ chứng từ thuế (hoá đơn chứng từ đi kèm). Lập và nộp báo cáo thuế",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: accountingCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Tập hợp hồ sơ chứng từ thuế",
            description: "Tập hợp hồ sơ chứng từ thuế (hoá đơn chứng từ đi kèm)",
            order: 0,
            estimatedHours: 3,
          },
          {
            title: "Lập và nộp báo cáo thuế",
            description: "Lập và nộp báo cáo thuế",
            order: 1,
            estimatedHours: 4,
          },
        ],
      },
    },
  });

  console.log("✅ Accounting Template 15 created");

  console.log("✅ All Accounting templates seeded successfully");
}

