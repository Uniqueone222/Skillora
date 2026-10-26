# Skillora

Skillora is a skill-first learning marketplace: learners start with a skill, compare independent educators and courses, and get access to learning and community support. A single account can both learn and teach.

## MVP workflows

- Email registration/login and educator activation on the same account.
- Approved-skill discovery with skill/course description search, category, course-level and price filters; learner skill requests and one-vote-per-user moderation.
- Educators can offer skills they teach for admin review; learners can separately request skills they want to learn and vote on community demand.
- Educator profile and course authoring; modules and lessons are embedded in the course record.
- Course submission and admin publication approval.
- Course purchase with Razorpay **test-mode only**, free enrollment, server-verified payment fulfillment, protected learning-content access, and saved lesson progress.
- The learner library links to both the learning player and course details; enrolled learners see their access status and can reopen the course without an enrollment CTA.
- Educator uploads of MP4/WebM videos (up to 100 MB) directly to Cloudinary as authenticated media; playback URLs are signed server-side after preview, enrollment, or course-owner checks.
- Enrolled learners can leave one 1–5 star review per published course and edit it later; discovery sorts courses by newest, rating, or enrollment count.
- Separate course and educator communities with backend-enforced access settings, discussions, answers, and resolution.
- Persisted REST direct messaging, controlled by each educator's messaging setting.

Cloudinary credentials are optional for app startup; video upload/playback returns a configuration error until they are set. Cloudinary Free authenticated signed URLs are bearer links: anyone who obtains a playback URL can share it, and the URL does not expire. This MVP gates URL issuance by lesson preview/enrollment and does not provide per-viewer or short-lived playback tokens. Mentorship bookings, Socket.IO/live chat, notifications, subscriptions, teams, and analytics are deferred.

## Architecture

This is a JavaScript MERN modular monolith. The Express backend keeps the required top-level `apis/`, `controllers/`, `models/`, and `middlewares/` folders. Domain services own business rules. Course modules and lessons are embedded subdocuments; votes, enrollments, reviews, payment transactions, communities, discussions, conversations, and messages remain separate records where independent access, uniqueness, or lifecycle rules matter.

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
4. To enable video uploads, set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `backend/.env`. Configure all three or leave all three blank. Never expose the API secret in frontend environment variables. Videos upload directly from the browser to Cloudinary; the backend signs upload requests and verifies provider metadata before attaching a lesson.
5. To test paid checkout, configure Razorpay **test** key ID (`rzp_test_...`), key secret, and webhook secret. The server rejects live-mode key IDs. Never put the key secret in frontend environment variables.
6. Install frontend dependencies: `npm --prefix frontend install`
7. Copy `frontend/.env.example` to `frontend/.env` if the API is not at `http://localhost:5000/api`.
8. Run `npm run dev:api` and `npm run dev:web` in separate terminals.

The API validates required configuration and connects to MongoDB before it starts listening. The web app is served at `http://localhost:5173`; the health endpoint is `http://localhost:5000/api/health`.

## Payment and access integrity

Educators set the course price while authoring; the backend stores integer INR paise. On checkout, the server reads the published course and creates the Razorpay order for that stored amount—it ignores client-supplied prices. The browser callback is not treated as proof: the backend verifies the HMAC signature and fetches the payment from Razorpay, checking captured status, order, currency, and amount. Signed webhooks are also supported. Enrollment creation is idempotent and protected by a unique learner/course index. No platform commission is applied because a rate has not been decided.

The client receives paid lesson metadata only after an enrollment check. The backend checks enrollment (or preview status/course ownership) again before issuing each signed playback URL; the frontend does not enforce entitlement by hiding a route. Cloudinary Free signed URLs remain shareable bearer links and are not time-limited.

## Course reviews and discovery

Only a learner enrolled in a published course may submit a review. Each learner can have one review per course and may edit it; course educators cannot review their own courses. Ratings are integers from 1 to 5, and review text must be 10–2,000 characters. Course pages show the average rating, review count, enrollment count, and up to the 100 most recent reviews.

Course discovery accepts `sort=newest` (default), `sort=rating`, or `sort=enrollments`. Rating order uses average rating, then review count, then publication date. Enrollment order uses the number of unique enrollment records, then publication date; this is an enrollment-based popularity measure, not a view count. Both calculated metrics are applied before the result limit.

## Validation

```text
npm test
npm run build
```

`npm test` runs the backend's Node test suite. `npm run build` creates the production Vite bundle. MongoDB, Cloudinary, and Razorpay credentials are needed to exercise their provider-backed workflows end to end.

## API overview

- `/api/auth` — register, login, logout, current user
- `/api/skills` — approved skill catalogue, learner requests, educator offers, votes, skill courses
- `/api/educators` — activation, public profile, profile editing, educator course list
- `/api/courses` — public discovery (`sort=newest|rating|enrollments`), reviews (`GET/POST/PUT /:courseId/reviews`), educator drafts, modules/lessons, submission, protected learning content and progress
- `/api/enrollments` — learner course library
- `/api/payments` — Razorpay test order, verification, signed webhook
- `/api/communities` — course/educator community lookup, access settings, discussions and answers
- `/api/conversations` — persisted direct messages
- `/api/admin` — skill and course moderation

## Known limitations

- Cloudinary video upload and signed playback require Cloudinary credentials. The implementation accepts MP4/WebM files up to 100 MB; free-tier usage limits apply.
- Cloudinary Free signed playback URLs can be shared and do not expire; use a paid token-based access feature or another provider if per-viewer/time-limited protection is required.
- An upload interrupted after Cloudinary accepts the file but before the backend attaches it can leave an unattached asset; remove such abandoned uploads from Cloudinary's Media Library.
- Messaging is REST-based; real-time delivery and Socket.IO are deferred.
- Razorpay accepts test credentials only. Production payment onboarding, refunds, payouts, and platform-fee policy are not implemented.
- Course prices use INR. Mentorship booking and other future-phase features are not included.
- No deployment or demo URLs have been configured.
