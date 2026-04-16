"use server";

import { createClient, getCachedUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteTicket(ticketId: string) {
  const supabase = await createClient();

  // 1. Auth & Perms
  const { data: { user } } = await getCachedUser();
  
  if (!user) {
    return { error: "Unauthorized" };
  }

  // Check if user is HOD
  const { data: currentUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!currentUser || currentUser.role !== "hod") {
    return { error: "Only Head of Department (HOD) can delete tickets." };
  }

  // 2. Delete Ticket (Notes should cascade if configured, but let's be safe)
  // Actually, Supabase/Postgres usually handles this if FK is set to Cascade.
  // In this project, let's assume it's configured correctly, or handle it here if not.
  
  const { error: deleteError } = await supabase
    .from("tickets")
    .delete()
    .eq("id", ticketId);

  if (deleteError) {
    console.error("Delete error:", deleteError);
    return { error: deleteError.message || "Failed to delete ticket." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/trash");
  return { success: true };
}
