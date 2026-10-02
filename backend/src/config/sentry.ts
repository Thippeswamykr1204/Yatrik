import * as Sentry from "@sentry/node";
import { config } from "@/config/env.js";

export function initSentry(): void {
  if (!config.sentry.dsn) return;
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.env,
    tracesSampleRate: config.env === "production" ? 0.1 : 0,
    sendDefaultPii: false,
    beforeSend(event) {
      // Request bodies, cookies, headers and provider errors may contain private trip data.
      delete event.request;
      delete event.user;
      delete event.extra;
      delete event.breadcrumbs;
      for (const exception of event.exception?.values ?? [])
        exception.value = "Server error (details omitted)";
      return event;
    },
  });
}

export { Sentry };
