-- Fix processed_emails classification constraint to allow 'reply'
-- This fixes the 500 error when processing email replies

-- Drop the old constraint
ALTER TABLE processed_emails DROP CONSTRAINT IF EXISTS processed_emails_classification_check;

-- Add the new constraint with 'reply' included
ALTER TABLE processed_emails ADD CONSTRAINT processed_emails_classification_check 
  CHECK (classification IN ('support_request', 'junk', 'duplicate', 'reply'));
