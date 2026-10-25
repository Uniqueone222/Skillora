# Skillora --- Complete Product, Architecture & AI Handoff Specification

**Document purpose:** This is the canonical product and engineering
context for Skillora. It is written so a new developer or AI coding
assistant can understand the product, all settled decisions, the
reasoning behind them, the intended workflows, the data model, the
backend/frontend architecture, security rules, and implementation
priorities without needing the original conversation.

**Working product name:** Skillora\
**Product category:** Skill-first learning and independent-educator
marketplace\
**Document status:** Product direction and core decisions are agreed.
Technical choices below are proposed implementation guidance. Refine
implementation details where necessary, but do not silently change the
settled product decisions.

------------------------------------------------------------------------

# 1. Instructions for an AI coding assistant

When using this document as context, follow these rules:

1.  Treat the **Settled Decisions** section as authoritative. Do not ask
    the product owner to choose those items again.
2.  Preserve the skill-first product identity. Do not turn the
    application into a generic course catalogue or a conventional
    university LMS.
3.  A user may be both a learner and an educator on the same account. Do
    not create separate student and teacher accounts.
4.  Any registered user may activate educator capabilities. Educator
    activation is not the same thing as course publication approval.
5.  Courses must pass admin moderation before public publication.
6.  Support both course-specific communities and educator-wide
    communities. They are separate community scopes using shared
    discussion functionality.
7.  Community access and doubt-response rules are configurable. Enforce
    them on the backend.
8.  Educators may offer both request-based and instant mentorship
    booking. The booking mode belongs to each mentorship service.
9.  Educator teams are a future feature. Do not implement teams in the
    initial version.
10. Keep controllers, models, middlewares, and API route definitions in
    **separate top-level folders** in the backend. This is an explicit
    project structure requirement.
11. Use JavaScript for the MERN application. Do not switch to another
    stack without a concrete reason and agreement.
12. Prefer complete, tested workflows over many unfinished features. The
    academic project guidance recommends approximately 3--5 important
    workflows implemented properly.
13. Do not invent working functionality. If a feature is deferred, mark
    it as deferred and do not present a decorative button as a completed
    feature.
14. Keep secrets out of source control. Use environment variables and
    provide `.env.example` files with placeholders only.
15. Explain significant implementation decisions and keep the README and
    this specification aligned with the actual code.

If the codebase already exists, inspect it before changing files. Do not
overwrite working code or restructure the repository blindly.

------------------------------------------------------------------------

# 2. Executive summary

Skillora is a **skill-first learning and creator marketplace**
connecting people who want to learn practical, creative, technical, or
niche skills with independent educators who can teach them.

The learner's starting point is a skill, not necessarily a course. A
learner may search for "3D modelling", "public speaking", "motion
graphics", "bread making", or another skill. Skillora then helps them
compare educators, courses, teaching approaches, levels, prices, and
available support.

Educators are independent creators. Any registered user can activate
educator capabilities, create a public educator profile, and prepare
courses. A course is initially a draft and must be submitted for admin
review before it can be published publicly.

Learning is supported by two community scopes:

-   **Course-specific community:** discussions tied to one course.
-   **Educator-wide community:** discussions associated with an educator
    and shared across that educator's teaching.

Educators control the interaction options available to learners. They
can choose whether to allow messaging and can configure community
access. They may also offer paid one-on-one mentorship. Each mentorship
service can use request-based booking or instant booking.

A key discovery feature is skill demand. Learners can suggest missing
skills and vote for suggestions. Administrators review the suggestions.
Once approved, a skill becomes part of the catalogue and educators can
create courses for it.

The intended long-term product includes one-time course purchases, paid
mentorship, and potentially subscriptions or paid learning bundles. The
initial build should focus on a reliable, coherent MVP rather than
trying to implement every long-term feature.

**Core product principle:**

> Learners discover a skill first, then discover the educators, courses,
> learning paths, prices, and support options available for that skill.

------------------------------------------------------------------------

# 3. Problem and opportunity

## 3.1 Learner problems

-   People often know what they want to learn but do not know which
    educator or course is right for them.
-   Course catalogues can make learners compare isolated courses without
    understanding the wider skill landscape.
-   Niche, emerging, practical, or unusual skills may not be represented
    in an existing catalogue.
-   Learners can get stuck when a video does not answer a question.
-   Some learners need direct feedback or personal guidance beyond a
    discussion board.
-   A learner may want to compare several educators teaching the same
    skill before spending money.

## 3.2 Independent educator problems

-   A knowledgeable person may be able to teach a skill without being
    employed by an institution.
-   Independent educators need a way to create and sell courses without
    building their own complete platform.
-   They need discovery by people actively interested in the skill they
    teach.
-   They may want to build a community and decide how much learner
    interaction they can support.
-   They may want to offer paid one-on-one consultations in addition to
    recorded courses.

## 3.3 Product opportunity

Skillora connects skill discovery, course creation, learning, community
support, and optional mentorship.

``` text
Learner wants to acquire a skill
              |
              v
      Discovers the skill
              |
              v
 Compares educators and courses
              |
              v
     Purchases and learns
              |
              v
 Uses course / educator community
              |
              v
 Asks questions or seeks mentorship
              |
              v
 Learner demand reveals missing skills
              |
              v
 Educators create content for that demand
```

------------------------------------------------------------------------

# 4. Product identity and positioning

## 4.1 Chosen identity

The product combines:

1.  A **skill discovery platform**.
2.  An **independent creator marketplace**.

Skill discovery is the centre of the experience. The creator marketplace
makes it possible for educators to serve that demand.

## 4.2 Skill-first hierarchy

The central relationship is:

``` text
Skill
 ├── Educator A
 │    ├── Course A1
 │    └── Course A2
 ├── Educator B
 │    └── Course B1
 └── Educator C
      ├── Course C1
      └── Mentorship service
```

A skill detail page should communicate what the skill is and show the
available ways to learn it. It should help users compare educators and
courses.

A course may still have its own URL and detail page. Direct course links
are valid. However, the primary discovery experience should not consist
only of unrelated course cards.

## 4.3 What the product is not

Do not design Skillora as:

-   A university or school management system.
-   A platform restricted to formally certified teachers.
-   A generic video-hosting site.
-   A static list of online courses.
-   A social network unrelated to learning.
-   A video-conferencing product.
-   A generic CRUD demonstration.

------------------------------------------------------------------------

# 5. Settled product decisions

These decisions were explicitly discussed and finalized. They are
requirements, not open questions.

## 5.1 Educator onboarding --- anyone can become an educator

**Decision:** Any registered user can activate educator capabilities.

Implications:

-   Registration does not require choosing between "student" and
    "teacher".
-   A learner can later activate educator mode.
-   An educator can still purchase and learn from other courses.
-   No manual educator approval is required merely to activate educator
    capabilities.
-   Educator profile information is stored separately from the base user
    record.
-   Course publication still requires admin moderation.

Keep these concepts separate:

  Operation                      Approval
  ------------------------------ -------------------------
  Register account               No
  Activate educator capability   No manual approval
  Create a course draft          No
  Submit a course                Enters moderation queue
  Publish course publicly        Admin approval required

