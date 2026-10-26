# Skillora

Skillora is a skill-first learning marketplace: learners start with a skill, compare independent educators and courses, and get access to learning and community support. A single account can both learn and teach.

## MVP workflows

- Email registration/login and educator activation on the same account.
- Approved-skill discovery with skill/course description search, category, course-level and price filters; learner skill requests and one-vote-per-user moderation.
- Educator profile and course authoring; modules and lessons are embedded in the course record.
- Course submission and admin publication approval.
- Course purchase with Razorpay **test-mode only**, free enrollment, server-verified payment fulfillment, protected learning-content access, and saved lesson progress.
- Separate course and educator communities with backend-enforced access settings, discussions, answers, and resolution.
- Persisted REST direct messaging, controlled by each educator's messaging setting.

Course video storage/playback is not connected. Lesson metadata and access checks are implemented; do not add real media URLs until a signed media-provider integration is configured. Mentorship bookings, Socket.IO/live chat, reviews, notifications, subscriptions, teams, and analytics are deferred.

## Architecture

This is a JavaScript MERN modular monolith. The Express backend keeps the required top-level `apis/`, `controllers/`, `models/`, and `middlewares/` folders. Domain services own business rules. Course modules and lessons are embedded subdocuments; votes, enrollments, payment transactions, communities, discussions, conversations, and messages remain separate records where independent access, uniqueness, or lifecycle rules matter.

```text
frontend/                 React + Vite
backend/src/apis/         Express routers and endpoint definitions
backend/src/controllers/ HTTP request/response handlers
backend/src/services/    Business rules and persistence workflows
backend/src/models/      Mongoose schemas and indexes
backend/src/middlewares/ Authentication, authorization, validation, errors
```

## Requirements

- Node.js 20 or newer
- MongoDB (local instance or hosted URI)
- Razorpay test credentials for paid checkout testing; discovery and free courses work without Razorpay keys

## Local setup

1. Install backend dependencies: `npm --prefix backend install`
2. Copy `backend/.env.example` to `backend/.env`; set `MONGODB_URI`, a unique random `JWT_ACCESS_SECRET` of at least 32 characters, and `CLIENT_URL`.
3. Optionally set `ADMIN_EMAILS` to comma-separated addresses. Accounts registered with those addresses receive the admin role; users cannot assign themselves admin.
4. To test paid checkout, configure Razorpay **test** key ID (`rzp_test_...`), key secret, and webhook secret. The server rejects live-mode key IDs. Never put the key secret in frontend environment variables.
5. Install frontend dependencies: `npm --prefix frontend install`
6. Copy `frontend/.env.example` to `frontend/.env` if the API is not at `http://localhost:5000/api`.
7. Run `npm run dev:api` and `npm run dev:web` in separate terminals.

The API validates required configuration and connects to MongoDB before it starts listening. The web app is served at `http://localhost:5173`; the health endpoint is `http://localhost:5000/api/health`.

## Payment and access integrity

Educators set the course price while authoring; the backend stores integer INR paise. On checkout, the server reads the published course and creates the Razorpay order for that stored amount—it ignores client-supplied prices. The browser callback is not treated as proof: the backend verifies the HMAC signature and fetches the payment from Razorpay, checking captured status, order, currency, and amount. Signed webhooks are also supported. Enrollment creation is idempotent and protected by a unique learner/course index. No platform commission is applied because a rate has not been decided.

The client receives paid lessons/media references only after an enrollment check. The frontend does not enforce entitlement by hiding a route.

## Validation

```text
npm test
npm run build
```

`npm test` runs the backend's Node test suite. `npm run build` creates the production Vite bundle. MongoDB and Razorpay credentials are needed to exercise persisted workflows and paid checkout end to end.

## API overview

- `/api/auth` — register, login, logout, current user
- `/api/skills` — approved skill catalogue, requests, votes, skill courses
- `/api/educators` — activation, public profile, profile editing, educator course list
- `/api/courses` — public discovery, educator drafts, modules/lessons, submission, protected learning content and progress
- `/api/enrollments` — learner course library
- `/api/payments` — Razorpay test order, verification, signed webhook
- `/api/communities` — course/educator community lookup, access settings, discussions and answers
- `/api/conversations` — persisted direct messages
- `/api/admin` — skill and course moderation

## Known limitations

- There is no media-provider integration or playable video experience yet.
- Messaging is REST-based; real-time delivery and Socket.IO are deferred.
- Razorpay accepts test credentials only. Production payment onboarding, refunds, payouts, and platform-fee policy are not implemented.
- Course prices use INR. Mentorship booking and other future-phase features are not included.
- No deployment or demo URLs have been configured.
