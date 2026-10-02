"use client";

import { FormEvent, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  Circle,
  Clock3,
  Download,
  ExternalLink,
  Leaf,
  ListChecks,
  LoaderCircle,
  MapPin,
  Moon,
  Pencil,
  RefreshCw,
  Sparkles,
  Sun,
  Sunrise,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/common/Dialog";
import { BudgetPanel } from "./BudgetPanel";
import { TripAssistant } from "./TripAssistant";
import { destinationImage, formatMoney } from "@/lib/travel";
import { errorMessage } from "@/services/api";
import { tripsService, type UpdateTripInput } from "@/services/trips.service";
import type { Activity, ItineraryDay, Trip } from "@/types/models";

const tabs = [
  { id: "days", label: "The itinerary", icon: CalendarDays },
  { id: "budget", label: "Your budget", icon: Wallet },
  { id: "stays", label: "Places to stay", icon: Moon },
  { id: "packing", label: "Pack a little smarter", icon: ListChecks },
  { id: "assistant", label: "Ask Yatrik", icon: Sparkles },
] as const;
type Tab = (typeof tabs)[number]["id"];
export function Itinerary({
  trip,
  onUpdate,
  sample = false,
}: {
  trip: Trip;
  onUpdate: (trip: Trip) => void;
  sample?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("days");
  const [dayIndex, setDayIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [regenerate, setRegenerate] = useState(false);
  const [editing, setEditing] = useState<{
    day: number;
    index: number;
    activity: Activity;
  } | null>(null);
  const lock = useRef(false);
  const activeDay = trip.itinerary[dayIndex];
  const totalActivities = trip.itinerary.flatMap(
    (day) => day.activities,
  ).length;
  const done = trip.itinerary
    .flatMap((day) => day.activities)
    .filter((a) => a.completed).length;
  async function run(action: () => Promise<Trip>) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      onUpdate(await action());
      return true;
    } catch (cause) {
      setError(errorMessage(cause));
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function save(update: UpdateTripInput) {
    return run(() =>
      sample
        ? Promise.resolve({ ...trip, ...update })
        : tripsService.update(trip._id, update),
    );
  }
  function toggleActivity(dayNumber: number, index: number) {
    void save({
      itinerary: trip.itinerary.map((day) =>
        day.dayNumber !== dayNumber
          ? day
          : {
              ...day,
              activities: day.activities.map((activity, i) =>
                i === index
                  ? { ...activity, completed: !activity.completed }
                  : activity,
              ),
            },
      ),
    });
  }
  async function editActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title")).trim();
    if (!title) return;
    const cost = Number(form.get("cost"));
    if (!Number.isFinite(cost) || cost < 0) return;
    const updated = {
      ...editing.activity,
      title,
      description: String(form.get("description")).trim(),
      location: String(form.get("location")).trim(),
      estimatedCostINR: cost,
    };
    if (
      await save({
        itinerary: trip.itinerary.map((day) =>
          day.dayNumber !== editing.day
            ? day
            : {
                ...day,
                activities: day.activities.map((activity, i) =>
                  i === editing.index ? updated : activity,
                ),
              },
        ),
      })
    )
      setEditing(null);
  }
  async function regenerateDay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeDay || sample) return;
    const feedback = String(
      new FormData(event.currentTarget).get("feedback"),
    ).trim();
    if (
      await run(() =>
        tripsService.regenerateDay(trip._id, activeDay.dayNumber, feedback),
      )
    )
      setRegenerate(false);
  }
  function exportTrip() {
    const text = [
      `${trip.destination} — ${trip.durationDays} days`,
      sample ? "Yatrik illustrative sample itinerary" : "Your Yatrik itinerary",
      "",
      ...trip.itinerary.flatMap((day) => [
        `DAY ${day.dayNumber}`,
        ...day.activities.map(
          (a) =>
            `${a.timeOfDay}: ${a.title}\n${a.description}\n${a.location || ""} · Estimated ${formatMoney(a.estimatedCostINR)}\n`,
        ),
        "",
      ]),
      `Estimated trip budget: ${formatMoney(trip.estimatedBudget.total)}`,
      "",
      "PACKING",
      ...trip.packingList.map(
        (item) => `${item.isPacked ? "[x]" : "[ ]"} ${item.item}`,
      ),
      "",
      "AI suggestions and estimates are not verified bookings. Check local conditions, prices, and opening hours before traveling.",
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `yatrik-${trip.destination.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function daySection(day: ItineraryDay, printed = false) {
    return (
      <section key={day.dayNumber} aria-label={`Day ${day.dayNumber}`}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow muted mb-2">
              DAY {String(day.dayNumber).padStart(2, "0")}
            </p>
            <h2 className="text-2xl font-medium tracking-[-.04em]">
              {day.activities[0]?.location?.split(",")[0] ||
                "A day of little discoveries"}
            </h2>
            <p className="muted mt-2 text-sm">
              {day.activities.length} moments to make your own. No need to rush.
            </p>
          </div>
          {!printed && !sample && (
            <button
              className="text-link no-print rounded-full border line px-4 py-2.5"
              onClick={() => setRegenerate(true)}
              disabled={busy}
            >
              <RefreshCw size={12} /> Rethink this day
            </button>
          )}
        </div>
        <div className="space-y-4">
          {day.activities.map((activity, index) => {
            const TimeIcon =
              activity.timeOfDay === "Morning"
                ? Sunrise
                : activity.timeOfDay === "Afternoon"
                  ? Sun
                  : Moon;
            return (
              <article
                key={activity._id || index}
                className={`card print-break p-5 sm:p-6 ${activity.completed ? "opacity-65" : ""}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="eyebrow muted flex items-center gap-2 !text-[12px]">
                    <TimeIcon size={14} />
                    {activity.timeOfDay}
                  </span>
                  {!printed && (
                    <div className="flex items-center gap-1 no-print">
                      <button
                        className="icon-btn !h-8 !w-8"
                        aria-label={`Edit ${activity.title}`}
                        onClick={() =>
                          setEditing({ day: day.dayNumber, index, activity })
                        }
                        disabled={busy}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="icon-btn !h-8 !w-8"
                        aria-label={`Mark ${activity.title} ${activity.completed ? "incomplete" : "complete"}`}
                        aria-pressed={activity.completed}
                        onClick={() => toggleActivity(day.dayNumber, index)}
                        disabled={busy}
                      >
                        {activity.completed ? (
                          <CheckCheck size={18} />
                        ) : (
                          <Circle size={17} strokeWidth={1.2} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
                <h3
                  className={`mb-3 text-lg font-semibold tracking-tight ${activity.completed ? "line-through" : ""}`}
                >
                  {activity.title}
                </h3>
                <p className="muted text-sm leading-7">
                  {activity.description}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t line pt-4">
                  {activity.location ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link muted !text-[12px]"
                    >
                      <MapPin size={12} />
                      {activity.location}
                      <ExternalLink size={10} />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <span className="muted text-[12px]">
                      Explore at your pace
                    </span>
                  )}
                  <span className="text-[12px] font-medium">
                    {formatMoney(activity.estimatedCostINR)}{" "}
                    <span className="muted font-normal">est.</span>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }
  return (
    <div className="shell py-7 sm:py-10">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link href={sample ? "/" : "/dashboard"} className="text-link muted">
          <ArrowLeft size={14} />
          {sample ? "Back to exploring" : "All my trips"}
        </Link>
        <div className="flex gap-2">
          <button
            onClick={exportTrip}
            className="btn btn-secondary !min-h-9 !px-4 !text-[12px]"
          >
            <Download size={13} /> Download plan
          </button>
          <button
            onClick={() => window.print()}
            className="btn btn-secondary !min-h-9 !px-4 !text-[12px]"
          >
            Print / PDF
          </button>
        </div>
      </div>
      {sample && (
        <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border line soft px-5 py-3">
          <p className="text-[13px]">
            <Sparkles size={13} className="mr-2 inline" /> A little inspiration:
            a hand-written sample. Edits here last for this visit only.
          </p>
          <Link href="/plan" className="text-link !text-[13px]">
            Make one that’s yours <ArrowUpRight size={14} />
          </Link>
        </div>
      )}
      <div className="relative overflow-hidden rounded-[22px] bg-[#244a37] px-6 pb-8 pt-20 text-white sm:px-9 sm:pt-28">
        <Image
          src={destinationImage(trip.destination)}
          alt={`Travel inspiration for ${trip.destination}`}
          fill
          sizes="(max-width: 768px) 100vw, 1200px"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d3029]/90 via-[#0d3029]/55 to-[#0d3029]/20" />
        <div className="relative">
          <p className="eyebrow mb-4 text-[#d9edb0]">
            {sample ? "A SLOWER KIND OF GETAWAY" : "YOUR NEXT CHAPTER"}
          </p>
          <h1 className="display max-w-3xl text-4xl sm:text-5xl lg:text-6xl">
            {trip.destination}
          </h1>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-[13px] text-white/85">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={13} />
              {trip.durationDays} days
            </span>
            <span className="flex items-center gap-1.5">
              <Wallet size={13} />
              {formatMoney(trip.estimatedBudget.total)} estimated
            </span>
            <span className="flex items-center gap-1.5">
              <Leaf size={13} />
              {trip.budgetTier === "Low"
                ? "Simply good"
                : trip.budgetTier === "High"
                  ? "Something special"
                  : "A little of both"}
            </span>
            {trip.startDate && (
              <span>
                {new Date(trip.startDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="no-print mt-4 overflow-x-auto border-b line">
        <div
          role="tablist"
          aria-label="Your trip"
          className="flex min-w-max gap-5 sm:gap-9"
        >
          {tabs.map(({ id, label, icon: Icon }, index) => (
            <button
              key={id}
              role="tab"
              id={`tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => setTab(id)}
              onKeyDown={(event) => {
                const offset =
                  event.key === "ArrowRight"
                    ? 1
                    : event.key === "ArrowLeft"
                      ? -1
                      : 0;
                if (offset || event.key === "Home" || event.key === "End") {
                  event.preventDefault();
                  const target =
                    event.key === "Home"
                      ? tabs[0]
                      : event.key === "End"
                        ? tabs[tabs.length - 1]
                        : tabs[(index + offset + tabs.length) % tabs.length];
                  setTab(target.id);
                  document.getElementById(`tab-${target.id}`)?.focus();
                }
              }}
              className={`flex items-center gap-2 border-b-2 py-5 text-sm ${tab === id ? "border-[var(--forest)] font-semibold" : "border-transparent muted"}`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>
      {error && !regenerate && !editing && (
        <p
          role="alert"
          className="my-5 rounded-xl border border-[var(--error)]/30 p-4 text-sm text-[var(--error)]"
        >
          {error}
        </p>
      )}
      <div className="itinerary-layout mt-8 grid gap-8 lg:grid-cols-[1fr_290px] xl:gap-12">
        <div
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          tabIndex={0}
          className="print-hide min-w-0"
        >
          {tab === "days" && (
            <>
              <div
                aria-label="Choose a day"
                className="mb-7 flex gap-2 overflow-x-auto pb-2"
              >
                {trip.itinerary.map((day, index) => (
                  <button
                    key={day.dayNumber}
                    aria-pressed={dayIndex === index}
                    onClick={() => setDayIndex(index)}
                    className={`min-h-10 shrink-0 rounded-full border px-5 text-sm ${dayIndex === index ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--paper)]" : "line surface"}`}
                  >
                    Day {day.dayNumber}
                  </button>
                ))}
              </div>
              {activeDay ? (
                daySection(activeDay)
              ) : (
                <p className="muted py-12 text-center text-base">
                  Your day-by-day plan will appear here when it’s ready.
                </p>
              )}
            </>
          )}
          {tab === "budget" && <BudgetPanel trip={trip} sample={sample} />}
          {tab === "stays" && (
            <div>
              <h2 className="mb-2 text-2xl font-medium tracking-tight">
                Somewhere to feel at home.
              </h2>
              <p className="muted mb-6 text-sm leading-6">
                Suggestions to start your search, not verified listings. Confirm
                availability, location, amenities, and prices directly before
                booking.
              </p>
              <div className="space-y-4">
                {trip.hotels.map((hotel, index) => (
                  <article key={hotel._id || index} className="card p-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full soft px-3 py-1 text-[12px]">
                        {hotel.tier}
                      </span>
                      <Moon size={18} strokeWidth={1.4} />
                    </div>
                    <h3 className="mb-2 mt-4 text-lg font-semibold">
                      {hotel.name}
                    </h3>
                    <p className="muted text-sm leading-6">{hotel.address}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {hotel.amenities?.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border line px-2.5 py-1 text-[12px]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t line pt-4">
                      <span className="text-base font-semibold">
                        {formatMoney(hotel.estimatedCostPerNightINR)}
                        <span className="muted ml-1 text-[12px] font-normal">
                          / night, est.
                        </span>
                      </span>
                      <a
                        className="text-link !text-[12px]"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + " " + trip.destination)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Research this stay <ArrowUpRight size={13} />
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </div>
                  </article>
                ))}
              </div>
              {!trip.hotels.length && (
                <p className="card p-8 text-base muted">
                  No stays suggested yet. Ask your assistant what to look for in
                  this area.
                </p>
              )}
            </div>
          )}
          {tab === "packing" && (
            <div className="card p-6 sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-medium tracking-tight">
                    Take what matters.
                  </h2>
                  <p className="muted mt-2 text-sm">
                    {trip.packingList.filter((item) => item.isPacked).length} of{" "}
                    {trip.packingList.length} things, packed and ready.
                  </p>
                </div>
                <ListChecks size={24} strokeWidth={1.2} />
              </div>
              {trip.packingList.length ? (
                <div className="space-y-3">
                  {trip.packingList.map((item, index) => (
                    <label
                      key={item._id || index}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border line p-4"
                    >
                      <input
                        type="checkbox"
                        checked={item.isPacked}
                        disabled={busy}
                        className="h-4 w-4 accent-[var(--forest)]"
                        onChange={() =>
                          void save({
                            packingList: trip.packingList.map((entry, i) =>
                              i === index
                                ? { ...entry, isPacked: !entry.isPacked }
                                : entry,
                            ),
                          })
                        }
                      />
                      <span
                        className={`flex-1 text-sm ${item.isPacked ? "muted line-through" : ""}`}
                      >
                        {item.item}
                      </span>
                      <span className="muted text-[12px]">{item.category}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="muted text-sm leading-6">
                  Let your assistant put together a packing list for your
                  destination and dates.
                </p>
              )}
              {!sample && (
                <button
                  className="btn btn-secondary mt-6 w-full !text-sm"
                  disabled={busy}
                  onClick={() =>
                    void run(() => tripsService.generatePackingList(trip._id))
                  }
                >
                  {busy ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  {trip.packingList.length
                    ? "Replace with a fresh list"
                    : "Create my packing list"}
                </button>
              )}
              <p className="muted mt-5 text-[12px] leading-5">
                Check the weather before you go. Regenerating a packing list
                replaces your previous list and checkmarks.
              </p>
            </div>
          )}
          {tab === "assistant" && (
            <TripAssistant
              tripId={trip._id}
              destination={trip.destination}
              sample={sample}
            />
          )}
        </div>
        <div className="print-days hidden" aria-hidden="true">
          {trip.itinerary.map((day) => daySection(day, true))}
          <h2 className="mt-8 text-xl">
            Estimated budget: {formatMoney(trip.estimatedBudget.total)}
          </h2>
          <p className="mt-3 text-base">
            {trip.packingList
              .map((item) => `${item.isPacked ? "✓" : "□"} ${item.item}`)
              .join(" · ")}
          </p>
        </div>
        <aside className="no-print space-y-5">
          <div className="card p-6">
            <p className="eyebrow muted mb-4">THE BIG LITTLE PICTURE</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="muted">A little time away</span>
                <span>{trip.durationDays} days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="muted">Moments to discover</span>
                <span>{totalActivities} activities</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="muted">Estimated budget</span>
                <span className="font-semibold">
                  {formatMoney(trip.estimatedBudget.total)}
                </span>
              </div>
            </div>
            <div className="mt-6 border-t line pt-5">
              <div className="mb-3 flex justify-between text-[12px]">
                <span className="muted">A journey in the making</span>
                <span>
                  {done}/{totalActivities}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full soft">
                <div
                  className="h-full bg-[var(--forest)] transition-all"
                  style={{
                    width: `${totalActivities ? (done / totalActivities) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            {!sample && (
              <button
                className="btn btn-secondary mt-5 w-full !min-h-10 !text-[12px]"
                disabled={busy}
                onClick={() =>
                  void save({
                    status: trip.status === "completed" ? "draft" : "completed",
                  })
                }
              >
                <Check size={13} />
                {trip.status === "completed"
                  ? "Reopen this trip"
                  : "Mark trip complete"}
              </button>
            )}
          </div>
          <div className="rounded-2xl soft p-6">
            <Leaf size={22} strokeWidth={1.3} />
            <h3 className="mb-3 mt-4 font-serif text-xl italic">
              Leave a little room.
            </h3>
            <p className="muted text-sm leading-6">
              For the extra cup of coffee. The street you didn’t mean to turn
              down. The moments no itinerary can plan.
            </p>
          </div>
          <div className="flex gap-2.5 px-2">
            <Clock3 size={14} className="muted mt-1" />
            <p className="muted text-[12px] leading-5">
              AI can get things wrong. Verify opening hours, routes,
              accessibility, safety, and local conditions before you go.
            </p>
          </div>
          <Link
            href="/plan"
            className="text-link w-full justify-between px-2 !text-[13px]"
          >
            Daydreaming about the next one?
            <ChevronRight size={14} />
          </Link>
        </aside>
      </div>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setEditing(null);
            setError("");
          }
        }}
      >
        <DialogContent>
          <DialogTitle className="pr-8 text-xl font-semibold">
            Make this moment yours.
          </DialogTitle>
          <DialogDescription className="muted mb-6 mt-2 text-sm leading-6">
            Update the details of this activity. The overall budget estimate is
            not automatically recalculated.
          </DialogDescription>
          {editing && (
            <form onSubmit={editActivity} className="space-y-4">
              <div>
                <label htmlFor="activity-title" className="field-label">
                  Activity
                </label>
                <input
                  id="activity-title"
                  name="title"
                  className="field"
                  defaultValue={editing.activity.title}
                  required
                  maxLength={200}
                />
              </div>
              <div>
                <label htmlFor="activity-description" className="field-label">
                  The details
                </label>
                <textarea
                  id="activity-description"
                  name="description"
                  className="field min-h-28"
                  defaultValue={editing.activity.description}
                  maxLength={1000}
                />
              </div>
              <div>
                <label htmlFor="activity-location" className="field-label">
                  Location
                </label>
                <input
                  id="activity-location"
                  name="location"
                  className="field"
                  defaultValue={editing.activity.location}
                  maxLength={200}
                />
              </div>
              <div>
                <label htmlFor="activity-cost" className="field-label">
                  Estimated cost (₹)
                </label>
                <input
                  id="activity-cost"
                  name="cost"
                  type="number"
                  min={0}
                  max={1000000000}
                  className="field"
                  defaultValue={editing.activity.estimatedCostINR}
                  required
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-[var(--error)]">
                  {error}
                </p>
              )}
              <button className="btn btn-primary w-full" disabled={busy}>
                {busy ? "Saving…" : "Save this little change"}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={regenerate}
        onOpenChange={(open) => {
          if (!busy) {
            setRegenerate(open);
            setError("");
          }
        }}
      >
        <DialogContent>
          <DialogTitle className="pr-8 text-xl font-semibold">
            A different kind of day.
          </DialogTitle>
          <DialogDescription className="muted mb-6 mt-2 text-sm leading-6">
            Tell us what to change about day {activeDay?.dayNumber}. Its current
            activities and checkmarks will be replaced. Other days stay just as
            they are.
          </DialogDescription>
          <form onSubmit={regenerateDay}>
            <label htmlFor="day-feedback" className="field-label">
              What are you in the mood for?
            </label>
            <textarea
              id="day-feedback"
              name="feedback"
              className="field min-h-32"
              placeholder="A slower pace, more nature, and somewhere local for lunch…"
              required
              maxLength={500}
            />
            {error && (
              <p role="alert" className="mt-4 text-sm text-[var(--error)]">
                {error}
              </p>
            )}
            <button className="btn btn-primary mt-5 w-full" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" /> Rethinking
                  the day…
                </>
              ) : (
                <>
                  <Sparkles size={15} /> Find a new way
                </>
              )}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
