"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Compass,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useTrips } from "@/hooks/useTrips";
import { destinationImage, formatMoney } from "@/lib/travel";
import { ErrorPanel, PageSkeleton } from "@/components/studio/States";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/common/Dialog";
import type { Trip } from "@/types/models";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [toDelete, setToDelete] = useState<Trip | null>(null);
  const {
    trips,
    stats,
    isLoading,
    isError,
    isDeleting,
    deleteTrip,
    refetch,
    pages,
    total,
  } = useTrips({
    page,
    limit: 9,
    status: status || undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteTrip(toDelete._id);
      setToDelete(null);
      if (trips.length === 1 && page > 1) setPage(page - 1);
    } catch {
      /* The mutation displays the error and leaves the dialog open for retry. */
    }
  }
  return (
    <div className="shell py-10 sm:py-14">
      <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow muted mb-3">
            YOUR OWN LITTLE CORNER OF THE WORLD
          </p>
          <h1 className="display text-4xl sm:text-5xl">
            More stories to tell
            {user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
          </h1>
          <p className="muted mt-4 text-base">
            The places on your mind. The adventures on your horizon.
          </p>
        </div>
        <Link href="/plan" className="btn btn-primary w-fit shrink-0">
          <Plus size={16} /> A new adventure
        </Link>
      </div>
      {isError ? (
        <ErrorPanel
          title="Your plans took a little detour."
          message="We couldn’t load your trips. This isn’t an empty library—please try again."
          retry={() => void refetch()}
        />
      ) : (
        <>
          <div className="mb-9 grid grid-cols-3 rounded-2xl border line surface py-6">
            <div className="px-5 sm:px-7">
              <p className="display text-3xl">{stats?.totalTrips ?? "—"}</p>
              <p className="muted mt-2 text-[12px]">Stories in the making</p>
            </div>
            <div className="border-x line px-5 sm:px-7">
              <p className="display text-3xl">
                {stats?.totalDaysPlanned ?? "—"}
              </p>
              <p className="muted mt-2 text-[12px]">Days of discovery</p>
            </div>
            <div className="px-5 sm:px-7">
              <p className="display text-3xl">{stats?.completedTrips ?? "—"}</p>
              <p className="muted mt-2 text-[12px]">Trips to remember</p>
            </div>
          </div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div aria-label="Filter trips" className="flex gap-2">
              {[
                { value: "", label: "All my trips" },
                { value: "draft", label: "In the making" },
                { value: "completed", label: "Been there" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => {
                    setStatus(item.value);
                    setPage(1);
                  }}
                  aria-pressed={status === item.value}
                  className={`rounded-full px-4 py-2.5 text-[13px] transition ${status === item.value ? "bg-[var(--forest)] text-[var(--paper)]" : "border line hover:bg-[var(--soft)]"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span className="muted text-[12px]">
              {total} {total === 1 ? "trip" : "trips"}
            </span>
          </div>
          {isLoading ? (
            <PageSkeleton />
          ) : trips.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => (
                <article className="card overflow-hidden" key={trip._id}>
                  <Link
                    href={`/dashboard/trip/${trip._id}`}
                    className="photo-hover block"
                  >
                    <div className="relative aspect-[1.65]">
                      <Image
                        src={destinationImage(trip.destination)}
                        alt={`Travel inspiration for ${trip.destination}`}
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                        className="object-cover"
                      />
                      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[12px] text-[#203c30]">
                        {trip.generationStatus === "failed"
                          ? "Ready to retry"
                          : trip.generationStatus === "queued" ||
                              trip.generationStatus === "generating"
                            ? "Coming together…"
                            : trip.status === "completed"
                              ? "A trip to remember"
                              : "In the making"}
                      </span>
                    </div>
                    <div className="px-5 pt-5">
                      <h2 className="text-xl font-semibold tracking-tight">
                        {trip.destination}
                      </h2>
                      <p className="muted mt-3 flex items-center gap-3 text-[12px]">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={12} />
                          {trip.durationDays} days
                        </span>
                        <span>·</span>
                        <span>
                          {trip.estimatedBudget.total > 0
                            ? `${formatMoney(trip.estimatedBudget.total)} est.`
                            : "A fresh start"}
                        </span>
                      </p>
                    </div>
                  </Link>
                  <div className="mx-5 mb-4 mt-5 flex items-center justify-between border-t line pt-3">
                    <Link
                      href={`/dashboard/trip/${trip._id}`}
                      className="text-link !text-[13px]"
                    >
                      Open this chapter <ArrowUpRight size={14} />
                    </Link>
                    <button
                      className="icon-btn !h-8 !w-8 muted"
                      onClick={() => setToDelete(trip)}
                      aria-label={`Delete trip to ${trip.destination}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="card px-6 py-16 text-center">
              <Compass
                size={42}
                strokeWidth={1.1}
                className="mx-auto mb-6 muted"
              />
              <h2 className="display text-3xl">
                {status
                  ? "A chapter still to be written."
                  : "Every great story starts somewhere."}
              </h2>
              <p className="muted mx-auto mb-7 mt-4 max-w-sm text-base leading-7">
                {status
                  ? "No trips in this collection yet. Your next adventure is waiting."
                  : "A place you’ve been dreaming of. A weekend that’s wide open. Let’s turn it into something good."}
              </p>
              <Link href="/plan" className="btn btn-primary">
                Plan my first escape <ArrowUpRight size={16} />
              </Link>
              <div className="mt-5">
                <Link href="/itinerary/sample" className="text-link muted">
                  Or take a peek at a sample itinerary
                </Link>
              </div>
            </div>
          )}
          {pages > 1 && (
            <nav
              aria-label="Trip pages"
              className="mt-8 flex items-center justify-center gap-5"
            >
              <button
                aria-label="Previous page"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage(page - 1)}
                className="icon-btn border line"
              >
                <ArrowLeft size={15} />
              </button>
              <span className="text-sm muted">
                Page {page} of {pages}
              </span>
              <button
                aria-label="Next page"
                disabled={page >= pages || isLoading}
                onClick={() => setPage(page + 1)}
                className="icon-btn border line"
              >
                <ArrowRight size={15} />
              </button>
            </nav>
          )}
        </>
      )}
      <Dialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setToDelete(null);
        }}
      >
        <DialogContent>
          <DialogTitle className="pr-8 text-xl font-semibold">
            Let this one go?
          </DialogTitle>
          <DialogDescription className="muted mb-6 mt-3 text-base leading-7">
            Deleting your trip to {toDelete?.destination} removes its itinerary,
            budget, and packing list permanently. This can’t be undone.
          </DialogDescription>
          <div className="flex gap-3">
            <button
              className="btn btn-secondary flex-1"
              onClick={() => setToDelete(null)}
              disabled={Boolean(isDeleting)}
            >
              Keep the adventure
            </button>
            <button
              className="btn flex-1 bg-[#9b3434] text-white"
              onClick={confirmDelete}
              disabled={Boolean(isDeleting)}
            >
              {isDeleting ? "Deleting…" : "Delete trip"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
