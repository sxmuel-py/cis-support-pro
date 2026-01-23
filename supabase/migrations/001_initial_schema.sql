-- CIS Support Pro - Initial Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Users Table (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('supervisor', 'technician')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Tickets Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('hardware', 'software', 'network', 'access', 'other')),
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ
);

-- ============================================
-- 3. Notes Table (IT-only internal notes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Trash Table (filtered junk emails)
-- ============================================
CREATE TABLE IF NOT EXISTS public.trash (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  classification_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Activity Log (audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'created', 'assigned', 'status_changed', 'priority_changed', 'note_added', 'reassigned'
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_ticket_id ON public.notes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_ticket_id ON public.activity_log(ticket_id);

-- ============================================
-- 7. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trash ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. RLS Policies - Users Table
-- ============================================
-- Users can read all users (for assignment dropdown)
CREATE POLICY "Users can read all users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 9. RLS Policies - Tickets Table
-- ============================================
-- All authenticated IT staff can view all tickets
CREATE POLICY "IT staff can view all tickets" ON public.tickets
  FOR SELECT USING (auth.role() = 'authenticated');

-- System can insert tickets (from email webhook)
CREATE POLICY "System can create tickets" ON public.tickets
  FOR INSERT WITH CHECK (true);

-- Only supervisors can assign tickets
CREATE POLICY "Supervisors can assign tickets" ON public.tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'supervisor'
    )
  );

-- Technicians can update their assigned tickets
CREATE POLICY "Technicians can update assigned tickets" ON public.tickets
  FOR UPDATE USING (assigned_to = auth.uid());

-- ============================================
-- 10. RLS Policies - Notes Table
-- ============================================
-- All IT staff can add notes
CREATE POLICY "IT staff can add notes" ON public.notes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- All IT staff can view notes
CREATE POLICY "IT staff can view notes" ON public.notes
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- 11. RLS Policies - Trash Table
-- ============================================
-- System can insert trash
CREATE POLICY "System can add to trash" ON public.trash
  FOR INSERT WITH CHECK (true);

-- All IT staff can view trash
CREATE POLICY "IT staff can view trash" ON public.trash
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- 12. RLS Policies - Activity Log
-- ============================================
-- System can insert activity
CREATE POLICY "System can log activity" ON public.activity_log
  FOR INSERT WITH CHECK (true);

-- All IT staff can view activity
CREATE POLICY "IT staff can view activity" ON public.activity_log
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- 13. Enable Real-time for Tickets and Notes
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;

-- ============================================
-- 14. Functions - Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to users table
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Apply to tickets table
CREATE TRIGGER set_updated_at_tickets
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 15. Function - Log ticket activity automatically
-- ============================================
CREATE OR REPLACE FUNCTION public.log_ticket_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log assignment
  IF (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    INSERT INTO public.activity_log (ticket_id, user_id, action, details)
    VALUES (
      NEW.id,
      NEW.assigned_by,
      CASE WHEN OLD.assigned_to IS NULL THEN 'assigned' ELSE 'reassigned' END,
      jsonb_build_object(
        'assigned_to', NEW.assigned_to,
        'previous_assignee', OLD.assigned_to
      )
    );
  END IF;

  -- Log status change
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.activity_log (ticket_id, user_id, action, details)
    VALUES (
      NEW.id,
      auth.uid(),
      'status_changed',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;

  -- Log priority change
  IF (TG_OP = 'UPDATE' AND OLD.priority IS DISTINCT FROM NEW.priority) THEN
    INSERT INTO public.activity_log (ticket_id, user_id, action, details)
    VALUES (
      NEW.id,
      auth.uid(),
      'priority_changed',
      jsonb_build_object(
        'old_priority', OLD.priority,
        'new_priority', NEW.priority
      )
    );
  END IF;

  -- Log ticket creation
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.activity_log (ticket_id, action, details)
    VALUES (
      NEW.id,
      'created',
      jsonb_build_object(
        'sender_email', NEW.sender_email,
        'subject', NEW.subject
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger
CREATE TRIGGER log_ticket_changes
  AFTER INSERT OR UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ticket_activity();

-- ============================================
-- 16. Function - Log note creation
-- ============================================
CREATE OR REPLACE FUNCTION public.log_note_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_log (ticket_id, user_id, action, details)
  VALUES (
    NEW.ticket_id,
    NEW.author_id,
    'note_added',
    jsonb_build_object('note_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger
CREATE TRIGGER log_note_creation
  AFTER INSERT ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_note_activity();

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Next steps:
-- 1. Go to Supabase Dashboard > Authentication > Providers
-- 2. Enable Email provider
-- 3. Configure email templates (optional)
-- 4. Create your first IT staff user via Supabase Dashboard
-- 5. Manually insert user into public.users table with role
