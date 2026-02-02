export function generateTicketCreatedTemplate(
  ticketId: string,
  subject: string,
  senderName: string,
  body: string
) {
  const shortTicketId = ticketId.slice(0, 8);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cis-support-pro.netlify.app';
  const ticketUrl = `${appUrl}/dashboard?ticket=${ticketId}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">CIS IT Support</h1>
                  <p style="margin: 8px 0 0 0; color: #dbeafe; font-size: 14px;">Ticket Confirmation</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; line-height: 1.6;">Hi <strong>${senderName}</strong>,</p>
                  
                  <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                    Thank you for contacting IT Support. We've received your request and our team will review it shortly. You'll receive updates as we work on resolving your issue.
                  </p>
                  
                  <!-- Ticket Info Card -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Your Ticket</p>
                        <h2 style="margin: 0 0 15px 0; color: #2563eb; font-size: 20px; font-weight: 700;">
                          #${shortTicketId}
                        </h2>
                        <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600; line-height: 1.4;">
                          ${subject}
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- CTA Button -->
                  <table role="presentation" style="width: 100%; margin-bottom: 30px;">
                    <tr>
                      <td align="center">
                        <a href="${ticketUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);">
                          View Ticket Details
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Original Message -->
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                    <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Message</p>
                    <div style="background-color: #f9fafb; padding: 16px; border-left: 4px solid #2563eb; border-radius: 4px;">
                      <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
                        ${body.replace(/\n/g, '<br>')}
                      </p>
                    </div>
                  </div>
                  
                  <!-- Help Text -->
                  <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    <strong>Need to add more details?</strong> Simply reply to this email and we'll add your message to the ticket.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: 600;">Best regards,</p>
                  <p style="margin: 0 0 20px 0; color: #2563eb; font-size: 14px; font-weight: 700;">CIS IT Support Team</p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                    This is an automated message. Please do not reply directly to this email address.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function generateTicketClosedTemplate(
  ticketId: string,
  subject: string,
  senderName: string,
  closedBy: string
) {
  const shortTicketId = ticketId.slice(0, 8);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cis-support-pro.netlify.app';
  const ticketUrl = `${appUrl}/dashboard?ticket=${ticketId}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">CIS IT Support</h1>
                  <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 14px;">Ticket Resolved</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; line-height: 1.6;">Hi <strong>${senderName}</strong>,</p>
                  
                  <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                    Great news! Your support ticket has been resolved and closed by our team. We hope your issue has been addressed to your satisfaction.
                  </p>
                  
                  <!-- Status Badge -->
                  <table role="presentation" style="width: 100%; margin-bottom: 30px;">
                    <tr>
                      <td align="center">
                        <div style="display: inline-block; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 2px solid #10b981; padding: 16px 24px; border-radius: 8px;">
                          <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                            ✓ Status: Resolved
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Ticket Info Card -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Ticket Details</p>
                        <h2 style="margin: 0 0 15px 0; color: #2563eb; font-size: 20px; font-weight: 700;">
                          #${shortTicketId}
                        </h2>
                        <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; font-weight: 600; line-height: 1.4;">
                          ${subject}
                        </p>
                        
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">
                              <strong>Reported by:</strong>
                            </td>
                            <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                              ${senderName}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                              <strong>Resolved by:</strong>
                            </td>
                            <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                              ${closedBy}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- CTA Button -->
                  <table role="presentation" style="width: 100%; margin-bottom: 30px;">
                    <tr>
                      <td align="center">
                        <a href="${ticketUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);">
                          View Ticket History
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Help Text -->
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-top: 30px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      <strong>Still need help?</strong> If your issue isn't fully resolved or you have additional questions, simply reply to this email to reopen the ticket.
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: 600;">Best regards,</p>
                  <p style="margin: 0 0 20px 0; color: #2563eb; font-size: 14px; font-weight: 700;">CIS IT Support Team</p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                    This is an automated message. Please do not reply directly to this email address.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function generateTicketAssignedTemplate(
  ticketId: string,
  subject: string,
  assignedTo: string,
  assignedBy: string,
  priority: string,
  category: string
) {
  const shortTicketId = ticketId.slice(0, 8);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cis-support-pro.netlify.app';
  const ticketUrl = `${appUrl}/dashboard?ticket=${ticketId}`;
  
  const priorityColors: Record<string, { bg: string; border: string; text: string }> = {
    low: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    medium: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    high: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
    urgent: { bg: '#fce7f3', border: '#ec4899', text: '#831843' }
  };
  
  const priorityColor = priorityColors[priority.toLowerCase()] || priorityColors.medium;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">CIS IT Support</h1>
                  <p style="margin: 8px 0 0 0; color: #ede9fe; font-size: 14px;">Ticket Assignment Notification</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; line-height: 1.6;">Hello IT Support Team,</p>
                  
                  <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                    A ticket has been assigned to <strong>${assignedTo}</strong> by <strong>${assignedBy}</strong>. This notification is being sent to <strong>cishelpdesk@cislagos.org</strong> for record keeping.
                  </p>
                  
                  <!-- Assignment Badge -->
                  <table role="presentation" style="width: 100%; margin-bottom: 30px;">
                    <tr>
                      <td align="center">
                        <div style="display: inline-block; background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border: 2px solid #8b5cf6; padding: 16px 24px; border-radius: 8px;">
                          <p style="margin: 0; color: #5b21b6; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                            📋 Ticket Assigned
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Ticket Info Card -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Ticket Details</p>
                        <h2 style="margin: 0 0 15px 0; color: #2563eb; font-size: 20px; font-weight: 700;">
                          #${shortTicketId}
                        </h2>
                        <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; font-weight: 600; line-height: 1.4;">
                          ${subject}
                        </p>
                        
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">
                              <strong>Assigned To:</strong>
                            </td>
                            <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                              ${assignedTo}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                              <strong>Assigned By:</strong>
                            </td>
                            <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                              ${assignedBy}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                              <strong>Category:</strong>
                            </td>
                            <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                              ${category}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                              <strong>Priority:</strong>
                            </td>
                            <td style="padding: 8px 0;">
                              <span style="display: inline-block; background-color: ${priorityColor.bg}; color: ${priorityColor.text}; border: 1px solid ${priorityColor.border}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
                                ${priority}
                              </span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- CTA Button -->
                  <table role="presentation" style="width: 100%; margin-bottom: 30px;">
                    <tr>
                      <td align="center">
                        <a href="${ticketUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);">
                          View Ticket in Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Info Note -->
                  <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin-top: 30px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                      <strong>Note:</strong> This is an automated notification sent to cishelpdesk@cislagos.org for tracking purposes. The assigned technician has also been notified.
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: 600;">Best regards,</p>
                  <p style="margin: 0 0 20px 0; color: #2563eb; font-size: 14px; font-weight: 700;">CIS IT Support System</p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                    This is an automated message from the CIS Support Pro Portal.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
