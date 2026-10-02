"use client";

import { FormEvent, useState } from "react";
import { ArrowDownRight, LoaderCircle, Wallet } from "lucide-react";
import { formatMoney } from "@/lib/travel";
import { tripsService } from "@/services/trips.service";
import { errorMessage } from "@/services/api";
import type { OptimizedBudget, Trip } from "@/types/models";

export function BudgetPanel({ trip, sample }: { trip: Trip; sample: boolean }) {
  const [target, setTarget] = useState("");
  const [result, setResult] = useState<OptimizedBudget | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function optimize(event: FormEvent) {
    event.preventDefault();
    if (busy || sample) return;
    const amount = Number(target);
    if (
      !Number.isFinite(amount) ||
      amount < 1 ||
      amount >= trip.estimatedBudget.total
    ) {
      setError("Choose a target below your current estimate and above ₹0.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      setResult(await tripsService.optimizeBudget(trip._id, amount));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  const categories = [
    { key: "accommodation", title: "A place to land", label: "Accommodation" },
    { key: "food", title: "Good food, good days", label: "Food & drinks" },
    { key: "transport", title: "The way there", label: "Local transport" },
    { key: "activities", title: "The memorable bits", label: "Activities" },
  ] as const;
  return (
    <div className="space-y-5">
      <div className="card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow muted mb-3">
              A LITTLE FINANCIAL PEACE OF MIND
            </p>
            <h2 className="display text-4xl">
              {formatMoney(trip.estimatedBudget.total)}
            </h2>
            <p className="muted mt-3 text-sm">
              Estimated trip spend · {trip.durationDays} days · INR
            </p>
          </div>
          <Wallet size={28} strokeWidth={1.2} />
        </div>
        <div className="mt-8 space-y-6">
          {categories.map(({ key, title, label }) => (
            <div key={key}>
              <div className="mb-2 flex items-end justify-between">
                <div>
                  <p className="text-base font-medium">{title}</p>
                  <p className="muted mt-1 text-[12px]">{label}</p>
                </div>
                <span className="text-base font-semibold">
                  {formatMoney(trip.estimatedBudget[key])}
                </span>
              </div>
              <div className="h-1.5 rounded-full soft">
                <div
                  className="h-full rounded-full bg-[var(--forest)] opacity-70"
                  style={{
                    width: `${Math.min(100, trip.estimatedBudget.total > 0 ? (trip.estimatedBudget[key] / trip.estimatedBudget.total) * 100 : 0)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="muted mt-7 border-t line pt-5 text-[13px] leading-6">
          Planning estimates, not quotes. Check prices and inclusions with
          providers. Flights to the destination, insurance, visas, and personal
          shopping may not be included. Keep a contingency for the unexpected.
        </p>
      </div>
      {!sample && (
        <div className="card p-6">
          <h3 className="mb-2 flex items-center gap-2 text-base font-semibold">
            <ArrowDownRight size={17} /> A little lighter on the wallet?
          </h3>
          <p className="muted mb-5 text-sm leading-6">
            Set a smaller target. Your assistant will suggest trade-offs without
            changing the saved plan.
          </p>
          <form onSubmit={optimize} className="flex flex-wrap gap-3">
            <label htmlFor="target-budget" className="sr-only">
              Target budget in rupees
            </label>
            <input
              id="target-budget"
              type="number"
              min={1}
              max={Math.max(1, trip.estimatedBudget.total - 1)}
              className="field min-w-0 flex-1"
              placeholder="Your target in ₹"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
            <button className="btn btn-primary" disabled={busy}>
              {busy ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                "Find a better fit"
              )}
            </button>
          </form>
          {error && (
            <p role="alert" className="mt-4 text-sm text-[var(--error)]">
              {error}
            </p>
          )}
          {result && (
            <div className="mt-5 rounded-xl soft p-5" role="status">
              <p className="text-base font-semibold">
                Suggested total: {formatMoney(result.optimizedBudget.total)}
              </p>
              <p className="muted mt-1 text-sm">
                Potential savings: {formatMoney(result.savings)}
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-4 text-sm leading-6">
                {[
                  ...result.suggestions.activityAdjustments,
                  ...result.suggestions.generalTips,
                ].map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
              <p className="muted mt-4 text-[12px]">
                Suggestions only. Your saved itinerary and budget are unchanged.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
