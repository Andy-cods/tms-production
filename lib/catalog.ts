// Re-export types
export type {
  CatalogRule,
  CatalogCategory,
  CatalogItem,
  CatalogTemplate,
  CatalogTemplateInput,
} from "./catalog/types";

import type {
  CatalogRule,
  CatalogCategory,
  CatalogItem,
  CatalogTemplate,
  CatalogTemplateInput,
} from "./catalog/types";

// Import finance items and templates (moved from sales)
import {
  FINANCE_CATALOG_ITEMS,
  financeTemplateDefinitions,
} from "./catalog/finance";

// Import accounting items and templates
import {
  ACCOUNTING_CATALOG_ITEMS,
  accountingTemplateDefinitions,
} from "./catalog/accounting";

// Import customer service items and templates
import {
  CUSTOMER_SERVICE_CATALOG_ITEMS,
  customerServiceTemplateDefinitions,
} from "./catalog/customer-service";

// Re-export finance items
export { FINANCE_CATALOG_ITEMS } from "./catalog/finance";

// Re-export accounting items
export { ACCOUNTING_CATALOG_ITEMS } from "./catalog/accounting";

// Re-export customer service items
export { CUSTOMER_SERVICE_CATALOG_ITEMS } from "./catalog/customer-service";

export const CATALOG_ITEMS: CatalogItem[] = [
  // Designer
  {
    id: "designer-video-under-30-basic",
    category: "DESIGNER",
    name: "Video dưới 30 giây - cơ bản",
    description: "Video edit cơ bản, chèn text, dựng nhạc, cắt ảnh cơ bản",
    estimatedMinutes: 120,
  },
  {
    id: "designer-video-under-30-subtitle",
    category: "DESIGNER",
    name: "Video dưới 30 giây - subtitle/caption",
    description: "Video kiểu text hiệu ứng, chạy phụ đề, chuyển cảnh",
    estimatedMinutes: 180,
  },
  {
    id: "designer-video-under-30-fastcut",
    category: "DESIGNER",
    name: "Video dưới 30 giây - fast cut/highlight",
    description: "Đồng bộ nhạc, tổng hợp khoảnh khắc, nhiều hiệu ứng",
    estimatedMinutes: 240,
  },
  {
    id: "designer-video-under-30-tutorial",
    category: "DESIGNER",
    name: "Video dưới 30 giây - tutorial/documentary",
    description: "Video phỏng vấn, thực tế, câu chuyện, TVC, quảng cáo",
    estimatedMinutes: 300,
  },
  {
    id: "designer-video-30-60-basic",
    category: "DESIGNER",
    name: "Video 30-60 giây - cơ bản",
    description: "Video edit cơ bản, chèn text, dựng nhạc, cắt ảnh cơ bản",
    estimatedMinutes: 180,
  },
  {
    id: "designer-video-30-60-subtitle",
    category: "DESIGNER",
    name: "Video 30-60 giây - subtitle/caption",
    description: "Video kiểu text hiệu ứng, chạy phụ đề, chuyển cảnh",
    estimatedMinutes: 240,
  },
  {
    id: "designer-video-30-60-fastcut",
    category: "DESIGNER",
    name: "Video 30-60 giây - fast cut/highlight",
    description: "Đồng bộ nhạc, tổng hợp khoảnh khắc, nhiều hiệu ứng",
    estimatedMinutes: 300,
  },
  {
    id: "designer-video-30-60-tutorial",
    category: "DESIGNER",
    name: "Video 30-60 giây - tutorial/documentary",
    description: "Video phỏng vấn, thực tế, câu chuyện, TVC, quảng cáo",
    estimatedMinutes: 360,
  },
  {
    id: "designer-video-extra-minute",
    category: "DESIGNER",
    name: "Video - cộng thêm 1 phút thời lượng",
    description: "Gia hạn video, cộng thêm 1 phút nội dung",
    estimatedMinutes: 90,
    notes: "Dùng như phần bổ sung, cộng thêm 90 phút cho mỗi phút phát sinh",
  },
  {
    id: "designer-image-basic",
    category: "DESIGNER",
    name: "Thiết kế 1 ảnh - cơ bản",
    description: "Bài đăng ảnh typo, quote, meme, social cơ bản",
    estimatedMinutes: 45,
  },
  {
    id: "designer-image-advanced",
    category: "DESIGNER",
    name: "Thiết kế 1 ảnh - nâng cao",
    description: "Ảnh feedback bài đăng, bài visual động, infographic, banner",
    estimatedMinutes: 67.5,
  },
  {
    id: "designer-image-extra-two",
    category: "DESIGNER",
    name: "Thiết kế ảnh - thêm mỗi 2 ảnh",
    description: "Thêm 2 ảnh bổ sung cho bộ thiết kế",
    estimatedMinutes: 30,
    notes: "Cộng thêm 30 phút cho mỗi 2 ảnh bổ sung",
  },

  // Content
  {
    id: "content-caption-short",
    category: "CONTENT",
    name: "Caption ngắn / note / update",
    description: "Đăng bài ngắn, cập nhật nhanh cho kênh",
    estimatedMinutes: 15,
  },
  {
    id: "content-order-brief",
    category: "CONTENT",
    name: "Order ảnh design / Order brief cho client",
    description: "Soạn yêu cầu ảnh design hoặc brief nội dung gửi khách",
    estimatedMinutes: 15,
  },
  {
    id: "content-post-long",
    category: "CONTENT",
    name: "Bài post / caption dài",
    description: "Bài viết tiêu chuẩn cho chiến dịch, storytelling",
    estimatedMinutes: 45,
  },
  {
    id: "content-post-deep",
    category: "CONTENT",
    name: "Bài post chuyên sâu",
    description: "Bài viết chuyên sâu, nhiều insight, định hướng campaign",
    estimatedMinutes: 90,
  },
  {
    id: "content-pr-article",
    category: "CONTENT",
    name: "Bài PR",
    description: "Bài PR 800-1200 chữ, kể câu chuyện brand, how-to",
    estimatedMinutes: 45,
  },
  {
    id: "content-seo-blog-standard",
    category: "CONTENT",
    name: "Bài SEO / blog chuẩn",
    description: "Bài 1200-2000 từ, nghiên cứu keyword, outline & link nội bộ",
    estimatedMinutes: 120,
  },
  {
    id: "content-seo-blog-extended",
    category: "CONTENT",
    name: "Bài SEO / blog nâng cao",
    description: "Bài 2000-2500+ từ, nghiên cứu sâu, ví dụ CASE, đề xuất bonus",
    estimatedMinutes: 180,
  },
  {
    id: "content-script-short-basic",
    category: "CONTENT",
    name: "Kịch bản video ngắn - social",
    description: "Kịch bản TikTok/short form định hướng chung",
    estimatedMinutes: 45,
  },
  {
    id: "content-script-short-client",
    category: "CONTENT",
    name: "Kịch bản video ngắn - theo brief khách",
    description: "Kịch bản theo brief/khách hàng, bổ sung insight",
    estimatedMinutes: 75,
  },
  {
    id: "content-script-short-tvc",
    category: "CONTENT",
    name: "Kịch bản TVC / video sáng tạo",
    description: "Kịch bản TVC, video dài, yêu cầu sáng tạo cao",
    estimatedMinutes: 105,
  },
  {
    id: "content-plan",
    category: "CONTENT",
    name: "Lên plan nội dung",
    description: "Plan nội dung tổng thể, cập nhật hàng tuần",
    estimatedMinutes: 90,
  },
  {
    id: "content-video-shoot-basic",
    category: "CONTENT",
    name: "Quay video ngắn - cơ bản",
    description: "Quay TikTok định hướng kịch bản chung",
    estimatedMinutes: 30,
  },
  {
    id: "content-video-shoot-advanced",
    category: "CONTENT",
    name: "Quay video ngắn - có brief",
    description: "Quay TikTok theo brief chi tiết / có thoại",
    estimatedMinutes: 45,
  },
  {
    id: "content-internal-comms",
    category: "CONTENT",
    name: "Truyền thông nội bộ",
    description: "Phối hợp xây kế hoạch truyền thông nội bộ / kịch bản",
    estimatedMinutes: 45,
  },
  {
    id: "content-check-domain",
    category: "CONTENT",
    name: "Check content / domain / page",
    description: "Rà soát content, domain, page trước khi xuất bản",
    estimatedMinutes: 15,
  },

  // Ads
  {
    id: "ads-research-plan",
    category: "ADS",
    name: "Nghiên cứu & lên ads plan",
    description: "Phân tích số liệu, insight, lập kế hoạch ads",
    estimatedMinutes: 90,
  },
  {
    id: "ads-technical-setup",
    category: "ADS",
    name: "Setup kỹ thuật",
    description: "Add pixel, tài khoản, topup, cấu hình tracking",
    estimatedMinutes: 60,
  },
  {
    id: "ads-campaign-setup",
    category: "ADS",
    name: "Campaign setup",
    description: "Thiết lập chiến dịch, nhóm quảng cáo, target",
    estimatedMinutes: 15,
  },
  {
    id: "ads-weekly-report",
    category: "ADS",
    name: "Báo cáo tuần",
    description: "Báo cáo hiệu quả chiến dịch hàng tuần",
    estimatedMinutes: 45,
  },
  {
    id: "ads-monthly-report",
    category: "ADS",
    name: "Báo cáo tháng",
    description: "Báo cáo tổng kết dự án, phân tích sâu",
    estimatedMinutes: 135,
  },
  {
    id: "ads-issue-handling",
    category: "ADS",
    name: "Xử lý vấn đề phát sinh",
    description: "VPCS, lỗi tracking, lỗi reject, sự cố tài khoản",
    estimatedMinutes: 45,
  },
  {
    id: "ads-budget-optimization",
    category: "ADS",
    name: "Scale / tối ưu ngân sách",
    description: "Scale hoặc giảm ngân sách, điều chỉnh chỉ số",
    estimatedMinutes: 15,
  },
  {
    id: "ads-creative-optimization",
    category: "ADS",
    name: "Tối ưu creative theo kết quả",
    description: "Phân tích creative, đề xuất asset mới",
    estimatedMinutes: 30,
  },

  // Planner
  {
    id: "planner-research-overview",
    category: "PLANNER",
    name: "Nghiên cứu & thu thập dữ liệu",
    description: "Tổng hợp số liệu, xu hướng ngành, key player",
    estimatedMinutes: 75,
  },
  {
    id: "planner-customer-insight",
    category: "PLANNER",
    name: "Chân dung khách hàng & insight",
    description: "Khách hàng: nhu cầu, insight theo ngành",
    estimatedMinutes: 60,
  },
  {
    id: "planner-usp-evaluation",
    category: "PLANNER",
    name: "Định giá USP, giá trị thương hiệu",
    description: "Định vị USP, đánh giá đề xuất giá trị",
    estimatedMinutes: 45,
  },
  {
    id: "planner-case-review",
    category: "PLANNER",
    name: "Thu thập hiệu quả chiến dịch / case trước",
    description: "Tổng hợp case study, benchmark hiệu quả",
    estimatedMinutes: 30,
  },
  {
    id: "planner-strategy-outline",
    category: "PLANNER",
    name: "Hoạch định chiến lược",
    description: "Chọn hướng đi, key strategy cho brand/campaign",
    estimatedMinutes: 240,
    notes: "Bao gồm phân bổ Awareness → Consideration → Conversion",
  },
  {
    id: "planner-coordination",
    category: "PLANNER",
    name: "Triển khai & phối hợp",
    description: "Họp team Creative, Account, Ads để sync plan",
    estimatedMinutes: 90,
  },
  {
    id: "planner-optimization",
    category: "PLANNER",
    name: "Theo dõi & tối ưu chiến dịch",
    description: "Kiểm tra số liệu, góp ý tối ưu định kỳ",
    estimatedMinutes: 90,
  },
  {
    id: "planner-weekly-report",
    category: "PLANNER",
    name: "Báo cáo & tổng hợp tuần",
    description: "Cập nhật tiến độ, insight, đề xuất chỉnh",
    estimatedMinutes: 60,
  },
  // Include finance items (moved from sales)
  ...FINANCE_CATALOG_ITEMS,
  // Include accounting items
  ...ACCOUNTING_CATALOG_ITEMS,
  // Include customer service items
  ...CUSTOMER_SERVICE_CATALOG_ITEMS,
];

