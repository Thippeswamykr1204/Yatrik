"use client";

import { FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";
import { authService } from "@/services/auth.service";
import { errorMessage } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { safeReturnPath } from "@/lib/travel";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const router = useRouter();
  const params = useSearchParams();
  const next = safeReturnPath(params.get("next"));
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    const name = String(form.get("name") || "").trim();
    if (
      register &&
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,72}$/.test(password)
    ) {
      setError(
        "Use 8–72 characters with an uppercase letter, a lowercase letter, a number, and one of @$!%*?&.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = register
        ? await authService.register({
            name,
            email,
            password,
            confirmPassword: password,
          })
        : await authService.login({ email, password });
      // Never reuse another account's cached itinerary after a session switch.
      queryClient.clear();
      setAuth(result.user, result.accessToken);
      router.replace(next);
    } catch (cause) {
      setError(
        errorMessage(
          cause,
          "We couldn’t sign you in. Check your details and try again.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="w-full max-w-[390px]">
      <p className="eyebrow muted mb-4">
        {register
          ? "THERE’S A WHOLE WORLD WAITING"
          : "YOUR NEXT CHAPTER AWAITS"}
      </p>
      <h1 className="display text-[38px]">
        {register ? "Let the good trips begin." : "Good to see you again."}
      </h1>
      <p className="muted mb-8 mt-4 text-base leading-6">
        {register
          ? "A little space for your big travel plans. Create an account to make them yours."
          : "Sign in, pick up your plans, and keep the daydream going."}
      </p>
      <form onSubmit={submit} className="space-y-5">
        {register && (
          <div>
            <label className="field-label" htmlFor="name">
              Your name
            </label>
            <input
              id="name"
              name="name"
              className="field"
              autoComplete="name"
              placeholder="What should we call you?"
              required
              minLength={2}
              maxLength={100}
            />
          </div>
        )}
        <div>
          <label className="field-label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            name="email"
            className="field"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            maxLength={254}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              className="field pr-12"
              type={visible ? "text" : "password"}
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={register ? 8 : 1}
              maxLength={72}
              aria-describedby={register ? "password-help" : undefined}
            />
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              className="icon-btn absolute right-1 top-1"
              aria-label={visible ? "Hide password" : "Show password"}
            >
              {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {register && (
            <p id="password-help" className="muted mt-2 text-[12px] leading-5">
              8–72 characters with uppercase, lowercase, a number, and a symbol
              (@$!%*?&).
            </p>
          )}
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-[var(--error)]/30 p-3 text-sm leading-6 text-[var(--error)]"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary !mt-7 w-full"
        >
          {busy ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <>
              {register ? "Create my account" : "Welcome back"}{" "}
              <ArrowUpRight size={17} />
            </>
          )}
        </button>
      </form>
      {register && (
        <p className="muted mt-4 text-center text-[12px] leading-5">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy notice
          </Link>
          .
        </p>
      )}
      <p className="muted mt-7 text-center text-sm">
        {register ? "Already part of the journey?" : "New around here?"}{" "}
        <Link
          className="font-semibold text-[var(--ink)] underline underline-offset-4"
          href={`/auth/${register ? "login" : "register"}?next=${encodeURIComponent(next)}`}
        >
          {register ? "Log in" : "Create an account"}
        </Link>
      </p>
      <p className="muted mt-10 flex items-center justify-center gap-2 text-[12px]">
        <LockKeyhole size={12} /> Your plans stay private. Your next adventure
        stays yours.
      </p>
    </div>
  );
}
