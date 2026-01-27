-- Check Trash Logs
-- Run this to see what emails have been classified as JUNK and why.

SELECT 
    created_at, 
    email_from, 
    email_subject, 
    triage_reasoning 
FROM public.trash
ORDER BY created_at DESC
LIMIT 10;
