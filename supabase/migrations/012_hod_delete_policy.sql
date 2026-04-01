-- Allow Head of Department (HOD) to delete tickets
-- This is required for the new "Delete Ticket" feature

DROP POLICY IF EXISTS "HOD can delete tickets" ON public.tickets;
CREATE POLICY "HOD can delete tickets" ON public.tickets 
FOR DELETE 
USING (public.get_my_role() = 'hod');
