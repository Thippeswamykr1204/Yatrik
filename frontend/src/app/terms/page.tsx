import type { Metadata } from "next";
import { LegalPage } from "@/components/studio/LegalPage";
export const metadata: Metadata = { title: "Travel planning terms" };
export default function TermsPage() {
  return (
    <LegalPage
      title="A few things before you go."
      intro="Yatrik is a planning tool, not a booking agent or a substitute for professional travel advice. These product-use terms describe the service’s limitations and appropriate use."
      sections={[
        {
          title: "Inspiration, not a reservation",
          body: "Itineraries, hotels, activities, and budgets are suggestions. Nothing is booked or guaranteed by generating a plan. Prices, opening hours, ratings, routes, visa requirements, and availability may be inaccurate or out of date. Confirm directly with providers and official sources before making payments or traveling.",
        },
        {
          title: "Travel responsibly",
          body: "You are responsible for checking local laws, permits, travel advisories, accessibility, health requirements, insurance, and weather. Do not rely on AI output for medical, emergency, legal, or safety-critical decisions. Respect local communities and the environment.",
        },
        {
          title: "Your account and acceptable use",
          body: "Keep your login credentials private and use an email address you control. Do not attempt to access other travelers’ data, bypass request limits, interfere with the service, or use the assistant for unlawful content. Do not submit personal information about others without permission.",
        },
        {
          title: "AI availability and saved plans",
          body: "Generation depends on external AI services and may fail or take time. Rate limits protect the service from excessive use. A failed generation can be retried from its saved trip. The sample itinerary is hand-written and illustrative, not a live generation. Deleting a saved trip is permanent in the active application database.",
        },
        {
          title: "Scope of these terms",
          body: "The deploying business must provide its legal identity, customer contact, applicable jurisdiction, and any commercial or subscription terms before public launch. This software does not define a subscription, process payments, or provide travel bookings. Nothing here excludes rights that cannot be excluded under applicable consumer law.",
        },
      ]}
    />
  );
}
