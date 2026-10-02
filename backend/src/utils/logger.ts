import winston from "winston";
import { config } from "@/config/env.js";

const sensitive =
  /password|authorization|cookie|token|secret|api.?key|prompt|rawText|email|history|payload|body|stack/i;
function sanitize(value: unknown): unknown {
  if (value instanceof Error) return { name: value.name };
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sensitive.test(key) ? "[REDACTED]" : sanitize(entry),
      ]),
    );
  }
  return value;
}
const redact = winston.format((info) => {
  for (const key of Object.keys(info)) {
    if (key === "message" && typeof info[key] === "string") continue;
    info[key] = sensitive.test(key) ? "[REDACTED]" : sanitize(info[key]);
  }
  // Winston's splat arguments can contain raw provider/database errors.
  delete info[Symbol.for("splat")];
  return info;
});

// Structured stdout works with read-only containers and external log retention.
export default winston.createLogger({
  level: config.logging.level,
  silent: config.env === "test",
  format: winston.format.combine(
    redact(),
    winston.format.timestamp(),
    winston.format.json(),
  ),
  defaultMeta: { service: "yatrik-api" },
  transports: [new winston.transports.Console()],
});
