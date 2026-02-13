-- Fix Self-Assign RLS Policy

-- 1. Drop the restrictive policy that only allows updates if ALREADY assigned
DROP POLICY IF EXISTS "Technicians can update assigned tickets" ON public.tickets;

-- 2. Create a new policy that allows updates if:
--    a) The ticket is currently assigned to the user (standard update)
--    OR
--    b) The ticket is unassigned AND the user is assigning it to themselves (self-assign)
CREATE POLICY "Technicians can update tickets" ON public.tickets
  FOR UPDATE
  USING (
    (assigned_to = auth.uid()) OR  -- Already assigned to me
    (assigned_to IS NULL)          -- Currently unassigned (allows picking it up)
  )
  WITH CHECK (
    (assigned_to = auth.uid())     -- Must be assigned to me after update
  );
