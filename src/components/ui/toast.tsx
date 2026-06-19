"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "info" | "error";
interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (
    title: string,
    opts?: { description?: string; variant?: ToastVariant }
  ) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback(
    (id: number) => setToasts((p) => p.filter((t) => t.id !== id)),
    []
  );

  const toast = useCallback<ToastContextValue["toast"]>(
    (title, opts) => {
      const id = ++idRef.current;
      setToasts((p) => [
        ...p,
        { id, title, description: opts?.description, variant: opts?.variant ?? "success" },
      ]);
      setTimeout(() => remove(id), 3400);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const map: Record<ToastVariant, { icon: ReactNode; color: string }> = {
    success: { icon: <Check className="h-4 w-4" />, color: "text-success" },
    info: { icon: <Info className="h-4 w-4" />, color: "text-primary" },
    error: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-danger" },
  };
  const s = map[toast.variant];
  return (
    <div className="animate-toast-in pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-popover/95 p-3.5 shadow-xl backdrop-blur">
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5",
          s.color
        )}
      >
        {s.icon}
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        aria-label="Dismiss"
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
