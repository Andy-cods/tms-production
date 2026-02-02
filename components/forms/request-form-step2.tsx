"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { getTemplates } from "@/actions/template";
import { Priority } from "@prisma/client";
import { toPriority } from "@/lib/utils/enum-helpers";
import { Loader2, User } from "lucide-react";

// Schema for CATALOG requests
const catalogSchema = z.object({
  title: z.string().min(5, "Tối thiểu 5 ký tự").max(200),
  description: z.string().min(20, "Tối thiểu 20 ký tự").max(5000),
  teamId: z.string().min(1, "Vui lòng chọn phòng ban"),
  categoryId: z.string().min(1, "Vui lòng chọn phân loại"),
  templateId: z.string().optional(),
  suggestedAssigneeId: z.string().optional(), // Gợi ý nhân viên xử lý
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  deadlineFrom: z.coerce.date(),
  deadlineTo: z.coerce.date(),
  requesterType: z.enum(["INTERNAL", "CUSTOMER"]).default("INTERNAL"),
});

// Schema for CUSTOM requests
const customSchema = z.object({
  title: z.string().min(5, "Tối thiểu 5 ký tự").max(200),
  description: z.string().min(20, "Tối thiểu 20 ký tự").max(5000),
  teamId: z.string().min(1, "Vui lòng chọn phòng ban"),
  suggestedAssigneeId: z.string().optional(), // Gợi ý nhân viên xử lý
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  deadlineFrom: z.coerce.date(),
  deadlineTo: z.coerce.date(),
  requesterType: z.enum(["INTERNAL", "CUSTOMER"]).default("INTERNAL"),
  customCategory: z.string().optional(),
});

type Category = { id: string; name: string; icon?: string; teamId?: string | null };
type Team = { id: string; name: string };

