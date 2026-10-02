import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  MapPin,
  MoveUpRight,
  Route,
  Sparkles,
  WandSparkles,
  Wallet,
} from "lucide-react";
import { HeroPlanner } from "@/components/studio/HeroPlanner";
import { Reveal } from "@/components/studio/Reveal";
import { Footer } from "@/components/layout/Footer";
import { destinations } from "@/lib/travel";

export default function LandingPage() {
  return (
    <>
      <section
        className="relative mx-3 mt-3 overflow-hidden rounded-[22px] bg-[#233d35] sm:mx-5 sm:mt-4 lg:mx-6"
        aria-label="Your next chapter starts here"
      >
        <div className="absolute inset-0 hero-photo">
          <Image
            src="/destinations/mountains.jpg"
            alt="Sunlight breaking over a vast mountain landscape"
            fill
            priority
            sizes="100vw"
            quality={85}
            className="object-cover object-[50%_48%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#112d29]/90 via-[#173a34]/55 to-[#18352d]/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d3029]/65 via-transparent to-[#18352d]/10" />
        </div>
        <div className="relative mx-auto max-w-[1272px] px-5 pb-9 pt-16 text-white sm:px-10 sm:pb-10 sm:pt-20 lg:px-12 lg:pt-[88px]">
          <div className="hero-heading mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-white/10 px-3.5 py-2 text-[12px] font-medium tracking-wide backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d9edb0]" /> A little
            AI. A world of possibilities.
          </div>
          <h1 className="hero-heading display max-w-[760px] text-[36px] sm:text-[65px] lg:text-[82px]">
            Go somewhere
            <br />
            that stays{" "}
            <span className="font-serif italic text-[#d9edb0]">with you.</span>
          </h1>
          <p className="hero-copy mb-9 mt-6 max-w-[405px] text-[15px] sm:text-[17px] leading-[1.8] text-white/80">
            The mountain mornings. The unexpected detours.
            <br className="hidden sm:block" /> The little places you’ll talk
            about for years.
            <br />
            Tell us your kind of trip. We’ll take care of the plan.
          </p>
          <HeroPlanner />
          <div className="hero-copy mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-white/80">
            <span className="flex items-center gap-1.5">
              <Check size={15} className="text-[#d9edb0]" /> Made for your
              travel style
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={15} className="text-[#d9edb0]" /> Your budget, your
              pace
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={15} className="text-[#d9edb0]" /> Room for the
              unexpected
            </span>
          </div>
          <div className="mt-12 flex items-end justify-between gap-5 border-t border-white/20 pt-5 lg:mt-14">
            <a
              href="#discover"
              className="flex items-center gap-2.5 text-[15px] text-white/80"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30">
                <ArrowDown size={15} />
              </span>{" "}
              A world worth wandering
            </a>
            <span className="flex items-center gap-1.5 text-[15px] text-white/80">
              <MapPin size={15} /> Find your higher ground
            </span>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[7%] top-[27%] hidden h-52 w-52 xl:block"
        >
          <svg
            viewBox="0 0 240 240"
            fill="none"
            className="h-full w-full opacity-70"
          >
            <path
              d="M25 180C0 95 160 190 120 90S185 25 204 50"
              className="route-dash"
              stroke="white"
              strokeWidth="1.2"
            />
            <circle cx="25" cy="180" r="5" fill="#d9edb0" />
            <circle cx="204" cy="50" r="9" stroke="white" />
            <circle cx="204" cy="50" r="3" fill="white" />
          </svg>
          <span className="absolute left-16 top-[90px] -rotate-12 font-serif text-xl italic text-white/80">
            take the scenic route
          </span>
        </div>
      </section>

      <div className="shell">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b line py-7 text-[14px] muted">
          <p className="font-medium">
            For the curious. The spontaneous. The{" "}
            <span className="text-[var(--ink)]">“let’s just go.”</span>
          </p>
          <div className="flex gap-6 sm:gap-9">
            <span className="flex items-center gap-2">
              <Sparkles size={16} /> Thoughtfully personalized
            </span>
            <span className="hidden items-center gap-2 sm:flex">
              <Route size={16} /> Beautifully planned
            </span>
            <span className="flex items-center gap-2">
              <Compass size={16} /> Always yours
            </span>
          </div>
        </div>
      </div>

      <section id="discover" className="shell py-16 sm:py-20">
        <Reveal className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow muted mb-3">THE WORLD IS CALLING</p>
            <h2 className="display text-[25px] sm:text-[50px]">
              Where will your curiosity take you?
            </h2>
            <p className="muted mt-4 text-[15px] sm:text-[15px] sm:text-base">
              A few places to get the daydreaming started.
            </p>
          </div>
          <Link href="/plan" className="text-link mb-1 shrink-0">
            Find my next adventure <ArrowUpRight size={16} />
          </Link>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-3">
          {destinations.map((destination, i) => (
            <Reveal key={destination.name} delay={i * 0.08}>
              <Link
                href={`/plan?destination=${encodeURIComponent(destination.name + ", India")}&days=${destination.days}`}
                className="photo-hover group block"
              >
                <div className="relative aspect-[1.14] overflow-hidden rounded-2xl">
                  <Image
                    src={destination.image}
                    alt={
                      destination.name === "Jaipur"
                        ? "Ornate rose-colored facade of Hawa Mahal in Jaipur"
                        : destination.name === "Kerala"
                          ? "Lush green hills and waterways in Kerala"
                          : "Palm-fringed beach on the Goa coast"
                    }
                    fill
                    sizes="(max-width: 639px) 92vw, 30vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] sm:text-[11px] sm:text-[12px] font-medium text-[#203c30] backdrop-blur-md">
                    {destination.tag}
                  </span>
                  <span className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/60 text-white transition group-hover:bg-white group-hover:text-[#203c30]">
                    <ArrowUpRight size={17} />
                  </span>
                </div>
                <div className="mt-4 flex items-start justify-between gap-2">
                  <div>
                    <p className="eyebrow muted !text-[10px] sm:!text-[11px] sm:!text-[11px] sm:!text-[12px]">
                      {destination.region}
                    </p>
                    <h3 className="mt-1 text-[24px] sm:text-[30px] font-medium tracking-[-.04em]">
                      {destination.name}
                    </h3>
                    <p className="muted mt-1 text-[14px] sm:text-[15px] sm:text-[17px]">
                      {destination.description}
                    </p>
                  </div>
                  <span className="muted mt-6 text-[8px] sm:text-[10px] sm:text-[12px]">
                    {destination.days} days, your way
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y line bg-[var(--soft)]/70 py-16 sm:py-20"
      >
        <div className="shell grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-24">
          <Reveal>
            <p className="eyebrow muted mb-4">LESS TABS. MORE TAKEOFFS.</p>
            <h2 className="display text-[28px] sm:text-[56px]">
              A great trip shouldn’t
              <br />
              start with{" "}
              <span className="font-serif italic">a spreadsheet.</span>
            </h2>
            <p className="muted mt-5 max-w-[390px] text-[15px] sm:text-[15px] sm:text-base leading-7">
              We connect the dots between where you want to go and how you love
              to travel. You bring the what-if. We bring the way there.
            </p>
            <Link href="/plan" className="btn btn-primary mt-7">
              Let’s plan something good <ArrowUpRight size={16} />
            </Link>
          </Reveal>
          <div className="space-y-7">
            {[
              {
                icon: Compass,
                title: "Start with a daydream",
                body: "A place, a few days, a feeling. Tell us what you have in mind and what makes a trip feel like you.",
              },
              {
                icon: WandSparkles,
                title: "Meet your made-for-you itinerary",
                body: "A thoughtful day-by-day plan, with places to explore, stays to consider, and a budget that makes sense.",
              },
              {
                icon: Route,
                title: "Make it yours. Then make memories.",
                body: "Swap an activity, rethink a day, or ask your travel assistant. The best plans leave room for you.",
              },
            ].map((step, i) => (
              <Reveal key={step.title} delay={i * 0.08} className="flex gap-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border line bg-[var(--paper)]">
                  <step.icon size={21} strokeWidth={1.4} />
                </span>
                <div className="border-b line pb-6">
                  <span className="eyebrow muted !text-[12px] sm:!text-[13px] sm:!text-[13px] sm:!text-[14px]">0{i + 1}</span>
                  <h3 className="mb-2 mt-1 text-[19px] sm:text-[22px] font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="muted text-[15px] sm:text-[17px] leading-7">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="shell py-16 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <Reveal className="relative">
            <div className="relative aspect-[1.2] overflow-hidden rounded-2xl">
              <Image
                src="/destinations/kerala.jpg"
                alt="A peaceful green escape in Kerala"
                fill
                sizes="(max-width: 1023px) 90vw, 45vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/15" />
              <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] sm:text-[11px] sm:text-[12px] text-[#203c30]">
                A slower kind of getaway
              </span>
            </div>
            <div className="absolute -bottom-5 right-3 w-[240px] rounded-2xl border line bg-[var(--surface)] p-5 shadow-lg sm:-right-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="eyebrow !text-[10px] sm:!text-[11px] sm:!text-[11px] sm:!text-[12px] muted">
                  YOUR NEXT CHAPTER
                </span>
                <Sparkles size={16} />
              </div>
              <h3 className="text-[15px] sm:text-base sm:text-lg font-semibold tracking-tight">
                Somewhere in Kerala
              </h3>
              <p className="muted mt-1 text-[10px] sm:text-[11px] sm:text-[12px]">
                3 days · Green views · Good food
              </p>
              <div className="my-3 border-t line" />
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full soft">
                  <Check size={12} />
                </span>
                <span className="text-[12px] sm:text-[13px]">
                  A little less rush. A little more life.
                </span>
              </div>
            </div>
          </Reveal>
          <Reveal className="pt-5">
            <p className="eyebrow muted mb-4">NOT ANOTHER COOKIE-CUTTER TRIP</p>
            <h2 className="display text-[28px] sm:text-[54px]">
              Your kind of places.
              <br />
              Your kind of pace.
            </h2>
            <p className="muted mb-7 mt-5 max-w-[410px] text-[15px] sm:text-[15px] sm:text-base leading-7">
              Early starts or slow mornings? Street food or something special?
              Your itinerary should feel like it was made for you. Because it
              was.
            </p>
            <div className="mb-7 grid grid-cols-2 gap-5 text-[13px] sm:text-sm">
              <span className="flex items-center gap-2.5">
                <Wallet size={18} strokeWidth={1.5} /> Budget-aware plans
              </span>
              <span className="flex items-center gap-2.5">
                <Route size={16} strokeWidth={1.5} /> Flexible day-by-day routes
              </span>
              <span className="flex items-center gap-2.5">
                <Sparkles size={16} strokeWidth={1.5} /> A travel assistant on
                hand
              </span>
              <span className="flex items-center gap-2.5">
                <Check size={18} strokeWidth={1.5} /> Packing, taken care of
              </span>
            </div>
            <Link
              href="/itinerary/sample"
              className="text-link border-b border-[var(--ink)] pb-2"
            >
              Take a peek at a real plan <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="shell pb-4">
        <Reveal className="relative overflow-hidden rounded-[22px] bg-[#244a37] px-7 py-12 text-[#f4f5eb] sm:px-12 sm:py-16">
          <div className="relative z-10 flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
            <div>
              <p className="eyebrow mb-4 text-[#d9edb0]">
                GO ON. FOLLOW THAT FEELING.
              </p>
              <h2 className="display text-[26px] sm:text-[56px]">
                Your next story is out there.
              </h2>
              <p className="mt-4 text-[15px] sm:text-[15px] sm:text-base text-white/65">
                Let’s find the beginning.
              </p>
            </div>
            <Link href="/plan" className="btn btn-lime w-fit shrink-0">
              Plan my escape <ArrowUpRight size={17} />
            </Link>
          </div>
          <MoveUpRight
            aria-hidden="true"
            strokeWidth={0.35}
            className="pointer-events-none absolute -bottom-28 right-[15%] h-[380px] w-[380px] text-[#d9edb0]/10"
          />
        </Reveal>
      </section>
      <Footer />
    </>
  );
}
