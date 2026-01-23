"use server";

import { createClient } from "@/lib/supabase/server";

export interface TicketDetails {
  ticket: any;
  notes: any[];
  activities: any[];
  assignedUser: any | null;
}

export async function getTicketDetails(ticketId: string): Promise<TicketDetails | null> {
  const supabase = await createClient();

  // Fetch ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (ticketError || !ticket) {
    console.error("Error fetching ticket:", ticketError);
    return null;
  }

  // Fetch assigned user if exists
  let assignedUser = null;
  if (ticket.assigned_to) {
    const { data: user } = await supabase
      .from("users")
      .select("id, email, full_name, role")
      .eq("id", ticket.assigned_to)
      .single();
    
    assignedUser = user;
  }

  // Fetch notes
  const { data: notes } = await supabase
    .from("notes")
    .select(`
      *,
      author:users!notes_author_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  // Fetch activity log
  const { data: activities } = await supabase
    .from("activity_log")
    .select(`
      *,
      user:users!activity_log_user_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: false });

  return {
    ticket,
    notes: notes || [],
    activities: activities || [],
    assignedUser,
  };
}
