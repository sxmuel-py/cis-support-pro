-- Add merged_into_id to track ticket merges
ALTER TABLE public.tickets 
ADD COLUMN merged_into_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL;

-- Create an index to quickly find tickets that have been merged into a specific ticket
CREATE INDEX IF NOT EXISTS idx_tickets_merged_into ON public.tickets(merged_into_id);
