# X Platform — Progress Tracker
**Last updated:** 2026-03-12
**Version:** Phase 1 complete — Gap Analysis v1.0 added, pre-build blockers identified

---

## 🚀 Deployment

| Service | Platform | URL / Reference |
|---------|----------|-----------------|
| Frontend + API | Zeabur | https://learning-online-booking.zeabur.app |
| Database + Auth | Supabase | Project ref: `ivhsfvqyuykmetjmppgf` (Tokyo) |
| Source code | GitHub | https://github.com/James-C-K/online-class-booking |

### Zeabur Environment Variables (already set)
```
NEXT_PUBLIC_SUPABASE_URL=https://ivhsfvqyuykmetjmppgf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Supabase Settings
- **Auth → URL Configuration → Site URL:** `https://learning-online-booking.zeabur.app`
- **Auth → URL Configuration → Redirect URLs:**
  - `https://learning-online-booking.zeabur.app/**`
- **Auth → Email Confirmations:** ON
- **Auth callback route:** `/auth/callback` ✅

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS + custom glassmorphism dark CSS |
| Auth + DB | Supabase (PostgreSQL + Auth) |
| Language | JavaScript (no TypeScript yet) |
| i18n | Custom context — EN / 繁體中文 (ZH-TW) |
| Deployment | Zeabur (auto-deploy from GitHub `main`) |

---

## ✅ Completed — Phase 1

### Infrastructure
- [x] Next.js 16 project setup with Tailwind CSS
- [x] Supabase SSR client (browser + server)
- [x] Auth proxy (route guard) — `proxy.js`
- [x] Auth callback route — `/auth/callback`
- [x] Database schema — `supabase/schema.sql` (run in Supabase SQL Editor)
- [x] Auto-create profile trigger on signup
- [x] Row Level Security (RLS) policies
- [x] GitHub repo + Zeabur auto-deploy pipeline
- [x] Bilingual support EN / ZH-TW (language toggle, persists via localStorage)

### Auth Pages
- [x] `/login` — glassmorphism dark, bilingual
- [x] `/signup` — full name, email, password, role (student/teacher)
- [x] Email confirmation flow via Supabase

### Database Tables
- [x] `profiles` — extends auth.users (role, locale, timezone)
- [x] `organizations`
- [x] `org_memberships`
- [x] `subjects` — 10 seeded (EN + ZH-TW)
- [x] `availability`
- [x] `sessions`
- [x] `session_participants`
- [x] `student_instructor_assignments`

### Role-Based Dashboards
- [x] Role router — `/dashboard` → redirects by role
- [x] Shared glassmorphism sidebar with nav per role + language toggle + sign out

#### Student
- [x] `/dashboard/student` — stats, upcoming sessions, assigned instructors
- [x] `/dashboard/student/book` — 3-step booking wizard (instructor → date/slot → confirm)
- [x] `/dashboard/student/sessions` — filterable session list + cancel button
- [x] `/dashboard/student/instructors` — instructor cards with available days

#### Teacher
- [x] `/dashboard/teacher` — today's sessions, upcoming, student count, availability CTA
- [x] `/dashboard/teacher/availability` — weekly schedule grid (add/remove time slots)
- [x] `/dashboard/teacher/sessions` — session list + post-session notes
- [x] `/dashboard/teacher/students` — student cards with session counts

#### Admin (org_admin / platform_admin)
- [x] `/dashboard/admin` — platform stats + recent users
- [x] `/dashboard/admin/users` — role management + assign instructors to students
- [x] `/dashboard/admin/subjects` — add/enable/disable subjects by category
- [x] `/dashboard/admin/analytics` — bar chart (14d), top subjects, user breakdown, session status

### API Routes
- [x] `GET/POST /api/availability`
- [x] `GET/POST /api/sessions`
- [x] `PATCH /api/sessions/[id]` — cancel (with 24h policy) + notes
- [x] `GET/PATCH /api/users`
- [x] `GET/POST/DELETE /api/assignments`
- [x] `GET/POST/PATCH /api/subjects`

---

## ✅ Fixed — 2026-03-11

All Phase 1 known issues resolved. Run `supabase/fixes.sql` in Supabase SQL Editor.

