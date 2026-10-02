"use client";
import { useState } from "react";
import { sampleTrip } from "@/lib/sample-trip";
import { Itinerary } from "./Itinerary";
export function SampleItinerary() {
  const [trip, setTrip] = useState(() => structuredClone(sampleTrip));
  return <Itinerary trip={trip} onUpdate={setTrip} sample />;
}
