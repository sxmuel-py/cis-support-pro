import { gmail_v1 } from 'googleapis';
import { createGmailClient, getGmailConfig } from './client';

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  subject: string;
  body: string;
  bodyHtml: string;
  date: Date;
  labels: string[];
  headers: Record<string, string>; // Add headers for filtering
  attachments: {
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }[];
}

export async function fetchUnreadEmails(): Promise<EmailMessage[]> {
  const config = getGmailConfig();
  const gmail = createGmailClient(config);

  try {
    // List unread messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread in:inbox',
      maxResults: 50,
    });

    const messages = response.data.messages || [];

    if (messages.length === 0) {
      return [];
    }

    // Fetch full message details
    const emailPromises = messages.map(async (message) => {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full',
      });

      return parseEmailMessage(fullMessage.data);
    });

    const emails = await Promise.all(emailPromises);
    return emails.filter((email): email is EmailMessage => email !== null);
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}

export async function markEmailAsRead(messageId: string): Promise<void> {
  const config = getGmailConfig();
  const gmail = createGmailClient(config);

  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
  } catch (error) {
    console.error('Error marking email as read:', error);
    throw error;
  }
}

export async function archiveEmail(messageId: string): Promise<void> {
  const config = getGmailConfig();
  const gmail = createGmailClient(config);

  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['INBOX'],
      },
    });
  } catch (error) {
    console.error('Error archiving email:', error);
    throw error;
  }
}

/**
 * Removes email signatures, disclaimers, and quoted replies from email body
 */
function cleanEmailBody(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Remove CIS email signature/disclaimer
  const cisSignaturePatterns = [
    /--[\s\S]*?CIS\s+is committed to safeguarding[\s\S]*/gi,
    /CIS\s+is committed to safeguarding[\s\S]*/gi,
    /This email and any attachments are sent in confidence[\s\S]*/gi,
    /\*\*Vision\*[\s\S]*/gi,
  ];

  cisSignaturePatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Remove common email signatures
  const signaturePatterns = [
    /--\s*$/gm, // Signature delimiter
    /^--\s*$/gm,
    /_{3,}/g, // Multiple underscores
    /Sent from my (iPhone|iPad|Android|Mobile)/gi,
    /Get Outlook for (iOS|Android)/gi,
  ];

  signaturePatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Remove quoted replies (lines starting with >)
  cleaned = cleaned.split('\n')
    .filter(line => !line.trim().startsWith('>'))
    .join('\n');

  // Remove excessive whitespace
  cleaned = cleaned
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .trim();

  return cleaned;
}

function parseEmailMessage(message: gmail_v1.Schema$Message): EmailMessage | null {
  if (!message.id || !message.threadId) {
    return null;
  }

  const headers = message.payload?.headers || [];
  const getHeader = (name: string) => 
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

  const from = getHeader('from');
  const subject = getHeader('subject');
  const date = getHeader('date');

  // Parse from field (e.g., "John Doe <john@example.com>")
  const fromMatch = from.match(/^(.*?)\s*<(.+?)>$/);
  const fromName = fromMatch ? fromMatch[1].trim().replace(/^["']|["']$/g, '') : from;
  const fromEmail = fromMatch ? fromMatch[2].trim() : from;

  // Extract body
  const { text, html } = extractBody(message.payload);

  // Extract attachments
  const attachments = extractAttachments(message.payload);

  // Build headers map for easy access
  const headersMap: Record<string, string> = {};
  headers.forEach((header) => {
    if (header.name && header.value) {
      headersMap[header.name.toLowerCase()] = header.value;
    }
  });

  return {
    id: message.id,
    threadId: message.threadId,
    from: fromEmail,
    fromName: fromName || fromEmail,
    subject: subject || '(No Subject)',
    body: cleanEmailBody(text), // Clean signatures and disclaimers
    bodyHtml: html,
    date: date ? new Date(date) : new Date(),
    labels: message.labelIds || [],
    headers: headersMap,
    attachments,
  };
}

function extractBody(payload: gmail_v1.Schema$MessagePart | undefined): { text: string; html: string } {
  let text = '';
  let html = '';

  if (!payload) {
    return { text, html };
  }

  // Check if this part has body data
  if (payload.body?.data) {
    const decoded = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    
    if (payload.mimeType === 'text/plain') {
      text = decoded;
    } else if (payload.mimeType === 'text/html') {
      html = decoded;
    }
  }

  // Recursively check parts
  if (payload.parts) {
    for (const part of payload.parts) {
      const { text: partText, html: partHtml } = extractBody(part);
      if (partText) text = partText;
      if (partHtml) html = partHtml;
    }
  }

  return { text, html };
}

function extractAttachments(payload: gmail_v1.Schema$MessagePart | undefined): EmailMessage['attachments'] {
  const attachments: EmailMessage['attachments'] = [];

  if (!payload) {
    return attachments;
  }

  // Check if this part is an attachment
  if (payload.filename && payload.body?.attachmentId) {
    attachments.push({
      filename: payload.filename,
      mimeType: payload.mimeType || 'application/octet-stream',
      size: payload.body.size || 0,
      attachmentId: payload.body.attachmentId,
    });
  }

  // Recursively check parts
  if (payload.parts) {
    for (const part of payload.parts) {
      attachments.push(...extractAttachments(part));
    }
  }

  return attachments;
}
