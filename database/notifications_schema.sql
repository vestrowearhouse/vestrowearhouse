-- STATEMENT
-- Notification types enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM ('info', 'warning', 'event', 'alert');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_recipient_type') THEN
    CREATE TYPE notification_recipient_type AS ENUM ('all', 'all_users', 'all_vendors', 'single_user', 'single_vendor');
  END IF;
END $$;

-- STATEMENT
-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_id UUID, -- Nullable for bulk broadcast
  recipient_type notification_recipient_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STATEMENT
-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- STATEMENT
-- Drop policies if they exist to avoid errors
DROP POLICY IF EXISTS "Admins have full access to notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view relevant notifications" ON notifications;
DROP POLICY IF EXISTS "Users can mark own notifications as read" ON notifications;

-- STATEMENT
-- Admins can do anything
CREATE POLICY "Admins have full access to notifications" ON notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- STATEMENT
-- Users/Vendors can view their own or broadcast notifications
CREATE POLICY "Users can view relevant notifications" ON notifications
  FOR SELECT
  USING (
    recipient_id = auth.uid() OR
    recipient_type = 'all' OR
    (recipient_type = 'all_users' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'user')) OR
    (recipient_type = 'all_vendors' AND EXISTS (SELECT 1 FROM vendors WHERE id = auth.uid()))
  );

-- STATEMENT
-- Users/Vendors can update (mark as read) their own notifications
CREATE POLICY "Users can mark own notifications as read" ON notifications
  FOR UPDATE
  USING (
    recipient_id = auth.uid()
  )
  WITH CHECK (
    recipient_id = auth.uid()
  );
