"use client";
import { ErrorPanel } from "@/components/studio/States";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="shell">
      <ErrorPanel
        title="An unexpected turn."
        message="Something went wrong loading this page. Please try again, or take a step back to exploring."
        retry={reset}
      />
    </div>
  );
}
