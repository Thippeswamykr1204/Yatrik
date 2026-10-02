import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/studio/AuthForm";
export const metadata: Metadata = { title: "Let the good trips begin" };
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 w-full max-w-sm" />}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
