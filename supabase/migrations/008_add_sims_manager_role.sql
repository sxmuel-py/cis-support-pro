-- Add sims_manager to the role check constraint in the users table
-- This allows the role to be correctly saved in the database

-- Drop the old constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with sims_manager included
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('supervisor', 'technician', 'sims_manager'));
