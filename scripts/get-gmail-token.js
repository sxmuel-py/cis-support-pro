/**
 * Gmail OAuth2 Token Generator
 * 
 * This script helps you get a refresh token for your bot Gmail account.
 * Run this ONCE to authorize the bot.
 */

const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

console.log('\n===========================================');
console.log('Gmail Bot OAuth2 Setup');
console.log('===========================================\n');

// Check if credentials file exists
const credentialsPath = path.join(__dirname, '..', 'gmail-credentials.json');

if (!fs.existsSync(credentialsPath)) {
  console.log('❌ ERROR: gmail-credentials.json not found!\n');
  console.log('Please:');
  console.log('1. Download OAuth2 credentials from Google Cloud Console');
  console.log('2. Save as: gmail-credentials.json');
  console.log('3. Place in: c:\\Users\\new\\Documents\\IT SUPPORT\\');
  console.log('\nThen run this script again.\n');
  process.exit(1);
}

// Load credentials
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
const { client_id, client_secret } = credentials.installed || credentials.web;

if (!client_id || !client_secret) {
  console.log('❌ ERROR: Invalid credentials file format!\n');
  process.exit(1);
}

const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
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
  prompt: 'consent', // Force to get refresh token
});

console.log('STEP 1: Authorize the bot Gmail account\n');
console.log('Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n');
console.log('STEP 2: Sign in with your BOT Gmail account');
console.log('(e.g., cissupportbot@gmail.com)\n');
console.log('STEP 3: Copy the authorization code\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Paste the authorization code here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      console.log('\n❌ ERROR: No refresh token received!');
      console.log('This might happen if you already authorized this app before.');
      console.log('Try revoking access at: https://myaccount.google.com/permissions');
      console.log('Then run this script again.\n');
      rl.close();
      return;
    }
    
    console.log('\n===========================================');
    console.log('✅ SUCCESS! Add these to .env.local:');
    console.log('===========================================\n');
    console.log('# Gmail Bot Account (OAuth2)');
    console.log(`GMAIL_CLIENT_ID=${client_id}`);
    console.log(`GMAIL_CLIENT_SECRET=${client_secret}`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\n===========================================');
    console.log('\nNext steps:');
    console.log('1. Copy the above lines to .env.local');
    console.log('2. Restart your dev server: npm run dev');
    console.log('3. Test the integration!\n');
    
  } catch (error) {
    console.error('\n❌ Error getting tokens:', error.message);
  }
  
  rl.close();
});
