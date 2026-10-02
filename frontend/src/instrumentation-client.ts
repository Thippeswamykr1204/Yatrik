import * as Sentry from "@sentry/nextjs";
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    sendDefaultPii: false,
    tracesSampleRate: 0.05,
    beforeSend(event) {
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        delete event.request.headers;
        delete event.request.query_string;
      }
      delete event.user;
      event.breadcrumbs = event.breadcrumbs?.filter(
        (crumb) => crumb.category !== "console",
      );
      return event;
    },
  });
}