export function RequestFormStep2({
  requestType,
  categories,
  teams,
  currentUserTeamId,
  onNext,
  onBack,
}: {
  requestType: "catalog" | "custom";
  categories: Category[];
  teams: Team[];
  currentUserTeamId?: string | null;
  onNext: (data: any) => void;
  onBack: () => void;
}) {
  const schema = requestType === "catalog" ? catalogSchema : customSchema;
  const form = useForm({ resolver: zodResolver(schema) });
  const [templates, setTemplates] = useState<
    Array<{ id: string; name: string; description?: string | null; estimatedDays?: number; icon?: string }>
  >([]);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [sameDeptError, setSameDeptError] = useState<string | null>(null);
  const selectedTeam = requestType === "catalog"
    ? (form.watch("teamId" as any) as string | undefined)
    : (form.watch("teamId" as any) as string | undefined);
  const selectedCategory = requestType === "catalog" ? (form.watch("categoryId" as any) as string | undefined) : undefined;
  const selectedTemplate = requestType === "catalog" ? (form.watch("templateId" as any) as string | undefined) : undefined;
  const selectedAssignee = form.watch("suggestedAssigneeId" as any) as string | undefined;

  // Xác định cùng phòng ban
  const isSameDepartment = !!(currentUserTeamId && selectedTeam && currentUserTeamId === selectedTeam);

  // Custom submit handler với validation cùng phòng ban
  const handleFormSubmit = (data: any) => {
    // Validation: cùng phòng ban PHẢI chọn người xử lý
    if (isSameDepartment && !data.suggestedAssigneeId) {
      setSameDeptError("Yêu cầu cùng phòng ban - bắt buộc chọn người xử lý cụ thể");
      return;
    }
    setSameDeptError(null);
    onNext(data);
  };
  // Filter categories: chỉ hiển thị categories của team đã chọn (teamId === selectedTeam)
  // Không hiển thị global categories (categories không có teamId)
  const filteredCategories =
    requestType === "catalog" && selectedTeam
      ? categories.filter((cat) => cat.teamId === selectedTeam)
      : requestType === "catalog"
      ? []
      : categories;
  const errors = form.formState.errors as Record<string, any>;

  useEffect(() => {
    if (requestType === "catalog") {
      form.register("teamId" as any);
      form.register("categoryId" as any);
      form.register("templateId" as any);
      form.register("suggestedAssigneeId" as any);
    } else {
      form.register("teamId" as any);
      form.register("suggestedAssigneeId" as any);
    }
  }, [form, requestType]);

  // Load team members when team is selected
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!selectedTeam) {
        setTeamMembers([]);
        form.setValue("suggestedAssigneeId" as any, undefined);
        return;
      }

      // For catalog: chỉ load khi đã chọn phòng ban và phân loại
      if (requestType === "catalog" && !selectedCategory) {
        setTeamMembers([]);
        form.setValue("suggestedAssigneeId" as any, undefined);
        return;
      }

      // For custom: chỉ cần có phòng ban
      setLoadingMembers(true);
      try {
        const response = await fetch(`/api/teams/${selectedTeam}/members`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeam, selectedCategory, requestType]);

  function hasCategoryId(x: unknown): x is { categoryId: string } {
    return typeof (x as any)?.categoryId === "string";
  }

  useEffect(() => {
    const sub = form.watch(async (values: any, { name }) => {
      if (requestType === "catalog" && name === "categoryId" && hasCategoryId(values)) {
        try {
          const result = await getTemplates(values.categoryId as string);
          if ((result as any)?.success && (result as any)?.templates) {
            setTemplates(
              (result as any).templates.map((t: any) => ({
                id: t.id,
                name: t.name,
                description: t.description,
                estimatedDays: t.estimatedDays,
                icon: t.icon,
              }))
            );
          } else {
            setTemplates([]);
          }
        } catch {
          setTemplates([]);
        }
      }
    });
    return () => sub.unsubscribe();
  }, [form, requestType]);

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">
          {requestType === "catalog" ? "Yêu cầu theo Catalog" : "Yêu cầu Tùy chỉnh"}
        </h2>

        {/* Common fields */}
        <div className="space-y-4">
          <div>
            <Label>Tiêu đề *</Label>
            <Input {...form.register("title")} placeholder="Nhập tiêu đề yêu cầu" />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600 mt-1">{String(form.formState.errors.title.message)}</p>
            )}
          </div>

          <div>
            <Label>Mô tả chi tiết *</Label>
            <Textarea {...form.register("description")} rows={5} placeholder="Mô tả chi tiết yêu cầu..." />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600 mt-1">{String(form.formState.errors.description.message)}</p>
            )}
          </div>

          {/* CATALOG: Category + Template */}
          {requestType === "catalog" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Phòng ban xử lý *</Label>
                  <Select
                    value={selectedTeam || undefined}
                    onValueChange={(val: string) => {
                      form.setValue("teamId" as any, val);
                      form.setValue("categoryId" as any, "" as any);
                      form.setValue("templateId" as any, "" as any);
                      setTemplates([]);
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
                  {errors.teamId && (
                    <p className="text-sm text-red-600 mt-1">{String(errors.teamId.message)}</p>
                  )}
                </div>

                <div>
                  <Label>Phân loại *</Label>
                  <Select
                    value={selectedCategory || undefined}
                    onValueChange={(val: string) => {
                      form.setValue("categoryId" as any, val);
                      form.setValue("templateId" as any, "" as any);
                    }}
                    disabled={!selectedTeam}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !selectedTeam
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
                  {errors.categoryId && (
                    <p className="text-sm text-red-600 mt-1">{String(errors.categoryId.message)}</p>
                  )}
                </div>

                <div>
                  <Label>Template (optional)</Label>
                  <Select
                    onValueChange={(val: string) => {
                      if (val === "none") {
                        form.setValue("templateId" as any, "" as any);
                      } else {
                        form.setValue("templateId" as any, val);
                      }
                    }}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCategory ? "Chọn template" : "Chọn phân loại trước"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không dùng template</SelectItem>
                      {templates.length > 0 ? (
                        templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            <div className="flex items-center gap-2">
                              <span>{t.icon}</span>
                              <span>{t.name}</span>
                              {t.estimatedDays && (
                                <span className="text-xs text-gray-400">{t.estimatedDays} ngày</span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__no_template" disabled>
                          {selectedCategory ? "Không có template cho phân loại này" : "Chọn phân loại trước"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Chọn người xử lý - BẮT BUỘC khi cùng phòng ban */}
              {selectedTeam && selectedCategory && (
                <div className={isSameDepartment ? "p-4 border-2 border-amber-300 rounded-lg bg-amber-50" : ""}>
                  {isSameDepartment && (
                    <div className="mb-3 p-2 bg-amber-100 rounded text-amber-800 text-sm">
                      ⚠️ <strong>Yêu cầu cùng phòng ban</strong> - Bạn phải chọn người xử lý cụ thể
                    </div>
                  )}
                  <Label className={isSameDepartment ? "text-amber-900 font-semibold" : ""}>
                    <User className="w-4 h-4 inline mr-1" />
                    Người xử lý {isSameDepartment ? "*" : "(tuỳ chọn)"}
                  </Label>
                  {loadingMembers ? (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border mt-1">
                      <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                      <span className="text-sm text-gray-600">Đang tải danh sách nhân viên...</span>
                    </div>
                  ) : teamMembers.length > 0 ? (
                    <Select
                      value={selectedAssignee || undefined}
                      onValueChange={(val: string) => {
                        setSameDeptError(null);
                        if (val === "none") {
                          form.setValue("suggestedAssigneeId" as any, undefined);
                        } else {
                          form.setValue("suggestedAssigneeId" as any, val);
                        }
                      }}
                    >
                      <SelectTrigger className={sameDeptError ? "border-red-500" : ""}>
                        <SelectValue placeholder={isSameDepartment ? "Chọn người xử lý (bắt buộc)" : "Chọn nhân viên (tuỳ chọn)"} />
                      </SelectTrigger>
                      <SelectContent>
                        {!isSameDepartment && <SelectItem value="none">Để Leader phân công</SelectItem>}
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} ({member.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border text-sm text-gray-600 mt-1">
                      Phòng ban này chưa có nhân viên
                    </div>
                  )}
                  {sameDeptError && (
                    <p className="text-sm text-red-600 mt-1">{sameDeptError}</p>
                  )}
                  {!isSameDepartment && (
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Gợi ý nhân viên phù hợp để xử lý yêu cầu này
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
                ℹ️ Sau khi chọn phân loại, hệ thống sẽ đặt deadline và phòng ban xử lý phù hợp theo catalog.
              </div>
            </>
          )}

          {/* CUSTOM: Team + Custom Category */}
          {requestType === "custom" && (
            <>
              <div>
                <Label>Chọn phòng ban *</Label>
                <Select onValueChange={(val: string) => {
                  form.setValue("teamId" as any, val);
                  form.setValue("suggestedAssigneeId" as any, undefined);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phòng ban xử lý" />
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

              {/* Chọn người xử lý - BẮT BUỘC khi cùng phòng ban */}
              {selectedTeam && (
                <div className={isSameDepartment ? "p-4 border-2 border-amber-300 rounded-lg bg-amber-50" : ""}>
                  {isSameDepartment && (
                    <div className="mb-3 p-2 bg-amber-100 rounded text-amber-800 text-sm">
                      ⚠️ <strong>Yêu cầu cùng phòng ban</strong> - Bạn phải chọn người xử lý cụ thể
                    </div>
                  )}
                  <Label className={isSameDepartment ? "text-amber-900 font-semibold" : ""}>
                    <User className="w-4 h-4 inline mr-1" />
                    Người xử lý {isSameDepartment ? "*" : "(tuỳ chọn)"}
                  </Label>
                  {loadingMembers ? (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border mt-1">
                      <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                      <span className="text-sm text-gray-600">Đang tải danh sách nhân viên...</span>
                    </div>
                  ) : teamMembers.length > 0 ? (
                    <Select
                      value={selectedAssignee || undefined}
                      onValueChange={(val: string) => {
                        setSameDeptError(null);
                        if (val === "none") {
                          form.setValue("suggestedAssigneeId" as any, undefined);
                        } else {
                          form.setValue("suggestedAssigneeId" as any, val);
                        }
                      }}
                    >
                      <SelectTrigger className={sameDeptError ? "border-red-500" : ""}>
                        <SelectValue placeholder={isSameDepartment ? "Chọn người xử lý (bắt buộc)" : "Chọn nhân viên (tuỳ chọn)"} />
                      </SelectTrigger>
                      <SelectContent>
                        {!isSameDepartment && <SelectItem value="none">Để Leader phân công</SelectItem>}
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} ({member.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border text-sm text-gray-600 mt-1">
                      Phòng ban này chưa có nhân viên
                    </div>
                  )}
                  {sameDeptError && (
                    <p className="text-sm text-red-600 mt-1">{sameDeptError}</p>
                  )}
                  {!isSameDepartment && (
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Gợi ý nhân viên phù hợp để xử lý yêu cầu này
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label>Phân loại tùy chỉnh (optional)</Label>
                <Input {...form.register("customCategory")} placeholder="VD: Yêu cầu khẩn cấp ngoài catalog" />
              </div>
            </>
          )}

          {/* Priority */}
          <div>
            <Label>Độ ưu tiên *</Label>
            <Select onValueChange={(val: string) => form.setValue("priority" as any, (toPriority(val) as any))} defaultValue="MEDIUM">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">🟢 Thấp</SelectItem>
                <SelectItem value="MEDIUM">🟡 Trung bình</SelectItem>
                <SelectItem value="HIGH">🟠 Cao</SelectItem>
                <SelectItem value="URGENT">🔴 Khẩn cấp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deadline Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Từ ngày</Label>
              <DateTimePicker
                value={form.watch("deadlineFrom" as any) ? new Date(form.watch("deadlineFrom" as any) as Date) : null}
                onChange={(date) => {
                  form.setValue("deadlineFrom" as any, date || undefined);
                }}
                placeholder="Chọn ngày và giờ bắt đầu"
                minDate={new Date()}
              />
              {errors.deadlineFrom && (
                <p className="text-sm text-red-600 mt-1">{String(errors.deadlineFrom.message)}</p>
              )}
            </div>
            <div>
              <Label>Đến ngày</Label>
              <DateTimePicker
                value={form.watch("deadlineTo" as any) ? new Date(form.watch("deadlineTo" as any) as Date) : null}
                onChange={(date) => {
                  form.setValue("deadlineTo" as any, date || undefined);
                }}
                placeholder="Chọn ngày và giờ kết thúc"
                minDate={form.watch("deadlineFrom" as any) ? new Date(form.watch("deadlineFrom" as any) as Date) : new Date()}
              />
              {errors.deadlineTo && (
                <p className="text-sm text-red-600 mt-1">{String(errors.deadlineTo.message)}</p>
              )}
            </div>
          </div>

          {/* Requester Type */}
          <div>
            <Label>Loại người yêu cầu *</Label>
            <RadioGroup
              defaultValue="INTERNAL"
              onValueChange={(val: string) => form.setValue("requesterType" as any, val as any)}
              className="flex gap-6 mt-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="INTERNAL" id="internal" />
                <Label htmlFor="internal" className="font-normal cursor-pointer">
                  Nội bộ
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="CUSTOMER" id="customer" />
                <Label htmlFor="customer" className="font-normal cursor-pointer">
                  Khách hàng
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-gray-500 mt-1">Yêu cầu từ khách hàng sẽ được ưu tiên cao hơn</p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Quay lại
        </Button>
        <Button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-medium">
          Tiếp tục →
        </Button>
      </div>
    </form>
  );
}

// TeamDisplayField Component
function TeamDisplayField({ categoryId }: { categoryId?: string }) {
  const [team, setTeam] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryId) {
      setTeam(null);
      return;
    }

    // Fetch team from category
    setLoading(true);
    fetch(`/api/categories/${categoryId}/team`)
      .then((res) => res.json())
      .then((data) => {
        if (data.team) {
          setTeam(data.team);
        } else {
          setTeam({ id: "general", name: "Chưa xác định" });
        }
      })
      .catch(() => {
        setTeam({ id: "error", name: "Lỗi tải phòng ban" });
      })
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (!categoryId) {
    return (
      <Input
        value="Chọn phân loại để xem phòng ban"
        disabled
        className="bg-gray-50 text-gray-500"
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
        <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full" />
        <span className="text-sm text-gray-600">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
        {team?.name.charAt(0).toUpperCase() || "?"}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{team?.name || "Đang tải..."}</p>
        <p className="text-xs text-gray-600">Phòng ban xử lý</p>
      </div>
      <div className="text-primary-600">
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
        </svg>
      </div>
    </div>
  );
}


