// @ts-nocheck
import { PrismaClient, Priority } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedCustomerServiceTemplates() {
  console.log("🌱 Seeding Customer Service templates...");

  // Get admin user for createdBy
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!admin) {
    console.log("❌ Admin user not found. Skipping Customer Service templates seed.");
    return;
  }

  // Get or create Customer Service team
  let customerServiceTeam = await prisma.team.findFirst({
    where: { name: { contains: "Chăm sóc khách hàng", mode: "insensitive" } },
  });

  if (!customerServiceTeam) {
    customerServiceTeam = await prisma.team.create({
      data: {
        name: "Phòng Chăm sóc khách hàng",
        description: "Phòng Chăm sóc khách hàng - Quản lý nền tảng, vận hành và phát triển sản phẩm, dịch vụ",
        isActive: true,
      },
    });
  }

  // Get or create Customer Service category
  let customerServiceCategory = await prisma.category.findFirst({
    where: { name: { contains: "Chăm sóc khách hàng", mode: "insensitive" } },
  });

  if (!customerServiceCategory && customerServiceTeam) {
    customerServiceCategory = await prisma.category.create({
      data: {
        name: "Chăm sóc khách hàng",
        description: "Các công việc liên quan đến quản lý nền tảng, vận hành, đào tạo và báo cáo",
        teamId: customerServiceTeam.id,
        estimatedDuration: 24,
      },
    });
  }

  // ============================================
  // 1. Tiếp nhận thông tin khách hàng mới
  // ============================================

  const template1 = await prisma.taskTemplate.upsert({
    where: { id: "cs-template-1" },
    update: {},
    create: {
      id: "cs-template-1",
      name: "Tiếp nhận thông tin khách hàng mới",
      description: "Tiếp nhận thông tin khách từ Sale, hỗ trợ tư vấn và gửi hợp đồng",
      icon: "👋",
      defaultTitle: "Tiếp nhận thông tin khách hàng mới",
      defaultDescription: "Tiếp nhận thông tin khách từ Sale. Hỗ trợ tư vấn lại và giải đáp thêm cho KH về TKQC và các nghiệp vụ liên quan. Gửi hợp đồng tương ứng (nếu khách hàng yêu cầu).\n\nBộ phận phối hợp: Sale, Kế toán\nTư liệu làm việc: Kịch bản tư vấn KH\nKênh làm việc: Nhóm chung trên Telegram/Zalo/Wechat",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: customerServiceCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Tiếp nhận thông tin khách từ Sale",
            description: "Tiếp nhận và xác nhận thông tin khách hàng mới từ bộ phận Sale",
            order: 0,
            estimatedHours: 1,
          },
          {
            title: "Hỗ trợ tư vấn và giải đáp cho khách hàng",
            description: "Hỗ trợ tư vấn lại và giải đáp thêm cho KH về TKQC và các nghiệp vụ liên quan",
            order: 1,
            estimatedHours: 2,
          },
          {
            title: "Gửi hợp đồng tương ứng",
            description: "Gửi hợp đồng tương ứng (nếu khách hàng yêu cầu)",
            order: 2,
            estimatedHours: 1,
          },
        ],
      },
    },
  });

  console.log("✅ Customer Service Template 1 created");

  // ============================================
  // 2. Tạo file theo dõi chung cho khách hàng
  // ============================================

  const template2 = await prisma.taskTemplate.upsert({
    where: { id: "cs-template-2" },
    update: {},
    create: {
      id: "cs-template-2",
      name: "Tạo file theo dõi chung cho khách hàng",
      description: "Hoàn thiện các thông tin đã có vào file để các bộ phận liên quan theo dõi, đối soát",
      icon: "📁",
      defaultTitle: "Tạo file theo dõi chung cho khách hàng",
      defaultDescription: "Hoàn thiện các thông tin đã có vào file để các bộ phận liên quan theo dõi, đối soát trong quá trình làm việc với KH.\n\nBộ phận phối hợp: Không\nTư liệu làm việc: File mẫu KH lẻ\nKênh làm việc: Google Drive, Nhóm chung trên Telegram",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: customerServiceCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Tạo file theo dõi từ file mẫu",
            description: "Tạo file theo dõi mới dựa trên file mẫu KH lẻ",
            order: 0,
            estimatedHours: 1,
          },
          {
            title: "Hoàn thiện thông tin khách hàng vào file",
            description: "Nhập và hoàn thiện các thông tin đã có vào file để các bộ phận liên quan theo dõi, đối soát",
            order: 1,
            estimatedHours: 2,
          },
          {
            title: "Chia sẻ file trên Google Drive và nhóm Telegram",
            description: "Chia sẻ file trên Google Drive và thông báo trong nhóm chung trên Telegram",
            order: 2,
            estimatedHours: 0.5,
          },
        ],
      },
    },
  });

  console.log("✅ Customer Service Template 2 created");

  // ============================================
  // 3. Thu thập và xử lí thông tin mở TKQC
  // ============================================

  const template3 = await prisma.taskTemplate.upsert({
    where: { id: "cs-template-3" },
    update: {},
    create: {
      id: "cs-template-3",
      name: "Thu thập và xử lí thông tin mở TKQC",
      description: "Tiếp nhận thông tin domain/Fanpage/kênh Youtube/Email từ KH, báo cáo quản lí và gửi file lưu ý lỗi",
      icon: "📋",
      defaultTitle: "Thu thập và xử lí thông tin mở TKQC",
      defaultDescription: "Tiếp nhận thông tin domain/Fanpage/kênh Youtube/Email... từ KH để hoàn thiện vào file. Báo cáo với quản lí để phân công kĩ thuật phụ trách. Gửi file lưu ý các lỗi.\n\nBộ phận phối hợp: Quản lí Content\nTư liệu làm việc: File KH lẻ, File review domain, page\nKênh làm việc: Nhóm chung trên Telegram/Zalo/Wechat",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: customerServiceCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Tiếp nhận thông tin từ khách hàng",
            description: "Tiếp nhận thông tin domain/Fanpage/kênh Youtube/Email... từ KH",
            order: 0,
            estimatedHours: 1,
          },
          {
            title: "Hoàn thiện thông tin vào file KH lẻ",
            description: "Cập nhật thông tin đã nhận vào file KH lẻ",
            order: 1,
            estimatedHours: 1,
          },
          {
            title: "Báo cáo quản lí để phân công kĩ thuật",
            description: "Báo cáo với quản lí để phân công kĩ thuật phụ trách",
            order: 2,
            estimatedHours: 0.5,
          },
          {
            title: "Gửi file lưu ý các lỗi",
            description: "Gửi file review domain, page có lưu ý các lỗi cần xử lý",
            order: 3,
            estimatedHours: 1,
          },
        ],
      },
    },
  });

  console.log("✅ Customer Service Template 3 created");

  // ============================================
  // 4. Tiếp nhận domain và fanpage đạt yêu cầu
  // ============================================

  const template4 = await prisma.taskTemplate.upsert({
    where: { id: "cs-template-4" },
    update: {},
    create: {
      id: "cs-template-4",
      name: "Tiếp nhận domain và fanpage đạt yêu cầu",
      description: "Theo dõi tiến độ KH xử lí các lỗi, thúc đẩy và hỗ trợ để KH hoàn thiện sớm",
      icon: "✅",
      defaultTitle: "Tiếp nhận domain và fanpage đạt yêu cầu",
      defaultDescription: "Theo dõi tiến độ KH xử lí các lỗi cần sửa như yêu cầu của kĩ thuật, thúc đẩy và hỗ trợ để KH hoàn thiện sớm.\n\nBộ phận phối hợp: Content\nTư liệu làm việc: File KH lẻ\nKênh làm việc: Nhóm chung trên Telegram/Zalo/Wechat",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: customerServiceCategory?.id,
      estimatedDays: 2,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Theo dõi tiến độ xử lý lỗi của khách hàng",
            description: "Theo dõi tiến độ KH xử lí các lỗi cần sửa như yêu cầu của kĩ thuật",
            order: 0,
            estimatedHours: 1,
          },
          {
            title: "Thúc đẩy và hỗ trợ khách hàng",
            description: "Thúc đẩy và hỗ trợ để KH hoàn thiện sớm các yêu cầu",
            order: 1,
            estimatedHours: 2,
          },
          {
            title: "Xác nhận domain và fanpage đạt yêu cầu",
            description: "Kiểm tra và xác nhận domain và fanpage đã đạt yêu cầu kỹ thuật",
            order: 2,
            estimatedHours: 1,
          },
        ],
      },
    },
  });

  console.log("✅ Customer Service Template 4 created");

  // ============================================
  // 5. Chuẩn bị BR (đối với tài khoản HK)
  // ============================================

  const template5 = await prisma.taskTemplate.upsert({
    where: { id: "cs-template-5" },
    update: {},
    create: {
      id: "cs-template-5",
      name: "Chuẩn bị BR (đối với tài khoản HK)",
      description: "Tìm kiếm thông tin doanh nghiệp Trung Quốc và gửi nguyên liệu cho designer để tạo BR",
      icon: "🇭🇰",
      defaultTitle: "Chuẩn bị BR (đối với tài khoản HK)",
      defaultDescription: "Tìm kiếm thông tin doanh nghiệp Trung Quốc phù hợp với thông tin của KH. Gửi các nguyên liệu cần thiết (thông tin DN, mã QR...) cho designer để tạo BR phù hợp.\n\nBộ phận phối hợp: Designer\nTư liệu làm việc: File mẫu thông tin BR, Website của Trung Quốc (Trang Chính phủ, Baidu...), Các trang tạo QR code online\nKênh làm việc: Nhóm Via, BR trên Skype",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: customerServiceCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Tìm kiếm thông tin doanh nghiệp Trung Quốc",
            description: "Tìm kiếm thông tin doanh nghiệp Trung Quốc phù hợp với thông tin của KH trên các website (Trang Chính phủ, Baidu...)",
            order: 0,
            estimatedHours: 3,
          },
          {
            title: "Tạo mã QR code",
            description: "Tạo mã QR code cần thiết từ các trang tạo QR code online",
            order: 1,
            estimatedHours: 1,
          },
          {
            title: "Gửi nguyên liệu cho designer",
            description: "Gửi các nguyên liệu cần thiết (thông tin DN, mã QR...) cho designer để tạo BR phù hợp",
            order: 2,
            estimatedHours: 1,
          },
        ],
      },
    },
  });

  console.log("✅ Customer Service Template 5 created");

  // ============================================
  // 6. Tiến hành đăng ký tài khoản
  // ============================================

  const template6 = await prisma.taskTemplate.upsert({
    where: { id: "cs-template-6" },
    update: {},
    create: {
      id: "cs-template-6",
      name: "Tiến hành đăng ký tài khoản",
      description: "Báo KH cấp quyền, chỉnh sửa thông tin Trang, kiểm tra các mục quan trọng và đăng ký tài khoản quảng cáo",
      icon: "🔐",
      defaultTitle: "Tiến hành đăng ký tài khoản",
      defaultDescription: "Báo KH cấp quyền cho via với page. Hỗ trợ chỉnh sửa một số thông tin Trang (Postal code, địa chỉ HK...). Kiểm tra các mục quan trọng của Trang (Unpublish, Giới hạn Quốc gia...). Gửi file có thông tin đăng kí TKQC cho đối tác nếu đăng kí TKQC với đối tác BF. Đăng ký tài khoản quảng cáo bằng hệ thống đối với tài khoản Google, Tiktok, bằng OE link với tài khoản Facebook.\n\nBộ phận phối hợp: Đối tác nước ngoài\nTư liệu làm việc: File KH lẻ, File Yêu cầu mở TKQC, File Opening account request (BF)\nKênh làm việc: OE Link Facebook, Nhóm chung trên Wechat, Nhóm chung trên Telegram",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: customerServiceCategory?.id,
      estimatedDays: 2,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Báo khách hàng cấp quyền cho via với page",
            description: "Thông báo và hướng dẫn KH cấp quyền cho via với page",
            order: 0,
            estimatedHours: 1,
          },
          {
            title: "Hỗ trợ chỉnh sửa thông tin Trang",
            description: "Hỗ trợ chỉnh sửa một số thông tin Trang (Postal code, địa chỉ HK...)",
            order: 1,
            estimatedHours: 1,
          },
          {
            title: "Kiểm tra các mục quan trọng của Trang",
            description: "Kiểm tra các mục quan trọng của Trang (Unpublish, Giới hạn Quốc gia...)",
            order: 2,
            estimatedHours: 1,
          },
          {
            title: "Gửi file đăng kí TKQC cho đối tác (nếu cần)",
            description: "Gửi file có thông tin đăng kí TKQC cho đối tác nếu đăng kí TKQC với đối tác BF",
            order: 3,
            estimatedHours: 1,
          },
          {
            title: "Đăng ký tài khoản quảng cáo",
            description: "Đăng ký tài khoản quảng cáo bằng hệ thống đối với tài khoản Google, Tiktok, bằng OE link với tài khoản Facebook",
            order: 4,
            estimatedHours: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Customer Service Template 6 created");

  // ============================================
  // 7. Thực hiện bind BM và topup cho TKQC
  // ============================================

  const template7 = await prisma.taskTemplate.upsert({
    where: { id: "cs-template-7" },
    update: {},
    create: {
      id: "cs-template-7",
      name: "Thực hiện bind BM và topup cho TKQC",
      description: "Kiểm tra thông tin giao dịch của KH để topup và thực hiện bind BM qua Email hoặc hệ thống online",
      icon: "💳",
      defaultTitle: "Thực hiện bind BM và topup cho TKQC",
      defaultDescription: "Kiểm tra thông tin giao dịch của KH để topup cho TKQC. Thực hiện bind BM qua Email (BF) hoặc hệ thống online (TD).\n\nBộ phận phối hợp: Đối tác nước ngoài\nTư liệu làm việc: File KH lẻ/Topup tab\nKênh làm việc: Outlook (BF), Hệ thống đối tác (TD), Moneytalks",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: customerServiceCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Kiểm tra thông tin giao dịch của khách hàng",
            description: "Kiểm tra thông tin giao dịch của KH để topup cho TKQC",
            order: 0,
            estimatedHours: 1,
          },
          {
            title: "Thực hiện topup cho TKQC",
            description: "Thực hiện nạp tiền vào tài khoản quảng cáo",
            order: 1,
            estimatedHours: 1,
          },
          {
            title: "Thực hiện bind BM",
            description: "Thực hiện bind BM qua Email (BF) hoặc hệ thống online (TD)",
            order: 2,
            estimatedHours: 2,
          },
        ],
      },
    },
  });

  console.log("✅ Customer Service Template 7 created");

  // ============================================
  // 8. Cung cấp lưu ý cần thiết cho KH trước khi sử dụng TKQC
  // ============================================

  const template8 = await prisma.taskTemplate.upsert({
    where: { id: "cs-template-8" },
    update: {},
    create: {
      id: "cs-template-8",
      name: "Cung cấp lưu ý cần thiết cho KH trước khi sử dụng TKQC",
      description: "Gửi thông báo hướng dẫn sử dụng TKQC mới, các lưu ý khi sử dụng tài khoản và chăm sóc fanpage",
      icon: "📢",
      defaultTitle: "Cung cấp lưu ý cần thiết cho KH trước khi sử dụng TKQC",
      defaultDescription: "Gửi thông báo hướng dẫn sử dụng TKQC mới về, các lưu ý khi sử dụng tài khoản, chăm sóc fanpage.\n\nBộ phận phối hợp: Không\nTư liệu làm việc: Kịch bản tư vấn KH\nKênh làm việc: Nhóm chung trên Telegram/Zalo/Wechat",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: customerServiceCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Soạn thông báo hướng dẫn sử dụng TKQC",
            description: "Soạn thông báo hướng dẫn sử dụng TKQC mới dựa trên kịch bản tư vấn KH",
            order: 0,
            estimatedHours: 2,
          },
          {
            title: "Gửi các lưu ý khi sử dụng tài khoản",
            description: "Gửi các lưu ý quan trọng khi sử dụng tài khoản quảng cáo",
            order: 1,
            estimatedHours: 1,
          },
          {
            title: "Gửi hướng dẫn chăm sóc fanpage",
            description: "Gửi hướng dẫn về cách chăm sóc fanpage để tránh các vấn đề phát sinh",
            order: 2,
            estimatedHours: 1,
          },
        ],
      },
    },
  });

  console.log("✅ Customer Service Template 8 created");

  // ============================================
  // 9. Vận hành và xử lý các vấn đề phát sinh trong quá trình sử dụng tài khoản
  // ============================================

  const template9 = await prisma.taskTemplate.upsert({
    where: { id: "cs-template-9" },
    update: {},
    create: {
      id: "cs-template-9",
      name: "Vận hành và xử lý các vấn đề phát sinh trong quá trình sử dụng tài khoản",
      description: "Tiếp nhận và xử lý các vấn đề phát sinh như nạp tiền, die tài khoản, die page, share lại tài khoản, xác minh tài khoản, các lỗi bug bất thường",
      icon: "🔧",
      defaultTitle: "Vận hành và xử lý các vấn đề phát sinh trong quá trình sử dụng tài khoản",
      defaultDescription: "Tiếp nhận thông tin từ phía khách hàng khi sảy ra các vấn đề phát sinh như nạp tiền, die tài khoản, die page, share lại tài khoản, xác minh tài khoản, các lỗi bug bất thường...\n\nBộ phận phối hợp: Đối tác nước ngoài, Kỹ thuật\nTư liệu làm việc: File KH lẻ, File thông tin đối tác\nKênh làm việc: Outlook (BF), Hệ thống đối tác (TD), Nhóm chung trên Telegram/Zalo/Wechat/What'sApp",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: customerServiceCategory?.id,
      estimatedDays: 2,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Tiếp nhận thông tin vấn đề từ khách hàng",
            description: "Tiếp nhận thông tin từ phía khách hàng về các vấn đề phát sinh (nạp tiền, die tài khoản, die page, share lại tài khoản, xác minh tài khoản, các lỗi bug bất thường...)",
            order: 0,
            estimatedHours: 1,
          },
          {
            title: "Phân loại và đánh giá vấn đề",
            description: "Phân loại và đánh giá mức độ nghiêm trọng của vấn đề",
            order: 1,
            estimatedHours: 1,
          },
          {
            title: "Liên hệ với đối tác hoặc kỹ thuật",
            description: "Liên hệ với đối tác nước ngoài hoặc bộ phận kỹ thuật để xử lý vấn đề",
            order: 2,
            estimatedHours: 3,
          },
          {
            title: "Theo dõi và cập nhật tiến độ xử lý",
            description: "Theo dõi tiến độ xử lý và cập nhật thông tin vào file KH lẻ",
            order: 3,
            estimatedHours: 2,
          },
          {
            title: "Thông báo kết quả cho khách hàng",
            description: "Thông báo kết quả xử lý và hướng dẫn tiếp theo cho khách hàng",
            order: 4,
            estimatedHours: 1,
          },
        ],
      },
    },
  });

  console.log("✅ Customer Service Template 9 created");

  // ============================================
  // 10. CSKH và theo dõi thông tin đối tác
  // ============================================

  const template10 = await prisma.taskTemplate.upsert({
    where: { id: "cs-template-10" },
    update: {},
    create: {
      id: "cs-template-10",
      name: "CSKH và theo dõi thông tin đối tác",
      description: "Tổng hợp NSQC còn lại, đề xuất nạp thêm nếu cần, gửi thông báo dự trù chi tiêu và thông báo các dịp đặc biệt",
      icon: "👥",
      defaultTitle: "CSKH và theo dõi thông tin đối tác",
      defaultDescription: "Tổng hợp NSQC còn lại ở các bên đối tác. Đề xuất tiền hành nạp thêm NSQC nếu cần thiết. Gửi thông báo đến KH về việc dự trù chi tiêu và chuyển ngân sách cho cuối tuần. Soạn thông tin và gửi thông báo đến toàn bộ khách hàng trong các dịp đặc biệt (nghỉ lễ, tết, các biến động bất thường của nền tảng....).\n\nBộ phận phối hợp: Đối tác nước ngoài, Kế toán\nTư liệu làm việc: File KH lẻ, File thông tin đối tác\nKênh làm việc: Nhóm chung trên Telegram/Zalo/Wechat/What'sApp",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: customerServiceCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Tổng hợp NSQC còn lại ở các bên đối tác",
            description: "Tổng hợp ngân sách quảng cáo còn lại ở các bên đối tác",
            order: 0,
            estimatedHours: 2,
          },
          {
            title: "Đề xuất nạp thêm NSQC nếu cần thiết",
            description: "Đánh giá và đề xuất tiến hành nạp thêm NSQC nếu cần thiết",
            order: 1,
            estimatedHours: 1,
          },
          {
            title: "Gửi thông báo dự trù chi tiêu cuối tuần",
            description: "Gửi thông báo đến KH về việc dự trù chi tiêu và chuyển ngân sách cho cuối tuần",
            order: 2,
            estimatedHours: 1,
          },
          {
            title: "Gửi thông báo các dịp đặc biệt",
            description: "Soạn thông tin và gửi thông báo đến toàn bộ khách hàng trong các dịp đặc biệt (nghỉ lễ, tết, các biến động bất thường của nền tảng...)",
            order: 3,
            estimatedHours: 2,
          },
        ],
      },
    },
  });

  console.log("✅ Customer Service Template 10 created");

  // ============================================
  // 11. Đối soát tài chính khách hàng và đối tác
  // ============================================

  const template11 = await prisma.taskTemplate.upsert({
    where: { id: "cs-template-11" },
    update: {},
    create: {
      id: "cs-template-11",
      name: "Đối soát tài chính khách hàng và đối tác",
      description: "Nhập liệu thông tin tài chính, kiểm tra chi tiêu, đối soát với đối tác, gửi thông báo dự trù và tổng kết chi tiêu",
      icon: "💰",
      defaultTitle: "Đối soát tài chính khách hàng và đối tác",
      defaultDescription: "Nhập liệu thông tin tài chính và thông tin các yêu cầu trên các file của đối tác. Kiểm tra thông tin chi tiêu các tài khoản trong tháng. Đối soát thông tin tài chính và thông tin tài khoản với các đầu đối tác. Gửi thông báo đến KH về việc dự trù chi tiêu và chuyển ngân sách cho cuối tuần, các dịp nghỉ lễ. Phối hợp rà soát lại các vấn đề còn tồn đọng của từng KH, thảo luận và đề xuất giải pháp để giải quyết. Tổng kết chi tiêu, tính phụ thu và cash back.\n\nBộ phận phối hợp: Đối tác nước ngoài, Kế toán\nTư liệu làm việc: File KH lẻ, File thông tin đối tác\nKênh làm việc: Nhóm chung trên Telegram/Zalo/Wechat/What'sApp",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: customerServiceCategory?.id,
      estimatedDays: 3,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Nhập liệu thông tin tài chính từ file đối tác",
            description: "Nhập liệu thông tin tài chính và thông tin các yêu cầu trên các file của đối tác",
            order: 0,
            estimatedHours: 3,
          },
          {
            title: "Kiểm tra thông tin chi tiêu các tài khoản trong tháng",
            description: "Kiểm tra và xác minh thông tin chi tiêu các tài khoản trong tháng",
            order: 1,
            estimatedHours: 2,
          },
          {
            title: "Đối soát thông tin tài chính với đối tác",
            description: "Đối soát thông tin tài chính và thông tin tài khoản với các đầu đối tác",
            order: 2,
            estimatedHours: 3,
          },
          {
            title: "Gửi thông báo dự trù chi tiêu cho khách hàng",
            description: "Gửi thông báo đến KH về việc dự trù chi tiêu và chuyển ngân sách cho cuối tuần, các dịp nghỉ lễ",
            order: 3,
            estimatedHours: 2,
          },
          {
            title: "Rà soát và đề xuất giải pháp cho vấn đề tồn đọng",
            description: "Phối hợp rà soát lại các vấn đề còn tồn đọng của từng KH, thảo luận và đề xuất giải pháp để giải quyết",
            order: 4,
            estimatedHours: 3,
          },
          {
            title: "Tổng kết chi tiêu, tính phụ thu và cash back",
            description: "Tổng kết chi tiêu, tính phụ thu và cash back cho từng khách hàng",
            order: 5,
            estimatedHours: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Customer Service Template 11 created");

  // ============================================
  // 12. Đối soát thông tin và tiến hành refund
  // ============================================

  const template12 = await prisma.taskTemplate.upsert({
    where: { id: "cs-template-12" },
    update: {},
    create: {
      id: "cs-template-12",
      name: "Đối soát thông tin và tiến hành refund",
      description: "Tiếp nhận thông tin refund, kiểm tra nguyên nhân, rút ngân sách về ví đối tác, nhập liệu và gửi thông tin refund cho khách hàng",
      icon: "↩️",
      defaultTitle: "Đối soát thông tin và tiến hành refund",
      defaultDescription: "Tiếp nhận thông tin xác nhận refund từ sale và khách hàng. Kiểm tra nguyên nhân refund để có hướng xử lý phù hợp (do nền tảng, do khách hàng chạy vi phạm, do khách hàng chủ động dừng vì thay đổi hoạt động kinh doanh....). Rút ngân sách từ tài khoản quảng cáo về ví của đối tác và tổng hợp thông tin refund. Nhập liệu thông tin refund lên file theo dõi chờ kế toán xác nhận và gửi thông tin refund cho khách hàng.\n\nBộ phận phối hợp: Đối tác nước ngoài, Kế toán, Sale\nTư liệu làm việc: File Refund, File thông tin đối tác\nKênh làm việc: Nhóm chung trên Telegram/Zalo/Wechat/What'sApp",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: customerServiceCategory?.id,
      estimatedDays: 2,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Tiếp nhận thông tin xác nhận refund",
            description: "Tiếp nhận thông tin xác nhận refund từ sale và khách hàng",
            order: 0,
            estimatedHours: 1,
          },
          {
            title: "Kiểm tra nguyên nhân refund",
            description: "Kiểm tra nguyên nhân refund để có hướng xử lý phù hợp (do nền tảng, do khách hàng chạy vi phạm, do khách hàng chủ động dừng vì thay đổi hoạt động kinh doanh...)",
            order: 1,
            estimatedHours: 2,
          },
          {
            title: "Rút ngân sách từ tài khoản quảng cáo về ví đối tác",
            description: "Rút ngân sách từ tài khoản quảng cáo về ví của đối tác và tổng hợp thông tin refund",
            order: 2,
            estimatedHours: 2,
          },
          {
            title: "Nhập liệu thông tin refund lên file theo dõi",
            description: "Nhập liệu thông tin refund lên file theo dõi chờ kế toán xác nhận",
            order: 3,
            estimatedHours: 1,
          },
          {
            title: "Gửi thông tin refund cho khách hàng",
            description: "Gửi thông tin refund đã được xác nhận cho khách hàng",
            order: 4,
            estimatedHours: 1,
          },
        ],
      },
    },
  });

  console.log("✅ Customer Service Template 12 created");

  console.log("✅ All Customer Service templates seeded successfully");
}