Do not let the frontend set a course to `published` directly.

## 5.2 Discussion structure --- both course and educator communities

**Decision:** Implement both community types.

-   A course community is tied to one course.
-   An educator-wide community is tied to one educator and can be used
    across that educator's teaching.

Examples:

  -----------------------------------------------------------------------
  Course-specific community           Educator-wide community
  ----------------------------------- -----------------------------------
  Questions about a particular lesson General questions about the skill

  Help with course exercises          Projects and learner showcases

  Clarification about course material General resources

  Course-specific peer discussion     Educator announcements
  -----------------------------------------------------------------------

Use one discussion engine and a `Community` entity with a scope/type. Do
not merge the two scopes into one global feed.

Access to an educator-wide community must not automatically grant access
to an enrolled-only course community.

## 5.3 Mentorship booking --- both request-based and instant

**Decision:** Educators can offer both booking modes.

The mode is configured **per mentorship service**.

Examples:

-   A 30-minute quick consultation can use instant booking.
-   A 60-minute portfolio review can use request-based booking.

The server reads the booking mode from the stored mentorship service.
Never trust the client to decide which booking flow applies.

## 5.4 Doubt/community access --- flexible configuration

**Decision:** Community access and response behaviour are configurable.

Supported access concepts:

-   `public` --- users can access according to the public community
    policy.
-   `enrolled` --- only learners enrolled in the associated course can
    access the course community.
-   `educator_responses_only` --- a restricted question/answer mode in
    which educator responses are the permitted response path. The
    implementation must define whether learners can create questions and
    must enforce the rule consistently.
-   `disabled` --- the community is unavailable.

Course community settings and educator-wide community settings are
independent.

Every community read and write must be authorized by the backend. Hiding
a component in React is not access control.

## 5.5 Educator teams --- later

**Decision:** Teams are not part of the initial version.

Do not implement now:

-   Team creation and invitations.
-   Team membership roles.
-   Multi-educator ownership.
-   Revenue splits.
-   Team analytics.

Avoid an architecture that makes future collaboration impossible, but do
not spend MVP time implementing team features. For the initial version,
one educator owns a course.

## 5.6 Platform identity --- skill-first

**Decision:** Skill discovery is the central product experience.

Implications:

-   Skills are first-class catalogue entities.
-   Search should help users find skills.
-   Skill detail pages show educators and published courses.
-   Skill suggestions and voting are a differentiating workflow.
-   Courses are associated with approved skills.
-   The homepage should not be only a generic course catalogue.

------------------------------------------------------------------------

# 6. User types, capabilities, and permissions

There are three platform user categories: learners, independent
educators, and administrators.

## 6.1 Learner capabilities

A learner can:

-   Register, log in, and manage their account.
-   Browse and search approved skills.
-   View skill details and compare educators/courses.
-   Suggest a missing skill and vote on suggestions.
-   Purchase a course.
-   Access enrolled course content.
-   Track lesson progress.
-   Participate in communities if their access is permitted.
-   Contact an educator if the educator enables messaging and applicable
    rules allow it.
-   Book an offered mentorship service.
-   Review a course if reviews are implemented and the learner is
    eligible.

## 6.2 Educator capabilities

An educator can:

-   Activate educator capabilities on an existing account.
-   Create and edit their educator profile.
-   Declare expertise and skills taught.
-   Create course drafts.
-   Add modules and lessons.
-   Attach video assets and learning resources.
-   Set course pricing.
-   Submit a course for moderation.
-   Edit a rejected course and resubmit it.
-   Manage their own published courses.
-   Configure course and educator community settings.
-   Respond to discussions.
-   Enable or disable direct messaging.
-   Optionally create mentorship services with either booking mode.
-   View basic course or earning information if implemented.

## 6.3 Administrator capabilities

An administrator can:

-   Review skill suggestions.
-   Approve or reject suggestions.
-   Review submitted courses.
-   Approve, reject, or suspend courses.
-   Review content reports.
-   Moderate inappropriate content.
-   Perform operational oversight.

Admin privileges must be checked on the server. A frontend route guard
alone is insufficient.

## 6.4 Recommended account model

A person can be a learner and educator at the same time.

Recommended concept:

``` js
{
  name: "Example User",
  email: "user@example.com",
  passwordHash: "...",
  capabilities: ["learner", "educator"],
  role: "user" // "user" | "admin"
}
```

-   `capabilities` represent product capabilities.
-   `role` represents platform authority.
-   A normal user must never be able to grant themselves `admin`.
-   Educator-specific information belongs in `EducatorProfile`.
-   Do not create separate login accounts for learners and educators.

A newly registered user can have `capabilities: ["learner"]`. When
educator mode is activated, add `"educator"` and create the associated
educator profile.

------------------------------------------------------------------------

# 7. Main product modules

## 7.1 Skill discovery

Purpose: help a learner discover a skill and the available ways to learn
it.

Expected capabilities:

-   Browse skill categories.
-   Search by skill name and relevant text.
-   Filter by category and supported course attributes.
-   Open a skill detail page.
-   View educators who teach the skill.
-   View published courses associated with the skill.
-   Compare course level, price, educator, and other available metadata.
-   Show popular or trending skills only when there is a real ranking
    signal.

Do not hardcode fake popularity claims. If popularity is implemented,
document whether it is based on purchases, views, saves, or
skill-request votes.

## 7.2 Skill requests and votes

Purpose: let learners express demand for skills not yet represented.

``` text
Learner submits missing skill
             |
             v
    SkillRequest is pending
             |
             v
 Other learners can vote once
             |
             v
      Admin reviews it
        /         \
    Reject        Approve
                    |
                    v
             Create/link Skill
                    |
                    v
           Skill becomes discoverable
                    |
                    v
         Educators can create courses
```

Rules:

-   Normalize names before duplicate checks.
-   Check for an equivalent existing approved skill and pending request.
-   One user should have at most one active vote per request.
-   Prefer a separate `SkillVote` collection with a unique compound
    index over an unbounded voter array.
-   Record who suggested the skill and who reviewed it.
-   Store moderation status and timestamps.
-   Only approved skills should appear in public skill discovery.

## 7.3 Educator profile and studio

The educator profile is the public creator identity. It can include:

-   Headline.
-   Biography.
-   Expertise.
-   Skills taught.
-   Optional qualifications or experience.
-   Avatar/profile image.
-   Interaction settings.

Do not label qualifications as verified unless the platform has actually
verified them.

The educator studio is a protected workspace for:

-   Profile editing.
-   Course drafts.
-   Course structure.
-   Lesson metadata.
-   Media assets.
-   Pricing.
-   Submission state.
-   Community settings.
-   Mentorship services, if included.
-   Basic analytics, if included.

## 7.4 Courses and moderation

A course belongs to one educator and one approved skill in the initial
version.

A course includes:

-   Title and description.
-   Skill association.
-   Educator association.
-   Thumbnail.
-   Difficulty.
-   Price and currency.
-   Modules.
-   Lessons.
-   Video asset references.
-   Optional downloadable resources.
-   Optional preview lessons.
-   Publication status.

