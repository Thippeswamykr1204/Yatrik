import type { Metadata } from "next";
import { Suspense } from "react";
import { Planner } from "@/components/studio/Planner";
import { PageSkeleton } from "@/components/studio/States";
export const metadata: Metadata = {
  title: "Plan your escape",
  description:
    "Your destination, your pace, your kind of adventure. Create a personalized travel itinerary with Yatrik.",
};
export default function PlanPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Planner />
    </Suspense>
  );
}