const ITEM_MINUTES_MAP = new Map<string, number>(
  CATALOG_ITEMS.map((item) => [item.id, item.estimatedMinutes])
);

const sumCatalogMinutes = (ids: string[]): number =>
  ids.reduce((total, id) => total + (ITEM_MINUTES_MAP.get(id) ?? 0), 0);

const marketingTemplateDefinitions: CatalogTemplateInput[] = [
  {
    id: "marketing-video-snack-basic",
    icon: "🎬",
    name: "Video Snack - Cơ bản",
    description:
      "Quy trình sản xuất video ngắn cơ bản: viết kịch bản, quay và dựng clip <30 giây.",
    catalogItemIds: [
      "content-script-short-basic",
      "content-video-shoot-basic",
      "designer-video-under-30-basic",
      "content-check-domain",
    ],
    tags: ["video", "short-form", "basic"],
  },
  {
    id: "marketing-video-snack-subtitle",
    icon: "🎞️",
    name: "Video Snack - Phụ đề",
    description:
      "Sản xuất video ngắn có phụ đề và hiệu ứng chuyển cảnh dành cho kênh social.",
    catalogItemIds: [
      "content-script-short-client",
      "content-video-shoot-advanced",
      "designer-video-under-30-subtitle",
      "content-check-domain",
    ],
    tags: ["video", "subtitle", "social"],
  },
  {
    id: "marketing-video-snack-premium",
    icon: "🏆",
    name: "Video Snack - Cao cấp",
    description:
      "Video premium mang tính câu chuyện/TVC với dựng phức tạp và thời lượng mở rộng.",
    catalogItemIds: [
      "content-script-short-tvc",
      "content-video-shoot-advanced",
      "designer-video-under-30-tutorial",
      "designer-video-extra-minute",
      "content-check-domain",
    ],
    tags: ["video", "premium", "story"],
  },
  {
    id: "marketing-video-hero-basic",
    icon: "🎥",
    name: "Video Hero 30-60s - Cơ bản",
    description:
      "Chiến dịch video hero 30-60 giây cơ bản với quay dựng chuẩn và kiểm tra nội dung.",
    catalogItemIds: [
      "content-script-short-client",
      "content-video-shoot-advanced",
      "designer-video-30-60-basic",
      "content-check-domain",
    ],
    tags: ["video", "hero", "basic"],
  },
  {
    id: "marketing-video-hero-subtitle",
    icon: "📺",
    name: "Video Hero 30-60s - Phụ đề",
    description:
      "Video hero 30-60 giây với phụ đề, caption và chuyển cảnh nâng cao.",
    catalogItemIds: [
      "content-script-short-client",
      "designer-video-30-60-subtitle",
      "content-check-domain",
    ],
    tags: ["video", "hero", "subtitle"],
  },
  {
    id: "marketing-video-hero-documentary",
    icon: "🎬",
    name: "Video Hero 30-60s - Phim tài liệu",
    description:
      "Video hero dạng documentary/tvc với thời lượng dài, cần dựng nâng cao và bonus thời gian.",
    catalogItemIds: [
      "content-script-short-tvc",
      "content-video-shoot-advanced",
      "designer-video-30-60-tutorial",
      "designer-video-extra-minute",
      "content-check-domain",
    ],
    tags: ["video", "hero", "documentary"],
  },
  {
    id: "marketing-visual-pack-basic",
    icon: "🖼️",
    name: "Bộ Visual - Cơ bản",
    description:
      "Thiết kế ảnh đơn giản cho social kèm caption ngắn và check nội dung.",
    catalogItemIds: [
      "designer-image-basic",
      "content-caption-short",
      "content-check-domain",
    ],
    tags: ["design", "social"],
  },
  {
    id: "marketing-visual-pack-advanced",
    icon: "📣",
    name: "Bộ Visual - Nâng cao",
    description:
      "Thiết kế nâng cao với visual động/infographic và bài viết dài.",
    catalogItemIds: [
      "designer-image-advanced",
      "content-post-long",
      "content-order-brief",
      "content-check-domain",
    ],
    tags: ["design", "content"],
  },
  {
    id: "marketing-visual-pack-batch",
    icon: "🗂️",
    name: "Bộ Visual - Hàng loạt",
    description:
      "Set design nhiều ảnh (batch) kèm bài viết chuyên sâu và kiểm duyệt.",
    catalogItemIds: [
      "designer-image-extra-two",
      "content-post-deep",
      "content-check-domain",
    ],
    tags: ["design", "batch"],
  },
  {
    id: "marketing-content-pr",
    icon: "📰",
    name: "Nội dung - Bài PR",
    description:
      "Soạn brief, viết bài PR chuẩn và kiểm tra nội dung trước khi xuất bản.",
    catalogItemIds: [
      "content-order-brief",
      "content-pr-article",
      "content-check-domain",
    ],
    tags: ["content", "pr"],
  },
  {
    id: "marketing-content-seo-standard",
    icon: "🔍",
    name: "Nội dung - SEO Chuẩn",
    description:
      "Viết bài SEO chuẩn 1200-2000 chữ, lập plan và kiểm tra trước khi đăng.",
    catalogItemIds: [
      "content-seo-blog-standard",
      "content-plan",
      "content-check-domain",
    ],
    tags: ["content", "seo"],
  },
  {
    id: "marketing-content-seo-premium",
    icon: "💎",
    name: "Nội dung - SEO Cao cấp",
    description:
      "Bài SEO nâng cao 2000+ chữ, phối hợp truyền thông nội bộ và kiểm duyệt.",
    catalogItemIds: [
      "content-seo-blog-extended",
      "content-plan",
      "content-internal-comms",
      "content-check-domain",
    ],
    tags: ["content", "seo", "premium"],
  },
  {
    id: "marketing-content-weekly-plan",
    icon: "🗓️",
    name: "Kế hoạch Nội dung Hàng tuần",
    description:
      "Lập plan nội dung tuần, cập nhật caption ngắn và sync nội bộ.",
    catalogItemIds: [
      "content-plan",
      "content-caption-short",
      "content-internal-comms",
      "content-check-domain",
    ],
    tags: ["content", "plan", "weekly"],
  },
  {
    id: "marketing-ads-campaign-launch",
    icon: "🚀",
    name: "Quảng cáo - Khởi chạy Chiến dịch",
    description:
      "Chuẩn bị và khởi chạy chiến dịch quảng cáo mới từ nghiên cứu đến setup.",
    catalogItemIds: [
      "ads-research-plan",
      "ads-technical-setup",
      "ads-campaign-setup",
    ],
    tags: ["ads", "launch"],
  },
  {
    id: "marketing-ads-optimization-sprint",
    icon: "⚙️",
    name: "Quảng cáo - Tối ưu Nhanh",
    description:
      "Tối ưu chiến dịch nhanh: xử lý sự cố, tinh chỉnh ngân sách và creative.",
    catalogItemIds: [
      "ads-issue-handling",
      "ads-budget-optimization",
      "ads-creative-optimization",
    ],
    tags: ["ads", "optimization"],
  },
  {
    id: "marketing-ads-weekly-report",
    icon: "📈",
    name: "Quảng cáo - Báo cáo Tuần",
    description:
      "Báo cáo hiệu quả chiến dịch hàng tuần và rà soát tối ưu.",
    catalogItemIds: [
      "ads-weekly-report",
      "ads-issue-handling",
      "ads-budget-optimization",
    ],
    tags: ["ads", "weekly"],
  },
  {
    id: "marketing-ads-monthly-review",
    icon: "📝",
    name: "Quảng cáo - Tổng kết Tháng",
    description:
      "Tổng hợp hiệu quả chiến dịch theo tháng và chuẩn bị insight cho kế hoạch tiếp theo.",
    catalogItemIds: [
      "ads-monthly-report",
      "ads-research-plan",
    ],
    tags: ["ads", "monthly", "report"],
  },
  {
    id: "marketing-strategy-discovery",
    icon: "🔎",
    name: "Chiến lược - Khám phá",
    description:
      "Giai đoạn khám phá: nghiên cứu thị trường, insight khách hàng và đánh giá USP.",
    catalogItemIds: [
      "planner-research-overview",
      "planner-customer-insight",
      "planner-usp-evaluation",
      "planner-case-review",
    ],
    tags: ["strategy", "discovery"],
  },
  {
    id: "marketing-strategy-blueprint",
    icon: "🧭",
    name: "Chiến lược - Kế hoạch tổng thể",
    description:
      "Xây dựng chiến lược tổng thể và phối hợp cùng các team triển khai.",
    catalogItemIds: [
      "planner-strategy-outline",
      "planner-coordination",
    ],
    tags: ["strategy", "planning"],
  },
  {
    id: "marketing-strategy-optimization",
    icon: "♻️",
    name: "Chiến lược - Tối ưu hóa",
    description:
      "Theo dõi, tối ưu chiến dịch và báo cáo định kỳ.",
    catalogItemIds: [
      "planner-optimization",
      "planner-weekly-report",
    ],
    tags: ["strategy", "optimization"],
  },
];

