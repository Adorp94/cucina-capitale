// Adapted from shadcn/ui toast component
// https://ui.shadcn.com/docs/components/toast

import { toast as sonnerToast, type ToastT } from "sonner"

const DEFAULT_TOAST_DURATION = 5000

export type ToastProps = ToastT & {
  title?: string
  description?: string
  duration?: number
  variant?: "default" | "destructive" | "success"
}

export function useToast() {
  return {
    toast: ({ title, description, ...props }: ToastProps) => {
      return sonnerToast(title, {
        description,
        duration: DEFAULT_TOAST_DURATION,
        ...props,
      })
    },
    dismiss: sonnerToast.dismiss,
    error: (message: string, options?: Omit<ToastProps, "title">) => {
      return sonnerToast.error(message, options)
    },
    success: (message: string, options?: Omit<ToastProps, "title">) => {
      return sonnerToast.success(message, options)
    },
    warning: (message: string, options?: Omit<ToastProps, "title">) => {
      return sonnerToast.warning(message, options)
    },
    info: (message: string, options?: Omit<ToastProps, "title">) => {
      return sonnerToast.info(message, options)
    },
  }
} 