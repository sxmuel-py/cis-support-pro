"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addNote(ticketId: string, content: string) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  if (!content.trim()) {
    return { error: "Note content cannot be empty" };
  }

  // Get user profile for author_name
  const { data: userProfile } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

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
