"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { PageSkeleton } from "@/components/studio/States";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStore();
  useEffect(() => {
    if (!isLoading && !isAuthenticated)
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
  }, [isAuthenticated, isLoading, pathname, router]);
  if (isLoading || !isAuthenticated) return <PageSkeleton />;
  return children;
}
