-- SIMS Manager Setup SQL Script (Simplified)

-- Since your database uses TEXT columns instead of ENUMs,
-- we can skip the ALTER TYPE commands and just update the user directly.

-- 1. Create or Update a SIMS Manager User
-- Replace 'akileyem@cislagos.org' with the actual email
UPDATE public.users
SET role = 'sims_manager'
WHERE email = 'akileyem@cislagos.org';

-- 2. Verification
-- Run this to confirm the change worked
SELECT * FROM public.users WHERE email = 'akileyem@cislagos.org';
