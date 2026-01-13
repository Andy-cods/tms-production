"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  requestTitle: string;
  teamMembers: Array<{
    id: string;
    name: string | null;
    email: string | null;
    role?: string;
    teamName?: string | null;
  }>;
  loadingMembers?: boolean;
}

export function AssignDialog({
  open,
  onOpenChange,
  requestId,
  requestTitle,
  teamMembers,
  loadingMembers = false,
}: AssignDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const handleAssign = async () => {
    if (!selectedUserId) {
      alert("Vui lòng chọn người thực hiện");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/leader/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          assigneeId: selectedUserId,
        }),
      });

      if (response.ok) {
        alert("Phân công thành công!");
        onOpenChange(false);
        router.refresh();
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Không thể phân công");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Phân công nhiệm vụ</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Yêu cầu:</p>
            <p className="font-medium">{requestTitle}</p>
          </div>

          <div>
            <Label htmlFor="assignee">Chọn người thực hiện *</Label>
            <select
              id="assignee"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
              disabled={loadingMembers}
            >
              <option value="">
                {loadingMembers ? "Đang tải..." : "-- Chọn người thực hiện --"}
              </option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name || member.email}
                  {member.role && ` (${member.role})`}
                  {member.teamName && ` - ${member.teamName}`}
                </option>
              ))}
            </select>
            
            {/* Show message if no members */}
            {!loadingMembers && teamMembers.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                ⚠️ Không có thành viên nào trong team hoặc tất cả đang vắng mặt
              </p>
            )}
            
            {/* Show loading indicator */}
            {loadingMembers && (
              <p className="text-xs text-gray-500 mt-1">
                ⏳ Đang tải danh sách thành viên...
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleAssign} disabled={loading}>
            {loading ? "Đang xử lý..." : "Phân công"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


