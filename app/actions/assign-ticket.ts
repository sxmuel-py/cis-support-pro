"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function assignTicket(ticketId: string, technicianId: string | null) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify user is a supervisor
  const { data: currentUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!currentUser || currentUser.role !== "supervisor") {
    return { error: "Only supervisors can assign tickets" };
  }

  // Update ticket assignment
  const { error } = await supabase
    .from("tickets")
    .update({
      assigned_to: technicianId,
      assigned_by: technicianId ? user.id : null,
      assigned_at: technicianId ? new Date().toISOString() : null,
      assignment_status: technicianId ? "assigned" : "unassigned",
    })
    .eq("id", ticketId);

  if (error) {
    return { error: error.message };
  }

  // Revalidate dashboard to show updated data
  revalidatePath("/dashboard");

  return { success: true };
}
