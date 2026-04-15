"use server";

import { createClient, getCachedUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addNote(ticketId: string, content: string) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await getCachedUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  if (!content.trim()) {
    return { error: "Note content cannot be empty" };
  }

  // Get target ticket to check permissions
  const { data: ticket } = await supabase
    .from("tickets")
    .select("category")
    .eq("id", ticketId)
    .single();

  if (!ticket) {
    return { error: "Ticket not found" };
  }

  // Get user profile for author_name and role check
  const { data: userProfile } = await supabase
    .from("users")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single();

  // Role-based permission check
  if (userProfile?.role === "technician" && ticket.category === "sims") {
    return { error: "Unauthorized: Technicians cannot access SIMS tickets" };
  }

  if (userProfile?.role === "sims_manager" && ticket.category !== "sims") {
    return { error: "Unauthorized: SIMS Managers can only access SIMS tickets" };
  }
  
  // HOD and Supervsior have global access, so no further restrictions needed here

  // Create note
  const { error } = await supabase
    .from("notes")
    .insert({
      ticket_id: ticketId,
      author_id: user.id,
      author_name: userProfile?.full_name || userProfile?.email || user.email || "Unknown",
      content: content.trim(),
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
