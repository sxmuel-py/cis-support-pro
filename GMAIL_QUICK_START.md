# Gmail Integration - Quick Reference Guide

## Current Status
✅ Code is fully implemented
✅ Environment template added to `.env.local`
⏳ Waiting for you to complete Google Cloud setup

---

## What You Need to Do

### 1. Google Cloud Console (https://console.cloud.google.com)
- [ ] Create/select project
- [ ] Enable Gmail API
- [ ] Create service account: `cis-support-gmail-service`
- [ ] Download JSON key file
- [ ] Enable domain-wide delegation
- [ ] Copy Client ID

### 2. Google Workspace Admin (https://admin.google.com)
- [ ] Go to Security → API Controls → Domain-wide Delegation
- [ ] Add Client ID
- [ ] Add scopes: `https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.modify`

### 3. Update .env.local
Open: `c:\Users\new\Documents\IT SUPPORT\.env.local`

Replace these 3 values:

```env
# From JSON file "client_email"
GOOGLE_SERVICE_ACCOUNT_EMAIL=cis-support-gmail-service@your-project-123456.iam.gserviceaccount.com

# From JSON file "private_key" (keep the \n characters!)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Use this or generate your own
CRON_SECRET=Kx9mP2vL8nQ4rT6wY1zB5cD7fG3hJ0kM
```

### 4. Restart Dev Server
```bash
npm run dev
```

---

## Testing After Setup

### Test 1: Check Configuration
```bash
# Trigger the cron job manually
curl http://localhost:3000/api/cron/process-emails -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Look for:
- ✅ "Fetching unread emails..."
- ✅ "Found X unread emails"
- ❌ No authentication errors

### Test 2: Send Support Email
1. Send email to: `itsupport@cislagos.org`
2. Subject: `Test - My laptop won't turn on`
3. Body: `Hi, I need help. My laptop is not starting.`
4. Wait 30 seconds
5. Trigger cron job (see Test 1)
6. Check dashboard → should see new ticket with:
   - Priority: `high` (keyword: "won't")
   - Category: `hardware` (keyword: "laptop")
   - Status: `open`

### Test 3: Send Junk Email
1. Send email to: `itsupport@cislagos.org`
2. Subject: `Special Promotion - Buy Now!`
3. Body: `Click here for limited time offer. Unsubscribe here.`
4. Trigger cron job
5. Check Supabase → `trash` table → should see this email
6. Check dashboard → should NOT create a ticket

---

## Troubleshooting

### "Error: Missing Gmail configuration"
- Check that all 3 env vars are set in `.env.local`
- Restart dev server after adding env vars

### "Error: Unauthorized" or "Error: Permission denied"
- Wait 10 minutes after setting up domain-wide delegation
- Verify OAuth scopes are exactly as specified
- Check that service account has domain-wide delegation enabled

### "No emails fetched"
- Verify there are unread emails in itsupport@cislagos.org
- Check Gmail API is enabled in Google Cloud Console
- Try sending a fresh test email

---

## How It Works

1. **Cron job runs every 5 minutes** (in production on Vercel)
2. **Fetches unread emails** from itsupport@cislagos.org
3. **Triages each email** using keyword detection:
   - **Junk**: "unsubscribe", "marketing", "promotion", "buy now"
   - **Urgent**: "urgent", "critical", "emergency", "down"
   - **High**: "broken", "error", "failed", "cannot"
   - **Categories**: hardware, software, network, access, email
4. **Creates ticket** or **moves to trash**
5. **Marks email as read** to prevent duplicates

---

## Next Steps After Setup

Once you've completed the setup and testing works:

1. **Deploy to Vercel** (cron will run automatically every 5 minutes)
2. **Monitor the trash table** to see what's being filtered
3. **Adjust keywords** if needed (in `lib/triage/llm-triage.ts`)
4. **Optional**: Add OpenAI API key later for smarter triage

---

## Need Help?

- Full setup guide: `GMAIL_SETUP.md`
- Triage logic: `lib/triage/llm-triage.ts`
- Cron job: `app/api/cron/process-emails/route.ts`
