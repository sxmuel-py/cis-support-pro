-- The 'users' table has a CHECK constraint that limits roles to specific values.
-- We need to drop the old constraint and create a new one that includes 'hod'.

ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('technician', 'supervisor', 'sims_manager', 'hod'));
