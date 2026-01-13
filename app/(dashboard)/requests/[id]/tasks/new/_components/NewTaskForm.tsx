"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTaskForRequest } from "@/actions/task";

interface NewTaskFormProps {
  requestId: string;
  teamMembers: Array<{
    id: string;
    name: string | null;
    email: string | null;
  }>;
}

export default function NewTaskForm({ requestId, teamMembers }: NewTaskFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigneeId: "",
    deadline: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề');
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting task:', { requestId, ...formData });
      
      const result = await createTaskForRequest(requestId, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        assigneeId: formData.assigneeId || undefined,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
      });

      console.log('Result:', result);

      if (result.success) {
        console.log('✅ Task created, redirecting...');
        router.push(`/requests/${requestId}`);
        router.refresh();
      } else {
        throw new Error(result.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('❌ Error creating task:', error);
      alert(error instanceof Error ? error.message : 'Không thể tạo nhiệm vụ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chi tiết nhiệm vụ</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Nhập tiêu đề nhiệm vụ"
            />
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Mô tả chi tiết nhiệm vụ..."
            />
          </div>

          <div>
            <Label htmlFor="assignee">Người thực hiện</Label>
            <Select value={formData.assigneeId} onValueChange={(value) => setFormData({ ...formData, assigneeId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn người thực hiện" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="deadline">Hạn hoàn thành</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.title.trim()}
              className="bg-primary-500 hover:bg-primary-600 text-white shadow-sm"
            >
              {loading ? 'Đang tạo...' : 'Tạo nhiệm vụ'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
