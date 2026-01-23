/**
 * Gmail OAuth2 Setup Script
 * 
 * This script helps you get a refresh token for Gmail API access.
 * Run this ONCE to authorize your bot Gmail account.
 */

const { google } = require('googleapis');
const readline = require('readline');

// STEP 1: Download OAuth2 credentials from Google Cloud Console
// STEP 2: Copy client_id and client_secret from the JSON file
// STEP 3: Paste them below:

const CLIENT_ID = 'YOUR_CLIENT_ID_HERE';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET_HERE';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
];

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('\n===========================================');
console.log('Gmail OAuth2 Setup');
console.log('===========================================\n');
console.log('1. Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n2. Sign in with your bot Gmail account');
console.log('3. Copy the authorization code\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the authorization code: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n===========================================');
    console.log('✅ SUCCESS! Add these to your .env.local:');
    console.log('===========================================\n');
    console.log(`GMAIL_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GMAIL_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\n===========================================\n');
    
  } catch (error) {
    console.error('Error getting tokens:', error);
  }
  
  rl.close();
});
