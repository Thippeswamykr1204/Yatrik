import type { Metadata } from "next";
import { LegalPage } from "@/components/studio/LegalPage";
export const metadata: Metadata = { title: "Privacy notice" };
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Your journey. Your information."
      intro="This notice explains how this version of Yatrik handles information when you use the travel planner. It describes the product’s current behavior, not a promise that travel information is anonymous."
      sections={[
        {
          title: "What the planner uses",
          body: "An account contains your name, email address, and a securely hashed password. Saved trips contain your destination, travel dates, preferences, itinerary, budget estimates, and packing list. Do not enter passport numbers, financial information, health details, or other sensitive information into trip descriptions or the assistant.",
        },
        {
          title: "AI processing",
          body: "Trip preferences and relevant itinerary content are sent to Google Gemini to generate plans and respond to your questions. Assistant messages and the recent conversation are also sent to Gemini. Google processes this information under the terms applicable to the service operator’s Google account. AI content may be inaccurate. The application does not intentionally send your account password to the AI provider.",
        },
        {
          title: "Sessions and local storage",
          body: "An HttpOnly cookie supports your login session. Access tokens are held in application memory rather than browser-persistent storage. The browser stores a non-secret session hint and a temporary planning draft. The sample itinerary and assistant conversation are not saved across visits by the interface.",
        },
        {
          title: "Saved trips and deletion",
          body: "Your account’s saved trips are retrieved through authenticated API requests. You can permanently remove a trip using its delete control in My trips. Data in infrastructure backups and operational records may remain subject to the operator’s backup and retention policies. There is not yet a self-service account deletion or full data export workflow.",
        },
        {
          title: "Operational data and external links",
          body: "The service records request identifiers, timings, response statuses, and network information for reliability and abuse prevention. If the operator configures error monitoring, diagnostic events are sent to Sentry with automatic personal-data collection disabled. Map and research links open third-party sites under those sites’ own privacy policies. Destination photographs and fonts are served with the application; there is no advertising tracker in this interface.",
        },
        {
          title: "Before a public business launch",
          body: "The deploying business must publish its legal identity, privacy contact, retention schedule, applicable legal bases, and data-rights procedure. Those details depend on the operator and jurisdiction and are not supplied by this software. This notice must be reviewed and completed by that business before collecting public customer data.",
        },
      ]}
    />
  );
}
