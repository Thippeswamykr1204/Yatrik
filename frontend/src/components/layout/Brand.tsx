import Link from "next/link";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Yatrik home"
      className={`inline-flex items-center gap-2.5 ${light ? "text-[#edf0e3]" : ""}`}
    >
      <svg
        width="30"
        height="32"
        viewBox="0 0 30 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 5l12 10L27 5M15 15v14"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 3v5"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="15" cy="15" r="3" fill="currentColor" />
      </svg>
      <span className="font-[Manrope] text-[28px] font-extrabold tracking-[-1.4px]">
        yatrik<span className="text-[#8da460]">.</span>
      </span>
    </Link>
  );
}
