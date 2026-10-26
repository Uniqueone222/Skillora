# Implementation decisions

These choices retain the product decisions in [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) while keeping the MVP buildable and reducing duplicate plumbing.

| Area | Decision | Rationale / boundary |
|---|---|---|
| Backend structure | Keep the required separate `apis/`, `controllers/`, `models/`, and `middlewares/` folders; group code by domain rather than by every entity. | Honor the explicit folder convention while avoiding a route/controller pair for every small subresource. |
| Course structure | Embed modules and lessons as subdocuments in `Course`. | Authoring, moderation, and lesson navigation operate on a course; independent module/lesson queries are not currently needed. Enrollment progress refers to lesson IDs. |
| Separate records | Keep users, educator profiles, skills, skill requests/votes, courses, enrollments, payment transactions, communities, discussions, conversations, and messages as models. | These have independent authorization, moderation, uniqueness, or lifecycle requirements. |
| MVP scope | Implement the five recommended workflows, with straightforward discussion features. Keep both course and educator community scopes. | Preserve skill-first discovery, publication moderation, paid access, and configurable community rules without adding low-priority product areas. |
| Payments | Razorpay test mode only; course price is stored in integer INR paise and derived from the published course on the server. Verify signature, then verify captured payment/order/amount with Razorpay; also accept signed webhooks. | The browser cannot set the amount, transaction result, or entitlement. The application rejects live-mode key IDs. Platform commission remains zero/unset pending a product decision. |
| Messaging | Include persisted REST messaging; defer Socket.IO. | Delivers the educator-controlled private conversation workflow without a second real-time transport to operate. MongoDB remains authoritative. |
| Video | Use Cloudinary authenticated video assets with server-signed direct browser uploads. Verify provider metadata before attaching media; issue signed playback URLs only after preview, enrollment, or course-owner checks. | Cloudinary Free was selected. Signed URLs are shareable bearer links and do not expire; the MVP accepts this tradeoff and limits uploads to MP4/WebM up to 100 MB. |
| Deferred areas | Mentorship booking, reviews, notifications, analytics, subscriptions, teams, reports, real-time messaging, media hosting. | These are optional or future phase in the product context and should not destabilize the core workflows. |
| Sessions | Use an HTTP-only, same-site cookie with a signed JWT; allow bearer authorization for API clients. | Keep the browser token out of JavaScript storage. There is no refresh-token flow in this MVP. |
