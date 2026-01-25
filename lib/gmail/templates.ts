export function generateTicketCreatedTemplate(
  ticketId: string,
  subject: string,
  senderName: string,
  body: string
) {
  const shortTicketId = ticketId.slice(0, 8);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cis-pro-support.netlify.app';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 2px solid #e9ecef;">
        <h2 style="color: #333; margin: 0;">IT Support Team</h2>
      </div>
      
      <div style="padding: 20px; color: #333; line-height: 1.6;">
        <p>Hi <strong>${senderName}</strong>,</p>
        
        <p>The IT team has received your request and will get back to you. Meanwhile, you can reply to this email if you have any additional questions or details.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Ticket Status</a>
        </div>

        <p>Sincerely,<br>
        <strong>IT Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #666; font-size: 14px;">You opened a new ticket:</p>
        <h3 style="color: #2563eb; margin-top: 5px;">#${shortTicketId} ${subject}</h3>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; font-size: 14px; color: #555; margin-top: 15px;">
          <strong>${senderName} wrote:</strong><br><br>
          ${body.replace(/\n/g, '<br>')}
        </div>
      </div>
    </div>
  `;
}

export function generateTicketClosedTemplate(
  ticketId: string,
  subject: string,
  senderName: string,
  closedBy: string
) {
  const shortTicketId = ticketId.slice(0, 8);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cis-pro-support.netlify.app';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 2px solid #e9ecef;">
        <h2 style="color: #333; margin: 0;">IT Support Team</h2>
      </div>
      
      <div style="padding: 20px; color: #333; line-height: 1.6;">
        <p>Hi <strong>${senderName}</strong>,</p>
        
        <p>The IT team has received your request and will get back to you. Meanwhile, you can reply to this email if you have any additional questions or details.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Ticket Dashboard</a>
        </div>
        
        <p>Sincerely,<br>
        <strong>IT Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #666; font-size: 14px;"><strong>${closedBy}</strong> closed your ticket.</p>
        <h3 style="color: #2563eb; margin-top: 5px;">#${shortTicketId} ${subject}</h3>
        
        <div style="background-color: #f0fdf4; padding: 15px; border: 1px solid #bbf7d0; border-radius: 5px; color: #166534; margin-top: 15px;">
          <strong>Status changed from Open &rarr; Closed</strong>
        </div>

         <div style="margin-top: 20px; font-size: 14px; color: #666;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; width: 100px;"><strong>Creator:</strong></td>
              <td>${senderName}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Assignee:</strong></td>
              <td>${closedBy}</td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `;
}