export const MARKETING_TEMPLATES: CatalogTemplate[] = marketingTemplateDefinitions.map(
  (template) => ({
    ...template,
    estimatedMinutes:
      template.estimatedMinutes ?? sumCatalogMinutes(template.catalogItemIds),
  })
);

export const FINANCE_TEMPLATES: CatalogTemplate[] = financeTemplateDefinitions.map(
  (template) => ({
    ...template,
    estimatedMinutes:
      template.estimatedMinutes ?? sumCatalogMinutes(template.catalogItemIds),
  })
);

export const ACCOUNTING_TEMPLATES: CatalogTemplate[] = accountingTemplateDefinitions.map(
  (template) => ({
    ...template,
    estimatedMinutes:
      template.estimatedMinutes ?? sumCatalogMinutes(template.catalogItemIds),
  })
);

export const CUSTOMER_SERVICE_TEMPLATES: CatalogTemplate[] = customerServiceTemplateDefinitions.map(
  (template) => ({
    ...template,
    estimatedMinutes:
      template.estimatedMinutes ?? sumCatalogMinutes(template.catalogItemIds),
  })
);

const CATALOG_RULES: Record<string, CatalogRule> = Object.fromEntries(
  [
    ...CATALOG_ITEMS.map((item) => [
      item.id,
      {
        enforceFixedTime: true,
        fixedMinutes: item.estimatedMinutes,
      } as CatalogRule,
    ]),
    ...MARKETING_TEMPLATES.map((template) => [
      template.id,
      {
        enforceFixedTime: true,
        fixedMinutes: template.estimatedMinutes,
      } as CatalogRule,
    ]),
    ...FINANCE_TEMPLATES.map((template) => [
      template.id,
      {
        enforceFixedTime: true,
        fixedMinutes: template.estimatedMinutes,
      } as CatalogRule,
    ]),
    ...ACCOUNTING_TEMPLATES.map((template) => [
      template.id,
      {
        enforceFixedTime: true,
        fixedMinutes: template.estimatedMinutes,
      } as CatalogRule,
    ]),
    ...CUSTOMER_SERVICE_TEMPLATES.map((template) => [
      template.id,
      {
        enforceFixedTime: true,
        fixedMinutes: template.estimatedMinutes,
      } as CatalogRule,
    ]),
  ]
);

