# X Platform — Progress Tracker
**Last updated:** 2026-03-10
**Version:** Phase 1 complete (pending live verification)

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

## 🔧 Pending — Known Issues to Fix Next Session

- [ ] **Become platform_admin:** After signing up, go to Supabase → Table Editor → profiles → change your `role` to `platform_admin`
- [ ] **Verify end-to-end flow works on Zeabur** — signup → email confirm → dashboard
- [ ] **`student_instructor_assignments` UNIQUE constraint** — `org_id` is nullable which may cause issues with the upsert conflict clause. May need schema fix.
- [ ] **Sessions RLS INSERT policy missing** — students/teachers can't create sessions via API without an INSERT policy. Add:
  ```sql
  CREATE POLICY "sessions_insert" ON sessions FOR INSERT WITH CHECK (auth.uid() = instructor_id);
  CREATE POLICY "session_participants_insert" ON session_participants FOR INSERT WITH CHECK (true);
  CREATE POLICY "availability_insert_fix" ON availability FOR INSERT WITH CHECK (true);
  ```
- [ ] **Admin analytics** — `subjectStats` query uses `.not('subject_id', 'is', null)` but RLS on sessions only allows own sessions — admin needs elevated read access. Add:
  ```sql
  CREATE POLICY "sessions_select_admin" ON sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('org_admin', 'platform_admin'))
  );
  ```

---

## 📋 Phase 2 — Next Up (Months 4–5)

> Start here next session after verifying Phase 1 works end-to-end.

### Scheduling & Integrations
- [ ] **SCH-04** Google Calendar sync (OAuth2 + Calendar API)
- [ ] **SCH-05** Outlook calendar sync (Microsoft Graph API)
- [ ] **SCH-06** Conflict detection across orgs
- [ ] **SCH-07** Timezone-aware UI (date-fns-tz)
- [ ] **BKG-02** Group session creation (instructor/admin)
- [ ] **BKG-03** Group session join (student, capacity enforced)
- [ ] **BKG-05** Waitlist for full group sessions

### Notifications
- [ ] **NTF-01** Bull queue setup (or Supabase Edge Functions)
- [ ] **NTF-02** Email notifications — booking confirmation, cancellation, reminder (SendGrid or Resend)
- [ ] **NTF-03** In-app notification bell (Supabase Realtime)
- [ ] **NTF-04** SMS via Twilio
- [ ] **NTF-05** Line Messaging API
- [ ] **NTF-06** Calendar invites (.ics on booking confirmation)
- [ ] **NTF-08** Reminder scheduler (24h + 1h before session)

---

## 📋 Phase 3 — In-Session Features (Months 6–7)

- [ ] Video conferencing link (Zoom / Google Meet / Teams)
- [ ] In-platform real-time chat per session (Supabase Realtime)
- [ ] File upload/download (Supabase Storage)
- [ ] Session recording storage + playback
- [ ] Whiteboard integration (Excalidraw embed)
- [ ] Post-session notes (teacher) ✅ already done

---

## 📋 Phase 4 — Analytics (Months 8–9)

- [ ] Org-level analytics dashboard (extend existing admin analytics)
- [ ] Instructor performance reports
- [ ] Student progress tracking
- [ ] CSV / Excel export
- [ ] Pluggable report framework

---

## 📋 Phase 5 — Hardening (Months 10–12)

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
