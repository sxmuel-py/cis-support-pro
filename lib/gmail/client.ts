import { google } from 'googleapis';

export interface GmailConfig {
  serviceAccountEmail?: string;
  privateKey?: string;
  userEmail?: string; // The email to impersonate (itsupport@cislagos.org)
  // OAuth2 credentials (for personal Gmail bot account)
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

export function createGmailClient(config: GmailConfig) {
  // Check if using OAuth2 (personal Gmail) or Service Account (Workspace)
  if (config.clientId && config.clientSecret && config.refreshToken) {
    // OAuth2 method (for personal Gmail bot account)
    const oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );

    oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    return gmail;
  } else if (config.serviceAccountEmail && config.privateKey && config.userEmail) {
    // Service Account method (for Workspace with domain-wide delegation)
    const auth = new google.auth.JWT({
      email: config.serviceAccountEmail,
      key: config.privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
      ],
      subject: config.userEmail, // Impersonate this user
    });

    const gmail = google.gmail({ version: 'v1', auth });
    return gmail;
  } else {
    throw new Error(
      'Invalid Gmail configuration. Please provide either OAuth2 credentials (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN) or Service Account credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GMAIL_INBOX_EMAIL)'
    );
  }
}

export function getGmailConfig(): GmailConfig {
  // Try OAuth2 first (personal Gmail bot account)
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    console.log('Using OAuth2 authentication (personal Gmail bot account)');
    return {
      clientId,
      clientSecret,
      refreshToken,
    };
  }

  // Fall back to Service Account (Workspace)
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const userEmail = process.env.GMAIL_INBOX_EMAIL;

  if (serviceAccountEmail && privateKey && userEmail) {
    console.log('Using Service Account authentication (Google Workspace)');
    return {
      serviceAccountEmail,
      privateKey,
      userEmail,
    };
  }

  throw new Error(
    'Missing Gmail configuration. Please set either:\n' +
    '1. OAuth2 (for personal Gmail): GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN\n' +
    '2. Service Account (for Workspace): GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GMAIL_INBOX_EMAIL'
  );
}

