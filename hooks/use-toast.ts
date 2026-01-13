import { toast as sonnerToast } from "sonner";

export function useToast() {
  return {
    success: (title: string, description?: string, duration?: number) => {
      return sonnerToast.success(title, {
        description,
        duration: duration ?? 3000,
      });
    },
    error: (title: string, description?: string, duration?: number) => {
      return sonnerToast.error(title, {
        description,
        duration: duration ?? 5000,
      });
    },
    warning: (title: string, description?: string, duration?: number) => {
      return sonnerToast.warning(title, {
        description,
        duration: duration ?? 4000,
      });
    },
    info: (title: string, description?: string, duration?: number) => {
      return sonnerToast.info(title, {
        description,
        duration: duration ?? 3000,
      });
    },
    remove: (toastId?: string | number) => {
      sonnerToast.dismiss(toastId);
    },
    clear: () => {
      sonnerToast.dismiss();
    },
  };
}
