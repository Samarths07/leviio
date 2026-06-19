"use client";

import type { ReactNode } from "react";
import { AppProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AppProvider>{children}</AppProvider>
    </ToastProvider>
  );
}