Recommended lifecycle:

``` text
draft → submitted → published
                  ↘ rejected → draft/edit → submitted
published → suspended (admin action)
```

Implement state transitions in a service layer. Do not allow arbitrary
client-provided status updates.

Public discovery should return published courses only. Drafts and
submitted courses are visible to their owner and authorized admins.

## 7.5 Learning experience

After a valid purchase, create an enrollment/entitlement.

Expected learner features:

-   My Courses.
-   Course overview.
-   Course player.
-   Module and lesson navigation.
-   Mark lesson complete.
-   Resume from last accessed lesson.
-   Progress indicator.
-   Community access according to settings.
-   Preview access where configured.

The backend must check enrollment before returning paid lesson details
or protected media references. A hidden React route is not a security
boundary.

## 7.6 Communities and doubt resolution

There are two scopes:

1.  Course-specific community.
2.  Educator-wide community.

Both use the same discussion/answer engine. Their access rules and
ownership are different.

Potential discussion types:

-   `question`
-   `discussion`
-   `resource`
-   `announcement`

Potential discussion capabilities:

-   Create post.
-   Answer/reply.
-   Upvote.
-   Resolve question.
-   Accept an answer.
-   Identify an educator response.
-   Report inappropriate content.
-   Admin moderation.

A course community should be used for questions about that course. An
educator-wide community should support general questions, resources,
projects, announcements, and cross-course conversation.

The educator-response-only mode needs an unambiguous implementation
policy. For example, the system may allow learners to create questions
but only educators to answer. Whatever policy is chosen must be enforced
server-side and reflected clearly in the UI.

## 7.7 Direct messaging

A learner may contact an educator only if the educator has enabled
messaging.

At minimum:

-   Check `messagingEnabled` on the educator profile.
-   Check the user's eligibility to initiate contact under the current
    product policy.
-   Verify both conversation participants.
-   Prevent arbitrary users from reading another conversation.
-   Validate message content and attachments.
-   Persist messages in MongoDB.

If Socket.IO is used:

-   MongoDB remains the source of truth.
-   Save a message before emitting it.
-   Verify conversation membership before joining a Socket.IO room.
-   Use the conversation ID as the room identifier only after server
    authorization.
-   On reconnect, fetch missed messages through the REST API.
-   Do not assume socket delivery means the message is durably stored.

## 7.8 Paid one-on-one mentorship

Educators may offer paid sessions.

A mentorship service should define:

-   Title.
-   Description.
-   Duration.
-   Price/currency.
-   Booking mode.
-   Availability.
-   Educator timezone.
-   Active/inactive status.
-   Optional private meeting instructions.

The initial version does not need to build native video calls. An
educator-provided meeting link can be stored and shared only with
confirmed booking participants.

### Request-based flow

``` text
Learner selects service and preferred time
                 |
                 v
       Create requested booking
                 |
                 v
        Educator reviews request
            /           \
         Reject         Accept
           |              |
           v              v
       Rejected      Payment required
                           |
                           v
                   Payment verified
                           |
                           v
                       Confirmed
```

A request is not a confirmed appointment. The educator must accept it
and payment must be verified before it becomes confirmed.

### Instant flow

``` text
Learner selects service and available slot
                 |
                 v
       Backend checks availability
                 |
                 v
       Backend reserves slot safely
                 |
                 v
            Create payment order
                 |
                 v
            Verify payment
                 |
                 v
               Confirm
```

Handle concurrent booking attempts. Two learners must not be able to
confirm the same slot. Pending-payment reservations need an
expiry/release policy.

Store booking instants in UTC. Use the educator's timezone to display
recurring availability and convert local selections safely.

------------------------------------------------------------------------

# 8. Monetization and payment rules

Intended revenue mechanisms:

-   One-time course purchase.
-   Paid mentorship.
-   Future possibilities: subscriptions, creator subscriptions, bundles,
    or paid playlists.

A platform commission may be applied, but **the commission percentage
has not been finalized**. Do not hardcode an assumed rate as a product
decision. Keep the fee configurable.

A transaction should record:

-   Payer.
-   Educator/recipient.
-   Purchase type.
-   Referenced course or booking.
-   Gross amount.
-   Platform fee.
-   Educator amount.
-   Currency.
-   Provider order/payment identifiers.
-   Payment status.
-   Timestamps.

## 8.1 Payment verification is mandatory

A browser redirect or frontend callback saying "success" is not proof of
payment.

The safe high-level flow is:

1.  Backend validates that the user is allowed to purchase the
    referenced item.
2.  Backend calculates the price from database records. Do not trust the
    client amount.
3.  Backend creates a provider order.
4.  Frontend completes the provider checkout.
5.  Backend verifies the payment signature and/or receives a verified
    webhook.
6.  Backend updates the transaction idempotently.
7.  Backend creates the entitlement (for example, an enrollment) exactly
    once.
8.  Frontend fetches the resulting state from the backend.

Use idempotency checks. Repeated webhook delivery must not create
duplicate enrollments or bookings.

Razorpay is a proposed payment provider suitable for investigating in
the Indian context. Confirm account access, provider requirements,
current API documentation, and deployment configuration before
implementing it.

Subscriptions are future scope. They require their own rules for
renewals, expiry, cancellation, access revocation, and failed payments.

------------------------------------------------------------------------

# 9. MVP scope and delivery priorities

The end-term project guidelines require a working software application,
not a static UI. They emphasize meaningful workflows, persistence,
appropriate authentication/authorization, security, error handling, Git
history, deployment, documentation, and a short demo. The guidance
recommends implementing approximately **3--5 important workflows
properly** rather than listing many unfinished features.

## 9.1 Recommended MVP

Prioritize these workflows:

1.  Account registration/login and educator capability activation.
2.  Skill discovery, skill detail, skill suggestion, voting, and admin
    review.
3.  Educator profile and course creation with modules and lessons.
4.  Course submission, admin approval, purchase/enrollment, and
    protected learning access.
5.  Community participation with course/educator scope and configurable
    access rules.

If time permits, add direct messaging or a basic mentorship workflow. Do
not let optional functionality destabilize the core.

## 9.2 Future phases

### Phase 2

-   Paid mentorship and booking.
-   Direct real-time messaging.
-   Course reviews and ratings.
-   Notifications.
-   Better educator earnings dashboard.
-   Subscription/bundle monetization.
-   Advanced search and filters.

### Phase 3

-   Educator teams and collaborative courses.
-   Revenue sharing.
-   Native live video and collaborative whiteboards.
-   Personalized skill/course recommendations.
-   Multi-educator learning paths.
-   More advanced analytics.

## 9.3 Recommended build order

1.  Inspect/create repository and establish frontend/backend skeleton.
2.  Configure MongoDB and environment variables.
3.  Implement authentication.
4.  Implement user capabilities and educator activation.
5.  Implement skills and skill detail pages.
6.  Implement skill requests, voting, and admin review.
7.  Implement educator profile.
8.  Implement courses, modules, and lessons.
9.  Implement course submission and admin approval.
10. Implement course discovery and details.
11. Implement payment or a clearly labelled test-payment path.
12. Implement enrollment and protected course player.
13. Implement course and educator communities.
14. Add messaging or mentorship only if the core is stable.
15. Test error cases and authorization.
16. Deploy, write README, record demo, and verify submission links.

