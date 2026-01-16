'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { deleteRequest } from '@/actions/requests';

interface DeleteRequestModalProps {
  requestId: string;
  requestTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectAfterDelete?: boolean;
}

export function DeleteRequestModal({
  requestId,
  requestTitle,
  open,
  onOpenChange,
  redirectAfterDelete = false,
}: DeleteRequestModalProps) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [isPending, startTransition] = useTransition();
  
  const handleDelete = async () => {
    if (confirmText !== 'XÓA') {
      toast.error('Vui lòng nhập "XÓA" để xác nhận');
      return;
    }

    startTransition(async () => {
      try {
        await deleteRequest(requestId);
        toast.success('Đã xóa yêu cầu thành công');
        onOpenChange(false);
        
        // Always redirect to /requests after deletion to avoid rendering deleted request page
        router.push('/requests');
      } catch (error: any) {
        toast.error(error.message || 'Không thể xóa yêu cầu');
      }
    });
  };
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          
          <AlertDialogTitle className="text-center text-2xl">
            Xóa yêu cầu?
          </AlertDialogTitle>
          
          <AlertDialogDescription className="text-center">
            <span className="text-base">
              Bạn có chắc chắn muốn xóa yêu cầu{" "}
              <strong>&quot;{requestTitle}&quot;</strong>?
            </span>
          </AlertDialogDescription>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
              <p className="font-semibold text-red-800 mb-2">Cảnh báo:</p>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                <li>Tất cả nhiệm vụ liên quan sẽ bị xóa</li>
                <li>Tất cả bình luận sẽ bị xóa</li>
                <li>Tệp đính kèm sẽ bị xóa</li>
                <li>Lịch sử hoạt động sẽ bị xóa</li>
                <li><strong>Hành động này không thể hoàn tác</strong></li>
              </ul>
            </div>
            
            <div className="text-left">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhập <strong>&quot;XÓA&quot;</strong> để xác nhận:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Nhập XÓA"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
                disabled={isPending}
              />
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            disabled={isPending}
            className="flex-1"
          >
            Hủy
          </AlertDialogCancel>
          
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== 'XÓA' || isPending}
            className="flex-1"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa vĩnh viễn
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
