"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Menu, X, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth.service";
import { useToast } from "@/store/uiStore";
import { Brand } from "./Brand";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, clearAuth } = useAuthStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const links = [
    { href: "/#discover", label: "Discover" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/dashboard", label: "My trips" },
  ];
  const signOut = async () => {
    setSigningOut(true);
    try {
      await authService.logout();
      clearAuth();
      queryClient.clear();
      setOpen(false);
      router.push("/");
    } catch {
      toast.error(
        "Could not sign out",
        "Please try again to securely end your session.",
      );
    } finally {
      setSigningOut(false);
    }
  };
  return (
    <header className="sticky top-0 z-50 border-b line bg-[var(--paper)]/95 backdrop-blur-xl">
      <div className="shell flex h-[78px] items-center justify-between gap-6">
        <Brand />
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-9 md:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="text-[15px] font-medium muted transition hover:text-[var(--ink)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated ? (
            <button
              className="icon-btn hidden sm:inline-flex"
              onClick={signOut}
              disabled={signingOut}
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="hidden text-sm font-semibold sm:block"
            >
              Log in
            </Link>
          )}
          <Link
            href="/plan"
            className="btn btn-primary hidden min-h-10 px-5 text-sm sm:inline-flex"
          >
            Plan a trip <ArrowUpRight size={15} />
          </Link>
          <button
            className="icon-btn md:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile navigation"
          className="shell grid gap-1 border-t line py-4 md:hidden"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-3 text-base"
            >
              {link.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="px-2 py-3 text-base"
            >
              Log in
            </Link>
          )}
          <Link
            href="/plan"
            className="btn btn-primary mt-2"
            onClick={() => setOpen(false)}
          >
            Plan a trip <ArrowUpRight size={16} />
          </Link>
          {isAuthenticated && (
            <button
              className="py-3 text-left text-base"
              onClick={signOut}
              disabled={signingOut}
            >
              Sign out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
