// @ts-nocheck
import { PrismaClient, Priority } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedMarketingTemplates() {
  console.log("🌱 Seeding Marketing templates...");

  // Get admin user for createdBy
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!admin) {
    console.log("❌ Admin user not found. Skipping Marketing templates seed.");
    return;
  }

  // Get or create Marketing team
  let marketingTeam = await prisma.team.findFirst({
    where: { name: { contains: "Marketing", mode: "insensitive" } },
  });

  if (!marketingTeam) {
    marketingTeam = await prisma.team.create({
      data: {
        name: "Phòng Marketing",
        description: "Phòng Marketing - Thiết kế, Content, Ads và Planning",
        isActive: true,
      },
    });
  }

  // Get or create Marketing categories
  let designerCategory = await prisma.category.findFirst({
    where: { name: { contains: "Designer", mode: "insensitive" }, teamId: marketingTeam.id },
  });

  if (!designerCategory) {
    designerCategory = await prisma.category.create({
      data: {
        name: "Designer",
        description: "Thiết kế video, ảnh, bộ nhận diện, in ấn, UI",
        teamId: marketingTeam.id,
        estimatedDuration: 120,
      },
    });
  }

  let contentCategory = await prisma.category.findFirst({
    where: { name: { contains: "Content", mode: "insensitive" }, teamId: marketingTeam.id },
  });

  if (!contentCategory) {
    contentCategory = await prisma.category.create({
      data: {
        name: "Content",
        description: "Content writing, planning, video scripts",
        teamId: marketingTeam.id,
        estimatedDuration: 30,
      },
    });
  }

  let adsCategory = await prisma.category.findFirst({
    where: { name: { contains: "Ads", mode: "insensitive" }, teamId: marketingTeam.id },
  });

  if (!adsCategory) {
    adsCategory = await prisma.category.create({
      data: {
        name: "Ads",
        description: "Quảng cáo, setup campaigns, báo cáo",
        teamId: marketingTeam.id,
        estimatedDuration: 60,
      },
    });
  }

  let plannerCategory = await prisma.category.findFirst({
    where: { name: { contains: "Planner", mode: "insensitive" }, teamId: marketingTeam.id },
  });

  if (!plannerCategory) {
    plannerCategory = await prisma.category.create({
      data: {
        name: "Planner",
        description: "Hoạch định chiến lược, nghiên cứu, báo cáo",
        teamId: marketingTeam.id,
        estimatedDuration: 120,
      },
    });
  }

  // ============================================
  // DESIGNER TEMPLATES - VIDEO
  // ============================================

  // Video dưới 30 giây
  const video30s1 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-des-video-30s-1" },
    update: {},
    create: {
      id: "mkt-des-video-30s-1",
      name: "Video dưới 30s - Edit cơ bản",
      description: "Video edit cơ bản, chèn text, dựng nhạc, cắt ảnh cơ bản (dưới 30 giây)",
      icon: "🎬",
      defaultTitle: "Video dưới 30s - Edit cơ bản",
      defaultDescription: "Video edit cơ bản, chèn text, dựng nhạc, cắt ảnh cơ bản\n\nThời gian dự kiến: 120 phút (2 giờ)\nHệ số: 1",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: designerCategory?.id,
      estimatedDays: 0.5,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Designer Template 1 created");

  const video30s2 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-des-video-30s-2" },
    update: {},
    create: {
      id: "mkt-des-video-30s-2",
      name: "Video dưới 30s - Subtitle/Caption",
      description: "Video Subtitle, Caption (Video kiểu text hiệu ứng, chạy phụ đề, chuyển cảnh) - dưới 30 giây",
      icon: "📝",
      defaultTitle: "Video dưới 30s - Subtitle/Caption",
      defaultDescription: "Video Subtitle, Caption (Video kiểu text hiệu ứng, chạy phụ đề, chuyển cảnh)\n\nThời gian dự kiến: 180 phút (3 giờ)\nHệ số: 1.5",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: designerCategory?.id,
      estimatedDays: 0.75,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Designer Template 2 created");

  const video30s3 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-des-video-30s-3" },
    update: {},
    create: {
      id: "mkt-des-video-30s-3",
      name: "Video dưới 30s - Fast Cut/Highlight",
      description: "Fast Cut, Highlight (Video đồng bộ nhạc, tổng hợp khoảnh khắc, nhiều hiệu ứng) - dưới 30 giây",
      icon: "⚡",
      defaultTitle: "Video dưới 30s - Fast Cut/Highlight",
      defaultDescription: "Fast Cut, Highlight (Video đồng bộ nhạc, tổng hợp khoảnh khắc, nhiều hiệu ứng)\n\nThời gian dự kiến: 240 phút (4 giờ)\nHệ số: 2",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: designerCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Designer Template 3 created");

  const video30s4 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-des-video-30s-4" },
    update: {},
    create: {
      id: "mkt-des-video-30s-4",
      name: "Video dưới 30s - Tutorial/Documentary",
      description: "Tutorial, Documentary (Video phỏng vấn, thực tế, câu chuyện, TVC, quảng cáo sản phẩm) - dưới 30 giây",
      icon: "🎥",
      defaultTitle: "Video dưới 30s - Tutorial/Documentary",
      defaultDescription: "Tutorial, Documentary (Video phỏng vấn, thực tế, câu chuyện, TVC, quảng cáo sản phẩm)\n\nThời gian dự kiến: 300 phút (5 giờ)\nHệ số: 2.5",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: designerCategory?.id,
      estimatedDays: 1.25,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Designer Template 4 created");

  // Video từ 30 giây - 1 phút
  const video60s1 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-des-video-60s-1" },
    update: {},
    create: {
      id: "mkt-des-video-60s-1",
      name: "Video 30s-1p - Edit cơ bản",
      description: "Video edit cơ bản, chèn text, dựng nhạc, cắt ảnh cơ bản (30 giây - 1 phút)",
      icon: "🎬",
      defaultTitle: "Video 30s-1p - Edit cơ bản",
      defaultDescription: "Video edit cơ bản, chèn text, dựng nhạc, cắt ảnh cơ bản\n\nThời gian dự kiến: 180 phút (3 giờ)\nHệ số: 1.5",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: designerCategory?.id,
      estimatedDays: 0.75,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Designer Template 5 created");

  const video60s2 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-des-video-60s-2" },
    update: {},
    create: {
      id: "mkt-des-video-60s-2",
      name: "Video 30s-1p - Subtitle/Caption",
      description: "Video Subtitle, Caption (Video kiểu text hiệu ứng, chạy phụ đề, chuyển cảnh) - 30 giây - 1 phút",
      icon: "📝",
      defaultTitle: "Video 30s-1p - Subtitle/Caption",
      defaultDescription: "Video Subtitle, Caption (Video kiểu text hiệu ứng, chạy phụ đề, chuyển cảnh)\n\nThời gian dự kiến: 240 phút (4 giờ)\nHệ số: 2",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: designerCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Designer Template 6 created");

  const video60s3 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-des-video-60s-3" },
    update: {},
    create: {
      id: "mkt-des-video-60s-3",
      name: "Video 30s-1p - Fast Cut/Highlight",
      description: "Fast Cut, Highlight (Video đồng bộ nhạc, tổng hợp khoảnh khắc, nhiều hiệu ứng) - 30 giây - 1 phút",
      icon: "⚡",
      defaultTitle: "Video 30s-1p - Fast Cut/Highlight",
      defaultDescription: "Fast Cut, Highlight (Video đồng bộ nhạc, tổng hợp khoảnh khắc, nhiều hiệu ứng)\n\nThời gian dự kiến: 300 phút (5 giờ)\nHệ số: 2.5",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: designerCategory?.id,
      estimatedDays: 1.25,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Designer Template 7 created");

  const video60s4 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-des-video-60s-4" },
    update: {},
    create: {
      id: "mkt-des-video-60s-4",
      name: "Video 30s-1p - Tutorial/Documentary",
      description: "Tutorial, Documentary (Video phỏng vấn, thực tế, câu chuyện, TVC, quảng cáo sản phẩm) - 30 giây - 1 phút",
      icon: "🎥",
      defaultTitle: "Video 30s-1p - Tutorial/Documentary",
      defaultDescription: "Tutorial, Documentary (Video phỏng vấn, thực tế, câu chuyện, TVC, quảng cáo sản phẩm)\n\nThời gian dự kiến: 360 phút (6 giờ)\nHệ số: 3",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: designerCategory?.id,
      estimatedDays: 1.5,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Designer Template 8 created");

  // ============================================
  // DESIGNER TEMPLATES - IMAGE DESIGN
  // ============================================

  const image1 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-des-image-1" },
    update: {},
    create: {
      id: "mkt-des-image-1",
      name: "Design ảnh - Yêu cầu cơ bản",
      description: "Yêu cầu cơ bản: Dạng ảnh Typo design, website, Quote Design, Meme Viral (1 ảnh)",
      icon: "🖼️",
      defaultTitle: "Design ảnh - Yêu cầu cơ bản",
      defaultDescription: "Yêu cầu cơ bản: Dạng ảnh Typo design, website, Quote Design, Meme Viral\n\nSố lượng: 1 ảnh\nThời gian dự kiến: 45 phút\nHệ số: 1",
      defaultPriority: Priority.LOW,
      defaultCategoryId: designerCategory?.id,
      estimatedDays: 0.25,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Designer Template 9 created");

  const image2 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-des-image-2" },
    update: {},
    create: {
      id: "mkt-des-image-2",
      name: "Design ảnh - Yêu cầu tiêu chuẩn",
      description: "Yêu cầu tiêu chuẩn: Ảnh feedback, bài đăng, sản phẩm, dịch vụ, infographic (1 ảnh)",
      icon: "📸",
      defaultTitle: "Design ảnh - Yêu cầu tiêu chuẩn",
      defaultDescription: "Yêu cầu tiêu chuẩn: Ảnh feedback, bài đăng, sản phẩm, dịch vụ, infographic\n\nSố lượng: 1 ảnh\nThời gian dự kiến: 67.5 phút\nHệ số: 1.5",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: designerCategory?.id,
      estimatedDays: 0.5,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Designer Template 10 created");

  const image3 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-des-image-3" },
    update: {},
    create: {
      id: "mkt-des-image-3",
      name: "Design ảnh - Yêu cầu nâng cao",
      description: "Yêu cầu nâng cao: Ảnh bìa, SK truyền thông, quảng cáo, concept, Gif (1 ảnh)",
      icon: "🎨",
      defaultTitle: "Design ảnh - Yêu cầu nâng cao",
      defaultDescription: "Yêu cầu nâng cao: Ảnh bìa, SK truyền thông, quảng cáo, concept, Gif\n\nSố lượng: 1 ảnh\nThời gian dự kiến: 90 phút\nHệ số: 2",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: designerCategory?.id,
      estimatedDays: 0.5,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Designer Template 11 created");

  const brandIdentity = await prisma.taskTemplate.upsert({
    where: { id: "mkt-des-brand" },
    update: {},
    create: {
      id: "mkt-des-brand",
      name: "Bộ nhận diện thương hiệu",
      description: "Bộ nhận diện thương hiệu - Tùy vào các đầu sản phẩm khách hàng muốn làm",
      icon: "🎯",
      defaultTitle: "Bộ nhận diện thương hiệu",
      defaultDescription: "Bộ nhận diện thương hiệu\n\nTùy vào các đầu sản phẩm khách hàng muốn làm => tính toán được thời gian trả\nLogo riêng (làm mới): 3-5 ngày",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: designerCategory?.id,
      estimatedDays: 4,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Designer Template 12 created");

  const print1 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-des-print-1" },
    update: {},
    create: {
      id: "mkt-des-print-1",
      name: "In ấn - KTS/Decal",
      description: "In KTS, Decal: Tờ rơi, gấp, namecard, sp in nhanh, tem, nhãn, sticker, vpp cơ bản",
      icon: "🖨️",
      defaultTitle: "In ấn - KTS/Decal",
      defaultDescription: "In KTS, Decal: Tờ rơi, gấp, namecard, sp in nhanh, tem, nhãn, sticker, vpp cơ bản\n\nThời gian dự kiến: 67.5 phút\nHệ số: 1.5",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: designerCategory?.id,
      estimatedDays: 0.5,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Designer Template 13 created");

  const print2 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-des-print-2" },
    update: {},
    create: {
      id: "mkt-des-print-2",
      name: "In ấn - Offset/Laser",
      description: "In Offset, Laser: Catalog, magazine, sách, báo, poster, backdrop, billboard, VPP...",
      icon: "📄",
      defaultTitle: "In ấn - Offset/Laser",
      defaultDescription: "In Offset, Laser: Catalog, magazine, sách, báo, poster, backdrop, billboard, VPP...\n\nThời gian: Tùy chọn",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: designerCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Designer Template 14 created");

  const print3 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-des-print-3" },
    update: {},
    create: {
      id: "mkt-des-print-3",
      name: "In ấn - Flexo",
      description: "In Flexo: Bao bì, chai lọ, thùng, hộp to, hộp con, label...",
      icon: "📦",
      defaultTitle: "In ấn - Flexo",
      defaultDescription: "In Flexo: Bao bì, chai lọ, thùng, hộp to, hộp con, label...\n\nThời gian: Tùy chọn",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: designerCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Designer Template 15 created");

  const uiDesign = await prisma.taskTemplate.upsert({
    where: { id: "mkt-des-ui" },
    update: {},
    create: {
      id: "mkt-des-ui",
      name: "UI Design",
      description: "UI design - Tùy vào khách hàng mong muốn",
      icon: "💻",
      defaultTitle: "UI Design",
      defaultDescription: "UI design\n\nTùy vào khách hàng mong muốn\nThời gian: Tùy chọn",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: designerCategory?.id,
      estimatedDays: 2,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Designer Template 16 created");

  // ============================================
  // CONTENT TEMPLATES
  // ============================================

  const content1 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-1" },
    update: {},
    create: {
      id: "mkt-content-1",
      name: "Caption ngắn / Note / Update / Đăng bài",
      description: "Caption ngắn, Note, Update, Đăng bài",
      icon: "📝",
      defaultTitle: "Caption ngắn / Note / Update / Đăng bài",
      defaultDescription: "Caption ngắn, Note, Update, Đăng bài\n\nThời gian dự kiến: 15 phút\nHệ số: 1",
      defaultPriority: Priority.LOW,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.1,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 1 created");

  const content2 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-2" },
    update: {},
    create: {
      id: "mkt-content-2",
      name: "Order ảnh design / Brief Content - Cơ bản",
      description: "Order ảnh design / Order Brief Content cho Client - Yêu cầu cơ bản: KH không sử dụng gói content tại BC",
      icon: "📋",
      defaultTitle: "Order ảnh design / Brief Content - Cơ bản",
      defaultDescription: "Order ảnh design / Order Brief Content cho Client\n\nYêu cầu cơ bản: KH không sử dụng gói content tại BC\nThời gian dự kiến: 15 phút\nHệ số: 1",
      defaultPriority: Priority.LOW,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.1,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 2 created");

  const content3 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-3" },
    update: {},
    create: {
      id: "mkt-content-3",
      name: "Order ảnh design / Brief Content - Tiêu chuẩn",
      description: "Order ảnh design / Order Brief Content cho Client - Yêu cầu tiêu chuẩn: KH có sử dụng gói quản trị/ Order ảnh design",
      icon: "📋",
      defaultTitle: "Order ảnh design / Brief Content - Tiêu chuẩn",
      defaultDescription: "Order ảnh design / Order Brief Content cho Client\n\nYêu cầu tiêu chuẩn: KH có sử dụng gói quản trị/ Order ảnh design\nThời gian dự kiến: 30 phút\nHệ số: 2",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.2,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 3 created");

  const content4 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-4" },
    update: {},
    create: {
      id: "mkt-content-4",
      name: "Bài post / Caption dài - Cơ bản",
      description: "Bài recap event, chương trình ưu đãi, giới thiệu dịch vụ các lĩnh vực/client không yêu cầu quá cao (Thời trang, FnB, FMCG...), bài theo trend...",
      icon: "📰",
      defaultTitle: "Bài post / Caption dài - Cơ bản",
      defaultDescription: "Bài recap event, chương trình ưu đãi, giới thiệu dịch vụ các lĩnh vực/client không yêu cầu quá cao (Thời trang, FnB, FMCG...), bài theo trend...\n\nThời gian dự kiến: 30 phút\nHệ số: 2",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.2,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 4 created");

  const content5 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-5" },
    update: {},
    create: {
      id: "mkt-content-5",
      name: "Bài post / Caption dài - Tiêu chuẩn",
      description: "Bài trong chuỗi campaign, branding, chia sẻ kiến thức/giá trị, storytelling, chạy ads... các lĩnh vực Thời trang, FnB, FMCG,...",
      icon: "📰",
      defaultTitle: "Bài post / Caption dài - Tiêu chuẩn",
      defaultDescription: "Bài trong chuỗi campaign, branding, chia sẻ kiến thức/giá trị, storytelling, chạy ads... các lĩnh vực Thời trang, FnB, FMCG,...\n\nThời gian dự kiến: 45 phút\nHệ số: 3",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.3,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 5 created");

  const content6 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-6" },
    update: {},
    create: {
      id: "mkt-content-6",
      name: "Bài post / Caption dài - Nâng cao",
      description: "Bài trong chuỗi campaign, branding, chia sẻ kiến thức/giá trị, storytelling, chạy ads... các lĩnh vực Y tế, Công nghệ, Nội thất, Kiến trúc, Xây dựng, Spa....",
      icon: "📰",
      defaultTitle: "Bài post / Caption dài - Nâng cao",
      defaultDescription: "Bài trong chuỗi campaign, branding, chia sẻ kiến thức/giá trị, storytelling, chạy ads... các lĩnh vực Y tế, Công nghệ, Nội thất, Kiến trúc, Xây dựng, Spa....\n\nThời gian dự kiến: 60 phút\nHệ số: 4",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.4,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 6 created");

  const script1 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-script-1" },
    update: {},
    create: {
      id: "mkt-content-script-1",
      name: "Kịch bản video ngắn - TikTok công ty",
      description: "Kịch bản TikTok công ty (dạng tình huống ngắn như hiện tại) - ≤1 phút",
      icon: "🎬",
      defaultTitle: "Kịch bản video ngắn - TikTok công ty",
      defaultDescription: "Kịch bản TikTok công ty (dạng tình huống ngắn như hiện tại)\n\nĐộ dài: ≤1 phút\nThời gian dự kiến: 15 phút\nHệ số: 1",
      defaultPriority: Priority.LOW,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.1,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 7 created");

  const script2 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-script-2" },
    update: {},
    create: {
      id: "mkt-content-script-2",
      name: "Kịch bản video Social cho khách hàng",
      description: "Kịch bản video Social cho khách hàng - ≤1 phút",
      icon: "📱",
      defaultTitle: "Kịch bản video Social cho khách hàng",
      defaultDescription: "Kịch bản video Social cho khách hàng\n\nĐộ dài: ≤1 phút\nThời gian dự kiến: 45 phút\nHệ số: 3",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.3,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 8 created");

  const script3 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-script-3" },
    update: {},
    create: {
      id: "mkt-content-script-3",
      name: "Kịch bản ads BC/khách hàng",
      description: "Kịch bản ads BC/khách hàng (Thêm thời gian bonus tùy lĩnh vực) - ≤1 phút",
      icon: "📢",
      defaultTitle: "Kịch bản ads BC/khách hàng",
      defaultDescription: "Kịch bản ads BC/khách hàng\n\nThêm thời gian bonus tùy lĩnh vực\nĐộ dài: ≤1 phút\nThời gian dự kiến: 45 phút\nHệ số: 3",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.3,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 9 created");

  const script4 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-script-4" },
    update: {},
    create: {
      id: "mkt-content-script-4",
      name: "Kịch bản TVC",
      description: "Kịch bản TVC",
      icon: "📺",
      defaultTitle: "Kịch bản TVC",
      defaultDescription: "Kịch bản TVC\n\nThời gian dự kiến: 105 phút\nHệ số: 7",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.7,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 10 created");

  const prArticle = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-pr" },
    update: {},
    create: {
      id: "mkt-content-pr",
      name: "Bài PR",
      description: "Bài PR",
      icon: "📰",
      defaultTitle: "Bài PR",
      defaultDescription: "Bài PR\n\nThời gian dự kiến: 45 phút\nHệ số: 3",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.3,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 11 created");

  const seo1 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-seo-1" },
    update: {},
    create: {
      id: "mkt-content-seo-1",
      name: "Bài SEO/Blog - Cơ bản 1",
      description: "800-1200 từ, chủ đề đơn giản dạng giải thích, định nghĩa, how-to ngắn, không yêu cầu độ unique",
      icon: "🔍",
      defaultTitle: "Bài SEO/Blog - Cơ bản 1",
      defaultDescription: "800-1200 từ, chủ đề đơn giản dạng giải thích, định nghĩa, how-to ngắn, không yêu cầu độ unique\n\nThời gian dự kiến: 30 phút\nHệ số: 2",
      defaultPriority: Priority.LOW,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.2,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 12 created");

  const seo2 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-seo-2" },
    update: {},
    create: {
      id: "mkt-content-seo-2",
      name: "Bài SEO/Blog - Cơ bản 2",
      description: "800-1200 từ, cần nghiên cứu keyword & outline kỹ, tối ưu semantic keyword, internal link, yêu cầu độ unique tương đối",
      icon: "🔍",
      defaultTitle: "Bài SEO/Blog - Cơ bản 2",
      defaultDescription: "800-1200 từ, cần nghiên cứu keyword & outline kỹ, tối ưu semantic keyword, internal link, yêu cầu độ unique tương đối\n\nThời gian dự kiến: 60 phút\nHệ số: 4",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.4,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 13 created");

  const seo3 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-seo-3" },
    update: {},
    create: {
      id: "mkt-content-seo-3",
      name: "Bài SEO/Blog - Tiêu chuẩn 1",
      description: "1200-2000 từ, chủ đề đơn giản, không yêu cầu độ unique",
      icon: "🔍",
      defaultTitle: "Bài SEO/Blog - Tiêu chuẩn 1",
      defaultDescription: "1200-2000 từ, chủ đề đơn giản, không yêu cầu độ unique\n\nThời gian dự kiến: 45 phút\nHệ số: 3",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.3,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 14 created");

  const seo4 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-seo-4" },
    update: {},
    create: {
      id: "mkt-content-seo-4",
      name: "Bài SEO/Blog - Tiêu chuẩn 2",
      description: "1200-2000 từ, cần nghiên cứu keyword & outline kỹ, có ví dụ, case study, hoặc so sánh, tối ưu semantic keyword, internal link... yêu cầu độ unique tương đối",
      icon: "🔍",
      defaultTitle: "Bài SEO/Blog - Tiêu chuẩn 2",
      defaultDescription: "1200-2000 từ, cần nghiên cứu keyword & outline kỹ, có ví dụ, case study, hoặc so sánh, tối ưu semantic keyword, internal link... yêu cầu độ unique tương đối\n\nThời gian dự kiến: 120 phút\nHệ số: 8",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.8,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 15 created");

  const plan1 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-plan-1" },
    update: {},
    create: {
      id: "mkt-content-plan-1",
      name: "Lên plan nội dung - Proposal",
      description: "Plan làm proposal (khi KH chưa về)",
      icon: "📅",
      defaultTitle: "Lên plan nội dung - Proposal",
      defaultDescription: "Plan làm proposal (khi KH chưa về)\n\nThời gian dự kiến: 120 phút\nHệ số: 8",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.8,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 16 created");

  const plan2 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-plan-2" },
    update: {},
    create: {
      id: "mkt-content-plan-2",
      name: "Lên plan nội dung - Đã chốt",
      description: "Plan khi khách đã chốt",
      icon: "📅",
      defaultTitle: "Lên plan nội dung - Đã chốt",
      defaultDescription: "Plan khi khách đã chốt\n\nThời gian dự kiến: 240 phút\nHệ số: 16",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 1.6,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 17 created");

  const video1 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-video-1" },
    update: {},
    create: {
      id: "mkt-content-video-1",
      name: "Quay video TikTok ngắn",
      description: "Video TikTok ngắn: Diễn 1 tình huống không thoại",
      icon: "🎥",
      defaultTitle: "Quay video TikTok ngắn",
      defaultDescription: "Video TikTok ngắn: Diễn 1 tình huống không thoại\n\nThời gian dự kiến: 30 phút\nHệ số: 2",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.2,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 18 created");

  const video2 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-video-2" },
    update: {},
    create: {
      id: "mkt-content-video-2",
      name: "Quay video TikTok có thoại",
      description: "Video TikTok diễn nhiều tình huống/có thoại",
      icon: "🎥",
      defaultTitle: "Quay video TikTok có thoại",
      defaultDescription: "Video TikTok diễn nhiều tình huống/có thoại\n\nThời gian dự kiến: 45 phút\nHệ số: 3\n(Thêm time bonus tùy nội dung kịch bản và diễn viên)",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.3,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 19 created");

  const video3 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-video-3" },
    update: {},
    create: {
      id: "mkt-content-video-3",
      name: "Edit video TikTok",
      description: "Edit video TikTok",
      icon: "✂️",
      defaultTitle: "Edit video TikTok",
      defaultDescription: "Edit video TikTok\n\nThời gian dự kiến: 30 phút\nHệ số: 2",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.2,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 20 created");

  const internal = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-internal" },
    update: {},
    create: {
      id: "mkt-content-internal",
      name: "Truyền thông nội bộ",
      description: "Phối hợp xây kế hoạch truyền thông nội bộ/ Kịch bản",
      icon: "💬",
      defaultTitle: "Truyền thông nội bộ",
      defaultDescription: "Phối hợp xây kế hoạch truyền thông nội bộ/ Kịch bản\n\nThời gian dự kiến: 30 phút\nHệ số: 2",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.2,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 21 created");

  const check = await prisma.taskTemplate.upsert({
    where: { id: "mkt-content-check" },
    update: {},
    create: {
      id: "mkt-content-check",
      name: "Check content, domain, page",
      description: "Check content, domain, page",
      icon: "✅",
      defaultTitle: "Check content, domain, page",
      defaultDescription: "Check content, domain, page\n\nThời gian dự kiến: 15 phút\nHệ số: 1",
      defaultPriority: Priority.LOW,
      defaultCategoryId: contentCategory?.id,
      estimatedDays: 0.1,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Content Template 22 created");

  // ============================================
  // ADS TEMPLATES
  // ============================================

  const ads1 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-ads-1" },
    update: {},
    create: {
      id: "mkt-ads-1",
      name: "Ads - Nghiên cứu & lên ads plan",
      description: "Nghiên cứu & lên ads plan (01 nền tảng)",
      icon: "📊",
      defaultTitle: "Ads - Nghiên cứu & lên ads plan",
      defaultDescription: "Nghiên cứu & lên ads plan\n\n01 nền tảng\nThời gian dự kiến: 60 phút\nHệ số: 4",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: adsCategory?.id,
      estimatedDays: 0.4,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Ads Template 1 created");

  const ads2 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-ads-2" },
    update: {},
    create: {
      id: "mkt-ads-2",
      name: "Ads - Setup Kỹ thuật",
      description: "Setup Kỹ thuật: Add pixel, TK, Topup",
      icon: "⚙️",
      defaultTitle: "Ads - Setup Kỹ thuật",
      defaultDescription: "Setup Kỹ thuật: Add pixel, TK, Topup\n\nThời gian dự kiến: 30 phút\nHệ số: 2",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: adsCategory?.id,
      estimatedDays: 0.2,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Ads Template 2 created");

  const ads3 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-ads-3" },
    update: {},
    create: {
      id: "mkt-ads-3",
      name: "Ads - Campaign setup",
      description: "Campaign setup - Tùy độ phức tạp chiến dịch",
      icon: "🎯",
      defaultTitle: "Ads - Campaign setup",
      defaultDescription: "Campaign setup\n\nTùy độ phức tạp chiến dịch\nThời gian dự kiến: 15 phút\nHệ số: 1",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: adsCategory?.id,
      estimatedDays: 0.1,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Ads Template 3 created");

  const ads4 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-ads-4" },
    update: {},
    create: {
      id: "mkt-ads-4",
      name: "Ads - Báo cáo tuần",
      description: "Báo cáo tuần",
      icon: "📈",
      defaultTitle: "Ads - Báo cáo tuần",
      defaultDescription: "Báo cáo tuần\n\nThời gian dự kiến: 90 phút\nHệ số: 6",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: adsCategory?.id,
      estimatedDays: 0.6,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Ads Template 4 created");

  const ads5 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-ads-5" },
    update: {},
    create: {
      id: "mkt-ads-5",
      name: "Ads - Báo cáo tháng",
      description: "Báo cáo tháng - Báo cáo hiệu quả chiến dịch",
      icon: "📊",
      defaultTitle: "Ads - Báo cáo tháng",
      defaultDescription: "Báo cáo tháng\n\nBáo cáo hiệu quả chiến dịch\nThời gian dự kiến: 135 phút\nHệ số: 9",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: adsCategory?.id,
      estimatedDays: 0.9,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Ads Template 5 created");

  const ads6 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-ads-6" },
    update: {},
    create: {
      id: "mkt-ads-6",
      name: "Ads - Báo cáo tổng kết Dự Án",
      description: "Báo cáo tổng kết Dự Án",
      icon: "📑",
      defaultTitle: "Ads - Báo cáo tổng kết Dự Án",
      defaultDescription: "Báo cáo tổng kết Dự Án\n\nThời gian dự kiến: 240 phút\nHệ số: 16",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: adsCategory?.id,
      estimatedDays: 1.6,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Ads Template 6 created");

  const ads7 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-ads-7" },
    update: {},
    create: {
      id: "mkt-ads-7",
      name: "Ads - Xử lý vấn đề phát sinh",
      description: "Xử lý các vấn đề phát sinh: VPCS, lỗi tracking, lỗi ads bị reject...",
      icon: "🔧",
      defaultTitle: "Ads - Xử lý vấn đề phát sinh",
      defaultDescription: "Xử lý các vấn đề phát sinh: VPCS, lỗi tracking, lỗi ads bị reject...\n\nThời gian dự kiến: 30 phút\nHệ số: 2",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: adsCategory?.id,
      estimatedDays: 0.2,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Ads Template 7 created");

  const ads8 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-ads-8" },
    update: {},
    create: {
      id: "mkt-ads-8",
      name: "Ads - Kiểm tra & tối ưu chỉ số hàng ngày",
      description: "Kiểm tra & tối ưu chỉ số hàng ngày: CPM, CPC, CTR, CPA...",
      icon: "📊",
      defaultTitle: "Ads - Kiểm tra & tối ưu chỉ số hàng ngày",
      defaultDescription: "Kiểm tra & tối ưu chỉ số hàng ngày: CPM, CPC, CTR, CPA...\n\nThời gian dự kiến: 15 phút\nHệ số: 1",
      defaultPriority: Priority.LOW,
      defaultCategoryId: adsCategory?.id,
      estimatedDays: 0.1,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Ads Template 8 created");

  const ads9 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-ads-9" },
    update: {},
    create: {
      id: "mkt-ads-9",
      name: "Ads - Điều chỉnh ngân sách & target",
      description: "Điều chỉnh ngân sách & target: Scale/giảm ngân sách, phân bổ lại adset",
      icon: "💰",
      defaultTitle: "Ads - Điều chỉnh ngân sách & target",
      defaultDescription: "Điều chỉnh ngân sách & target: Scale/giảm ngân sách, phân bổ lại adset\n\nThời gian dự kiến: 15 phút\nHệ số: 1",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: adsCategory?.id,
      estimatedDays: 0.1,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Ads Template 9 created");

  const ads10 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-ads-10" },
    update: {},
    create: {
      id: "mkt-ads-10",
      name: "Ads - Tối ưu creative theo kết quả",
      description: "Tối ưu creative theo kết quả: Phân tích content hiệu quả, đổi mới định kỳ (Các dự án yêu cầu cao)",
      icon: "🎨",
      defaultTitle: "Ads - Tối ưu creative theo kết quả",
      defaultDescription: "Tối ưu creative theo kết quả: Phân tích content hiệu quả, đổi mới định kỳ (Các dự án yêu cầu cao)\n\nThời gian dự kiến: 30 phút\nHệ số: 2",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: adsCategory?.id,
      estimatedDays: 0.2,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Ads Template 10 created");

  // ============================================
  // PLANNER TEMPLATES
  // ============================================

  const planner1 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-planner-1" },
    update: {},
    create: {
      id: "mkt-planner-1",
      name: "Planner - Nghiên cứu & thu thập dữ liệu",
      description: "Nghiên cứu & thu thập dữ liệu: Tổng hợp số liệu, xu hướng ngành, key player; Chân dung, hành vi, nhu cầu, insight; Đánh giá USP, giá trị thương hiệu, định vị; Thu thập hiệu quả chiến dịch, học từ case trước",
      icon: "🔍",
      defaultTitle: "Planner - Nghiên cứu & thu thập dữ liệu",
      defaultDescription: "Nghiên cứu & thu thập dữ liệu:\n- Tổng hợp số liệu, xu hướng ngành, key player (75 phút, hệ số 5)\n- Chân dung, hành vi, nhu cầu, insight ngành nghề mới, đặc thù (60 phút, hệ số 4)\n- Đánh giá USP, giá trị thương hiệu, định vị (45 phút, hệ số 3)\n- Thu thập hiệu quả chiến dịch, học từ case trước (30 phút, hệ số 2)",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: plannerCategory?.id,
      estimatedDays: 1.5,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Planner Template 1 created");

  const planner2 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-planner-2" },
    update: {},
    create: {
      id: "mkt-planner-2",
      name: "Planner - Hoạch định chiến lược",
      description: "Hoạch định chiến lược: Chọn hướng đi & key strategy; Phân bố theo Awareness → Consideration → Conversion; Chia tỉ trọng, frequency, allocation; Xây khung thông điệp nhất quán",
      icon: "📋",
      defaultTitle: "Planner - Hoạch định chiến lược",
      defaultDescription: "Hoạch định chiến lược:\n- Chọn hướng đi & key strategy cho brand/campaign\n- Phân bố theo Awareness → Consideration → Conversion\n- Chia tỉ trọng, frequency, allocation\n- Xây khung thông điệp nhất quán theo từng nhóm audience\n\nThời gian dự kiến: 240 phút\nHệ số: 16",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: plannerCategory?.id,
      estimatedDays: 1.6,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Planner Template 2 created");

  const planner3 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-planner-3" },
    update: {},
    create: {
      id: "mkt-planner-3",
      name: "Planner - Triển khai & phối hợp",
      description: "Triển khai & phối hợp: Mô tả rõ yêu cầu, target, format, deadline; Họp team với Creative, Account, Ads để sync plan; Đảm bảo đúng định hướng chiến lược & mục tiêu",
      icon: "🤝",
      defaultTitle: "Planner - Triển khai & phối hợp",
      defaultDescription: "Triển khai & phối hợp:\n- Mô tả rõ yêu cầu, target, format, deadline\n- Họp team với Creative, Account, Ads để sync plan\n- Đảm bảo đúng định hướng chiến lược & mục tiêu\n\nThời gian dự kiến: 90 phút\nHệ số: 6",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: plannerCategory?.id,
      estimatedDays: 0.6,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Planner Template 3 created");

  const planner4 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-planner-4" },
    update: {},
    create: {
      id: "mkt-planner-4",
      name: "Planner - Theo dõi & tối ưu chiến dịch",
      description: "Theo dõi & tối ưu chiến dịch: Kiểm tra số liệu hàng tuần; Góp ý điều chỉnh creative, target, media mix; Đối chiếu kết quả thực tế với mục tiêu",
      icon: "📊",
      defaultTitle: "Planner - Theo dõi & tối ưu chiến dịch",
      defaultDescription: "Theo dõi & tối ưu chiến dịch:\n- Kiểm tra số liệu hàng tuần, phát hiện điểm cần tối ưu\n- Góp ý điều chỉnh creative, target, media mix\n- Đối chiếu kết quả thực tế với mục tiêu đề ra\n\nThời gian dự kiến: 90 phút\nHệ số: 6",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: plannerCategory?.id,
      estimatedDays: 0.6,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Planner Template 4 created");

  const planner5 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-planner-5" },
    update: {},
    create: {
      id: "mkt-planner-5",
      name: "Planner - Báo cáo & tổng hợp theo tuần",
      description: "Báo cáo & tổng hợp theo tuần: Cập nhật tiến độ, insight & đề xuất điều chỉnh; Tổng hợp số liệu, phân tích xu hướng, kết luận; Tổng hợp học được, đề xuất cho chiến dịch tiếp theo",
      icon: "📈",
      defaultTitle: "Planner - Báo cáo & tổng hợp theo tuần",
      defaultDescription: "Báo cáo & tổng hợp theo tuần:\n- Cập nhật tiến độ, insight & đề xuất điều chỉnh\n- Tổng hợp số liệu, phân tích xu hướng, kết luận\n- Tổng hợp học được, đề xuất cho chiến dịch tiếp theo\n\nThời gian dự kiến: 60 phút\nHệ số: 4",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: plannerCategory?.id,
      estimatedDays: 0.4,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Planner Template 5 created");

  const planner6 = await prisma.taskTemplate.upsert({
    where: { id: "mkt-planner-6" },
    update: {},
    create: {
      id: "mkt-planner-6",
      name: "Planner - Quản trị & xử lý phát sinh",
      description: "Quản trị & xử lý phát sinh",
      icon: "⚙️",
      defaultTitle: "Planner - Quản trị & xử lý phát sinh",
      defaultDescription: "Quản trị & xử lý phát sinh\n\nThời gian: Tùy chọn",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: plannerCategory?.id,
      estimatedDays: 0.5,
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log("✅ Marketing Planner Template 6 created");

  console.log("✅ All Marketing templates seeded successfully");
}

