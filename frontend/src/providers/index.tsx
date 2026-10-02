"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { SESSION_HINT, useAuthStore } from "@/store/authStore";
import { ToastContainer } from "@/components/common/Toast";
import { authService } from "@/services/auth.service";

let initialization: Promise<void> | null = null;
function initializeAuth() {
  if (!initialization)
    initialization = (async () => {
      let hasSession = false;
      try {
        hasSession = localStorage.getItem(SESSION_HINT) === "1";
      } catch {
        /* No stored session hint. */
      }
      if (!hasSession) {
        useAuthStore.getState().setLoading(false);
        return;
      }
      try {
        const user = await authService.getMe();
        const token = useAuthStore.getState().accessToken;
        if (token) useAuthStore.getState().setAuth(user, token);
        else useAuthStore.getState().clearAuth();
      } catch {
        useAuthStore.getState().clearAuth();
      }
    })();
  return initialization;
}
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  useEffect(() => {
    void initializeAuth();
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        {children}
        <ToastContainer />
      </QueryClientProvider>
    </MotionConfig>
  );
}
