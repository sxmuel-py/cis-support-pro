"use server";

import { createClient, getCachedUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/gmail/send-email";
import { generateTicketMergedTemplate } from "@/lib/gmail/templates";

async function resolveTicketId(input: string, fieldLabel: string) {
  const supabase = await createClient();
  const normalized = input.trim();

  if (!normalized) {
    return { error: `${fieldLabel} ticket ID is required.` };
  }

  if (normalized.length === 36) {
    return { ticketId: normalized };
  }

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("id")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: `Could not look up the ${fieldLabel.toLowerCase()} ticket.` };
  }

  const matches = (tickets || []).filter((ticket) =>
    ticket.id.toLowerCase().startsWith(normalized.toLowerCase())
  );

  if (!matches || matches.length === 0) {
    return { error: `${fieldLabel} ticket not found.` };
  }

  if (matches.length > 1) {
    return { error: `${fieldLabel} ticket ID is ambiguous. Please paste more characters.` };
  }

  return { ticketId: matches[0].id };
}

export async function mergeTickets(sourceTicketId: string, targetTicketId: string) {
  const supabase = await createClient();

  // 1. Auth & Perms
  const { data: { user } } = await getCachedUser();
  
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

  const resolvedSource = await resolveTicketId(sourceTicketId, "Source");
  if (resolvedSource.error) {
    return { error: resolvedSource.error };
  }

  const resolvedTarget = await resolveTicketId(targetTicketId, "Target");
  if (resolvedTarget.error) {
    return { error: resolvedTarget.error };
  }

  const resolvedSourceTicketId = resolvedSource.ticketId;
  const resolvedTargetTicketId = resolvedTarget.ticketId;

  if (resolvedSourceTicketId === resolvedTargetTicketId) {
    return { error: "Cannot merge a ticket into itself." };
  }

  // 2. Fetch both tickets
  const { data: sourceTicket, error: sourceError } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", resolvedSourceTicketId)
    .single();

  if (sourceError || !sourceTicket) {
    return { error: "Source ticket not found." };
  }

  const { data: targetTicket, error: targetError } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", resolvedTargetTicketId)
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
The contents of ticket #${resolvedSourceTicketId.slice(0, 8)} ("${sourceTicket.subject}") have been merged into this ticket by ${currentUser.full_name}.

**Original Message from ${sourceTicket.sender_name || sourceTicket.sender_email}:**
${sourceTicket.body}
`;

  const { error: noteError } = await supabase
    .from("notes")
    .insert({
      ticket_id: resolvedTargetTicketId,
      author_name: "System",
      content: mergeNoteContent,
    });

  if (noteError) {
    return { error: "Failed to create merge note on target ticket." };
  }

  // b) Take all existing notes from source and re-parent them to target
  await supabase
    .from("notes")
    .update({ ticket_id: resolvedTargetTicketId })
    .eq("ticket_id", resolvedSourceTicketId);

  // c) Close the source ticket and set merged_info_id
  const { error: updateError } = await supabase
    .from("tickets")
    .update({
      status: "closed",
      merged_into_id: resolvedTargetTicketId,
    })
    .eq("id", resolvedSourceTicketId);

  if (updateError) {
    return { error: "Failed to close and link source ticket." };
  }

  revalidatePath("/dashboard");

  // 4. Notify everyone via email
  try {
    // Fetch all IT staff emails
    const { data: staffMembers } = await supabase
      .from("users")
      .select("email")
      .not("email", "is", null);

    if (staffMembers && staffMembers.length > 0) {
      const emailHtml = generateTicketMergedTemplate(
        resolvedSourceTicketId,
        resolvedTargetTicketId,
        sourceTicket.subject,
        targetTicket.subject,
        currentUser.full_name
      );

      const subject = `[MERGED] Ticket #${resolvedSourceTicketId.slice(0, 8)} into #${resolvedTargetTicketId.slice(0, 8)}`;

      // Send to all staff
      // For efficiency and to avoid hitting rate limits too fast, we'll send them in parallel
      // but in a production app with many users, you might use a queue or bcc.
      await Promise.all(
        staffMembers.map(member => 
          sendEmail({
            to: member.email,
            subject: subject,
            html: emailHtml
          })
        )
      );
    }
  } catch (emailError) {
    console.error("Failed to send merge notification emails:", emailError);
    // Don't return error here, the merge itself was successful
  }

  return { success: true };
}