export function getCatalogRule(templateId?: string | null): CatalogRule | null {
  if (!templateId) return null;
  return CATALOG_RULES[templateId] ?? null;
}

export function getCatalogItem(templateId?: string | null): CatalogItem | undefined {
  if (!templateId) return undefined;
  return CATALOG_ITEMS.find((item) => item.id === templateId);
}

export function getCatalogTemplate(templateId?: string | null): CatalogTemplate | undefined {
  if (!templateId) return undefined;
  return [...MARKETING_TEMPLATES, ...FINANCE_TEMPLATES, ...ACCOUNTING_TEMPLATES, ...CUSTOMER_SERVICE_TEMPLATES].find((template) => template.id === templateId);
}

export function computeFixedDeadline(rule: CatalogRule, now: Date = new Date()): Date {
  const base = new Date(now);
  if (rule.fixedMinutes && rule.fixedMinutes > 0) {
    base.setMinutes(base.getMinutes() + rule.fixedMinutes);
    return base;
  }
  if (rule.fixedHours && rule.fixedHours > 0) {
    base.setHours(base.getHours() + rule.fixedHours);
    return base;
  }
  if (rule.fixedDays && rule.fixedDays > 0) {
    base.setDate(base.getDate() + rule.fixedDays);
    return base;
  }
  // Fallback: 24h
  base.setHours(base.getHours() + 24);
  return base;
}