### What was fixed:
- **`sessions/[id]/route.js`** — `params` must be `await`-ed in Next.js 16 (code fix)
- **`sessions` INSERT policy** — students can now book sessions
- **`sessions` UPDATE policy** — cancel and notes now work
- **`sessions` SELECT admin policy** — admin analytics now sees all sessions
- **`session_participants` INSERT policy** — participants added correctly on booking
- **`session_participants` UPDATE policy** — cancel updates participant status
- **`profiles` INSERT policy** — signup trigger can create profile rows
- **`profiles` UPDATE admin policy** — admins can change any user's role
- **`subjects` INSERT/UPDATE policies** — admin can add and toggle subjects
- **`subjects` SELECT** — admins can see inactive subjects
- **`student_instructor_assignments` INSERT/DELETE** — admin can assign/unassign
- **`student_instructor_assignments` UNIQUE constraint** — replaced broken `UNIQUE(student_id, teacher_id, org_id)` with two partial unique indexes that handle NULL `org_id` correctly
- **`is_admin()` helper function** — SECURITY DEFINER function prevents RLS recursion in admin policies
- **Orphaned profiles cleanup** — ghost profile rows without auth.users entries removed

## 🔧 Pending — Immediate (Before Next Phase)

- [ ] **Become platform_admin:** Sign up, then go to Supabase → Table Editor → profiles → change your `role` to `platform_admin`
- [ ] **Run `supabase/fixes.sql`** in Supabase SQL Editor
- [ ] **Verify end-to-end flow on Zeabur** — signup → email confirm → dashboard → book a session

---

## ⚠️ Pre-Build Blockers (MUST resolve before coding payout & booking)

> See `GAP_ANALYSIS_v1.md` for full details on all gaps. These are foundational — skipping them requires costly rewrites later.

- [ ] **I-09 / C-05** — Rate & commission versioning: add `InstructorRate` + `SubjectVersion` tables with `valid_from` timestamps
- [ ] **SB-01 / SB-09** — Subject versioning + `subject_type` field (`session_based | project_based | hybrid`)
- [ ] **U-03 / U-07** — Soft delete: add `is_archived` to `profiles` — never hard-delete users
- [ ] **BK-07** — Extend `sessions.status`: `completed`, `no_show_student`, `no_show_instructor`, `late_cancelled`, `disputed`, `resolved`
- [ ] **C-01 / C-02** — Define payout rules per session status + `PayoutPeriod` table (weekly/bi-weekly/monthly cycles)

---

## 📋 Phase 1 Add-Ons (add to MVP before Phase 2)

> From Gap Analysis — these should be in Phase 1 scope, not deferred.

- [ ] **I-08** — Availability exception dates (`AvailabilityException` table for holidays/leave)
- [ ] **I-02** — Instructor suspension workflow + `InstructorSuspension` log table
- [ ] **S-07** — Bulk student reassignment tool (when instructor leaves)
- [ ] **O-01** — Org session quota (`OrgContract` table with `session_quota`, 80%/100% warnings)
- [ ] **P-04 / O-06** — Audit logs: `AuditLog` table for platform admin + org admin actions
- [ ] **N-05** — Line account linking OAuth flow (user settings → Line Login → store Line User ID)

---

## 📋 Phase 2 — Core Operations

> Start after pre-build blockers and Phase 1 add-ons are complete.

### Booking & Scheduling
- [ ] **BK-01** — Admin-initiated booking on behalf of student
- [ ] **BK-02** — Bulk / recurring session scheduling wizard
- [ ] **BK-03** — Session rescheduling flow (not just cancel + rebook)
- [ ] **BK-04** — No-show tracking + configurable policy enforcement
- [ ] **SCH-04** Google Calendar sync (OAuth2 + Calendar API)
- [ ] **SCH-05** Outlook calendar sync (Microsoft Graph API)
- [ ] **SCH-07** Timezone-aware UI (date-fns-tz)
- [ ] **BKG-02** Group session creation (instructor/admin)
- [ ] **BKG-03** Group session join (student, capacity enforced)
- [ ] **BKG-05** Waitlist for full group sessions

### Project Submissions
- [ ] **PR-01** — Structured submission form builder per subject type
- [ ] **PR-02** — File attachment support (Supabase Storage)
- [ ] **PR-03** — Revision / resubmission flow after rejection
- [ ] **PR-06** — Submission version history (`ProjectSubmission` + `SubmissionFile` tables)
- [ ] **PR-09** — Global project status dashboard for platform admin

