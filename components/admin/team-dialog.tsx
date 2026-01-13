"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTeam, updateTeam } from "@/actions/admin/teams";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

const teamFormSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(50, "Tên không quá 50 ký tự"),
  description: z.string().max(500, "Mô tả không quá 500 ký tự").optional(),
  leaderId: z.string().nullable(),
});

type TeamFormData = z.infer<typeof teamFormSchema>;

interface Team {
  id: string;
  name: string;
  description: string | null;
}

interface User {
  id: string;
  name: string;
  role: string;
  teamId: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  team?: Team;
  leaders: User[];
  onSuccess?: () => void;
}

export function TeamDialog({
  open,
  onOpenChange,
  mode,
  team,
  leaders,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      description: "",
      leaderId: null,
    },
  });

  // Load team data for edit mode
  useEffect(() => {
    if (mode === "edit" && team) {
      setValue("name", team.name);
      setValue("description", team.description || "");
    } else if (mode === "create") {
      reset();
    }
  }, [mode, team, setValue, reset]);

  const onSubmit = async (data: TeamFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (mode === "create") {
        await createTeam(data as any);
      } else if (mode === "edit" && team) {
        await updateTeam(team.id, data);
      }

      router.refresh();
      onOpenChange(false);
      onSuccess?.();
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const selectedLeaderId = watch("leaderId");
  const selectedLeader = leaders.find((l) => l.id === selectedLeaderId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tạo team mới" : "Chỉnh sửa team"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên team *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Team IT, Team CS..."
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <textarea
              id="description"
              {...register("description")}
              placeholder="Mô tả về team, nhiệm vụ chính..."
              disabled={loading}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Leader */}
          <div className="space-y-2">
            <Label htmlFor="leader">Leader (tùy chọn)</Label>
            <Select
              value={watch("leaderId") || "none"}
              onValueChange={(value) => setValue("leaderId", value === "none" ? null : value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn leader" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không có leader</SelectItem>
                {leaders.map((leader) => (
                  <SelectItem key={leader.id} value={leader.id}>
                    {leader.name}
                    {leader.teamId && leader.teamId !== team?.id && (
                      <span className="text-xs text-amber-600 ml-2">(đang ở team khác)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLeader?.teamId && selectedLeader.teamId !== team?.id && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded p-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  Leader này hiện đang thuộc team khác. Chọn họ sẽ chuyển họ sang team này.
                </p>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : mode === "create" ? "Tạo" : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

