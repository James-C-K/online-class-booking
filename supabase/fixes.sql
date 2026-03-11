-- ============================================================
-- X Platform — Comprehensive RLS & Schema Fixes
-- Run this in the Supabase SQL Editor
-- Safe to run multiple times (uses DROP IF EXISTS + CREATE)
-- ============================================================

-- ============================================================
-- 1. HELPER FUNCTION: is_admin()
-- Uses SECURITY DEFINER to bypass RLS when checking admin role,
-- preventing infinite recursion in profile-based policies.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('org_admin', 'platform_admin')
  );
$$;

-- ============================================================
-- 2. PROFILES
-- ============================================================

-- Allow the signup trigger (handle_new_user) to INSERT new profiles.
-- Without this, signups produce "Database error saving new user".
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (true);

-- Allow admins to update ANY user's profile (e.g. change roles).
-- The existing "profiles_update" only allows self-update.
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

-- ============================================================
-- 3. SESSIONS
-- ============================================================

-- Allow authenticated users to create sessions (booking flow).
DROP POLICY IF EXISTS "sessions_insert" ON sessions;
CREATE POLICY "sessions_insert" ON sessions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow instructors and participants to update sessions
-- (cancel action, add notes, mark completed).
DROP POLICY IF EXISTS "sessions_update" ON sessions;
CREATE POLICY "sessions_update" ON sessions
  FOR UPDATE USING (
    instructor_id = auth.uid()
    OR id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()
    )
  );

-- Allow admins to SELECT all sessions (for analytics dashboard).
-- The existing "sessions_select" only returns sessions you're in.
DROP POLICY IF EXISTS "sessions_select_admin" ON sessions;
CREATE POLICY "sessions_select_admin" ON sessions
  FOR SELECT USING (is_admin());

-- ============================================================
-- 4. SESSION PARTICIPANTS
-- ============================================================

-- Allow session creation to add participant rows.
DROP POLICY IF EXISTS "session_participants_insert" ON session_participants;
CREATE POLICY "session_participants_insert" ON session_participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow cancellation to update participant status rows.
DROP POLICY IF EXISTS "session_participants_update" ON session_participants;
CREATE POLICY "session_participants_update" ON session_participants
  FOR UPDATE USING (
    user_id = auth.uid()
    OR session_id IN (
      SELECT id FROM sessions WHERE instructor_id = auth.uid()
    )
  );

-- ============================================================
-- 5. SUBJECTS
-- ============================================================

-- Admins can see inactive subjects (to re-enable them in the admin panel).
DROP POLICY IF EXISTS "subjects_select" ON subjects;
CREATE POLICY "subjects_select" ON subjects
  FOR SELECT USING (is_active = true OR is_admin());

-- Admins can add new subjects.
DROP POLICY IF EXISTS "subjects_insert" ON subjects;
CREATE POLICY "subjects_insert" ON subjects
  FOR INSERT WITH CHECK (is_admin());

-- Admins can update subjects (enable/disable, rename).
DROP POLICY IF EXISTS "subjects_update" ON subjects;
CREATE POLICY "subjects_update" ON subjects
  FOR UPDATE USING (is_admin());

-- ============================================================
-- 6. STUDENT–INSTRUCTOR ASSIGNMENTS
-- ============================================================

-- Admins can create assignments.
DROP POLICY IF EXISTS "assignments_insert" ON student_instructor_assignments;
CREATE POLICY "assignments_insert" ON student_instructor_assignments
  FOR INSERT WITH CHECK (is_admin());

-- Admins can delete assignments.
DROP POLICY IF EXISTS "assignments_delete" ON student_instructor_assignments;
CREATE POLICY "assignments_delete" ON student_instructor_assignments
  FOR DELETE USING (is_admin());

-- ============================================================
-- 7. FIX: student_instructor_assignments UNIQUE CONSTRAINT
-- The original UNIQUE(student_id, teacher_id, org_id) doesn't work
-- for NULL org_id in PostgreSQL (NULL != NULL), so upsert conflicts
-- are never detected when org_id is NULL.
-- Replace with two partial unique indexes.
-- ============================================================
ALTER TABLE student_instructor_assignments
  DROP CONSTRAINT IF EXISTS student_instructor_assignments_student_id_teacher_id_org_id_key;

-- Unique pair when no org is set
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_no_org
  ON student_instructor_assignments (student_id, teacher_id)
  WHERE org_id IS NULL;

-- Unique triple when org is set
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_with_org
  ON student_instructor_assignments (student_id, teacher_id, org_id)
  WHERE org_id IS NOT NULL;

-- ============================================================
-- 8. CLEANUP: Remove ghost profiles (no auth.users entry)
-- These can appear if signups were partially completed or if
-- the handle_new_user trigger ran before RLS was properly set up.
-- ============================================================
DELETE FROM profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- ============================================================
-- 9. VERIFY: Check for auth.users with no profile
-- If rows appear, the trigger is not firing. Run the trigger
-- recreation block below if needed.
-- ============================================================
-- SELECT u.id, u.email
-- FROM auth.users u
-- LEFT JOIN profiles p ON p.id = u.id
-- WHERE p.id IS NULL;

-- ============================================================
-- 10. (Optional) Recreate trigger if profiles are missing
-- Only run if the SELECT above returns rows.
-- ============================================================
-- CREATE OR REPLACE FUNCTION handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO profiles (id, full_name, role)
--   VALUES (
--     NEW.id,
--     NEW.raw_user_meta_data->>'full_name',
--     COALESCE(NEW.raw_user_meta_data->>'role', 'student')
--   )
--   ON CONFLICT (id) DO NOTHING;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
--
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user();
