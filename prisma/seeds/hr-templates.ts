// @ts-nocheck
import { PrismaClient, Priority } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedHRTemplates() {
  console.log("🌱 Seeding HR templates...");

  // Get admin user for createdBy
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!admin) {
    console.log("❌ Admin user not found. Skipping HR templates seed.");
    return;
  }

  // Get HR team and category (now "Phòng Hành chính nhân sự")
  const hrTeam = await prisma.team.findFirst({
    where: { 
      OR: [
        { name: "Phòng Hành chính nhân sự" },
        { name: "HR" },
        { name: "Phòng HR" },
        { name: { contains: "Hành chính nhân sự", mode: "insensitive" } },
        { name: { contains: "HR", mode: "insensitive" } }
      ]
    },
  });

  // Get or create HR category
  let hrCategory = await prisma.category.findFirst({
    where: { name: { contains: "HR", mode: "insensitive" } },
  });

  if (!hrCategory && hrTeam) {
    hrCategory = await prisma.category.create({
      data: {
        name: "HR - Tuyển dụng",
        description: "Các công việc liên quan đến tuyển dụng và nhân sự",
        teamId: hrTeam.id,
        estimatedDuration: 24,
      },
    });
  }

  // ============================================
  // 1.1. XÂY DỰNG HỆ THỐNG TUYỂN DỤNG
  // ============================================

  const template1_1 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-1-1" },
    update: {},
    create: {
      id: "hr-template-1-1",
      name: "Xây dựng hệ thống tuyển dụng",
      description: "Xây dựng quy trình, tiêu chuẩn tuyển dụng và hệ thống đánh giá ứng viên",
      icon: "🏗️",
      defaultTitle: "Xây dựng hệ thống tuyển dụng",
      defaultDescription: "Xây dựng quy trình và chính sách tuyển dụng nhân sự, bao gồm quy trình tuyển dụng, tiêu chuẩn tuyển dụng, hệ thống đánh giá ứng viên, kịch bản phỏng vấn, bộ câu hỏi phỏng vấn và hành trình trải nghiệm ứng viên.",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 5,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng quy trình và chính sách tuyển dụng",
            description: "Xây dựng quy trình và chính sách tuyển dụng nhân sự",
            order: 0,
            estimatedHours: 12,
          },
          {
            title: "Xây dựng chân dung ứng viên cho từng vị trí",
            description: "Xây dựng chân dung ứng viên cho từng vị trí để đảm bảo tuyển chọn đúng người phù hợp về chuyên môn và văn hóa của tổ chức",
            order: 1,
            estimatedHours: 5,
          },
          {
            title: "Xây dựng kịch bản phỏng vấn",
            description: "Xây dựng kịch bản phỏng vấn chi tiết",
            order: 2,
            estimatedHours: 24,
          },
          {
            title: "Xây dựng bộ câu hỏi phỏng vấn và đánh giá ứng viên",
            description: "Xây dựng bộ câu hỏi phỏng vấn và đánh giá ứng viên cho từng vị trí",
            order: 3,
            estimatedHours: 3,
          },
          {
            title: "Xây dựng hành trình trải nghiệm ứng viên",
            description: "Xây dựng hành trình trải nghiệm ứng viên để đảm bảo tối ưu các điểm trạm để thu hút và chiêu mộ ứng viên giúp gia tăng hiệu quả tuyển dụng và giữ chân nhân sự",
            order: 4,
            estimatedHours: 48,
          },
          {
            title: "Thiết kế và điều chỉnh trải nghiệm tại từng điểm trạm",
            description: "Thiết kế và điều chỉnh trải nghiệm tại từng điểm trạm trên hành trình ứng viên",
            order: 5,
            estimatedHours: 12,
          },
        ],
      },
    },
  });

  console.log("✅ Template 1.1 created");

  // ============================================
  // 1.2. XÂY DỰNG KẾ HOẠCH TUYỂN DỤNG
  // ============================================

  const template1_2 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-1-2" },
    update: {},
    create: {
      id: "hr-template-1-2",
      name: "Xây dựng kế hoạch tuyển dụng",
      description: "Xây dựng kế hoạch tuyển dụng theo tháng/quý/năm đảm bảo đáp ứng nhu cầu nhân lực",
      icon: "📅",
      defaultTitle: "Xây dựng kế hoạch tuyển dụng",
      defaultDescription: "Xây dựng kế hoạch tuyển dụng theo tháng/quý/năm đảm bảo đáp ứng nhu cầu nhân lực cho hoạt động của tổ chức",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng kế hoạch tuyển dụng",
            description: "Xây dựng kế hoạch tuyển dụng theo tháng/quý/năm đảm bảo đáp ứng nhu cầu nhân lực cho hoạt động của tổ chức",
            order: 0,
            estimatedHours: 8,
          },
        ],
      },
    },
  });

  console.log("✅ Template 1.2 created");

  // ============================================
  // 1.3. XÂY DỰNG THƯƠNG HIỆU TUYỂN DỤNG
  // ============================================

  const template1_3 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-1-3" },
    update: {},
    create: {
      id: "hr-template-1-3",
      name: "Xây dựng thương hiệu tuyển dụng",
      description: "Xây dựng và phát triển hệ thống kênh tuyển dụng, kế hoạch truyền thông và nội dung",
      icon: "🎯",
      defaultTitle: "Xây dựng thương hiệu tuyển dụng",
      defaultDescription: "Xây dựng và phát triển hệ thống kênh tuyển dụng đảm bảo thu hút đối tượng ứng viên tiềm năng cho các vị trí tuyển dụng",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 2,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng và phát triển hệ thống kênh tuyển dụng",
            description: "Xây dựng và phát triển hệ thống kênh tuyển dụng đảm bảo thu hút đối tượng ứng viên tiềm năng cho các vị trí tuyển dụng",
            order: 0,
            estimatedHours: 1,
          },
          {
            title: "Xây dựng kế hoạch truyền thông trên các kênh tuyển dụng",
            description: "Xây dựng kế hoạch truyền thông trên các kênh tuyển dụng (FB; Tiktok; Website; ...)",
            order: 1,
            estimatedHours: 1,
          },
          {
            title: "Xây dựng ý tưởng, nội dung truyền thông",
            description: "Xây dựng ý tưởng, nội dung truyền thông trên các kênh tuyển dụng (FB; Tiktok; Website; ...)",
            order: 2,
            estimatedHours: 6,
          },
          {
            title: "Triển khai sản xuất content, video truyền thông",
            description: "Triển khai sản xuất content, video Truyền thông quảng bá về thương hiệu tuyển dụng (FB; Tiktok; Website; ...)",
            order: 3,
            estimatedHours: 3,
          },
          {
            title: "Đo lường và đánh giá hiệu quả thương hiệu tuyển dụng",
            description: "Đo lường và đánh giá hiệu quả thương hiệu tuyển dụng",
            order: 4,
            estimatedHours: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Template 1.3 created");

  // ============================================
  // 1.4. QUẢN LÝ NGÂN SÁCH TUYỂN DỤNG
  // ============================================

  const template1_4 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-1-4" },
    update: {},
    create: {
      id: "hr-template-1-4",
      name: "Quản lý ngân sách tuyển dụng",
      description: "Xây dựng, quản lý và kiểm soát ngân sách tuyển dụng trên từng kênh, từng vị trí",
      icon: "💰",
      defaultTitle: "Quản lý ngân sách tuyển dụng",
      defaultDescription: "Xây dựng, quản lý và kiểm soát ngân sách tuyển dụng trên từng kênh, từng vị trí",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng ngân sách tuyển dụng",
            description: "Xây dựng ngân sách tuyển dụng",
            order: 0,
            estimatedHours: 8,
          },
          {
            title: "Thống kê, theo dõi ngân sách tuyển dụng",
            description: "Thống kê, theo dõi ngân sách tuyển dụng trên từng kênh, từng vị trí",
            order: 1,
            estimatedHours: 2,
          },
          {
            title: "Kiểm soát ngân sách tuyển dụng",
            description: "Kiểm soát ngân sách tuyển dụng trên từng kênh, từng vị trí",
            order: 2,
            estimatedHours: 3,
          },
          {
            title: "Báo cáo chi phí tuyển dụng và đánh giá hiệu quả",
            description: "Báo cáo chi phí tuyển dụng đã sử dụng (từng vị trí, từng kênh) và đánh giá hiệu quả từng kênh tuyển dụng trên chi phí",
            order: 3,
            estimatedHours: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Template 1.4 created");

  // ============================================
  // 1.5. TRIỂN KHAI HOẠT ĐỘNG TUYỂN DỤNG
  // ============================================

  const template1_5 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-1-5" },
    update: {},
    create: {
      id: "hr-template-1-5",
      name: "Triển khai hoạt động tuyển dụng",
      description: "Triển khai toàn bộ quy trình tuyển dụng từ tiếp nhận nhu cầu đến onboarding nhân sự mới",
      icon: "🚀",
      defaultTitle: "Triển khai hoạt động tuyển dụng",
      defaultDescription: "Triển khai toàn bộ quy trình tuyển dụng từ tiếp nhận nhu cầu, đăng tin, sàng lọc CV, phỏng vấn đến onboarding nhân sự mới",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 3,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Tiếp nhận và kiểm soát nhu cầu tuyển dụng",
            description: "Tiếp nhận và kiểm soát nhu cầu tuyển dụng",
            order: 0,
            estimatedHours: 0.25,
          },
          {
            title: "Xác định và lựa chọn kênh đăng tuyển dụng phù hợp",
            description: "Xác định và lựa chọn kênh đăng tuyển dụng phù hợp",
            order: 1,
            estimatedHours: 0.125,
          },
          {
            title: "Đăng tin tuyển dụng",
            description: "Đăng tin tuyển dụng",
            order: 2,
            estimatedHours: 0.125,
          },
          {
            title: "Tương tác và phản hồi ứng viên",
            description: "Tương tác và phản hồi ứng viên",
            order: 3,
            estimatedHours: 0.25,
          },
          {
            title: "Chọn lọc CV ứng viên",
            description: "Chọn lọc CV ứng viên",
            order: 4,
            estimatedHours: 0.125,
          },
          {
            title: "Theo dõi và quản lý dữ liệu CV ứng viên",
            description: "Theo dõi và quản lý dữ liệu CV ứng viên phục vụ cho hoạt động đo lường và đánh giá hiệu quả tuyển dụng",
            order: 5,
            estimatedHours: 1,
          },
          {
            title: "Liên hệ hẹn lịch và gửi thư mời phỏng vấn",
            description: "Liên hệ hẹn lịch và gửi thư mời phỏng vấn",
            order: 6,
            estimatedHours: 0.1,
          },
          {
            title: "Chuẩn bị tổ chức setup trước phỏng vấn",
            description: "Chuẩn bị tổ chức setup trước phỏng vấn",
            order: 7,
            estimatedHours: 1,
          },
          {
            title: "Tiếp đón và chăm sóc ứng viên trong quá trình phỏng vấn",
            description: "Tiếp đón và chăm sóc ứng viên trong quá trình phỏng vấn",
            order: 8,
            estimatedHours: 0.25,
          },
          {
            title: "Phối hợp với phòng ban chuyên môn phỏng vấn ứng viên",
            description: "Phối hợp với phòng ban chuyên môn phỏng vấn ứng viên",
            order: 9,
            estimatedHours: 0.5,
          },
          {
            title: "Thỏa thuận về chế độ chính sách ứng viên",
            description: "Thỏa thuận về chế độ chính sách ứng viên",
            order: 10,
            estimatedHours: 0.25,
          },
          {
            title: "Theo dõi và cập nhật trạng thái ứng viên",
            description: "Theo dõi và cập nhật trạng thái ứng viên",
            order: 11,
            estimatedHours: 2,
          },
          {
            title: "Tiếp nhận và giới thiệu nhân sự",
            description: "Tiếp nhận và giới thiệu nhân sự",
            order: 12,
            estimatedHours: 0.25,
          },
          {
            title: "Theo dõi và cập nhật thông tin nhân sự mới vào database",
            description: "Theo dõi và cập nhật thông tin nhân sự mới vào database",
            order: 13,
            estimatedHours: 2,
          },
        ],
      },
    },
  });

  console.log("✅ Template 1.5 created");

  // ============================================
  // 1.6. BÁO CÁO VÀ ĐÁNH GIÁ HIỆU QUẢ TUYỂN DỤNG
  // ============================================

  const template1_6 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-1-6" },
    update: {},
    create: {
      id: "hr-template-1-6",
      name: "Báo cáo và đánh giá hiệu quả tuyển dụng",
      description: "Làm các báo cáo tuyển dụng để đánh giá hiệu quả và phân tích các cơ hội đột phá",
      icon: "📊",
      defaultTitle: "Báo cáo và đánh giá hiệu quả tuyển dụng",
      defaultDescription: "Làm các báo cáo tuyển dụng để đánh giá hiệu quả và phân tích các cơ hội đột phá",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Làm báo cáo tuyển dụng",
            description: "Làm các báo cáo tuyển dụng để đánh giá hiệu quả và phân tích các cơ hội đột phá",
            order: 0,
            estimatedHours: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Template 1.6 created");

  // ============================================
  // 2.1. XÂY DỰNG CHIẾN LƯỢC ĐÀO TẠO
  // ============================================

  const template2_1 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-2-1" },
    update: {},
    create: {
      id: "hr-template-2-1",
      name: "Xây dựng chiến lược đào tạo",
      description: "Xây dựng chiến lược đào tạo phù hợp chiến lược phát triển của công ty",
      icon: "🎯",
      defaultTitle: "Xây dựng chiến lược đào tạo",
      defaultDescription: "Xây dựng chiến lược đào tạo phù hợp chiến lược phát triển của công ty, bao gồm phân tích nhu cầu đào tạo, yêu cầu công việc, trình độ nhân sự hiện tại và xác định mục tiêu đào tạo",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 3,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Phân tích nhu cầu đào tạo của công ty",
            description: "Phân tích nhu cầu đào tạo của công ty",
            order: 0,
            estimatedHours: 8,
          },
          {
            title: "Phân tích yêu cầu công việc các vị trí",
            description: "Phân tích yêu cầu công việc các vị trí",
            order: 1,
            estimatedHours: 8,
          },
          {
            title: "Phân tích trình độ nhân sự thời điểm hiện tại",
            description: "Phân tích trình độ nhân sự thời điểm hiện tại",
            order: 2,
            estimatedHours: 8,
          },
          {
            title: "Xác định mục tiêu đào tạo",
            description: "Xác định mục tiêu đào tạo",
            order: 3,
            estimatedHours: 24,
          },
          {
            title: "Dự tính nhu cầu đào tạo",
            description: "Dự tính nhu cầu đào tạo",
            order: 4,
            estimatedHours: 2,
          },
        ],
      },
    },
  });

  console.log("✅ Template 2.1 created");

  // ============================================
  // 2.2. XÂY DỰNG VÀ TRIỂN KHAI ĐÁNH GIÁ KHUNG NĂNG LỰC
  // ============================================

  const template2_2 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-2-2" },
    update: {},
    create: {
      id: "hr-template-2-2",
      name: "Xây dựng và triển khai đánh giá Khung năng lực",
      description: "Xây dựng và triển khai đánh giá Khung năng lực cho từng vị trí đảm bảo đáp nhu cầu năng lực trong công ty",
      icon: "📊",
      defaultTitle: "Xây dựng và triển khai đánh giá Khung năng lực",
      defaultDescription: "Xây dựng và triển khai đánh giá Khung năng lực cho từng vị trí đảm bảo đáp nhu cầu năng lực trong công ty, bao gồm xây dựng nhóm năng lực, danh mục năng lực, từ điển năng lực và tiêu chuẩn hành vi",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 4,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng nhóm năng lực trong tổ chức",
            description: "Xây dựng nhóm năng lực trong tổ chức",
            order: 0,
            estimatedHours: 12,
          },
          {
            title: "Xây dựng danh mục năng lực trên từng nhóm năng lực",
            description: "Xây dựng danh mục năng lực trên từng nhóm năng lực",
            order: 1,
            estimatedHours: 10,
          },
          {
            title: "Xây dựng và update từ điển năng lực cho từng năng lực",
            description: "Xây dựng và update từ điển năng lực cho từng năng lực",
            order: 2,
            estimatedHours: 8,
          },
          {
            title: "Xây dựng và update tiêu chuẩn hành vi từng cấp độ trên từng năng lực",
            description: "Xây dựng và update tiêu chuẩn hành vi từng cấp độ trên từng năng lực",
            order: 3,
            estimatedHours: 8,
          },
          {
            title: "Xây dựng và update tiêu chuẩn năng lực cho từng vị trí",
            description: "Xây dựng và update tiêu chuẩn năng lực cho từng vị trí",
            order: 4,
            estimatedHours: 8,
          },
          {
            title: "Triển khai đánh giá khung năng lực",
            description: "Triển khai đánh giá khung năng lực",
            order: 5,
            estimatedHours: 24,
          },
        ],
      },
    },
  });

  console.log("✅ Template 2.2 created");

  // ============================================
  // 2.3. LỘ TRÌNH CÔNG DANH VÀ PHÁT TRIỂN NHÂN TÀI
  // ============================================

  const template2_3 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-2-3" },
    update: {},
    create: {
      id: "hr-template-2-3",
      name: "Lộ trình công danh và phát triển nhân tài",
      description: "Xây dựng và triển khai lộ trình công danh và phát triển nhân tài",
      icon: "🚀",
      defaultTitle: "Lộ trình công danh và phát triển nhân tài",
      defaultDescription: "Xây dựng và triển khai lộ trình công danh và phát triển nhân tài, bao gồm xây dựng lộ trình công danh, triển khai lộ trình và quản trị nhân tài/đội ngũ kế cận",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 2,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng lộ trình công danh",
            description: "Xây dựng lộ trình công danh",
            order: 0,
            estimatedHours: 8,
          },
          {
            title: "Triển khai lộ trình công danh",
            description: "Triển khai lộ trình công danh",
            order: 1,
            estimatedHours: 12,
          },
          {
            title: "Quản trị nhân tài/đội ngũ kế cận",
            description: "Quản trị nhân tài/đội ngũ kế cận",
            order: 2,
            estimatedHours: 8,
          },
        ],
      },
    },
  });

  console.log("✅ Template 2.3 created");

  // ============================================
  // 2.4. XÂY DỰNG HỆ THỐNG ĐÀO TẠO
  // ============================================

  const template2_4 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-2-4" },
    update: {},
    create: {
      id: "hr-template-2-4",
      name: "Xây dựng hệ thống đào tạo",
      description: "Xây dựng hệ thống đào tạo: Quy trình, tiêu chuẩn đào tạo; Quy chế đào tạo; Chương trình đào tạo; công cụ đánh giá sau đào tạo",
      icon: "🏗️",
      defaultTitle: "Xây dựng hệ thống đào tạo",
      defaultDescription: "Xây dựng hệ thống đào tạo: Quy trình, tiêu chuẩn đào tạo; Quy chế đào tạo; Chương trình đào tạo; công cụ đánh giá sau đào tạo",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 5,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng quy trình, tiêu chuẩn đào tạo",
            description: "Xây dựng quy trình, tiêu chuẩn đào tạo",
            order: 0,
            estimatedHours: 15,
          },
          {
            title: "Xây dựng và update quy chế đào tạo",
            description: "Xây dựng và update quy chế đào tạo",
            order: 1,
            estimatedHours: 36,
          },
          {
            title: "Xây dựng khung các chương trình đào tạo",
            description: "Xây dựng khung các chương trình đào tạo",
            order: 2,
            estimatedHours: 5,
          },
          {
            title: "Xây dựng tài liệu đào tạo",
            description: "Xây dựng tài liệu đào tạo",
            order: 3,
            estimatedHours: 8,
          },
          {
            title: "Xây dựng tiêu chí lựa chọn giảng viên",
            description: "Xây dựng tiêu chí lựa chọn giảng viên",
            order: 4,
            estimatedHours: 5,
          },
          {
            title: "Xây dựng công cụ đánh giá trước và sau đào tạo",
            description: "Xây dựng công cụ đánh giá trước và sau đào tạo",
            order: 5,
            estimatedHours: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Template 2.4 created");

  // ============================================
  // 2.5. XÂY DỰNG KẾ HOẠCH ĐÀO TẠO
  // ============================================

  const template2_5 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-2-5" },
    update: {},
    create: {
      id: "hr-template-2-5",
      name: "Xây dựng kế hoạch đào tạo",
      description: "Xây dựng kế hoạch đào tạo theo tháng/quý/năm đảm bảo đáp ứng nhu cầu nhân lực cho hoạt động của tổ chức",
      icon: "📅",
      defaultTitle: "Xây dựng kế hoạch đào tạo",
      defaultDescription: "Xây dựng kế hoạch đào tạo theo tháng/quý/năm đảm bảo đáp ứng nhu cầu nhân lực cho hoạt động của tổ chức",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng kế hoạch đào tạo",
            description: "Xây dựng kế hoạch đào tạo theo tháng/quý/năm đảm bảo đáp ứng nhu cầu nhân lực cho hoạt động của tổ chức",
            order: 0,
            estimatedHours: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Template 2.5 created");

  // ============================================
  // 2.6. QUẢN LÝ VÀ PHÁT TRIỂN KÊNH ĐÀO TẠO
  // ============================================

  const template2_6 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-2-6" },
    update: {},
    create: {
      id: "hr-template-2-6",
      name: "Quản lý và phát triển kênh đào tạo",
      description: "Xây dựng, quản lý và phát triển kênh đào tạo: Online, Offline, E-learning",
      icon: "📺",
      defaultTitle: "Quản lý và phát triển kênh đào tạo",
      defaultDescription: "Xây dựng, quản lý và phát triển kênh đào tạo: Online, Offline, E-learning",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 2,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng kênh đào tạo: Online, Offline, E-learning",
            description: "Xây dựng kênh đào tạo: Online, Offline, E-learning",
            order: 0,
            estimatedHours: 5,
          },
          {
            title: "Xây dựng kế hoạch triển khai trên các kênh đào tạo",
            description: "Xây dựng kế hoạch triển khai trên các kênh đào tạo",
            order: 1,
            estimatedHours: 3,
          },
          {
            title: "Xây dựng nội dung trên kênh đào tạo",
            description: "Xây dựng nội dung trên kênh đào tạo",
            order: 2,
            estimatedHours: 4,
          },
          {
            title: "Quản lý kênh đào tạo",
            description: "Quản lý kênh đào tạo",
            order: 3,
            estimatedHours: 0.5,
          },
          {
            title: "Theo dõi chỉ số trên các kênh đào tạo",
            description: "Theo dõi chỉ số trên các kênh đào tạo",
            order: 4,
            estimatedHours: 1,
          },
        ],
      },
    },
  });

  console.log("✅ Template 2.6 created");

  // ============================================
  // 2.7. QUẢN LÝ NGÂN SÁCH ĐÀO TẠO
  // ============================================

  const template2_7 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-2-7" },
    update: {},
    create: {
      id: "hr-template-2-7",
      name: "Quản lý ngân sách đào tạo",
      description: "Xây dựng, quản lý và kiểm soát ngân sách đào tạo trên từng kênh, từng vị trí",
      icon: "💰",
      defaultTitle: "Quản lý ngân sách đào tạo",
      defaultDescription: "Xây dựng, quản lý và kiểm soát ngân sách đào tạo trên từng kênh, từng vị trí",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng ngân sách đào tạo",
            description: "Xây dựng ngân sách đào tạo",
            order: 0,
            estimatedHours: 2,
          },
          {
            title: "Theo dõi, thống kê, kiểm soát ngân sách đào tạo",
            description: "Theo dõi, thống kê, kiểm soát ngân sách đào tạo trên từng kênh, từng vị trí",
            order: 1,
            estimatedHours: 2,
          },
          {
            title: "Báo cáo chi phí đào tạo và đánh giá hiệu quả",
            description: "Báo cáo chi phí đào tạo đã sử dụng (từng vị trí, từng kênh) và đánh giá hiệu quả từng kênh đào tạo trên chi phí",
            order: 2,
            estimatedHours: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Template 2.7 created");

  // ============================================
  // 2.8. TRIỂN KHAI HOẠT ĐỘNG ĐÀO TẠO
  // ============================================

  const template2_8 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-2-8" },
    update: {},
    create: {
      id: "hr-template-2-8",
      name: "Triển khai hoạt động đào tạo",
      description: "Triển khai toàn bộ quy trình đào tạo từ tiếp nhận nhu cầu đến đánh giá kết quả sau đào tạo",
      icon: "🚀",
      defaultTitle: "Triển khai hoạt động đào tạo",
      defaultDescription: "Triển khai toàn bộ quy trình đào tạo từ tiếp nhận nhu cầu, tổ chức đào tạo đến đánh giá kết quả sau đào tạo",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 3,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Tiếp nhận nhu cầu đào tạo, đối chiếu với kế hoạch đào tạo",
            description: "Tiếp nhận nhu cầu đào tạo, đối chiếu với kế hoạch đào tạo",
            order: 0,
            estimatedHours: 2,
          },
          {
            title: "Hướng dẫn học viên các hình thức đào tạo",
            description: "Hướng dẫn học viên các hình thức đào tạo",
            order: 1,
            estimatedHours: 8,
          },
          {
            title: "Tổng hợp danh sách đăng ký học",
            description: "Tổng hợp danh sách đăng ký học",
            order: 2,
            estimatedHours: 1,
          },
          {
            title: "Thông báo thời gian tổ chức buổi đào tạo",
            description: "Thông báo thời gian tổ chức buổi đào tạo",
            order: 3,
            estimatedHours: 0.5,
          },
          {
            title: "Chuẩn bị Công cụ, tài liệu, setup trước buổi học",
            description: "Chuẩn bị Công cụ, tài liệu, setup trước buổi học",
            order: 4,
            estimatedHours: 2,
          },
          {
            title: "Tổ chức đào tạo",
            description: "Tổ chức đào tạo",
            order: 5,
            estimatedHours: 3,
          },
          {
            title: "Tổng hợp và Lấy ý kiến học viên về GV và nội dung đào tạo",
            description: "Tổng hợp và Lấy ý kiến học viên về GV và nội dung đào tạo",
            order: 6,
            estimatedHours: 0.5,
          },
          {
            title: "Tổng hợp và thông báo kết quả học viên sau khóa đào tạo",
            description: "Tổng hợp và thông báo kết quả học viên sau khóa đào tạo",
            order: 7,
            estimatedHours: 1,
          },
          {
            title: "Theo dõi hoạt động đào tạo thực tế của NH và phòng ban",
            description: "Theo dõi hoạt động đào tạo thực tế của NH và phòng ban",
            order: 8,
            estimatedHours: 1,
          },
          {
            title: "Kiểm tra xác suất hoạt động đào tạo thực tế của NH và phòng ban",
            description: "Kiểm tra xác suất hoạt động đào tạo thực tế của NH và phòng ban",
            order: 9,
            estimatedHours: 1,
          },
          {
            title: "Kiểm tra kết quả thực tế của học viên sau đào tạo",
            description: "Kiểm tra kết quả thực tế của học viên sau đào tạo",
            order: 10,
            estimatedHours: 1,
          },
        ],
      },
    },
  });

  console.log("✅ Template 2.8 created");

  // ============================================
  // 2.9. BÁO CÁO VÀ ĐÁNH GIÁ HIỆU QUẢ ĐÀO TẠO
  // ============================================

  const template2_9 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-2-9" },
    update: {},
    create: {
      id: "hr-template-2-9",
      name: "Báo cáo và đánh giá hiệu quả đào tạo",
      description: "Báo cáo và đánh giá hiệu quả hoạt động đào tạo, đưa ra các cải tiến nâng cao hiệu quả",
      icon: "📊",
      defaultTitle: "Báo cáo và đánh giá hiệu quả đào tạo",
      defaultDescription: "Báo cáo và đánh giá hiệu quả hoạt động đào tạo, đưa ra các cải tiến nâng cao hiệu quả đào tạo",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Báo cáo về kết quả sau mỗi chương trình đào tạo",
            description: "Báo cáo về kết quả sau mỗi chương trình đào tạo",
            order: 0,
            estimatedHours: 1,
          },
          {
            title: "Báo cáo hiệu quả trước và sau đào tạo",
            description: "Báo cáo hiệu quả trước và sau đào tạo",
            order: 1,
            estimatedHours: 2,
          },
          {
            title: "Đưa ra các cải tiến nâng cao hiệu quả đào tạo",
            description: "Đưa ra các cải tiến nâng cao hiệu quả đào tạo",
            order: 2,
            estimatedHours: 2,
          },
        ],
      },
    },
  });

  console.log("✅ Template 2.9 created");

  // ============================================
  // 3.1. XÂY DỰNG HỆ THỐNG CHÍNH SÁCH
  // ============================================

  const template3_1 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-3-1" },
    update: {},
    create: {
      id: "hr-template-3-1",
      name: "Xây dựng hệ thống chính sách",
      description: "Xây dựng hệ thống chính sách: Quy trình, tiêu chuẩn làm việc; Nội quy, quy định; Chính sách phúc lợi",
      icon: "📋",
      defaultTitle: "Xây dựng hệ thống chính sách",
      defaultDescription: "Xây dựng hệ thống chính sách: Quy trình, tiêu chuẩn làm việc; Nội quy, quy định; Chính sách phúc lợi",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 2,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng quy trình tính lương, thưởng, phúc lợi",
            description: "Xây dựng quy trình tính lương, thưởng, phúc lợi",
            order: 0,
            estimatedHours: 12,
          },
          {
            title: "Xây dựng nội quy lao động và thỏa ước lao động tập thể",
            description: "Xây dựng nội quy lao động và thỏa ước lao động tập thể",
            order: 1,
            estimatedHours: 12,
          },
          {
            title: "Xây dựng chính sách phúc lợi ngắn hạn, trung hạn và dài hạn",
            description: "Xây dựng chính sách phúc lợi ngắn hạn, trung hạn và dài hạn",
            order: 2,
            estimatedHours: 12,
          },
        ],
      },
    },
  });

  console.log("✅ Template 3.1 created");

  // ============================================
  // 3.2. XÂY DỰNG HỆ THỐNG LƯƠNG, THƯỞNG
  // ============================================

  const template3_2 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-3-2" },
    update: {},
    create: {
      id: "hr-template-3-2",
      name: "Xây dựng hệ thống lương, thưởng",
      description: "Xây dựng hệ thống lương, thưởng: Quy chế lương (cơ cấu lương); Thang bảng lương",
      icon: "💵",
      defaultTitle: "Xây dựng hệ thống lương, thưởng",
      defaultDescription: "Xây dựng hệ thống lương, thưởng: Quy chế lương (cơ cấu lương); Thang bảng lương",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 2,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng hệ thống thang bảng lương",
            description: "Xây dựng hệ thống thang bảng lương",
            order: 0,
            estimatedHours: 8,
          },
          {
            title: "Xây dựng quy chế lương, thưởng, phúc lợi",
            description: "Xây dựng quy chế lương, thưởng, phúc lợi đảm bảo công bằng và tạo động lực cho nhân sự",
            order: 1,
            estimatedHours: 12,
          },
          {
            title: "Xây dựng cơ chế lương cho từng bộ phận",
            description: "Xây dựng cơ chế lương cho từng bộ phận",
            order: 2,
            estimatedHours: 8,
          },
        ],
      },
    },
  });

  console.log("✅ Template 3.2 created");

  // ============================================
  // 3.3. KIỂM SOÁT NGÂN SÁCH LƯƠNG THƯỞNG, PHÚC LỢI, BHXH
  // ============================================

  const template3_3 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-3-3" },
    update: {},
    create: {
      id: "hr-template-3-3",
      name: "Kiểm soát ngân sách lương thưởng, phúc lợi, BHXH",
      description: "Xây dựng và kiểm soát ngân sách lương thưởng, phúc lợi, BHXH",
      icon: "💰",
      defaultTitle: "Kiểm soát ngân sách lương thưởng, phúc lợi, BHXH",
      defaultDescription: "Xây dựng và kiểm soát ngân sách lương thưởng, phúc lợi, BHXH",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng và kiểm soát ngân sách lương",
            description: "Xây dựng và kiểm soát ngân sách lương đảm bảo quỹ lương theo định mức",
            order: 0,
            estimatedHours: 2,
          },
        ],
      },
    },
  });

  console.log("✅ Template 3.3 created");

  // ============================================
  // 3.4. TRIỂN KHAI TÍNH TOÁN VÀ CHI TRẢ LƯƠNG, THƯỞNG, PHÚC LỢI, BHXH
  // ============================================

  const template3_4 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-3-4" },
    update: {},
    create: {
      id: "hr-template-3-4",
      name: "Triển khai tính toán và chi trả lương, thưởng, phúc lợi, BHXH",
      description: "Triển khai hoạt động tính toán và chi trả lương, thưởng, phúc lợi, BHXH",
      icon: "💳",
      defaultTitle: "Triển khai tính toán và chi trả lương, thưởng, phúc lợi, BHXH",
      defaultDescription: "Triển khai hoạt động tính toán và chi trả lương, thưởng, phúc lợi, BHXH",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 2,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Tiếp nhận và xử lý các đề xuất về lương, thưởng, phúc lợi",
            description: "Tiếp nhận và xử lý các đề xuất về lương, thưởng, phúc lợi cho nhân viên",
            order: 0,
            estimatedHours: 0.5,
          },
          {
            title: "Thực hiện tính toán và chi trả lương thưởng cho toàn bộ CBNV công ty",
            description: "Thực hiện tính toán và chi trả lương thưởng cho toàn bộ CBNV công ty",
            order: 1,
            estimatedHours: 2,
          },
          {
            title: "Thực hiện kê khai và giải quyết chế độ BHXH cho CBNV công ty",
            description: "Thực hiện kê khai và giải quyết chế độ BHXH cho CBNV công ty",
            order: 2,
            estimatedHours: 2,
          },
        ],
      },
    },
  });

  console.log("✅ Template 3.4 created");

  // ============================================
  // 3.5. QUẢN LÝ VÀ ĐÁNH GIÁ HIỆU SUẤT LÀM VIỆC
  // ============================================

  const template3_5 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-3-5" },
    update: {},
    create: {
      id: "hr-template-3-5",
      name: "Quản lý và đánh giá hiệu suất làm việc",
      description: "Quản lý và đánh giá hiệu suất làm việc của nhân viên",
      icon: "📈",
      defaultTitle: "Quản lý và đánh giá hiệu suất làm việc",
      defaultDescription: "Quản lý và đánh giá hiệu suất làm việc của nhân viên thông qua hệ thống KPI",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 2,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng hệ thống đánh giá hiệu suất công việc (KPI)",
            description: "Xây dựng hệ thống đánh giá hiệu suất công việc (KPI) cấp công ty/phòng ban/cá nhân",
            order: 0,
            estimatedHours: 3,
          },
          {
            title: "Theo dõi và tổng hợp kết quả KPI",
            description: "Theo dõi và tổng hợp kết quả KPI",
            order: 1,
            estimatedHours: 5,
          },
          {
            title: "Đo lường và đánh giá hiệu suất làm việc định kỳ",
            description: "Đo lường và đánh giá hiệu suất làm việc định kỳ tháng/quý/năm thông qua chỉ tiêu hoàn thành KPI",
            order: 2,
            estimatedHours: 1,
          },
        ],
      },
    },
  });

  console.log("✅ Template 3.5 created");

  // ============================================
  // 3.6. BÁO CÁO CÔNG TÁC LƯƠNG THƯỞNG, PHÚC LỢI, BHXH
  // ============================================

  const template3_6 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-3-6" },
    update: {},
    create: {
      id: "hr-template-3-6",
      name: "Báo cáo công tác lương thưởng, phúc lợi, BHXH",
      description: "Báo cáo công tác lương thưởng, phúc lợi, BHXH",
      icon: "📊",
      defaultTitle: "Báo cáo công tác lương thưởng, phúc lợi, BHXH",
      defaultDescription: "Báo cáo công tác lương thưởng, phúc lợi, BHXH",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Theo dõi và báo cáo chi phí lương trên từng điểm bán",
            description: "Theo dõi và báo cáo chi phí lương trên từng điểm bán",
            order: 0,
            estimatedHours: 1,
          },
          {
            title: "Tính toán và chi trả các khoản thưởng và phúc lợi trong công ty",
            description: "Tính toán và chi trả các khoản thưởng và phúc lợi trong công ty",
            order: 1,
            estimatedHours: 1,
          },
          {
            title: "Đo lường và đánh giá sự hài lòng của nhân viên về chế độ phúc lợi",
            description: "Đo lường và đánh giá sự hài lòng của nhân viên về chế độ phúc lợi công ty",
            order: 2,
            estimatedHours: 5,
          },
          {
            title: "Báo cáo các chỉ số lương, thưởng, BHXH và phân tích",
            description: "Báo cáo các chỉ số lương, thưởng, BHXH; phân tích sự cố và cơ hội đột phá",
            order: 3,
            estimatedHours: 2,
          },
        ],
      },
    },
  });

  console.log("✅ Template 3.6 created");

  // ============================================
  // 4.1. QUẢN LÝ THÔNG TIN NHÂN SỰ
  // ============================================

  const template4_1 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-4-1" },
    update: {},
    create: {
      id: "hr-template-4-1",
      name: "Quản lý thông tin nhân sự",
      description: "Quản lý thông tin nhân sự đảm bảo thông tin nhân sự được đầy đủ chính xác",
      icon: "👥",
      defaultTitle: "Quản lý thông tin nhân sự",
      defaultDescription: "Quản lý thông tin nhân sự đảm bảo thông tin nhân sự được đầy đủ chính xác",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Theo dõi, cập nhật biến động data nhân sự",
            description: "Theo dõi, cập nhật biến động data nhân sự đảm bảo thông tin nhân sự được đầy đủ chính sách",
            order: 0,
            estimatedHours: 0.5,
          },
          {
            title: "Quản trị data nhân sự để cung cấp và đánh giá dữ liệu",
            description: "Quản trị data nhân sự để cung cấp và đánh giá dữ liệu thông tin nhân sự",
            order: 1,
            estimatedHours: 2,
          },
        ],
      },
    },
  });

  console.log("✅ Template 4.1 created");

  // ============================================
  // 4.2. QUẢN LÝ HỢP ĐỒNG LAO ĐỘNG VÀ HỒ SƠ NHÂN SỰ
  // ============================================

  const template4_2 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-4-2" },
    update: {},
    create: {
      id: "hr-template-4-2",
      name: "Quản lý hợp đồng lao động và hồ sơ nhân sự",
      description: "Quản lý hợp đồng lao động và hồ sơ nhân sự",
      icon: "📄",
      defaultTitle: "Quản lý hợp đồng lao động và hồ sơ nhân sự",
      defaultDescription: "Quản lý hợp đồng lao động và hồ sơ nhân sự",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Thực hiện ký kết HĐLD cho nhân sự mới",
            description: "Thực hiện ký kết HĐLD cho nhân sự mới",
            order: 0,
            estimatedHours: 0.25,
          },
          {
            title: "Thực hiện ký kết HĐLD: Gia hạn, thanh lý hợp đồng",
            description: "Thực hiện ký kết HĐLD bao gồm: Gia hạn, thanh lý hợp đồng",
            order: 1,
            estimatedHours: 0.25,
          },
          {
            title: "Kiểm tra và tiếp nhận hồ sơ nhân sự mới",
            description: "Kiểm tra và tiếp nhận hồ sơ nhân sự mới",
            order: 2,
            estimatedHours: 0.125,
          },
          {
            title: "Theo dõi và quản lý hồ sơ nhân sự chính thức",
            description: "Theo dõi và quản lý hồ sơ nhân sự chính thức",
            order: 3,
            estimatedHours: 0.125,
          },
        ],
      },
    },
  });

  console.log("✅ Template 4.2 created");

  // ============================================
  // 4.3. TRIỂN KHAI HOẠT ĐỘNG VỀ QUAN HỆ LAO ĐỘNG
  // ============================================

  const template4_3 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-4-3" },
    update: {},
    create: {
      id: "hr-template-4-3",
      name: "Triển khai hoạt động về quan hệ lao động",
      description: "Triển khai hoạt động về quan hệ lao động",
      icon: "🤝",
      defaultTitle: "Triển khai hoạt động về quan hệ lao động",
      defaultDescription: "Triển khai hoạt động về quan hệ lao động",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Thực hiện hoạt động khen thưởng, bổ nhiệm, điều chuyển, miễn nhiệm",
            description: "Thực hiện hoạt động khen thưởng, bổ nhiệm, điều chuyển, miễn nhiệm,.. CBNV theo đúng quy trình",
            order: 0,
            estimatedHours: 0.25,
          },
          {
            title: "Theo dõi nghỉ phép, nghỉ lễ, nghỉ không lương, nghỉ việc",
            description: "Theo dõi nghỉ phép, nghỉ lễ, nghỉ không lương, nghỉ việc tuân thủ đúng quy trình, quy định của công ty",
            order: 1,
            estimatedHours: 1,
          },
        ],
      },
    },
  });

  console.log("✅ Template 4.3 created");

  // ============================================
  // 4.4. GIẢI QUYẾT CÁC VẤN ĐỀ VỀ QUAN HỆ LAO ĐỘNG
  // ============================================

  const template4_4 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-4-4" },
    update: {},
    create: {
      id: "hr-template-4-4",
      name: "Giải quyết các vấn đề về quan hệ lao động",
      description: "Giải quyết các vấn đề về quan hệ lao động xảy ra trong tổ chức",
      icon: "⚖️",
      defaultTitle: "Giải quyết các vấn đề về quan hệ lao động",
      defaultDescription: "Giải quyết các vấn đề về quan hệ lao động xảy ra trong tổ chức",
      defaultPriority: Priority.HIGH,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Giải quyết các vấn đề về quan hệ lao động",
            description: "Giải quyết các vấn đề về quan hệ lao động xảy ra trong tổ chức",
            order: 0,
            estimatedHours: 1,
          },
        ],
      },
    },
  });

  console.log("✅ Template 4.4 created");

  // ============================================
  // 4.5. BÁO CÁO VÀ ĐÁNH GIÁ HIỆU QUẢ QUAN HỆ LAO ĐỘNG
  // ============================================

  const template4_5 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-4-5" },
    update: {},
    create: {
      id: "hr-template-4-5",
      name: "Báo cáo và đánh giá hiệu quả quan hệ lao động",
      description: "Báo cáo và đánh giá hiệu quả thực hiện quan hệ lao động trong tổ chức",
      icon: "📊",
      defaultTitle: "Báo cáo và đánh giá hiệu quả quan hệ lao động",
      defaultDescription: "Báo cáo và đánh giá hiệu quả thực hiện quan hệ lao động trong tổ chức",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Báo cáo và đánh giá hiệu quả thực hiện quan hệ lao động",
            description: "Báo cáo và đánh giá hiệu quả thực hiện quan hệ lao động trong tổ chức",
            order: 0,
            estimatedHours: 2,
          },
        ],
      },
    },
  });

  console.log("✅ Template 4.5 created");

  // ============================================
  // 5.1. XÂY DỰNG BỘ VĂN HÓA DOANH NGHIỆP
  // ============================================

  const template5_1 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-5-1" },
    update: {},
    create: {
      id: "hr-template-5-1",
      name: "Xây dựng bộ văn hóa doanh nghiệp",
      description: "Xây dựng bộ văn hóa doanh nghiệp: TN, SM, GTCL; Bộ nguyên tắc ứng xử; Kênh truyền thông văn hóa",
      icon: "🏢",
      defaultTitle: "Xây dựng bộ văn hóa doanh nghiệp",
      defaultDescription: "Xây dựng bộ văn hóa doanh nghiệp: TN, SM, GTCL; Bộ nguyên tắc ứng xử; Kênh truyền thông văn hóa",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 2,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng kế hoạch truyền thông văn hóa tháng/quý/năm",
            description: "Xây dựng kế hoạch truyền thông văn hóa tháng/quý/năm",
            order: 0,
            estimatedHours: 3,
          },
          {
            title: "Xây dựng kênh truyền thông văn hóa",
            description: "Xây dựng kênh truyền thông văn hóa",
            order: 1,
            estimatedHours: 2,
          },
          {
            title: "Xây dựng tài liệu truyền thông về văn hóa",
            description: "Xây dựng tài liệu truyền thông về văn hóa",
            order: 2,
            estimatedHours: 10,
          },
          {
            title: "Xây dựng bộ nguyên tắc ứng xử",
            description: "Xây dựng bộ nguyên tắc ứng xử",
            order: 3,
            estimatedHours: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Template 5.1 created");

  // ============================================
  // 5.2. XÂY DỰNG KẾ HOẠCH TRUYỀN THÔNG
  // ============================================

  const template5_2 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-5-2" },
    update: {},
    create: {
      id: "hr-template-5-2",
      name: "Xây dựng kế hoạch truyền thông",
      description: "Xây dựng kế hoạch truyền thông tháng/quý/năm",
      icon: "📅",
      defaultTitle: "Xây dựng kế hoạch truyền thông",
      defaultDescription: "Xây dựng kế hoạch truyền thông tháng/quý/năm",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng kế hoạch truyền thông tháng/quý/năm",
            description: "Xây dựng kế hoạch truyền thông tháng/quý/năm",
            order: 0,
            estimatedHours: 4,
          },
        ],
      },
    },
  });

  console.log("✅ Template 5.2 created");

  // ============================================
  // 5.3. QUẢN LÝ NGÂN SÁCH TRUYỀN THÔNG
  // ============================================

  const template5_3 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-5-3" },
    update: {},
    create: {
      id: "hr-template-5-3",
      name: "Quản lý ngân sách truyền thông",
      description: "Xây dựng, quản lý và kiểm soát ngân sách truyền thông đảm bảo theo định mức",
      icon: "💰",
      defaultTitle: "Quản lý ngân sách truyền thông",
      defaultDescription: "Xây dựng, quản lý và kiểm soát ngân sách truyền thông đảm bảo theo định mức",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng và kiểm soát ngân sách truyền thông",
            description: "Xây dựng và kiểm soát ngân sách truyền thông đảm bảo theo định mức",
            order: 0,
            estimatedHours: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Template 5.3 created");

  // ============================================
  // 5.4. TRIỂN KHAI HOẠT ĐỘNG TRUYỀN THÔNG VĂN HÓA
  // ============================================

  const template5_4 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-5-4" },
    update: {},
    create: {
      id: "hr-template-5-4",
      name: "Triển khai hoạt động truyền thông văn hóa",
      description: "Triển khai hoạt động truyền thông văn hóa trong tổ chức",
      icon: "🎉",
      defaultTitle: "Triển khai hoạt động truyền thông văn hóa",
      defaultDescription: "Triển khai hoạt động truyền thông văn hóa trong tổ chức",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 2,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Tổ chức hoạt động/chương trình gắn kết đội ngũ để truyền thông về văn hóa",
            description: "Tổ chức hoạt động/chương trình gắn kết đội ngũ để truyền thông về văn hóa trong tổ chức",
            order: 0,
            estimatedHours: 2,
          },
          {
            title: "Thiết kế nội dung truyền thông trên các kênh Social",
            description: "Thiết kế nội dung truyền thông trên các kênh Social",
            order: 1,
            estimatedHours: 2,
          },
          {
            title: "Sản xuất, quay dựng các video truyền thông",
            description: "Sản xuất, quay dựng các video truyền thông",
            order: 2,
            estimatedHours: 2,
          },
          {
            title: "Tổ chức các sự kiện nhân các dịp đặc biệt trong năm",
            description: "Tổ chức các sự kiện nhân các dịp đặc biệt trong năm",
            order: 3,
            estimatedHours: 3,
          },
          {
            title: "Tổ chức sự kiện nội bộ (du lịch, sinh nhật, …)",
            description: "Tổ chức sự kiện nội bộ (du lịch, sinh nhật, …)",
            order: 4,
            estimatedHours: 5,
          },
        ],
      },
    },
  });

  console.log("✅ Template 5.4 created");

  // ============================================
  // 5.5. BÁO CÁO VÀ ĐÁNH GIÁ HIỆU QUẢ TRUYỀN THÔNG VĂN HÓA
  // ============================================

  const template5_5 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-5-5" },
    update: {},
    create: {
      id: "hr-template-5-5",
      name: "Báo cáo và đánh giá hiệu quả truyền thông văn hóa",
      description: "Báo cáo và đánh giá hiệu quả hoạt động truyền thông văn hóa",
      icon: "📊",
      defaultTitle: "Báo cáo và đánh giá hiệu quả truyền thông văn hóa",
      defaultDescription: "Báo cáo và đánh giá hiệu quả hoạt động truyền thông văn hóa",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Đo lường và đánh giá mức độ hài lòng về các hoạt động truyền thông văn hóa",
            description: "Đo lường và đánh giá mức độ hài lòng của nhân viên về các hoạt động truyền thông văn hóa thông qua từng sự kiện",
            order: 0,
            estimatedHours: 2,
          },
          {
            title: "Đo lường và đánh giá mức độ hài lòng về môi trường làm việc",
            description: "Đo lường và đánh giá mức độ hài lòng của nhân viên về môi trường làm việc",
            order: 1,
            estimatedHours: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Template 5.5 created");

  // ============================================
  // 6.1. XÂY DỰNG HỆ THỐNG HÀNH CHÍNH
  // ============================================

  const template6_1 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-6-1" },
    update: {},
    create: {
      id: "hr-template-6-1",
      name: "Xây dựng hệ thống hành chính",
      description: "Xây dựng hệ thống hành chính: Quy trình, quy định hành chính; Hướng dẫn các thủ tục hành chính",
      icon: "📋",
      defaultTitle: "Xây dựng hệ thống hành chính",
      defaultDescription: "Xây dựng hệ thống hành chính: Quy trình, quy định hành chính; Hướng dẫn các thủ tục hành chính",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng các quy trình, quy định hành chính trong tổ chức",
            description: "Xây dựng các quy trình, quy định hành chính trong tổ chức",
            order: 0,
            estimatedHours: 8,
          },
          {
            title: "Hướng dẫn thực hiện các thủ tục hành chính trong tổ chức",
            description: "Hướng dẫn thực hiện các thủ tục hành chính trong tổ chức",
            order: 1,
            estimatedHours: 1,
          },
        ],
      },
    },
  });

  console.log("✅ Template 6.1 created");

  // ============================================
  // 6.2. QUẢN LÝ NGÂN SÁCH HÀNH CHÍNH
  // ============================================

  const template6_2 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-6-2" },
    update: {},
    create: {
      id: "hr-template-6-2",
      name: "Quản lý ngân sách hành chính",
      description: "Xây dựng, quản lý và kiểm soát ngân sách hành chính",
      icon: "💰",
      defaultTitle: "Quản lý ngân sách hành chính",
      defaultDescription: "Xây dựng, quản lý và kiểm soát ngân sách hành chính",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng ngân sách hành chính",
            description: "Xây dựng ngân sách hành chính",
            order: 0,
            estimatedHours: 2,
          },
          {
            title: "Quản lý và kiểm soát ngân sách",
            description: "Quản lý và kiểm soát ngân sách",
            order: 1,
            estimatedHours: 1,
          },
          {
            title: "Báo cáo về việc sử dụng ngân sách hành chính",
            description: "Báo cáo về việc sử dụng ngân sách hành chính",
            order: 2,
            estimatedHours: 1,
          },
        ],
      },
    },
  });

  console.log("✅ Template 6.2 created");

  // ============================================
  // 6.3. ĐẢM BẢO CÔNG TÁC HẬU CẦN
  // ============================================

  const template6_3 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-6-3" },
    update: {},
    create: {
      id: "hr-template-6-3",
      name: "Đảm bảo công tác hậu cần",
      description: "Đảm bảo về công tác hậu cần: Trang thiết bị làm việc; Môi trường làm việc",
      icon: "📦",
      defaultTitle: "Đảm bảo công tác hậu cần",
      defaultDescription: "Đảm bảo về công tác hậu cần: Trang thiết bị làm việc; Môi trường làm việc",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 2,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Xây dựng tiêu chuẩn sử dụng và cấp phát tài sản, TTB làm việc",
            description: "Xây dựng tiêu chuẩn sử dụng và cấp phát tài sản, TTB làm việc trong công ty theo từng vị trí chức danh",
            order: 0,
            estimatedHours: 3,
          },
          {
            title: "Tiếp nhận nhu cầu về việc sử dụng TTB, tài sản khối hỗ trợ",
            description: "Tiếp nhận nhu cầu về việc sử dụng TTB, tài sản khối hỗ trợ trong công ty",
            order: 1,
            estimatedHours: 0.25,
          },
          {
            title: "Thực hiện mua sắm TTB, tài sản theo nhu cầu",
            description: "Thực hiện mua sắm TTB, tài sản theo nhu cầu từ các phòng ban/bộ phận khối hỗ trợ đảm bảo chất lượng, giá cả, ...",
            order: 2,
            estimatedHours: 3,
          },
          {
            title: "Cấp phát và theo dõi TTB, tài sản",
            description: "Cấp phát và theo dõi TTB, tài sản",
            order: 3,
            estimatedHours: 2,
          },
          {
            title: "Soạn thảo và lưu trữ các văn bản hành chính trong Công ty",
            description: "Soạn thảo và lưu trữ các văn bản hành chính trong Công ty",
            order: 4,
            estimatedHours: 0.1,
          },
          {
            title: "Thanh toán các khoản chi phí: Điện thoại, Internet, dịch vụ văn phòng",
            description: "Thanh toán các khoản chi phí: Điện thoại, Internet, dịch vụ văn phòng",
            order: 5,
            estimatedHours: 0.5,
          },
        ],
      },
    },
  });

  console.log("✅ Template 6.3 created");

  // ============================================
  // 6.4. ĐẢM BẢO CÁC HOẠT ĐỘNG QUẢN LÝ HÀNH CHÍNH
  // ============================================

  const template6_4 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-6-4" },
    update: {},
    create: {
      id: "hr-template-6-4",
      name: "Đảm bảo các hoạt động quản lý hành chính",
      description: "Đảm bảo các hoạt động quản lý hành chính",
      icon: "🏛️",
      defaultTitle: "Đảm bảo các hoạt động quản lý hành chính",
      defaultDescription: "Đảm bảo các hoạt động quản lý hành chính",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Thực hiện thủ tục đăng ký các loại hồ sơ pháp lý trong công ty",
            description: "Là đầu mối thực hiện thủ tục đăng ký các loại hồ sơ pháp lý trong công ty",
            order: 0,
            estimatedHours: 2,
          },
          {
            title: "Tiếp nhận và quản lý công văn, giấy tờ đi đến trong công ty",
            description: "Tiếp nhận và quản lý công văn, giấy tờ đi đến trong công ty chuyển đến cho các phòng ban/bộ phận",
            order: 1,
            estimatedHours: 1,
          },
          {
            title: "Quản lý phòng họp",
            description: "Quản lý phòng họp",
            order: 2,
            estimatedHours: 1,
          },
          {
            title: "Quản lý vệ sinh văn phòng",
            description: "Quản lý vệ sinh văn phòng",
            order: 3,
            estimatedHours: 1,
          },
          {
            title: "Quản lý con dấu và các loại hồ sơ pháp lý của công ty",
            description: "Quản lý con dấu và các loại hồ sơ pháp lý của công ty",
            order: 4,
            estimatedHours: 0.5,
          },
        ],
      },
    },
  });

  console.log("✅ Template 6.4 created");

  // ============================================
  // 6.5. BÁO CÁO VÀ ĐÁNH GIÁ HIỆU QUẢ HOẠT ĐỘNG HÀNH CHÍNH
  // ============================================

  const template6_5 = await prisma.taskTemplate.upsert({
    where: { id: "hr-template-6-5" },
    update: {},
    create: {
      id: "hr-template-6-5",
      name: "Báo cáo và đánh giá hiệu quả hoạt động hành chính",
      description: "Báo cáo và đánh giá hiệu quả hoạt động hành chính",
      icon: "📊",
      defaultTitle: "Báo cáo và đánh giá hiệu quả hoạt động hành chính",
      defaultDescription: "Báo cáo và đánh giá hiệu quả hoạt động hành chính",
      defaultPriority: Priority.MEDIUM,
      defaultCategoryId: hrCategory?.id,
      estimatedDays: 1,
      isPublic: true,
      createdById: admin.id,
      checklistItems: {
        create: [
          {
            title: "Báo cáo và đánh giá hiệu quả hoạt động hành chính",
            description: "Báo cáo và đánh giá hiệu quả hoạt động hành chính",
            order: 0,
            estimatedHours: 2,
          },
        ],
      },
    },
  });

  console.log("✅ Template 6.5 created");

  console.log("✅ All HR templates seeded successfully");
}

