# Yatrik

**Less planning. More being there.**

Yatrik is an India-first AI travel-planning studio: discover a destination, shape a trip around your interests and budget, and turn it into an editable day-by-day itinerary. The interface uses warm ivory, forest green, editorial typography, local destination imagery, and a focused light-only visual system.

This repository is rebuilt **in place**, retaining the working Next.js + Express + MongoDB + Redis architecture. It is a deployable foundation, not a claim that million-user capacity, regulatory compliance, or provider reliability has already been proven. Read the [launch requirements](#before-a-public-business-launch).

## What works

- Responsive editorial landing page, destination inspiration, and a working destination/duration quick planner.
- Four-step planning: destination and dates → travel style → interests → review. A browser-session draft survives signup and login.
- Real account registration/login, private saved trips, pagination, filtering, deletion confirmation, and trip-completion tracking.
- Asynchronous Gemini itinerary generation with actual job-state polling, retries, schema validation, cache reuse, and recoverable errors.
- Editable activities, completion checkmarks, individual-day regeneration, estimated budgets, budget optimization suggestions, stay research links, packing lists, and contextual assistant chat.
- Plain-text itinerary download and print/PDF styles that include **every day**, not just the selected day.
- A clearly labeled, hand-written Kerala sample at `/itinerary/sample`, usable without credentials. Its edits are temporary; it never pretends to be a live AI result.
- Keyboard-operable tabs, focus-managed dialogs, visible focus styles, a skip link, reduced-motion support, and loading/empty/error states in a consistent light theme.
- SEO metadata, sitemap, robots rules, self-hosted fonts and images, security headers, optional Sentry, tests, containers, and CI/release workflows.

There is **no payment collection or booking integration**. Hotel names, ratings, routes, hours, and costs from AI are unverified suggestions. The interface deliberately avoids fabricated customer counts, testimonials, live availability, and generation-time promises.

## Product and architecture decisions

1. **Keep the existing stack, upgrade the product.** The description originally named Next.js 15, but the actual working tree already used Next.js 16. The rebuilt frontend uses patched **Next.js 16.3.8**, React 19, and strict TypeScript rather than downgrading it.
2. **India-first, INR-first.** This preserves the existing product and AI contract. There is no misleading currency switch backed by invented conversions. Dates are stored for planning; the current full-itinerary prompt is preference-based, not a live, date-specific availability service.
3. **Separate request serving from generation.** Express handles authenticated operations; BullMQ workers handle full itinerary generation. API and worker capacity can scale independently. Small AI actions currently remain synchronous and require a sufficiently long proxy timeout.
4. **Use an account-owned document model.** MongoDB suits nested itinerary days, activities, stays, and packing lists. Owner queries and indexes enforce access boundaries; dashboard statistics aggregate in MongoDB rather than loading all trip documents into API memory.
5. **Environment-selected API origins.** The browser calls `NEXT_PUBLIC_API_URL`: localhost during development and the Render API origin in production. Next can still rewrite `/api/*` for Docker deployments. Gemini keys never enter browser code.
6. **A small, explicit frontend system.** React Query handles server state, Zustand handles in-memory session/UI state, Radix handles dialogs, CSS tokens define the light visual system, and Framer Motion handles focused transitions. No external font requests at build or runtime.

```text
Browser ── Next.js web / env-selected API origin ── Express API ── MongoDB
                                                        │
                                                    Redis/BullMQ
                                                        │
                                                generation workers
                                                        │
                                                  Google Gemini
```

### Repository map

```text
frontend/
  src/app/                  Landing, planner, auth, dashboard, sample, legal, SEO
  src/components/studio/    Planner and itinerary product components
  src/components/layout/   Brand, navigation, footer
  src/components/common/   Accessible dialog and notifications
  src/services/            Typed API/auth/trip clients and refresh coordination
  src/lib/                 Validation, travel helpers, illustrative sample
  src/providers/           Query cache, session bootstrap, motion preference
  src/store/               In-memory authentication and transient UI state
  tests/                   Unit and component behavior tests
  e2e/                     Desktop/mobile browser journeys and axe checks
  scripts/start.mjs        Standalone production server launcher
backend/
  src/controllers/         HTTP request orchestration
  src/services/            Auth, trip persistence, Gemini integration
  src/validators/          Request and provider-response schemas
  src/models/              User, Trip, AIGenerationLog
  src/middleware/          Authentication, CORS/origin checks, limits, errors
  src/queues/              BullMQ generation producer
  src/workers/             Generation processor and worker health check
  src/utils/               Cache, safe logging, tokens, readiness
  tests/                   Mongo-backed security/API and Redis/queue integration
.github/workflows/         CI checks, image builds, GHCR release publishing
```

## Requirements

- **Node.js 22+**, npm; Node 22 is the Docker/CI target.
- **MongoDB 7+** locally or MongoDB Atlas.
- **Redis 7+**. Redis is required even in normal local development: rate limiting intentionally fails closed if Redis is unavailable.
- A Gemini API key with access to `gemini-2.5-flash-lite` (structured generation) and `gemini-2.5-flash` (chat), plus an appropriate quota/billing arrangement.
- Docker Compose is optional for local services and the full deployment.

## Local development

### 1. Install

From the repository root:

```bash
npm --prefix frontend ci
npm --prefix backend ci
```

Lockfiles are maintained by npm. Do not edit them manually. No root-level package installation is required.

### 2. Configure without overwriting existing secrets

Examples contain no real credentials. **Keep existing `.env` files and merge new names yourself if they already exist.** To create files only if absent:

```bash
(cd frontend && (test -e .env.local || cp .env.example .env.local))
(cd backend && (test -e .env.local || cp .env.example .env.local))
```

Fill `backend/.env.local` with the Mongo URI, Redis URL, Gemini key, and two **independent** random JWT secrets. Generate each secret separately with `openssl rand -hex 32`; never commit the output. Backend `.env.local` is loaded only in development. Production uses injected environment variables.

Frontend local values:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000
API_INTERNAL_URL=http://localhost:5000
```

`NEXT_PUBLIC_API_URL` is the browser-facing API origin: use `http://localhost:5000` locally and your Render API origin in production. Do not add `/api` or a trailing slash; the client adds `/api`. `API_INTERNAL_URL` is optional for Vercel and is only needed when the Next server should proxy `/api` (for example, Docker Compose). These variables are captured at **build time**; redeploy after changing them. Never put private keys in variables prefixed `NEXT_PUBLIC_`.

### 3. Run MongoDB and Redis

Use existing local services or development-only containers, bound to loopback:

```bash
docker run --name yatrik-dev-mongo -p 127.0.0.1:27017:27017 -d mongo:7
docker run --name yatrik-dev-redis -p 127.0.0.1:6379:6379 -d redis:7-alpine
```

These two commands are for local development only. The full Compose setup below requires authenticated databases.

### 4. Run all three application processes

In separate terminals:

```bash
cd backend && npm run dev
```

```bash
cd backend && npm run worker:generation
```

```bash
cd frontend && npm run dev
```

Open **http://localhost:3000**. Use that exact origin, not `127.0.0.1`, unless you also update the backend allowed frontend origin. API liveness is **http://localhost:5000/health**; readiness is **http://localhost:5000/ready**. Readiness returns 503 until MongoDB, Redis, and a generation worker are available.

The landing page, public planner, and sample itinerary render without a running API. Signup, saved plans, and AI operations require the complete backend. There is no silent fake-data fallback.

## Environment reference

See `backend/.env.example`, `frontend/.env.example`, and root `.env.example` for the complete documented configuration.

| Backend variable | Purpose / default |
| --- | --- |
| `MONGODB_URI` | Required authenticated connection string in production |
| `GEMINI_API_KEY` | Required server-only provider credential |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Required distinct secrets, at least 32 characters each |
| `NODE_ENV` | `development`, `test`, or `production` |
| `HOST`, `PORT` | `0.0.0.0` and Render’s injected `PORT` (local default `5000`) |
| `REDIS_URL` | Development default `redis://127.0.0.1:6379`; explicitly required in production |
| `FRONTEND_URL` | Legacy/single development origin, default `http://localhost:3000` |
| `FRONTEND_URLS` | Comma-separated exact allowed origins; set to your Vercel URL(s) on Render |
| `FRONTEND_URL_PROD` | Backward-compatible single HTTPS production origin when `FRONTEND_URLS` is absent |
| `JWT_EXPIRY`, `JWT_REFRESH_EXPIRY` | `15m`, `7d`; positive `s/m/h/d` durations, at most 90 days |
| `COOKIE_SAME_SITE` | `lax` locally; set `none` for Vercel → Render cross-site requests |
| `COOKIE_SECURE` | `false` locally; set `true` in production with HTTPS |
| `COOKIE_DOMAIN` | Usually blank; Render’s host-only cookie is correct for a Vercel frontend |
| `TRUST_PROXY` | `0` by default; configure for a known controlled proxy chain only |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` | `900000`, `100` per client IP; tune from measurements |
| `AUTH_RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX_REQUESTS` | `900000`, `10` login/register attempts per IP |
| `AI_RATE_LIMIT_MAX_REQUESTS` | `5` AI requests per account/hour |
| `LOG_LEVEL`, `SENTRY_DSN` | `info`; optional monitoring |

**Proxy configuration matters:** behind the Next rewrite, the API sees the web server as its peer. With `TRUST_PROXY=0`, clients share that peer's IP limit. Set the correct trusted hop count only when API ingress cannot bypass those proxies; for a single controlled Next proxy on a private network this is usually `1`. Do not blindly trust forwarded headers or expose alternative shorter ingress paths. Put an edge limit in front of signup as well.

## Security and data behavior

- Bcrypt password hashing; bounded credentials; JWT signature algorithm and claims checked.
- Access tokens stay in application memory. A rotating HttpOnly refresh cookie restores a session. Production cookies are Secure; refresh JWTs are stored as SHA-256 hashes and rotated atomically with unique identifiers.
- Single-flight refresh in a tab and Web Locks coordination across supporting browsers' tabs prevent refresh races. The current data model supports **one active refresh session per account**; a new device login replaces the previous refresh session.
- Invalid login does not initiate a refresh loop. Logout works after an expired access token. Account changes clear cached frontend query data.
- Every trip and trip-scoped AI operation checks ownership. Account API payloads use `private, no-store` caching policy.
- Redis Lua counters share API/auth/AI limits across replicas. A Redis failure returns 503 rather than disabling protection.
- Bounded JSON bodies, ObjectId validation, integer trip lengths, date validation, bounded arrays/costs/chat histories, structured provider-response validation, and generic production errors.
- Structured stdout logging redacts credential/payload fields; provider responses and chat text are not logged. Sentry is opt-in and default PII collection is disabled.
- A validated generation cache is kept for 24 hours and keyed by normalized destination/duration/budget/interests. Only generated plans are reused, not user edits or account details. Redis and backups must be treated as private infrastructure.
- A generation finishing does **not** mark the holiday as traveled; that is a separate user action.
- Default CSP blocks framing, plugins, and off-origin assets. Inline scripts/styles remain allowed for Next hydration. A nonce-based CSP is a documented hardening opportunity, not a claim of a fully strict CSP.

### Main API contract

All paths are under `/api`. Success envelopes contain `success`, `status`, `message`, `data`, and request metadata. List responses also include `pagination`.

| Method/path | Behavior |
| --- | --- |
| `POST /auth/register`, `POST /auth/login` | Issue in-memory access token and HttpOnly refresh cookie |
| `POST /auth/refresh`, `POST /auth/logout` | Rotate or end session; browser origin checked |
| `GET /auth/me` | Current account |
| `GET /trips`, `POST /trips` | Paginated owner-owned list; create draft |
| `GET /trips/:id`, `PUT /trips/:id`, `DELETE /trips/:id` | Read, update, delete own trip |
| `PATCH /trips/:id/metadata` | Narrow metadata update |
| `GET /trips/stats/overview` | Account trip counts and planned days |
| `POST /trips/:id/generate` | Queue generation or reuse cache; HTTP 202 |
| `GET /trips/:id/generation-status` | Real generation status/stage |
| `POST /ai/regenerate-day` | Replace a day using feedback |
| `POST /ai/optimize-budget` | Return suggestions without silently changing the saved budget |
| `POST /ai/chat` | Trip-context assistant response |
| `POST /ai/packing-list/:id` | Generate and replace saved packing list |

## Build and run production locally

```bash
npm --prefix backend run build
npm --prefix frontend run build
```

After securely injecting backend production variables and configuring HTTPS:

```bash
cd backend && npm start
# separate process:
cd backend && npm run start:worker
# separate process:
cd frontend && npm start
```

The frontend start script copies local assets into `.next/standalone` and launches its generated server. `PORT` and `HOSTNAME` control its listener. The Docker image performs these asset copies during its build instead.

Do not set the backend to production on plain HTTP and expect refresh cookies to work; Secure cookies require HTTPS.

## Docker Compose deployment

1. Create a **new**, uncommitted configuration file from root `.env.example`, for example `cp -n .env.example .env.compose`. Populate all empty secrets. Compose intentionally fails if credentials are absent.
2. Generate Mongo/Redis passwords as URL-safe hexadecimal strings because they are embedded in connection URIs. Generate each JWT secret independently.
3. For production, set `APP_ENV=production`, `FRONTEND_URLS=https://your-project.vercel.app`, `COOKIE_SAME_SITE=none`, `COOKIE_SECURE=true`, and the actual `NEXT_PUBLIC_SITE_URL`. Keep `NEXT_PUBLIC_API_URL` blank and `API_INTERNAL_URL=http://api:5000` when using the bundled services.
4. Validate configuration without printing it, then build and run:

```bash
docker compose --env-file .env.compose config --quiet
docker compose --env-file .env.compose up --build -d
docker compose --env-file .env.compose ps
```

Five services are defined: **web, api, worker, mongo, redis**. Mongo/Redis are not exposed to the host. Application ports bind to loopback by default. Put a TLS ingress/load balancer in front of the web service. Non-root app containers, explicit health checks, Redis persistence, Mongo volumes, read-only backend filesystems, and graceful worker shutdown are configured.

**This Compose file is not a multi-region production platform.** It uses the authenticated Mongo bootstrap account; replace it with a least-privilege application account before public operation, configure managed database/Redis HA and backups, and test recovery. Do not run `down -v` against data you intend to keep.

### Hosted alternative

- Deploy `frontend/` on Vercel. Set `NEXT_PUBLIC_API_URL` to the Render API origin, `NEXT_PUBLIC_SITE_URL` to the Vercel/custom frontend origin, and leave `API_INTERNAL_URL` empty unless Vercel is intentionally proxying the API.
- `render.yaml` defines separate Render API and generation-worker services using compiled production output. Supply MongoDB Atlas, Redis, Gemini credentials, and the exact frontend origin to both processes. Never run the worker as an ephemeral serverless handler.
- The API must be able to contact Redis/Mongo; the worker must share the **same** database and Redis queue.
- For synchronous assistant/budget/day/packing operations, configure proxies with a timeout appropriate to provider retries (up to 180 seconds on the client). If your host cannot support that, move these operations to the existing queue pattern before launch.
- For Vercel → Render, configure `FRONTEND_URLS` on Render with the exact Vercel/custom-domain origin(s), set `COOKIE_SAME_SITE=none`, `COOKIE_SECURE=true`, and leave `COOKIE_DOMAIN` blank. The cookie belongs to the Render API host; it cannot be shared by setting its domain to Vercel. Redeploy both services after changing build-time frontend variables or backend environment variables.

### CI and release publishing

`.github/workflows/ci.yml` runs installation, lint, typechecking, tests, production builds, dependency audits, Chromium browser checks, and container builds. Backend CI provisions Redis; test MongoDB is ephemeral.

`.github/workflows/release.yml` publishes web/API/worker images to GHCR on a version tag or manual dispatch. Set repository variable `NEXT_PUBLIC_SITE_URL` first, and optionally `API_INTERNAL_URL` / `NEXT_PUBLIC_API_URL`. It uses the workflow-scoped `GITHUB_TOKEN`; no registry password is committed. Only publish commits whose CI checks passed. Configure protected release tags and your deployment environment's approval/rollback policies. Image publishing does not automatically provision a server or deploy customer traffic.

## Verification

```bash
npm --prefix frontend run lint
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build
(cd frontend && npx playwright install chromium)
npm --prefix frontend run test:e2e

npm --prefix backend run lint
npm --prefix backend run typecheck
TEST_REDIS_URL=redis://127.0.0.1:6379/15 npm --prefix backend test
npm --prefix backend run build

npm --prefix frontend audit --audit-level=moderate
npm --prefix backend audit --audit-level=moderate
```

Use a **disposable Redis instance/database** for tests, never a production Redis URL. Tests use MongoMemoryServer, not your real Mongo database. The first run downloads a MongoDB test binary. Without `TEST_REDIS_URL`, Redis/queue integration cases are explicitly skipped; provide it for the complete suite.

Test coverage includes:

- Form boundaries, corrupt draft recovery, safe auth return paths, signup handoff, correct request payloads, and duplicate-draft prevention after enqueue failure.
- In-memory token storage, concurrent refresh, bad-login handling, expired-token logout, and authenticated retry.
- Itinerary day changes, editing, packing progress, and keyboard tab behavior.
- Ownership isolation, password/token security, origin checks, request limits, malformed requests, provider schemas, and duration boundaries.
- Actual API → Redis/BullMQ → worker → Mongo persistence with **Gemini mocked at the provider boundary**.
- Day-regeneration persistence with real Mongoose subdocuments and preservation of unaffected activities.
- Desktop/mobile landing → planner → signup → itinerary browser journeys, sample export/print, overflow checks, and axe WCAG A/AA scans. Browser account/API responses are stubbed, separately from the backend integration tests.

No live paid Gemini call is made by the tests. Automated accessibility scans are not a substitute for manual screen-reader testing.

### Verified in this rebuild

Local runtime: Node **26.3.1**. Docker and CI target Node **22**.

| Check | Result |
| --- | --- |
| Dependency installation | Passed for frontend and backend |
| Lint and strict typechecking | Passed for both applications |
| Frontend unit/component tests | **30 passed** |
| Backend tests, with disposable real Redis | **41 passed**, including queue persistence and regeneration |
| Chromium browser journeys | **8 passed** across desktop/mobile, including axe scans |
| Production builds | Next standalone build and backend TypeScript build passed |
| Dependency audits | **0 reported vulnerabilities** in both dependency trees |
| Compose configuration and deployment YAML parsing | Passed |
| Visual smoke check | Landing, planner, and itinerary inspected; mobile check found no overflow or broken loaded images |
| Full Docker startup / hosted deployment / live Gemini | Not run; Docker daemon unavailable, no production service or paid provider call made |

## Before a public business launch

These are real requirements, not claims of work already completed:

- **Credentials and model evaluation:** perform a supervised live-generation smoke test, establish provider quotas, test seasonal/remote destinations, and validate hallucination/safety handling. There are no verified booking or live-price feeds.
- **Business/legal:** replace the deployment-dependent legal notice details with your business identity, privacy contact, jurisdiction, retention policy, and lawful processing terms. Obtain legal review before collecting public customer data.
- **Account lifecycle:** implement email verification, password recovery, self-service account deletion/export, and abuse-resistant transactional email. Multi-device refresh sessions and MFA are further improvements.
- **Operations:** configure HTTPS/HSTS at ingress, restrictive networking, least-privilege database credentials, automated backups, tested restores, log retention, alerting, secret rotation, and incident response.
- **Capacity and cost:** load-test representative read/write/generation workloads; measure p95 latency, queue depth, worker saturation, token cost, and Mongo/Redis resource usage. Autoscale within your Gemini quota and budget. The current two concurrent jobs per worker are a conservative starting point, not a capacity guarantee.
- **Deployment evidence:** application builds and local tests are run during this rebuild. A Docker daemon was unavailable in the local environment, so full image builds and Compose startup require CI or your deployment machine. Release publishing and hosted rollout have not been executed.

## Suggested next improvements

1. Queue all potentially long AI mutations, then add server-sent generation updates instead of polling at higher scale.
2. Add explicit per-account generation entitlements, daily provider-spend caps, circuit breakers, and operational dashboards.
3. Introduce account lifecycle workflows above before adding social sign-in or paid plans.
4. Add verified place IDs, opening hours, travel times, accessibility information, and sourced weather/seasonal data; distinguish sourced facts from AI suggestions.
5. Add versioned itinerary updates and optimistic concurrency for multi-tab editing, then collaborative trips and revocable share links.
6. Move high-volume lists to cursor pagination and summary projections; tune indexes and query plans using real traffic.
7. Expand tests to Safari/Firefox, real screen-reader workflows, provider contract replay, degraded dependencies, restore drills, and deployment smoke checks.
8. Add nonce-based CSP and a security review against the actual deployment topology.

## Assets and licensing

Destination photographs are stored locally under `frontend/public/destinations/`; no third-party image request is needed at runtime. Sources:

- [Mountain landscape](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b)
- [Jaipur](https://images.unsplash.com/photo-1599661046827-dacff0c0f09a)
- [Kerala](https://images.unsplash.com/photo-1602216056096-3b40cc0c9944)
- [Goa](https://images.unsplash.com/photo-1512343879784-a960bf40e7f2)

Downloaded through `images.unsplash.com`, subject to the [Unsplash license](https://unsplash.com/license). Review image suitability and rights for your specific commercial use; generic destination images are inspiration, not verified photos of suggested stays. DM Sans and Manrope are self-hosted through Fontsource and use the SIL Open Font License.
