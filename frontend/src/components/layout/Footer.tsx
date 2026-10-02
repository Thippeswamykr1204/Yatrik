import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer className="border-t line mt-16">
      <div className="shell flex flex-col justify-between gap-8 py-10 sm:flex-row sm:items-center">
        <div>
          <Brand />
          <p className="muted mt-3 text-sm">Less planning. More being there.</p>
        </div>
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-x-7 gap-y-4 text-sm muted"
        >
          <Link href="/itinerary/sample">
            A little inspiration{" "}
            <ArrowUpRight size={12} className="ml-1 inline" />
          </Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <span>© {new Date().getFullYear()} Yatrik</span>
        </nav>
      </div>
    </footer>
  );
}
