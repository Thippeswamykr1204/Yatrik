"use client";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();
  return (
    <div
      data-toast
      className="pointer-events-none fixed bottom-5 left-5 right-5 z-[80] flex flex-col items-end gap-3"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon =
            toast.type === "success"
              ? CheckCircle2
              : toast.type === "error"
                ? TriangleAlert
                : Info;
          return (
            <motion.div
              key={toast.id}
              role={toast.type === "error" ? "alert" : "status"}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="pointer-events-auto flex w-full max-w-sm gap-3 rounded-2xl border line surface p-4 shadow-lg"
            >
              <Icon
                size={19}
                className={toast.type === "error" ? "text-[var(--error)]" : ""}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && (
                  <p className="muted mt-1 text-[13px] leading-5">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="icon-btn !h-7 !w-7"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
