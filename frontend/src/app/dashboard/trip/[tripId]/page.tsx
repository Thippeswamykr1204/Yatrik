"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Check, Compass, LoaderCircle, Sparkles } from "lucide-react";
import { useTrip } from "@/hooks/useTrips";
import { Itinerary } from "@/components/studio/Itinerary";
import { ErrorPanel, PageSkeleton } from "@/components/studio/States";
import { errorMessage } from "@/services/api";

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const {
    trip,
    isLoading,
    isError,
    isGenerating,
    refetch,
    generateItinerary,
    updateTrip,
  } = useTrip(tripId);
  const [error, setError] = useState("");
  async function generate() {
    setError("");
    try {
      await generateItinerary();
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }
  if (isLoading) return <PageSkeleton />;
  if (isError || !trip)
    return (
      <div className="shell">
        <ErrorPanel
          title="We couldn’t find this chapter."
          message="The trip may have been removed, may belong to another account, or the connection was interrupted."
          retry={() => void refetch()}
        />
      </div>
    );
  if (
    isGenerating ||
    !trip.itinerary.length ||
    trip.generationStatus === "failed"
  ) {
    const working = isGenerating;
    return (
      <div className="shell py-16 sm:py-24">
        <div className="mx-auto max-w-xl text-center">
          <span className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full soft">
            {working ? (
              <Compass
                size={38}
                className="animate-[spin_12s_linear_infinite]"
                strokeWidth={1.1}
              />
            ) : (
              <Sparkles size={34} strokeWidth={1.2} />
            )}
          </span>
          <p className="eyebrow muted mb-4">{trip.destination}</p>
          <h1 className="display text-4xl sm:text-5xl">
            {working
              ? "Good things are coming together."
              : trip.generationStatus === "failed"
                ? "A little detour. Not the end of the road."
                : "Your next chapter is ready to begin."}
          </h1>
          <p className="muted mx-auto mt-5 max-w-md text-base leading-7">
            {working
              ? "We’re finding the places, connecting the days, and leaving a little room for you. You can leave this page; your plan will keep coming together."
              : "Your trip details are safely saved. Let’s build a thoughtful itinerary around them."}
          </p>
          {working ? (
            <div className="card mt-8 p-6 text-left" aria-live="polite">
              <p className="mb-5 flex items-center gap-3 text-sm">
                <Check size={16} />
                Your travel style and preferences, noted.
              </p>
              <p className="flex items-center gap-3 text-sm">
                <LoaderCircle size={16} className="animate-spin" />
                {trip.generationStage ||
                  (trip.generationStatus === "queued"
                    ? "Your itinerary is in the planning queue."
                    : "Putting together your itinerary…")}
              </p>
              <p className="muted mt-5 border-t line pt-4 text-[12px] leading-6">
                Longer trips can take a few minutes. Progress is based on your
                actual generation job, not a countdown.
              </p>
            </div>
          ) : (
            <button className="btn btn-primary mt-7" onClick={generate}>
              <Sparkles size={16} />
              {trip.generationStatus === "failed"
                ? "Give it another go"
                : "Create my itinerary"}
            </button>
          )}
          {error && (
            <p role="alert" className="mt-5 text-sm text-[var(--error)]">
              {error}
            </p>
          )}
          <Link href="/dashboard" className="text-link muted mt-8">
            Back to my trips
          </Link>
        </div>
      </div>
    );
  }
  return <Itinerary trip={trip} onUpdate={updateTrip} />;
}
