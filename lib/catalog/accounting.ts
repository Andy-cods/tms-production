import type { CatalogItem, CatalogTemplate, CatalogTemplateInput } from "./types";

// Accounting Catalog Items
export const ACCOUNTING_CATALOG_ITEMS: CatalogItem[] = [
  // TKQC INVOICE - Phối hợp nội bộ (Internal Coordination)
  {
    id: "accounting-tkqc-invoice-budget-reconciliation",
    category: "ACCOUNTING",
    name: "Đối soát ngân sách khả dụng còn lại trong ví",
    description: "Đối soát ngân sách khả dụng còn lại trong ví của công ty tại các đầu đối tác đang hợp tác",
    estimatedMinutes: 60,
  },
  {
    id: "accounting-tkqc-invoice-transaction-update",
    category: "ACCOUNTING",
    name: "Cập nhật giao dịch chuyển sang đối tác",
    description: "Cập nhật các giao dịch chuyển sang các đối tác trong ngày. Update lên file đối tác các giao dịch chuyển tiền",
    estimatedMinutes: 45,
  },
  {
    id: "accounting-tkqc-invoice-wallet-balance-check",
    category: "ACCOUNTING",
    name: "Check số dư ví ở các tài khoản công ty",
    description: "Check số dư ví ở các tài khoản của công ty",
    estimatedMinutes: 30,
  },
  {
    id: "accounting-tkqc-invoice-daily-transaction-update",
    category: "ACCOUNTING",
    name: "Update giao dịch phát sinh theo ngày vào file kế toán",
    description: "Update toàn bộ giao dịch phát sinh theo ngày vào file kế toán. Đối chiếu số liệu với các file lẻ từ bộ phận CSKH & Kinh Doanh",
    estimatedMinutes: 90,
  },
  {
    id: "accounting-tkqc-invoice-refund-check",
    category: "ACCOUNTING",
    name: "Check file Refund hàng ngày",
    description: "Check file Refund hàng ngày để xử lý đúng hạn nếu không có phát sinh đặc biệt",
    estimatedMinutes: 30,
  },
  {
    id: "accounting-tkqc-invoice-qlk-fee-check",
    category: "ACCOUNTING",
    name: "Check & yêu cầu thu phí QLTK với các NVKD",
    description: "Check & yêu cầu thu phí QLTK với các NVKD",
    estimatedMinutes: 30,
  },
  {
    id: "accounting-tkqc-invoice-customer-confirmation",
    category: "ACCOUNTING",
    name: "Rà soát và xác nhận giao dịch với khách hàng",
    description: "Rà soát, kiểm tra và xác nhận các khoản giao dịch phát sinh mới, refund... trong các nhóm Khách Hàng. Cập nhật trạng thái xác nhận lên các file lẻ chung",
    estimatedMinutes: 60,
  },

  // TKQC TK Nolimit - Phối hợp nội bộ
  {
    id: "accounting-tkqc-nolimit-daily-transaction-update",
    category: "ACCOUNTING",
    name: "Update giao dịch TK Nolimit theo ngày",
    description: "Update toàn bộ giao dịch phát sinh theo ngày vào file kế toán. Đối chiếu số liệu với các file lẻ từ bộ phận CSKH & Kinh Doanh",
    estimatedMinutes: 90,
  },
  {
    id: "accounting-tkqc-nolimit-refund-check",
    category: "ACCOUNTING",
    name: "Check file Refund TK Nolimit hàng ngày",
    description: "Check file Refund hàng ngày để xử lý đúng hạn nếu không có phát sinh đặc biệt",
    estimatedMinutes: 30,
  },
  {
    id: "accounting-tkqc-nolimit-customer-confirmation",
    category: "ACCOUNTING",
    name: "Rà soát và xác nhận giao dịch TK Nolimit với khách hàng",
    description: "Rà soát, kiểm tra và xác nhận các khoản giao dịch phát sinh mới, refund... trong các nhóm Khách Hàng. Cập nhật trạng thái xác nhận lên các file lẻ chung",
    estimatedMinutes: 60,
  },

  // Mảng Nguyên liệu ADS - Phối hợp nội bộ
  {
    id: "accounting-ads-materials-order-confirmation",
    category: "ACCOUNTING",
    name: "Kiểm tra và xác nhận giao dịch trên file đặt hàng chung",
    description: "Kiểm tra và xác nhận giao dịch trên file đặt hàng chung",
    estimatedMinutes: 45,
  },
  {
    id: "accounting-ads-materials-daily-transaction-update",
    category: "ACCOUNTING",
    name: "Update giao dịch nguyên liệu ADS theo ngày",
    description: "Update toàn bộ giao dịch phát sinh theo ngày vào file kế toán. Đối chiếu số liệu với các file lẻ từ bộ phận CSKH & Kinh Doanh",
    estimatedMinutes: 90,
  },
  {
    id: "accounting-ads-materials-refund-check",
    category: "ACCOUNTING",
    name: "Check file Refund nguyên liệu ADS hàng ngày",
    description: "Check file Refund hàng ngày để xử lý đúng hạn nếu không có phát sinh đặc biệt",
    estimatedMinutes: 30,
  },
  {
    id: "accounting-ads-materials-purchase-update",
    category: "ACCOUNTING",
    name: "Cập nhật giao dịch mua hàng nguyên liệu ADS",
    description: "Cập nhật giao dịch mua hàng nguyên liệu ADS từ các đầu đối tác, theo dõi công nợ và check thanh toán",
    estimatedMinutes: 60,
  },

  // Đối soát giao dịch (Transaction Reconciliation)
  {
    id: "accounting-transaction-reconciliation-daily",
    category: "ACCOUNTING",
    name: "Đối soát giao dịch theo ngày",
    description: "Đối soát giao dịch theo ngày",
    estimatedMinutes: 120,
  },
  {
    id: "accounting-transaction-reconciliation-report",
    category: "ACCOUNTING",
    name: "Tổng hợp báo cáo và nhập file theo dõi",
    description: "Tổng hợp báo cáo và nhập file theo dõi",
    estimatedMinutes: 90,
  },

  // Tổng hợp doanh thu (Revenue Summary)
  {
    id: "accounting-revenue-summary-statistics",
    category: "ACCOUNTING",
    name: "Thống kê doanh số các mảng",
    description: "Thống kê doanh số các mảng",
    estimatedMinutes: 180,
  },
  {
    id: "accounting-revenue-summary-rebate",
    category: "ACCOUNTING",
    name: "Thống kê và đối khoản rebate dự kiến",
    description: "Thống kê và đối khoản rebate dự kiến và phân bổ vào các tháng (Cần làm thêm file thống kê tự động)",
    estimatedMinutes: 240,
  },

  // Tổng hợp chi phí (Cost Summary)
  {
    id: "accounting-cost-summary-long-term",
    category: "ACCOUNTING",
    name: "Tổng hợp và phân bố các chi phí lớn dài hạn",
    description: "Tổng hợp và phân bố các chi phí lớn dài hạn: chuyển tiền sang nước ngoài và văn phòng đại diện, chi phí du lịch, mua máy móc thiết bị...",
    estimatedMinutes: 180,
  },
  {
    id: "accounting-cost-summary-marketing",
    category: "ACCOUNTING",
    name: "Tổng hợp chi phí marketing",
    description: "Tổng hợp chi phí marketing (lấy số liệu từ MKT)",
    estimatedMinutes: 90,
  },
  {
    id: "accounting-cost-summary-materials",
    category: "ACCOUNTING",
    name: "Tổng hợp chi phí nhập nguyên liệu",
    description: "Tổng hợp chi phí nhập nguyên liệu: BM2500, BM350... (Ms. An tạo file tự động đối chiếu chi phí NVL)",
    estimatedMinutes: 120,
  },
  {
    id: "accounting-cost-summary-commission",
    category: "ACCOUNTING",
    name: "Check thống kê chi tiêu thực tế để trả hoa hồng",
    description: "Check thống kê chi tiêu thực tế từ tất cả KH để trả hoa hồng cho CTV, đại lý hoặc cashback cho KH",
    estimatedMinutes: 150,
  },

  // Nội bộ - Báo cáo doanh thu (Internal - Revenue Reports)
  {
    id: "accounting-internal-revenue-report-segment",
    category: "ACCOUNTING",
    name: "Báo cáo kết quả kinh doanh từng mảng",
    description: "Báo cáo kết quả kinh doanh từng mảng (Chi phí, doanh thu, lỗ lãi...)",
    estimatedMinutes: 240,
  },
  {
    id: "accounting-internal-revenue-report-total",
    category: "ACCOUNTING",
    name: "Báo cáo kết quả kinh doanh tổng",
    description: "Báo cáo kết quả kinh doanh tổng",
    estimatedMinutes: 180,
  },

  // Nội bộ - Tổng hợp số liệu tính lương (Internal - Salary Data Summary)
  {
    id: "accounting-internal-salary-data-summary",
    category: "ACCOUNTING",
    name: "Tổng hợp số liệu tính lương",
    description: "Tổng hợp số liệu tính lương",
    estimatedMinutes: 300,
  },

  // Nội bộ - Thuế (Internal - Tax)
  {
    id: "accounting-internal-tax-documents",
    category: "ACCOUNTING",
    name: "Tập hợp hồ sơ chứng từ thuế",
    description: "Tập hợp hồ sơ chứng từ thuế (hoá đơn chứng từ đi kèm)",
    estimatedMinutes: 180,
  },
  {
    id: "accounting-internal-tax-report",
    category: "ACCOUNTING",
    name: "Lập và nộp báo cáo thuế",
    description: "Lập và nộp báo cáo thuế",
    estimatedMinutes: 240,
  },
];

