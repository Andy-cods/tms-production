import type { CatalogItem, CatalogTemplate, CatalogTemplateInput } from "./types";

// Finance Catalog Items (moved from Sales)
export const FINANCE_CATALOG_ITEMS: CatalogItem[] = [
  // Finance - Kế hoạch kinh doanh (Business Planning)
  {
    id: "finance-market-research",
    category: "FINANCE",
    name: "Phân tích, nghiên cứu thị trường, đối thủ",
    description: "Phân tích thị trường, nghiên cứu đối thủ cạnh tranh",
    estimatedMinutes: 180,
  },
  {
    id: "finance-revenue-targets",
    category: "FINANCE",
    name: "Định hướng mục tiêu doanh thu, lợi nhuận, thị phần",
    description: "Định hướng mục tiêu doanh thu, lợi nhuận, thị phần theo loại sản phẩm, khu vực, nhóm khách hàng",
    estimatedMinutes: 240,
  },
  {
    id: "finance-business-plan",
    category: "FINANCE",
    name: "Lập kế hoạch kinh doanh theo mục tiêu",
    description: "Lập kế hoạch kinh doanh chi tiết theo mục tiêu đã định hướng",
    estimatedMinutes: 300,
  },
  {
    id: "finance-metrics-management",
    category: "FINANCE",
    name: "Quản lý các chỉ số kinh doanh",
    description: "Quản lý các chỉ số kinh doanh: số khách hàng, tỷ lệ tăng trưởng, cơ cấu sản phẩm/doanh thu",
    estimatedMinutes: 120,
  },
  {
    id: "finance-target-allocation",
    category: "FINANCE",
    name: "Phân bố chỉ tiêu doanh thu, sản lượng, khách hàng",
    description: "Phân bố chỉ tiêu doanh thu, sản lượng, khách hàng cho từng nhóm/nhân viên",
    estimatedMinutes: 150,
  },
  {
    id: "finance-kpi-monitoring",
    category: "FINANCE",
    name: "Theo dõi, giám sát và báo cáo tiến độ đạt KPI",
    description: "Theo dõi, giám sát và báo cáo tiến độ đạt KPI hằng tuần/tháng",
    estimatedMinutes: 90,
  },
  {
    id: "finance-adjustment-solutions",
    category: "FINANCE",
    name: "Đề xuất các giải pháp điều chỉnh kịp thời",
    description: "Đề xuất các giải pháp điều chỉnh kịp thời khi doanh số không đạt kế hoạch",
    estimatedMinutes: 120,
  },
  {
    id: "finance-operations-coordination",
    category: "FINANCE",
    name: "Điều phối hoạt động vận hành kinh doanh",
    description: "Điều phối hoạt động vận hành kinh doanh, kiểm soát chi phí bán hàng, ngân sách marketing, chính sách ưu đãi",
    estimatedMinutes: 180,
  },
  {
    id: "finance-process-improvement",
    category: "FINANCE",
    name: "Đề xuất sáng kiến cải tiến quy trình bán hàng",
    description: "Đề xuất sáng kiến cải tiến quy trình bán hàng, tối ưu vận hành",
    estimatedMinutes: 150,
  },

  // Finance - Quản trị hệ thống kinh doanh & vận hành (Business System Management & Operations)
  {
    id: "finance-consulting-process",
    category: "FINANCE",
    name: "Quản lý quy trình tư vấn khách hàng",
    description: "Quản lý quy trình tư vấn khách hàng, đảm bảo dữ liệu cập nhật, đầy đủ và chính xác",
    estimatedMinutes: 120,
  },
  {
    id: "finance-conversion-tracking",
    category: "FINANCE",
    name: "Theo dõi và giám sát tỷ lệ chuyển đổi khách hàng",
    description: "Theo dõi và giám sát tỷ lệ chuyển đổi khách hàng từ hoạt động MKT",
    estimatedMinutes: 90,
  },
  {
    id: "finance-customer-support",
    category: "FINANCE",
    name: "Hỗ trợ nhân viên xử lý khách hàng khó",
    description: "Hỗ trợ nhân viên trong quá trình xử lý khách hàng khó, đàm phán hoặc chốt hợp đồng",
    estimatedMinutes: 150,
  },
  {
    id: "finance-customer-satisfaction",
    category: "FINANCE",
    name: "Theo dõi mức độ hài lòng của khách hàng",
    description: "Theo dõi mức độ hài lòng của khách hàng, xử lý khiếu nại và duy trì quan hệ bền vững",
    estimatedMinutes: 120,
  },

  // Finance - Quản lý tài chính & chi phí (Financial & Cost Management)
  {
    id: "finance-cost-control",
    category: "FINANCE",
    name: "Kiểm soát định mức chi phí vận hành",
    description: "Kiểm soát định mức chi phí vận hành của bộ phận kinh doanh",
    estimatedMinutes: 90,
  },
  {
    id: "finance-cost-optimization",
    category: "FINANCE",
    name: "Theo dõi, phân tích và tối ưu chi phí định kỳ",
    description: "Theo dõi, phân tích và có giải pháp tối ưu chi phí định kỳ theo tháng/quý/năm",
    estimatedMinutes: 150,
  },
  {
    id: "finance-cost-revenue-ratio",
    category: "FINANCE",
    name: "Đảm bảo tỷ lệ chi phí/doanh thu trong ngưỡng cho phép",
    description: "Đảm bảo tỷ lệ chi phí/doanh thu trong ngưỡng cho phép",
    estimatedMinutes: 60,
  },

  // Finance - Quản lý nhân sự kinh doanh (Business HR Management)
  {
    id: "finance-recruitment",
    category: "FINANCE",
    name: "Tham gia tuyển dụng, phỏng vấn nhân sự",
    description: "Tham gia tuyển dụng, phỏng vấn nhân sự đội ngũ kinh doanh",
    estimatedMinutes: 180,
  },
  {
    id: "finance-kpi-development",
    category: "FINANCE",
    name: "Xây dựng KPI, chỉ tiêu đánh giá hiệu suất",
    description: "Xây dựng KPI, chỉ tiêu đánh giá hiệu suất nhân sự kinh doanh",
    estimatedMinutes: 150,
  },
  {
    id: "finance-training",
    category: "FINANCE",
    name: "Huấn luyện đội ngũ về kỹ năng bán hàng",
    description: "Huấn luyện đội ngũ về kỹ năng bán hàng, quản lý khách hàng, quy trình làm việc",
    estimatedMinutes: 180,
  },

  // Finance - Văn hóa & định hướng tổ chức (Culture & Organizational Direction)
  {
    id: "finance-culture-building",
    category: "FINANCE",
    name: "Xây dựng và lan tỏa văn hóa kinh doanh",
    description: "Xây dựng và lan tỏa văn hóa kinh doanh phù hợp với giá trị cốt lõi công ty",
    estimatedMinutes: 120,
  },
  {
    id: "finance-team-building",
    category: "FINANCE",
    name: "Tổ chức các hoạt động gắn kết đội ngũ kinh doanh",
    description: "Tổ chức các hoạt động gắn kết đội ngũ kinh doanh",
    estimatedMinutes: 180,
  },
];

