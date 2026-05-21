import { toast as sonnerToast } from "sonner";

type ToastType = 'success' | 'error' | 'info';

export const useToast = () => {
  return {
    toast: (message: string, type: ToastType = 'info') => {
      if (type === 'success') {
        sonnerToast.success(message);
      } else if (type === 'error') {
        sonnerToast.error(message);
      } else {
        sonnerToast(message);
      }
    }
  };
};
