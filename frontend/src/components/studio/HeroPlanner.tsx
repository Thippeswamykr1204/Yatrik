"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ChevronDown, MapPin, CalendarDays } from "lucide-react";

export function HeroPlanner() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("5");
  function submit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams({ days });
    if (destination.trim()) params.set("destination", destination.trim());
    router.push(`/plan?${params}`);
  }
  return (
    <form
      onSubmit={submit}
      className="hero-planner w-full max-w-[720px] rounded-2xl border border-white/15 bg-white p-2 text-[#203c30] shadow-xl sm:flex sm:items-center sm:rounded-full sm:p-2.5"
    >
      <div className="flex flex-1 items-center gap-3 px-4 py-2">
        <MapPin size={20} strokeWidth={1.5} className="text-[#647168]" />
        <div className="min-w-0 flex-1">
          <label
            htmlFor="hero-destination"
            className="block text-[12px] font-semibold"
          >
            Where to?
          </label>
          <input
            id="hero-destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            maxLength={100}
            placeholder="Somewhere you've been dreaming of"
            className="w-full bg-transparent py-1 text-sm !text-[#203c30] placeholder:!text-[#647168] focus:outline-none"
          />
        </div>
      </div>
      <div className="my-2 hidden h-9 w-px bg-[#e5e7df] sm:block" />
      <div className="flex items-center gap-3 px-4 py-2 sm:w-[160px]">
        <CalendarDays size={19} strokeWidth={1.5} className="text-[#647168]" />
        <div className="flex-1">
          <label
            htmlFor="hero-days"
            className="block text-[12px] font-semibold"
          >
            For how long?
          </label>
          <div className="relative">
            <select
              id="hero-days"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full appearance-none bg-transparent py-1 pr-4 text-sm !text-[#203c30] focus:outline-none"
            >
              <option value="3">A long weekend</option>
              <option value="5">5 days</option>
              <option value="7">A whole week</option>
              <option value="10">10 days</option>
              <option value="14">Two weeks</option>
            </select>
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-0 top-2"
            />
          </div>
        </div>
      </div>
      <button
        type="submit"
        className="btn !bg-[#244a37] !text-white w-full sm:w-auto sm:shrink-0"
      >
        Make it happen <ArrowUpRight size={17} />
      </button>
    </form>
  );
}
