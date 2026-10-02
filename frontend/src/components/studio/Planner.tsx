"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Camera,
  Check,
  Compass,
  Landmark,
  LoaderCircle,
  MapPin,
  Mountain,
  ShieldCheck,
  Sparkles,
  Sun,
  Trees,
  Utensils,
  Waves,
} from "lucide-react";
import {
  budgetOptions,
  destinationImage,
  DRAFT_KEY,
  initialDraft,
  interests,
  readDraft,
  saveDraft,
  tripDraftSchema,
  type TripDraft,
} from "@/lib/travel";
import { useAuthStore } from "@/store/authStore";
import { tripsService } from "@/services/trips.service";
import { errorMessage } from "@/services/api";

const steps = [
  "The destination",
  "Your travel style",
  "What you love",
  "The little details",
];
const icons = {
  Trees,
  Utensils,
  Landmark,
  Mountain,
  Waves,
  Building2,
  Camera,
  Sun,
};
export function Planner() {
  const router = useRouter();
  const params = useSearchParams();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [draft, setDraft] = useState<TripDraft>(initialDraft);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const submitLock = useRef(false);
  useEffect(() => {
    const stored = readDraft();
    const destination = params.get("destination");
    const days = Number(params.get("days"));
    queueMicrotask(() => {
      setDraft({
        ...stored,
        ...(destination ? { destination: destination.slice(0, 100) } : {}),
        ...(Number.isInteger(days) && days >= 1 && days <= 30
          ? { durationDays: days }
          : {}),
      });
      if (params.get("review") === "1" && stored.destination) setStep(3);
    });
  }, [params]);
  function update<K extends keyof TripDraft>(key: K, value: TripDraft[K]) {
    setDraft((previous) => {
      const next = { ...previous, [key]: value };
      saveDraft(next);
      return next;
    });
    setCreatedId(null);
    setError("");
  }
  function changeStep(next: number) {
    setStep(next);
    setError("");
    requestAnimationFrame(() => heading.current?.focus());
  }
  function next(event: FormEvent) {
    event.preventDefault();
    const parsed = tripDraftSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (
      draft.startDate &&
      draft.startDate < new Date().toLocaleDateString("en-CA")
    ) {
      setError("Choose today or a future departure date.");
      return;
    }
    saveDraft(parsed.data);
    if (step < 3) changeStep(step + 1);
    else void generate();
  }
  async function generate() {
    if (submitLock.current) return;
    if (!isAuthenticated) {
      router.push("/auth/register?next=%2Fplan%3Freview%3D1");
      return;
    }
    submitLock.current = true;
    setBusy(true);
    setError("");
    try {
      let id = createdId;
      if (!id) {
        const trip = await tripsService.create({
          ...draft,
          destination: draft.destination.trim(),
          startDate: draft.startDate || undefined,
        });
        id = trip._id;
        setCreatedId(id);
      }
      await tripsService.generateItinerary(id);
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* Optional draft storage. */
      }
      router.push(`/dashboard/trip/${id}`);
    } catch (cause) {
      setError(
        errorMessage(
          cause,
          "Your plan couldn’t start. Your choices are still here; please try again.",
        ),
      );
    } finally {
      submitLock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="shell py-8 sm:py-12">
      <Link href="/" className="text-link muted">
        <ArrowLeft size={14} /> Back to exploring
      </Link>
      <div className="mb-10 mt-8">
        <p className="eyebrow muted mb-3">THE START OF SOMETHING GOOD</p>
        <h1 className="display text-4xl sm:text-5xl">
          Let’s make a little getaway.
        </h1>
        <p className="muted mt-4 text-base">
          A few details from you. A world of possibilities from here.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px] xl:gap-14">
        <div>
          <ol
            aria-label="Planning progress"
            className="mb-8 flex gap-2 sm:gap-4"
          >
            {steps.map((label, index) => (
              <li key={label} className="min-w-0 flex-1">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    if (index < step) changeStep(index);
                  }}
                  disabled={index > step || busy}
                  aria-current={step === index ? "step" : undefined}
                >
                  <span
                    className={`mb-3 block h-1 rounded-full ${index <= step ? "bg-[var(--forest)]" : "bg-[var(--line)]"}`}
                  />
                  <span
                    className={`text-[12px] sm:text-sm ${step === index ? "font-semibold" : "muted"}`}
                  >
                    <span className="mr-1">0{index + 1}</span>{" "}
                    <span className="hidden sm:inline">{label}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <form onSubmit={next} className="card overflow-hidden" noValidate>
            <div className="p-6 sm:p-9">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  <p className="eyebrow muted mb-3">
                    CHAPTER 0{step + 1} OF 04
                  </p>
                  <h2
                    ref={heading}
                    tabIndex={-1}
                    className="mb-2 text-2xl font-medium tracking-[-.04em] outline-none"
                  >
                    {
                      [
                        "Where are we off to?",
                        "How do you like to travel?",
                        "What makes you feel alive?",
                        "Looking like your kind of trip.",
                      ][step]
                    }
                  </h2>
                  <p className="muted mb-8 text-sm leading-6">
                    {
                      [
                        "Pick a place and give yourself a little time to get lost in it.",
                        "No right answers. Just the comforts that matter to you.",
                        "Choose a few favorites, or keep an open mind. This part is optional.",
                        "One last look before we connect all the dots.",
                      ][step]
                    }
                  </p>
                  {step === 0 && (
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="destination" className="field-label">
                          Your destination
                        </label>
                        <div className="relative">
                          <MapPin
                            size={18}
                            className="muted absolute left-4 top-4"
                          />
                          <input
                            id="destination"
                            className="field pl-11"
                            placeholder="e.g. Jaipur, Rajasthan"
                            value={draft.destination}
                            maxLength={100}
                            onChange={(e) =>
                              update("destination", e.target.value)
                            }
                            required
                            aria-describedby={
                              error ? "planner-error" : undefined
                            }
                            aria-invalid={Boolean(error)}
                            autoComplete="off"
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {["Jaipur", "Kerala", "Goa", "Manali", "Udaipur"].map(
                            (place) => (
                              <button
                                key={place}
                                type="button"
                                className="rounded-full border line px-3 py-1.5 text-[12px] transition hover:bg-[var(--soft)]"
                                onClick={() =>
                                  update("destination", `${place}, India`)
                                }
                              >
                                {place}{" "}
                                <ArrowUpRight
                                  size={10}
                                  className="ml-1 inline"
                                />
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="duration" className="field-label">
                          How many days?
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[3, 5, 7, 10, 14].map((days) => (
                            <button
                              key={days}
                              type="button"
                              aria-pressed={draft.durationDays === days}
                              onClick={() => update("durationDays", days)}
                              className={`rounded-xl border px-4 py-3 text-sm ${draft.durationDays === days ? "border-[var(--forest)] bg-[var(--soft)] font-semibold" : "line"}`}
                            >
                              {days} days
                            </button>
                          ))}
                          <input
                            id="duration"
                            aria-label="Custom number of days"
                            type="number"
                            min={1}
                            max={30}
                            step={1}
                            value={draft.durationDays}
                            onChange={(e) =>
                              update("durationDays", Number(e.target.value))
                            }
                            className="field w-20"
                          />
                        </div>
                        <p className="muted mt-2 text-[12px]">
                          A quick escape or a longer wander. From 1 to 30 days.
                        </p>
                      </div>
                      <div>
                        <label htmlFor="startDate" className="field-label">
                          When do you leave?{" "}
                          <span className="muted font-normal">(optional)</span>
                        </label>
                        <input
                          id="startDate"
                          type="date"
                          min={new Date().toLocaleDateString("en-CA")}
                          value={draft.startDate}
                          onChange={(e) => update("startDate", e.target.value)}
                          className="field"
                        />
                      </div>
                    </div>
                  )}
                  {step === 1 && (
                    <fieldset className="space-y-3">
                      <legend className="sr-only">Choose your budget</legend>
                      {budgetOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`relative flex cursor-pointer items-center gap-4 rounded-xl border p-5 transition ${draft.budgetTier === option.value ? "border-[var(--forest)] bg-[var(--soft)]" : "line hover:bg-[var(--soft)]/50"}`}
                        >
                          <input
                            className="h-4 w-4 accent-[var(--forest)]"
                            type="radio"
                            name="budget"
                            value={option.value}
                            checked={draft.budgetTier === option.value}
                            onChange={() => update("budgetTier", option.value)}
                          />
                          <span className="flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="text-base font-semibold">
                                {option.label}
                              </span>
                              <span className="rounded-full border line px-2 py-1 text-[12px]">
                                {option.range}
                              </span>
                            </span>
                            <span className="muted mt-1 block text-sm">
                              {option.subtitle}
                            </span>
                            <span className="muted mt-3 block text-[12px]">
                              {option.detail}
                            </span>
                          </span>
                        </label>
                      ))}
                      <p className="muted !mt-5 text-[12px] leading-5">
                        Estimates are in Indian rupees. Your actual spend will
                        depend on dates, availability, and the choices you make.
                        Nothing is booked.
                      </p>
                    </fieldset>
                  )}
                  {step === 2 && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {interests.map((interest) => {
                          const Icon = icons[interest.icon];
                          const selected = draft.interests.includes(
                            interest.value,
                          );
                          return (
                            <button
                              key={interest.value}
                              type="button"
                              aria-pressed={selected}
                              onClick={() =>
                                update(
                                  "interests",
                                  selected
                                    ? draft.interests.filter(
                                        (value) => value !== interest.value,
                                      )
                                    : [...draft.interests, interest.value],
                                )
                              }
                              className={`relative flex min-h-24 flex-col items-start gap-3 rounded-xl border p-4 text-left text-sm transition ${selected ? "border-[var(--forest)] bg-[var(--soft)]" : "line hover:bg-[var(--soft)]/50"}`}
                            >
                              <Icon size={21} strokeWidth={1.5} />
                              {interest.label}
                              {selected && (
                                <Check
                                  size={14}
                                  className="absolute right-3 top-3"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className="muted mt-5 text-sm">
                        {draft.interests.length
                          ? `${draft.interests.length} little things that make it yours.`
                          : "Keep it open? We’ll suggest a little of everything."}
                      </p>
                    </>
                  )}
                  {step === 3 && (
                    <div className="space-y-5">
                      <div className="rounded-xl soft p-5">
                        <p className="muted text-[12px]">YOUR NEXT CHAPTER</p>
                        <h3 className="mb-4 mt-2 text-2xl font-medium tracking-tight">
                          {draft.destination}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-2">
                            <CalendarDays size={14} />
                            {draft.durationDays} days
                          </span>
                          <span>
                            {
                              budgetOptions.find(
                                (b) => b.value === draft.budgetTier,
                              )?.range
                            }
                          </span>
                          <span>
                            {draft.startDate || "Dates to be decided"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="field-label">
                          A few of your favorite things
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {draft.interests.length ? (
                            draft.interests.map((value) => (
                              <span
                                key={value}
                                className="rounded-full border line px-3 py-1.5 text-[12px]"
                              >
                                {interests.find((i) => i.value === value)
                                  ?.label || value}
                              </span>
                            ))
                          ) : (
                            <span className="muted text-sm">
                              A little of everything
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 rounded-xl border line p-4">
                        <ShieldCheck size={19} className="muted" />
                        <p className="muted text-[13px] leading-6">
                          Your plan is private to your account. AI suggestions
                          are a starting point, not live bookings. Always check
                          opening hours, prices, and travel advisories.
                        </p>
                      </div>
                      {!isAuthenticated && (
                        <p className="muted text-sm leading-6">
                          Next, create your account to generate and save this
                          trip. Your choices will be waiting for you.
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              {error && (
                <div
                  id="planner-error"
                  role="alert"
                  className="mt-6 rounded-xl border border-[var(--error)]/30 p-4 text-sm leading-6 text-[var(--error)]"
                >
                  {error}
                  {createdId && (
                    <Link
                      href={`/dashboard/trip/${createdId}`}
                      className="mt-2 block underline"
                    >
                      Open your saved draft to retry
                    </Link>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 border-t line px-6 py-5 sm:px-9">
              <button
                type="button"
                onClick={() => changeStep(step - 1)}
                disabled={busy}
                className={`text-link min-h-11 ${step === 0 ? "invisible" : ""}`}
              >
                <ArrowLeft size={15} /> Back
              </button>
              <button
                type="submit"
                disabled={busy || isLoading}
                className="btn btn-primary"
              >
                {busy ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" /> Starting
                    your journey…
                  </>
                ) : step === 3 ? (
                  <>
                    {isAuthenticated
                      ? "Create my itinerary"
                      : "Save my choices & continue"}
                    <Sparkles size={15} />
                  </>
                ) : (
                  <>
                    Continue <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-[110px] overflow-hidden rounded-2xl border line surface">
            <div className="relative h-56">
              <Image
                src={destinationImage(draft.destination)}
                alt="Travel inspiration for your next escape"
                fill
                sizes="340px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-5 left-5 text-sm text-white">
                A little inspiration for the road.
              </span>
            </div>
            <div className="p-6">
              <Compass size={25} strokeWidth={1.2} />
              <h3 className="mb-3 mt-4 font-serif text-2xl italic">
                The best trips feel like you.
              </h3>
              <p className="muted text-sm leading-6">
                Not a checklist of must-sees. A thoughtful mix of the big
                moments and the little discoveries in between.
              </p>
              <div className="mt-6 border-t line pt-5">
                <Link href="/itinerary/sample" className="text-link">
                  See what a finished plan looks like <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
      <p className="muted mt-8 text-center text-[12px]">
        Made with curiosity. Powered by Gemini. Designed around you.
      </p>
    </div>
  );
}
