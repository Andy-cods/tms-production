import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  description?: string;
  icon?: React.ReactNode;
  onDismiss?: () => void;
}

// Type-safe toast functions
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      duration: options?.duration ?? 3000,
      description: options?.description,
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
      ...options,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: options?.duration ?? 5000,
      description: options?.description,
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
      ...options,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      duration: options?.duration ?? 4000,
      description: options?.description,
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
      ...options,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      duration: options?.duration ?? 3000,
      description: options?.description,
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
      ...options,
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      duration: Infinity, // No auto-dismiss
      description: options?.description,
      ...options,
    });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      duration: options?.duration,
      description: options?.description,
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
    });
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  custom: (message: string, options?: ToastOptions & { icon?: React.ReactNode }) => {
    return sonnerToast(message, {
      duration: options?.duration,
      description: options?.description,
      icon: options?.icon,
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
      ...options,
    });
  },
};

// Rich content toast helpers
export const toastRich = {
  withAvatar: (message: string, avatar: string, options?: ToastOptions) => {
    // Simple avatar toast without custom icon
    return toast.custom(message, {
      ...options,
    });
  },

  withImage: (message: string, imageUrl: string, options?: ToastOptions) => {
    return sonnerToast.message(message, {
      ...options,
    });
  },

  withAction: (message: string, action: ToastOptions["action"], options?: ToastOptions) => {
    return toast.custom(message, {
      ...options,
      action,
    });
  },
};

export type { ToastOptions };

