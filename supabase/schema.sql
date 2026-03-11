-- ============================================================
-- X Platform — Supabase Schema (Phase 1)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'student'
              CHECK (role IN ('platform_admin', 'org_admin', 'teacher', 'student')),
  phone       TEXT,
  locale      TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'zh')),
  timezone    TEXT NOT NULL DEFAULT 'Asia/Taipei',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                      TEXT NOT NULL,
  slug                      TEXT UNIQUE NOT NULL,
  timezone                  TEXT DEFAULT 'Asia/Taipei',
  cancellation_window_hours INT DEFAULT 24,
  is_active                 BOOLEAN DEFAULT TRUE,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORG MEMBERSHIPS
CREATE TABLE IF NOT EXISTS org_memberships (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  org_id     UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('org_admin', 'teacher', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, org_id)
);

-- 4. SUBJECTS
CREATE TABLE IF NOT EXISTS subjects (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en    TEXT NOT NULL,
  name_zh    TEXT NOT NULL,
  category   TEXT,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. STUDENT–INSTRUCTOR ASSIGNMENTS
CREATE TABLE IF NOT EXISTS student_instructor_assignments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
-- Partial unique indexes handle NULL org_id correctly
-- (standard UNIQUE constraint treats NULL != NULL in PostgreSQL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_no_org
  ON student_instructor_assignments (student_id, teacher_id)
  WHERE org_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_with_org
  ON student_instructor_assignments (student_id, teacher_id, org_id)
  WHERE org_id IS NOT NULL;

-- 6. AVAILABILITY
CREATE TABLE IF NOT EXISTS availability (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('recurring', 'manual')),
  day_of_week   INT CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun, recurring only
  date          DATE,                                       -- manual only
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type          TEXT NOT NULL DEFAULT '1on1' CHECK (type IN ('1on1', 'group')),
  subject_id    UUID REFERENCES subjects(id),
  instructor_id UUID REFERENCES profiles(id),
  org_id        UUID REFERENCES organizations(id),
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL DEFAULT 'confirmed'
                CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  meeting_url   TEXT,
  notes         TEXT,
  capacity      INT DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SESSION PARTICIPANTS
CREATE TABLE IF NOT EXISTS session_participants (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('instructor', 'student')),
  status     TEXT NOT NULL DEFAULT 'confirmed'
             CHECK (status IN ('confirmed', 'cancelled')),
  UNIQUE (session_id, user_id)
);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_instructor_assignments ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin (SECURITY DEFINER avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('org_admin', 'platform_admin')
  );
$$;

-- PROFILES
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (is_admin());

-- ORGANIZATIONS
CREATE POLICY "organizations_select" ON organizations FOR SELECT USING (true);

-- ORG MEMBERSHIPS
CREATE POLICY "org_memberships_select" ON org_memberships FOR SELECT USING (true);

-- SUBJECTS
CREATE POLICY "subjects_select" ON subjects FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "subjects_insert" ON subjects FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "subjects_update" ON subjects FOR UPDATE USING (is_admin());

-- AVAILABILITY
CREATE POLICY "availability_select" ON availability FOR SELECT USING (true);
CREATE POLICY "availability_insert" ON availability FOR INSERT WITH CHECK (auth.uid() = instructor_id);
CREATE POLICY "availability_update" ON availability FOR UPDATE USING (auth.uid() = instructor_id);
CREATE POLICY "availability_delete" ON availability FOR DELETE USING (auth.uid() = instructor_id);

-- SESSIONS
CREATE POLICY "sessions_select" ON sessions FOR SELECT USING (
  instructor_id = auth.uid()
  OR id IN (SELECT session_id FROM session_participants WHERE user_id = auth.uid())
);
CREATE POLICY "sessions_select_admin" ON sessions FOR SELECT USING (is_admin());
CREATE POLICY "sessions_insert" ON sessions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "sessions_update" ON sessions FOR UPDATE USING (
  instructor_id = auth.uid()
  OR id IN (SELECT session_id FROM session_participants WHERE user_id = auth.uid())
);

-- SESSION PARTICIPANTS
CREATE POLICY "session_participants_select" ON session_participants FOR SELECT USING (
  user_id = auth.uid()
  OR session_id IN (SELECT id FROM sessions WHERE instructor_id = auth.uid())
);
CREATE POLICY "session_participants_insert" ON session_participants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "session_participants_update" ON session_participants FOR UPDATE USING (
  user_id = auth.uid()
  OR session_id IN (SELECT id FROM sessions WHERE instructor_id = auth.uid())
);

-- STUDENT–INSTRUCTOR ASSIGNMENTS
CREATE POLICY "assignments_select" ON student_instructor_assignments FOR SELECT USING (
  student_id = auth.uid() OR teacher_id = auth.uid()
);
CREATE POLICY "assignments_insert" ON student_instructor_assignments FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "assignments_delete" ON student_instructor_assignments FOR DELETE USING (is_admin());

-- ============================================================
-- SEED: default subjects
-- ============================================================
INSERT INTO subjects (name_en, name_zh, category) VALUES
  ('Mathematics', '數學', 'STEM'),
  ('English', '英文', 'Languages'),
  ('Mandarin Chinese', '國語', 'Languages'),
  ('Physics', '物理', 'STEM'),
  ('Chemistry', '化學', 'STEM'),
  ('Biology', '生物', 'STEM'),
  ('History', '歷史', 'Humanities'),
  ('Geography', '地理', 'Humanities'),
  ('Music', '音樂', 'Arts'),
  ('Programming', '程式設計', 'STEM')
ON CONFLICT DO NOTHING;
