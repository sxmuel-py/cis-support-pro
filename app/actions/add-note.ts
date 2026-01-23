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

  // Create note
  const { error } = await supabase
    .from("notes")
    .insert({
      ticket_id: ticketId,
      author_id: user.id,
      content: content.trim(),
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
