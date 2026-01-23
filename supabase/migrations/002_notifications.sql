-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ticket_assigned', 'ticket_reassigned', 'ticket_updated', 'ticket_unassigned')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_ticket_id ON notifications(ticket_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Supervisors can view notifications they created (to see read status)
CREATE POLICY "Supervisors can view notifications they created"
  ON notifications
  FOR SELECT
  USING (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'supervisor'
    )
  );

-- Only notification owners can update (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications (via service role or triggers)
CREATE POLICY "Authenticated users can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Function to auto-create notification on ticket assignment
CREATE OR REPLACE FUNCTION create_assignment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if assigned_to changed and is not null
  IF (TG_OP = 'UPDATE' AND NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL) THEN
    -- Determine notification type
    DECLARE
      notification_type TEXT;
      notification_title TEXT;
      notification_message TEXT;
    BEGIN
      IF OLD.assigned_to IS NULL THEN
        notification_type := 'ticket_assigned';
        notification_title := 'New Ticket Assigned';
        notification_message := 'You have been assigned ticket #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ': ' || NEW.subject;
      ELSE
        notification_type := 'ticket_reassigned';
        notification_title := 'Ticket Reassigned';
        notification_message := 'Ticket #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' has been reassigned to you: ' || NEW.subject;
      END IF;

      -- Insert notification
      INSERT INTO notifications (user_id, ticket_id, type, title, message, created_by)
      VALUES (NEW.assigned_to, NEW.id, notification_type, notification_title, notification_message, NEW.assigned_by);
    END;
  END IF;

  -- Handle unassignment
  IF (TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NULL) THEN
    -- Mark existing notifications for this ticket as obsolete (delete them)
    DELETE FROM notifications
    WHERE ticket_id = NEW.id
      AND user_id = OLD.assigned_to
      AND type IN ('ticket_assigned', 'ticket_reassigned')
      AND read = FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for assignment notifications
CREATE TRIGGER trigger_assignment_notification
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION create_assignment_notification();

-- Add comment
COMMENT ON TABLE notifications IS 'Stores user notifications for ticket assignments and updates';
