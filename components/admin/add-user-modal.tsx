'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Role } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, User, Mail, Lock, Users, Briefcase, Phone, MessageSquare, ShieldCheck } from 'lucide-react';
import { addUser } from '@/actions/admin/users';
import { getTeams } from '@/actions/admin/teams';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PermissionTicketSelector } from '@/components/admin/permission-ticket-selector';

const userSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  role: z.nativeEnum(Role),
  teamId: z.string().optional(),
  positionText: z.string().optional(),
  phone: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .optional()
    .refine(
      (val) => !val || /^[0-9+\-\s()]*$/.test(val),
      'Số điện thoại không hợp lệ'
    )
    .refine(
      (val) => !val || val.replace(/[^0-9]/g, '').length >= 10,
      'Số điện thoại phải có ít nhất 10 số'
    ),
  telegramUsername: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .optional()
    .refine(
      (val) => !val || /^@?[a-zA-Z0-9_]{5,32}$/.test(val),
      'Telegram username không hợp lệ (5-32 ký tự, chỉ chữ, số, dấu gạch dưới)'
    ),
  permissionTickets: z.array(z.string()).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddUserModal({ open, onOpenChange }: AddUserModalProps) {
  const [teams, setTeams] = useState<any[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // Load teams when modal opens
  useEffect(() => {
    if (open) {
      setTeamsLoading(true);
      getTeams()
        .then((teams) => {
          setTeams(teams);
        })
        .catch((error) => {
          console.error('Failed to load teams:', error);
        })
        .finally(() => {
          setTeamsLoading(false);
        });
    }
  }, [open]);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: Role.STAFF,
      teamId: '',
      positionText: '',
      phone: '',
      telegramUsername: '',
      permissionTickets: [],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      // Clean up empty strings to undefined for optional fields
      const cleanedData = {
        ...data,
        teamId: data.teamId || undefined,
        positionText: data.positionText || undefined,
        phone: data.phone || undefined,
        telegramUsername: data.telegramUsername || undefined,
        permissionTickets: data.permissionTickets || [],
      };
      const user = await addUser(cleanedData);
      toast.success('Đã thêm người dùng thành công');
      form.reset();
      onOpenChange(false);
      // Optionally refresh the page or trigger a parent component refresh
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Không thể thêm người dùng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: UserFormData) => {
    handleSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Thêm người dùng mới
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Name */}
          <div>
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Họ và tên <span className="text-orange-500">*</span>
            </Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Nguyễn Văn A"
              className="mt-2"
            />
            {form.formState.errors.name && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          
          {/* Email */}
          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email <span className="text-orange-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              placeholder="nguyen.van.a@company.com"
              className="mt-2"
            />
            {form.formState.errors.email && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          
          {/* Position */}
          <div>
            <Label htmlFor="positionText" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Vị trí
            </Label>
            <Input
              id="positionText"
              type="text"
              {...form.register('positionText')}
              placeholder="Ví dụ: Senior Developer, Product Manager..."
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Vị trí công việc của nhân viên (điền tự do)
            </p>
            {form.formState.errors.positionText && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.positionText.message}
              </p>
            )}
          </div>
          
          {/* Phone */}
          <div>
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Số điện thoại
            </Label>
            <Input
              id="phone"
              type="tel"
              {...form.register('phone')}
              placeholder="+84 123 456 789"
              className="mt-2"
            />
            {form.formState.errors.phone && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.phone.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Số điện thoại liên hệ (tùy chọn)
            </p>
          </div>
          
          {/* Telegram */}
          <div>
            <Label htmlFor="telegramUsername" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Telegram
            </Label>
            <Input
              id="telegramUsername"
              type="text"
              {...form.register('telegramUsername')}
              placeholder="@username"
              className="mt-2"
            />
            {form.formState.errors.telegramUsername && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.telegramUsername.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Telegram username (5-32 ký tự, tùy chọn)
            </p>
          </div>
          
          {/* Password */}
          <div>
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Mật khẩu <span className="text-orange-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              {...form.register('password')}
              placeholder="••••••••"
              className="mt-2"
            />
            {form.formState.errors.password && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Người dùng nên đổi mật khẩu sau lần đăng nhập đầu tiên
            </p>
          </div>
          
          {/* Role */}
          <div>
            <Label htmlFor="role" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Vai trò <span className="text-orange-500">*</span>
            </Label>
            <select
              id="role"
              {...form.register('role')}
              className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value={Role.STAFF}>Nhân viên</option>
              <option value={Role.LEADER}>Leader</option>
              <option value={Role.ADMIN}>Admin</option>
            </select>
            {form.formState.errors.role && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.role.message}
              </p>
            )}
          </div>
          
          {/* Team */}
          <div>
            <Label htmlFor="teamId" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Đội nhóm
            </Label>
            <select
              id="teamId"
              {...form.register('teamId')}
              className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="">Không chọn</option>
              {teams?.map((team: any) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Tùy chọn. Người dùng có thể được gán vào đội sau
            </p>
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Phân quyền bổ sung
            </Label>
            <PermissionTicketSelector
              selected={form.watch('permissionTickets') || []}
              onChange={(next) => form.setValue('permissionTickets', next, { shouldDirty: true })}
              disabled={isSubmitting}
            />
          </div>
         
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-primary-500 hover:bg-primary-600 text-white font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Thêm người dùng
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