------------------------------------------------------------------------

# 10. Technology and architecture

No mandatory stack is specified by the academic project guidelines. This
is the recommended stack based on the product and the developer's
existing MERN experience.

  Layer              Recommended choice                      Purpose
  ------------------ --------------------------------------- ----------------------------------
  Frontend           React + Vite                            Web application
  Styling            Tailwind CSS                            UI styling
  Routing            React Router                            Page navigation
  Server state       TanStack Query (optional)               API cache and mutations
  Backend            Node.js + Express                       REST API and business logic
  Database           MongoDB + Mongoose                      Persistent data
  Authentication     JWT-based session approach + bcrypt     Identity
  Real-time          Socket.IO, only if messaging is built   Live events
  Video              Cloudinary or Mux                       External media storage/streaming
  Payments           Razorpay (proposed)                     Payment processing
  Frontend hosting   Vercel or equivalent                    Web deployment
  Backend hosting    Render or equivalent                    API deployment
  Version control    Git + GitHub                            Source history

Do not add technologies merely because they sound impressive. A
**modular monolith** is the recommended backend architecture.

## 10.1 Why a modular monolith

-   One backend is simpler to develop and deploy.
-   Authentication and authorization are centralized.
-   Domain boundaries keep code organized.
-   There is less infrastructure overhead.
-   Modules can be extracted later if scale genuinely requires it.

Do not begin with microservices, Kubernetes, distributed queues, or
complex infrastructure for the academic MVP.

## 10.2 High-level architecture

``` text
┌───────────────────────────────────────────────┐
│                  React + Vite                 │
│ Public / Learner / Educator / Admin screens   │
└──────────────────────┬────────────────────────┘
                       │ HTTPS REST
                       │ Socket.IO if enabled
┌──────────────────────▼────────────────────────┐
│                 Express API                   │
│ Routes → Middleware → Controllers → Services  │
└──────────────┬───────────────────┬────────────┘
               │                   │
┌──────────────▼──────────┐  ┌─────▼──────────────┐
│ MongoDB + Mongoose      │  │ External services │
│ Users, courses, etc.    │  │ Media / payments  │
└─────────────────────────┘  └────────────────────┘
```

------------------------------------------------------------------------

# 11. Mandatory backend folder organization

**Important explicit requirement:** Controllers, models, middlewares,
and APIs must be in separate folders. Do not put a model, controller,
middleware, and route file together inside every feature folder.

Use a structure like this:

``` text
backend/
├── src/
│   ├── apis/
│   │   ├── auth.api.js
│   │   ├── user.api.js
│   │   ├── educator.api.js
│   │   ├── skill.api.js
│   │   ├── skillRequest.api.js
│   │   ├── course.api.js
│   │   ├── module.api.js
│   │   ├── lesson.api.js
│   │   ├── enrollment.api.js
│   │   ├── community.api.js
│   │   ├── discussion.api.js
│   │   ├── messaging.api.js
│   │   ├── mentorship.api.js
│   │   ├── booking.api.js
│   │   ├── payment.api.js
│   │   └── admin.api.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── educator.controller.js
│   │   ├── skill.controller.js
│   │   ├── skillRequest.controller.js
│   │   ├── course.controller.js
│   │   ├── module.controller.js
│   │   ├── lesson.controller.js
│   │   ├── enrollment.controller.js
│   │   ├── community.controller.js
│   │   ├── discussion.controller.js
│   │   ├── messaging.controller.js
│   │   ├── mentorship.controller.js
│   │   ├── booking.controller.js
│   │   ├── payment.controller.js
│   │   └── admin.controller.js
│   │
│   ├── models/
│   │   ├── user.model.js
│   │   ├── educatorProfile.model.js
│   │   ├── skill.model.js
│   │   ├── skillRequest.model.js
│   │   ├── skillVote.model.js
│   │   ├── course.model.js
│   │   ├── courseModule.model.js
│   │   ├── lesson.model.js
│   │   ├── enrollment.model.js
│   │   ├── community.model.js
│   │   ├── discussion.model.js
│   │   ├── answer.model.js
│   │   ├── conversation.model.js
│   │   ├── message.model.js
│   │   ├── mentorshipService.model.js
│   │   ├── booking.model.js
│   │   └── transaction.model.js
│   │
│   ├── middlewares/
│   │   ├── authenticate.middleware.js
│   │   ├── authorize.middleware.js
│   │   ├── validate.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   ├── notFound.middleware.js
│   │   └── rateLimit.middleware.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── educator.service.js
│   │   ├── skill.service.js
│   │   ├── skillRequest.service.js
│   │   ├── course.service.js
│   │   ├── enrollment.service.js
│   │   ├── community.service.js
│   │   ├── discussion.service.js
│   │   ├── messaging.service.js
│   │   ├── mentorship.service.js
│   │   ├── booking.service.js
│   │   └── payment.service.js
│   │
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── skill.validator.js
│   │   ├── course.validator.js
│   │   └── ...
│   │
│   ├── config/
│   │   ├── db.js
│   │   ├── env.js
│   │   ├── cloudinary.js
│   │   └── razorpay.js
│   │
│   ├── sockets/
│   │   ├── index.js
│   │   └── messaging.socket.js
│   │
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── asyncHandler.js
│   │   ├── ApiResponse.js
│   │   └── ...
│   │
│   ├── app.js
│   └── server.js
│
├── .env.example
├── .gitignore
└── package.json
```

The four required top-level folders have distinct responsibilities:

  -----------------------------------------------------------------------
  Folder                              Responsibility
  ----------------------------------- -----------------------------------
  `apis/`                             Express routers and endpoint
                                      definitions. Mount paths and attach
                                      middleware/controllers.

  `controllers/`                      HTTP request/response handling.
                                      Read validated input, call
                                      services, return responses.

  `models/`                           Mongoose schemas, indexes, and
                                      model definitions.

  `middlewares/`                      Authentication, authorization,
                                      validation integration, rate
                                      limiting, error handling.
  -----------------------------------------------------------------------

`services/` is strongly recommended for business logic. This avoids
putting complex rules inside controllers.

The folder names `apis` and `controllers` are intentional project
conventions. Do not rename `apis` to `routes` unless the product owner
explicitly changes this requirement.

## 11.1 Request handling pattern

``` text
Request
  ↓
apis/course.api.js
  ↓
authenticate.middleware.js
  ↓
authorize.middleware.js (if needed)
  ↓
validate.middleware.js
  ↓
controllers/course.controller.js
  ↓
services/course.service.js
  ↓
models/course.model.js
  ↓
Database
```

### API file example

``` js
// src/apis/course.api.js
import { Router } from "express";
import {
  createCourse,
  getCourse,
  updateCourse,
  submitCourse
} from "../controllers/course.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";

const router = Router();

router.get("/:courseId", getCourse);
router.post("/", authenticate, createCourse);
router.patch("/:courseId", authenticate, updateCourse);
router.post("/:courseId/submit", authenticate, submitCourse);

export default router;
```

