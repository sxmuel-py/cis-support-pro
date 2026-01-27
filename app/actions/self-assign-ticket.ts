"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function selfAssignTicket(ticketId: string) {
  console.log("[selfAssignTicket] Starting for ticket:", ticketId);
  const supabase = await createClient();

  // Get current user from session (more reliable in server actions)
  const { data: { session } } = await supabase.auth.getSession();
  console.log("[selfAssignTicket] Session user:", session?.user?.id);
  
  if (!session?.user) {
    console.error("[selfAssignTicket] No session user found");
    return { error: "Unauthorized" };
  }

  const user = session.user;

  // Verify ticket is unassigned
  const { data: ticket } = await supabase
    .from("tickets")
    .select("assigned_to, assignment_status")
    .eq("id", ticketId)
    .single();

  console.log("[selfAssignTicket] Ticket data:", ticket);

  if (!ticket) {
    console.error("[selfAssignTicket] Ticket not found");
    return { error: "Ticket not found" };
  }

  if (ticket.assigned_to) {
    console.error("[selfAssignTicket] Ticket already assigned to:", ticket.assigned_to);
    return { error: "Ticket is already assigned" };
  }

  // Assign ticket to current user
  // Assign ticket; attempt to set `assignment_status` but fallback if column missing
  console.log("[selfAssignTicket] Attempting to assign ticket to user:", user.id);
  
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
    console.error("[selfAssignTicket] Error with assignment_status, trying fallback:", error);
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
      console.error("[selfAssignTicket] Fallback error:", fallbackError);
      return { error: fallbackError.message };
    }
  }

  console.log("[selfAssignTicket] Success!");
  revalidatePath("/dashboard");
  return { success: true };
}
