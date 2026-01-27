-- Check Recent Tickets
-- Run this to see the last 10 tickets created, regardless of category.

SELECT id, created_at, subject, category, sender_email, status
FROM public.tickets
ORDER BY created_at DESC
LIMIT 10;
