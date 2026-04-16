"use server";

import { createClient, getCachedUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { canAccessTicketCategory } from "@/lib/ticket-access";

export async function rejectTicket(ticketId: string, reason?: string) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await getCachedUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  // Verify ticket is assigned to this user
  const { data: ticket } = await supabase
    .from("tickets")
    .select("assigned_to, assigned_by, category")
    .eq("id", ticketId)
    .single();

  if (!ticket) {
    return { error: "Ticket not found" };
  }

  if (!canAccessTicketCategory(profile?.role, ticket.category)) {
    return { error: "You do not have access to this ticket." };
  }

  if (ticket.assigned_to !== user.id) {
    return { error: "Ticket is not assigned to you" };
  }

  // Update ticket - unassign and mark as rejected
  // Try updating with rejection fields; fallback if DB doesn't include those columns
  let { error } = await supabase
    .from("tickets")
    .update({
      assignment_status: "rejected",
      rejection_reason: reason || null,
      assigned_to: null,
      assigned_by: null,
      assigned_at: null,
    })
    .eq("id", ticketId);

  if (error) {
    const { error: fallbackError } = await supabase
      .from("tickets")
      .update({
        assigned_to: null,
        assigned_by: null,
        assigned_at: null,
      })
      .eq("id", ticketId);

    if (fallbackError) {
      return { error: fallbackError.message };
    }
  }

  // Create notification for supervisor who assigned it
  if (ticket.assigned_by) {
    await supabase.from("notifications").insert({
      user_id: ticket.assigned_by,
      ticket_id: ticketId,
      type: "ticket_rejected",
      title: "Ticket Assignment Rejected",
      message: `Ticket #${ticketId.slice(0, 8)} was rejected${reason ? `: ${reason}` : ""}`,
      created_by: user.id,
    });
  }

  revalidatePath("/dashboard");
  return { success: true };
}
