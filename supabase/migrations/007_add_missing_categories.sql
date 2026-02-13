-- Add missing categories to tickets table
-- Fixes: tickets_category_check constraint violation

-- Drop the old constraint
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_category_check;

-- Add the new constraint with all categories including 'sims' and 'email'
ALTER TABLE tickets ADD CONSTRAINT tickets_category_check 
  CHECK (category IN ('hardware', 'software', 'network', 'access', 'email', 'sims', 'other'));