This is illustrative. Add authorization, validation, and rate limiting
as appropriate.

### Controller example

``` js
// src/controllers/course.controller.js
import * as courseService from "../services/course.service.js";

export async function createCourse(req, res, next) {
  try {
    const course = await courseService.createDraft({
      userId: req.user.id,
      input: req.body
    });

    return res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
}
```

Controller responsibilities:

-   Read authenticated identity from middleware-populated `req.user`.
-   Read validated request data.
-   Call the appropriate service.
-   Set the correct HTTP status.
-   Return a consistent response.
-   Pass errors to centralized error handling.

Controllers should not contain long database workflows or duplicate
business rules.

### Service example

``` js
// src/services/course.service.js
import Course from "../models/course.model.js";
import Skill from "../models/skill.model.js";

export async function createDraft({ userId, input }) {
  // Check educator capability/profile.
  // Confirm the selected skill exists and is approved.
  // Validate allowed fields and business constraints.
  // Create a draft owned by the authenticated educator.
  // Never accept educatorId or published status blindly from the client.

  const skill = await Skill.findOne({
    _id: input.skillId,
    status: "approved"
  });

  if (!skill) {
    const error = new Error("Selected skill is unavailable");
    error.statusCode = 400;
    throw error;
  }

  return Course.create({
    title: input.title,
    description: input.description,
    skillId: skill._id,
    educatorId: userId,
    price: input.price,
    currency: "INR",
    status: "draft"
  });
}
```

This example is a starting pattern, not a complete production service.
In the actual implementation, confirm that the user has an educator
profile, normalize/validate input, and use the project's common error
class.

### Model example

``` js
// src/models/course.model.js
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    educatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: true,
      index: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "INR"
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "published", "rejected", "suspended"],
      default: "draft",
      index: true
    },
    publishedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
```

### Middleware example

``` js
// src/middlewares/authorize.middleware.js
export function requireCapability(capability) {
  return (req, res, next) => {
    if (!req.user?.capabilities?.includes(capability)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action"
      });
    }

    next();
  };
}
```

Resource ownership is more specific than a capability. A user with
educator capability must still not be able to edit another educator's
course. Check ownership in the service or a dedicated
resource-authorization middleware.

------------------------------------------------------------------------

# 12. Frontend architecture and pages

Use React Router and organize the experience into layouts.

## 12.1 Layouts

-   `PublicLayout`
-   `LearnerLayout`
-   `EducatorLayout`
-   `AdminLayout`

A user can switch between learner and educator experiences without
changing accounts.

## 12.2 Public pages

-   Home.
-   Explore Skills.
-   Skill Details.
-   Course Details.
-   Educator Profile.
-   Login.
-   Registration.

## 12.3 Learner pages

-   Learner Dashboard.
-   My Courses.
-   Course Learning Player.
-   Community/Discussions.
-   Messages (if implemented).
-   Mentorship Bookings (if implemented).
-   Account Settings.

## 12.4 Educator pages

-   Educator Dashboard.
-   Profile Editor.
-   My Courses.
-   Course Builder.
-   Module/Lesson Manager.
-   Media Manager.
-   Community Settings.
-   Messages (if implemented).
-   Mentorship Services (if implemented).
-   Earnings (if implemented).

## 12.5 Admin pages

-   Admin Dashboard.
-   Skill Request Review.
-   Course Review Queue.
-   Reports/Moderation.

## 12.6 Frontend structure example

``` text
frontend/src/
├── assets/
├── components/
│   ├── common/
│   ├── navigation/
│   ├── skills/
│   ├── courses/
│   ├── communities/
│   └── forms/
├── layouts/
├── pages/
│   ├── public/
│   ├── learner/
│   ├── educator/
│   └── admin/
├── hooks/
├── context/
├── services/
│   └── api.js
├── utils/
├── App.jsx
└── main.jsx
```

Keep reusable UI components separate from page-level orchestration. Keep
API calls in a frontend service layer rather than scattering raw `fetch`
calls through every component.

## 12.7 UX direction

The visual direction is a modern creator marketplace, not a generic
university LMS.

Possible direction:

-   Deep navy or charcoal foundation.
-   Electric blue/violet accent.
-   Strong typography and clear hierarchy.
-   Prominent skill search.
-   Skill category discovery.
-   Rich course thumbnails.
-   Clear educator identity and expertise.
-   Course cards that show meaningful metadata.
-   Distinct learner and educator workspaces.

Every important page should handle:

-   Loading state.
-   Empty state.
-   Success feedback.
-   Validation errors.
-   API/network errors.
-   Unauthorized/forbidden state.
-   Missing or unavailable resources.

Do not use placeholder buttons for core actions.

------------------------------------------------------------------------

# 13. Suggested API catalogue

Use `/api` as the base prefix. These endpoints are a starting design;
align names and payloads consistently during implementation.

## 13.1 Authentication

  Method   Endpoint               Purpose
  -------- ---------------------- --------------------------
  POST     `/api/auth/register`   Create account
  POST     `/api/auth/login`      Log in
  POST     `/api/auth/logout`     Log out
  GET      `/api/auth/me`         Get current user
  POST     `/api/auth/refresh`    Refresh session, if used

## 13.2 Educators

  ---------------------------------------------------------------------------
  Method                  Endpoint                    Purpose
  ----------------------- --------------------------- -----------------------
  POST                    `/api/educators/activate`   Activate educator
                                                      capability/create
                                                      profile

  GET                     `/api/educators/:id`        Public educator profile

  PATCH                   `/api/educators/me`         Update own profile

  PATCH                   `/api/educators/settings`   Update interaction
                                                      settings
  ---------------------------------------------------------------------------

## 13.3 Skills

  --------------------------------------------------------------------------------
  Method                  Endpoint                         Purpose
  ----------------------- -------------------------------- -----------------------
  GET                     `/api/skills`                    List/search approved
                                                           skills

  GET                     `/api/skills/:id`                Skill details

  GET                     `/api/skills/:id/courses`        Published courses for a
                                                           skill

  POST                    `/api/skill-requests`            Suggest a skill

  POST                    `/api/skill-requests/:id/vote`   Vote for a suggestion

  DELETE                  `/api/skill-requests/:id/vote`   Remove own vote, if
                                                           supported
  --------------------------------------------------------------------------------

## 13.4 Courses and structure

  Method   Endpoint                     Purpose
  -------- ---------------------------- --------------------------
  GET      `/api/courses`               Browse published courses
  GET      `/api/courses/:id`           Public course details
  POST     `/api/courses`               Create draft
  PATCH    `/api/courses/:id`           Edit own course
  POST     `/api/courses/:id/submit`    Submit for moderation
  POST     `/api/courses/:id/modules`   Add module
  PATCH    `/api/modules/:id`           Edit module
  POST     `/api/modules/:id/lessons`   Add lesson
  PATCH    `/api/lessons/:id`           Edit lesson

