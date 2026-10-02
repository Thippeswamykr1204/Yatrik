import type { Metadata } from "next";
import { SampleItinerary } from "@/components/studio/SampleItinerary";
export const metadata: Metadata = {
  title: "A slower kind of getaway — Kerala",
  description:
    "Explore an illustrative three-day Kerala itinerary: Fort Kochi, the Alleppey backwaters, thoughtful stays, and a little room to wander.",
};
export default function SamplePage() {
  return <SampleItinerary />;
}
