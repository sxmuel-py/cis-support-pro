"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function selfAssignTicket(ticketId: string) {
  const supabase = await createClient();

  // Get current user from session (more reliable in server actions)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const user = session.user;

  // Verify ticket is unassigned
  const { data: ticket } = await supabase
    .from("tickets")
    .select("assigned_to, assignment_status")
    .eq("id", ticketId)
    .single();

  if (!ticket) {
    return { error: "Ticket not found" };
  }

  if (ticket.assigned_to) {
    return { error: "Ticket is already assigned" };
  }

  // Assign ticket to current user
  // Assign ticket; attempt to set `assignment_status` but fallback if column missing
  let { error } = await supabase
    .from("tickets")
    .update({
      assigned_to: user.id,
      assigned_by: user.id, // Self-assigned
      assigned_at: new Date().toISOString(),
      assignment_status: "accepted", // Auto-accept when self-assigning
      status: "in_progress", // Auto-move to in_progress
    })
    .eq("id", ticketId);

  if (error) {
    const { error: fallbackError } = await supabase
      .from("tickets")
      .update({
        assigned_to: user.id,
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
        status: "in_progress",
      })
      .eq("id", ticketId);

    if (fallbackError) {
      return { error: fallbackError.message };
    }
  }

  revalidatePath("/dashboard");
  return { success: true };
}
