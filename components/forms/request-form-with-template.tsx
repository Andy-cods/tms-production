"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DynamicFieldRenderer } from "./dynamic-field-renderer";
import { getTemplates } from "@/actions/template";
import { createRequestWithTemplate } from "@/actions/requests";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, User } from "lucide-react";

interface RequestFormWithTemplateProps {
  categories: Array<{ id: string; name: string; icon?: string; teamId?: string | null }>;
  teams: Array<{ id: string; name: string }>;
  currentUserTeamId?: string | null; // Team của user hiện tại để xác định cùng phòng ban
}

interface RequestFormData {
  title: string;
  description: string;
  categoryId?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  teamId?: string;
  suggestedAssigneeId?: string; // Người nhận cụ thể
  startDate?: string;
  endDate?: string;
  requesterType: "INTERNAL" | "CUSTOMER";
  templateId?: string;
}

export function RequestFormWithTemplate({ categories, teams, currentUserTeamId }: RequestFormWithTemplateProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);

  const [formData, setFormData] = useState<RequestFormData>({
    title: "",
    description: "",
    categoryId: undefined,
    priority: "MEDIUM",
    teamId: undefined,
    suggestedAssigneeId: undefined,
    startDate: undefined,
    endDate: undefined,
    requesterType: "INTERNAL",
    templateId: undefined,
  });

  // Xác định có phải cùng phòng ban không
  const isSameDepartment = !!(currentUserTeamId && formData.teamId && currentUserTeamId === formData.teamId);

  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Load team members khi chọn team
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!formData.teamId) {
        setTeamMembers([]);
        setFormData((prev) => ({ ...prev, suggestedAssigneeId: undefined }));
        return;
      }

      setLoadingMembers(true);
      try {
        const response = await fetch(`/api/teams/${formData.teamId}/members`);
        const data = await response.json();
        if (data.success && data.members) {
          setTeamMembers(data.members);
        } else {
          setTeamMembers([]);
        }
      } catch (error) {
        console.error("Failed to load team members:", error);
        setTeamMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    loadTeamMembers();
  }, [formData.teamId]);

  // Filter categories based on selected team (require team first)
  const filteredCategories = formData.teamId
    ? categories.filter((c) => !c.teamId || c.teamId === formData.teamId)
    : [];

  // Reset category/templates when team changes
  useEffect(() => {
    if (!formData.teamId) {
      if (formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: undefined, templateId: undefined }));
      }
      setTemplates([]);
      setSelectedTemplate(null);
      return;
    }

    if (formData.categoryId) {
      const currentCategory = categories.find((c) => c.id === formData.categoryId);
      if (currentCategory && currentCategory.teamId && currentCategory.teamId !== formData.teamId) {
        setFormData((prev) => ({ ...prev, categoryId: undefined, templateId: undefined }));
        setTemplates([]);
        setSelectedTemplate(null);
      }
    }
  }, [formData.teamId, formData.categoryId, categories, setFormData]);

  useEffect(() => {
    if (formData.categoryId) {
      loadTemplates();
    } else {
      setTemplates([]);
      setSelectedTemplate(null);
    }
  }, [formData.categoryId]);

  async function loadTemplates() {
    if (!formData.categoryId) return;
    setLoadingTemplates(true);
    try {
      const result = await getTemplates(formData.categoryId);
      if (result.success && 'templates' in result && result.templates) {
        setTemplates(result.templates);
        const defaultTemplate = result.templates.find((t: any) => t.isDefault);
        if (defaultTemplate) {
          handleTemplateChange(defaultTemplate.id);
        }
      }
    } catch (error) {
      console.error("Load templates error:", error);
    } finally {
      setLoadingTemplates(false);
    }
  }

  async function handleTemplateChange(templateId: string | undefined) {
    setFormData((prev) => ({ ...prev, templateId: templateId || undefined }));

    if (!templateId) {
      setSelectedTemplate(null);
      setCustomFieldValues({});
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    setSelectedTemplate(template);

    const initialValues: Record<string, any> = {};
    template?.fields.forEach((field: any) => {
      if (field.defaultValue) {
        initialValues[field.id] = field.defaultValue;
      }
    });
    setCustomFieldValues(initialValues);
  }

  function handleCustomFieldChange(fieldId: string, value: any) {
    setCustomFieldValues({ ...customFieldValues, [fieldId]: value });
    if (fieldErrors[fieldId]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[fieldId];
      setFieldErrors(newErrors);
    }
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    // Validate required fields
    if (!formData.teamId) {
      toast.error("Vui lòng chọn phòng ban xử lý");
      setLoading(false);
      return;
    }

    if (!formData.categoryId) {
      toast.error("Vui lòng chọn danh mục");
      setLoading(false);
      return;
    }

    // Validate: cùng phòng ban phải chọn người xử lý
    if (isSameDepartment && !formData.suggestedAssigneeId) {
      toast.error("Yêu cầu cùng phòng ban - vui lòng chọn người xử lý cụ thể");
      setLoading(false);
      return;
    }

    try {
      const result = await createRequestWithTemplate({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        categoryId: formData.categoryId!,
        teamId: formData.teamId,
        suggestedAssigneeId: formData.suggestedAssigneeId, // Thêm người nhận cụ thể
        deadline: formData.endDate || formData.startDate || undefined,
        requesterType: formData.requesterType,
        templateId: formData.templateId,
        customFields: customFieldValues,
      });

      if (result.success) {
        toast.success("Đã tạo request");
        router.push(`/requests/${result.request?.id || ""}`);
        router.refresh();
      } else {
        if (result.validationErrors) {
          setFieldErrors(result.validationErrors);
          toast.error("Vui lòng kiểm tra lại các trường");
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tiêu đề *</Label>
            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Nhập tiêu đề request" required />
          </div>

          <div>
            <Label>Mô tả *</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Mô tả chi tiết..." rows={4} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Phòng ban xử lý *</Label>
              <Select
                value={formData.teamId || undefined}
                onValueChange={(v) => {
                  const nextTeam = v || undefined;
                  setFormData({ ...formData, teamId: nextTeam, categoryId: undefined, templateId: undefined, suggestedAssigneeId: undefined });
                  setTemplates([]);
                  setSelectedTemplate(null);
                  setTeamMembers([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Phân loại *</Label>
              <Select
                value={formData.categoryId || undefined}
                onValueChange={(v) => {
                  const nextCategory = v || undefined;
                  setFormData({ ...formData, categoryId: nextCategory, templateId: undefined });
                  handleTemplateChange(undefined);
                }}
                disabled={!formData.teamId || filteredCategories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !formData.teamId
                        ? "Chọn phòng ban trước"
                        : filteredCategories.length === 0
                        ? "Không có phân loại phù hợp"
                        : "Chọn phân loại"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon ? `${cat.icon} ` : ""}
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData({ ...formData, priority: v as "LOW" | "MEDIUM" | "HIGH" | "URGENT" })}
                required
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Chọn người nhận cụ thể */}
            <div>
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Người xử lý {isSameDepartment ? "*" : "(tuỳ chọn)"}
              </Label>
              <Select
                value={formData.suggestedAssigneeId || "__none__"}
                onValueChange={(v) => {
                  if (v === "__none__") {
                    setFormData({ ...formData, suggestedAssigneeId: undefined });
                  } else {
                    setFormData({ ...formData, suggestedAssigneeId: v });
                  }
                }}
                disabled={!formData.teamId || loadingMembers || teamMembers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !formData.teamId
                        ? "Chọn phòng ban trước"
                        : loadingMembers
                        ? "Đang tải..."
                        : teamMembers.length === 0
                        ? "Không có thành viên"
                        : "Chọn người xử lý"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {!isSameDepartment && (
                    <SelectItem value="__none__">Để Leader phân công</SelectItem>
                  )}
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <span>{member.name}</span>
                        <span className="text-xs text-gray-400">({member.role})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isSameDepartment && (
                <p className="text-xs text-amber-600 mt-1">
                  Yêu cầu cùng phòng ban - vui lòng chọn người xử lý cụ thể
                </p>
              )}
            </div>
          </div>

          <div>
            <Label>Thời hạn (từ - đến)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-sm text-gray-600">Từ ngày</Label>
                <Input 
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate || ""} 
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value || undefined })}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-sm text-gray-600">Đến ngày</Label>
                <Input 
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate || ""} 
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
                  min={formData.startDate || new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Loại người yêu cầu *</Label>
            <RadioGroup
              value={formData.requesterType}
              onValueChange={(value: string) => setFormData({ ...formData, requesterType: value as "INTERNAL" | "CUSTOMER" })}
              className="flex items-center gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="INTERNAL" id="internal" />
                <Label htmlFor="internal" className="font-normal cursor-pointer">
                  Nội bộ
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CUSTOMER" id="customer" />
                <Label htmlFor="customer" className="font-normal cursor-pointer">
                  Khách hàng
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-gray-500">
              Yêu cầu từ khách hàng sẽ được ưu tiên cao hơn
            </p>
          </div>
        </CardContent>
      </Card>


      {formData.categoryId && formData.categoryId !== "__none__" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Chọn Template (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={formData.templateId || undefined} 
              onValueChange={(v) => {
                if (v === "__none__" || !v) {
                  handleTemplateChange(undefined);
                } else {
                  handleTemplateChange(v);
                }
              }} 
              disabled={loadingTemplates}
            >
              <SelectTrigger><SelectValue placeholder="Không dùng template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Không dùng template</SelectItem>
                {templates.length > 0 ? templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <span>{t.icon}</span>
                      <span>{t.name}</span>
                      {t.estimatedDays && (
                        <span className="text-xs text-gray-400 ml-1">
                          {t.estimatedDays} ngày
                        </span>
                      )}
                    </div>
                  </SelectItem>
                )) : (
                  <SelectItem value="__no_templates" disabled>
                    Chưa có template nào cho phân loại này
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {selectedTemplate && <p className="text-sm text-gray-500 mt-2">{selectedTemplate.description}</p>}
          </CardContent>
        </Card>
      )}

      {selectedTemplate && selectedTemplate.fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTemplate.name} Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedTemplate.fields.map((field: any) => (
              <DynamicFieldRenderer
                key={field.id}
                field={{
                  id: field.id,
                  name: field.name,
                  label: field.label,
                  description: field.description || undefined,
                  type: field.type,
                  isRequired: field.isRequired,
                  minLength: field.minLength || undefined,
                  maxLength: field.maxLength || undefined,
                  minValue: field.minValue || undefined,
                  maxValue: field.maxValue || undefined,
                  pattern: field.pattern || undefined,
                  options: field.options ? JSON.parse(JSON.stringify(field.options)) : undefined,
                  defaultValue: field.defaultValue || undefined,
                  placeholder: field.placeholder || undefined,
                  order: field.order,
                }}
                value={customFieldValues[field.id]}
                onChange={(value) => handleCustomFieldChange(field.id, value)}
                error={fieldErrors[field.id] ? fieldErrors[field.id].join(", ") : undefined}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Hủy</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Tạo Request
        </Button>
      </div>
    </form>
  );
}

