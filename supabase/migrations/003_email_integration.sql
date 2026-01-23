-- Add email integration fields to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS email_thread_id TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS email_message_id TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Create indexes for email lookups
CREATE INDEX IF NOT EXISTS idx_tickets_email_thread_id ON tickets(email_thread_id);
CREATE INDEX IF NOT EXISTS idx_tickets_email_message_id ON tickets(email_message_id);

-- Add email tracking fields to trash table
ALTER TABLE trash ADD COLUMN IF NOT EXISTS email_message_id TEXT;
ALTER TABLE trash ADD COLUMN IF NOT EXISTS triage_reasoning TEXT;
ALTER TABLE trash ADD COLUMN IF NOT EXISTS email_from TEXT;
ALTER TABLE trash ADD COLUMN IF NOT EXISTS email_subject TEXT;

-- Create index for trash email lookups
CREATE INDEX IF NOT EXISTS idx_trash_email_message_id ON trash(email_message_id);

-- Create table to track processed emails (prevent duplicates)
CREATE TABLE IF NOT EXISTS processed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL UNIQUE,
  thread_id TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  classification TEXT NOT NULL CHECK (classification IN ('support_request', 'junk', 'duplicate')),
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_processed_emails_message_id ON processed_emails(message_id);
CREATE INDEX idx_processed_emails_thread_id ON processed_emails(thread_id);
CREATE INDEX idx_processed_emails_created_at ON processed_emails(created_at DESC);

-- Add comment
COMMENT ON TABLE processed_emails IS 'Tracks processed emails to prevent duplicate ticket creation';
