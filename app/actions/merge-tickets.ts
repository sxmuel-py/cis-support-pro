"use server";

import { createClient, getCachedSession } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function mergeTickets(sourceTicketId: string, targetTicketId: string) {
  const supabase = await createClient();

  // 1. Auth & Perms
  const { data: { session } } = await getCachedSession();
  const user = session?.user;
  
  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!currentUser || (currentUser.role !== "supervisor" && currentUser.role !== "hod")) {
    return { error: "Only HODs and Supervisors can merge tickets." };
  }

  if (sourceTicketId === targetTicketId) {
    return { error: "Cannot merge a ticket into itself." };
  }

  // 2. Fetch both tickets
  const { data: sourceTicket, error: sourceError } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", sourceTicketId)
    .single();

  if (sourceError || !sourceTicket) {
    return { error: "Source ticket not found." };
  }

  const { data: targetTicket, error: targetError } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", targetTicketId)
    .single();

  if (targetError || !targetTicket) {
    return { error: "Target ticket not found." };
  }

  if (sourceTicket.merged_into_id) {
    return { error: "Source ticket has already been merged." };
  }

  // 3. Begin Merge Strategy
  // a) Create a meganote on the target ticket containing the source body
  const mergeNoteContent = `**[SYSTEM] Ticket Merged**
The contents of ticket #${sourceTicketId.slice(0, 8)} ("${sourceTicket.subject}") have been merged into this ticket by ${currentUser.full_name}.

**Original Message from ${sourceTicket.sender_name || sourceTicket.sender_email}:**
${sourceTicket.body}
`;

  const { error: noteError } = await supabase
    .from("notes")
    .insert({
      ticket_id: targetTicketId,
      author_name: "System",
      content: mergeNoteContent,
    });

  if (noteError) {
    return { error: "Failed to create merge note on target ticket." };
  }

  // b) Take all existing notes from source and re-parent them to target
  await supabase
    .from("notes")
    .update({ ticket_id: targetTicketId })
    .eq("ticket_id", sourceTicketId);

  // c) Close the source ticket and set merged_info_id
  const { error: updateError } = await supabase
    .from("tickets")
    .update({
      status: "closed",
      merged_into_id: targetTicketId,
    })
    .eq("id", sourceTicketId);

  if (updateError) {
    return { error: "Failed to close and link source ticket." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
