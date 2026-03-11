-- ============================================================
-- X Platform — Phase 2 Schema
-- Run this in the Supabase SQL Editor AFTER fixes.sql
-- ============================================================

-- 1. Add email column to profiles (for sending notifications)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Update existing profiles with their auth email
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. Update trigger to capture email on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. NOTIFICATIONS table
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type       TEXT NOT NULL,
  -- 'booking_confirmed' | 'booking_cancelled' | 'session_reminder' | 'group_joined'
  title_en   TEXT,
  title_zh   TEXT,
  body_en    TEXT,
  body_zh    TEXT,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Server-side inserts (via service role or SECURITY DEFINER)
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (true);

-- Index for fast unread queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read, created_at DESC);
