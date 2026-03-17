-- Define the newly added 'hod' role in RLS policies so they have absolute God-mode access over all tables.

-- 1. USERS TABLE
DROP POLICY IF EXISTS "HOD can view all users" ON public.users;
CREATE POLICY "HOD can view all users" ON public.users
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'hod')
);

DROP POLICY IF EXISTS "HOD can update all users" ON public.users;
CREATE POLICY "HOD can update all users" ON public.users
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'hod')
);

-- 2. TICKETS TABLE
DROP POLICY IF EXISTS "HOD can view all tickets" ON public.tickets;
CREATE POLICY "HOD can view all tickets" ON public.tickets
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'hod')
);

DROP POLICY IF EXISTS "HOD can update all tickets" ON public.tickets;
CREATE POLICY "HOD can update all tickets" ON public.tickets
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'hod')
);

DROP POLICY IF EXISTS "HOD can insert tickets" ON public.tickets;
CREATE POLICY "HOD can insert tickets" ON public.tickets
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'hod')
);

-- 3. NOTES TABLE
DROP POLICY IF EXISTS "HOD can view all notes" ON public.notes;
CREATE POLICY "HOD can view all notes" ON public.notes
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'hod')
);

DROP POLICY IF EXISTS "HOD can insert notes" ON public.notes;
CREATE POLICY "HOD can insert notes" ON public.notes
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'hod')
);

DROP POLICY IF EXISTS "HOD can update all notes" ON public.notes;
CREATE POLICY "HOD can update all notes" ON public.notes
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'hod')
);

-- 4. ACTIVITY LOG TABLE
DROP POLICY IF EXISTS "HOD can view all activity logs" ON public.activity_log;
CREATE POLICY "HOD can view all activity logs" ON public.activity_log
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'hod')
);

DROP POLICY IF EXISTS "HOD can insert activity logs" ON public.activity_log;
CREATE POLICY "HOD can insert activity logs" ON public.activity_log
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'hod')
);

-- 5. TRASH TABLE
DROP POLICY IF EXISTS "HOD can view all trash" ON public.trash;
CREATE POLICY "HOD can view all trash" ON public.trash
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'hod')
);

DROP POLICY IF EXISTS "HOD can update trash" ON public.trash;
CREATE POLICY "HOD can update trash" ON public.trash
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'hod')
);

DROP POLICY IF EXISTS "HOD can delete trash" ON public.trash;
CREATE POLICY "HOD can delete trash" ON public.trash
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'hod')
);
