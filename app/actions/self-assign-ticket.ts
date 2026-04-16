"use server";

import { createClient, getCachedUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { canAccessTicketCategory } from "@/lib/ticket-access";

export async function selfAssignTicket(ticketId: string) {
  console.log("[selfAssignTicket] Starting for ticket:", ticketId);
  const supabase = await createClient();

  // Get current user from session (more reliable in server actions)
  const { data: { user } } = await getCachedUser();
  console.log("[selfAssignTicket] Session user:", user?.id);
  
  if (!user) {
    console.error("[selfAssignTicket] No session user found");
    return { error: "Unauthorized" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  // Verify ticket is unassigned
  const { data: ticket } = await supabase
    .from("tickets")
    .select("assigned_to, assignment_status, category")
    .eq("id", ticketId)
    .single();

  console.log("[selfAssignTicket] Ticket data:", ticket);

  if (!ticket) {
    console.error("[selfAssignTicket] Ticket not found");
    return { error: "Ticket not found" };
  }

  if (!canAccessTicketCategory(profile?.role, ticket.category)) {
    return { error: "You do not have access to this ticket." };
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
