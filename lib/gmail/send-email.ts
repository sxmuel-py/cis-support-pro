import { google } from 'googleapis';
import { getGmailConfig, createGmailClient } from './client';

interface SendEmailParams {
  to: string;
  cc?: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, cc, subject, html }: SendEmailParams) {
  try {
    const config = getGmailConfig();
    const gmail = createGmailClient(config);

    // Create the email message
    // Headers must be properly formatted
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `To: ${to}`,
      cc ? `Cc: ${cc}` : null,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      html,
    ].filter(part => part !== null);

    const message = messageParts.join('\n');

    // Encode the message to Base64URL (RFC 4648)
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(`Email sent to ${to}: ${subject}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw logic errors, just log them so we don't break the calling flow
    return { success: false, error };
  }
}
