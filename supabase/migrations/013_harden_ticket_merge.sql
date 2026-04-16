CREATE OR REPLACE FUNCTION public.merge_ticket_into(source_ticket_id UUID, target_ticket_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role TEXT;
  actor_name TEXT;
  source_ticket_record public.tickets%ROWTYPE;
  target_ticket_record public.tickets%ROWTYPE;
  merge_note_content TEXT;
BEGIN
  actor_role := public.get_my_role();

  IF actor_role NOT IN ('supervisor', 'hod') THEN
    RAISE EXCEPTION 'Only HODs and Supervisors can merge tickets.';
  END IF;

  IF source_ticket_id = target_ticket_id THEN
    RAISE EXCEPTION 'Cannot merge a ticket into itself.';
  END IF;

  SELECT *
  INTO source_ticket_record
  FROM public.tickets
  WHERE id = source_ticket_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source ticket not found.';
  END IF;

  SELECT *
  INTO target_ticket_record
  FROM public.tickets
  WHERE id = target_ticket_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target ticket not found.';
  END IF;

  IF source_ticket_record.merged_into_id IS NOT NULL THEN
    RAISE EXCEPTION 'Source ticket has already been merged.';
  END IF;

  IF target_ticket_record.merged_into_id IS NOT NULL THEN
    RAISE EXCEPTION 'Target ticket has already been merged into another ticket. Merge into the active ticket instead.';
  END IF;

  IF target_ticket_record.status = 'closed' THEN
    RAISE EXCEPTION 'Cannot merge into a closed ticket.';
  END IF;

  SELECT full_name
  INTO actor_name
  FROM public.users
  WHERE id = auth.uid();

  merge_note_content := format(
    E'**[SYSTEM] Ticket Merged**\nThe contents of ticket #%s ("%s") have been merged into this ticket by %s.\n\n**Original Message from %s:**\n%s',
    LEFT(source_ticket_record.id::TEXT, 8),
    source_ticket_record.subject,
    COALESCE(actor_name, 'System'),
    COALESCE(source_ticket_record.sender_name, source_ticket_record.sender_email),
    source_ticket_record.body
  );

  INSERT INTO public.notes (ticket_id, author_id, author_name, content)
  VALUES (
    target_ticket_record.id,
    auth.uid(),
    'System',
    merge_note_content
  );

  UPDATE public.notes
  SET ticket_id = target_ticket_record.id
  WHERE ticket_id = source_ticket_record.id;

  UPDATE public.activity_log
  SET ticket_id = target_ticket_record.id
  WHERE ticket_id = source_ticket_record.id;

  INSERT INTO public.activity_log (ticket_id, user_id, action, details)
  VALUES (
    target_ticket_record.id,
    auth.uid(),
    'merged',
    jsonb_build_object(
      'source_ticket_id', source_ticket_record.id,
      'source_ticket_short_id', LEFT(source_ticket_record.id::TEXT, 8),
      'source_ticket_subject', source_ticket_record.subject
    )
  );

  UPDATE public.tickets
  SET
    status = 'closed',
    merged_into_id = target_ticket_record.id
  WHERE id = source_ticket_record.id;

  RETURN jsonb_build_object(
    'source_ticket_id', source_ticket_record.id,
    'source_ticket_short_id', LEFT(source_ticket_record.id::TEXT, 8),
    'target_ticket_id', target_ticket_record.id,
    'target_ticket_short_id', LEFT(target_ticket_record.id::TEXT, 8),
    'target_ticket_subject', target_ticket_record.subject
  );
END;
$$;
