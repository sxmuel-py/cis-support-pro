-- Test Trash Table
-- Run this to see if we can manually insert into the trash table.

INSERT INTO public.trash (
    sender_email, 
    subject, 
    body, 
    email_message_id, 
    triage_reasoning,
    email_from,
    email_subject
) VALUES (
    'test@example.com', 
    'Manual Test Trash', 
    'This is a test to see if the table works', 
    'manual-id-123', 
    'Testing database',
    'test@example.com',
    'Manual Test Trash'
);

SELECT * FROM public.trash WHERE email_message_id = 'manual-id-123';
