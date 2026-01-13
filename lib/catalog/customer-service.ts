import type { CatalogItem, CatalogTemplate, CatalogTemplateInput } from "./types";

// Customer Service Catalog Items
export const CUSTOMER_SERVICE_CATALOG_ITEMS: CatalogItem[] = [
  // Quản lý các nền tảng, vận hành và Phát triển sản phẩm, dịch vụ
  // 1.1. Đàm phán chính sách nền tảng
  {
    id: "cs-platform-research-evaluation",
    category: "CUSTOMER_SERVICE",
    name: "Nghiên cứu và đánh giá các nền tảng tiềm năng",
    description: "Nghiên cứu và đánh giá các nền tảng tiềm năng trong lĩnh vực quảng cáo",
    estimatedMinutes: 240,
  },
  {
    id: "cs-platform-contact-finding",
    category: "CUSTOMER_SERVICE",
    name: "Tìm kiếm người phụ trách trực tiếp nền tảng",
    description: "Tìm kiếm người phụ trách trực tiếp liên quan đến sản phẩm, dịch vụ mà BC đang muốn hợp tác với nền tảng",
    estimatedMinutes: 180,
  },
  {
    id: "cs-platform-negotiation-planning",
    category: "CUSTOMER_SERVICE",
    name: "Lên kế hoạch họp và đàm phán với nền tảng",
    description: "Phụ trách lên kế hoạch họp, đàm phán điều khoản hợp đồng, chiết khấu, chính sách thanh toán giữa công ty với nền tảng",
    estimatedMinutes: 300,
  },
  {
    id: "cs-platform-contract-completion",
    category: "CUSTOMER_SERVICE",
    name: "Hoàn thiện hợp đồng hợp tác",
    description: "Hoàn thiện hợp đồng hợp tác",
    estimatedMinutes: 180,
  },

  // 1.2. Quản lý chất lượng và hiệu quả
  {
    id: "cs-platform-efficiency-tools",
    category: "CUSTOMER_SERVICE",
    name: "Xây dựng bộ công cụ đánh giá hiệu quả kinh doanh",
    description: "Xây dựng bộ công cụ nội bộ đánh giá hiệu quả kinh doanh của nền tảng",
    estimatedMinutes: 480,
  },
  {
    id: "cs-platform-performance-monitoring",
    category: "CUSTOMER_SERVICE",
    name: "Theo dõi và đánh giá hiệu quả hoạt động kinh doanh",
    description: "Theo dõi và đánh giá hiệu quả hoạt động kinh doanh trên nền tảng",
    estimatedMinutes: 120,
  },
  {
    id: "cs-platform-risk-control-tools",
    category: "CUSTOMER_SERVICE",
    name: "Xây dựng bộ công cụ kiểm soát rủi ro",
    description: "Xây dựng bộ công cụ để kiểm soát các rủi ro",
    estimatedMinutes: 360,
  },
  {
    id: "cs-platform-issue-coordination",
    category: "CUSTOMER_SERVICE",
    name: "Phối hợp xử lý vấn đề phát sinh",
    description: "Phối hợp với nội bộ và nền tảng để xử lý các vấn đề phát sinh trong quá trình làm việc, đảm bảo cam kết về chất lượng và tiến độ",
    estimatedMinutes: 180,
  },
  {
    id: "cs-platform-supply-chain-coordination",
    category: "CUSTOMER_SERVICE",
    name: "Phối hợp đảm bảo chuỗi cung ứng hoạt động hiệu quả",
    description: "Làm việc với các bộ phận liên quan (vận hành, kế toán) để đảm bảo chuỗi cung ứng hoạt động hiệu quả, chính xác và đồng bộ",
    estimatedMinutes: 120,
  },

  // 1.3. Lập kế hoạch tham mưu
  {
    id: "cs-platform-evaluation-framework",
    category: "CUSTOMER_SERVICE",
    name: "Xây dựng bộ khung kế hoạch đánh giá nền tảng",
    description: "Xây dựng bộ khung kế hoạch để đánh giá chung và chi tiết cho các nền tảng",
    estimatedMinutes: 480,
  },
  {
    id: "cs-platform-competitor-analysis",
    category: "CUSTOMER_SERVICE",
    name: "Đánh giá và báo cáo điểm mạnh/yếu so với đối thủ",
    description: "Đánh giá và báo cáo định kỳ điểm mạnh và điểm yếu so với các đối thủ cạnh tranh",
    estimatedMinutes: 360,
  },
  {
    id: "cs-platform-opportunity-assessment",
    category: "CUSTOMER_SERVICE",
    name: "Đánh giá cơ hội kinh doanh và tối đa hóa lợi nhuận",
    description: "Đánh giá và báo các các cơ hội kinh doanh và tối đa hóa lợi nhuận",
    estimatedMinutes: 300,
  },

  // 1.4. Cải tiến
  {
    id: "cs-platform-advisory",
    category: "CUSTOMER_SERVICE",
    name: "Tham mưu cho Ban Giám đốc và các phòng ban",
    description: "Tham mưu cho Ban Giám đốc và Phòng Kinh doanh, Phòng Marketing",
    estimatedMinutes: 120,
  },
  {
    id: "cs-platform-improvement-proposals",
    category: "CUSTOMER_SERVICE",
    name: "Đề xuất phương án thay thế hoặc cải tiến",
    description: "Đề xuất phương án thay thế hoặc cải tiến trong trường hợp phát sinh vấn đề",
    estimatedMinutes: 240,
  },
  {
    id: "cs-platform-optimization",
    category: "CUSTOMER_SERVICE",
    name: "Tối ưu hóa quy trình và công cụ",
    description: "Tối ưu hóa quy trình, công cụ nội bộ và nền tảng để đạt hiệu suất tốt hơn",
    estimatedMinutes: 360,
  },

  // Quản lý đào tạo và chính sách nền tảng
  {
    id: "cs-training-materials-development",
    category: "CUSTOMER_SERVICE",
    name: "Tổng hợp và phát triển tài liệu đào tạo",
    description: "Tổng hợp và cập nhật tài liệu đào tạo của các nền tảng",
    estimatedMinutes: 300,
  },
  {
    id: "cs-internal-training-coordination",
    category: "CUSTOMER_SERVICE",
    name: "Phối hợp với HCNS triển khai đào tạo nội bộ",
    description: "Phối hợp với HCNS triển khai đào tạo nội bộ",
    estimatedMinutes: 180,
  },
  {
    id: "cs-platform-policy-update",
    category: "CUSTOMER_SERVICE",
    name: "Cập nhật chính sách mới của nền tảng",
    description: "Cập nhật và phổ biến chính sách mới đến nội bộ",
    estimatedMinutes: 120,
  },

  // Báo cáo và các công việc khác
  {
    id: "cs-professional-report",
    category: "CUSTOMER_SERVICE",
    name: "Hoàn thành báo cáo chuyên môn",
    description: "Hoàn thành báo cáo chuyên môn: Dữ liệu báo cáo đầy đủ, chính xác",
    estimatedMinutes: 240,
  },
  {
    id: "cs-internal-tasks-completion",
    category: "CUSTOMER_SERVICE",
    name: "Hoàn thành các đầu việc nội bộ được giao",
    description: "Hoàn thành các đầu việc nội bộ được giao đúng hạn",
    estimatedMinutes: 120,
  },
];