## 13.5 Learning and enrollment

  -------------------------------------------------------------------------------------
  Method                  Endpoint                              Purpose
  ----------------------- ------------------------------------- -----------------------
  GET                     `/api/enrollments/my`                 List current user's
                                                                enrollments

  GET                     `/api/enrollments/:id`                Enrollment and progress

  PATCH                   `/api/enrollments/:id/progress`       Update progress

  GET                     `/api/courses/:id/learning-content`   Protected learning
                                                                content
  -------------------------------------------------------------------------------------

## 13.6 Communities

  ------------------------------------------------------------------------------------
  Method                  Endpoint                             Purpose
  ----------------------- ------------------------------------ -----------------------
  GET                     `/api/communities/:id`               Read community after
                                                               access check

  PATCH                   `/api/communities/:id/settings`      Update own community
                                                               settings

  GET                     `/api/communities/:id/discussions`   List discussions after
                                                               access check

  POST                    `/api/communities/:id/discussions`   Create discussion

  GET                     `/api/discussions/:id`               Get discussion

  POST                    `/api/discussions/:id/answers`       Add answer

  POST                    `/api/discussions/:id/vote`          Vote

  PATCH                   `/api/discussions/:id/resolve`       Resolve/accept answer

  POST                    `/api/discussions/:id/report`        Report content, if
                                                               implemented
  ------------------------------------------------------------------------------------

## 13.7 Messaging --- optional

  -----------------------------------------------------------------------------------
  Method                  Endpoint                            Purpose
  ----------------------- ----------------------------------- -----------------------
  GET                     `/api/conversations`                List own conversations

  POST                    `/api/conversations`                Start/retrieve eligible
                                                              conversation

  GET                     `/api/conversations/:id/messages`   Fetch history

  POST                    `/api/conversations/:id/messages`   Persist message through
                                                              REST if desired
  -----------------------------------------------------------------------------------

## 13.8 Mentorship --- optional

  Method   Endpoint                               Purpose
  -------- -------------------------------------- --------------------------
  POST     `/api/mentorship/services`             Create service
  PATCH    `/api/mentorship/services/:id`         Update own service
  GET      `/api/mentorship/services/:id/slots`   List available slots
  POST     `/api/bookings/request`                Request a session
  POST     `/api/bookings/instant`                Book an instant slot
  PATCH    `/api/bookings/:id/accept`             Educator accepts request
  PATCH    `/api/bookings/:id/reject`             Educator rejects request
  GET      `/api/bookings/my`                     List own bookings

## 13.9 Payments

  Method   Endpoint                  Purpose
  -------- ------------------------- --------------------------
  POST     `/api/payments/order`     Create payment order
  POST     `/api/payments/verify`    Verify payment result
  POST     `/api/payments/webhook`   Receive provider webhook

## 13.10 Admin

  Method   Endpoint                          Purpose
  -------- --------------------------------- ------------------------
  GET      `/api/admin/skill-requests`       Review queue
  PATCH    `/api/admin/skill-requests/:id`   Approve/reject
  GET      `/api/admin/courses/pending`      Pending courses
  PATCH    `/api/admin/courses/:id`          Approve/reject/suspend
  GET      `/api/admin/reports`              Review reports

For every endpoint, define request validation, authentication
requirement, capability/role requirement, resource ownership, success
response, and error response.

------------------------------------------------------------------------

# 14. Authorization model

Authorization has multiple layers. Do not treat "logged in" as
equivalent to "allowed".

## Layer 1: Authentication

Is there a valid authenticated user?

## Layer 2: Capability or role

Does the user have the capability or administrative role required?

Examples:

-   Course creation requires educator capability.
-   Admin moderation requires admin role.
-   Course purchase requires an authenticated learner/user.

## Layer 3: Resource ownership and entitlement

Is the user allowed to access this specific resource?

Examples:

-   Educator A cannot edit Educator B's course.
-   A learner cannot access paid lessons without an active enrollment.
-   A conversation can only be read by its participants.
-   A course community may require enrollment.
-   Only the owner/authorized educator can change community settings.
-   Only an authorized admin can approve a course.

Illustrative route:

``` js
router.post(
  "/",
  authenticate,
  requireCapability("educator"),
  validate(createCourseSchema),
  createCourse
);
```

This still needs a service-level check that the selected skill is
approved and that the course is created for the authenticated educator.

## 14.1 Important security invariants

-   Never trust `userId`, `educatorId`, `role`, `price`, or payment
    status supplied by the client when the server can derive them.
-   Never accept `status: "published"` from a normal educator update
    request.
-   Never expose paid media references without entitlement checks.
-   Never let a user change their own role to admin.
-   Never let a user read another user's messages by guessing an ID.
-   Never let a learner modify another learner's enrollment progress.
-   Never let a client claim that an answer was written by an educator.
-   Never let a user vote repeatedly on one skill request.
-   Never let two bookings confirm the same slot.
-   Enforce community access rules in backend services.

------------------------------------------------------------------------

# 15. Media and video upload direction

Videos should be stored in a dedicated media provider, not directly in
MongoDB and preferably not streamed through the Express server.

A typical flow:

``` text
Educator requests upload authorization
              |
              v
Backend checks course ownership
              |
              v
Backend creates signed upload authorization
              |
              v
Browser uploads directly to media provider
              |
              v
Provider returns asset identifier
              |
              v
Backend validates/associates asset with lesson
              |
              v
Lesson stores provider asset metadata
```

Requirements:

-   Use signed or authenticated uploads.
-   Validate educator ownership of the course/lesson.
-   Restrict file types and size where possible.
-   Do not expose provider secrets in frontend code.
-   Store provider asset ID and relevant metadata.
-   Protect paid playback URLs where the provider supports it.
-   Handle upload failure and orphaned assets.
-   Do not assume an upload succeeded merely because the browser
    initiated it.

Cloudinary or Mux are possible choices. Choose one after checking
current pricing, free-tier constraints, playback protection, and
integration requirements.

------------------------------------------------------------------------

# 16. Messaging and Socket.IO direction

If messaging is implemented, use Socket.IO for delivery and MongoDB for
persistence.

Possible events:

  ------------------------------------------------------------------------
  Event                    Direction               Purpose
  ------------------------ ----------------------- -----------------------
  `conversation:join`      Client → server         Request room membership

  `message:send`           Client → server         Send message

  `message:new`            Server → participants   Deliver persisted
                                                   message

  `message:read`           Client → server         Mark messages read

  `conversation:updated`   Server → participant    Update last-message
                                                   preview
  ------------------------------------------------------------------------

Rules:

-   Authenticate the socket connection.
-   Verify conversation membership before joining a room.
-   Validate message length and content.
-   Persist before emitting.
-   Do not broadcast private messages to all connected clients.
-   Fetch message history from REST after reconnect.
-   Add rate limits to prevent spam.
-   Keep socket handlers thin and reuse service-layer rules.

------------------------------------------------------------------------

# 17. Error handling and reliability

Handle failures relevant to the product rather than only successful
paths.