### Students & Orgs
- [ ] **S-01** — Student enrollment period (`StudentEnrollment` table)
- [ ] **S-04** — Student transfer between orgs workflow
- [ ] **O-02** — Org contract period with renewal alerts
- [ ] **O-03** — Org freeze / suspension mode

### Notifications
- [ ] **NTF-01** Bull queue or Supabase Edge Functions
- [ ] **NTF-02** Email notifications — booking confirmation, cancellation, reminder (Resend)
- [ ] **NTF-03** In-app notification bell (Supabase Realtime)
- [ ] **NTF-04** SMS via Twilio
- [ ] **NTF-05** Line Messaging API (depends on N-05 OAuth flow)
- [ ] **NTF-06** Calendar invites (.ics on booking confirmation)
- [ ] **NTF-08** Reminder scheduler (24h + 1h before session)
- [ ] **N-01** — Notification delivery failure dashboard + manual resend
- [ ] **N-03** — Targeted announcements (by org, role, or user group)

### Payout & Billing
- [ ] **C-03** — Payout hold for suspended instructors
- [ ] **C-08** — Instructor payout statement / payslip export
- [ ] **C-10** — Org invoice / billing statement (PDF export)

---

## 📋 Phase 3 — In-Session Features

- [ ] Video conferencing link (Zoom / Google Meet / Teams)
- [ ] In-platform real-time chat per session (Supabase Realtime)
- [ ] Session recording storage + playback
- [ ] Whiteboard integration (Excalidraw embed)
- [ ] Post-session notes (teacher) ✅ already done

---

## 📋 Phase 4 — Analytics & Reporting

- [ ] **R-03** — Financial reconciliation report (org billing vs. instructor payouts vs. platform margin)
- [ ] **R-01** — Real-time operational dashboard (live sessions, pending approvals, failed notifications)
- [ ] **R-08** — Audit trail report (filterable by user, org, date, action type)
- [ ] **S-06** — At-risk student flagging (configurable thresholds)
- [ ] **R-07** — Scheduled report emails (auto-send monthly PDF to org admin)
- [ ] Org-level analytics dashboard (extend existing admin analytics)
- [ ] Instructor performance reports
- [ ] Student progress tracking
- [ ] CSV / Excel export
- [ ] Pluggable report framework

---

## 📋 Phase 5 — Hardening

- [ ] WCAG 2.1 AA accessibility audit
- [ ] Security audit (OWASP top 10)
- [ ] Load testing
- [ ] Full ZH-TW translation review (native speaker)
- [ ] Playwright E2E test suite
- [ ] Monitoring (Sentry)
- [ ] API documentation

---

## 🗂️ Key File Locations

```
Class-Booking/
├── app/
│   ├── auth/callback/route.js       ← email confirmation handler
│   ├── api/                         ← all API routes
│   ├── dashboard/
│   │   ├── layout.js                ← shared dashboard layout + sidebar
│   │   ├── student/                 ← student pages
│   │   ├── teacher/                 ← teacher pages
│   │   └── admin/                   ← admin pages
│   ├── login/page.js
│   └── signup/page.js
├── components/
│   ├── Sidebar.js                   ← role-based nav sidebar
│   ├── StatCard.js
│   ├── DashboardHeader.js
│   └── LangToggle.js
├── lib/
│   ├── supabase.js                  ← browser client (createBrowserClient)
│   ├── supabase-server.js           ← server client (async createClient)
│   ├── LanguageContext.js           ← EN/ZH-TW context provider
│   └── i18n.js                      ← all translation strings
├── supabase/
│   └── schema.sql                   ← full DB schema (run once in Supabase SQL Editor)
├── proxy.js                         ← auth route guard (Next.js 16 middleware)
└── .env.local                       ← Supabase keys (not committed, set in Zeabur)
```

---

## 🔑 Open Questions (from xplatform_plan_1.docx)

1. Which video conferencing provider — Zoom, Meet, or Teams?
2. Cancellation window — how many hours? (currently defaulted to 24h)
3. Will instructors have a rating/review system?
4. Can students message instructors outside of sessions?
5. Is there a payment/billing module planned?
6. Are recordings stored indefinitely or purged after X days?
7. Whiteboard — Excalidraw (free) or Miro (paid)?
8. How to collect Line user IDs from users?
9. PDPA / GDPR data privacy obligations?
10. Expected scale at launch (users, orgs, sessions/day)?