// Customer Service Template Definitions
const customerServiceTemplateDefinitions: CatalogTemplateInput[] = [
  {
    id: "cs-platform-policy-negotiation",
    icon: "🤝",
    name: "Đàm phán chính sách nền tảng",
    description:
      "Nghiên cứu, đánh giá nền tảng tiềm năng, tìm kiếm người phụ trách, lên kế hoạch đàm phán và hoàn thiện hợp đồng hợp tác",
    catalogItemIds: [
      "cs-platform-research-evaluation",
      "cs-platform-contact-finding",
      "cs-platform-negotiation-planning",
      "cs-platform-contract-completion",
    ],
    tags: ["customer-service", "platform", "negotiation"],
  },
  {
    id: "cs-platform-quality-management",
    icon: "📊",
    name: "Quản lý chất lượng và hiệu quả kinh doanh trên nền tảng",
    description:
      "Xây dựng công cụ đánh giá, theo dõi hiệu quả, kiểm soát rủi ro, phối hợp xử lý vấn đề và đảm bảo chuỗi cung ứng hoạt động hiệu quả",
    catalogItemIds: [
      "cs-platform-efficiency-tools",
      "cs-platform-performance-monitoring",
      "cs-platform-risk-control-tools",
      "cs-platform-issue-coordination",
      "cs-platform-supply-chain-coordination",
    ],
    tags: ["customer-service", "platform", "quality", "efficiency"],
  },
  {
    id: "cs-platform-consulting-planning",
    icon: "📈",
    name: "Lập kế hoạch tham mưu đánh giá cơ hội kinh doanh",
    description:
      "Xây dựng khung đánh giá, phân tích đối thủ cạnh tranh và đánh giá cơ hội kinh doanh để tối đa hóa lợi nhuận",
    catalogItemIds: [
      "cs-platform-evaluation-framework",
      "cs-platform-competitor-analysis",
      "cs-platform-opportunity-assessment",
    ],
    tags: ["customer-service", "platform", "consulting", "planning"],
  },
  {
    id: "cs-platform-improvement",
    icon: "⚡",
    name: "Cải tiến và tối ưu hóa",
    description:
      "Tham mưu cho Ban Giám đốc và các phòng ban, đề xuất phương án cải tiến và tối ưu hóa quy trình, công cụ nội bộ",
    catalogItemIds: [
      "cs-platform-advisory",
      "cs-platform-improvement-proposals",
      "cs-platform-optimization",
    ],
    tags: ["customer-service", "platform", "improvement", "optimization"],
  },
  {
    id: "cs-training-policy-management",
    icon: "📚",
    name: "Quản lý đào tạo và chính sách nền tảng",
    description:
      "Tổng hợp và phát triển tài liệu đào tạo, phối hợp triển khai đào tạo nội bộ và cập nhật chính sách mới của nền tảng",
    catalogItemIds: [
      "cs-training-materials-development",
      "cs-internal-training-coordination",
      "cs-platform-policy-update",
    ],
    tags: ["customer-service", "training", "policy"],
  },
  {
    id: "cs-reports-internal-tasks",
    icon: "📋",
    name: "Báo cáo và công việc nội bộ",
    description:
      "Hoàn thành báo cáo chuyên môn với dữ liệu đầy đủ, chính xác và hoàn thành các đầu việc nội bộ được giao đúng hạn",
    catalogItemIds: [
      "cs-professional-report",
      "cs-internal-tasks-completion",
    ],
    tags: ["customer-service", "reports", "internal"],
  },
];

export { customerServiceTemplateDefinitions };

