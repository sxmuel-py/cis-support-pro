"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function acceptTicket(ticketId: string) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify ticket is assigned to this user
  const { data: ticket } = await supabase
    .from("tickets")
    .select("assigned_to, assignment_status")
    .eq("id", ticketId)
    .single();

  if (!ticket) {
    return { error: "Ticket not found" };
  }

  if (ticket.assigned_to !== user.id) {
    return { error: "Ticket is not assigned to you" };
  }

  if (ticket.assignment_status === "accepted") {
    return { error: "Ticket already accepted" };
  }

  // Update ticket
  // Try updating assignment_status first; if DB doesn't have the column, retry without it
  let { error } = await supabase
    .from("tickets")
    .update({
      assignment_status: "accepted",
      status: "in_progress",
    })
    .eq("id", ticketId);

  if (error) {
    // Retry without assignment_status/retry fields to support older DBs
    const { error: fallbackError } = await supabase
      .from("tickets")
      .update({
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
