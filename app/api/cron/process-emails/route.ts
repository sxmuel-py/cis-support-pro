import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchUnreadEmails, markEmailAsRead, archiveEmail } from '@/lib/gmail/fetch-emails';
import { triageEmailWithLLM } from '@/lib/triage/llm-triage';
import { sendEmail } from '@/lib/gmail/send-email';
import { generateTicketCreatedTemplate } from '@/lib/gmail/templates';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

export async function GET(request: Request) {
  try {
    // Verify cron secret (security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use Service Role Key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch unread emails
    console.log('Fetching unread emails...');
    const emails = await fetchUnreadEmails();
    console.log(`Found ${emails.length} unread emails`);

    const results = {
      processed: 0,
      tickets_created: 0,
      replies_added: 0, // New: track replies added as notes
      junk_filtered: 0,
      duplicates_skipped: 0,
      errors: 0,
      errorDetails: [] as { emailId: string; error: string; stack?: string }[],
    };

    for (const email of emails) {
      try {
        // Filter out bot-sent emails by checking for custom headers
        const isAutoReply = email.headers['x-auto-reply'] === 'true' || 
                           email.headers['x-cis-support-bot'] === 'v1';
        
        if (isAutoReply) {
          console.log(`Skipping bot auto-reply: ${email.from} - ${email.subject}`);
          
          // Mark as processed to avoid reprocessing
          await supabase.from('processed_emails').insert({
            message_id: email.id,
            thread_id: email.threadId,
            classification: 'junk',
          });

          // Mark as read and archive
          await markEmailAsRead(email.id);
          await archiveEmail(email.id);
          
          results.junk_filtered++;
          continue;
        }

        // Filter out other blocked senders
        const blockedSenders = [
          'help@cisitservices.on.spiceworks.com',
          'noreply@',
          'no-reply@',
        ];

        const fromEmail = email.from.toLowerCase();
        const isBlockedSender = blockedSenders.some((sender) => fromEmail.includes(sender));

        if (isBlockedSender) {
          console.log(`Skipping blocked sender: ${email.from} - ${email.subject}`);
          
          // Mark as processed to avoid reprocessing
          await supabase.from('processed_emails').insert({
            message_id: email.id,
            thread_id: email.threadId,
            classification: 'junk',
          });

          // Mark as read and archive
          await markEmailAsRead(email.id);
          await archiveEmail(email.id);
          
          results.junk_filtered++;
          continue;
        }

        // Check if already processed
        const { data: existing } = await supabase
          .from('processed_emails')
          .select('id')
          .eq('message_id', email.id)
          .single();

        if (existing) {
          console.log(`Skipping duplicate email: ${email.id}`);
          results.duplicates_skipped++;
          await markEmailAsRead(email.id);
          continue;
        }

        // ============================================
        // SMART THREAD TRACKING - Prevent Duplicate Tickets
        // ============================================
        
        // Check if this email is a reply to an existing ticket (by thread ID)
        const { data: existingTicket } = await supabase
          .from('tickets')
          .select('id, subject, status, sender_email')
          .eq('email_thread_id', email.threadId)
          .single();

        if (existingTicket) {
          // This is a reply to an existing ticket - add as note instead
          console.log(`Email is a reply to existing ticket #${existingTicket.id.slice(0, 8)}`);
          
          // Determine who sent the reply
          const isFromOriginalSender = email.from.toLowerCase() === existingTicket.sender_email.toLowerCase();
          const isFromTechnician = email.from.toLowerCase().endsWith('@cislagos.org');
          
          let noteContent = '';
          if (isFromTechnician) {
            noteContent = `**Technician Reply** (${email.fromName || email.from}):\n\n${email.body}`;
          } else if (isFromOriginalSender) {
            noteContent = `**Customer Follow-up** (${email.fromName || email.from}):\n\n${email.body}`;
          } else {
            noteContent = `**Reply from** ${email.fromName || email.from}:\n\n${email.body}`;
          }

          // Add as note to existing ticket
          await supabase.from('notes').insert({
            ticket_id: existingTicket.id,
            content: noteContent,
            author_name: email.fromName || email.from,
            author_id: null, // System-generated note
          });

          // Mark as processed
          await supabase.from('processed_emails').insert({
            message_id: email.id,
            thread_id: email.threadId,
            classification: 'reply',
            ticket_id: existingTicket.id,
          });

          // Mark email as read
          await markEmailAsRead(email.id);

          console.log(`Added reply as note to ticket #${existingTicket.id.slice(0, 8)}`);
          results.replies_added++;
          continue; // Don't create a new ticket
        }

        // ============================================
        // NEW TICKET CREATION (only if not a reply)
        // ============================================

        // Triage email
        console.log(`Triaging email from ${email.from}: ${email.subject}`);
        const triage = await triageEmailWithLLM(email.from, email.subject, email.body);

        if (triage.classification === 'junk') {
          // Log to trash
          await supabase.from('trash').insert({
            sender_email: email.from,
            subject: email.subject,
            body: email.body,
            email_message_id: email.id,
            triage_reasoning: triage.reasoning,
            email_from: email.from,
            email_subject: email.subject,
          });

          // Mark as processed
          await supabase.from('processed_emails').insert({
            message_id: email.id,
            thread_id: email.threadId,
            classification: 'junk',
          });

          // Archive email
          await markEmailAsRead(email.id);
          await archiveEmail(email.id);

          results.junk_filtered++;
          console.log(`Filtered as junk: ${email.subject}`);
        } else {
          // Create ticket
          const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .insert({
              sender_email: email.from,
              sender_name: email.fromName,
              subject: email.subject,
              body: email.body,
              status: 'open',
              priority: triage.priority,
              category: triage.category,
              email_thread_id: email.threadId,
              email_message_id: email.id,
              attachments: email.attachments,
            })
            .select()
            .single();

          if (ticketError) {
            throw ticketError;
          }

          // Mark as processed
          await supabase.from('processed_emails').insert({
            message_id: email.id,
            thread_id: email.threadId,
            classification: 'support_request',
            ticket_id: ticket.id,
          });

          // Mark email as read
          await markEmailAsRead(email.id);

          results.tickets_created++;
          console.log(`Created ticket #${ticket.id.slice(0, 8)} for: ${email.subject}`);

          // Send auto-reply
          try {
            const html = generateTicketCreatedTemplate(
              ticket.id,
              email.subject,
              email.fromName || email.from,
              email.body
            );
            
            await sendEmail({
              to: email.from,
              cc: 'itsupport@cislagos.org', // CC IT support group for visibility
              subject: `[Request Received] #${ticket.id.slice(0, 8)} - ${email.subject}`,
              html,
            });
            console.log(`Sent auto-reply to ${email.from}`);
          } catch (emailError) {
            console.error('Error sending auto-reply:', emailError);
            // Don't fail the whole process if email sending fails
          }
        }

        results.processed++;
      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error);
        results.errors++;
        results.errorDetails.push({
          emailId: email.id,
          error: error instanceof Error ? error.message : JSON.stringify(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    console.log('Email processing complete:', results);

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined, // Add stack trace for debugging
      },
      { status: 500 }
    );
  }
}
