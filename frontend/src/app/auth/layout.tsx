import type { Metadata } from "next";
import Image from "next/image";
import { MapPin } from "lucide-react";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100svh-79px)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        {children}
      </div>
      <div className="relative m-4 ml-0 hidden min-h-[640px] overflow-hidden rounded-[24px] lg:block">
        <Image
          src="/destinations/kerala.jpg"
          alt="Green hills and open skies in Kerala"
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#173c2d]/90 via-[#173c2d]/10 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <span className="eyebrow text-[#d9edb0]">
            THE BEST SOUVENIRS ARE STORIES
          </span>
          <h2 className="display mb-5 mt-5 text-5xl">
            Somewhere new.
            <br />
            Something <span className="font-serif italic">you.</span>
          </h2>
          <p className="max-w-sm text-base leading-7 text-white/80">
            Find your quiet mornings, your unexpected favorites, your reason to
            take the long way home.
          </p>
          <p className="mt-8 flex items-center gap-2 text-sm text-white/70">
            <MapPin size={13} /> Kerala, India
          </p>
        </div>
      </div>
    </div>
  );
}
