# Gmail Bot Account Setup - Complete Guide

## Quick Overview
Since you can't access Google Workspace API Controls, we'll use a **bot Gmail account** added to your itsupport@cislagos.org group.

---

## Step 1: Create Bot Gmail Account (2 min)

1. Go to <https://accounts.google.com/signup>
2. Create account (suggested: `cissupportbot@gmail.com`)
3. Save the credentials

---

## Step 2: Add Bot to Group (1 min)

1. Go to <https://admin.google.com>
2. Directory → Groups → `itsupport@cislagos.org`
3. Add member: your bot email
4. Role: Member

✅ Test: Send email to itsupport@cislagos.org - bot should receive it

---

## Step 3: Google Cloud Setup (5 min)

1. Go to <https://console.cloud.google.com>
2. **Sign in with bot account**
3. Create project: "CIS Support Pro"
4. Enable Gmail API
5. Go to Credentials → Create OAuth 2.0 Client ID
6. Application type: **Desktop app**
7. Name: "CIS Support Desktop"
8. Click Create
9. **Download JSON** (click download icon)

---

## Step 4: Get Refresh Token (3 min)

Run this command:

```bash
cd "c:\Users\new\Documents\IT SUPPORT"
node scripts/get-gmail-token.js
```

Follow the prompts:
1. Open the URL in your browser
2. Sign in with **bot account**
3. Copy the authorization code
4. Paste it in the terminal

The script will output your credentials for `.env.local`

---

## Step 5: Update .env.local

Add these lines (from script output):

```env
# Gmail Bot Account (OAuth2)
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
```

---

## Step 6: Test

```bash
npm run dev
```

Then trigger cron:

```bash
curl http://localhost:3000/api/cron/process-emails -H "Authorization: Bearer Kx9mP2vL8nQ4rT6wY1zB5cD7fG3hJ0kM"
```

Check dashboard for new tickets!

---

## Troubleshooting

**"Missing Gmail configuration"**
- Check all 3 env vars are set
- Restart dev server

**"Invalid grant"**
- Refresh token expired
- Re-run step 4 to get new token

**"No emails found"**
- Check bot is in the group
- Send test email to itsupport@cislagos.org