// Finance Template Definitions
const financeTemplateDefinitions: CatalogTemplateInput[] = [
  {
    id: "finance-business-planning",
    icon: "📊",
    name: "Kế hoạch kinh doanh",
    description:
      "Toàn bộ quy trình kế hoạch kinh doanh: từ nghiên cứu thị trường, định hướng mục tiêu, lập kế hoạch đến theo dõi KPI và điều chỉnh.",
    catalogItemIds: [
      "finance-market-research",
      "finance-revenue-targets",
      "finance-business-plan",
      "finance-metrics-management",
      "finance-target-allocation",
      "finance-kpi-monitoring",
      "finance-adjustment-solutions",
      "finance-operations-coordination",
      "finance-process-improvement",
    ],
    tags: ["finance", "planning", "business"],
  },
  {
    id: "finance-system-operations",
    icon: "⚙️",
    name: "Quản trị hệ thống kinh doanh & vận hành",
    description:
      "Quản lý quy trình tư vấn khách hàng, theo dõi chuyển đổi, hỗ trợ nhân viên và duy trì quan hệ khách hàng.",
    catalogItemIds: [
      "finance-consulting-process",
      "finance-conversion-tracking",
      "finance-customer-support",
      "finance-customer-satisfaction",
    ],
    tags: ["finance", "operations", "customer"],
  },
  {
    id: "finance-financial-management",
    icon: "💰",
    name: "Quản lý tài chính & chi phí",
    description:
      "Kiểm soát chi phí vận hành, tối ưu chi phí định kỳ và đảm bảo tỷ lệ chi phí/doanh thu trong ngưỡng cho phép.",
    catalogItemIds: [
      "finance-cost-control",
      "finance-cost-optimization",
      "finance-cost-revenue-ratio",
    ],
    tags: ["finance", "cost", "management"],
  },
  {
    id: "finance-hr-management",
    icon: "👥",
    name: "Quản lý nhân sự kinh doanh",
    description:
      "Tuyển dụng, xây dựng KPI đánh giá hiệu suất và huấn luyện đội ngũ về kỹ năng bán hàng.",
    catalogItemIds: [
      "finance-recruitment",
      "finance-kpi-development",
      "finance-training",
    ],
    tags: ["finance", "hr", "training"],
  },
  {
    id: "finance-culture-organization",
    icon: "🌟",
    name: "Văn hóa & định hướng tổ chức",
    description:
      "Xây dựng và lan tỏa văn hóa kinh doanh phù hợp với giá trị cốt lõi công ty, tổ chức hoạt động gắn kết đội ngũ.",
    catalogItemIds: [
      "finance-culture-building",
      "finance-team-building",
    ],
    tags: ["finance", "culture", "organization"],
  },
];

export { financeTemplateDefinitions };

