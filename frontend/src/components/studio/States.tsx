import Link from "next/link";
import { ArrowUpRight, Compass, RefreshCw } from "lucide-react";

export function PageSkeleton() {
  return (
    <div
      className="shell space-y-6 py-12"
      role="status"
      aria-label="Loading your next chapter"
    >
      <div className="skeleton h-4 w-32" />
      <div className="skeleton h-12 w-3/4 max-w-xl" />
      <div className="grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-64" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
export function ErrorPanel({
  title = "A little detour.",
  message = "We couldn’t load this page. Please give it another try.",
  retry,
}: {
  title?: string;
  message?: string;
  retry?: () => void;
}) {
  return (
    <div className="card mx-auto my-12 max-w-lg p-9 text-center" role="alert">
      <Compass className="mx-auto mb-5 muted" size={35} strokeWidth={1.2} />
      <h1 className="display text-3xl">{title}</h1>
      <p className="muted my-5 text-base leading-7">{message}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {retry && (
          <button className="btn btn-primary" onClick={retry}>
            <RefreshCw size={14} /> Try again
          </button>
        )}
        <Link href="/" className="btn btn-secondary">
          Back to exploring <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
}
