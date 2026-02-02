"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/gmail/send-email";
import { generateTicketAssignedTemplate } from "@/lib/gmail/templates";

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
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!currentUser || currentUser.role !== "supervisor") {
    return { error: "Only supervisors can assign tickets" };
  }

  // Get ticket details for email notification
  const { data: ticket } = await supabase
    .from("tickets")
    .select("subject, priority, category")
    .eq("id", ticketId)
    .single();

  // Get technician details if assigning
  let technicianName = "Unassigned";
  if (technicianId) {
    const { data: technician } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", technicianId)
      .single();
    
    if (technician) {
      technicianName = technician.full_name;
    }
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

  // Send email notification to cishelpdesk@cislagos.org when ticket is assigned
  if (technicianId && ticket) {
    try {
      const emailHtml = generateTicketAssignedTemplate(
        ticketId,
        ticket.subject,
        technicianName,
        currentUser.full_name,
        ticket.priority || 'medium',
        ticket.category || 'general'
      );

      await sendEmail({
        to: 'cishelpdesk@cislagos.org',
        subject: `Ticket Assigned: #${ticketId.slice(0, 8)} - ${ticket.subject}`,
        html: emailHtml,
      });

      console.log(`Assignment notification sent for ticket ${ticketId}`);
    } catch (emailError) {
      console.error('Failed to send assignment notification:', emailError);
      // Don't fail the assignment if email fails
    }
  }

  // Revalidate dashboard to show updated data
  revalidatePath("/dashboard");

  return { success: true };
}
