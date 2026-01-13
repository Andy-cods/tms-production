// lib/validations/request.ts
import { z } from "zod";

export const GDRIVE_REGEX =
  /^(https?:\/\/)?(drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=|drive\.google\.com\/.*\/d\/)([a-zA-Z0-9_-]+)/;

export const createRequestSchema = z.object({
  title: z.string()
    .min(5, "Tiêu đề phải có ít nhất 5 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự"),
  description: z.string()
    .min(20, "Mô tả phải có ít nhất 20 ký tự")
    .max(5000, "Mô tả không được vượt quá 5000 ký tự"),
  categoryId: z.string()
    .uuid("ID danh mục không hợp lệ")
    .optional(),
  templateId: z.string()
    .uuid("ID template không hợp lệ")
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
    message: "Độ ưu tiên không hợp lệ"
  }),
  deadline: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, "Deadline phải là ngày trong tương lai"),
  attachments: z
    .array(
      z.object({
        fileName: z.string()
          .min(1, "Tên file không được để trống")
          .max(200, "Tên file không được vượt quá 200 ký tự"),
        fileUrl: z.string()
          .regex(GDRIVE_REGEX, "Link Google Drive không hợp lệ"),
      })
    )
    .max(5, "Tối đa 5 file đính kèm")
    .optional(),
  tags: z.array(z.string().min(1).max(20)).max(10).optional(),
  isUrgent: z.coerce.boolean().optional().default(false),
  // Priority Scoring fields
  urgencyScore: z.number()
    .int("Điểm khẩn cấp phải là số nguyên")
    .min(1, "Điểm phải từ 1 đến 5")
    .max(5, "Điểm phải từ 1 đến 5")
    .optional(),
  impactScore: z.number()
    .int("Điểm tác động phải là số nguyên")
    .min(1, "Điểm phải từ 1 đến 5")
    .max(5, "Điểm phải từ 1 đến 5")
    .optional(),
  riskScore: z.number()
    .int("Điểm rủi ro phải là số nguyên")
    .min(1, "Điểm phải từ 1 đến 5")
    .max(5, "Điểm phải từ 1 đến 5")
    .optional(),
  customScores: z.record(
    z.string(),
    z.number()
      .int("Điểm tùy chỉnh phải là số nguyên")
      .min(1, "Điểm phải từ 1 đến 5")
      .max(5, "Điểm phải từ 1 đến 5")
  ).optional(),
  requesterType: z.enum(['CUSTOMER', 'INTERNAL'], {
    message: "Loại người yêu cầu không hợp lệ"
  }).default('INTERNAL'),
  teamId: z.string().uuid().optional(),
}).refine(
  (data) => {
    // If template is selected → category required
    // If template is empty/null → category optional
    if (!data.templateId) {
      return true; // No template → no validation
    }
    return !!data.categoryId; // Template exists → category required
  },
  {
    message: "Vui lòng chọn danh mục (category) khi sử dụng template",
    path: ["categoryId"], // Error on categoryId field
  }
);

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