Examples:

  -----------------------------------------------------------------------
  Scenario                            Expected behaviour
  ----------------------------------- -----------------------------------
  Invalid registration data           Field-level or clear validation
                                      error

  Duplicate email                     Conflict response and useful
                                      message

  Expired/invalid token               Authentication error; clear session
                                      if appropriate

  User lacks educator capability      Forbidden response

  Educator edits another educator's   Forbidden/not found according to
  course                              disclosure policy

  Skill does not exist or is          Validation/business-rule error
  unapproved                          

  Duplicate skill suggestion          Explain that a similar
                                      skill/request exists

  Duplicate vote                      Prevent duplicate; return
                                      consistent result

  Course is still pending             Do not show publicly

  Course purchase fails               Do not create enrollment

  Webhook arrives twice               Process idempotently

  Learner guesses paid lesson URL     Deny without active entitlement

  Community disabled                  Return unavailable/forbidden
                                      response

  User is not enrolled in restricted  Deny access
  community                           

  Messaging disabled by educator      Do not create new conversation

  Upload fails                        Preserve draft and show retry
                                      option

  Booking slot was taken concurrently Reject reservation and refresh
                                      availability

  Payment remains pending             Expire reservation according to
                                      policy

  Database/provider failure           Return safe error and log details
                                      server-side
  -----------------------------------------------------------------------

Use a centralized error handler. Do not return raw stack traces or
secrets to clients.

------------------------------------------------------------------------

# 18. Security baseline

-   Hash passwords with bcrypt or a suitable password-hashing algorithm.
-   Use secure session/token handling. Prefer httpOnly, secure, sameSite
    cookies for browser refresh/session tokens where the chosen
    architecture supports them.
-   Keep secrets in environment variables.
-   Commit `.env.example`, never real `.env` credentials.
-   Validate request bodies, params, and query strings.
-   Use allowlisted update fields to prevent mass assignment.
-   Enforce authorization in backend code.
-   Use rate limiting for authentication, voting, messaging, and other
    abuse-prone endpoints.
-   Configure CORS to the deployed frontend origin(s).
-   Use HTTPS in deployment.
-   Avoid exposing internal errors.
-   Verify payment signatures and webhooks on the server.
-   Do not trust client-supplied prices or payment statuses.
-   Protect media and private meeting links.
-   Avoid logging passwords, tokens, payment secrets, or private message
    contents unnecessarily.
-   Keep dependencies updated and remove unused packages.

------------------------------------------------------------------------

# 19. Environment variables

Use `.env.example` with placeholder values. Actual values belong only in
local/deployment secrets.

Possible backend variables:

``` dotenv
NODE_ENV=development
PORT=5000
MONGODB_URI=
CLIENT_URL=http://localhost:5173

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

Only include variables for services actually integrated. Do not create
empty configuration for deferred services merely to make the project
appear larger.

Possible frontend variable:

``` dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

Never place private secrets in variables prefixed with `VITE_`; frontend
environment variables are exposed to the browser bundle.

------------------------------------------------------------------------

# 20. Database indexes and consistency

Add indexes according to real query patterns.

Examples:

-   `User.email`: unique.
-   `EducatorProfile.userId`: unique.
-   `Skill.slug`: unique.
-   `Skill.status`: indexed.
-   `Course.skillId`: indexed.
-   `Course.educatorId`: indexed.
-   `Course.status`: indexed.
-   `SkillVote`: unique compound `{ skillRequestId, userId }`.
-   `Enrollment`: enforce the chosen duplicate-enrollment policy.
-   `Community.courseId` / `Community.educatorId`: indexed as
    appropriate.
-   `Discussion.communityId`: indexed with `createdAt`.
-   `Message.conversationId`: indexed with `createdAt`.
-   `Booking`: indexes supporting educator/time/status lookups.
-   `Transaction.providerOrderId`: unique where provider semantics
    allow.

For multi-document operations such as payment fulfillment, use
transactions where supported or design idempotent state transitions. Do
not assume every MongoDB deployment has transaction support without
checking the deployment topology.

------------------------------------------------------------------------

# 21. Testing strategy

Testing should focus on business rules and complete workflows.

## 21.1 Critical authorization tests

-   Normal user cannot access admin routes.
-   User without educator capability cannot create a course.
-   Educator cannot edit another educator's course.
-   Educator cannot publish a course directly.
-   Unenrolled learner cannot access paid lessons.
-   Non-participant cannot read a conversation.
-   User cannot access an enrolled-only community without enrollment.
-   User cannot change another educator's community settings.
-   Learner cannot forge educator-response status.
-   Client cannot change transaction status to successful.

## 21.2 Critical workflow tests

### Workflow A --- Skill demand

-   Submit a skill request.
-   Prevent duplicate/near-duplicate requests according to policy.
-   Vote once.
-   Prevent duplicate voting.
-   Admin approves.
-   Approved skill appears in public discovery.

### Workflow B --- Educator course publication

-   User activates educator capability.
-   Educator creates a draft.
-   Educator adds modules and lessons.
-   Educator submits.
-   Admin approves.
-   Course appears publicly.

### Workflow C --- Purchase and learning

-   Learner starts purchase.
-   Server calculates price.
-   Payment is verified.
-   Enrollment is created once.
-   Learner accesses course.
-   Progress persists after refresh.
-   Another learner without enrollment is denied.

### Workflow D --- Community

-   Course and educator communities are distinct.
-   Access settings are enforced.
-   Eligible learner creates a question.
-   Educator responds.
-   Question can be resolved according to policy.

### Workflow E --- Mentorship, only if implemented

-   Request-based booking waits for educator acceptance.
-   Instant booking checks/reserves a slot.
-   Concurrent booking cannot double-confirm.
-   Payment verification is required for confirmation.

------------------------------------------------------------------------

# 22. Git, deployment, documentation, and demo

The academic project guidelines require meaningful Git history, a usable
deployment/build, documentation, and a demo. Do not make one enormous
final commit.

Use descriptive commits such as:

``` text
chore: initialize frontend and backend
feat(auth): add registration and login
feat(skills): add skill discovery endpoints
feat(skills): add skill suggestion voting
feat(educators): add educator activation
feat(courses): add course draft creation
feat(courses): add admin publication workflow
feat(learning): add enrollment and progress tracking
feat(communities): enforce community access settings
fix(auth): reject unauthorized course updates
docs: add setup and architecture documentation
```

The README should include:

-   Project name.
-   Problem statement.
-   Target users.
-   Solution overview.
-   Key implemented features.
-   Tech stack.
-   Architecture.
-   Folder structure.
-   Local setup.
-   Environment variables.
-   Deployment links/instructions.
-   Demo video.
-   Known limitations/deferred features.

The project guidelines recommend a short 3--5 minute demo. Show the
problem, users, major workflows, interesting functionality, and the
working application. Do not spend most of the demo reading source code.

Before submission, verify repository, deployment, and demo links in a
private/incognito browser session. Complete the official submission form
specified in the uploaded project guidelines.

------------------------------------------------------------------------

# 23. UI and route map

A possible route structure:

