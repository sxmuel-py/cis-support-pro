"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { TicketStatus } from "@/lib/types";
import { sendEmail } from "@/lib/gmail/send-email";
import { generateTicketClosedTemplate } from "@/lib/gmail/templates";

export async function updateTicketStatus(ticketId: string, newStatus: TicketStatus) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get current user role and details (including name)
  const { data: currentUser } = await supabase
    .from("users")
    .select("role, name, email") // Added name and email
    .eq("id", user.id)
    .single();

  const { data: ticket } = await supabase
    .from("tickets") // Fixed table name from previous context if needed, usually 'tickets'
    .select("assigned_to, status, sender_email, subject, sender_name") // Added sender_email, subject, sender_name
    .eq("id", ticketId)
    .single();

  if (!ticket) {
    return { error: "Ticket not found" };
  }

  // Permission check: technicians can only update their assigned tickets
  if (currentUser?.role === "technician" && ticket.assigned_to !== user.id) {
    return { error: "You can only update tickets assigned to you" };
  }

  // Update ticket status
  const { error } = await supabase
    .from("tickets")
    .update({
      status: newStatus,
    })
    .eq("id", ticketId);

  if (error) {
    return { error: error.message };
  }

  // Send notification if closing logic is met
  // Send notification if closing logic is met
  console.log(`[UpdateStatus] Status changing to: ${newStatus}`);
  
  if (newStatus === 'closed' || newStatus === 'resolved') {
    console.log(`[UpdateStatus] Ticket sender email: ${ticket.sender_email}`);
    
    if (ticket.sender_email) {
       try {
        const closedByName = currentUser?.name || currentUser?.email || 'IT Support Team';
        const recipientName = ticket.sender_name || ticket.sender_email;

        console.log(`[UpdateStatus] Preparing to send email to ${ticket.sender_email}`);

        const html = generateTicketClosedTemplate(
          ticketId,
          ticket.subject || 'Support Ticket',
          recipientName,
          closedByName
        );

        const result = await sendEmail({
          to: ticket.sender_email,
          cc: 'itsupport@cislagos.org',
          subject: `[Ticket Closed] #${ticketId.slice(0, 8)} - ${ticket.subject}`,
          html,
        });
        
        console.log(`[UpdateStatus] Send result:`, result);
        
        if (result.success) {
            console.log(`[UpdateStatus] Sent closure notification to ${ticket.sender_email}`);
        } else {
            console.error(`[UpdateStatus] Failed to send email:`, result.error);
        }
      } catch (emailError) {
        console.error('[UpdateStatus] Error sending closure notification:', emailError);
        // non-blocking
      }
    } else {
        console.log('[UpdateStatus] No sender email found, skipping notification.');
    }
  }

  revalidatePath("/dashboard");
  return { success: true };
}
