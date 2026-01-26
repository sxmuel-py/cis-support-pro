-- SIMS Manager Setup SQL Script (Fixing Constraints)

-- 1. Remove the old strict rule that blocks 'sims_manager'
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Add a new rule that includes 'sims_manager'
ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role IN ('supervisor', 'technician', 'sims_manager'));

-- 3. Update the user role
-- (Using the corrected email from your error message: akinleyem@cislagos.org)
UPDATE public.users
SET role = 'sims_manager'
WHERE email = 'akinleyem@cislagos.org';

-- 4. Verification
SELECT * FROM public.users WHERE role = 'sims_manager';