``` text
/
├── /explore
├── /skills/:slug
├── /courses/:courseId
├── /educators/:educatorId
├── /login
├── /register
│
├── /app
│   ├── /dashboard
│   ├── /my-courses
│   ├── /learn/:courseId
│   ├── /communities/:communityId
│   ├── /messages                 (if implemented)
│   └── /bookings                 (if implemented)
│
├── /educator
│   ├── /dashboard
│   ├── /profile
│   ├── /courses
│   ├── /courses/new
│   ├── /courses/:courseId/edit
│   ├── /communities
│   ├── /mentorship               (if implemented)
│   └── /earnings                 (if implemented)
│
└── /admin
    ├── /dashboard
    ├── /skill-requests
    ├── /courses
    └── /reports
```

This is a conceptual route map. Adapt it to the final UI and
authentication strategy. Route guards improve UX but backend
authorization remains mandatory.

------------------------------------------------------------------------

# 24. Business rules that must remain consistent

This section is a compact list of invariants that an AI coding assistant
should repeatedly check.

1.  A user may be both learner and educator.
2.  Educator activation is available to any registered user.
3.  Educator activation does not publish courses.
4.  Courses must be approved by an admin before public publication.
5.  Public skill discovery only shows approved skills.
6.  Public course discovery only shows published courses.
7.  A course is associated with an approved skill.
8.  Course ownership is checked on every educator mutation.
9.  Paid course access requires a valid active entitlement/enrollment.
10. Course community and educator community are distinct
    entities/scopes.
11. Each community has independently enforced access settings.
12. Educator-wide community access does not grant course-community
    access.
13. Educator messaging can be disabled by the educator.
14. Mentorship booking mode is configured per service.
15. Request-based bookings require educator acceptance before
    payment/confirmation.
16. Instant bookings must reserve a slot safely before confirmation.
17. A booking is confirmed only after required payment verification.
18. Payment success is established by server-side verification, not a
    frontend claim.
19. Payment fulfillment must be idempotent.
20. Teams are not in the initial implementation.
21. Controllers, models, middlewares, and APIs live in separate
    top-level backend folders.
22. Business logic belongs in services where practical.
23. MongoDB stores application data; video files live in a media
    provider.
24. Socket.IO is optional and, if used, is not the message database.
25. Do not claim deferred features are implemented.

------------------------------------------------------------------------

# 25. Open implementation details (not settled product decisions)

These details are deliberately left for the developer/AI to choose based
on the actual implementation and time available. Do not mistake them for
finalized product decisions.

-   Exact visual design, typography, and component library.
-   Exact payment provider and account configuration.
-   Exact video provider and plan.
-   Whether JWTs use cookies, refresh-token rotation, or another secure
    session arrangement.
-   Whether course prices can be zero.
-   Exact platform commission percentage.
-   Exact review eligibility and moderation policy.
-   Exact skill category taxonomy.
-   Exact definition of trending/popular.
-   Exact message initiation eligibility beyond the educator's messaging
    toggle.
-   Exact policy for learner-created posts in `educator_responses_only`
    communities.
-   Exact booking slot recurrence representation and pending-payment
    timeout.
-   Whether a booking can be rescheduled/refunded in the initial
    version.
-   Whether skill votes can be removed.
-   Whether a learner can re-enroll after a refund.
-   Whether preview lessons require login.
-   Whether media playback uses signed URLs.
-   Whether notifications are in-app, email, or deferred.
-   Whether the first deployment uses real payments or a clearly
    labelled test mode.

When choosing among these, document the choice in `docs/decisions.md` or
update this handoff document.

------------------------------------------------------------------------

# 26. Suggested first implementation tasks

A coding assistant should begin by inspecting the repository and then
work incrementally.

## Task 1 --- Establish project skeleton

-   Create or inspect `frontend/` and `backend/`.
-   Ensure the backend contains separate `apis/`, `controllers/`,
    `models/`, and `middlewares/` folders.
-   Add `services/`, `config/`, `utils/`, and `validators/` as
    appropriate.
-   Configure scripts and environment loading.
-   Add `.gitignore` and `.env.example`.

## Task 2 --- Database and health check

-   Connect Mongoose.
-   Fail clearly if required configuration is missing.
-   Add a simple health endpoint.
-   Handle connection errors.
-   Do not start listening before required initialization succeeds.

## Task 3 --- Authentication

-   Define User model.
-   Implement registration and login.
-   Hash passwords.
-   Implement authenticated current-user endpoint.
-   Add authentication middleware.
-   Ensure secrets/password hashes are never returned.
-   Add basic tests.

## Task 4 --- Educator activation

-   Add educator capability to the current user.
-   Create the educator profile exactly once.
-   Make activation idempotent.
-   Do not create another user account.

## Task 5 --- Skill discovery and requests

-   Add Skill and SkillRequest models.
-   Add SkillVote with a unique compound index.
-   Implement public approved-skill listing/search.
-   Implement suggestion and vote endpoints.
-   Implement admin approval/rejection.

## Task 6 --- Course authoring and moderation

-   Add Course, CourseModule, and Lesson models.
-   Implement educator-owned drafts.
-   Implement module/lesson CRUD with ownership checks.
-   Implement submission.
-   Implement admin approval/rejection.
-   Ensure public endpoints return only published courses.

## Task 7 --- Enrollment and learning

-   Add Transaction and Enrollment models.
-   Implement verified purchase flow or a clearly labelled test-payment
    flow.
-   Make fulfillment idempotent.
-   Protect paid lesson access.
-   Persist lesson progress.

## Task 8 --- Communities

-   Add Community, Discussion, and Answer models.
-   Support course and educator community types.
-   Add independent settings.
-   Implement access-check service functions.
-   Test each access mode.

## Task 9 --- Optional extensions

Only after core workflows work:

-   Messaging with Socket.IO.
-   Mentorship service and bookings.
-   Reviews.
-   Notifications.
-   Analytics.

## Task 10 --- Ship

-   Test major workflows and forbidden actions.
-   Fix loading/error/empty states.
-   Deploy frontend and backend.
-   Configure production environment variables.
-   Write README and architecture notes.
-   Record the demo.
-   Verify all submission links.

------------------------------------------------------------------------

# 27. Final product definition

Skillora is a skill-first learning and creator marketplace where
learners discover skills, compare independent educators and courses,
learn through structured video content, participate in course-specific
or educator-wide communities, and optionally obtain direct or paid
one-on-one support.

Independent educators can activate educator capabilities from an
ordinary account, build a public teaching profile, create courses, and
submit them for publication approval. Educators decide whether to enable
messaging, configure community access, and offer mentorship services
with request-based or instant booking.

Learners can suggest skills that are missing from the catalogue and vote
for suggestions, allowing the platform to surface demand and help
educators identify what to teach.

The initial architecture is a MERN modular monolith. The backend must
keep APIs, controllers, models, and middlewares in separate top-level
folders, with services holding reusable business rules. The initial
implementation should focus on a small number of complete workflows,
reliable persistence, secure authorization, clear error handling,
deployment, and documentation.

**The central promise of Skillora: start with the skill you want to
learn, then find the people and learning experience that help you
acquire it.**