// Accounting Template Definitions
const accountingTemplateDefinitions: CatalogTemplateInput[] = [
  {
    id: "accounting-tkqc-invoice-internal",
    icon: "💼",
    name: "TKQC INVOICE - Phối hợp nội bộ",
    description:
      "Các công việc phối hợp nội bộ cho mảng TKQC INVOICE: đối soát ngân sách, cập nhật giao dịch, check số dư ví, update file kế toán, xử lý refund và thu phí QLTK",
    catalogItemIds: [
      "accounting-tkqc-invoice-budget-reconciliation",
      "accounting-tkqc-invoice-transaction-update",
      "accounting-tkqc-invoice-wallet-balance-check",
      "accounting-tkqc-invoice-daily-transaction-update",
      "accounting-tkqc-invoice-refund-check",
      "accounting-tkqc-invoice-qlk-fee-check",
    ],
    tags: ["accounting", "tkqc", "invoice", "internal"],
  },
  {
    id: "accounting-tkqc-invoice-customer",
    icon: "👥",
    name: "TKQC INVOICE - Tương tác khách hàng",
    description:
      "Rà soát, kiểm tra và xác nhận các khoản giao dịch phát sinh mới, refund với khách hàng trong mảng TKQC INVOICE",
    catalogItemIds: [
      "accounting-tkqc-invoice-customer-confirmation",
    ],
    tags: ["accounting", "tkqc", "invoice", "customer"],
  },
  {
    id: "accounting-tkqc-nolimit-internal",
    icon: "💼",
    name: "TKQC TK Nolimit - Phối hợp nội bộ",
    description:
      "Các công việc phối hợp nội bộ cho mảng TKQC TK Nolimit: update giao dịch theo ngày, check refund và đối chiếu số liệu",
    catalogItemIds: [
      "accounting-tkqc-nolimit-daily-transaction-update",
      "accounting-tkqc-nolimit-refund-check",
    ],
    tags: ["accounting", "tkqc", "nolimit", "internal"],
  },
  {
    id: "accounting-tkqc-nolimit-customer",
    icon: "👥",
    name: "TKQC TK Nolimit - Tương tác khách hàng",
    description:
      "Rà soát, kiểm tra và xác nhận các khoản giao dịch phát sinh mới, refund với khách hàng trong mảng TKQC TK Nolimit",
    catalogItemIds: [
      "accounting-tkqc-nolimit-customer-confirmation",
    ],
    tags: ["accounting", "tkqc", "nolimit", "customer"],
  },
  {
    id: "accounting-ads-materials-internal",
    icon: "📦",
    name: "Mảng Nguyên liệu ADS - Phối hợp nội bộ",
    description:
      "Các công việc phối hợp nội bộ cho mảng Nguyên liệu ADS: kiểm tra đặt hàng, update giao dịch, check refund và theo dõi công nợ",
    catalogItemIds: [
      "accounting-ads-materials-order-confirmation",
      "accounting-ads-materials-daily-transaction-update",
      "accounting-ads-materials-refund-check",
      "accounting-ads-materials-purchase-update",
    ],
    tags: ["accounting", "ads", "materials", "internal"],
  },
  {
    id: "accounting-transaction-reconciliation",
    icon: "🔍",
    name: "Đối soát giao dịch",
    description:
      "Đối soát giao dịch theo ngày và tổng hợp báo cáo, nhập file theo dõi",
    catalogItemIds: [
      "accounting-transaction-reconciliation-daily",
      "accounting-transaction-reconciliation-report",
    ],
    tags: ["accounting", "reconciliation", "transaction"],
  },
  {
    id: "accounting-revenue-summary",
    icon: "📈",
    name: "Tổng hợp doanh thu",
    description:
      "Thống kê doanh số các mảng và thống kê, đối khoản rebate dự kiến, phân bổ vào các tháng",
    catalogItemIds: [
      "accounting-revenue-summary-statistics",
      "accounting-revenue-summary-rebate",
    ],
    tags: ["accounting", "revenue", "summary"],
  },
  {
    id: "accounting-cost-summary",
    icon: "💰",
    name: "Tổng hợp chi phí",
    description:
      "Tổng hợp và phân bố chi phí lớn dài hạn, chi phí marketing, chi phí nhập nguyên liệu và check thống kê để trả hoa hồng",
    catalogItemIds: [
      "accounting-cost-summary-long-term",
      "accounting-cost-summary-marketing",
      "accounting-cost-summary-materials",
      "accounting-cost-summary-commission",
    ],
    tags: ["accounting", "cost", "summary"],
  },
  {
    id: "accounting-internal-revenue-report",
    icon: "📊",
    name: "Nội bộ - Báo cáo doanh thu",
    description:
      "Báo cáo kết quả kinh doanh từng mảng và tổng (Chi phí, doanh thu, lỗ lãi...)",
    catalogItemIds: [
      "accounting-internal-revenue-report-segment",
      "accounting-internal-revenue-report-total",
    ],
    tags: ["accounting", "internal", "revenue", "report"],
  },
  {
    id: "accounting-internal-salary",
    icon: "💵",
    name: "Nội bộ - Tổng hợp số liệu tính lương",
    description:
      "Tổng hợp số liệu tính lương",
    catalogItemIds: [
      "accounting-internal-salary-data-summary",
    ],
    tags: ["accounting", "internal", "salary"],
  },
  {
    id: "accounting-internal-tax",
    icon: "📋",
    name: "Nội bộ - Thuế",
    description:
      "Tập hợp hồ sơ chứng từ thuế và lập, nộp báo cáo thuế",
    catalogItemIds: [
      "accounting-internal-tax-documents",
      "accounting-internal-tax-report",
    ],
    tags: ["accounting", "internal", "tax"],
  },
];

export { accountingTemplateDefinitions };

