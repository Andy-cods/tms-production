export type FieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "SELECT"
  | "MULTISELECT"
  | "CHECKBOX"
  | "DATE"
  | "DATETIME"
  | "FILE"
  | "URL"
  | "EMAIL";

export interface CustomFieldDefinition {
  id: string;
  name: string;
  label: string;
  description?: string;
  type: FieldType;
  isRequired: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  options?: string[];
  defaultValue?: string;
  placeholder?: string;
  order: number;
}

export interface CustomFieldValueData {
  fieldId: string;
  value: any;
}

export interface RequestTemplateData {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  categoryId?: string;
  isActive: boolean;
  isDefault: boolean;
  usageCount: number;
  fields: CustomFieldDefinition[];
  createdAt: string;
  updatedAt: string;
}

export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
}

export const fieldValidators = {
  validateText(value: string, field: CustomFieldDefinition): FieldValidationResult {
    const errors: string[] = [];
    if (field.isRequired && !value) errors.push(`${field.label} là bắt buộc`);
    if (value && field.minLength && value.length < field.minLength) errors.push(`${field.label} phải có ít nhất ${field.minLength} ký tự`);
    if (value && field.maxLength && value.length > field.maxLength) errors.push(`${field.label} không được vượt quá ${field.maxLength} ký tự`);
    if (value && field.pattern) {
      const regex = new RegExp(field.pattern);
      if (!regex.test(value)) errors.push(`${field.label} không đúng định dạng`);
    }
    return { isValid: errors.length === 0, errors };
  },

  validateNumber(value: number | string, field: CustomFieldDefinition): FieldValidationResult {
    const errors: string[] = [];
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (field.isRequired && (value === null || value === undefined)) errors.push(`${field.label} là bắt buộc`);
    if (!isNaN(numValue) && field.minValue !== undefined && numValue < field.minValue) errors.push(`${field.label} phải >= ${field.minValue}`);
    if (!isNaN(numValue) && field.maxValue !== undefined && numValue > field.maxValue) errors.push(`${field.label} phải <= ${field.maxValue}`);
    return { isValid: errors.length === 0, errors };
  },

  validateSelect(value: string, field: CustomFieldDefinition): FieldValidationResult {
    const errors: string[] = [];
    if (field.isRequired && !value) errors.push(`${field.label} là bắt buộc`);
    if (value && field.options && !field.options.includes(value)) errors.push(`${field.label} có giá trị không hợp lệ`);
    return { isValid: errors.length === 0, errors };
  },

  validateMultiselect(value: string[], field: CustomFieldDefinition): FieldValidationResult {
    const errors: string[] = [];
    if (field.isRequired && (!value || value.length === 0)) errors.push(`${field.label} là bắt buộc`);
    if (value && field.options) {
      const invalid = value.filter((v) => !field.options!.includes(v));
      if (invalid.length > 0) errors.push(`${field.label} có giá trị không hợp lệ`);
    }
    return { isValid: errors.length === 0, errors };
  },

  validateUrl(value: string, field: CustomFieldDefinition): FieldValidationResult {
    const errors: string[] = [];
    if (field.isRequired && !value) errors.push(`${field.label} là bắt buộc`);
    if (value) {
      try { new URL(value); } catch { errors.push(`${field.label} không phải URL hợp lệ`); }
    }
    return { isValid: errors.length === 0, errors };
  },

  validateEmail(value: string, field: CustomFieldDefinition): FieldValidationResult {
    const errors: string[] = [];
    if (field.isRequired && !value) errors.push(`${field.label} là bắt buộc`);
    if (value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) errors.push(`${field.label} không phải email hợp lệ`);
    }
    return { isValid: errors.length === 0, errors };
  },

  validate(value: any, field: CustomFieldDefinition): FieldValidationResult {
    switch (field.type) {
      case "TEXT":
      case "TEXTAREA":
        return this.validateText(value, field);
      case "NUMBER":
        return this.validateNumber(value, field);
      case "SELECT":
        return this.validateSelect(value, field);
      case "MULTISELECT":
        return this.validateMultiselect(value, field);
      case "URL":
        return this.validateUrl(value, field);
      case "EMAIL":
        return this.validateEmail(value, field);
      case "CHECKBOX":
      case "DATE":
      case "DATETIME":
      case "FILE":
      default:
        return { isValid: true, errors: [] };
    }
  },
};

export const FIELD_TYPE_META: Record<
  FieldType,
  {
    label: string;
    icon: string;
    description: string;
    supportsValidation: {
      required: boolean;
      minLength: boolean;
      maxLength: boolean;
      minValue: boolean;
      maxValue: boolean;
      pattern: boolean;
      options: boolean;
    };
  }
> = {
  TEXT: { label: "Text (1 dòng)", icon: "Type", description: "Văn bản ngắn (vd: Tên, Tiêu đề)", supportsValidation: { required: true, minLength: true, maxLength: true, minValue: false, maxValue: false, pattern: true, options: false } },
  TEXTAREA: { label: "Text (Nhiều dòng)", icon: "AlignLeft", description: "Văn bản dài (vd: Mô tả, Ghi chú)", supportsValidation: { required: true, minLength: true, maxLength: true, minValue: false, maxValue: false, pattern: false, options: false } },
  NUMBER: { label: "Số", icon: "Hash", description: "Giá trị số (vd: Tuổi, Số lượng)", supportsValidation: { required: true, minLength: false, maxLength: false, minValue: true, maxValue: true, pattern: false, options: false } },
  SELECT: { label: "Dropdown (1 lựa chọn)", icon: "ChevronDown", description: "Chọn 1 giá trị từ danh sách", supportsValidation: { required: true, minLength: false, maxLength: false, minValue: false, maxValue: false, pattern: false, options: true } },
  MULTISELECT: { label: "Dropdown (Nhiều lựa chọn)", icon: "List", description: "Chọn nhiều giá trị từ danh sách", supportsValidation: { required: true, minLength: false, maxLength: false, minValue: false, maxValue: false, pattern: false, options: true } },
  CHECKBOX: { label: "Checkbox", icon: "CheckSquare", description: "Giá trị đúng/sai", supportsValidation: { required: false, minLength: false, maxLength: false, minValue: false, maxValue: false, pattern: false, options: false } },
  DATE: { label: "Ngày", icon: "Calendar", description: "Chọn ngày (không giờ)", supportsValidation: { required: true, minLength: false, maxLength: false, minValue: false, maxValue: false, pattern: false, options: false } },
  DATETIME: { label: "Ngày + Giờ", icon: "Clock", description: "Chọn ngày và giờ", supportsValidation: { required: true, minLength: false, maxLength: false, minValue: false, maxValue: false, pattern: false, options: false } },
  FILE: { label: "File upload", icon: "Upload", description: "Upload tệp tin", supportsValidation: { required: true, minLength: false, maxLength: false, minValue: false, maxValue: false, pattern: false, options: false } },
  URL: { label: "URL", icon: "Link", description: "Đường dẫn website", supportsValidation: { required: true, minLength: false, maxLength: false, minValue: false, maxValue: false, pattern: false, options: false } },
  EMAIL: { label: "Email", icon: "Mail", description: "Địa chỉ email", supportsValidation: { required: true, minLength: false, maxLength: false, minValue: false, maxValue: false, pattern: false, options: false } },
};


