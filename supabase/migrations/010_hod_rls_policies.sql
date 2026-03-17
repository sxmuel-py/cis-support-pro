-- 1. Helper Function to break RLS recursion
-- This function runs as the 'postgres' user (SECURITY DEFINER), bypassing RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. USERS TABLE
-- Allow all authenticated users to read profiles (standard behavior)
DROP POLICY IF EXISTS "Users can read all users" ON public.users;
CREATE POLICY "Users can read all users" ON public.users FOR SELECT USING (auth.role() = 'authenticated');

-- Allow HOD to update/delete users
DROP POLICY IF EXISTS "HOD can update all users" ON public.users;
CREATE POLICY "HOD can update all users" ON public.users FOR UPDATE USING (public.get_my_role() = 'hod');

-- 3. TICKETS TABLE
DROP POLICY IF EXISTS "HOD can view all tickets" ON public.tickets;
CREATE POLICY "HOD can view all tickets" ON public.tickets FOR SELECT USING (public.get_my_role() = 'hod');

DROP POLICY IF EXISTS "HOD can update all tickets" ON public.tickets;
CREATE POLICY "HOD can update all tickets" ON public.tickets FOR UPDATE USING (public.get_my_role() = 'hod');

DROP POLICY IF EXISTS "HOD can insert tickets" ON public.tickets;
CREATE POLICY "HOD can insert tickets" ON public.tickets FOR INSERT WITH CHECK (public.get_my_role() = 'hod');

-- 4. NOTES TABLE
DROP POLICY IF EXISTS "HOD can view all notes" ON public.notes;
CREATE POLICY "HOD can view all notes" ON public.notes FOR SELECT USING (public.get_my_role() = 'hod');

DROP POLICY IF EXISTS "HOD can insert notes" ON public.notes;
CREATE POLICY "HOD can insert notes" ON public.notes FOR INSERT WITH CHECK (public.get_my_role() = 'hod');

DROP POLICY IF EXISTS "HOD can update all notes" ON public.notes;
CREATE POLICY "HOD can update all notes" ON public.notes FOR UPDATE USING (public.get_my_role() = 'hod');

-- 5. ACTIVITY LOG TABLE
DROP POLICY IF EXISTS "HOD can view all activity logs" ON public.activity_log;
CREATE POLICY "HOD can view all activity logs" ON public.activity_log FOR SELECT USING (public.get_my_role() = 'hod');

DROP POLICY IF EXISTS "HOD can insert activity logs" ON public.activity_log;
CREATE POLICY "HOD can insert activity logs" ON public.activity_log FOR INSERT WITH CHECK (public.get_my_role() = 'hod');

-- 6. TRASH TABLE
DROP POLICY IF EXISTS "HOD can view all trash" ON public.trash;
CREATE POLICY "HOD can view all trash" ON public.trash FOR SELECT USING (public.get_my_role() = 'hod');

DROP POLICY IF EXISTS "HOD can update trash" ON public.trash;
CREATE POLICY "HOD can update trash" ON public.trash FOR UPDATE USING (public.get_my_role() = 'hod');

DROP POLICY IF EXISTS "HOD can delete trash" ON public.trash;
CREATE POLICY "HOD can delete trash" ON public.trash FOR DELETE USING (public.get_my_role() = 'hod');
